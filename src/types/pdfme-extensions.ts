// CREATED: 2025-07-04 - Extended type definitions for pdfme educational integration

import { Schema, Template, Plugin } from '@pdfme/common';
import { GeminiAnalysisResponse, ExtractedQuestion, QuestionType } from './gemini';

// Educational schema types
export type EducationalSchemaType = 
  | 'text'
  | 'image'
  | 'table'
  | 'multipleChoice'
  | 'trueFalse'
  | 'shortAnswer'
  | 'essay'
  | 'fillInBlank'
  | 'matching'
  | 'ranking'
  | 'rubric'
  | 'answerKey'
  | 'header'
  | 'footer'
  | 'instructionBox'
  | 'scoreBox'
  | 'signature'
  | 'date'
  | 'qrcode'
  | 'checkbox'
  | 'radioGroup';

// Extended schema interface for educational content
export interface EducationalSchema extends Schema {
  type: EducationalSchemaType;
  
  // Educational-specific properties
  educational?: {
    questionType?: QuestionType;
    correctAnswer?: string | string[];
    points?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    subject?: string;
    topic?: string;
    learningObjective?: string;
    instructions?: string;
    rubricCriteria?: RubricCriteria[];
    answerFormat?: 'text' | 'number' | 'date' | 'multiple-choice';
    requiresExplanation?: boolean;
    timeLimit?: number; // in minutes
    hints?: string[];
    tags?: string[];
  };

  // Enhanced validation
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customValidator?: (value: any) => boolean;
  };

  // Conditional rendering
  conditions?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'not-equals';
    value: any;
  }[];

  // Internationalization
  i18n?: {
    [languageCode: string]: {
      content?: string;
      placeholder?: string;
      instructions?: string;
    };
  };
}

// Rubric criteria interface
export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  levels: RubricLevel[];
  weight?: number;
}

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

// Educational template interface
export interface EducationalTemplate extends Template {
  schemas: EducationalSchema[][];
  
  // Educational metadata
  educational?: {
    category: 'quiz' | 'worksheet' | 'exam' | 'assignment' | 'handout' | 'assessment';
    subject?: string;
    gradeLevel?: string;
    duration?: number; // in minutes
    totalPoints?: number;
    passingScore?: number;
    instructions?: string;
    rubric?: RubricCriteria[];
    standards?: string[]; // Educational standards alignment
    keywords?: string[];
    learningObjectives?: string[];
    prerequisites?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    accessibility?: {
      largeText?: boolean;
      highContrast?: boolean;
      screenReader?: boolean;
    };
  };

  // Template versioning
  version?: {
    major: number;
    minor: number;
    patch: number;
    changelog?: string;
  };

  // Template relationships
  relationships?: {
    parentTemplate?: string;
    childTemplates?: string[];
    relatedTemplates?: string[];
  };
}

// Plugin definition for educational schemas
export interface EducationalPlugin extends Plugin {
  educational?: {
    category: 'input' | 'display' | 'assessment' | 'layout';
    supportedQuestionTypes?: QuestionType[];
    gradingSupport?: boolean;
    exportFormats?: string[];
    accessibility?: {
      keyboardNavigation?: boolean;
      screenReaderSupport?: boolean;
      colorBlindFriendly?: boolean;
    };
  };
}

// Data binding interface for educational content
export interface EducationalDataBinding {
  path: string;
  type: 'text' | 'number' | 'boolean' | 'array' | 'object';
  educational?: {
    questionType?: QuestionType;
    answerFormat?: 'text' | 'number' | 'date' | 'multiple-choice';
    validationRules?: ValidationRule[];
    scoringRules?: ScoringRule[];
  };
  format?: string;
  fallback?: any;
  transformer?: (value: any) => any;
  validator?: (value: any) => ValidationResult;
}

// Validation rule interface
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range' | 'custom';
  value?: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Scoring rule interface
export interface ScoringRule {
  type: 'exact' | 'contains' | 'regex' | 'custom';
  correctAnswer: any;
  points: number;
  partialCredit?: boolean;
  feedback?: string;
}

// Template generation options
export interface TemplateGenerationOptions {
  source: 'gemini' | 'manual' | 'import';
  geminiAnalysis?: GeminiAnalysisResponse;
  layout?: {
    pageSize: 'A4' | 'LETTER' | 'LEGAL';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  styling?: {
    fontFamily: string;
    fontSize: {
      title: number;
      heading: number;
      body: number;
      caption: number;
    };
    colors: {
      primary: string;
      secondary: string;
      text: string;
      background: string;
    };
    spacing: {
      paragraph: number;
      section: number;
      question: number;
    };
  };
  educational?: {
    includeInstructions: boolean;
    includeAnswerKey: boolean;
    includeRubric: boolean;
    includeGradingSheet: boolean;
    numberingStyle: 'numeric' | 'alphabetic' | 'roman';
    questionLayout: 'vertical' | 'horizontal' | 'grid';
  };
}

// Template preview interface
export interface TemplatePreview {
  templateId: string;
  thumbnail: string; // Base64 encoded image
  metadata: {
    pageCount: number;
    fieldCount: number;
    questionCount: number;
    estimatedTime: number; // in minutes
    difficulty: 'easy' | 'medium' | 'hard';
    lastModified: number;
  };
  sampleData?: any;
}

// Template collection interface
export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  templates: string[]; // Template IDs
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  shared: boolean;
  author?: string;
}

// Template analysis interface
export interface TemplateAnalysis {
  templateId: string;
  analysis: {
    complexity: 'low' | 'medium' | 'high';
    estimatedCompletionTime: number;
    fieldAnalysis: {
      totalFields: number;
      fieldTypes: Record<string, number>;
      validationRules: number;
      conditionalFields: number;
    };
    accessibility: {
      score: number; // 0-100
      issues: AccessibilityIssue[];
      recommendations: string[];
    };
    performance: {
      estimatedRenderTime: number;
      optimizationSuggestions: string[];
    };
  };
}

// Accessibility issue interface
export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  type: 'contrast' | 'font-size' | 'structure' | 'navigation' | 'alt-text';
  description: string;
  suggestion: string;
  elementId?: string;
}

// Template export options
export interface TemplateExportOptions {
  format: 'json' | 'pdf' | 'docx' | 'html' | 'csv';
  includeMetadata: boolean;
  includeDataBindings: boolean;
  includeSampleData: boolean;
  includePreview: boolean;
  compression?: 'none' | 'zip' | 'gzip';
  exportSettings?: {
    pdf?: {
      quality: 'draft' | 'standard' | 'high';
      includeAnswerKey: boolean;
      includeBlankVersion: boolean;
    };
    docx?: {
      compatibility: 'office2016' | 'office2019' | 'office365';
      includeComments: boolean;
    };
    html?: {
      standalone: boolean;
      includeCss: boolean;
      includeJavaScript: boolean;
    };
  };
}

// Template import options
export interface TemplateImportOptions {
  format: 'json' | 'pdf' | 'docx' | 'html';
  validation: 'strict' | 'lenient' | 'none';
  conflictResolution: 'overwrite' | 'skip' | 'rename';
  preserveIds: boolean;
  importSettings?: {
    pdf?: {
      extractText: boolean;
      extractImages: boolean;
      detectQuestions: boolean;
    };
    docx?: {
      preserveFormatting: boolean;
      extractStyles: boolean;
    };
  };
}

// Template usage statistics
export interface TemplateUsageStats {
  templateId: string;
  usage: {
    totalGenerations: number;
    uniqueUsers: number;
    averageCompletionTime: number;
    successRate: number;
    popularFields: string[];
    commonErrors: string[];
  };
  performance: {
    averageRenderTime: number;
    peakRenderTime: number;
    errorRate: number;
  };
  feedback: {
    averageRating: number;
    totalRatings: number;
    commonComments: string[];
  };
}

// Template configuration interface
export interface TemplateConfiguration {
  general: {
    autoSave: boolean;
    autoSaveInterval: number;
    backupEnabled: boolean;
    maxBackups: number;
  };
  validation: {
    enableRealTimeValidation: boolean;
    strictMode: boolean;
    customValidators: boolean;
  };
  performance: {
    enableCaching: boolean;
    cacheSize: number;
    lazyLoading: boolean;
    optimizeImages: boolean;
  };
  accessibility: {
    enableAccessibilityChecks: boolean;
    enforceContrast: boolean;
    requireAltText: boolean;
    keyboardNavigation: boolean;
  };
  collaboration: {
    enableSharing: boolean;
    allowComments: boolean;
    versionControl: boolean;
    conflictResolution: 'auto' | 'manual';
  };
}

// Utility types
export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
};

export type GenerationResult = {
  success: boolean;
  pdf?: Uint8Array;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    pageCount: number;
    fileSize: number;
    generationTime: number;
  };
};

export type TemplateEvent = {
  type: 'created' | 'updated' | 'deleted' | 'generated' | 'shared' | 'imported' | 'exported';
  templateId: string;
  userId?: string;
  timestamp: number;
  data?: any;
};

// Type guards
export function isEducationalSchema(schema: Schema): schema is EducationalSchema {
  return 'educational' in schema;
}

export function isEducationalTemplate(template: Template): template is EducationalTemplate {
  return 'educational' in template;
}

export function isValidQuestionType(type: string): type is QuestionType {
  return ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_in_blank', 'matching', 'ranking'].includes(type);
}

// Default configurations
export const DEFAULT_EDUCATIONAL_CONFIG: TemplateConfiguration = {
  general: {
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    backupEnabled: true,
    maxBackups: 10,
  },
  validation: {
    enableRealTimeValidation: true,
    strictMode: false,
    customValidators: true,
  },
  performance: {
    enableCaching: true,
    cacheSize: 50,
    lazyLoading: true,
    optimizeImages: true,
  },
  accessibility: {
    enableAccessibilityChecks: true,
    enforceContrast: true,
    requireAltText: true,
    keyboardNavigation: true,
  },
  collaboration: {
    enableSharing: false,
    allowComments: false,
    versionControl: true,
    conflictResolution: 'manual',
  },
};

export const DEFAULT_TEMPLATE_GENERATION_OPTIONS: TemplateGenerationOptions = {
  source: 'manual',
  layout: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
  styling: {
    fontFamily: 'Roboto-Regular',
    fontSize: {
      title: 18,
      heading: 14,
      body: 12,
      caption: 10,
    },
    colors: {
      primary: '#000000',
      secondary: '#666666',
      text: '#333333',
      background: '#ffffff',
    },
    spacing: {
      paragraph: 8,
      section: 16,
      question: 12,
    },
  },
  educational: {
    includeInstructions: true,
    includeAnswerKey: false,
    includeRubric: false,
    includeGradingSheet: false,
    numberingStyle: 'numeric',
    questionLayout: 'vertical',
  },
};