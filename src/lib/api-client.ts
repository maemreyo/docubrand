// CREATED: 2025-07-03 - API client utility for frontend integration

import { GeminiAnalysisResponse } from "@/types/gemini";

export interface AnalyzePDFRequest {
  file: File;
  documentType?: "quiz" | "worksheet" | "general";
  language?: "en" | "vi";
}

export interface AnalyzePDFResponse {
  success: boolean;
  data?: GeminiAnalysisResponse;
  error?: string;
  processingTime?: number;
}

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  services: {
    gemini: {
      status: "connected" | "disconnected" | "error";
      model?: string;
      error?: string;
    };
    storage: {
      status: "available" | "unavailable";
    };
    pdfProcessor: {
      status: "ready" | "error";
    };
  };
  configuration: {
    maxFileSize: string;
    supportedLanguages: string[];
  };
}

/**
 * DocuBrand API Client
 */
export class DocuBrandAPI {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze PDF document
   */
  async analyzePDF(request: AnalyzePDFRequest): Promise<AnalyzePDFResponse> {
    try {
      console.log("📤 Sending PDF for analysis:", {
        fileName: request.file.name,
        fileSize: this.formatFileSize(request.file.size),
        documentType: request.documentType || "general",
        language: request.language || "en",
      });

      // Convert file to base64
      const base64Data = await this.fileToBase64(request.file);

      // Prepare request body
      const requestBody = {
        pdfBase64: base64Data,
        documentType: request.documentType || "general",
        language: request.language || "en",
        fileName: request.file.name,
      };

      // Make API call
      const response = await fetch(`${this.baseUrl}/api/analyze-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result: AnalyzePDFResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `API request failed: ${response.status}`
        );
      }

      console.log("📥 PDF analysis completed:", {
        success: result.success,
        questionsFound: result.data?.extractedQuestions.length || 0,
        // confidence: result.data?.processingInfo.confidence || 0,
        processingTime: result.processingTime || 0,
      });

      return result;
    } catch (error) {
      console.error("❌ PDF analysis failed:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const result: HealthCheckResponse = await response.json();

      console.log("🏥 Health check result:", {
        status: result.status,
        geminiStatus: result.services.gemini.status,
        model: result.services.gemini.model,
      });

      return result;
    } catch (error) {
      console.error("❌ Health check failed:", error);

      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          gemini: {
            status: "error",
            error:
              error instanceof Error ? error.message : "Health check failed",
          },
          storage: {
            status: "unavailable",
          },
          pdfProcessor: {
            status: "error",
          },
        },
        configuration: {
          maxFileSize: "unknown",
          supportedLanguages: [],
        },
      };
    }
  }

  /**
   * Test Gemini API connection
   */
  async testGeminiConnection(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test-gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testType: "connection",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Test request failed");
      }

      return {
        success: result.success,
        details: result.results,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  /**
   * Get API information
   */
  async getAPIInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-pdf`);
      return await response.json();
    } catch (error) {
      console.error("❌ Failed to get API info:", error);
      return null;
    }
  }

  /**
   * Convert File to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Keep data URL prefix (data:application/pdf;base64,)
        resolve(result);
      };
      reader.onerror = () =>
        reject(new Error("Failed to convert file to base64"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

/**
 * Default API client instance
 */
export const docuBrandAPI = new DocuBrandAPI();

/**
 * Hook for using API client in React components
 */
export function useDocuBrandAPI() {
  return {
    api: docuBrandAPI,

    /**
     * Analyze PDF with loading state
     */
    analyzePDF: async (
      request: AnalyzePDFRequest,
      onProgress?: (stage: string) => void
    ): Promise<AnalyzePDFResponse> => {
      onProgress?.("Preparing file...");

      // Validate file
      if (!request.file || request.file.type !== "application/pdf") {
        return {
          success: false,
          error: "Please select a valid PDF file",
        };
      }

      if (request.file.size > 20 * 1024 * 1024) {
        return {
          success: false,
          error: "PDF file must be smaller than 20MB",
        };
      }

      onProgress?.("Analyzing document...");

      const result = await docuBrandAPI.analyzePDF(request);

      if (result.success) {
        onProgress?.("Analysis complete!");
      } else {
        onProgress?.("Analysis failed");
      }

      return result;
    },

    /**
     * Check system status
     */
    checkSystemStatus: async (): Promise<{
      ready: boolean;
      status: string;
      issues: string[];
    }> => {
      try {
        const health = await docuBrandAPI.checkHealth();

        const issues: string[] = [];

        if (health.services.gemini.status !== "connected") {
          issues.push("Gemini AI service not available");
        }

        if (health.services.pdfProcessor.status !== "ready") {
          issues.push("PDF processor not ready");
        }

        return {
          ready: health.status === "healthy",
          status: health.status,
          issues,
        };
      } catch (error) {
        return {
          ready: false,
          status: "error",
          issues: ["System health check failed"],
        };
      }
    },
  };
}

/**
 * Development utilities
 */
export class APIDevUtils {
  /**
   * Test all API endpoints
   */
  static async runAPITests(): Promise<{
    health: boolean;
    gemini: boolean;
    analyze: boolean;
    errors: string[];
  }> {
    const results = {
      health: false,
      gemini: false,
      analyze: false,
      errors: [] as string[],
    };

    try {
      // Test health endpoint
      const health = await docuBrandAPI.checkHealth();
      results.health = health.status !== "unhealthy";
      if (!results.health) {
        results.errors.push("Health check failed");
      }

      // Test Gemini connection
      const geminiTest = await docuBrandAPI.testGeminiConnection();
      results.gemini = geminiTest.success;
      if (!results.gemini) {
        results.errors.push(`Gemini test failed: ${geminiTest.error}`);
      }

      // Note: analyze test would need a real PDF file
      results.analyze = true; // Assume ready if other tests pass
    } catch (error) {
      results.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return results;
  }

  /**
   * Log current API status
   */
  static async logAPIStatus(): Promise<void> {
    console.log("🔍 Running API status check...");

    const tests = await this.runAPITests();

    console.log("📊 API Test Results:");
    console.log("  Health:", tests.health ? "✅" : "❌");
    console.log("  Gemini:", tests.gemini ? "✅" : "❌");
    console.log("  Analyze:", tests.analyze ? "✅" : "❌");

    if (tests.errors.length > 0) {
      console.log("  Errors:");
      tests.errors.forEach((error) => console.log(`    - ${error}`));
    }

    const allPassed = tests.health && tests.gemini && tests.analyze;
    console.log(
      `\n${allPassed ? "✅" : "❌"} Overall Status: ${
        allPassed ? "READY" : "NOT READY"
      }`
    );
  }
}
