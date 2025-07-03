// CREATED: 2025-07-03 - Robust API client with error handling and retries

import { GeminiService, GeminiConfig } from './gemini-service';
import { 
  GeminiAnalysisRequest, 
  GeminiAnalysisResponse, 
  ProcessingResult,
  AnalysisError,
  AnalysisStatus 
} from '@/types/gemini';

/**
 * Gemini client configuration
 */
interface GeminiClientConfig extends Partial<GeminiConfig> {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  rateLimitDelay?: number;
  enableFallback?: boolean;
}

/**
 * Request context for tracking
 */
interface RequestContext {
  id: string;
  timestamp: number;
  attempt: number;
  maxAttempts: number;
}

/**
 * Robust Gemini API client with error handling, retries, and rate limiting
 */
export class GeminiClient {
  private service: GeminiService | null = null;
  private config: GeminiClientConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private consecutiveErrors = 0;
  private statusCallbacks: Map<string, (status: AnalysisStatus) => void> = new Map();

  constructor(config: GeminiClientConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000, // 1 second base delay
      timeout: 60000, // 60 seconds
      rateLimitDelay: 1000, // 1 second between requests
      enableFallback: true,
      ...config
    };
  }

  /**
   * Initialize the Gemini service
   */
  async initialize(): Promise<void> {
    try {
      const { GeminiConfigManager } = await import('./gemini-config');
      this.service = await GeminiConfigManager.getService(this.config);
      console.log('✅ Gemini client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini client:', error);
      throw new Error(`Gemini initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze PDF with comprehensive error handling and progress tracking
   */
  async analyzePDF(
    request: GeminiAnalysisRequest,
    onProgress?: (status: AnalysisStatus) => void
  ): Promise<ProcessingResult> {
    const requestId = this.generateRequestId();
    
    if (onProgress) {
      this.statusCallbacks.set(requestId, onProgress);
    }

    try {
      // Ensure service is initialized
      if (!this.service) {
        await this.initialize();
      }

      // Update status: starting
      this.updateStatus(requestId, {
        status: 'processing',
        progress: 0,
        currentStep: 'Initializing analysis...'
      });

      // Validate request
      await this.validateRequest(request);
      
      // Update status: validated
      this.updateStatus(requestId, {
        status: 'processing',
        progress: 10,
        currentStep: 'Request validated, preparing analysis...'
      });

      // Rate limiting
      await this.enforceRateLimit();

      // Update status: analyzing
      this.updateStatus(requestId, {
        status: 'analyzing',
        progress: 20,
        currentStep: 'Sending document to AI for analysis...'
      });

      // Execute analysis with retries
      const result = await this.executeWithRetries(
        () => this.service!.analyzePDF(request),
        requestId,
        request
      );

      // Update status: complete
      this.updateStatus(requestId, {
        status: 'complete',
        progress: 100,
        currentStep: 'Analysis completed successfully'
      });

      // Reset error counter on success
      this.consecutiveErrors = 0;

      console.log('✅ PDF analysis completed successfully');
      return result;

    } catch (error) {
      this.consecutiveErrors++;
      
      const analysisError: AnalysisError = this.createAnalysisError(error, request);
      
      this.updateStatus(requestId, {
        status: 'error',
        progress: 0,
        error: analysisError,
        currentStep: 'Analysis failed'
      });

      console.error('❌ PDF analysis failed:', error);

      // Return fallback response if enabled
      if (this.config.enableFallback) {
        const { createFallbackResponse } = await import('./gemini-validators');
        return {
          ...createFallbackResponse(request),
          success: false,
          processingTime: 0,
          warnings: ['Analysis failed, using fallback response'],
          errors: [analysisError]
        };
      }

      throw error;

    } finally {
      this.statusCallbacks.delete(requestId);
    }
  }

  /**
   * Test connection with detailed diagnostics
   */
  async testConnection(): Promise<{
    success: boolean;
    diagnostics: Record<string, any>;
    error?: string;
  }> {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      clientConfig: {
        maxRetries: this.config.maxRetries,
        timeout: this.config.timeout,
        rateLimitDelay: this.config.rateLimitDelay
      }
    };

    try {
      // Initialize if needed
      if (!this.service) {
        diagnostics.initialization = 'Initializing service...';
        await this.initialize();
        diagnostics.initialization = 'Success';
      }

      // Test basic connection
      diagnostics.connectionTest = 'Testing API connection...';
      const connectionResult = await this.service!.testConnection();
      diagnostics.connectionTest = connectionResult;

      // Test model info
      diagnostics.modelInfo = this.service!.getModelInfo();

      // Success
      return {
        success: connectionResult.success,
        diagnostics
      };

    } catch (error) {
      diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        diagnostics,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Get client health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const details = {
      serviceInitialized: !!this.service,
      consecutiveErrors: this.consecutiveErrors,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      lastRequestTime: this.lastRequestTime,
      timeSinceLastRequest: this.lastRequestTime ? Date.now() - this.lastRequestTime : null
    };

    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (!this.service) {
      status = 'unhealthy';
    } else if (this.consecutiveErrors >= 3) {
      status = 'unhealthy';
    } else if (this.consecutiveErrors > 0 || this.requestQueue.length > 5) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return { status, details };
  }

  /**
   * Clear error state and reset client
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting Gemini client...');
    
    this.consecutiveErrors = 0;
    this.requestQueue = [];
    this.isProcessing = false;
    this.statusCallbacks.clear();
    
    // Reinitialize service
    try {
      await this.initialize();
      console.log('✅ Gemini client reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset Gemini client:', error);
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetries<T>(
    operation: () => Promise<T>,
    requestId: string,
    request: GeminiAnalysisRequest
  ): Promise<T> {
    const context: RequestContext = {
      id: requestId,
      timestamp: Date.now(),
      attempt: 0,
      maxAttempts: this.config.maxRetries || 3
    };

    let lastError: any;

    for (context.attempt = 1; context.attempt <= context.maxAttempts; context.attempt++) {
      try {
        this.updateStatus(requestId, {
          status: 'analyzing',
          progress: 20 + (context.attempt - 1) * 20,
          currentStep: `Analysis attempt ${context.attempt}/${context.maxAttempts}...`
        });

        // Add timeout wrapper
        const result = await this.withTimeout(operation(), this.config.timeout || 60000);
        
        console.log(`✅ Request ${requestId} succeeded on attempt ${context.attempt}`);
        return result;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Request ${requestId} attempt ${context.attempt} failed:`, error);

        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          console.log(`🚫 Not retrying request ${requestId} due to error type`);
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (context.attempt < context.maxAttempts) {
          const delay = this.calculateRetryDelay(context.attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          
          this.updateStatus(requestId, {
            status: 'processing',
            progress: 20 + (context.attempt - 1) * 20,
            currentStep: `Waiting ${Math.round(delay/1000)}s before retry...`
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Request failed after ${context.maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Validate analysis request
   */
  private async validateRequest(request: GeminiAnalysisRequest): Promise<void> {
    if (!request.pdfBase64) {
      throw new Error('PDF data is required');
    }

    if (!request.pdfBase64.startsWith('data:application/pdf;base64,')) {
      throw new Error('Invalid PDF data format');
    }

    // Check file size (approximate)
    const sizeInBytes = (request.pdfBase64.length * 3) / 4;
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (sizeInBytes > maxSize) {
      throw new Error(`PDF file too large: ${Math.round(sizeInBytes / 1024 / 1024)}MB (max: 20MB)`);
    }

    console.log(`📋 Request validated - PDF size: ${Math.round(sizeInBytes / 1024)}KB`);
  }

  /**
   * Enforce rate limiting between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const minDelay = this.config.rateLimitDelay || 1000;

    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay || 1000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    if (!error || typeof error !== 'object') return false;

    const message = error.message || '';
    const nonRetryableErrors = [
      'API_KEY',
      'PERMISSION',
      'QUOTA_EXCEEDED',
      'INVALID_REQUEST',
      'FILE_TOO_LARGE',
      'UNSUPPORTED_FORMAT'
    ];

    return nonRetryableErrors.some(errorType => 
      message.toUpperCase().includes(errorType)
    );
  }

  /**
   * Add timeout to operation
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Create standardized analysis error
   */
  private createAnalysisError(error: any, request: GeminiAnalysisRequest): AnalysisError {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    let code = 'ANALYSIS_FAILED';
    let recoverable = true;
    let suggestions: string[] = [
      'Check your internet connection',
      'Verify the PDF file is valid and readable',
      'Try again in a few moments'
    ];

    // Categorize error types
    if (message.includes('API_KEY')) {
      code = 'INVALID_API_KEY';
      recoverable = false;
      suggestions = [
        'Check your Gemini API key configuration',
        'Verify the API key is valid and active',
        'Ensure proper environment variable setup'
      ];
    } else if (message.includes('QUOTA')) {
      code = 'QUOTA_EXCEEDED';
      recoverable = false;
      suggestions = [
        'You have exceeded your API quota',
        'Wait until quota resets or upgrade plan',
        'Check your API usage in Google AI Studio'
      ];
    } else if (message.includes('timeout')) {
      code = 'TIMEOUT';
      suggestions = [
        'Try with a smaller PDF file',
        'Check your internet connection speed',
        'Retry the operation'
      ];
    } else if (message.includes('too large')) {
      code = 'FILE_TOO_LARGE';
      recoverable = false;
      suggestions = [
        'Reduce PDF file size to under 20MB',
        'Split large documents into smaller parts',
        'Compress or optimize the PDF file'
      ];
    }

    return {
      code,
      message,
      details: {
        documentType: request.documentType,
        consecutiveErrors: this.consecutiveErrors,
        timestamp: Date.now()
      },
      recoverable,
      suggestions
    };
  }

  /**
   * Update analysis status
   */
  private updateStatus(requestId: string, status: Partial<AnalysisStatus>): void {
    const callback = this.statusCallbacks.get(requestId);
    if (callback) {
      callback({
        status: 'processing',
        progress: 0,
        ...status
      } as AnalysisStatus);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client statistics
   */
  getStatistics(): Record<string, any> {
    return {
      consecutiveErrors: this.consecutiveErrors,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      lastRequestTime: this.lastRequestTime,
      activeCallbacks: this.statusCallbacks.size,
      config: {
        maxRetries: this.config.maxRetries,
        timeout: this.config.timeout,
        rateLimitDelay: this.config.rateLimitDelay,
        enableFallback: this.config.enableFallback
      }
    };
  }
}

/**
 * Singleton Gemini client instance
 */
let geminiClientInstance: GeminiClient | null = null;

/**
 * Get singleton Gemini client instance
 */
export async function getGeminiClient(config?: GeminiClientConfig): Promise<GeminiClient> {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiClient(config);
    await geminiClientInstance.initialize();
  }
  return geminiClientInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetGeminiClient(): void {
  geminiClientInstance = null;
}