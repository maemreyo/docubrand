// UPDATED: 2025-07-03 - Enhanced error handling and retry mechanisms for PDF worker

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import '@/app/pdf-viewer.css';

// Dynamically import PDFComponents with enhanced loading
const PDFComponents = dynamic(
  () => import('./PDFComponents'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-sm text-gray-600">Initializing PDF viewer...</p>
      </div>
    )
  }
);

interface PDFViewerProps {
  file: File | null;
  dataUrl: string | null;
}

interface ErrorState {
  error: Error | null;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
}

export function PDFViewer({ file, dataUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Enhanced error state management
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    retryCount: 0,
    maxRetries: 3,
    isRetrying: false,
  });

  // Worker health check
  const [workerStatus, setWorkerStatus] = useState<'unknown' | 'healthy' | 'failed'>('unknown');

  // Reset state when file changes
  useEffect(() => {
    setPageNumber(1);
    setIsLoading(true);
    setErrorState({
      error: null,
      retryCount: 0,
      maxRetries: 3,
      isRetrying: false,
    });
    setWorkerStatus('unknown');
  }, [file, dataUrl]);

  // Worker health check function
  const checkWorkerHealth = useCallback(async () => {
    if (typeof window !== 'undefined' && window.testPdfWorker) {
      try {
        const isHealthy = await window.testPdfWorker();
        setWorkerStatus(isHealthy ? 'healthy' : 'failed');
        return isHealthy;
      } catch {
        setWorkerStatus('failed');
        return false;
      }
    }
    return false;
  }, []);

  // Enhanced document load success handler
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log(`✅ PDF loaded successfully: ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
    setWorkerStatus('healthy');
    setErrorState(prev => ({ ...prev, error: null, retryCount: 0 }));
  }, []);

  // Enhanced error handler with retry logic
  const onDocumentLoadError = useCallback(async (error: Error) => {
    console.error('📄 PDF Load Error:', error);
    
    setIsLoading(false);
    
    // Classify error type
    const errorMessage = error.message.toLowerCase();
    let errorType = 'unknown';
    let isRetryable = false;
    let userMessage = 'Failed to load PDF document.';
    
    if (errorMessage.includes('worker')) {
      errorType = 'worker';
      isRetryable = true;
      userMessage = 'PDF worker failed to load. This might be a network issue.';
    } else if (errorMessage.includes('version') || errorMessage.includes('mismatch')) {
      errorType = 'version';
      isRetryable = true;
      userMessage = 'PDF.js version conflict detected.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('load')) {
      errorType = 'network';
      isRetryable = true;
      userMessage = 'Network error loading PDF.';
    } else if (errorMessage.includes('invalid') || errorMessage.includes('corrupt')) {
      errorType = 'corrupt';
      isRetryable = false;
      userMessage = 'The PDF file appears to be corrupted or in an unsupported format.';
    }
    
    console.log(`🔍 Error classified as: ${errorType} (retryable: ${isRetryable})`);
    
    const enhancedError = new Error(userMessage);
    enhancedError.name = `PDFError_${errorType}`;
    
    setErrorState(prev => ({
      ...prev,
      error: enhancedError,
      maxRetries: isRetryable ? 3 : 0,
    }));
    
    setWorkerStatus('failed');
  }, []);

  // Retry mechanism
  const handleRetry = useCallback(async () => {
    const { retryCount, maxRetries } = errorState;
    
    if (retryCount >= maxRetries) {
      console.log('🚫 Max retries reached');
      return;
    }
    
    setErrorState(prev => ({ ...prev, isRetrying: true }));
    setIsLoading(true);
    
    console.log(`🔄 Retry attempt ${retryCount + 1}/${maxRetries}`);
    
    // Try different worker sources
    if (typeof window !== 'undefined' && window.tryNextPdfWorkerSource) {
      window.tryNextPdfWorkerSource();
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check worker health
    const isWorkerHealthy = await checkWorkerHealth();
    
    if (isWorkerHealthy) {
      console.log('✅ Worker health check passed, retrying...');
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        isRetrying: false,
        error: null,
      }));
    } else {
      console.log('❌ Worker health check failed');
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        isRetrying: false,
      }));
      setIsLoading(false);
    }
  }, [errorState, checkWorkerHealth]);

  // Page navigation functions
  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    if (numPages) {
      setPageNumber(prev => Math.min(prev + 1, numPages));
    }
  }, [numPages]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  // Rotation functions
  const rotateClockwise = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const rotateCounterClockwise = useCallback(() => {
    setRotation(prev => (prev - 90 + 360) % 360);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced PDF Viewer Toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center justify-between flex-wrap gap-2">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            workerStatus === 'healthy' ? 'bg-green-500' :
            workerStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <span className="text-xs text-gray-600">
            {workerStatus === 'healthy' ? 'Ready' :
             workerStatus === 'failed' ? 'Error' : 'Loading'}
          </span>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
            aria-label="Previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-sm">
            Page {pageNumber} of {numPages || '?'}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={numPages === null || pageNumber >= numPages}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
            aria-label="Next page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-sm whitespace-nowrap">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={resetZoom}
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>

        {/* Rotation Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={rotateCounterClockwise}
            className="p-1 rounded hover:bg-gray-200"
            aria-label="Rotate counterclockwise"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={rotateClockwise}
            className="p-1 rounded hover:bg-gray-200"
            aria-label="Rotate clockwise"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center"
      >
        {isLoading && !errorState.isRetrying && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
            {workerStatus === 'unknown' && (
              <p className="text-xs text-gray-500 mt-2">Initializing PDF worker...</p>
            )}
          </div>
        )}

        {errorState.isRetrying && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-orange-600">Retrying...</p>
            <p className="text-xs text-gray-500 mt-2">
              Attempt {errorState.retryCount + 1} of {errorState.maxRetries}
            </p>
          </div>
        )}

        {errorState.error && !errorState.isRetrying && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium mb-2">Failed to load PDF</p>
            <p className="text-gray-600 text-sm max-w-md mb-4">
              {errorState.error.message}
            </p>
            
            {/* Enhanced action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {errorState.retryCount < errorState.maxRetries && (
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again ({errorState.maxRetries - errorState.retryCount} attempts left)
                </button>
              )}
              
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            
            {/* Diagnostic info */}
            <details className="mt-4 text-xs text-gray-500">
              <summary className="cursor-pointer">Technical Details</summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-left">
                <p>Error Type: {errorState.error.name}</p>
                <p>Worker Status: {workerStatus}</p>
                <p>Retry Count: {errorState.retryCount}/{errorState.maxRetries}</p>
              </div>
            </details>
          </div>
        )}

        {(dataUrl || file) && !errorState.error && !isLoading && (
          <PDFComponents
            file={dataUrl || file}
            pageNumber={pageNumber}
            scale={scale}
            rotation={rotation}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          />
        )}

        {!dataUrl && !file && !isLoading && !errorState.error && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-gray-300 text-4xl mb-4">📄</div>
            <p className="text-gray-600">No PDF document loaded</p>
            <p className="text-xs text-gray-500 mt-2">Upload a PDF file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}