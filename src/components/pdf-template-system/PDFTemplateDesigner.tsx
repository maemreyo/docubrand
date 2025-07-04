// Main template designer component using PDFme Designer

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Designer } from "@pdfme/ui";
import { text, image, barcodes } from "@pdfme/schemas";
import type { Template as PDFMeTemplate } from "@pdfme/common";

import { SafeDesignerWrapperWithRef } from "./SafeDesignerWrapper";
import {
  DocuBrandTemplate,
  TemplateGenerationOptions,
  TemplateCreationResult,
  ConversionContext,
} from "@/lib/pdf-template-system/types/template-types";

import type { GeminiAnalysisResponse } from "@/types/gemini";
import { PDFTemplateEngine } from "@/lib/pdf-template-system/core/TemplateEngine";
import { getTemplateStorage } from "@/lib/pdf-template-system/storage/LocalTemplateStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Download,
  Eye,
  Settings,
  Layers,
  Type,
  Image,
  QrCode,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface PDFTemplateDesignerProps {
  analysisResult?: GeminiAnalysisResponse;
  existingTemplate?: DocuBrandTemplate;
  onTemplateCreated?: (template: DocuBrandTemplate) => void;
  onTemplateUpdated?: (template: DocuBrandTemplate) => void;
  onClose?: () => void;
  className?: string;
}

interface DesignerState {
  template: DocuBrandTemplate | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  activeTab: "design" | "data" | "settings";
}

export function PDFTemplateDesigner({
  analysisResult,
  existingTemplate,
  onTemplateCreated,
  onTemplateUpdated,
  onClose,
  className = "",
}: PDFTemplateDesignerProps) {
  const [state, setState] = useState<DesignerState>({
    template: existingTemplate || null,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    error: null,
    activeTab: "design",
  });

  const designerContainerRef = useRef<HTMLDivElement>(null);
  const templateEngineRef = useRef<PDFTemplateEngine | null>(null);
  const designerRef = useRef<Designer | null>(null);
  const isDestroyedRef = useRef<boolean>(false);

  // Initialize template engine
  useEffect(() => {
    if (!templateEngineRef.current) {
      const storage = getTemplateStorage();
      templateEngineRef.current = new PDFTemplateEngine(storage);
    }
  }, []);

  /**
   * Create template from Gemini analysis
   */
  const createTemplateFromAnalysis = useCallback(async () => {
    if (!analysisResult || !templateEngineRef.current) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const options: TemplateGenerationOptions = {
        language: "vi", // Default to Vietnamese
        fallbackLanguage: "en",
        fontConfig: {
          code: "vi",
          name: "Tiếng Việt",
          direction: "ltr",
          fontFamily: "NotoSansVietnamese",
          fallbackFonts: ["Arial Unicode MS", "Tahoma"],
          fontFiles: {
            regular: "/fonts/NotoSans-Vietnamese-Regular.ttf",
            bold: "/fonts/NotoSans-Vietnamese-Bold.ttf",
            italic: "/fonts/NotoSans-Vietnamese-Italic.ttf",
            boldItalic: "/fonts/NotoSans-Vietnamese-BoldItalic.ttf",
          },
          unicodeRange: "U+0000-007F,U+0100-017F,U+1EA0-1EF9",
        },
        layout: {
          autoOptimize: true,
          preserveWhitespace: false,
          respectOriginalPositions: false,
          generateResponsiveLayout: true,
        },
        content: {
          processMarkdown: true,
          generateDataBindings: true,
          createConditionalElements: false,
          optimizeImages: true,
        },
        quality: {
          imageQuality: 0.8,
          fontEmbedding: true,
          vectorizeText: true,
          compression: true,
        },
      };

      const result = await templateEngineRef.current.createFromAnalysis(
        analysisResult,
        options
      );

      if (result.success && result.template) {
        setState((prev) => ({
          ...prev,
          template: result.template!,
          isLoading: false,
        }));

        if (onTemplateCreated) {
          onTemplateCreated(result.template);
        }

        console.log("✅ Template created from analysis");
      } else {
        throw new Error(result.errors?.[0] || "Template creation failed");
      }
    } catch (error) {
      console.error("❌ Template creation failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Template creation failed",
      }));
    }
  }, [analysisResult, onTemplateCreated, templateEngineRef]);

  /**
   * Initialize PDFme Designer
   */
  const initializeDesigner = useCallback(async () => {
    if (
      !designerContainerRef.current ||
      isDestroyedRef.current ||
      designerRef.current
    ) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Prepare template for PDFme
      const pdfmeTemplate: PDFMeTemplate = state.template
        ? {
            basePdf: state.template.basePdf,
            schemas: state.template.schemas,
          }
        : {
            basePdf: "", // Will be set to BLANK_PDF
            schemas: [[]],
          };

      // Create designer instance
      const designer = new Designer({
        domContainer: designerContainerRef.current,
        template: pdfmeTemplate,
        options: {
          zoomLevel: 1,
          sidebarOpen: true,
        },
        plugins: {
          text,
          image,
          qrcode: barcodes.qrcode,
          barcode: barcodes.code128,
        },
      });

      // Check if component is still mounted
      if (isDestroyedRef.current) {
        designer.destroy();
        return;
      }

      // Store designer reference
      designerRef.current = designer;

      // Set up event listeners
      designer.onChangeTemplate((template) => {
        if (!isDestroyedRef.current) {
          handleTemplateChange(template);
        }
      });

      designer.onSaveTemplate((template) => {
        if (!isDestroyedRef.current) {
          handleTemplateSave(template);
        }
      });

      setState((prev) => ({
        ...prev,
        designer,
        isLoading: false,
      }));

      console.log("✅ Designer initialized successfully");
    } catch (error) {
      console.error("❌ Designer initialization failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Designer initialization failed",
      }));
    }
  }, []); // Remove state.template dependency to prevent recreation on every render

  // Create template from analysis
  useEffect(() => {
    if (analysisResult && !existingTemplate && !state.template) {
      createTemplateFromAnalysis();
    }
  }, [analysisResult, existingTemplate, createTemplateFromAnalysis]);

  // Initialize designer when template is available
  useEffect(() => {
    if (state.template && !designerRef.current && !isDestroyedRef.current) {
      initializeDesigner();
    }
  }, [state.template, initializeDesigner]);

  /**
   * Handle template change in designer
   */
  const handleTemplateChange = useCallback(
    (pdfmeTemplate: PDFMeTemplate) => {
      if (state.template) {
        // Only update if there's an actual change to avoid infinite loops
        if (
          JSON.stringify(pdfmeTemplate.schemas) !==
            JSON.stringify(state.template.schemas) ||
          pdfmeTemplate.basePdf !== state.template.basePdf
        ) {
          const updatedTemplate: DocuBrandTemplate = {
            ...state.template,
            basePdf: pdfmeTemplate.basePdf,
            schemas: pdfmeTemplate.schemas,
          };

          setState((prev) => ({ ...prev, template: updatedTemplate }));
        }
      }
    },
    [] // Remove state.template dependency to prevent recreation on every render
  );

  /**
   * Handle template save
   */
  const handleTemplateSave = useCallback(
    async (pdfmeTemplate: PDFMeTemplate) => {
      if (!state.template || !templateEngineRef.current) return;

      try {
        setState((prev) => ({ ...prev, isSaving: true, error: null }));

        const updatedTemplate: DocuBrandTemplate = {
          ...state.template,
          basePdf: pdfmeTemplate.basePdf,
          schemas: pdfmeTemplate.schemas,
          metadata: {
            ...state.template.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        await templateEngineRef.current.saveTemplate(updatedTemplate);

        setState((prev) => ({
          ...prev,
          template: updatedTemplate,
          isSaving: false,
          lastSaved: new Date(),
        }));

        if (onTemplateUpdated) {
          onTemplateUpdated(updatedTemplate);
        }

        console.log("✅ Template saved successfully");
      } catch (error) {
        console.error("❌ Template save failed:", error);
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error:
            error instanceof Error ? error.message : "Template save failed",
        }));
      }
    },
    [state.template, onTemplateUpdated]
  );

  /**
   * Check if designer is available and not destroyed
   */
  const isDesignerAvailable = useCallback(() => {
    return designerRef.current && !isDestroyedRef.current;
  }, []);

  /**
   * Safe designer operation wrapper
   */
  const safeDesignerOperation = useCallback(
    async (operation: (designer: Designer) => Promise<void> | void) => {
      if (!isDesignerAvailable()) {
        console.warn("Designer not available for operation");
        return;
      }

      try {
        await operation(designerRef.current!);
      } catch (error) {
        console.error("❌ Designer operation failed:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Designer operation failed",
        }));
      }
    },
    [isDesignerAvailable]
  );

  /**
   * Manual save
   */
  const handleSave = useCallback(async () => {
    await safeDesignerOperation(async (designer) => {
      const currentTemplate = designer.getTemplate();
      await handleTemplateSave(currentTemplate);
    });
  }, [safeDesignerOperation, handleTemplateSave]);

  /**
   * Preview template
   */
  const handlePreview = useCallback(() => {
    if (!state.template) {
      console.warn("No template available for preview");
      return;
    }

    safeDesignerOperation(async (designer) => {
      const currentTemplate = designer.getTemplate();
      console.log("Opening preview for template:", state.template.id);

      // TODO: Open preview modal with currentTemplate
    });
  }, [state.template, safeDesignerOperation]);

  const handleDownload = useCallback(() => {
    if (state.template) {
      const dataStr = JSON.stringify(state.template, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `${state.template.name}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      console.log("✅ Template downloaded");
    }
  }, [state.template]);

  /**
   * Render template info
   */
  const renderTemplateInfo = () => {
    if (!state.template) return null;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{state.template.name}</h3>
          <p className="text-sm text-gray-600">{state.template.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{state.template.category}</Badge>
          {state.template.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Version:</span>{" "}
            {state.template.version}
          </div>
          <div>
            <span className="font-medium">Author:</span>{" "}
            {state.template.metadata.author}
          </div>
          <div>
            <span className="font-medium">Created:</span>{" "}
            {new Date(state.template.metadata.createdAt).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{" "}
            {new Date(state.template.metadata.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render template data
   */
  const renderTemplateData = () => {
    if (!state.template) return null;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Sample Data</h4>
          <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-64">
            {JSON.stringify(state.template.sampleData, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium mb-2">Data Schema</h4>
          <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-64">
            {JSON.stringify(state.template.dataSchema, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium mb-2">Supported Languages</h4>
          <div className="flex flex-wrap gap-2">
            {state.template.i18nConfig.supportedLanguages.map((lang) => (
              <Badge key={lang} variant="outline">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render template settings
   */
  const renderTemplateSettings = () => {
    if (!state.template) return null;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Template Settings</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Template ID</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {state.template.id}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Category</span>
              <Badge variant="outline">{state.template.category}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Default Language</span>
              <Badge variant="outline">
                {state.template.i18nConfig.defaultLanguage}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Schema Count</span>
              <span className="text-sm font-mono">
                {state.template.schemas.reduce(
                  (sum, page) => sum + page.length,
                  0
                )}
              </span>
            </div>
          </div>
        </div>

        {state.template.metadata.educational && (
          <div>
            <h4 className="font-medium mb-2">Educational Settings</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Subject</span>
                <span className="text-sm">
                  {state.template.metadata.educational.subject}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Grade Level</span>
                <span className="text-sm">
                  {state.template.metadata.educational.gradeLevel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Difficulty</span>
                <Badge variant="outline">
                  {state.template.metadata.educational.difficulty}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Estimated Time</span>
                <span className="text-sm">
                  {state.template.metadata.educational.estimatedTime} min
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Template Designer</CardTitle>
              {state.lastSaved && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Saved {state.lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!state.template || state.isLoading}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!state.template || state.isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              <Button
                onClick={handleSave}
                disabled={!state.template || state.isSaving || state.isLoading}
                size="sm"
              >
                {state.isSaving ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>

              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {state.error && (
        <Card className="flex-shrink-0 border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {state.isLoading && (
        <Card className="flex-shrink-0">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {analysisResult && !state.template
                  ? "Creating template..."
                  : "Loading designer..."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Designer */}
        <Card className="flex-1">
          <CardContent className="h-full p-0">
            {state.template ? (
              <SafeDesignerWrapperWithRef
                ref={designerRef}
                template={{
                  basePdf: state.template.basePdf,
                  schemas: state.template.schemas,
                }}
                onTemplateChange={handleTemplateChange}
                onSaveTemplate={handleTemplateSave}
                onError={(error) => setState((prev) => ({ ...prev, error }))}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <Layers className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Template Selected
                  </h3>
                  <p className="text-gray-600">
                    Create a template from analysis or select an existing
                    template to start designing.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <Card className="w-80 flex-shrink-0">
          <CardContent className="p-0">
            <Tabs
              value={state.activeTab}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, activeTab: value as any }))
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design">
                  <Layers className="w-4 h-4 mr-2" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="data">
                  <Type className="w-4 h-4 mr-2" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="design" className="mt-0">
                  {renderTemplateInfo()}
                </TabsContent>

                <TabsContent value="data" className="mt-0">
                  {renderTemplateData()}
                </TabsContent>

                <TabsContent value="settings" className="mt-0">
                  {renderTemplateSettings()}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
