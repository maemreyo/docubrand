
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { EducationalTemplate } from '@/types/pdfme-extensions';
import { TemplateDefinition } from '@/lib/template-manager';
import { DataBinding } from '@/lib/data-binding';
import { ValidationReport } from '@/lib/template-validator';
import { createBlankEducationalTemplate, fixTemplateBasePdf } from '@/lib/template-utils';

interface UseTemplateDataOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  validateOnChange?: boolean;
  enableUndo?: boolean;
}

interface UseTemplateDataReturn {
  // State
  template: EducationalTemplate | null;
  templateDefinition: TemplateDefinition | null;
  bindings: DataBinding[];
  data: Record<string, any>;
  validation: ValidationReport | null;
  isDirty: boolean;
  isValid: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  isAutoSaveEnabled: boolean;
  lastAutoSave: Date | null;
  lastSaved: Date | null;
  errors: string[];
  warnings: string[];

  // Actions
  loadTemplate: (template: EducationalTemplate) => void;
  createTemplate: () => void;
  saveTemplate: () => Promise<void>;
  resetTemplate: () => void;
  updateTemplate: (template: EducationalTemplate) => void;
  updateMetadata: (updates: Partial<TemplateDefinition['metadata']>) => void;
  updateBindings: (bindings: DataBinding[]) => void;
  updateData: (path: string, value: any) => void;
  updateDataBatch: (updates: Record<string, any>) => void;
  generateSampleData: () => void;
  validateTemplate: () => void;
  validateData: () => void;
  generatePreview: () => Promise<Uint8Array>;
  undo: () => void;
  redo: () => void;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

/**
 * Optimized template data hook with proper state management
 * 
 * Key improvements:
 * 1. Stable template references with shallow comparison
 * 2. Debounced auto-save to prevent excessive saves
 * 3. Proper undo/redo with structural changes only
 * 4. Separated dirty state from template structure
 * 5. Optimized validation triggering
 */
export function useTemplateData(options: UseTemplateDataOptions = {}): UseTemplateDataReturn {
  const {
    autoSave = false,
    autoSaveInterval = 30000,
    validateOnChange = true,
    enableUndo = true,
  } = options;

  // Core state
  const [template, setTemplate] = useState<EducationalTemplate | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [bindings, setBindings] = useState<DataBinding[]>([]);
  const [data, setData] = useState<Record<string, any>>({});
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Auto-save state
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(autoSave);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // History management for undo/redo
  const history = useRef<EducationalTemplate[]>([]);
  const historyIndex = useRef<number>(-1);
  const [historySize, setHistorySize] = useState(0);

  // Refs for debouncing and preventing loops
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTemplateRef = useRef<EducationalTemplate | null>(null);
  const isInternalUpdateRef = useRef(false);

  // CRITICAL: Create stable template reference
  const stableTemplate = useMemo(() => {
    if (!template) return null;

    // Only create new reference if template actually changed
    const templateJson = JSON.stringify(template);
    const lastTemplateJson = lastTemplateRef.current ? JSON.stringify(lastTemplateRef.current) : '';
    
    if (templateJson === lastTemplateJson) {
      return lastTemplateRef.current; // Return same reference
    }

    lastTemplateRef.current = template;
    return template;
  }, [template]);

  // Computed values
  const isDirty = useMemo(() => {
    if (!templateDefinition || !stableTemplate) return false;
    
    const savedTemplateJson = JSON.stringify(templateDefinition.template);
    const currentTemplateJson = JSON.stringify(stableTemplate);
    return savedTemplateJson !== currentTemplateJson;
  }, [templateDefinition, stableTemplate]);

  const isValid = useMemo(() => {
    return !validation || (validation.errors.length === 0);
  }, [validation]);

  const canUndo = useMemo(() => {
    return enableUndo && historyIndex.current > 0;
  }, [enableUndo, historySize]);

  const canRedo = useMemo(() => {
    return enableUndo && historyIndex.current < history.current.length - 1;
  }, [enableUndo, historySize]);

  // Template management functions
  const addToHistory = useCallback((newTemplate: EducationalTemplate) => {
    if (!enableUndo) return;

    // Don't add to history if it's an internal update
    if (isInternalUpdateRef.current) return;

    // Remove any redo history when adding new state
    history.current = history.current.slice(0, historyIndex.current + 1);
    
    // Add new template to history
    history.current.push(newTemplate);
    historyIndex.current = history.current.length - 1;
    
    // Limit history size
    if (history.current.length > 50) {
      history.current = history.current.slice(-50);
      historyIndex.current = 49;
    }
    
    setHistorySize(history.current.length);
  }, [enableUndo]);

  const updateTemplate = useCallback((newTemplate: EducationalTemplate) => {
    // Prevent unnecessary updates
    if (stableTemplate && JSON.stringify(stableTemplate) === JSON.stringify(newTemplate)) {
      return;
    }

    setTemplate(newTemplate);
    addToHistory(newTemplate);
    
    // Trigger validation if enabled
    if (validateOnChange) {
      // Debounce validation to avoid excessive calls
      setTimeout(() => {
        validateTemplate();
      }, 100);
    }
    
    // Trigger auto-save if enabled
    if (isAutoSaveEnabled) {
      scheduleAutoSave();
    }
  }, [stableTemplate, addToHistory, validateOnChange, isAutoSaveEnabled]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (isDirty && stableTemplate) {
        saveTemplate();
      }
    }, autoSaveInterval);
  }, [isDirty, stableTemplate, autoSaveInterval]);

  // Load template
  const loadTemplate = useCallback((newTemplate: EducationalTemplate) => {
    isInternalUpdateRef.current = true;
    
    // Ensure template has valid basePdf
    const safeTemplate = fixTemplateBasePdf(newTemplate) as EducationalTemplate;
    
    setTemplate(safeTemplate);
    setLastSaved(new Date());
    
    // Create template definition
    const definition: TemplateDefinition = {
      metadata: {
        id: Date.now().toString(),
        name: 'Loaded Template',
        description: '',
        category: 'custom',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      template: safeTemplate,
    };
    setTemplateDefinition(definition);
    
    // Reset history
    history.current = [safeTemplate];
    historyIndex.current = 0;
    setHistorySize(1);
    
    // Reset state
    setErrors([]);
    setWarnings([]);
    setValidation(null);
    
    isInternalUpdateRef.current = false;
  }, []);

  // Create new template
  const createTemplate = useCallback(() => {
    const newTemplate = createBlankEducationalTemplate();
    loadTemplate(newTemplate);
  }, [loadTemplate]);

  // Save template
  const saveTemplate = useCallback(async () => {
    if (!stableTemplate || !templateDefinition) return;
    
    setIsSaving(true);
    try {
      // Update template definition
      const updatedDefinition: TemplateDefinition = {
        ...templateDefinition,
        template: stableTemplate,
        metadata: {
          ...templateDefinition.metadata,
          updatedAt: new Date(),
        },
      };
      
      setTemplateDefinition(updatedDefinition);
      setLastSaved(new Date());
      
      // Here you would typically save to your backend/storage
      console.log('Template saved:', updatedDefinition);
      
    } catch (error) {
      setErrors(prev => [...prev, `Save failed: ${error}`]);
    } finally {
      setIsSaving(false);
    }
  }, [stableTemplate, templateDefinition]);

  // Reset template
  const resetTemplate = useCallback(() => {
    if (!templateDefinition) return;
    
    isInternalUpdateRef.current = true;
    setTemplate(templateDefinition.template);
    isInternalUpdateRef.current = false;
  }, [templateDefinition]);

  // Update metadata
  const updateMetadata = useCallback((updates: Partial<TemplateDefinition['metadata']>) => {
    if (!templateDefinition) return;
    
    setTemplateDefinition(prev => prev ? {
      ...prev,
      metadata: {
        ...prev.metadata,
        ...updates,
        updatedAt: new Date(),
      },
    } : null);
  }, [templateDefinition]);

  // Update bindings
  const updateBindings = useCallback((newBindings: DataBinding[]) => {
    setBindings(newBindings);
  }, []);

  // Update data
  const updateData = useCallback((path: string, value: any) => {
    setData(prev => ({
      ...prev,
      [path]: value,
    }));
  }, []);

  // Update data batch
  const updateDataBatch = useCallback((updates: Record<string, any>) => {
    setData(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Generate sample data
  const generateSampleData = useCallback(() => {
    if (!stableTemplate) return;
    
    // Generate sample data based on template schemas
    const sampleData: Record<string, any> = {};
    
    stableTemplate.schemas?.[0]?.forEach(schema => {
      if (schema.name) {
        switch (schema.type) {
          case 'text':
            sampleData[schema.name] = 'Sample text';
            break;
          case 'multipleChoice':
            sampleData[schema.name] = 'Sample question?';
            break;
          default:
            sampleData[schema.name] = '';
        }
      }
    });
    
    setData(sampleData);
  }, [stableTemplate]);

  // Validate template
  const validateTemplate = useCallback(() => {
    if (!stableTemplate) {
      setValidation(null);
      return;
    }
    
    // Basic validation
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!stableTemplate.schemas || stableTemplate.schemas.length === 0) {
      errors.push('Template must have at least one page');
    }
    
    if (stableTemplate.schemas?.[0]?.length === 0) {
      warnings.push('Template page is empty');
    }
    
    setValidation({
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date(),
    });
    
    setErrors(errors);
    setWarnings(warnings);
  }, [stableTemplate]);

  // Validate data
  const validateData = useCallback(() => {
    // Data validation logic here
    console.log('Validating data:', data);
  }, [data]);

  // Generate preview
  const generatePreview = useCallback(async (): Promise<Uint8Array> => {
    if (!stableTemplate) {
      throw new Error('No template available for preview');
    }
    
    setIsGenerating(true);
    try {
      // Here you would use PDFme to generate preview
      // For now, return empty array
      return new Uint8Array();
    } finally {
      setIsGenerating(false);
    }
  }, [stableTemplate]);

  // Undo
  const undo = useCallback(() => {
    if (!canUndo) return;
    
    historyIndex.current--;
    const previousTemplate = history.current[historyIndex.current];
    
    isInternalUpdateRef.current = true;
    setTemplate(previousTemplate);
    setHistorySize(history.current.length); // Trigger re-render for computed values
    isInternalUpdateRef.current = false;
  }, [canUndo]);

  // Redo
  const redo = useCallback(() => {
    if (!canRedo) return;
    
    historyIndex.current++;
    const nextTemplate = history.current[historyIndex.current];
    
    isInternalUpdateRef.current = true;
    setTemplate(nextTemplate);
    setHistorySize(history.current.length); // Trigger re-render for computed values
    isInternalUpdateRef.current = false;
  }, [canRedo]);

  // Enable auto-save
  const enableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(true);
    if (isDirty) {
      scheduleAutoSave();
    }
  }, [isDirty, scheduleAutoSave]);

  // Disable auto-save
  const disableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(false);
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    template: stableTemplate,
    templateDefinition,
    bindings,
    data,
    validation,
    isDirty,
    isValid,
    isLoading,
    isSaving,
    isGenerating,
    canUndo,
    canRedo,
    historySize,
    isAutoSaveEnabled,
    lastAutoSave,
    lastSaved,
    errors,
    warnings,

    // Actions
    loadTemplate,
    createTemplate,
    saveTemplate,
    resetTemplate,
    updateTemplate,
    updateMetadata,
    updateBindings,
    updateData,
    updateDataBatch,
    generateSampleData,
    validateTemplate,
    validateData,
    generatePreview,
    undo,
    redo,
    enableAutoSave,
    disableAutoSave,
  };
}