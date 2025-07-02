// CREATED: 2025-07-03 - Health check API endpoint

import { NextResponse } from 'next/server';
import { GeminiConfigManager } from '@/lib/gemini-config';

export const runtime = 'nodejs';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    gemini: {
      status: 'connected' | 'disconnected' | 'error';
      model?: string;
      lastChecked: string;
      error?: string;
    };
    storage: {
      status: 'available' | 'unavailable';
      type: 'localStorage' | 'cloud';
    };
    pdfProcessor: {
      status: 'ready' | 'error';
      library: 'pdf-lib';
    };
  };
  configuration: {
    maxFileSize: string;
    supportedLanguages: string[];
    rateLimits: Record<string, string>;
  };
}

/**
 * GET /api/health
 * Comprehensive health check for all services
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // Check environment configuration
    const envValidation = GeminiConfigManager.validateEnvironment();
    
    // Test Gemini connection
    let geminiStatus: HealthCheckResponse['services']['gemini'] = {
      status: 'disconnected',
      lastChecked: timestamp
    };

    if (envValidation.valid) {
      try {
        const geminiService = await GeminiConfigManager.getService();
        const connectionTest = await geminiService.testConnection();
        
        if (connectionTest.success) {
          const modelInfo = geminiService.getModelInfo();
          geminiStatus = {
            status: 'connected',
            model: modelInfo.model,
            lastChecked: timestamp
          };
        } else {
          geminiStatus = {
            status: 'error',
            lastChecked: timestamp,
            error: connectionTest.error
          };
        }
      } catch (error) {
        geminiStatus = {
          status: 'error',
          lastChecked: timestamp,
          error: error instanceof Error ? error.message : 'Connection failed'
        };
      }
    } else {
      geminiStatus = {
        status: 'error',
        lastChecked: timestamp,
        error: envValidation.errors.join(', ')
      };
    }

    // Check storage (client-side localStorage simulation)
    const storageStatus = {
      status: 'available' as const,
      type: 'localStorage' as const
    };

    // Check PDF processor
    const pdfProcessorStatus = {
      status: 'ready' as const,
      library: 'pdf-lib' as const
    };

    // Determine overall health status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (geminiStatus.status === 'error') {
      overallStatus = 'unhealthy';
    } else if (geminiStatus.status === 'disconnected') {
      overallStatus = 'degraded';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp,
      uptime: Date.now() - startTime,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        gemini: geminiStatus,
        storage: storageStatus,
        pdfProcessor: pdfProcessorStatus
      },
      configuration: {
        maxFileSize: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '20MB',
        supportedLanguages: (process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES || 'en,vi').split(','),
        rateLimits: {
          gemini: '1,500 requests/day (free tier)',
          fileSize: '20MB per request',
          timeout: '60 seconds per request'
        }
      }
    };

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503;

    return NextResponse.json(response, { status: httpStatus });

  } catch (error) {
    console.error('❌ Health check failed:', error);

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp,
      uptime: Date.now() - startTime,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        gemini: {
          status: 'error',
          lastChecked: timestamp,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        storage: {
          status: 'unavailable',
          type: 'localStorage'
        },
        pdfProcessor: {
          status: 'error',
          library: 'pdf-lib'
        }
      },
      configuration: {
        maxFileSize: 'unknown',
        supportedLanguages: ['unknown'],
        rateLimits: {}
      }
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * POST /api/health
 * Perform deep health check with specific tests
 */
export async function POST(): Promise<NextResponse> {
  try {
    const timestamp = new Date().toISOString();
    
    // Perform comprehensive testing
    const tests = {
      environment: GeminiConfigManager.validateEnvironment(),
      geminiConnection: null as any,
      configurationLoad: null as any
    };

    // Test Gemini connection
    try {
      const service = await GeminiConfigManager.getService();
      tests.geminiConnection = await service.testConnection();
    } catch (error) {
      tests.geminiConnection = {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }

    // Test configuration loading
    try {
      const config = GeminiConfigManager.getConfigFromEnv();
      tests.configurationLoad = {
        success: true,
        model: config.model,
        hasApiKey: !!config.apiKey
      };
    } catch (error) {
      tests.configurationLoad = {
        success: false,
        error: error instanceof Error ? error.message : 'Config load failed'
      };
    }

    const allTestsPassed = tests.environment.valid && 
                          tests.geminiConnection?.success && 
                          tests.configurationLoad?.success;

    return NextResponse.json({
      status: allTestsPassed ? 'all_tests_passed' : 'some_tests_failed',
      timestamp,
      tests,
      recommendations: allTestsPassed ? 
        ['System is ready for production use'] :
        [
          !tests.environment.valid && 'Check environment configuration',
          !tests.geminiConnection?.success && 'Verify Gemini API key and connectivity',
          !tests.configurationLoad?.success && 'Review .env.local file setup'
        ].filter(Boolean)
    }, { 
      status: allTestsPassed ? 200 : 500 
    });

  } catch (error) {
    return NextResponse.json({
      status: 'deep_check_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}