// PDF Template System - Core TypeScript interfaces

import type { Template as PDFMeTemplate, Schema as PDFMeSchema } from '@pdfme/common';
import type { GeminiAnalysisResponse, DocumentSection, ExtractedQuestion } from '@/types/gemini';

/**
 * Extended PDFme Template with DocuBrand-specific features
 */
export interface DocuBrandTemplate extends PDFMeTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  tags: string[];
  
  // DocuBrand specific metadata
  metadata: TemplateMetadata;
  
  // Multi-language support
  i18nConfig: I18nConfig;
  
  // Data schema for validation
  dataSchema: DataSchema;
  
  // Sample data for preview
  sampleData: any;
  
  // Template version
  version: string;
  
  // Created from analysis
  sourceAnalysis?: GeminiAnalysisResponse;
}

/**
 * Template categories for organization
 */
export type TemplateCategory = 
  | 'educational'
  | 'business' 
  | 'invoice'
  | 'quiz'
  | 'worksheet'
  | 'exam'
  | 'certificate'
  | 'report'
  | 'general';

/**
 * Template metadata
 */
export interface TemplateMetadata {
  version: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  thumbnail?: string;
  previewImages?: string[];
  
  // Usage statistics
  usage?: {
    totalGenerated: number;
    lastUsed: string;
    popularity: number;
  };
  
  // Educational specific
  educational?: {
    subject: string;
    gradeLevel: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number; // in minutes
  };
}

/**
 * Multi-language configuration
 */
export interface I18nConfig {
  supportedLanguages: string[];
  defaultLanguage: string;
  fallbackLanguage: string;
  
  // Language-specific configurations
  languages: {
    [langCode: string]: LanguageConfig;
  };
}

/**
 * Language configuration
 */
export interface LanguageConfig {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  fontFamily: string;
  fallbackFonts: string[];
  
  // Font file paths
  fontFiles: {
    regular: string;
    bold: string;
    italic: string;
    boldItalic: string;
  };
  
  // Unicode support
  unicodeRange: string;
  
  // Layout modifications for this language
  layoutModifications?: {
    textAlign?: 'left' | 'right' | 'center';
    mirrorElements?: boolean;
    customStyles?: Record<string, any>;
  };
}

/**
 * Data schema for template validation
 */
export interface DataSchema {
  type: 'object';
  properties: Record<string, DataSchemaProperty>;
  required?: string[];
  
  // Additional validation rules
  validation?: {
    rules: ValidationRule[];
    messages: Record<string, string>;
  };
}

/**
 * Data schema property
 */
export interface DataSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  
  // For arrays
  items?: DataSchemaProperty;
  
  // For objects
  properties?: Record<string, DataSchemaProperty>;
  
  // Validation
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string;
  type: 'required' | 'length' | 'format' | 'range' | 'custom';
  value?: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Extended PDFme Schema with DocuBrand features
 */
export interface DocuBrandSchema extends PDFMeSchema {
  // Multi-language content
  i18n?: {
    [langCode: string]: {
      content?: string;
      style?: any;
      position?: {
        x: number;
        y: number;
      };
    };
  };
  
  // Data binding configuration
  dataBinding?: DataBinding;
  
  // Conditional rendering
  conditions?: SchemaCondition[];
  
  // Custom behaviors
  behaviors?: SchemaBehaviors;
  
  // Educational content specific
  educational?: {
    contentType: 'question' | 'answer' | 'instruction' | 'header' | 'content';
    difficulty?: 'easy' | 'medium' | 'hard';
    points?: number;
    tags?: string[];
  };
}

/**
 * Data binding configuration
 */
export interface DataBinding {
  path: string;                    // JSONPath to data
  type: 'text' | 'image' | 'table' | 'list' | 'conditional';
  format?: string;                 // Date, number, currency format
  transformer?: DataTransformer;   // Custom transformation
  fallback?: string;               // Default value
  addQuestionNumberPrefix?: boolean; // Indicates if a question number prefix should be added

  
  // Multi-language binding
  i18nPath?: string;              // Path to i18n content
  
  // Validation
  validation?: {
    required?: boolean;
    type?: string;
    pattern?: string;
    message?: string;
  };
}

/**
 * Data transformer function
 */
export type DataTransformer = (value: any, context: TransformerContext) => any;

/**
 * Transformer context
 */
export interface TransformerContext {
  language: string;
  schema: DocuBrandSchema;
  allData: any;
  pageIndex: number;
  templateId: string;
}

/**
 * Schema condition for conditional rendering
 */
export interface SchemaCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists' | 'empty';
  value: any;
  caseSensitive?: boolean;
}

/**
 * Schema behaviors
 */
export interface SchemaBehaviors {
  onDataChange?: string;     // JavaScript code
  onRender?: string;         // JavaScript code
  onValidation?: string;     // JavaScript code
  
  // Auto-sizing
  autoResize?: {
    width?: boolean;
    height?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

/**
 * Gemini to PDFme conversion context
 */
export interface ConversionContext {
  sourceAnalysis: GeminiAnalysisResponse;
  targetLanguage: string;
  templateCategory: TemplateCategory;
  
  // Conversion options
  options: {
    autoLayoutOptimization: boolean;
    preserveOriginalFormatting: boolean;
    generateSampleData: boolean;
    createMultiLanguageBindings: boolean;
  };
  
  // Page configuration
  pageConfig: {
    format: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

/**
 * Template creation result
 */
export interface TemplateCreationResult {
  success: boolean;
  template?: DocuBrandTemplate;
  errors?: string[];
  warnings?: string[];
  
  // Creation statistics
  stats: {
    sectionsProcessed: number;
    questionsProcessed: number;
    schemasGenerated: number;
    processingTime: number;
  };
  
  // Suggestions for improvement
  suggestions?: string[];
}

/**
 * Template generation options
 */
export interface TemplateGenerationOptions {
  // Language settings
  language: string;
  fallbackLanguage: string;
  
  // Font configuration
  fontConfig: LanguageConfig;
  
  // Layout options
  layout: {
    autoOptimize: boolean;
    preserveWhitespace: boolean;
    respectOriginalPositions: boolean;
    generateResponsiveLayout: boolean;
  };
  
  // Content processing
  content: {
    processMarkdown: boolean;
    generateDataBindings: boolean;
    createConditionalElements: boolean;
    optimizeImages: boolean;
  };
  
  // Quality settings
  quality: {
    imageQuality: number;
    fontEmbedding: boolean;
    vectorizeText: boolean;
    compression: boolean;
  };
}

/**
 * Template library entry
 */
export interface TemplateLibraryEntry {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  previewImages: string[];
  tags: string[];
  
  // Usage information
  usage: {
    downloads: number;
    rating: number;
    reviews: number;
    lastUpdated: string;
  };
  
  // Template metadata
  metadata: {
    author: string;
    version: string;
    fileSize: number;
    supportedLanguages: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  
  // Template data (loaded separately)
  templateData?: DocuBrandTemplate;
}

/**
 * Template plugin interface
 */
export interface TemplatePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Plugin capabilities
  capabilities: {
    schemas: string[];          // Schema types this plugin handles
    generators: string[];       // Generator types
    validators: string[];       // Validation types
    transformers: string[];     // Data transformer types
  };
  
  // Plugin methods
  initialize?: () => Promise<void>;
  registerSchemas?: () => Record<string, any>;
  registerGenerators?: () => Record<string, any>;
  registerValidators?: () => Record<string, any>;
  registerTransformers?: () => Record<string, DataTransformer>;
}

/**
 * Template storage interface
 */
export interface TemplateStorage {
  // Template CRUD operations
  save(template: DocuBrandTemplate): Promise<void>;
  load(id: string): Promise<DocuBrandTemplate | null>;
  delete(id: string): Promise<boolean>;
  list(): Promise<TemplateLibraryEntry[]>;
  
  // Template queries
  findByCategory(category: TemplateCategory): Promise<TemplateLibraryEntry[]>;
  findByTags(tags: string[]): Promise<TemplateLibraryEntry[]>;
  search(query: string): Promise<TemplateLibraryEntry[]>;
  
  // Template metadata
  updateMetadata(id: string, metadata: Partial<TemplateMetadata>): Promise<void>;
  getUsageStats(id: string): Promise<any>;
}

/**
 * Template engine interface
 */
export interface TemplateEngine {
  // Template creation
  createFromAnalysis(analysis: GeminiAnalysisResponse, options: TemplateGenerationOptions): Promise<TemplateCreationResult>;
  
  // Template management
  loadTemplate(id: string): Promise<DocuBrandTemplate | null>;
  saveTemplate(template: DocuBrandTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<boolean>;
  
  // Template generation
  generatePDF(template: DocuBrandTemplate, data: any, options?: any): Promise<Uint8Array>;
  
  // Template validation
  validateTemplate(template: DocuBrandTemplate): Promise<ValidationResult>;
  validateData(template: DocuBrandTemplate, data: any): Promise<ValidationResult>;
  
  // Plugin management
  registerPlugin(plugin: TemplatePlugin): void;
  getPlugins(): TemplatePlugin[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
  suggestions?: string[];
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  impact: 'low' | 'medium' | 'high';
  suggestions?: string[];
}

// Re-export PDFme types for convenience
export type { 
  Template as PDFMeTemplate,
  Schema as PDFMeSchema 
} from '@pdfme/common';