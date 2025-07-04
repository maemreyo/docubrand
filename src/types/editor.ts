// CREATED: 2025-07-03 - Enhanced editor type definitions for powerful SectionEditor

import { DocumentSection } from './gemini';

// Content types that our enhanced editor can handle
export type ContentType = 
  | 'text'           // Plain text content
  | 'rich'           // Rich text with formatting
  | 'markdown'       // Markdown content
  | 'question'       // Question/answer format
  | 'header'         // Header/title with emphasis
  | 'instruction'    // Special instruction format
  | 'code'           // Code blocks
  | 'list'           // List format
  | 'template';      // Template/preset content

// Formatting options for rich text editing
export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  color?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

// Editor toolbar actions
export type EditorAction = 
  | 'bold' | 'italic' | 'underline' | 'strikethrough'
  | 'heading1' | 'heading2' | 'heading3'
  | 'bulletList' | 'numberedList'
  | 'alignLeft' | 'alignCenter' | 'alignRight'
  | 'undo' | 'redo'
  | 'save' | 'cancel'
  | 'preview' | 'fullscreen'
  | 'contentType';

// Editor state for undo/redo functionality
export interface EditorState {
  content: string;
  contentType: ContentType;
  formatting?: TextFormatting;
  timestamp: number;
  cursor?: {
    start: number;
    end: number;
  };
}

// History management for undo/redo
export interface EditorHistory {
  states: EditorState[];
  currentIndex: number;
  maxSize: number;
}

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxRetries: number;
  onSave?: (content: string) => Promise<void>;
  onError?: (error: Error) => void;
}

// Keyboard shortcut configuration
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: EditorAction | (() => void);
  description: string;
}

// Content template for quick insertion
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  contentType: ContentType;
  template: string;
  placeholders?: string[];
  category: 'question' | 'instruction' | 'content' | 'format';
}

// Validation rule for content
export interface ContentValidationRule {
  id: string;
  name: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (content: string) => boolean;
}

// Editor configuration
export interface EditorConfig {
  contentType: ContentType;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  autoSave?: AutoSaveConfig;
  toolbar?: {
    enabled: boolean;
    actions: EditorAction[];
    compact?: boolean;
  };
  keyboard?: {
    shortcuts: KeyboardShortcut[];
    enabled: boolean;
  };
  validation?: {
    rules: ContentValidationRule[];
    realTime: boolean;
  };
  templates?: ContentTemplate[];
  features?: {
    dragDrop?: boolean;
    autoFormat?: boolean;
    spellCheck?: boolean;
    wordCount?: boolean;
    lineNumbers?: boolean;
  };
}

// Enhanced section with editor-specific properties
export interface EnhancedDocumentSection extends Omit<DocumentSection, 'formatting'> {
  // Editor state
  isEditing?: boolean;
  isDirty?: boolean;
  lastModified?: number;
  isCollapsed?: boolean;
  
  // Content metadata
  order?: number;
  wordCount?: number;
  characterCount?: number;
  metadata?: {
    originalIndex?: number;
    wordCount?: number;
    lastModified?: string;
    [key: string]: any;
  };
  
  // Validation
  validationErrors?: string[];
  isValid?: boolean;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Formatting
  formatting?: TextFormatting;
  
  // Templates and presets
  templateId?: string;
  isTemplate?: boolean;
}

// Props for the main SectionEditor component
export interface SectionEditorProps {
  section: EnhancedDocumentSection;
  onUpdate: (section: EnhancedDocumentSection) => void;
  onDelete?: () => void;
  config?: Partial<EditorConfig>;
  
  // UI state
  isActive?: boolean;
  onActivate?: () => void;
  readonly?: boolean;
  
  // Advanced features
  autoFocus?: boolean;
  showStats?: boolean;
  showPreview?: boolean;
  showAdvanced?: boolean;
  
  // Event handlers
  onSave?: (content: string) => void;
  onCancel?: () => void;
  onValidation?: (errors: string[]) => void;
}

// Props for specialized content editors
export interface ContentTypeEditorProps {
  content: string;
  contentType: ContentType;
  onChange: (content: string) => void;
  config?: Partial<EditorConfig>;
  readonly?: boolean;
}

// Props for editor toolbar
export interface EditorToolbarProps {
  actions: EditorAction[];
  onAction: (action: EditorAction) => void;
  currentState?: {
    contentType: ContentType;
    formatting: TextFormatting;
    canUndo: boolean;
    canRedo: boolean;
  };
  compact?: boolean;
  className?: string;
}

// Content formatter utilities interface
export interface ContentFormatter {
  // Format conversion
  toPlainText: (content: string) => string;
  toRichText: (content: string) => string;
  toMarkdown: (content: string) => string;
  
  // Content detection
  detectContentType: (content: string) => ContentType;
  
  // Formatting helpers
  applyFormatting: (content: string, formatting: TextFormatting) => string;
  stripFormatting: (content: string) => string;
  
  // Content stats
  getWordCount: (content: string) => number;
  getCharacterCount: (content: string) => number;
  getLineCount: (content: string) => number;
  
  // Validation
  validateContent: (content: string, rules: ContentValidationRule[]) => string[];
}

// Default configurations
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  contentType: 'text',
  placeholder: 'Enter content...',
  maxLength: 10000,
  autoSave: {
    enabled: true,
    interval: 2000,
    maxRetries: 3
  },
  toolbar: {
    enabled: true,
    actions: ['bold', 'italic', 'heading1', 'heading2', 'bulletList', 'numberedList', 'undo', 'redo', 'save'],
    compact: false
  },
  keyboard: {
    enabled: true,
    shortcuts: [
      { key: 's', ctrlKey: true, action: 'save', description: 'Save content' },
      { key: 'z', ctrlKey: true, action: 'undo', description: 'Undo' },
      { key: 'y', ctrlKey: true, action: 'redo', description: 'Redo' },
      { key: 'b', ctrlKey: true, action: 'bold', description: 'Bold' },
      { key: 'i', ctrlKey: true, action: 'italic', description: 'Italic' },
      { key: 'Escape', action: 'cancel', description: 'Cancel editing' }
    ]
  },
  validation: {
    rules: [],
    realTime: true
  },
  features: {
    dragDrop: true,
    autoFormat: true,
    spellCheck: true,
    wordCount: true,
    lineNumbers: false
  }
};

// Content templates for quick insertion
export const DEFAULT_CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'multiple_choice',
    name: 'Multiple Choice Question',
    description: 'Standard multiple choice question format',
    contentType: 'question',
    template: 'Question: [QUESTION_TEXT]\n\nA) [OPTION_A]\nB) [OPTION_B]\nC) [OPTION_C]\nD) [OPTION_D]\n\nCorrect Answer: [CORRECT_ANSWER]',
    placeholders: ['QUESTION_TEXT', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D', 'CORRECT_ANSWER'],
    category: 'question'
  },
  {
    id: 'short_answer',
    name: 'Short Answer Question',
    description: 'Open-ended short answer question',
    contentType: 'question',
    template: 'Question: [QUESTION_TEXT]\n\nAnswer: [SAMPLE_ANSWER]',
    placeholders: ['QUESTION_TEXT', 'SAMPLE_ANSWER'],
    category: 'question'
  },
  {
    id: 'instruction_block',
    name: 'Instruction Block',
    description: 'Formatted instruction text',
    contentType: 'instruction',
    template: 'Instructions: [INSTRUCTION_TEXT]',
    placeholders: ['INSTRUCTION_TEXT'],
    category: 'instruction'
  },
  {
    id: 'section_header',
    name: 'Section Header',
    description: 'Section title with emphasis',
    contentType: 'header',
    template: '# [SECTION_TITLE]',
    placeholders: ['SECTION_TITLE'],
    category: 'format'
  }
];