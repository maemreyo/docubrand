"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Designer } from "@pdfme/ui";
import { EducationalTemplate } from "@/types/pdfme-extensions";
import { TemplateDefinition } from "@/lib/template-manager";
import { Dialog, DialogContent, DialogOverlay } from "@radix-ui/react-dialog";

// Import fixed components
import DesignerSidebar from "./template-designer/DesignerSidebar";
import DesignerToolbar from "./template-designer/DesignerToolbar";
import DesignerCanvas from "./template-designer/DesignerCanvas"; // Use fixed version
import TemplateManager from "./template-designer/TemplateManager";
import { EducationalBlock } from "./template-designer/BlockLibrary";

// Import fixed hook and integration
import { useTemplateData } from "@/hooks/useTemplateData"; // Use fixed version
import { PdfmeIntegration } from "@/lib/pdfme-integration";

interface TemplateDesignerProps {
  initialTemplate?: EducationalTemplate;
  onSave?: (template: EducationalTemplate) => void;
  onPreview?: (template: EducationalTemplate) => void;
  onExport?: (template: EducationalTemplate) => void;
  className?: string;
}

/**
 * Fixed Template Designer with optimized React + PDFme integration
 * 
 * Key fixes:
 * 1. Proper callback memoization to prevent unnecessary re-renders
 * 2. Stable refs for Designer instance management
 * 3. Optimized state updates with debouncing
 * 4. Proper separation of UI state vs template state
 * 5. Break feedback loops between components
 */
export function TemplateDesigner({
  initialTemplate,
  onSave,
  onPreview,
  onExport,
  className = "",
}: TemplateDesignerProps) {
  // Fixed template data hook with stable references
  const {
    // State
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
  } = useTemplateData({
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    validateOnChange: true,
    enableUndo: true,
  });

  // UI state (separate from template state to prevent conflicts)
  const [designerInstance, setDesignerInstance] = useState<Designer | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<Uint8Array | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Refs to prevent re-render loops
  const isLoadingInitialTemplate = useRef(false);

  // Load initial template (only once)
  useEffect(() => {
    if (initialTemplate && !template && !isLoadingInitialTemplate.current) {
      isLoadingInitialTemplate.current = true;
      loadTemplate(initialTemplate);
    }
  }, [initialTemplate, template, loadTemplate]);

  // CRITICAL: Memoized callbacks to prevent unnecessary re-renders
  const handleDesignerReady = useCallback((designer: Designer) => {
    console.log("TemplateDesigner: Designer ready callback received");
    setDesignerInstance(designer);
    setCanvasReady(true);
  }, []);

  // CRITICAL: Stable template change handler
  const handleTemplateChange = useCallback(
    (newTemplate: EducationalTemplate) => {
      console.log("TemplateDesigner: Template change callback received");
      
      // Only update if template actually changed
      if (template && JSON.stringify(template) === JSON.stringify(newTemplate)) {
        return;
      }
      
      updateTemplate(newTemplate);
    },
    [template, updateTemplate]
  );

  const handleCanvasError = useCallback((error: Error) => {
    console.error("TemplateDesigner: Canvas error:", error);
    setCanvasReady(false);
  }, []);

  // Block selection handler
  const handleBlockSelect = useCallback((block: EducationalBlock) => {
    console.log("TemplateDesigner: Block selected:", block.name);
    // Add block to template if designer is ready
    if (designerInstance && canvasReady && templateDefinition) {
      if (block.id === 'multiple-choice') {
        // Get current template
        const currentTemplate = designerInstance.getTemplate();
        
        // Create a PdfmeIntegration instance
        const pdfme = new PdfmeIntegration();
        
        // Add multiple choice block
        try {
          // Calculate position - center of the visible area
          const visibleArea = designerInstance.getVisibleArea?.() || { x: 20, y: 20, width: 200, height: 200 };
          const position = {
            x: visibleArea.x + 20,
            y: visibleArea.y + 20
          };
          
          // Extract choices from the block schema
          // This will be populated by the dialog in BlockLibrary
          let choices = ["Option A", "Option B", "Option C", "Option D"];
          
          // If the block has educational data with choices, use those
          if (block.schema.educational?.choices && Array.isArray(block.schema.educational.choices)) {
            choices = block.schema.educational.choices;
            console.log("Using choices from dialog:", choices);
          }
          
          // Add the multiple choice block
          const result = pdfme.addMultipleChoiceBlock(currentTemplate, {
            position,
            questionText: block.schema.content || "What is your question?",
            choices: choices.filter(choice => choice.trim() !== ''),
            width: block.schema.width || 180
          });
          
          // Update the designer with the new template
          designerInstance.updateTemplate(result.template);
          
          console.log("Added multiple choice block to template:", result.blockResult.groupId);
        } catch (error) {
          console.error("Failed to add multiple choice block:", error);
        }
      } else {
        // Default implementation for other blocks
        console.log("Adding block to template:", block);
        
        // Get current template
        const currentTemplate = designerInstance.getTemplate();
        
        // Add the block schema to the template
        const newSchemas = [...currentTemplate.schemas];
        if (newSchemas[0]) {
          newSchemas[0] = [...newSchemas[0], block.schema];
        } else {
          newSchemas[0] = [block.schema];
        }
        
        // Update the designer with the new template
        designerInstance.updateTemplate({
          ...currentTemplate,
          schemas: newSchemas
        });
      }
    }
  }, [designerInstance, canvasReady, templateDefinition]);

  // Template selection handler
  const handleTemplateSelect = useCallback((templateDef: TemplateDefinition) => {
    console.log("TemplateDesigner: Template selected:", templateDef.metadata.name);
    loadTemplate(templateDef.template);
    setShowTemplateManager(false);
  }, [loadTemplate]);

  // Action handlers with proper memoization
  const handleNewTemplate = useCallback(() => {
    createTemplate();
    setShowTemplateManager(false);
  }, [createTemplate]);

  const handleLoadTemplate = useCallback(() => {
    setShowTemplateManager(true);
  }, []);

  const handleSave = useCallback(async () => {
    await saveTemplate();
    if (template && onSave) {
      onSave(template);
    }
  }, [saveTemplate, template, onSave]);

  const handlePreview = useCallback(async () => {
    if (!template) return;
    
    try {
      const pdf = await generatePreview();
      setPreviewPdf(pdf);
      setShowPreviewDialog(true);
      
      if (onPreview) {
        onPreview(template);
      }
    } catch (error) {
      console.error("Preview generation failed:", error);
    }
  }, [template, generatePreview, onPreview]);

  const handleExport = useCallback(() => {
    if (template && onExport) {
      onExport(template);
    }
  }, [template, onExport]);

  const handleShare = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  const handleSettings = useCallback(() => {
    setShowSettingsDialog(true);
  }, []);

  const handleNameChange = useCallback((newName: string) => {
    updateMetadata({ name: newName });
  }, [updateMetadata]);

  const handleDataChange = useCallback((path: string, value: any) => {
    updateData(path, value);
  }, [updateData]);

  const handleToggleAutoSave = useCallback(() => {
    if (isAutoSaveEnabled) {
      disableAutoSave();
    } else {
      enableAutoSave();
    }
  }, [isAutoSaveEnabled, disableAutoSave, enableAutoSave]);

  // Memoized template for DesignerCanvas to prevent unnecessary prop changes
  const stableTemplateForCanvas = useMemo(() => {
    return template;
  }, [template]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`template-designer flex h-full bg-gray-50 ${className}`}>
      {/* Sidebar - memoized to prevent unnecessary re-renders */}
      <DesignerSidebar
        templateDefinition={templateDefinition}
        validation={validation}
        bindings={bindings}
        data={data}
        isDirty={isDirty}
        canUndo={canUndo}
        canRedo={canRedo}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onMetadataChange={updateMetadata}
        onBlockSelect={handleBlockSelect}
        onTemplateSelect={handleTemplateSelect}
        onNew={handleNewTemplate}
        onLoad={handleLoadTemplate}
        onUndo={undo}
        onRedo={redo}
        onValidate={validateTemplate}
        onDataChange={handleDataChange}
        onToggleAutoSave={handleToggleAutoSave}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar - memoized props */}
        <DesignerToolbar
          templateName={templateDefinition?.metadata.name || "Untitled Template"}
          isReady={canvasReady}
          isSaving={isSaving}
          isGenerating={isGenerating}
          isDirty={isDirty}
          lastAutoSave={lastAutoSave}
          lastSaved={lastSaved}
          onSave={handleSave}
          onPreview={handlePreview}
          onExport={handleExport}
          onShare={handleShare}
          onSettings={handleSettings}
          onNameChange={handleNameChange}
        />

        {/* Canvas area - CRITICAL: Use stable template reference */}
        <main className="flex-1 p-6 min-h-0">
          <div className="h-full w-full">
            {stableTemplateForCanvas ? (
              <DesignerCanvas
                template={stableTemplateForCanvas}
                onReady={handleDesignerReady}
                onChange={handleTemplateChange}
                onError={handleCanvasError}
                disabled={isLoading}
                className="h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No template loaded</p>
                  <button
                    onClick={handleNewTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create New Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      {showTemplateManager && (
        <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
          <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-4xl h-[80vh] bg-white rounded-lg shadow-xl z-50">
            <TemplateManager
              onTemplateSelect={handleTemplateSelect}
              onClose={() => setShowTemplateManager(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showPreviewDialog && previewPdf && (
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-4xl h-[80vh] bg-white rounded-lg shadow-xl z-50">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Template Preview</h2>
              {/* PDF viewer would go here */}
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <p className="text-gray-500">PDF Preview</p>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowPreviewDialog(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Development debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded border shadow-lg text-xs max-w-xs">
          <h4 className="font-semibold mb-1">Debug Info</h4>
          <p>Template: {template ? 'Loaded' : 'None'}</p>
          <p>Canvas Ready: {canvasReady ? 'Yes' : 'No'}</p>
          <p>Designer Instance: {designerInstance ? 'Ready' : 'None'}</p>
          <p>Is Dirty: {isDirty ? 'Yes' : 'No'}</p>
          <p>History Size: {historySize}</p>
          <p>Auto-save: {isAutoSaveEnabled ? 'On' : 'Off'}</p>
        </div>
      )}
    </div>
  );
}

export default TemplateDesigner;