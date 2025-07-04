// CREATED: 2025-07-04 - React hook for template data management

import { useState, useEffect, useCallback, useRef } from 'react';
import { Template } from '@pdfme/common';
import { EducationalTemplate } from '@/types/pdfme-extensions';
import { DataBinding, dataBindingService, DataMappingResult } from '@/lib/data-binding';
import { templateManager, TemplateDefinition } from '@/lib/template-manager';
import { PdfmeIntegration } from '@/lib/pdfme-integration';
import { templateValidator, ValidationReport } from '@/lib/template-validator';

/**
 * Template data state interface
 */
export interface TemplateDataState {
  template: EducationalTemplate | null;
  templateDefinition: TemplateDefinition | null;
  bindings: DataBinding[];
  data: Record<string, any>;
  validation: ValidationReport | null;
  isDirty: boolean;
  isValid: boolean;
  lastSaved: number | null;
  errors: string[];
  warnings: string[];
}

/**
 * Template data actions interface
 */
export interface TemplateDataActions {
  // Template management
  loadTemplate: (templateId: string) => Promise<boolean>;
  createTemplate: (name: string, category?: string) => Promise<boolean>;
  saveTemplate: () => Promise<boolean>;
  resetTemplate: () => void;
  
  // Template editing
  updateTemplate: (updates: Partial<EducationalTemplate>) => void;
  updateMetadata: (metadata: Partial<TemplateDefinition['metadata']>) => void;
  
  // Data binding management
  updateBindings: (bindings: DataBinding[]) => void;
  updateData: (path: string, value: any) => void;
  updateDataBatch: (updates: Record<string, any>) => void;
  generateSampleData: () => void;
  
  // Validation
  validateTemplate: () => Promise<ValidationReport>;
  validateData: () => DataMappingResult;
  
  // Preview and generation
  generatePreview: () => Promise<Uint8Array | null>;
  
  // History management
  undo: () => boolean;
  redo: () => boolean;
  
  // Auto-save
  enableAutoSave: (intervalMs?: number) => void;
  disableAutoSave: () => void;
}

/**
 * History entry interface
 */
interface HistoryEntry {
  timestamp: number;
  template: EducationalTemplate;
  data: Record<string, any>;
  description: string;
}

/**
 * Hook options interface
 */
export interface UseTemplateDataOptions {
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  maxHistorySize?: number;
  validateOnChange?: boolean;
  enableUndo?: boolean;
}

/**
 * Return type for the hook
 */
export interface UseTemplateDataReturn extends TemplateDataState, TemplateDataActions {
  // Additional state
  isLoading: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  
  // History state
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  
  // Auto-save state
  isAutoSaveEnabled: boolean;
  lastAutoSave: number | null;
}

/**
 * useTemplateData Hook
 */
export function useTemplateData(options: UseTemplateDataOptions = {}): UseTemplateDataReturn {
  const {
    autoSave = false,
    autoSaveInterval = 30000, // 30 seconds
    maxHistorySize = 50,
    validateOnChange = true,
    enableUndo = true,
  } = options;

  // Core state
  const [state, setState] = useState<TemplateDataState>({
    template: null,
    templateDefinition: null,
    bindings: [],
    data: {},
    validation: null,
    isDirty: false,
    isValid: false,
    lastSaved: null,
    errors: [],
    warnings: [],
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // History management
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(autoSave);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

  // Refs
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pdfmeIntegrationRef = useRef<PdfmeIntegration | null>(null);

  // Initialize PDFme integration
  useEffect(() => {
    pdfmeIntegrationRef.current = new PdfmeIntegration();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (isAutoSaveEnabled && state.isDirty && state.template) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      autoSaveIntervalRef.current = setInterval(() => {
        if (state.isDirty) {
          saveTemplate();
        }
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isAutoSaveEnabled, state.isDirty, autoSaveInterval]);

  // Validation effect
  useEffect(() => {
    if (validateOnChange && state.template) {
      validateTemplate();
    }
  }, [state.template, validateOnChange]);

  /**
   * Add entry to history
   */
  const addToHistory = useCallback((description: string) => {
    if (!enableUndo || !state.template) return;

    const entry: HistoryEntry = {
      timestamp: Date.now(),
      template: JSON.parse(JSON.stringify(state.template)),
      data: JSON.parse(JSON.stringify(state.data)),
      description,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(entry);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });

    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [state.template, state.data, historyIndex, maxHistorySize, enableUndo]);

  /**
   * Load template by ID
   */
  const loadTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const templateDefinition = await templateManager.loadTemplate(templateId);
      if (!templateDefinition) {
        setState(prev => ({ ...prev, errors: ['Template not found'] }));
        return false;
      }

      // Extract data bindings
      const bindings = dataBindingService.extractVariables(templateDefinition.template).variables;
      
      // Generate sample data if needed
      const data = templateDefinition.sampleData || dataBindingService.generateSampleData(bindings);

      setState(prev => ({
        ...prev,
        template: templateDefinition.template as EducationalTemplate,
        templateDefinition,
        bindings,
        data,
        isDirty: false,
        lastSaved: templateDefinition.metadata.updatedAt,
        errors: [],
        warnings: [],
      }));

      // Reset history
      setHistory([]);
      setHistoryIndex(-1);

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Failed to load template'],
      }));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create new template
   */
  const createTemplate = useCallback(async (name: string, category = 'general'): Promise<boolean> => {
    try {
      setIsLoading(true);

      const newTemplate = pdfmeIntegrationRef.current?.createEducationalTemplate({
        title: name,
        pageSize: 'A4',
        orientation: 'portrait',
      });

      if (!newTemplate) {
        setState(prev => ({ ...prev, errors: ['Failed to create template'] }));
        return false;
      }

      const templateDefinition = await templateManager.createTemplate(name, newTemplate as EducationalTemplate, {
        category: category as any,
        description: `New ${category} template`,
        tags: [category],
      });

      const bindings = dataBindingService.extractVariables(newTemplate).variables;
      const data = dataBindingService.generateSampleData(bindings);

      setState(prev => ({
        ...prev,
        template: newTemplate as EducationalTemplate,
        templateDefinition,
        bindings,
        data,
        isDirty: false,
        lastSaved: Date.now(),
        errors: [],
        warnings: [],
      }));

      // Reset history
      setHistory([]);
      setHistoryIndex(-1);

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Failed to create template'],
      }));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save template
   */
  const saveTemplate = useCallback(async (): Promise<boolean> => {
    if (!state.template || !state.templateDefinition) {
      setState(prev => ({ ...prev, errors: ['No template to save'] }));
      return false;
    }

    try {
      setIsSaving(true);

      const updatedDefinition: TemplateDefinition = {
        ...state.templateDefinition,
        template: state.template,
        sampleData: state.data,
        metadata: {
          ...state.templateDefinition.metadata,
          updatedAt: Date.now(),
        },
      };

      await templateManager.saveTemplate(updatedDefinition);

      setState(prev => ({
        ...prev,
        templateDefinition: updatedDefinition,
        isDirty: false,
        lastSaved: Date.now(),
        errors: [],
      }));

      setLastAutoSave(Date.now());
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Failed to save template'],
      }));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state.template, state.templateDefinition, state.data]);

  /**
   * Reset template
   */
  const resetTemplate = useCallback(() => {
    setState({
      template: null,
      templateDefinition: null,
      bindings: [],
      data: {},
      validation: null,
      isDirty: false,
      isValid: false,
      lastSaved: null,
      errors: [],
      warnings: [],
    });

    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  /**
   * Update template
   */
  const updateTemplate = useCallback((updates: Partial<EducationalTemplate>) => {
    if (!state.template) return;

    const updatedTemplate = { ...state.template, ...updates };
    
    setState(prev => ({
      ...prev,
      template: updatedTemplate,
      isDirty: true,
    }));

    addToHistory('Update template');
  }, [state.template, addToHistory]);

  /**
   * Update metadata
   */
  const updateMetadata = useCallback((metadata: Partial<TemplateDefinition['metadata']>) => {
    if (!state.templateDefinition) return;

    setState(prev => ({
      ...prev,
      templateDefinition: {
        ...prev.templateDefinition!,
        metadata: {
          ...prev.templateDefinition!.metadata,
          ...metadata,
        },
      },
      isDirty: true,
    }));
  }, [state.templateDefinition]);

  /**
   * Update bindings
   */
  const updateBindings = useCallback((bindings: DataBinding[]) => {
    setState(prev => ({
      ...prev,
      bindings,
      isDirty: true,
    }));
  }, []);

  /**
   * Update single data value
   */
  const updateData = useCallback((path: string, value: any) => {
    setState(prev => {
      const newData = { ...prev.data };
      
      // Set nested value
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;

      return {
        ...prev,
        data: newData,
        isDirty: true,
      };
    });
  }, []);

  /**
   * Update multiple data values
   */
  const updateDataBatch = useCallback((updates: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates },
      isDirty: true,
    }));
  }, []);

  /**
   * Generate sample data
   */
  const generateSampleData = useCallback(() => {
    if (state.bindings.length === 0) return;

    const sampleData = dataBindingService.generateSampleData(state.bindings);
    
    setState(prev => ({
      ...prev,
      data: sampleData,
      isDirty: true,
    }));

    addToHistory('Generate sample data');
  }, [state.bindings, addToHistory]);

  /**
   * Validate template
   */
  const validateTemplate = useCallback(async (): Promise<ValidationReport> => {
    if (!state.template) {
      const emptyReport: ValidationReport = {
        isValid: false,
        score: 0,
        issues: [{ 
          id: 'no_template', 
          severity: 'error', 
          category: 'structure', 
          message: 'No template to validate' 
        }],
        statistics: { totalElements: 0, totalPages: 0, totalQuestions: 0, totalDataBindings: 0, complexity: 'low' },
        suggestions: [],
        performanceMetrics: { estimatedRenderTime: 0, memoryUsage: 'low', optimizationOpportunities: [] },
      };
      
      setState(prev => ({ ...prev, validation: emptyReport, isValid: false }));
      return emptyReport;
    }

    try {
      const validation = templateValidator.validateTemplate(state.template);
      
      setState(prev => ({
        ...prev,
        validation,
        isValid: validation.isValid,
        errors: validation.issues.filter(i => i.severity === 'error').map(i => i.message),
        warnings: validation.issues.filter(i => i.severity === 'warning').map(i => i.message),
      }));

      return validation;
    } catch (error) {
      const errorReport: ValidationReport = {
        isValid: false,
        score: 0,
        issues: [{ 
          id: 'validation_error', 
          severity: 'error', 
          category: 'structure', 
          message: error instanceof Error ? error.message : 'Validation failed' 
        }],
        statistics: { totalElements: 0, totalPages: 0, totalQuestions: 0, totalDataBindings: 0, complexity: 'low' },
        suggestions: [],
        performanceMetrics: { estimatedRenderTime: 0, memoryUsage: 'low', optimizationOpportunities: [] },
      };

      setState(prev => ({ 
        ...prev, 
        validation: errorReport, 
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
      }));

      return errorReport;
    }
  }, [state.template]);

  /**
   * Validate data
   */
  const validateData = useCallback((): DataMappingResult => {
    return dataBindingService.mapData(state.bindings, state.data);
  }, [state.bindings, state.data]);

  /**
   * Generate preview PDF
   */
  const generatePreview = useCallback(async (): Promise<Uint8Array | null> => {
    if (!state.template || !pdfmeIntegrationRef.current) return null;

    try {
      setIsGenerating(true);
      
      const mappingResult = validateData();
      if (!mappingResult.success) {
        setState(prev => ({ 
          ...prev, 
          errors: ['Data validation failed: ' + mappingResult.errors.join(', ')] 
        }));
        return null;
      }

      const pdf = await pdfmeIntegrationRef.current.generatePDF({
        template: state.template,
        inputs: [mappingResult.data],
      });

      return pdf;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Failed to generate preview'],
      }));
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [state.template, validateData]);

  /**
   * Undo last change
   */
  const undo = useCallback((): boolean => {
    if (!enableUndo || historyIndex <= 0) return false;

    const entry = history[historyIndex - 1];
    if (!entry) return false;

    setState(prev => ({
      ...prev,
      template: JSON.parse(JSON.stringify(entry.template)),
      data: JSON.parse(JSON.stringify(entry.data)),
      isDirty: true,
    }));

    setHistoryIndex(prev => prev - 1);
    return true;
  }, [enableUndo, history, historyIndex]);

  /**
   * Redo last undone change
   */
  const redo = useCallback((): boolean => {
    if (!enableUndo || historyIndex >= history.length - 1) return false;

    const entry = history[historyIndex + 1];
    if (!entry) return false;

    setState(prev => ({
      ...prev,
      template: JSON.parse(JSON.stringify(entry.template)),
      data: JSON.parse(JSON.stringify(entry.data)),
      isDirty: true,
    }));

    setHistoryIndex(prev => prev + 1);
    return true;
  }, [enableUndo, history, historyIndex]);

  /**
   * Enable auto-save
   */
  const enableAutoSave = useCallback((intervalMs = autoSaveInterval) => {
    setIsAutoSaveEnabled(true);
    // The effect will handle setting up the interval
  }, [autoSaveInterval]);

  /**
   * Disable auto-save
   */
  const disableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(false);
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    isLoading,
    isSaving,
    isGenerating,
    
    // History state
    canUndo: enableUndo && historyIndex > 0,
    canRedo: enableUndo && historyIndex < history.length - 1,
    historySize: history.length,
    
    // Auto-save state
    isAutoSaveEnabled,
    lastAutoSave,
    
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