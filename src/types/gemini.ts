// UPDATED: 2025-07-03 - Extended types for enhanced editing features

import { ContentType, EnhancedDocumentSection } from './editor';

// Question types and interfaces
export type QuestionType = 
  | 'multiple_choice' 
  | 'short_answer' 
  | 'essay' 
  | 'fill_blank' 
  | 'true_false'
  | 'matching'
  | 'ordering'
  | 'numeric'
  | 'image_based';

export interface ExtractedQuestion {
  id: string;
  number: string;
  content: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  explanation?: string;
  hints?: string[];
  position?: PagePosition;
  confidence?: number;
  
  // Enhanced editing properties
  isEditing?: boolean;
  isDirty?: boolean;
  lastModified?: number;
  validationErrors?: string[];
  isValid?: boolean;
  metadata?: {
    estimatedTime?: number; // in minutes
    bloomsTaxonomy?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    learningObjectives?: string[];
  };
}

// Document section interfaces
export interface PagePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentSection {
  id: string;
  title: string;
  type: string;
  content: string;
  position: PagePosition;
  confidence: number;
  
  // Extended properties for enhanced editing
  formatting?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    backgroundColor?: string;
  };
  
  // Semantic information
  semanticRole?: 'title' | 'subtitle' | 'header' | 'instruction' | 'content' | 'note' | 'reference';
  level?: number; // For hierarchical content (h1, h2, h3, etc.)
  parentId?: string; // For nested content
  children?: string[]; // Child section IDs
  
  // Content analysis
  language?: string;
  readabilityScore?: number;
  keywords?: string[];
  entities?: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'number' | 'other';
    confidence: number;
  }>;
}

// Document structure and metadata
export interface DocumentStructure {
  type: string;
  subject: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number; // in minutes
  language?: string;
  confidence: number;
  sections: DocumentSection[];
  
  // Enhanced document properties
  metadata?: {
    author?: string;
    institution?: string;
    course?: string;
    grade?: string;
    academicYear?: string;
    version?: string;
    lastModified?: number;
    tags?: string[];
    references?: string[];
  };
  
  // Learning analytics
  learningObjectives?: string[];
  prerequisites?: string[];
  assessment?: {
    type: 'formative' | 'summative';
    weight?: number;
    gradingRubric?: string;
  };
  
  // Content organization
  outline?: Array<{
    id: string;
    title: string;
    level: number;
    sectionIds: string[];
    estimatedTime?: number;
  }>;
}

// Content extraction results
export interface ExtractedContent {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  course?: string;
  instructions?: string;
  
  // Enhanced content metadata
  abstract?: string;
  keywords?: string[];
  learningOutcomes?: string[];
  prerequisites?: string[];
  materials?: string[];
  references?: string[];
  
  // Content statistics
  statistics?: {
    wordCount: number;
    pageCount: number;
    questionCount: number;
    sectionCount: number;
    estimatedReadingTime: number; // in minutes
    complexityScore: number; // 0-1 scale
  };
  
  // Quality indicators
  quality?: {
    overallScore: number; // 0-1 scale
    contentClarity: number;
    structureScore: number;
    questionQuality: number;
    instructionClarity: number;
    consistencyScore: number;
  };
}

// Main Gemini Analysis Response
export interface GeminiAnalysisResponse {
  extractedQuestions: ExtractedQuestion[];
  documentStructure: DocumentStructure;
  extractedContent: ExtractedContent;
  
  // Processing metadata
  processingInfo?: {
    timestamp: number;
    version: string;
    model: string;
    processingTime: number; // in milliseconds
    confidence: number;
    
    // Error handling
    warnings?: string[];
    errors?: string[];
    
    // Processing statistics
    tokenCount?: number;
    apiCalls?: number;
    retries?: number;
  };
  
  // Enhanced analysis results
  insights?: {
    contentType: 'quiz' | 'exam' | 'worksheet' | 'assignment' | 'handout' | 'presentation' | 'other';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    completeness: number; // 0-1 scale
    suggestions: string[];
    improvements: Array<{
      type: 'content' | 'structure' | 'formatting' | 'clarity';
      description: string;
      priority: 'low' | 'medium' | 'high';
      sectionId?: string;
      questionId?: string;
    }>;
  };
  
  // Accessibility analysis
  accessibility?: {
    score: number; // 0-1 scale
    issues: Array<{
      type: 'contrast' | 'font-size' | 'structure' | 'alt-text' | 'navigation';
      description: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }>;
    compliance: {
      wcag: 'A' | 'AA' | 'AAA' | 'none';
      section508: boolean;
    };
  };
}

// Enhanced analysis request
export interface GeminiAnalysisRequest {
  pdfBase64: string;
  documentType?: 'quiz' | 'worksheet' | 'exam' | 'assignment' | 'handout' | 'general';
  analysisOptions?: {
    extractQuestions?: boolean;
    extractSections?: boolean;
    extractMetadata?: boolean;
    performQualityAnalysis?: boolean;
    checkAccessibility?: boolean;
    suggestImprovements?: boolean;
    detectLanguage?: boolean;
    analyzeDifficulty?: boolean;
    
    // Content-specific options
    questionTypes?: QuestionType[];
    contentTypes?: ContentType[];
    minimumConfidence?: number;
    
    // Output formatting
    includePositions?: boolean;
    includeFormatting?: boolean;
    preserveStructure?: boolean;
  };
  
  // User context
  userContext?: {
    role: 'teacher' | 'student' | 'administrator' | 'content_creator';
    subject?: string;
    gradeLevel?: string;
    language?: string;
    preferences?: {
      detailLevel: 'minimal' | 'standard' | 'detailed';
      focusAreas: ('content' | 'structure' | 'questions' | 'accessibility')[];
    };
  };
  
  // Processing constraints
  constraints?: {
    maxProcessingTime?: number; // in milliseconds
    maxTokens?: number;
    prioritizeSpeed?: boolean;
    enableFallbacks?: boolean;
  };
}

// Analysis error types
export interface AnalysisError {
  code: string;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  suggestions?: string[];
}

// Analysis status for tracking progress
export interface AnalysisStatus {
  status: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  progress?: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number; // in milliseconds
  error?: AnalysisError;
}

// Enhanced processing result
export interface ProcessingResult extends GeminiAnalysisResponse {
  success: boolean;
  processingTime: number;
  warnings: string[];
  errors: AnalysisError[];
  
  // Enhanced sections for editing
  enhancedSections?: EnhancedDocumentSection[];
  
  // Export options
  exportFormats?: Array<{
    format: 'pdf' | 'docx' | 'html' | 'json' | 'csv';
    available: boolean;
    description: string;
  }>;
  
  // Version control
  version?: {
    id: string;
    timestamp: number;
    changes: Array<{
      type: 'content' | 'structure' | 'metadata';
      description: string;
      sectionId?: string;
      questionId?: string;
    }>;
  };
}

// Template definitions for content generation
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'question' | 'section' | 'document' | 'assessment';
  contentType: ContentType;
  template: string;
  placeholders: string[];
  examples?: string[];
  metadata?: {
    difficulty?: string;
    subject?: string[];
    gradeLevel?: string[];
    estimatedTime?: number;
  };
}

// Validation rules for content
export interface ContentValidation {
  rules: Array<{
    id: string;
    type: 'required' | 'length' | 'format' | 'content' | 'structure';
    field: string;
    value?: any;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  
  results?: Array<{
    ruleId: string;
    passed: boolean;
    message: string;
    suggestions?: string[];
  }>;
  
  overallValid: boolean;
  score: number; // 0-1 scale
}

// Default configurations
export const DEFAULT_ANALYSIS_OPTIONS = {
  extractQuestions: true,
  extractSections: true,
  extractMetadata: true,
  performQualityAnalysis: true,
  checkAccessibility: false,
  suggestImprovements: true,
  detectLanguage: true,
  analyzeDifficulty: true,
  questionTypes: ['multiple_choice', 'short_answer', 'essay', 'true_false'] as QuestionType[],
  contentTypes: ['text', 'question', 'header', 'instruction'] as ContentType[],
  minimumConfidence: 0.7,
  includePositions: true,
  includeFormatting: true,
  preserveStructure: true
};

export const DEFAULT_USER_CONTEXT = {
  role: 'teacher' as const,
  preferences: {
    detailLevel: 'standard' as const,
    focusAreas: ['content', 'questions'] as const
  }
};

// Helper functions for type checking and validation
export function isEnhancedQuestion(question: any): question is ExtractedQuestion {
  return question && 
         typeof question.id === 'string' && 
         typeof question.content === 'string' && 
         typeof question.type === 'string';
}

export function isEnhancedSection(section: any): section is DocumentSection {
  return section && 
         typeof section.id === 'string' && 
         typeof section.title === 'string' && 
         typeof section.content === 'string' && 
         typeof section.type === 'string' && 
         section.position &&
         typeof section.confidence === 'number';
}

export function validateAnalysisResponse(response: any): response is GeminiAnalysisResponse {
  return response &&
         Array.isArray(response.extractedQuestions) &&
         response.documentStructure &&
         response.extractedContent &&
         typeof response.extractedContent.title === 'string';
}