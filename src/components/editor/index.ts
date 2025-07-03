// CREATED: 2025-07-03 - Export all enhanced editor components and utilities

// Main Components
export { SectionEditor } from './SectionEditor';
export { EditorToolbar } from './EditorToolbar';
export { ContentTypeEditor } from './ContentTypeEditor';

// Utilities
export { ContentFormatterImpl, contentFormatter, formatContent } from './ContentFormatter';

// Custom Hooks
export { useEditorHistory } from './hooks/useEditorHistory';
export { useAutoSave } from './hooks/useAutoSave';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Re-export types for convenience
export type {
  ContentType,
  TextFormatting,
  EditorAction,
  EditorState,
  EditorHistory,
  AutoSaveConfig,
  KeyboardShortcut,
  ContentTemplate,
  ContentValidationRule,
  EditorConfig,
  EnhancedDocumentSection,
  SectionEditorProps,
  ContentTypeEditorProps,
  EditorToolbarProps,
  ContentFormatter
} from '@/types/editor';

// Export constants
export {
  DEFAULT_EDITOR_CONFIG,
  DEFAULT_CONTENT_TEMPLATES
} from '@/types/editor';

// Utility functions for common editor operations
export const EditorUtils = {
  // Content detection helpers
  detectContentType: (content: string) => contentFormatter.detectContentType(content),
  
  // Formatting helpers
  stripFormatting: (content: string) => contentFormatter.stripFormatting(content),
  applyFormatting: (content: string, formatting: any) => contentFormatter.applyFormatting(content, formatting),
  
  // Statistics helpers
  getStats: (content: string) => ({
    words: contentFormatter.getWordCount(content),
    characters: contentFormatter.getCharacterCount(content),
    lines: contentFormatter.getLineCount(content)
  }),
  
  // Content validation
  validateContent: (content: string, rules: any[]) => contentFormatter.validateContent(content, rules),
  
  // Quick formatters
  bold: (text: string) => formatContent.bold(text),
  italic: (text: string) => formatContent.italic(text),
  header: (text: string, level = 1) => formatContent.asHeader(text, level),
  list: (items: string[], ordered = false) => formatContent.asList(items, ordered),
  code: (code: string, language?: string) => formatContent.asCode(code, language),
  clean: (content: string) => formatContent.clean(content)
};

// Pre-configured editor setups for common use cases
export const EditorPresets = {
  // Basic text editor
  basic: {
    contentType: 'text' as const,
    toolbar: {
      enabled: true,
      actions: ['bold', 'italic', 'save', 'cancel'],
      compact: true
    },
    autoSave: {
      enabled: true,
      interval: 3000
    }
  },
  
  // Rich text editor with full features
  rich: {
    contentType: 'rich' as const,
    toolbar: {
      enabled: true,
      actions: ['bold', 'italic', 'underline', 'heading1', 'heading2', 'bulletList', 'numberedList', 'undo', 'redo', 'save', 'preview'],
      compact: false
    },
    autoSave: {
      enabled: true,
      interval: 2000
    },
    features: {
      dragDrop: true,
      autoFormat: true,
      spellCheck: true,
      wordCount: true
    }
  },
  
  // Question editor with validation
  question: {
    contentType: 'question' as const,
    toolbar: {
      enabled: true,
      actions: ['bold', 'italic', 'save', 'cancel', 'preview'],
      compact: false
    },
    validation: {
      rules: [
        {
          id: 'required',
          name: 'Required',
          type: 'required' as const,
          message: 'Question content is required'
        },
        {
          id: 'minLength',
          name: 'Minimum Length',
          type: 'minLength' as const,
          value: 10,
          message: 'Question must be at least 10 characters long'
        }
      ],
      realTime: true
    },
    autoSave: {
      enabled: true,
      interval: 2000
    }
  },
  
  // Markdown editor with preview
  markdown: {
    contentType: 'markdown' as const,
    toolbar: {
      enabled: true,
      actions: ['bold', 'italic', 'heading1', 'heading2', 'heading3', 'bulletList', 'numberedList', 'preview', 'save'],
      compact: false
    },
    autoSave: {
      enabled: true,
      interval: 2000
    },
    features: {
      autoFormat: true,
      wordCount: true,
      lineNumbers: false
    }
  },
  
  // Code editor
  code: {
    contentType: 'code' as const,
    toolbar: {
      enabled: true,
      actions: ['undo', 'redo', 'save', 'cancel'],
      compact: true
    },
    autoSave: {
      enabled: true,
      interval: 1000
    },
    features: {
      lineNumbers: true,
      autoFormat: false,
      spellCheck: false
    }
  }
};

// Helper function to create a pre-configured editor
export function createEditor(preset: keyof typeof EditorPresets, overrides = {}) {
  return {
    ...EditorPresets[preset],
    ...overrides
  };
}