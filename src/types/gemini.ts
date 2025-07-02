// CREATED: 2025-07-03 - Gemini API integration types and schemas

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
  maxTokens?: number;
  temperature?: number;
}

export interface GeminiPDFAnalysisRequest {
  pdfBase64: string;
  documentType: 'quiz' | 'worksheet' | 'general';
  language: 'en' | 'vi';
  extractionPrompt: string;
}

export interface DocumentStructure {
  title?: string;
  subject?: string;
  sections: DocumentSection[];
  metadata: DocumentMetadata;
}

export interface DocumentSection {
  id: string;
  type: 'header' | 'question' | 'answer' | 'instruction' | 'content';
  content: string;
  position: {
    page: number;
    order: number;
  };
  formatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    fontSize?: string;
    alignment?: 'left' | 'center' | 'right';
  };
}

export interface DocumentMetadata {
  totalPages: number;
  language: string;
  documentType: string;
  extractionConfidence: number;
  questionsCount?: number;
  sectionsCount: number;
}

export interface ExtractedQuestion {
  id: string;
  number: string; // "1", "1a", "Question 1", etc.
  content: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'fill_blank' | 'true_false';
  options?: string[]; // For multiple choice
  correctAnswer?: string;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeminiAnalysisResponse {
  success: boolean;
  documentStructure: DocumentStructure;
  extractedQuestions: ExtractedQuestion[];
  extractedContent: {
    title: string;
    subtitle?: string;
    instructions: string[];
    rawText: string;
  };
  processingInfo: {
    model: string;
    tokensUsed: number;
    processingTime: number;
    confidence: number;
  };
  errors?: string[];
}

// Gemini API Response Types (from Google)
export interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface GeminiAPIRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string; // base64 encoded
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: object; // For structured output
  };
}

// Error types
export interface GeminiError {
  code: number;
  message: string;
  status: string;
  details?: Array<{
    '@type': string;
    reason?: string;
    domain?: string;
    metadata?: Record<string, string>;
  }>;
}