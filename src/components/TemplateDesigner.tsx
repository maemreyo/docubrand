"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Designer } from "@pdfme/ui";
import { useTemplateData } from "@/hooks/useTemplateData";
import { EducationalTemplate } from "@/types/pdfme-extensions";
import { TemplateDefinition } from "@/lib/template-manager";
import { Dialog, DialogContent, DialogOverlay } from "@radix-ui/react-dialog";

// Import child components
import DesignerSidebar from "./template-designer/DesignerSidebar";
import DesignerToolbar from "./template-designer/DesignerToolbar";
import DesignerCanvas from "./template-designer/DesignerCanvas";
import TemplateManager from "./template-designer/TemplateManager";
import { EducationalBlock } from "./template-designer/BlockLibrary";

interface TemplateDesignerProps {
  initialTemplate?: EducationalTemplate;
  onSave?: (template: EducationalTemplate) => void;
  onPreview?: (template: EducationalTemplate) => void;
  onExport?: (template: EducationalTemplate) => void;
  className?: string;
}

export function TemplateDesigner({
  initialTemplate,
  onSave,
  onPreview,
  onExport,
  className = "",
}: TemplateDesignerProps) {
  // Template data hook - single source of truth
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

  // UI state (not part of template data)
  const [designerInstance, setDesignerInstance] = useState<Designer | null>(
    null
  );
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<Uint8Array | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Load initial template
  useEffect(() => {
    if (initialTemplate && !template) {
      updateTemplate(initialTemplate);
    }
  }, [initialTemplate, template, updateTemplate]);

  // Memoized event handlers
  const handleSave = useCallback(async () => {
    try {
      const success = await saveTemplate();
      if (success && onSave && template) {
        onSave(template);
      }
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  }, [saveTemplate, onSave, template]);

  const handlePreview = useCallback(async () => {
    try {
      const pdf = await generatePreview();
      if (pdf) {
        setPreviewPdf(pdf);
        setShowPreviewDialog(true);

        if (onPreview && template) {
          onPreview(template);
        }
      }
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  }, [generatePreview, onPreview, template]);

  const handleExport = useCallback(() => {
    if (!template || !templateDefinition) return;

    try {
      const dataStr = JSON.stringify(templateDefinition, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${templateDefinition.metadata.name.replace(
        /[^a-z0-9]/gi,
        "_"
      )}.json`;
      link.click();
      URL.revokeObjectURL(url);

      if (onExport && template) {
        onExport(template);
      }
    } catch (error) {
      console.error("Failed to export template:", error);
    }
  }, [template, templateDefinition, onExport]);

  const handleShare = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  const handleSettings = useCallback(() => {
    setShowSettingsDialog(true);
  }, []);

  const handleNameChange = useCallback(
    (name: string) => {
      updateMetadata({ name });
    },
    [updateMetadata]
  );

  const handleTemplateSelect = useCallback(
    async (templateDef: TemplateDefinition) => {
      try {
        await loadTemplate(templateDef.metadata.id);
        setShowTemplateManager(false);
      } catch (error) {
        console.error("Failed to load template:", error);
      }
    },
    [loadTemplate]
  );

  const handleTemplateCreate = useCallback(
    (templateDef: TemplateDefinition) => {
      // Template already created by TemplateManager, just close the dialog
      setShowTemplateManager(false);
    },
    []
  );

  const handleBlockSelect = useCallback(
    (block: EducationalBlock) => {
      if (!designerInstance || !template) return;

      try {
        // Add block to current page (assume page 0 for now)
        const pageIndex = 0;
        const currentSchemas = template.schemas[pageIndex] || [];

        // Create new schema from block with unique name
        const newSchema = {
          ...block.schema,
          name: `${block.id}_${Date.now()}`,
          // Position in center of canvas
          position: {
            x: 50,
            y: 50,
          },
        };

        const updatedTemplate: EducationalTemplate = {
          ...template,
          schemas: template.schemas.map((pageSchemas, index) =>
            index === pageIndex ? [...pageSchemas, newSchema] : pageSchemas
          ),
        };

        updateTemplate(updatedTemplate);

        // Update designer instance
        if (designerInstance) {
          designerInstance.updateTemplate(updatedTemplate);
        }
      } catch (error) {
        console.error("Failed to add block to template:", error);
      }
    },
    [designerInstance, template, updateTemplate]
  );

  const handleNewTemplate = useCallback(async () => {
    try {
      const name = prompt("Enter template name:", "New Template");
      if (name) {
        await createTemplate(name, "general");
      }
    } catch (error) {
      console.error("Failed to create new template:", error);
    }
  }, [createTemplate]);

  const handleLoadTemplate = useCallback(() => {
    setShowTemplateManager(true);
  }, []);

  const handleDataChange = useCallback(
    (path: string, value: any) => {
      updateData(path, value);
    },
    [updateData]
  );

  const handleToggleAutoSave = useCallback(() => {
    if (isAutoSaveEnabled) {
      disableAutoSave();
    } else {
      enableAutoSave();
    }
  }, [isAutoSaveEnabled, enableAutoSave, disableAutoSave]);

  const handleDesignerReady = useCallback((designer: Designer) => {
    console.log("TemplateDesigner: Designer ready callback received");
    setDesignerInstance(designer);
    setCanvasReady(true);
  }, []);

  const handleTemplateChange = useCallback(
    (newTemplate: EducationalTemplate) => {
      console.log("TemplateDesigner: Template change callback received");
      updateTemplate(newTemplate);
    },
    [updateTemplate]
  );

  const handleCanvasError = useCallback((error: Error) => {
    console.error("TemplateDesigner: Canvas error:", error);
    setCanvasReady(false);
  }, []);

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
      {/* Sidebar */}
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
        {/* Toolbar */}
        <DesignerToolbar
          templateName={
            templateDefinition?.metadata.name || "Untitled Template"
          }
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

        {/* Canvas area - Always render but with different content */}
        <main className="flex-1 p-6 min-h-0">
          <div className="h-full w-full">
            {template ? (
              <DesignerCanvas
                template={template}
                onReady={handleDesignerReady}
                onChange={handleTemplateChange}
                onError={handleCanvasError}
                disabled={isSaving || isGenerating}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Template Loaded
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create a new template or load an existing one to start
                    designing
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={handleNewTemplate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create New
                    </button>
                    <button
                      onClick={handleLoadTemplate}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Load Template
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Template Manager Dialog */}
      <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-4/5 z-50">
          <TemplateManager
            onTemplateSelect={handleTemplateSelect}
            onTemplateCreate={handleTemplateCreate}
            onClose={() => setShowTemplateManager(false)}
            isOpen={showTemplateManager}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-4/5 z-50">
          <div className="bg-white rounded-lg overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Template Preview
              </h3>
              <button
                onClick={() => setShowPreviewDialog(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4">
              {previewPdf ? (
                <iframe
                  src={URL.createObjectURL(
                    new Blob([previewPdf], { type: "application/pdf" })
                  )}
                  className="w-full h-full border border-gray-200 rounded-lg"
                  title="Template Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Share Template
            </h3>
            <p className="text-gray-600 mb-4">
              Share functionality will be implemented in a future version.
            </p>
            <button
              onClick={() => setShowShareDialog(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Designer Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Auto-save
                </span>
                <button
                  onClick={handleToggleAutoSave}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isAutoSaveEnabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isAutoSaveEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p>History entries: {historySize}</p>
                <p>Validation: {isValid ? "Valid" : "Issues found"}</p>
                <p>
                  Last saved:{" "}
                  {lastSaved ? new Date(lastSaved).toLocaleString() : "Never"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsDialog(false)}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error notifications */}
      {errors.length > 0 && (
        <div className="fixed bottom-4 right-4 max-w-sm z-50">
          {errors.slice(0, 3).map((error, index) => (
            <div
              key={index}
              className="mb-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg shadow-lg"
            >
              <p className="text-sm">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Warning notifications */}
      {warnings.length > 0 && (
        <div className="fixed bottom-4 left-4 max-w-sm z-50">
          {warnings.slice(0, 2).map((warning, index) => (
            <div
              key={index}
              className="mb-2 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg shadow-lg"
            >
              <p className="text-sm">{warning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateDesigner;
