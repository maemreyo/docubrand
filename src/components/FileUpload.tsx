'use client';

import { useRef, useState } from 'react';
import { ProcessingStatus } from '@/types';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  processingStatus: ProcessingStatus;
}

export function FileUpload({ onFileUpload, uploadedFile, processingStatus }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Please select a PDF file';
    }

    // Check file size (max 10MB for MVP)
    if (file.size > 10 * 1024 * 1024) {
      return 'PDF file size must be less than 10MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    onFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF Document</h2>
      
      {!uploadedFile ? (
        <div
          className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">📄</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your PDF here or click to browse
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Supports PDF files up to 10MB
              </p>
              <p className="text-xs text-gray-500 mt-2">
                MVP: English quiz documents only
              </p>
            </div>
            <button className="btn-primary">
              Select PDF File
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl">📄</div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{uploadedFile.name}</h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(uploadedFile.size)} • PDF Document
              </p>
            </div>
            {processingStatus.status === 'idle' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                Change File
              </button>
            )}
          </div>

          {/* Processing Status */}
          {processingStatus.status !== 'idle' && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                {processingStatus.status === 'processing' && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                )}
                {processingStatus.status === 'ready' && (
                  <div className="text-green-600 text-lg">✅</div>
                )}
                {processingStatus.status === 'error' && (
                  <div className="text-red-600 text-lg">❌</div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {processingStatus.status === 'processing' && 'Processing PDF...'}
                    {processingStatus.status === 'ready' && 'Ready for download'}
                    {processingStatus.status === 'error' && 'Processing failed'}
                  </p>
                  {processingStatus.message && (
                    <p className="text-xs text-gray-600 mt-1">
                      {processingStatus.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}