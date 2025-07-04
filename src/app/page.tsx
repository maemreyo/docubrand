// UPDATED: 2025-07-04 - Enhanced PDF generation with better error handling and user feedback

"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { VerificationUI } from "@/components/VerificationUI";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { CompletionScreen } from "@/components/CompletionScreen";
import { GeminiAnalysisResponse } from "@/types/gemini";
import { detectDocumentType } from "@/lib/utils";
import { BrandKit } from "@/types";
import { defaultBrandKit } from "@/lib/storage";
import { templateSystem } from "@/lib/template-system";

type WorkflowStep =
  | "upload"
  | "analyzing"
  | "verification"
  | "generating"
  | "complete";

interface ProcessingState {
  status: "idle" | "processing" | "ready" | "error" | "warning";
  message: string;
  progress?: number;
  details?: string;
}

interface ProcessingResult {
  brandedPdf: Uint8Array;
  originalPdf: Uint8Array;
  pageCount: number;
  elements: any[];
  metadata: {
    title: string;
    subject: string;
    createdAt: string;
  };
}

export default function HomePage() {
  // Core state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<GeminiAnalysisResponse | null>(null);
  const [editedAnalysisResult, setEditedAnalysisResult] =
    useState<GeminiAnalysisResponse | null>(null);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [brandedPdf, setBrandedPdf] = useState<Uint8Array | null>(null);

  // Processing state
  const [processingStatus, setProcessingStatus] = useState<ProcessingState>({
    status: "idle",
    message: "",
  });

  // Configuration
  const [brandKit] = useState<BrandKit>(defaultBrandKit);

  // Initialize template system on app startup
  useEffect(() => {
    templateSystem.initialize().catch(console.error);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("🔍 Current State:", {
      currentStep,
      uploadedFile: uploadedFile?.name,
      analysisResult: !!analysisResult,
      editedAnalysisResult: !!editedAnalysisResult,
      processingResult: !!processingResult,
      brandedPdf: !!brandedPdf,
      processingStatus,
    });
  }, [
    currentStep,
    uploadedFile,
    analysisResult,
    editedAnalysisResult,
    processingResult,
    brandedPdf,
    processingStatus,
  ]);

  // Handle file upload
  const handleFileUpload = (file: File) => {
    console.log("📁 File uploaded:", file.name, file.size, "bytes");
    setUploadedFile(file);
    setCurrentStep("analyzing");
    handleAnalyzeFile(file);
  };

  // Handle AI analysis
  const handleAnalyzeFile = async (file: File) => {
    setProcessingStatus({
      status: "processing",
      message: "Analyzing document with AI...",
      progress: 0,
    });

    try {
      console.log("🤖 Starting AI analysis for:", file.name);

      // Create FormData and add the file
      const formData = new FormData();
      formData.append("file", file);

      // Add document type based on filename
      const docType = detectDocumentType(file.name);
      formData.append("documentType", docType);

      // Add language (default to English)
      formData.append("language", "en");

      console.log("📤 Sending analysis request with document type:", docType);

      // Show progress updates
      const progressInterval = setInterval(() => {
        setProcessingStatus((prev) => ({
          ...prev,
          progress: Math.min((prev.progress || 0) + 10, 90),
        }));
      }, 1000);

      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Analysis API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `Analysis failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ Analysis completed:", result);

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setEditedAnalysisResult(result.data);
        setProcessingStatus({
          status: "ready",
          message: "Analysis complete! Ready for review.",
          progress: 100,
        });
        setCurrentStep("verification");
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      console.error("❌ Analysis failed:", error);
      setProcessingStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Analysis failed",
        details: error instanceof Error ? error.stack : undefined,
      });
      setCurrentStep("upload");
    }
  };

  // Handle content updates from verification UI
  const handleContentUpdated = (updatedResult: GeminiAnalysisResponse) => {
    console.log("📝 Content updated:", updatedResult);
    setEditedAnalysisResult(updatedResult);
  };

  // Enhanced PDF generation with comprehensive error handling
  const handleApproveContent = async () => {
    console.log("🚀 PDF Generation Started");
    console.log("📊 Input Data:", {
      editedAnalysisResult: !!editedAnalysisResult,
      uploadedFile: uploadedFile?.name,
      brandKit: !!brandKit,
      fileSize: uploadedFile?.size,
      analysisResultSize: editedAnalysisResult
        ? Object.keys(editedAnalysisResult).length
        : 0,
    });

    // Validation
    if (!editedAnalysisResult || !uploadedFile) {
      const errorMsg = `Missing required data: ${
        !editedAnalysisResult ? "analysis result" : ""
      } ${!uploadedFile ? "uploaded file" : ""}`;
      console.error("❌ Validation failed:", errorMsg);
      setProcessingStatus({
        status: "error",
        message: errorMsg,
      });
      alert(errorMsg);
      return;
    }

    // Start processing
    setCurrentStep("generating");
    setProcessingStatus({
      status: "processing",
      message: "Initializing PDF generation...",
      progress: 0,
    });

    try {
      console.log("🔧 Loading PDF processor...");

      // Dynamic imports with error handling
      const [
        { PDFProcessor },
        { downloadPDF, generateBrandedFilename, testPDFValidity },
      ] = await Promise.all([
        import("@/lib/pdf-processor").catch((err) => {
          console.error("❌ Failed to import PDFProcessor:", err);
          throw new Error("Failed to load PDF processor module");
        }),
        import("@/lib/download").catch((err) => {
          console.error("❌ Failed to import download utilities:", err);
          throw new Error("Failed to load download utilities");
        }),
      ]);

      console.log("✅ Modules loaded successfully");

      setProcessingStatus({
        status: "processing",
        message: "Creating PDF processor...",
        progress: 20,
      });

      const processor = new PDFProcessor();
      console.log("✅ PDF processor created");

      // Enhanced progress tracking
      const progressCallbacks = {
        onProgress: (status: any) => {
          console.log("📊 Processing progress:", status);
          setProcessingStatus({
            status: "processing",
            message: status.currentStep || "Processing document...",
            progress: Math.min((status.progress || 0) + 20, 90),
            details: status.details,
          });
        },
        onError: (error: any) => {
          console.error("❌ Processing error callback:", error);
        },
        onWarning: (warning: any) => {
          console.warn("⚠️ Processing warning callback:", warning);
        },
      };

      setProcessingStatus({
        status: "processing",
        message: "Processing document with brand kit...",
        progress: 30,
      });

      console.log("🔄 Starting PDF processing...");
      const result = await processor.processPDF(uploadedFile, brandKit, {
        documentType: detectDocumentType(uploadedFile.name),
        language: "en",
        extractContent: false, // We already have AI-extracted content
        applyBranding: true,
        ...progressCallbacks,
      });

      console.log("🎉 PDF processing completed:", {
        success: result.success,
        hasResult: !!result.brandedPdf,
        pageCount: result.metadata?.pages,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0,
      });

      if (!result.success) {
        const errorMsg = result.errors?.join(", ") || "PDF processing failed";
        console.error("❌ PDF processing failed:", result.errors);
        throw new Error(errorMsg);
      }

      if (!result.brandedPdf) {
        console.error("❌ No branded PDF in result");
        throw new Error("PDF generation failed - no output received");
      }

      setProcessingStatus({
        status: "processing",
        message: "Validating generated PDF...",
        progress: 90,
      });

      // Validate PDF
      console.log("🔍 Validating PDF...");
      const validation = await testPDFValidity(result.brandedPdf);
      console.log("✅ PDF validation result:", validation);

      if (!validation.isValid) {
        console.warn("⚠️ PDF validation failed:", validation.error);
        setProcessingStatus({
          status: "warning",
          message: `PDF generated but may have issues: ${validation.error}`,
          progress: 100,
        });
      } else {
        setProcessingStatus({
          status: "ready",
          message: "PDF generated successfully!",
          progress: 100,
        });
      }

      // Create processing result
      const processingResult: ProcessingResult = {
        brandedPdf: result.brandedPdf,
        originalPdf: new Uint8Array(await uploadedFile.arrayBuffer()),
        pageCount: result.metadata?.pages || 0,
        elements: [], // Can be populated if needed
        metadata: {
          title: editedAnalysisResult.extractedContent.title || "Document",
          subject:
            editedAnalysisResult.documentStructure.subject ||
            "Educational Material",
          createdAt: new Date().toISOString(),
        },
      };

      setProcessingResult(processingResult);
      setBrandedPdf(result.brandedPdf);

      console.log("🎯 PDF generation completed successfully");
      setCurrentStep("complete");

      // Auto-download after a short delay
      setTimeout(() => {
        try {
          const filename = generateBrandedFilename(uploadedFile.name);
          downloadPDF(result.brandedPdf, filename);
          console.log("⬇️ PDF download initiated:", filename);
        } catch (downloadError) {
          console.error("❌ Auto-download failed:", downloadError);
          setProcessingStatus({
            status: "warning",
            message:
              "PDF ready, but auto-download failed. Use the download button.",
          });
        }
      }, 1500);
    } catch (error) {
      console.error("❌ PDF generation failed:", error);

      // Enhanced error logging
      const errorDetails = {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        inputs: {
          hasFile: !!uploadedFile,
          fileName: uploadedFile?.name,
          fileSize: uploadedFile?.size,
          hasAnalysis: !!editedAnalysisResult,
          hasBrandKit: !!brandKit,
        },
      };

      console.error("📊 Error details:", errorDetails);

      setProcessingStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "PDF generation failed",
        details: error instanceof Error ? error.stack : undefined,
      });

      setCurrentStep("verification");

      // User-friendly error alert
      const userMessage =
        error instanceof Error
          ? `PDF Generation Error: ${error.message}`
          : "PDF generation failed due to an unknown error";

      alert(
        `${userMessage}\n\nPlease try again. If the problem persists, check the console for details.`
      );
    }
  };

  // Handle rejection - start over
  const handleRejectContent = () => {
    console.log("🔄 Workflow reset - starting over");
    setCurrentStep("upload");
    setUploadedFile(null);
    setAnalysisResult(null);
    setEditedAnalysisResult(null);
    setProcessingResult(null);
    setBrandedPdf(null);
    setProcessingStatus({ status: "idle", message: "" });
  };

  // Manual download handler
  const handleDownload = async () => {
    console.log("⬇️ Manual download initiated");

    if (!processingResult?.brandedPdf || !uploadedFile) {
      console.error("❌ Download failed - missing data");
      alert("No PDF available for download");
      return;
    }

    try {
      const { downloadPDF, generateBrandedFilename } = await import(
        "@/lib/download"
      );
      const filename = generateBrandedFilename(uploadedFile.name);
      downloadPDF(processingResult.brandedPdf, filename);
      console.log("✅ Manual download completed:", filename);
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert(
        `Download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Debug function for testing
  const debugPDFGeneration = async () => {
    console.log("🧪 Debug PDF generation test");

    if (!uploadedFile || !editedAnalysisResult) {
      console.error("❌ Debug test failed - missing data");
      return;
    }

    try {
      const { PDFProcessor } = await import("@/lib/pdf-processor");
      const processor = new PDFProcessor();

      console.log("🔧 Running debug test...");
      const result = await processor.processPDF(uploadedFile, brandKit, {
        documentType: detectDocumentType(uploadedFile.name),
        language: "en",
        extractContent: false,
        applyBranding: true,
        onProgress: (status) => {
          console.log("📊 Debug progress:", status);
        },
      });

      console.log("✅ Debug test result:", result);

      if (result.brandedPdf) {
        const { downloadPDF, generateBrandedFilename } = await import(
          "@/lib/download"
        );
        const filename = generateBrandedFilename(uploadedFile.name).replace(
          ".pdf",
          "_DEBUG.pdf"
        );
        downloadPDF(result.brandedPdf, filename);
        console.log("⬇️ Debug PDF downloaded:", filename);
      }
    } catch (error) {
      console.error("❌ Debug test failed:", error);
      alert(
        `Debug test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              DocuBrand AI
            </h1>
            <p className="text-xl text-gray-600">
              Transform educational documents with AI-powered branding
            </p>
          </div>

          {/* Debug Panel (Development only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">Debug Panel</h3>
              <div className="flex gap-2 text-sm">
                <span className="text-yellow-700">Step: {currentStep}</span>
                <span className="text-yellow-700">|</span>
                <span className="text-yellow-700">
                  Status: {processingStatus.status}
                </span>
                {processingStatus.progress && (
                  <>
                    <span className="text-yellow-700">|</span>
                    <span className="text-yellow-700">
                      Progress: {processingStatus.progress}%
                    </span>
                  </>
                )}
              </div>
              {uploadedFile && editedAnalysisResult && (
                <button
                  onClick={debugPDFGeneration}
                  className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
                >
                  Debug PDF Generation
                </button>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {currentStep === "upload" && (
              <div className="p-8">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  uploadedFile={uploadedFile}
                  processingStatus={{
                    status:
                      processingStatus.status === "idle"
                        ? "idle"
                        : processingStatus.status === "processing"
                        ? "processing"
                        : processingStatus.status === "ready"
                        ? "ready"
                        : processingStatus.status === "error"
                        ? "error"
                        : "idle",
                    message: processingStatus.message,
                    progress: processingStatus.progress,
                  }}
                />
              </div>
            )}

            {currentStep === "analyzing" && (
              <div className="p-8">
                <ProcessingStatus
                  status={processingStatus.status}
                  message={processingStatus.message}
                  progress={processingStatus.progress}
                  details={processingStatus.details}
                />
              </div>
            )}

            {currentStep === "verification" && analysisResult && (
              <VerificationUI
                file={uploadedFile!}
                analysisResult={analysisResult}
                onContentUpdated={handleContentUpdated}
                onApprove={handleApproveContent}
                onReject={handleRejectContent}
                isProcessing={false}
              />
            )}

            {currentStep === "generating" && (
              <div className="p-8">
                <ProcessingStatus
                  status={processingStatus.status}
                  message={processingStatus.message}
                  progress={processingStatus.progress}
                  details={processingStatus.details}
                />
              </div>
            )}

            {currentStep === "complete" && processingResult && (
              <CompletionScreen
                result={processingResult}
                onDownload={handleDownload}
                onStartOver={handleRejectContent}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
