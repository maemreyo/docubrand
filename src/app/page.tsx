// UPDATED: 2025-07-03 - Added verification step with VerificationUI component

'use client';

import { useState } from 'react';
import { BrandKit } from '@/components/BrandKit';
import { FileUpload } from '@/components/FileUpload';
import { VerificationUI } from '@/components/VerificationUI';
import { useBrandKit } from '@/lib/brand-kit';
import { useDocuBrandAPI } from '@/lib/api-client';
import { ProcessingStatus, PDFProcessingResult } from '@/types';
import { GeminiAnalysisResponse } from '@/types/gemini';

type WorkflowStep = 'upload' | 'processing' | 'verification' | 'generating' | 'complete';

export default function HomePage() {
  const { 
    brandKit, 
    isLoaded, 
    updateLogo, 
    updateColor,
    updateSecondaryColor,
    updateAccentColor,
    updateFont,
    updateHeaderFont,
    updateWatermark,
    updateFooterText,
    resetBrandKit 
  } = useBrandKit();
  const { analyzePDF } = useDocuBrandAPI();

  // State management
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ status: 'idle' });
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [editedAnalysisResult, setEditedAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [processingResult, setProcessingResult] = useState<PDFProcessingResult | null>(null);

  // Handle file upload and AI analysis
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setCurrentStep('processing');
    setProcessingStatus({ status: 'processing', message: 'Uploading file...' });

    try {
      // Call AI analysis API
      const result = await analyzePDF(
        {
          file,
          documentType: detectDocumentType(file.name),
          language: 'en'
        },
        (stage) => {
          setProcessingStatus({ status: 'processing', message: stage });
        }
      );

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setEditedAnalysisResult(result.data);
        setProcessingStatus({ status: 'ready', message: 'Analysis complete! Ready for review.' });
        setCurrentStep('verification');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      setProcessingStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Analysis failed' 
      });
      setCurrentStep('upload');
    }
  };

  // Handle content updates from verification UI
  const handleContentUpdated = (updatedResult: GeminiAnalysisResponse) => {
    setEditedAnalysisResult(updatedResult);
  };

  // Handle approval to generate branded PDF
  const handleApproveContent = async () => {
    if (!editedAnalysisResult || !uploadedFile) return;

    setCurrentStep('generating');
    setProcessingStatus({ status: 'processing', message: 'Generating branded PDF...' });

    try {
      // Import PDF processor dynamically
      const { PDFProcessor } = await import('@/lib/pdf-processor');
      const { downloadPDF, generateBrandedFilename } = await import('@/lib/download');
      
      const processor = new PDFProcessor();
      
      // Process with verified content and branding
      const result = await processor.processDocument(uploadedFile, brandKit, editedAnalysisResult);
      
      setProcessingResult(result);
      setProcessingStatus({ status: 'ready', message: 'Branded PDF ready for download!' });
      setCurrentStep('complete');
      
      // Auto-download the file
      if (result.brandedPdf) {
        const filename = generateBrandedFilename(uploadedFile.name);
        downloadPDF(result.brandedPdf, filename);
      }
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      setProcessingStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to generate PDF' 
      });
      setCurrentStep('verification');
    }
  };

  // Handle rejection - start over
  const handleRejectContent = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setAnalysisResult(null);
    setEditedAnalysisResult(null);
    setProcessingResult(null);
    setProcessingStatus({ status: 'idle' });
  };

  // Handle manual download
  const handleDownload = async () => {
    if (!processingResult?.brandedPdf || !uploadedFile) return;

    try {
      const { downloadPDF, generateBrandedFilename } = await import('@/lib/download');
      const filename = generateBrandedFilename(uploadedFile.name);
      downloadPDF(processingResult.brandedPdf, filename);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Start new document
  const handleStartNew = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setAnalysisResult(null);
    setEditedAnalysisResult(null);
    setProcessingResult(null);
    setProcessingStatus({ status: 'idle' });
  };

  // Utility functions
  const detectDocumentType = (fileName: string): 'quiz' | 'worksheet' | 'general' => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('quiz') || lowerName.includes('test') || lowerName.includes('exam')) {
      return 'quiz';
    }
    if (lowerName.includes('worksheet') || lowerName.includes('exercise') || lowerName.includes('practice')) {
      return 'worksheet';
    }
    return 'general';
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-600">Loading DocuBrand...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DocuBrand</h1>
              <p className="text-sm text-gray-600 mt-1">
                Rebrand your documents. Keep your content.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress Indicator */}
              <WorkflowProgress currentStep={currentStep} />
              
              {currentStep !== 'upload' && (
                <button
                  onClick={handleStartNew}
                  className="btn-secondary text-sm"
                >
                  New Document
                </button>
              )}
              <button
                onClick={resetBrandKit}
                className="btn-secondary text-sm"
              >
                Reset Brand Kit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brand Kit - Collapsible Component */}
        <div className="mb-6">
          <BrandKit
            brandKit={brandKit}
            onLogoChange={updateLogo}
            onColorChange={updateColor}
            onSecondaryColorChange={updateSecondaryColor}
            onAccentColorChange={updateAccentColor}
            onFontChange={updateFont}
            onHeaderFontChange={updateHeaderFont}
            onWatermarkChange={updateWatermark}
            onFooterTextChange={updateFooterText}
          />
        </div>

        {/* Main Content Area - Full Width */}
        <div>
          <div className="space-y-6">
              {/* Step 1: File Upload */}
              {currentStep === 'upload' && (
                <FileUpload
                  onFileUpload={handleFileUpload}
                  uploadedFile={uploadedFile}
                  processingStatus={processingStatus}
                />
              )}

              {/* Step 2: Processing */}
              {currentStep === 'processing' && uploadedFile && (
                <ProcessingView 
                  file={uploadedFile}
                  status={processingStatus}
                />
              )}

              {/* Step 3: Verification */}
              {currentStep === 'verification' && uploadedFile && analysisResult && editedAnalysisResult && (
                <VerificationUI
                  file={uploadedFile}
                  analysisResult={analysisResult}
                  onContentUpdated={handleContentUpdated}
                  onApprove={handleApproveContent}
                  onReject={handleRejectContent}
                />
              )}

              {/* Step 4: Generating */}
              {currentStep === 'generating' && uploadedFile && (
                <GeneratingView 
                  file={uploadedFile}
                  status={processingStatus}
                />
              )}

              {/* Step 5: Complete */}
              {currentStep === 'complete' && uploadedFile && processingResult && (
                <CompletionView
                  file={uploadedFile}
                  brandKit={brandKit}
                  processingResult={processingResult}
                  onDownload={handleDownload}
                  onStartNew={handleStartNew}
                />
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

// Workflow Progress Component
function WorkflowProgress({ currentStep }: { currentStep: WorkflowStep }) {
  const steps = [
    { id: 'upload', label: 'Upload', icon: '📁' },
    { id: 'processing', label: 'Analysis', icon: '🤖' },
    { id: 'verification', label: 'Review', icon: '✏️' },
    { id: 'generating', label: 'Generate', icon: '⚡' },
    { id: 'complete', label: 'Complete', icon: '✅' }
  ];

  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            index === currentIndex
              ? 'bg-blue-100 text-blue-700'
              : index < currentIndex
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span>{step.icon}</span>
          <span className="hidden sm:inline">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// Processing View Component
function ProcessingView({ file, status }: { file: File; status: ProcessingStatus }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Document</h2>
        <p className="text-gray-600 mb-4">
          AI is extracting content from <strong>{file.name}</strong>
        </p>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            {status.message || 'Processing...'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Generating View Component
function GeneratingView({ file, status }: { file: File; status: ProcessingStatus }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="text-6xl mb-4">⚡</div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Branded PDF</h2>
        <p className="text-gray-600 mb-4">
          Applying your branding to <strong>{file.name}</strong>
        </p>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-800">
            {status.message || 'Generating...'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Completion View Component
function CompletionView({ 
  file, 
  brandKit, 
  processingResult, 
  onDownload, 
  onStartNew 
}: {
  file: File;
  brandKit: any;
  processingResult: PDFProcessingResult;
  onDownload: () => void;
  onStartNew: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">PDF Generated Successfully!</h2>
        <p className="text-gray-600">
          Your branded version of <strong>{file.name}</strong> is ready for download.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Results Summary */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-3">Processing Results</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Pages:</span>
              <span className="font-medium">{processingResult.pageCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Elements:</span>
              <span className="font-medium">{processingResult.elements.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Branding:</span>
              <span className="font-medium">Applied ✅</span>
            </div>
          </div>
        </div>

        {/* Brand Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Brand Applied</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Logo:</span>
              <span className="font-medium">{brandKit.logo.dataUrl ? '✅' : '❌'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Color:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: brandKit.color }}
                />
                <span className="font-medium text-xs">{brandKit.color.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Font:</span>
              <span className="font-medium">{brandKit.font}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onDownload}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <span>📥</span>
          Download Branded PDF
        </button>
        <button
          onClick={onStartNew}
          className="btn-secondary px-6 py-3"
        >
          Create Another Document
        </button>
      </div>
    </div>
  );
}