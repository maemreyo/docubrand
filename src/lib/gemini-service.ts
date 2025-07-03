// UPDATED: 2025-07-03 - Enhanced with multimodal PDF processing capabilities

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { 
  GeminiAnalysisRequest, 
  GeminiAnalysisResponse, 
  AnalysisError, 
  ProcessingResult,
  DEFAULT_ANALYSIS_OPTIONS 
} from '@/types/gemini';
import { getPromptTemplate, validatePromptInputs } from './prompt-templates';
import { validateGeminiResponse, sanitizeGeminiResponse } from './gemini-validators';

/**
 * Enhanced Gemini service with multimodal PDF processing
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    
    // Initialize the model with safety settings
    this.model = this.genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        temperature: config.temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: config.maxTokens,
        responseMimeType: 'application/json'
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  /**
   * Analyze PDF document with AI
   */
  async analyzePDF(request: GeminiAnalysisRequest): Promise<ProcessingResult> {
    const startTime = Date.now();
    let warnings: string[] = [];
    let errors: AnalysisError[] = [];

    try {
      console.log('🤖 Starting Gemini PDF analysis...');
      
      // Validate request
      const validationResult = this.validateRequest(request);
      if (!validationResult.valid) {
        throw new Error(`Invalid request: ${validationResult.errors.join(', ')}`);
      }

      // Prepare the analysis
      const promptData = await this.prepareAnalysisPrompt(request);
      const pdfData = await this.preparePDFData(request.pdfBase64);

      // Call Gemini API
      console.log('📡 Calling Gemini API for PDF analysis...');
      const apiResponse = await this.callGeminiAPI(promptData.prompt, pdfData);

      // Process and validate response
      const processedResponse = await this.processAPIResponse(apiResponse, request);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      console.log(`✅ PDF analysis completed in ${processingTime}ms`);

      return {
        ...processedResponse,
        success: true,
        processingTime,
        warnings,
        errors,
        processingInfo: {
          timestamp: Date.now(),
          version: '1.0.0',
          model: this.config.model,
          processingTime,
          confidence: processedResponse.documentStructure.confidence,
          tokenCount: apiResponse.usageMetadata?.totalTokenCount || 0,
          apiCalls: 1,
          retries: 0
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Gemini PDF analysis failed:', error);

      const analysisError: AnalysisError = {
        code: 'ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown analysis error',
        details: { 
          request: { documentType: request.documentType },
          processingTime 
        },
        recoverable: true,
        suggestions: [
          'Check PDF file format and size',
          'Verify Gemini API key and quota',
          'Try with a simpler document',
          'Check network connectivity'
        ]
      };

      return {
        success: false,
        processingTime,
        warnings,
        errors: [analysisError],
        // Provide fallback empty response
        extractedQuestions: [],
        documentStructure: {
          type: request.documentType || 'general',
          subject: 'Unknown',
          confidence: 0,
          sections: []
        },
        extractedContent: {
          title: 'Analysis Failed',
          subtitle: 'Could not process document'
        }
      };
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; model?: string }> {
    try {
      console.log('🔍 Testing Gemini API connection...');
      
      const testPrompt = "Please respond with exactly: 'Connection test successful'";
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();

      const success = text.includes('Connection test successful');
      
      if (success) {
        console.log('✅ Gemini API connection successful');
        return { success: true, model: this.config.model };
      } else {
        console.warn('⚠️ Unexpected response from Gemini API:', text);
        return { 
          success: false, 
          error: 'Unexpected response format',
          model: this.config.model 
        };
      }

    } catch (error) {
      console.error('❌ Gemini API connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        model: this.config.model
      };
    }
  }

  /**
   * Get model information and capabilities
   */
  getModelInfo() {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      capabilities: [
        'PDF document analysis',
        'Multimodal content understanding',
        'Structured JSON responses',
        'Educational content extraction',
        'Question generation',
        'Content classification',
        'Multiple language support'
      ]
    };
  }

  /**
   * Validate analysis request
   */
  private validateRequest(request: GeminiAnalysisRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check PDF data
    if (!request.pdfBase64) {
      errors.push('PDF data is required');
    } else if (!request.pdfBase64.startsWith('data:application/pdf;base64,')) {
      errors.push('Invalid PDF data format: missing data URI scheme');
    } else {
      const base64Data = request.pdfBase64.substring('data:application/pdf;base64,'.length);
      if (!/^[A-Za-z0-9+/=]+$/.test(base64Data) || base64Data.length % 4 !== 0) {
        errors.push('Invalid PDF data format: invalid base64 content');
      }
    }

    // Check document type
    const validTypes = ['quiz', 'worksheet', 'exam', 'assignment', 'handout', 'general'];
    if (request.documentType && !validTypes.includes(request.documentType)) {
      errors.push(`Invalid document type: ${request.documentType}`);
    }

    // Check file size (approximate)
    if (request.pdfBase64) {
      const sizeInBytes = (request.pdfBase64.length * 3) / 4;
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (sizeInBytes > maxSize) {
        errors.push(`PDF file too large: ${Math.round(sizeInBytes / 1024 / 1024)}MB (max: 20MB)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Prepare analysis prompt
   */
  private async prepareAnalysisPrompt(request: GeminiAnalysisRequest): Promise<{ prompt: string; metadata: any }> {
    const options = {
      ...DEFAULT_ANALYSIS_OPTIONS,
      ...request.analysisOptions
    };

    const promptInput = {
      documentType: request.documentType || 'general',
      language: request.userContext?.language || 'en',
      detailLevel: request.userContext?.preferences?.detailLevel || 'standard',
      focusAreas: request.userContext?.preferences?.focusAreas || ['content', 'questions'],
      extractQuestions: options.extractQuestions,
      extractSections: options.extractSections,
      extractMetadata: options.extractMetadata,
      questionTypes: options.questionTypes,
      contentTypes: options.contentTypes
    };

    // Validate prompt inputs
    const validation = validatePromptInputs(promptInput);
    if (!validation.valid) {
      throw new Error(`Invalid prompt inputs: ${validation.errors.join(', ')}`);
    }

    const prompt = getPromptTemplate(promptInput);

    return {
      prompt,
      metadata: {
        options,
        promptLength: prompt.length,
        documentType: request.documentType
      }
    };
  }

  /**
   * Prepare PDF data for Gemini API
   */
  private async preparePDFData(pdfBase64: string): Promise<any> {
    try {
      // Remove data URL prefix
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/=]+$/.test(base64Data) || base64Data.length % 4 !== 0) {
        throw new Error('Invalid base64 PDF data');
      }

      return {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      };

    } catch (error) {
      throw new Error(`Failed to prepare PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callGeminiAPI(prompt: string, pdfData: any, maxRetries: number = 3): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Gemini API call attempt ${attempt}/${maxRetries}`);

        const result = await this.model.generateContent([
          prompt,
          pdfData
        ]);

        const response = await result.response;
        
        // Check for successful response
        if (!response) {
          throw new Error('No response from Gemini API');
        }

        console.log(`✅ Gemini API call successful on attempt ${attempt}`);
        return {
          response,
          usageMetadata: result.response.usageMetadata
        };

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Gemini API attempt ${attempt} failed:`, error);

        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes('API_KEY') || 
              error.message.includes('PERMISSION') ||
              error.message.includes('QUOTA')) {
            throw error; // Don't retry auth/quota errors
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw new Error(`Gemini API failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Process and validate API response
   */
  private async processAPIResponse(apiResponse: any, request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
    try {
      const responseText = await apiResponse.response.text();
      console.log('📋 Processing Gemini API response...');

      // Parse JSON response
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        // Sometimes the response might have extra text, try to extract JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON from response');
        }
      }

      // Validate response structure
      const validation = validateGeminiResponse(parsedResponse);
      if (!validation.valid) {
        console.warn('⚠️ Response validation issues:', validation.errors);
        // Continue with sanitization rather than failing
      }

      // Sanitize and enhance response
      const sanitizedResponse = sanitizeGeminiResponse(parsedResponse, request);

      // Add processing metadata
      const enhancedResponse: GeminiAnalysisResponse = {
        ...sanitizedResponse,
        processingInfo: {
          timestamp: Date.now(),
          version: '1.0.0',
          model: this.config.model,
          processingTime: 0, // Will be set by caller
          confidence: sanitizedResponse.documentStructure.confidence,
          tokenCount: apiResponse.usageMetadata?.totalTokenCount || 0,
          apiCalls: 1,
          retries: 0
        }
      };

      console.log('✅ Response processed successfully');
      return enhancedResponse;

    } catch (error) {
      throw new Error(`Failed to process API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze single document section (for incremental processing)
   */
  async analyzeSection(sectionText: string, documentType?: string): Promise<any> {
    try {
      const prompt = `
Analyze this document section and extract structured information:

Document Type: ${documentType || 'general'}
Section Text: ${sectionText}

Please respond with JSON containing:
- contentType: (text|question|header|instruction|etc)
- extractedContent: cleaned and formatted content
- confidence: analysis confidence (0-1)
- suggestions: improvement suggestions
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return JSON.parse(response.text());

    } catch (error) {
      throw new Error(`Section analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate content suggestions
   */
  async generateSuggestions(content: string, contentType: string): Promise<string[]> {
    try {
      const prompt = `
Analyze this ${contentType} content and provide 3-5 specific improvement suggestions:

Content: ${content}

Focus on:
- Clarity and readability
- Educational effectiveness
- Proper formatting
- Content completeness

Respond with JSON array of suggestion strings.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return JSON.parse(response.text());

    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return ['Review content for clarity', 'Check formatting and structure'];
    }
  }
}

/**
 * Gemini configuration interface
 */
export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Default Gemini configuration
 */
export const DEFAULT_GEMINI_CONFIG: Partial<GeminiConfig> = {
  model: 'gemini-2.0-flash',
  maxTokens: 8192,
  temperature: 0.1
};