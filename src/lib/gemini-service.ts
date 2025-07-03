// src/lib/gemini-service.ts
// UPDATED: 2025-07-03 - Fixed response parsing to properly extract content from AI responses

import { 
  GeminiPDFAnalysisRequest, 
  GeminiAnalysisResponse, 
  GeminiAPIRequest,
  GeminiAPIResponse,
  ExtractedQuestion,
  DocumentSection 
} from '@/types/gemini';
import { PromptTemplates } from './prompt-templates';

interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class GeminiService {
  private config: GeminiConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  /**
   * Analyze PDF using Gemini AI
   */
  async analyzePDF(request: GeminiPDFAnalysisRequest): Promise<GeminiAnalysisResponse> {
    console.log('🔍 Starting Gemini PDF analysis...');
    const startTime = Date.now();

    try {
      // Generate analysis prompt
      const prompt = PromptTemplates.generateAnalysisPrompt(
        request.documentType,
        request.language
      );

      // Prepare API request
      const apiRequest: GeminiAPIRequest = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: request.pdfBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
          responseMimeType: 'text/plain'
        }
      };

      // Call Gemini API
      const response = await this.callGeminiAPIWithLogging(apiRequest);
      const processingTime = Date.now() - startTime;

      // FIXED: Enhanced response parsing with proper content extraction
      const analysisResult = this.parseGeminiResponseWithEnhancedExtraction(response, processingTime);

      console.log('✅ Gemini analysis completed:', {
        processingTime,
        questionsFound: analysisResult.extractedQuestions.length,
        sectionsFound: analysisResult.documentStructure.sections.length,
        confidence: analysisResult.processingInfo.confidence
      });

      return analysisResult;

    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      
      // Enhanced fallback with meaningful error context
      return this.createEnhancedFallback(request, error as Error);
    }
  }

  /**
   * FIXED: Enhanced parsing with proper content extraction
   */
  private parseGeminiResponseWithEnhancedExtraction(
    response: GeminiAPIResponse, 
    processingTime: number
  ): GeminiAnalysisResponse {
    try {
      const candidate = response.candidates?.[0];
      const responseText = candidate?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No response text from Gemini');
      }

      console.log('📋 Raw Gemini response preview:', {
        length: responseText.length,
        preview: responseText.substring(0, 200),
        hasJsonMarkers: responseText.includes('```json'),
        hasStructure: responseText.includes('documentStructure')
      });

      // STEP 1: Extract JSON from various response formats
      let jsonContent = this.extractJSONFromResponse(responseText);
      
      // STEP 2: Parse and validate JSON structure
      const parsedResponse = JSON.parse(jsonContent);
      
      // STEP 3: Validate required structure
      if (!parsedResponse.documentStructure) {
        throw new Error('Missing documentStructure in response');
      }

      // STEP 4: Clean and process content
      const processedResponse = this.processAndCleanContent(parsedResponse);

      // STEP 5: Create final response with metadata
      return {
        success: true,
        documentStructure: processedResponse.documentStructure,
        extractedQuestions: processedResponse.extractedQuestions || [],
        extractedContent: processedResponse.extractedContent || {
          title: processedResponse.documentStructure.title || 'Extracted Document',
          rawText: this.extractAllTextContent(processedResponse.documentStructure.sections)
        },
        processingInfo: {
          model: this.config.model,
          confidence: processedResponse.documentStructure.metadata?.extractionConfidence || 0.8,
          processingTime,
          tokensUsed: response.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (parseError) {
      console.warn('⚠️ JSON parsing failed, attempting content extraction:', parseError);
      
      // Fallback: Extract whatever content we can from the raw response
      return this.extractContentFromFailedParsing(responseText, processingTime);
    }
  }

  /**
   * NEW: Extract JSON from various response formats
   */
  private extractJSONFromResponse(responseText: string): string {
    // Pattern 1: JSON wrapped in markdown code blocks
    const markdownJsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (markdownJsonMatch) {
      console.log('📦 Found JSON in markdown code block');
      return markdownJsonMatch[1].trim();
    }

    // Pattern 2: JSON wrapped in simple code blocks
    const codeBlockMatch = responseText.match(/```([\s\S]*?)```/);
    if (codeBlockMatch) {
      const content = codeBlockMatch[1].trim();
      if (content.startsWith('{') && content.endsWith('}')) {
        console.log('📦 Found JSON in code block');
        return content;
      }
    }

    // Pattern 3: Direct JSON (starts and ends with braces)
    const directJsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (directJsonMatch) {
      console.log('📦 Found direct JSON');
      return directJsonMatch[0];
    }

    // Pattern 4: JSON embedded in text
    const embeddedJsonMatch = responseText.match(/(?:^|\n)\s*(\{[\s\S]*?\})\s*(?:\n|$)/);
    if (embeddedJsonMatch) {
      console.log('📦 Found embedded JSON');
      return embeddedJsonMatch[1];
    }

    throw new Error('No valid JSON found in response');
  }

  /**
   * NEW: Process and clean extracted content
   */
  private processAndCleanContent(parsedResponse: any): any {
    // Clean sections content
    if (parsedResponse.documentStructure?.sections) {
      parsedResponse.documentStructure.sections = parsedResponse.documentStructure.sections.map((section: any) => ({
        ...section,
        content: this.cleanTextContent(section.content)
      }));
    }

    // Clean questions content
    if (parsedResponse.extractedQuestions) {
      parsedResponse.extractedQuestions = parsedResponse.extractedQuestions.map((question: any) => ({
        ...question,
        content: this.cleanTextContent(question.content || question.questionText),
        options: question.options?.map((opt: string) => this.cleanTextContent(opt))
      }));
    }

    return parsedResponse;
  }

  /**
   * NEW: Clean text content from various formatting issues
   */
  private cleanTextContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    let cleaned = content;

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\w]*\n?/g, '').replace(/\n?```/g, '');
    
    // Clean up escaped characters
    cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'");
    
    // Remove extra whitespace but preserve line breaks
    cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n');
    
    // Trim leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * NEW: Extract content when JSON parsing completely fails
   */
  private extractContentFromFailedParsing(responseText: string, processingTime: number): GeminiAnalysisResponse {
    console.log('🔄 Attempting content extraction from failed parsing...');

    // Try to find any structured content in the response
    const lines = responseText.split('\n').filter(line => line.trim());
    const meaningfulLines = lines.filter(line => 
      line.length > 10 && 
      !line.includes('```') && 
      !line.includes('json') &&
      !line.includes('{') &&
      !line.includes('}')
    );

    // Create a meaningful section from whatever we can extract
    const extractedContent = meaningfulLines.slice(0, 10).join('\n');

    return {
      success: false,
      documentStructure: {
        title: 'Content Extraction (Parsing Failed)',
        subject: 'Extracted from failed AI response',
        sections: [{
          id: 'extracted_content_1',
          type: 'content',
          content: extractedContent || 'Unable to extract readable content from AI response.',
          position: { page: 1, order: 1 }
        }],
        metadata: {
          totalPages: 1,
          language: 'unknown',
          documentType: 'general',
          extractionConfidence: 0.3,
          questionsCount: 0,
          sectionsCount: 1
        }
      },
      extractedQuestions: [],
      extractedContent: {
        title: 'Failed Extraction',
        rawText: extractedContent
      },
      processingInfo: {
        model: this.config.model,
        confidence: 0.3,
        processingTime,
        tokensUsed: 0
      }
    };
  }

  /**
   * NEW: Extract all text content from sections for rawText
   */
  private extractAllTextContent(sections: DocumentSection[]): string {
    return sections
      .map(section => section.content)
      .filter(content => content && content.trim())
      .join('\n\n');
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
   * Enhanced fallback with meaningful error context
   */
  private createEnhancedFallback(request: GeminiPDFAnalysisRequest, error: Error): GeminiAnalysisResponse {
    console.log('🔄 Creating enhanced fallback response...');

    return {
      success: false,
      documentStructure: {
        title: 'AI Analysis Failed',
        subject: `Document processing error: ${error.message}`,
        sections: [{
          id: 'error_section_1',
          type: 'content',
          content: `AI analysis failed. Please manually enter your document content or try uploading again.\n\nError: ${error.message}`,
          position: { page: 1, order: 1 }
        }],
        metadata: {
          totalPages: 1,
          language: request.language || 'en',
          documentType: request.documentType || 'general',
          extractionConfidence: 0.0,
          questionsCount: 0,
          sectionsCount: 1
        }
      },
      extractedQuestions: [],
      extractedContent: {
        title: 'Manual Entry Required',
        rawText: 'AI analysis failed. Please manually enter your document content.'
      },
      processingInfo: {
        model: this.config.model,
        confidence: 0.0,
        processingTime: 0,
        tokensUsed: 0
      }
    };
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
}