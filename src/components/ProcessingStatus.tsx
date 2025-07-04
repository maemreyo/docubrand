'use client';

import React from 'react';

import { ProcessingStatus as ProcessingStatusType } from '@/types';

interface ProcessingStatusProps extends ProcessingStatusType {
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'error' | 'warning';
  message: string;
  progress?: number;
  details?: string;
}

export function ProcessingStatus({ status, message, progress, details }: ProcessingStatusProps) {
  // Helper function to get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />;
      case 'ready':
        return <div className="text-green-600 text-xl">✅</div>;
      case 'error':
        return <div className="text-red-600 text-xl">❌</div>;
      case 'warning':
        return <div className="text-amber-600 text-xl">⚠️</div>;
      default:
        return null;
    }
  };

  // Helper function to get status color classes
  const getStatusColorClasses = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'ready':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColorClasses()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {status === 'processing' && 'Processing...'}
            {status === 'ready' && 'Complete'}
            {status === 'error' && 'Error'}
            {status === 'warning' && 'Warning'}
            {status === 'idle' && 'Ready'}
          </p>
          {message && (
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          )}
          {details && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Show details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {details}
              </pre>
            </details>
          )}
        </div>
      </div>
      
      {progress !== undefined && progress > 0 && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}