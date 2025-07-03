'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import '@/app/pdf-viewer.css';

// Dynamically import react-pdf components to ensure they only load on the client
const PDFComponents = dynamic(
  () => import('./PDFComponents'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
);

interface PDFViewerProps {
  file: File | null;
  dataUrl: string | null;
}

export function PDFViewer({ file, dataUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Reset to page 1 when a new file is loaded
  useEffect(() => {
    setPageNumber(1);
    setIsLoading(true);
    setError(null);
  }, [file, dataUrl]);

  // Function to handle document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Function to handle document load error
  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    
    // Create a more user-friendly error message
    let errorMessage = 'Failed to load the PDF document. The file might be corrupted or in an unsupported format.';
    
    if (error.message.includes('version')) {
      errorMessage = 'PDF.js version mismatch. Please refresh the page to try again.';
    } else if (error.message.includes('worker')) {
      errorMessage = 'PDF worker failed to load. Please check your internet connection and try again.';
    }
    
    const userFriendlyError = new Error(errorMessage);
    
    setError(userFriendlyError);
    setIsLoading(false);
  };

  // Navigation functions
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    if (numPages) {
      setPageNumber(prev => Math.min(prev + 1, numPages));
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  // Rotation functions
  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  return (
    <div className="flex flex-col h-full">
      {/* PDF Viewer Toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center justify-between flex-wrap gap-2">
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
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
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
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
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
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium mb-2">Failed to load PDF</p>
            <p className="text-gray-600 text-sm max-w-md">
              {error.message || 'There was an error loading the PDF document. Please try again or use a different file.'}
            </p>
            <button 
              onClick={() => {
                // Try to use a different CDN if there's an error
                if (window.tryNextPdfWorkerCdn) {
                  window.tryNextPdfWorkerCdn();
                }
                setError(null);
                setIsLoading(true);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {(dataUrl || file) && !error && (
          <PDFComponents
            file={dataUrl || file}
            pageNumber={pageNumber}
            scale={scale}
            rotation={rotation}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          />
        )}

        {!dataUrl && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-gray-300 text-4xl mb-4">📄</div>
            <p className="text-gray-600">No PDF document loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}