'use client';

import { useState } from 'react';
import { BrandKit } from '@/components/BrandKit';
import { FileUpload } from '@/components/FileUpload';
import { PDFPreview } from '@/components/PDFPreview';
import { useBrandKit } from '@/lib/brand-kit';
import { ProcessingStatus, PDFProcessingResult } from '@/types';

export default function HomePage() {
  const { brandKit, isLoaded, updateLogo, updateColor, updateFont, resetBrandKit } = useBrandKit();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ status: 'idle' });
  const [processingResult, setProcessingResult] = useState<PDFProcessingResult | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setProcessingStatus({ status: 'processing', message: 'Loading PDF...' });

    try {
      // Import PDF processor dynamically to avoid SSR issues
      const { PDFProcessor } = await import('@/lib/pdf-processor');
      const { downloadPDF, generateBrandedFilename } = await import('@/lib/download');
      
      const processor = new PDFProcessor();
      
      // Update status
      setProcessingStatus({ status: 'processing', message: 'Processing document structure...' });
      
      // Process the document with current brand kit
      const result = await processor.processDocument(file, brandKit);
      
      setProcessingResult(result);
      setProcessingStatus({ status: 'ready', message: 'PDF ready for download' });
      
    } catch (error) {
      console.error('PDF processing failed:', error);
      setProcessingStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to process PDF' 
      });
    }
  };

  const handleDownload = async () => {
    if (!processingResult?.brandedPdf || !uploadedFile) {
      console.error('No branded PDF available for download');
      return;
    }

    try {
      const { downloadPDF, generateBrandedFilename } = await import('@/lib/download');
      const filename = generateBrandedFilename(uploadedFile.name);
      downloadPDF(processingResult.brandedPdf, filename);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading DocuBrand...</div>
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
            <button
              onClick={resetBrandKit}
              className="btn-secondary text-sm"
            >
              Reset Brand Kit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Brand Kit Sidebar */}
          <div className="lg:col-span-1">
            <BrandKit
              brandKit={brandKit}
              onLogoChange={updateLogo}
              onColorChange={updateColor}
              onFontChange={updateFont}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* File Upload */}
              <FileUpload
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
                processingStatus={processingStatus}
              />

              {/* PDF Preview */}
              {uploadedFile && (
                <PDFPreview
                  file={uploadedFile}
                  brandKit={brandKit}
                  processingResult={processingResult}
                  onDownload={handleDownload}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}