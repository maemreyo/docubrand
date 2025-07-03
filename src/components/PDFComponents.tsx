'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up the worker for PDF.js
if (typeof window !== 'undefined') {
  // Define multiple CDN sources for fallback
  const cdnSources = [
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  ];
  
  // Set the worker source to match the API version exactly
  pdfjs.GlobalWorkerOptions.workerSrc = cdnSources[0];
  
  // Log the worker URL for debugging
  console.log(`PDF.js worker loaded from: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
  console.log(`PDF.js API version: ${pdfjs.version}`);
  
  // Add a function to try different CDNs if the first one fails
  let currentCdnIndex = 0;
  window.tryNextPdfWorkerCdn = () => {
    currentCdnIndex = (currentCdnIndex + 1) % cdnSources.length;
    pdfjs.GlobalWorkerOptions.workerSrc = cdnSources[currentCdnIndex];
    console.log(`Trying next PDF.js worker CDN: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
    return pdfjs.GlobalWorkerOptions.workerSrc;
  };
}

// Declare the global window interface to add our custom function
declare global {
  interface Window {
    tryNextPdfWorkerCdn: () => string;
  }
}

interface PDFComponentsProps {
  file: File | string | null;
  pageNumber: number;
  scale: number;
  rotation: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
}

export default function PDFComponents({ 
  file, 
  pageNumber, 
  scale, 
  rotation,
  onLoadSuccess,
  onLoadError
}: PDFComponentsProps) {
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-gray-300 text-4xl mb-4">📄</div>
        <p className="text-gray-600">No PDF document loaded</p>
      </div>
    );
  }

  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      loading={
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
      className="flex justify-center"
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        rotate={rotation}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="shadow-lg"
        loading={
          <div className="flex items-center justify-center h-64 w-48 bg-gray-100 animate-pulse">
            <p className="text-gray-400">Loading page...</p>
          </div>
        }
      />
    </Document>
  );
}