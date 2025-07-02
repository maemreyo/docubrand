// CREATED: 2025-07-03 - Gemini API test endpoint for development

import { NextRequest, NextResponse } from 'next/server';
import { GeminiConfigManager, GeminiDevUtils } from '@/lib/gemini-config';
import { PromptTemplates } from '@/lib/prompt-templates';

export const runtime = 'nodejs';

interface TestRequest {
  testType?: 'connection' | 'prompt' | 'mock' | 'full';
  prompt?: string;
  language?: 'en' | 'vi';
  documentType?: 'quiz' | 'worksheet' | 'general';
}

interface TestResponse {
  success: boolean;
  testType: string;
  results: Record<string, any>;
  timestamp: string;
  duration: number;
  error?: string;
}

/**
 * POST /api/test-gemini
 * Test different aspects of Gemini integration
 */
export async function POST(request: NextRequest): Promise<NextResponse<TestResponse>> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const body: TestRequest = await request.json().catch(() => ({}));
    const testType = body.testType || 'connection';

    console.log(`🧪 Running Gemini test: ${testType}`);

    let results: Record<string, any> = {};

    switch (testType) {
      case 'connection':
        results = await testConnection();
        break;
      
      case 'prompt':
        results = await testPromptGeneration(body.language, body.documentType);
        break;
      
      case 'mock':
        results = await testMockService();
        break;
      
      case 'full':
        results = await runFullTestSuite(body.language, body.documentType);
        break;
      
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      testType,
      results,
      timestamp,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Gemini test failed:', error);

    return NextResponse.json({
      success: false,
      testType: 'error',
      results: {},
      timestamp,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/test-gemini
 * Get available test types and instructions
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Show current configuration for debugging
    GeminiDevUtils.logCurrentConfig();

    return NextResponse.json({
      service: 'Gemini API Test Suite',
      version: '1.0.0',
      availableTests: {
        connection: {
          description: 'Test basic API connectivity',
          method: 'POST',
          body: { testType: 'connection' }
        },
        prompt: {
          description: 'Test prompt generation for different document types',
          method: 'POST',
          body: { 
            testType: 'prompt',
            language: 'en|vi',
            documentType: 'quiz|worksheet|general'
          }
        },
        mock: {
          description: 'Test with mock Gemini service (no API key needed)',
          method: 'POST', 
          body: { testType: 'mock' }
        },
        full: {
          description: 'Run comprehensive test suite',
          method: 'POST',
          body: { 
            testType: 'full',
            language: 'en',
            documentType: 'quiz'
          }
        }
      },
      examples: {
        basicTest: {
          url: '/api/test-gemini',
          method: 'POST',
          body: { testType: 'connection' }
        },
        promptTest: {
          url: '/api/test-gemini',
          method: 'POST',
          body: { 
            testType: 'prompt',
            language: 'en',
            documentType: 'quiz'
          }
        }
      },
      setupInstructions: GeminiConfigManager.getSetupInstructions()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test suite unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Test basic Gemini API connection
 */
async function testConnection(): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  // Test environment validation
  const envValidation = GeminiConfigManager.validateEnvironment();
  results.environment = {
    valid: envValidation.valid,
    errors: envValidation.errors
  };

  if (!envValidation.valid) {
    results.connection = {
      success: false,
      error: 'Environment validation failed'
    };
    return results;
  }

  // Test Gemini service creation
  try {
    const service = await GeminiConfigManager.getService();
    const modelInfo = service.getModelInfo();
    
    results.serviceCreation = {
      success: true,
      model: modelInfo.model,
      capabilities: modelInfo.capabilities.slice(0, 3) // Show first 3
    };

    // Test API connection
    const connectionTest = await service.testConnection();
    results.connection = connectionTest;

  } catch (error) {
    results.serviceCreation = {
      success: false,
      error: error instanceof Error ? error.message : 'Service creation failed'
    };
  }

  return results;
}

/**
 * Test prompt generation
 */
async function testPromptGeneration(
  language: 'en' | 'vi' = 'en',
  documentType: 'quiz' | 'worksheet' | 'general' = 'quiz'
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  try {
    // Test prompt generation
    const prompt = PromptTemplates.generateAnalysisPrompt(documentType, language);
    
    results.promptGeneration = {
      success: true,
      language,
      documentType,
      promptLength: prompt.length,
      containsStructure: prompt.includes('JSON'),
      containsInstructions: prompt.includes(documentType)
    };

    // Test schema generation
    const schema = PromptTemplates.getResponseSchema();
    results.schemaGeneration = {
      success: true,
      schemaType: schema.type,
      requiredFields: (schema as any).required?.length || 0,
      hasProperties: !!(schema as any).properties
    };

    // Generate sample prompts for all types
    const samplePrompts = {
      quiz: PromptTemplates.generateAnalysisPrompt('quiz', language).substring(0, 200) + '...',
      worksheet: PromptTemplates.generateAnalysisPrompt('worksheet', language).substring(0, 200) + '...',
      general: PromptTemplates.generateAnalysisPrompt('general', language).substring(0, 200) + '...'
    };

    results.samplePrompts = samplePrompts;

  } catch (error) {
    results.promptGeneration = {
      success: false,
      error: error instanceof Error ? error.message : 'Prompt generation failed'
    };
  }

  return results;
}

/**
 * Test mock service
 */
async function testMockService(): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  try {
    // Create mock service
    const mockService = GeminiDevUtils.createMockService();
    results.mockServiceCreation = {
      success: true,
      modelInfo: mockService.getModelInfo()
    };

    // Test mock analysis
    const mockRequest = {
      pdfBase64: 'mock-base64-data',
      documentType: 'quiz' as const,
      language: 'en' as const,
      extractionPrompt: 'mock prompt'
    };

    const mockResult = await mockService.analyzePDF(mockRequest);
    results.mockAnalysis = {
      success: mockResult.success,
      hasStructure: !!mockResult.documentStructure,
      hasContent: !!mockResult.extractedContent,
      confidence: mockResult.processingInfo.confidence
    };

  } catch (error) {
    results.mockService = {
      success: false,
      error: error instanceof Error ? error.message : 'Mock test failed'
    };
  }

  return results;
}

/**
 * Run comprehensive test suite
 */
async function runFullTestSuite(
  language: 'en' | 'vi' = 'en',
  documentType: 'quiz' | 'worksheet' | 'general' = 'quiz'
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  // Run all tests
  results.connection = await testConnection();
  results.prompt = await testPromptGeneration(language, documentType);
  results.mock = await testMockService();

  // Summary
  const allTests = [
    results.connection.environment?.valid,
    results.connection.connection?.success,
    results.prompt.promptGeneration?.success,
    results.mock.mockAnalysis?.success
  ];

  results.summary = {
    totalTests: allTests.length,
    passedTests: allTests.filter(Boolean).length,
    failedTests: allTests.filter(test => test === false).length,
    overallSuccess: allTests.every(Boolean),
    readyForProduction: results.connection.environment?.valid && 
                       results.connection.connection?.success
  };

  return results;
}