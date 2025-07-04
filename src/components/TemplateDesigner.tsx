// UPDATED: 2025-07-04 - Enhanced with BlockLibrary integration and improved UX

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Designer } from '@pdfme/ui';
import { Template } from '@pdfme/common';
import { 
  Save, 
  Download, 
  Eye, 
  Settings, 
  Layers, 
  FileText, 
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Copy,
  Upload
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { PdfmeIntegration } from '@/lib/pdfme-integration';
import { getEducationalPlugins } from '@/lib/educational-plugins';
import { EducationalTemplate } from '@/types/pdfme-extensions';
import { GeminiAnalysisResponse } from '@/types/gemini';
import { GeminiToPdfmeMapper } from '@/lib/gemini-to-pdfme';
import { useTemplateData } from '@/hooks/useTemplateData';
import { BlockLibrary, EducationalBlock } from './BlockLibrary';
import { TemplateManager } from './TemplateManager';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface TemplateDesignerProps {
  geminiAnalysis?: GeminiAnalysisResponse;
  onSave?: (template: EducationalTemplate) => void;
  onPreview?: (template: EducationalTemplate) => void;
  className?: string;
}

export function TemplateDesigner({
  geminiAnalysis,
  onSave,
  onPreview,
  className = '',
}: TemplateDesignerProps) {
  // Template data management
  const {
    template,
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
    isAutoSaveEnabled,
    lastAutoSave,
    updateTemplate,
    updateMetadata,
    saveTemplate,
    validateTemplate,
    generatePreview,
    undo,
    redo,
    enableAutoSave,
    disableAutoSave,
    createTemplate,
    loadTemplate,
  } = useTemplateData({
    autoSave: true,
    autoSaveInterval: 30000,
    validateOnChange: true,
    enableUndo: true,
  });

  // UI state
  const [selectedTab, setSelectedTab] = useState<'blocks' | 'properties' | 'data' | 'templates'>('blocks');
  const [isDesignerReady, setIsDesignerReady] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<Uint8Array | null>(null);
  const [designerInstance, setDesignerInstance] = useState<Designer | null>(null);

  // Refs
  const designerRef = useRef<HTMLDivElement>(null);
  const pdfmeIntegrationRef = useRef<PdfmeIntegration | null>(null);

  // Initialize PDFme integration
  useEffect(() => {
    pdfmeIntegrationRef.current = new PdfmeIntegration();
  }, []);

  // Initialize designer when template is available
  useEffect(() => {
    if (template && designerRef.current && pdfmeIntegrationRef.current && !designerInstance) {
      initializeDesigner();
    }
  }, [template, designerInstance]);

  // Initialize from Gemini analysis
  useEffect(() => {
    if (geminiAnalysis && !template) {
      handleCreateFromGemini();
    }
  }, [geminiAnalysis, template]);

  /**
   * Initialize PDFme Designer
   */
  const initializeDesigner = useCallback(async () => {
    if (!designerRef.current || !pdfmeIntegrationRef.current || !template) return;

    try {
      setIsDesignerReady(false);

      // Create designer instance
      const designer = pdfmeIntegrationRef.current.createDesigner(
        designerRef.current,
        template,
        {
          theme: {
            token: { colorPrimary: '#3b82f6' },
          },
        }
      );

      // Set up event listeners
      designer.onSaveTemplate((savedTemplate: Template) => {
        updateTemplate(savedTemplate as EducationalTemplate);
      });

      setDesignerInstance(designer);
      setIsDesignerReady(true);
    } catch (error) {
      console.error('Failed to initialize designer:', error);
    }
  }, [template, updateTemplate]);

  /**
   * Create template from Gemini analysis
   */
  const handleCreateFromGemini = useCallback(async () => {
    if (!geminiAnalysis) return;

    try {
      const mapper = new GeminiToPdfmeMapper();
      const mappingResult = mapper.convertAnalysisToTemplate(geminiAnalysis);
      
      if (mappingResult.template) {
        const templateName = geminiAnalysis.extractedContent.title || 'AI Generated Template';
        await createTemplate(templateName, 'general');
        updateTemplate(mappingResult.template as EducationalTemplate);
      }
    } catch (error) {
      console.error('Failed to create template from Gemini analysis:', error);
    }
  }, [geminiAnalysis, createTemplate, updateTemplate]);

  /**
   * Handle block selection from BlockLibrary
   */
  const handleBlockSelect = useCallback((block: EducationalBlock) => {
    if (!designerInstance || !template) return;

    try {
      // Find the current page (assume page 0 for now)
      const currentPageIndex = 0;
      const currentPage = template.schemas[currentPageIndex] || [];

      // Create new schema from block
      const newSchema = {
        ...block.schema,
        name: `${block.id}_${Date.now()}`,
        // Position new element at a reasonable location
        position: {
          x: 20 + (currentPage.length * 10), // Slight offset for each new element
          y: 50 + (currentPage.length * 20),
        },
      };

      // Add to template
      const updatedTemplate = {
        ...template,
        schemas: template.schemas.map((pageSchemas, index) => 
          index === currentPageIndex 
            ? [...pageSchemas, newSchema]
            : pageSchemas
        ),
      };

      updateTemplate(updatedTemplate);

      // Update designer
      designerInstance.updateTemplate(updatedTemplate);
    } catch (error) {
      console.error('Failed to add block to template:', error);
    }
  }, [designerInstance, template, updateTemplate]);

  /**
   * Handle template selection from TemplateManager
   */
  const handleTemplateSelect = useCallback(async (templateDef: any) => {
    try {
      await loadTemplate(templateDef.metadata.id);
      setShowTemplateManager(false);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  }, [loadTemplate]);

  /**
   * Handle template save
   */
  const handleSave = useCallback(async () => {
    if (!template) return;

    try {
      const success = await saveTemplate();
      if (success && onSave) {
        onSave(template);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }, [template, saveTemplate, onSave]);

  /**
   * Handle preview generation
   */
  const handlePreview = useCallback(async () => {
    if (!template) return;

    try {
      const pdf = await generatePreview();
      if (pdf) {
        setPreviewPdf(pdf);
        setShowPreviewDialog(true);
        
        if (onPreview) {
          onPreview(template);
        }
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  }, [template, generatePreview, onPreview]);

  /**
   * Download template as JSON
   */
  const handleDownloadTemplate = useCallback(() => {
    if (!template || !templateDefinition) return;

    try {
      const dataStr = JSON.stringify(templateDefinition, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateDefinition.metadata.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  }, [template, templateDefinition]);

  /**
   * Create new blank template
   */
  const handleCreateNew = useCallback(async () => {
    try {
      await createTemplate('New Template', 'general');
    } catch (error) {
      console.error('Failed to create new template:', error);
    }
  }, [createTemplate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`template-designer flex h-full ${className}`}>
      {/* Enhanced Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Template Designer</h2>
            <div className="flex items-center gap-2">
              {isAutoSaveEnabled && (
                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                  Auto-save
                </Badge>
              )}
              {isDirty && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                  Unsaved
                </Badge>
              )}
            </div>
          </div>
          
          {/* Template Info */}
          {templateDefinition && (
            <div className="text-sm text-gray-600">
              <div className="font-medium">{templateDefinition.metadata.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span>{template?.schemas.length || 0} page(s)</span>
                <span>•</span>
                <span>{templateDefinition.metadata.category}</span>
                {validation && (
                  <>
                    <span>•</span>
                    <span className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
                      Score: {validation.score}%
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={handleCreateNew}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              New
            </Button>
            <Button
              onClick={() => setShowTemplateManager(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Load
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={undo}
              disabled={!canUndo}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={redo}
              disabled={!canRedo}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 scale-x-[-1]" />
            </Button>
            <Button
              onClick={validateTemplate}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Check
            </Button>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs.Root value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="flex-1 flex flex-col">
          <Tabs.List className="grid w-full grid-cols-4 m-4">
            <Tabs.Trigger value="blocks" className="flex items-center gap-1 text-xs">
              <Layers className="w-3 h-3" />
              Blocks
            </Tabs.Trigger>
            <Tabs.Trigger value="properties" className="flex items-center gap-1 text-xs">
              <Settings className="w-3 h-3" />
              Props
            </Tabs.Trigger>
            <Tabs.Trigger value="data" className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              Data
            </Tabs.Trigger>
            <Tabs.Trigger value="templates" className="flex items-center gap-1 text-xs">
              <Copy className="w-3 h-3" />
              Library
            </Tabs.Trigger>
          </Tabs.List>

          {/* Block Library Tab */}
          <Tabs.Content value="blocks" className="flex-1 overflow-hidden">
            <BlockLibrary
              onBlockSelect={handleBlockSelect}
              className="h-full"
            />
          </Tabs.Content>

          {/* Properties Tab */}
          <Tabs.Content value="properties" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Template Properties</h4>
              
              {/* Template Metadata */}
              {templateDefinition && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateDefinition.metadata.name}
                      onChange={(e) => updateMetadata({ name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={templateDefinition.metadata.description}
                      onChange={(e) => updateMetadata({ description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={templateDefinition.metadata.category}
                      onChange={(e) => updateMetadata({ category: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="quiz">Quiz</option>
                      <option value="worksheet">Worksheet</option>
                      <option value="exam">Exam</option>
                      <option value="assignment">Assignment</option>
                      <option value="handout">Handout</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Validation Results */}
              {validation && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Validation</h5>
                  <div className={`p-3 rounded-lg text-sm ${
                    validation.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="font-medium mb-1">
                      Quality Score: {validation.score}%
                    </div>
                    {validation.issues.length > 0 && (
                      <ul className="text-xs space-y-1">
                        {validation.issues.slice(0, 3).map((issue, index) => (
                          <li key={index}>• {issue.message}</li>
                        ))}
                        {validation.issues.length > 3 && (
                          <li>• And {validation.issues.length - 3} more issues...</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Tabs.Content>

          {/* Data Tab */}
          <Tabs.Content value="data" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Template Data</h4>
              
              {bindings.length > 0 ? (
                <div className="space-y-3">
                  {bindings.slice(0, 10).map((binding) => (
                    <div key={binding.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {binding.label}
                        {binding.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={binding.type === 'number' ? 'number' : 'text'}
                        value={data[binding.path] || ''}
                        onChange={(e) => {
                          const value = binding.type === 'number' ? Number(e.target.value) : e.target.value;
                          // updateData(binding.path, value); // This method needs to be available
                        }}
                        placeholder={binding.example || binding.defaultValue}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {binding.description && (
                        <p className="text-xs text-gray-500 mt-1">{binding.description}</p>
                      )}
                    </div>
                  ))}
                  {bindings.length > 10 && (
                    <p className="text-sm text-gray-500">
                      And {bindings.length - 10} more data bindings...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No data bindings found in this template.</p>
              )}
            </div>
          </Tabs.Content>

          {/* Templates Tab */}
          <Tabs.Content value="templates" className="flex-1 overflow-hidden">
            <div className="h-full">
              <TemplateManager
                onTemplateSelect={handleTemplateSelect}
                selectedTemplateId={templateDefinition?.metadata.id}
                className="h-full"
              />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-gray-900">
                {templateDefinition?.metadata.name || 'Template Designer'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isDesignerReady ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Loading...
                  </Badge>
                )}
                {lastAutoSave && (
                  <span className="text-xs">
                    Last saved: {new Date(lastAutoSave).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreview}
                disabled={!template || isGenerating}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Preview
              </Button>
              
              <Button
                onClick={handleDownloadTemplate}
                disabled={!template}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!template || isSaving || !isDirty}
                size="sm"
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Designer Canvas */}
        <div className="flex-1 bg-gray-50 p-4">
          <div 
            ref={designerRef} 
            className="w-full h-full border border-gray-200 rounded-lg bg-white shadow-sm"
            style={{ minHeight: '600px' }}
          />
        </div>
      </div>

      {/* Template Manager Dialog */}
      <Dialog.Root open={showTemplateManager} onOpenChange={setShowTemplateManager}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg w-full max-w-6xl h-4/5 z-50 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold">
                  Template Library
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm">
                    Close
                  </Button>
                </Dialog.Close>
              </div>
              <div className="flex-1 overflow-hidden">
                <TemplateManager
                  onTemplateSelect={handleTemplateSelect}
                  selectedTemplateId={templateDefinition?.metadata.id}
                  className="h-full"
                />
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Preview Dialog */}
      <Dialog.Root open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg w-full max-w-4xl h-4/5 z-50">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold">
                  Template Preview
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm">
                    Close
                  </Button>
                </Dialog.Close>
              </div>
              <div className="flex-1 p-4">
                {previewPdf && (
                  <iframe
                    src={URL.createObjectURL(new Blob([previewPdf], { type: 'application/pdf' }))}
                    className="w-full h-full border border-gray-200 rounded"
                  />
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}