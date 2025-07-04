'use client';

import React from 'react';

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

interface CompletionScreenProps {
  result: ProcessingResult;
  onDownload: () => void;
  onStartOver: () => void;
}

export function CompletionScreen({ result, onDownload, onStartOver }: CompletionScreenProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <span className="text-green-600 text-3xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">PDF Successfully Generated!</h2>
        <p className="text-gray-600 mt-2">
          Your branded document is ready to download
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Document Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Title</p>
            <p className="font-medium text-gray-900">{result.metadata.title || 'Untitled Document'}</p>
          </div>
          <div>
            <p className="text-gray-500">Subject</p>
            <p className="font-medium text-gray-900">{result.metadata.subject || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Pages</p>
            <p className="font-medium text-gray-900">{result.pageCount}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium text-gray-900">{formatDate(result.metadata.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onDownload}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download PDF
        </button>
        <button
          onClick={onStartOver}
          className="btn-secondary"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}