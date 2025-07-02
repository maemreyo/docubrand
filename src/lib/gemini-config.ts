// CREATED: 2025-07-03 - Gemini configuration and setup utilities

import { GeminiConfig } from '@/types/gemini';
import { GeminiService } from './gemini-service';

/**
 * Gemini API configuration manager
 */
export class GeminiConfigManager {
  private static instance: GeminiService | null = null;

  /**
   * Get Gemini configuration from environment variables
   */
  static getConfigFromEnv(): GeminiConfig {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is required. Please add it to your .env.local file.\n' +
        'Get your API key from: https://ai.google.dev/aistudio'
      );
    }

    return {
      apiKey,
      model: (process.env.GEMINI_MODEL as any) || 'gemini-2.0-flash',
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192'),
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.1')
    };
  }

  /**
   * Create and configure Gemini service instance
   */
  static async createService(config?: Partial<GeminiConfig>): Promise<GeminiService> {
    try {
      const envConfig = this.getConfigFromEnv();
      const finalConfig = { ...envConfig, ...config };
      
      const service = new GeminiService(finalConfig);
      
      // Test connection on creation
      const connectionTest = await service.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Gemini API connection failed: ${connectionTest.error}`);
      }

      console.log('✅ Gemini API connected successfully');
      this.instance = service;
      
      return service;
    } catch (error) {
      console.error('❌ Failed to create Gemini service:', error);
      throw error;
    }
  }

  /**
   * Get cached service instance or create new one
   */
  static async getService(config?: Partial<GeminiConfig>): Promise<GeminiService> {
    if (!this.instance) {
      this.instance = await this.createService(config);
    }
    return this.instance;
  }

  /**
   * Reset service instance (useful for testing or config changes)
   */
  static resetService(): void {
    this.instance = null;
  }

  /**
   * Validate environment configuration
   */
  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required API key
    if (!process.env.GEMINI_API_KEY) {
      errors.push('GEMINI_API_KEY is missing from environment variables');
    }

    // Validate API key format (basic check)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !apiKey.startsWith('AI')) {
      errors.push('GEMINI_API_KEY appears to have invalid format (should start with "AI")');
    }

    // Validate model name
    const model = process.env.GEMINI_MODEL;
    const validModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    if (model && !validModels.includes(model)) {
      errors.push(`Invalid GEMINI_MODEL: ${model}. Valid options: ${validModels.join(', ')}`);
    }

    // Validate numeric values
    const maxTokens = process.env.GEMINI_MAX_TOKENS;
    if (maxTokens && (isNaN(parseInt(maxTokens)) || parseInt(maxTokens) <= 0)) {
      errors.push('GEMINI_MAX_TOKENS must be a positive number');
    }

    const temperature = process.env.GEMINI_TEMPERATURE;
    if (temperature) {
      const temp = parseFloat(temperature);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        errors.push('GEMINI_TEMPERATURE must be a number between 0 and 2');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get setup instructions for users
   */
  static getSetupInstructions(): string {
    return `
🔧 Gemini API Setup Instructions:

1. Get your API key:
   - Visit: https://ai.google.dev/aistudio
   - Click "Get API key"
   - Create new key or use existing project

2. Configure environment:
   - Copy .env.local.example to .env.local
   - Add your API key: GEMINI_API_KEY=your_key_here

3. Optional configuration:
   - GEMINI_MODEL: Choose model (default: gemini-2.0-flash)
   - GEMINI_MAX_TOKENS: Max response tokens (default: 8192)
   - GEMINI_TEMPERATURE: Response creativity (default: 0.1)

4. Test your setup:
   - Restart your development server
   - Upload a test PDF to verify connection

📋 Pricing (Free Tier):
   - 1,500 requests per day
   - Up to 20MB PDF files
   - Structured JSON responses included

🔒 Security Notes:
   - Never commit .env.local to version control
   - API key is for server-side use only
   - Consider rate limiting for production use
`;
  }
}

/**
 * Development utilities for testing and debugging
 */
export class GeminiDevUtils {
  /**
   * Create mock Gemini service for testing
   */
  static createMockService(): GeminiService {
    const mockConfig: GeminiConfig = {
      apiKey: 'mock-api-key',
      model: 'gemini-2.0-flash',
      maxTokens: 8192,
      temperature: 0.1
    };

    // Override the API call method for testing
    const service = new GeminiService(mockConfig);
    
    // Mock the private callGeminiAPI method
    (service as any).callGeminiAPI = async () => ({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              success: true,
              documentStructure: {
                title: "Mock Document",
                subject: "Test Subject",
                sections: [],
                metadata: {
                  totalPages: 1,
                  language: "en",
                  documentType: "quiz",
                  extractionConfidence: 0.95,
                  questionsCount: 0,
                  sectionsCount: 0
                }
              },
              extractedQuestions: [],
              extractedContent: {
                title: "Mock Document",
                rawText: "Mock content"
              },
              processingInfo: {
                model: "gemini-2.0-flash",
                confidence: 0.95
              }
            })
          }],
          role: "model"
        },
        finishReason: "STOP",
        index: 0,
        safetyRatings: []
      }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 200,
        totalTokenCount: 300
      }
    });

    return service;
  }

  /**
   * Log current configuration for debugging
   */
  static logCurrentConfig(): void {
    console.log('🔍 Current Gemini Configuration:');
    
    try {
      const config = GeminiConfigManager.getConfigFromEnv();
      console.log('  ✅ API Key:', config.apiKey.substring(0, 10) + '...');
      console.log('  ✅ Model:', config.model);
      console.log('  ✅ Max Tokens:', config.maxTokens);
      console.log('  ✅ Temperature:', config.temperature);
    } catch (error) {
      console.log('  ❌ Configuration Error:', error instanceof Error ? error.message : 'Unknown');
    }

    const validation = GeminiConfigManager.validateEnvironment();
    if (!validation.valid) {
      console.log('  ⚠️  Environment Issues:');
      validation.errors.forEach(error => console.log(`     - ${error}`));
    }
  }
}