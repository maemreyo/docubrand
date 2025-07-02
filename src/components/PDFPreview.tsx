'use client';

import { BrandKit as BrandKitType, PDFProcessingResult } from '@/types';

interface PDFPreviewProps {
  file: File;
  brandKit: BrandKitType;
  processingResult: PDFProcessingResult | null;
  onDownload: () => void;
}

export function PDFPreview({ file, brandKit, processingResult, onDownload }: PDFPreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
        {processingResult && (
          <button
            onClick={onDownload}
            className="btn-primary flex items-center gap-2"
          >
            <span>📥</span>
            Download Branded PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original PDF Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Original Document</h3>
          <div className="border border-gray-200 rounded-lg aspect-[8.5/11] bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">📄</div>
              <p className="text-sm text-gray-600">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                PDF preview will be implemented
              </p>
            </div>
          </div>
        </div>

        {/* Branded PDF Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">With Your Branding</h3>
          <div className="border border-gray-200 rounded-lg aspect-[8.5/11] bg-gray-50 flex items-center justify-center relative">
            {/* Brand Kit Preview */}
            <div className="absolute top-4 left-4 right-4">
              <div className="flex items-center gap-3">
                {brandKit.logo.dataUrl && (
                  <img
                    src={brandKit.logo.dataUrl}
                    alt="Logo"
                    className="w-8 h-8 object-contain"
                  />
                )}
                <div 
                  className="px-3 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: brandKit.color }}
                >
                  {brandKit.font}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">✨</div>
              <p className="text-sm text-gray-600">Branded Preview</p>
              <p className="text-xs text-gray-500 mt-1">
                Processing engine coming next
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Results Info */}
      {processingResult && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-900 mb-3">Processing Complete ✅</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700">Pages:</span>
              <span className="ml-2 text-green-900 font-medium">
                {processingResult.pageCount}
              </span>
            </div>
            <div>
              <span className="text-green-700">Elements:</span>
              <span className="ml-2 text-green-900 font-medium">
                {processingResult.elements.length}
              </span>
            </div>
            <div>
              <span className="text-green-700">Status:</span>
              <span className="ml-2 text-green-900 font-medium">
                Ready
              </span>
            </div>
          </div>
          
          {/* Elements breakdown */}
          {processingResult.elements.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <span className="text-xs text-green-700">Detected elements: </span>
              <span className="text-xs text-green-900">
                {processingResult.elements.map(el => el.type).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Brand Kit Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Current Brand Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Logo:</span>
            <span className="ml-2 text-gray-900">
              {brandKit.logo.dataUrl ? '✅ Uploaded' : '❌ None'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Color:</span>
            <span className="ml-2 text-gray-900 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: brandKit.color }}
              />
              {brandKit.color.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Font:</span>
            <span className="ml-2 text-gray-900">{brandKit.font}</span>
          </div>
        </div>
      </div>
    </div>
  );
}