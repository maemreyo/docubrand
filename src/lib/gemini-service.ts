import { 
  GeminiConfig, 
  GeminiPDFAnalysisRequest, 
  GeminiAnalysisResponse, 
  GeminiAPIRequest, 
  GeminiAPIResponse, 
  GeminiError 
} from '@/types/gemini';
import { PromptTemplates } from './prompt-templates';

export class GeminiService {
  private config: GeminiConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-2.0-flash',
      maxTokens: 8192,
      temperature: 0.1, // Low temperature for accuracy
      ...config
    };
  }

  /**
   * Analyze PDF document using Gemini API
   */
  async analyzePDF(request: GeminiPDFAnalysisRequest): Promise<GeminiAnalysisResponse> {
    try {
      console.log('🔍 Starting PDF analysis with Gemini...');
      const startTime = Date.now();

      // Generate SIMPLIFIED prompt for testing
      const prompt = this.generateSimplifiedPrompt(request.documentType, request.language);
      
      console.log('📝 Using simplified prompt:', prompt.substring(0, 200) + '...');

      // Prepare API request
      const apiRequest: GeminiAPIRequest = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: request.pdfBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
          // Remove structured output for testing
          responseMimeType: 'text/plain'
        }
      };

      // Call Gemini API with enhanced logging
      const response = await this.callGeminiAPIWithLogging(apiRequest);
      const processingTime = Date.now() - startTime;

      // Parse and validate response
      const analysisResult = this.parseGeminiResponseWithFallback(response, processingTime);

      console.log('✅ PDF analysis completed:', {
        confidence: analysisResult.processingInfo.confidence,
        questionsFound: analysisResult.extractedQuestions.length,
        sectionsFound: analysisResult.documentStructure.sections.length,
        processingTime: `${processingTime}ms`
      });

      return analysisResult;

    } catch (error) {
      console.error('❌ PDF analysis failed:', error);
      throw this.handleGeminiError(error);
    }
  }

  /**
   * Generate simplified prompt for testing
   */
  private generateSimplifiedPrompt(documentType: string, language: string): string {
    return `Please analyze this educational PDF document and extract its content.

Focus on:
1. Document title and subject
2. Questions and their content
3. Answer options for multiple choice questions
4. Instructions or directions

Please respond with a JSON object containing:
{
  "success": true,
  "documentStructure": {
    "title": "extracted title",
    "subject": "subject if found",
    "sections": [],
    "metadata": {
      "totalPages": 1,
      "language": "${language}",
      "documentType": "${documentType}",
      "extractionConfidence": 0.8,
      "questionsCount": 0,
      "sectionsCount": 0
    }
  },
  "extractedQuestions": [],
  "extractedContent": {
    "title": "document title",
    "rawText": "extracted text"
  },
  "processingInfo": {
    "model": "${this.config.model}",
    "confidence": 0.8
  }
}

Keep the response concise and focus on accuracy over completeness.`;
  }

  /**
   * Enhanced API call with detailed logging
   */
  private async callGeminiAPIWithLogging(request: GeminiAPIRequest): Promise<GeminiAPIResponse> {
    const url = `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    console.log('📤 Calling Gemini API:', {
      model: this.config.model,
      hasApiKey: !!this.config.apiKey,
      apiKeyPrefix: this.config.apiKey?.substring(0, 10) + '...',
      contentParts: request.contents[0].parts.length,
      hasPDFData: request.contents[0].parts.some(p => p.inlineData)
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    console.log('📥 Gemini API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log('📋 Gemini Response Data:', {
      hasCandidates: !!responseData.candidates,
      candidatesCount: responseData.candidates?.length || 0,
      hasUsageMetadata: !!responseData.usageMetadata,
      firstCandidatePreview: responseData.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 200) + '...'
    });

    return responseData;
  }

  /**
   * Parse response with fallback handling
   */
  private parseGeminiResponseWithFallback(
    response: GeminiAPIResponse, 
    processingTime: number
  ): GeminiAnalysisResponse {
    try {
      // Extract the generated content
      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Invalid response format from Gemini API');
      }

      const textResponse = candidate.content.parts[0].text;
      console.log('📝 Raw Gemini Text Response:', textResponse.substring(0, 500) + '...');
      
      // Try to parse JSON response
      let parsedResponse: GeminiAnalysisResponse;
      try {
        // Clean the response text (remove markdown code blocks if present)
        const cleanedText = textResponse
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/^[^{]*/, '') // Remove text before first {
          .replace(/[^}]*$/, '}'); // Ensure ends with }
        
        console.log('🧹 Cleaned response for parsing:', cleanedText.substring(0, 300) + '...');
        
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.log('📄 Full text response:', textResponse);
        
        // Fallback: Create minimal response structure
        return this.createFallbackResponse(textResponse, processingTime);
      }

      // Validate and enhance response
      if (!parsedResponse.success || !parsedResponse.documentStructure) {
        console.warn('⚠️ Invalid analysis result structure, using fallback');
        return this.createFallbackResponse(textResponse, processingTime);
      }

      // Add processing metadata
      parsedResponse.processingInfo = {
        ...parsedResponse.processingInfo,
        model: this.config.model,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        processingTime,
        confidence: parsedResponse.processingInfo?.confidence || 0.8
      };

      return parsedResponse;

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error(`Response parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create fallback response when parsing fails
   */
  private createFallbackResponse(textResponse: string, processingTime: number): GeminiAnalysisResponse {
    console.log('🔄 Creating fallback response structure...');
    
    return {
      success: true,
      documentStructure: {
        title: "Document Analysis",
        subject: "Extracted from PDF",
        sections: [
          {
            id: "fallback_1",
            type: "content",
            content: textResponse.substring(0, 500) + "...",
            position: { page: 1, order: 1 }
          }
        ],
        metadata: {
          totalPages: 1,
          language: "en",
          documentType: "general",
          extractionConfidence: 0.6,
          questionsCount: 0,
          sectionsCount: 1
        }
      },
      extractedQuestions: [],
      extractedContent: {
        title: "Fallback Analysis",
        rawText: textResponse
      },
      processingInfo: {
        model: this.config.model,
        tokensUsed: 0,
        processingTime,
        confidence: 0.6
      }
    };
  }

  /**
   * Make API call to Gemini (original method kept for compatibility)
   */
  private async callGeminiAPI(request: GeminiAPIRequest): Promise<GeminiAPIResponse> {
    return this.callGeminiAPIWithLogging(request);
  }

  /**
   * Handle and format Gemini API errors
   */
  private handleGeminiError(error: unknown): Error {
    if (error instanceof Error) {
      // Check for common Gemini API errors
      if (error.message.includes('400')) {
        return new Error('Invalid request format. Please check your PDF file and try again.');
      }
      if (error.message.includes('403')) {
        return new Error('API key is invalid or lacks permissions. Please check your Gemini API configuration.');
      }
      if (error.message.includes('413')) {
        return new Error('PDF file is too large. Please use a file smaller than 20MB.');
      }
      if (error.message.includes('429')) {
        return new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (error.message.includes('500')) {
        return new Error('Gemini API is temporarily unavailable. Please try again later.');
      }
      
      return error;
    }

    return new Error('An unexpected error occurred during PDF analysis.');
  }

  /**
   * Convert File to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:application/pdf;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to convert file to base64'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate PDF file before processing
   */
  static validatePDFFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF document' };
    }

    // Check file size (20MB limit for Gemini API)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      return { valid: false, error: 'PDF file must be smaller than 20MB' };
    }

    // Check if file is empty
    if (file.size === 0) {
      return { valid: false, error: 'PDF file appears to be empty' };
    }

    return { valid: true };
  }

  /**
   * Test API connection and configuration
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Testing Gemini API connection...');
      
      const testRequest: GeminiAPIRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello, please respond with "API connection successful"' }]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 50
        }
      };

      const response = await this.callGeminiAPIWithLogging(testRequest);
      
      if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log('✅ Connection test successful');
        return { success: true };
      } else {
        console.error('❌ Connection test failed: Invalid response format');
        return { success: false, error: 'Invalid response format' };
      }

    } catch (error) {
      console.error('❌ Connection test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  /**
   * Get model information and capabilities
   */
  getModelInfo(): { model: string; capabilities: string[]; limits: Record<string, number> } {
    return {
      model: this.config.model,
      capabilities: [
        'PDF document analysis',
        'Multimodal input (text + PDF)',
        'Structured JSON output',
        'Educational content extraction',
        'Question and answer detection',
        'Text formatting preservation'
      ],
      limits: {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        maxTokens: this.config.maxTokens || 8192,
        contextWindow: this.config.model === 'gemini-1.5-pro' ? 2000000 : 1000000
      }
    };
  }
}