export interface BrandKit {
  logo: {
    file: File | null;
    dataUrl: string | null;
  };
  color: string; // hex color
  font: string; // Google Font family name
}

export interface QuizElement {
  type: 'title' | 'question' | 'answer' | 'text';
  content: string;
  position: {
    x: number;
    y: number;
  };
  originalFont: string;
  originalSize: number;
}

export interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
  message?: string;
  progress?: number;
}

export interface PDFProcessingResult {
  originalPdf: Uint8Array;
  brandedPdf: Uint8Array | null;
  elements: QuizElement[];
  pageCount: number;
}