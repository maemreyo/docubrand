// CREATED: 2025-07-03 - PDF analysis API endpoint using Gemini

import { NextRequest, NextResponse } from "next/server";
import { GeminiConfigManager } from "@/lib/gemini-config";
import { GeminiService } from "@/lib/gemini-service";
import { GeminiAnalysisRequest, GeminiAnalysisResponse } from "@/types/gemini";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout for PDF processing

// Check if we're in development mode
const isDevelopmentMode = process.env.NEXT_PUBLIC_APP_ENV === "development";

/**
 * Load sample response for development mode
 */
function loadSampleResponse(): GeminiAnalysisResponse {
  try {
    const samplePath = path.join(process.cwd(), "sampleResponse.json");
    const sampleData = fs.readFileSync(samplePath, "utf8");
    
    // Ensure the JSON is valid before parsing
    try {
      const parsedData = JSON.parse(sampleData);
      
      // Validate that the parsed data has the expected structure
      if (!parsedData || !parsedData.data) {
        throw new Error("Sample response does not contain a 'data' field");
      }
      
      // Validate that the data field contains the required properties
      const { documentStructure, extractedContent, extractedQuestions } = parsedData.data;
      if (!documentStructure || !extractedContent || !Array.isArray(extractedQuestions)) {
        throw new Error("Sample response data is missing required fields");
      }
      
      return parsedData.data;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      
      // Try to identify the specific JSON syntax error
      if (parseError instanceof Error) {
        const errorMessage = parseError.message;
        if (errorMessage.includes("position")) {
          // Extract the position number from the error message
          const positionMatch = errorMessage.match(/position (\d+)/);
          const position = positionMatch ? parseInt(positionMatch[1]) : -1;
          
          // Show the problematic part of the JSON
          if (position >= 0) {
            const start = Math.max(0, position - 20);
            const end = Math.min(sampleData.length, position + 20);
            const snippet = sampleData.substring(start, end);
            console.error(`JSON error near: "${snippet}"`);
          }
        }
      }
      
      throw new Error(`Failed to parse sample response JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Failed to load sample response:", error);
    throw new Error(`Failed to load sample response for development mode: ${error.message}`);
  }
}

interface APIRequest {
  pdfBase64: string;
  documentType?: "quiz" | "worksheet" | "general";
  language?: "en" | "vi";
  fileName?: string;
}

interface APIResponse {
  success: boolean;
  data?: GeminiAnalysisResponse;
  error?: string;
  processingTime?: number;
}

/**
 * POST /api/analyze-pdf
 * Analyze PDF document using Gemini AI
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse>> {
  const startTime = Date.now();

  try {
    console.log("📄 PDF Analysis API called");

    // Validate environment configuration
    const envValidation = GeminiConfigManager.validateEnvironment();
    if (!envValidation.valid) {
      console.error("❌ Environment validation failed:", envValidation.errors);
      return NextResponse.json(
        {
          success: false,
          error: `Configuration error: ${envValidation.errors.join(", ")}`,
        },
        { status: 500 }
      );
    }

    // Handle FormData request
    let pdfBase64 = "";
    let documentTypeRaw = "general";
    let language = "en";
    let fileName = "unknown";
    
    // Check if the request is FormData or JSON
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      try {
        // Handle FormData
        const formData = await request.formData();
        const file = formData.get("file") as File;
        
        if (!file) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing file in form data",
            },
            { status: 400 }
          );
        }
        
        // Get file details
        fileName = file.name;
        const fileSize = file.size;
        
        // Check file size
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (fileSize > maxSize) {
          return NextResponse.json(
            {
              success: false,
              error: "PDF file too large. Maximum size is 20MB.",
            },
            { status: 413 }
          );
        }
        
        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        pdfBase64 = buffer.toString("base64");
        
        // Get optional parameters
        documentTypeRaw = (formData.get("documentType") as string) || "general";
        language = (formData.get("language") as string) || "en";
        
        console.log("📋 Analysis request details (FormData):", {
          fileName,
          fileSize: Math.round(fileSize / 1024 / 1024) + "MB",
          documentType: documentTypeRaw,
          language,
        });
      } catch (error) {
        console.error("❌ Error processing FormData:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to process form data: " + (error instanceof Error ? error.message : "Unknown error"),
          },
          { status: 400 }
        );
      }
    } else {
      // Handle JSON request
      try {
        const body: APIRequest = await request.json();
        
        // Validate required fields
        if (!body.pdfBase64) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing required field: pdfBase64",
            },
            { status: 400 }
          );
        }
        
        pdfBase64 = body.pdfBase64;
        documentTypeRaw = body.documentType || "general";
        language = body.language || "en";
        fileName = body.fileName || "unknown";
        
        // Check PDF size (estimate from base64)
        const estimatedSize = (pdfBase64.length * 3) / 4; // Base64 to bytes conversion
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (estimatedSize > maxSize) {
          return NextResponse.json(
            {
              success: false,
              error: "PDF file too large. Maximum size is 20MB.",
            },
            { status: 413 }
          );
        }
        
        console.log("📋 Analysis request details (JSON):", {
          documentType: documentTypeRaw,
          language,
          fileName,
          estimatedSizeMB: Math.round(estimatedSize / 1024 / 1024),
        });
      } catch (error) {
        console.error("❌ Error processing JSON request:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to parse JSON request: " + (error instanceof Error ? error.message : "Unknown error"),
          },
          { status: 400 }
        );
      }
    }

    // Validate document type
    const validDocumentTypes: ("quiz" | "worksheet" | "general")[] = ["quiz", "worksheet", "general"];
    const documentType = validDocumentTypes.includes(documentTypeRaw as any) ? documentTypeRaw : "general";
    if (documentType !== documentTypeRaw) {
        console.warn(`Invalid document type received: \"${documentTypeRaw}\". Defaulting to \"${documentType}\".`);
    }

    // Use sample response in development mode or call Gemini API in production
    let analysisResult: GeminiAnalysisResponse;

    if (isDevelopmentMode) {
      console.log(
        "🧪 Development mode: Using sample response instead of calling Gemini API"
      );
      try {
        analysisResult = loadSampleResponse();
      } catch (error) {
        console.error("❌ Failed to load sample response:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to load sample response: " + (error instanceof Error ? error.message : "Unknown error"),
          },
          { status: 500 }
        );
      }
    } else {
      // Create Gemini service
      const geminiService = await GeminiConfigManager.getService();

      // Prepare analysis request
      const analysisRequest: GeminiAnalysisRequest = {
        pdfBase64: `data:application/pdf;base64,${pdfBase64}`,
        documentType: documentType as any,
        language: language as any,
      };

      // Perform analysis
      analysisResult = await geminiService.analyzePDF(analysisRequest);
    }

    const processingTime = Date.now() - startTime;

    console.log("✅ PDF analysis completed successfully:", {
      questionsFound: analysisResult.extractedQuestions.length,
      sectionsFound: analysisResult.documentStructure.sections.length,
      processingTimeMs: processingTime,
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: transformAnalysisData(analysisResult),
      processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("❌ PDF analysis failed:", error);

    // Handle specific error types
    let statusCode = 500;
    let errorMessage = "Internal server error during PDF analysis";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Map specific errors to appropriate status codes
      if (errorMessage.includes("API key")) statusCode = 401;
      else if (errorMessage.includes("rate limit")) statusCode = 429;
      else if (errorMessage.includes("too large")) statusCode = 413;
      else if (errorMessage.includes("Invalid request")) statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        processingTime,
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/analyze-pdf
 * Get API information and status
 */
export async function GET(): Promise<NextResponse> {
  try {
    const envValidation = GeminiConfigManager.validateEnvironment();

    return NextResponse.json({
      service: "DocuBrand PDF Analysis API",
      version: "1.0.0",
      status: isDevelopmentMode
        ? "development_mode"
        : envValidation.valid
        ? "ready"
        : "configuration_error",
      capabilities: [
        "PDF document analysis",
        "Educational content extraction",
        "Question and answer detection",
        "Structured JSON output",
        "Bilingual support (EN/VI)",
      ],
      limits: {
        maxFileSize: "20MB",
        supportedFormats: ["PDF"],
        timeout: "60 seconds",
        models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
      },
      environment: isDevelopmentMode
        ? "development_with_sample_data"
        : envValidation.valid
        ? "configured"
        : envValidation.errors,
      devMode: isDevelopmentMode
        ? "Using sample response from sampleResponse.json"
        : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        service: "DocuBrand PDF Analysis API",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



/**
 * Transforms the raw Gemini analysis data into a structure expected by the frontend.
 * - Groups sections logically (header + content).
 * - Adds a 'question' field to each extracted question for compatibility.
 */
function transformAnalysisData(analysisResult: GeminiAnalysisResponse): GeminiAnalysisResponse {
  // 1. Process and group sections
  const processedSections = [];
  let currentSection: { title: string; content: string; originalSections: any[] } | null = null;

  analysisResult.documentStructure.sections.forEach(rawSection => {
    if (rawSection.semanticRole === 'header' || rawSection.semanticRole === 'title') {
      if (currentSection && currentSection.content) {
        processedSections.push(currentSection);
      }
      currentSection = {
        title: rawSection.content,
        content: '',
        originalSections: [rawSection]
      };
    } else if (currentSection && rawSection.semanticRole === 'content') {
      currentSection.content += (currentSection.content ? '\n' : '') + rawSection.content;
      currentSection.originalSections.push(rawSection);
    } else {
        processedSections.push({
            title: rawSection.semanticRole || rawSection.type,
            content: rawSection.content,
            originalSections: [rawSection]
        });
    }
  });

  if (currentSection && currentSection.content) {
    processedSections.push(currentSection);
  }

  // 2. Add 'question' field to extractedQuestions
  const processedQuestions = analysisResult.extractedQuestions.map(q => ({
    ...q,
    question: q.content
  }));

  // 3. Return the transformed data structure
  return {
    ...analysisResult,
    documentStructure: {
      ...analysisResult.documentStructure,
      sections: processedSections,
    },
    extractedQuestions: processedQuestions,
  };
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
