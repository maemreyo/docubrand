import { NextRequest, NextResponse } from 'next/server';
import { GeminiConfigManager, GeminiDevUtils } from '@/lib/gemini-config';
import { getGeminiClient } from '@/lib/gemini-client';
import { getPromptTemplate, getExamplePrompts, validatePromptInputs } from '@/lib/prompt-templates';
import { validateGeminiResponse, sanitizeGeminiResponse } from '@/lib/gemini-validators';

/**
 * Test request interface
 */
interface TestRequest {
  testType: 'connection' | 'prompt' | 'mock' | 'full' | 'validate';
  language?: 'en' | 'vi';
  documentType?: 'quiz' | 'worksheet' | 'general';
  promptText?: string;
  mockResponse?: any;
}

/**
 * POST /api/test-gemini
 * Run comprehensive tests on Gemini AI integration
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: TestRequest = await request.json();
    const { testType, language = 'en', documentType = 'quiz' } = body;

    console.log(`🧪 Running Gemini test: ${testType}`);

    let results: Record<string, any> = {
      testType,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    switch (testType) {
      case 'connection':
        results = await testConnection();
        break;
        
      case 'prompt':
        results = await testPromptGeneration(language, documentType);
        break;
        
      case 'mock':
        results = await testMockService();
        break;
        
      case 'full':
        results = await runFullTestSuite(language, documentType);
        break;
        
      case 'validate':
        results = await testValidation(body.mockResponse);
        break;
        
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }

    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      testType,
      processingTime,
      results,
      recommendations: generateRecommendations(results),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Gemini test failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      processingTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/test-gemini
 * Get available test types and instructions
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Log current configuration for debugging
    GeminiDevUtils.logCurrentConfig();

    return NextResponse.json({
      service: 'Gemini AI Test Suite',
      version: '2.0.0',
      status: 'ready',
      availableTests: {
        connection: {
          description: 'Test basic API connectivity and authentication',
          method: 'POST',
          body: { testType: 'connection' },
          duration: '~2-5 seconds'
        },
        prompt: {
          description: 'Test prompt generation for different document types',
          method: 'POST',
          body: { 
            testType: 'prompt',
            language: 'en|vi',
            documentType: 'quiz|worksheet|general'
          },
          duration: '~1 second'
        },
        mock: {
          description: 'Test with mock Gemini service (no API key needed)',
          method: 'POST',
          body: { testType: 'mock' },
          duration: '~1 second'
        },
        full: {
          description: 'Run comprehensive test suite',
          method: 'POST',
          body: { 
            testType: 'full',
            language: 'en',
            documentType: 'quiz'
          },
          duration: '~10-30 seconds'
        },
        validate: {
          description: 'Test response validation and sanitization',
          method: 'POST',
          body: { 
            testType: 'validate',
            mockResponse: {}
          },
          duration: '~1 second'
        }
      },
      examples: {
        basicConnection: {
          url: '/api/test-gemini',
          method: 'POST',
          body: { testType: 'connection' }
        },
        promptGeneration: {
          url: '/api/test-gemini',
          method: 'POST',
          body: { 
            testType: 'prompt',
            language: 'en',
            documentType: 'quiz'
          }
        },
        fullSuite: {
          url: '/api/test-gemini',
          method: 'POST',
          body: { 
            testType: 'full',
            language: 'en',
            documentType: 'worksheet'
          }
        }
      },
      configuration: {
        currentModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        maxTokens: process.env.GEMINI_MAX_TOKENS || '8192',
        temperature: process.env.GEMINI_TEMPERATURE || '0.1',
        hasApiKey: !!process.env.GEMINI_API_KEY
      },
      setupInstructions: GeminiConfigManager.getSetupInstructions(),
      documentation: {
        configuration: 'Check .env.local.example for setup instructions',
        apiKey: 'Get your API key from https://ai.google.dev/aistudio',
        troubleshooting: 'Check console logs for detailed error information'
      }
    });

  } catch (error) {
    return NextResponse.json({
      service: 'Gemini AI Test Suite',
      status: 'error',
      error: error instanceof Error ? error.message : 'Service unavailable',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Test basic API connection
 */
async function testConnection(): Promise<Record<string, any>> {
  const results: Record<string, any> = {
    testName: 'Connection Test',
    steps: {}
  };

  try {
    // Step 1: Environment validation
    console.log('🔍 Testing environment validation...');
    const envValidation = GeminiConfigManager.validateEnvironment();
    results.steps.environment = {
      valid: envValidation.valid,
      errors: envValidation.errors,
      status: envValidation.valid ? 'passed' : 'failed'
    };

    if (!envValidation.valid) {
      results.overall = 'failed';
      results.message = 'Environment validation failed';
      return results;
    }

    // Step 2: Service creation
    console.log('🔧 Testing service creation...');
    const client = await getGeminiClient();
    const healthStatus = client.getHealthStatus();
    
    results.steps.serviceCreation = {
      status: healthStatus.status === 'healthy' ? 'passed' : 'failed',
      details: healthStatus.details
    };

    // Step 3: API connection test
    console.log('📡 Testing API connection...');
    const connectionTest = await client.testConnection();
    results.steps.apiConnection = connectionTest;

    // Step 4: Model info
    if (connectionTest.success) {
      const modelInfo = (client as any).service?.getModelInfo();
      results.steps.modelInfo = {
        status: 'passed',
        model: modelInfo?.model,
        capabilities: modelInfo?.capabilities?.slice(0, 5) // First 5 capabilities
      };
    }

    // Overall result
    results.overall = connectionTest.success ? 'passed' : 'failed';
    results.message = connectionTest.success ? 
      'All connection tests passed' : 
      `Connection failed: ${connectionTest.error}`;

  } catch (error) {
    results.overall = 'failed';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.message = 'Connection test failed with exception';
  }

  return results;
}

/**
 * Test prompt generation
 */
async function testPromptGeneration(language: string, documentType: string): Promise<Record<string, any>> {
  const results: Record<string, any> = {
    testName: 'Prompt Generation Test',
    language,
    documentType
  };

  try {
    // Test prompt input validation
    const promptInput = {
      documentType,
      language,
      detailLevel: 'standard' as const,
      focusAreas: ['content', 'questions'],
      extractQuestions: true,
      extractSections: true,
      extractMetadata: true,
      questionTypes: ['multiple_choice', 'short_answer'] as const,
      contentTypes: ['text', 'question', 'header'] as const
    };

    console.log('✅ Testing prompt input validation...');
    const validation = validatePromptInputs(promptInput);
    results.inputValidation = {
      valid: validation.valid,
      errors: validation.errors,
      status: validation.valid ? 'passed' : 'failed'
    };

    if (!validation.valid) {
      results.overall = 'failed';
      results.message = 'Prompt input validation failed';
      return results;
    }

    // Generate prompt
    console.log('📝 Generating prompt...');
    const prompt = getPromptTemplate(promptInput);
    results.promptGeneration = {
      status: 'passed',
      promptLength: prompt.length,
      preview: prompt.substring(0, 200) + '...',
      containsInstructions: prompt.includes('ANALYSIS TASK'),
      containsJsonSchema: prompt.includes('JSON'),
      containsLanguageSupport: prompt.includes(language)
    };

    // Test example prompts
    console.log('📋 Testing example prompts...');
    const examples = getExamplePrompts();
    results.examplePrompts = {
      status: 'passed',
      availableExamples: Object.keys(examples),
      exampleCount: Object.keys(examples).length
    };

    results.overall = 'passed';
    results.message = 'Prompt generation tests passed';

  } catch (error) {
    results.overall = 'failed';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.message = 'Prompt generation test failed';
  }

  return results;
}

/**
 * Test mock service
 */
async function testMockService(): Promise<Record<string, any>> {
  const results: Record<string, any> = {
    testName: 'Mock Service Test'
  };

  try {
    console.log('🎭 Creating mock service...');
    const mockService = GeminiDevUtils.createMockService();
    
    results.mockCreation = {
      status: 'passed',
      service: 'created'
    };

    // Test mock connection
    console.log('🔗 Testing mock connection...');
    const connectionTest = await mockService.testConnection();
    results.mockConnection = connectionTest;

    // Test mock analysis (if implemented)
    console.log('🧪 Testing mock analysis...');
    // This would require implementing a mock analysis method
    results.mockAnalysis = {
      status: 'skipped',
      reason: 'Mock analysis not implemented'
    };

    results.overall = connectionTest.success ? 'passed' : 'failed';
    results.message = 'Mock service tests completed';

  } catch (error) {
    results.overall = 'failed';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.message = 'Mock service test failed';
  }

  return results;
}

/**
 * Run full test suite
 */
async function runFullTestSuite(language: string, documentType: string): Promise<Record<string, any>> {
  const results: Record<string, any> = {
    testName: 'Full Test Suite',
    startTime: new Date().toISOString()
  };

  try {
    console.log('🚀 Running full test suite...');

    // Run all individual tests
    results.connectionTest = await testConnection();
    results.promptTest = await testPromptGeneration(language, documentType);
    results.mockTest = await testMockService();
    results.validationTest = await testValidation();

    // Calculate overall results
    const testResults = [
      results.connectionTest,
      results.promptTest,
      results.mockTest,
      results.validationTest
    ];

    const passedTests = testResults.filter(test => test.overall === 'passed').length;
    const totalTests = testResults.length;

    results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100)
    };

    results.overall = passedTests === totalTests ? 'passed' : 'partial';
    results.message = `${passedTests}/${totalTests} tests passed`;

  } catch (error) {
    results.overall = 'failed';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.message = 'Full test suite failed';
  }

  results.endTime = new Date().toISOString();
  return results;
}

/**
 * Test validation and sanitization
 */
async function testValidation(mockResponse?: any): Promise<Record<string, any>> {
  const results: Record<string, any> = {
    testName: 'Validation Test'
  };

  try {
    // Create test response if not provided
    const testResponse = mockResponse || {
      documentStructure: {
        type: 'quiz',
        subject: 'Test Subject',
        confidence: 0.95,
        sections: [
          {
            id: 'test_section_1',
            type: 'question',
            content: 'What is 2+2?',
            position: { page: 1, x: 0, y: 0, width: 100, height: 20 },
            confidence: 0.9
          }
        ]
      },
      extractedQuestions: [
        {
          id: 'test_question_1',
          number: '1',
          content: 'What is 2+2?',
          type: 'multiple_choice',
          options: ['2', '3', '4', '5'],
          correctAnswer: '4',
          confidence: 0.95
        }
      ],
      extractedContent: {
        title: 'Test Document'
      }
    };

    console.log('✅ Testing response validation...');
    const validation = validateGeminiResponse(testResponse);
    results.validation = {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      status: validation.valid ? 'passed' : 'failed'
    };

    console.log('🧹 Testing response sanitization...');
    const mockRequest = { documentType: 'quiz', pdfBase64: 'test' };
    const sanitized = sanitizeGeminiResponse(testResponse, mockRequest as any);
    
    results.sanitization = {
      status: 'passed',
      hasDocumentStructure: !!sanitized.documentStructure,
      hasExtractedQuestions: !!sanitized.extractedQuestions,
      hasExtractedContent: !!sanitized.extractedContent,
      sectionsCount: sanitized.documentStructure?.sections?.length || 0,
      questionsCount: sanitized.extractedQuestions?.length || 0
    };

    results.overall = validation.valid ? 'passed' : 'failed';
    results.message = 'Validation tests completed';

  } catch (error) {
    results.overall = 'failed';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.message = 'Validation test failed';
  }

  return results;
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results: Record<string, any>): string[] {
  const recommendations: string[] = [];

  // Connection test recommendations
  if (results.connectionTest?.overall === 'failed') {
    recommendations.push('Check Gemini API key configuration');
    recommendations.push('Verify internet connectivity');
    recommendations.push('Ensure API key has proper permissions');
  }

  // Environment recommendations
  if (results.steps?.environment?.status === 'failed') {
    recommendations.push('Review .env.local file configuration');
    recommendations.push('Check environment variable setup');
    recommendations.push('Restart development server after changes');
  }

  // Performance recommendations
  if (results.processingTime > 10000) {
    recommendations.push('Consider optimizing request size');
    recommendations.push('Check network connectivity');
    recommendations.push('Monitor API response times');
  }

  // Success recommendations
  if (results.overall === 'passed') {
    recommendations.push('System is ready for production use');
    recommendations.push('Consider running periodic health checks');
    recommendations.push('Monitor API usage and quotas');
  }

  return recommendations.length > 0 ? recommendations : ['All tests passed - no immediate actions needed'];
}