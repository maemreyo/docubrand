// src/components/template-designer/DesignerCanvas.tsx
// FIXED: 2025-07-04 - Simplified initialization approach based on demo

"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Template } from "@pdfme/common";
import { Designer } from "@pdfme/ui";
import { PdfmeIntegration } from "@/lib/pdfme-integration";
import { EducationalTemplate } from "@/types/pdfme-extensions";
import { AlertCircle, FileText, Loader2 } from "lucide-react";

interface DesignerCanvasProps {
  template: EducationalTemplate;
  onReady?: (designer: Designer) => void;
  onChange?: (template: EducationalTemplate) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

interface CanvasError {
  message: string;
  details?: string;
  timestamp: number;
}

export function DesignerCanvas({
  template,
  onReady,
  onChange,
  onError,
  className = "",
  disabled = false,
}: DesignerCanvasProps) {
  const designerRef = useRef<HTMLDivElement | null>(null);
  const designer = useRef<Designer | null>(null);
  const pdfmeIntegrationRef = useRef<PdfmeIntegration | null>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<CanvasError | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize PDFme integration once
  useEffect(() => {
    if (!pdfmeIntegrationRef.current) {
      pdfmeIntegrationRef.current = new PdfmeIntegration();
      console.log("DesignerCanvas: PDFme integration initialized");
    }
  }, []);

  // Handle template changes (from Designer save events)
  const handleTemplateChange = useCallback(
    (newTemplate: Template) => {
      console.log("DesignerCanvas: handleTemplateChange called");
      try {
        // Validate the template structure
        if (!newTemplate || !newTemplate.schemas) {
          throw new Error("Invalid template structure received");
        }

        // Convert to EducationalTemplate if needed
        const educationalTemplate = newTemplate as EducationalTemplate;
        onChange?.(educationalTemplate);
      } catch (error) {
        const canvasError: CanvasError = {
          message: "Failed to process template change",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        };
        setError(canvasError);
        onError?.(
          error instanceof Error ? error : new Error("Template change failed")
        );
        console.error("DesignerCanvas: Error in handleTemplateChange:", error);
      }
    },
    [onChange, onError]
  );

  const buildDesigner = useCallback(async () => {
    if (!designerRef.current || !template || !pdfmeIntegrationRef.current) {
      console.log("DesignerCanvas: buildDesigner skipped - missing requirements", {
        designerRef: !!designerRef.current,
        template: !!template,
        pdfmeIntegration: !!pdfmeIntegrationRef.current
      });
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      console.log("DesignerCanvas: Starting designer initialization");

      // Clear any existing designer
      if (designer.current) {
        try {
          console.log("DesignerCanvas: Destroying existing designer instance");
          designer.current.destroy();
        } catch (e) {
          console.warn("DesignerCanvas: Failed to destroy existing designer:", e);
        }
        designer.current = null;
      }

      // Create new designer instance using PdfmeIntegration
      console.log("DesignerCanvas: Creating designer with template:", template);
      designer.current = pdfmeIntegrationRef.current.createDesigner(
        designerRef.current,
        template,
        {
          theme: {
            token: { colorPrimary: '#3b82f6' },
          },
          lang: 'en',
        }
      );
      console.log("DesignerCanvas: PDFme Designer instance created successfully");

      // Set up event listeners
      designer.current.onSaveTemplate(handleTemplateChange);
      console.log("DesignerCanvas: onSaveTemplate listener attached");

      setIsReady(true);
      setIsInitializing(false);
      console.log("DesignerCanvas: Designer initialization complete");

      // Notify parent component
      onReady?.(designer.current);
      
    } catch (error) {
      const canvasError: CanvasError = {
        message: "Failed to initialize designer",
        details: error instanceof Error ? error.message : "Unknown initialization error",
        timestamp: Date.now(),
      };

      setError(canvasError);
      setIsInitializing(false);
      setIsReady(false);

      onError?.(
        error instanceof Error ? error : new Error("Designer initialization failed")
      );

      console.error("DesignerCanvas: Designer initialization failed:", error);
    }
  }, [template, handleTemplateChange, onReady, onError]);

  // Initialize designer when ref and template are available - following demo approach
  useEffect(() => {
    if (designerRef.current && template) {
      buildDesigner();
    }
    return () => {
      designer.current?.destroy();
    };
  }, [template, buildDesigner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("DesignerCanvas: Component unmounting, cleaning up");
      if (designer.current) {
        try {
          designer.current.destroy();
        } catch (e) {
          console.warn("DesignerCanvas: Failed to destroy designer on cleanup:", e);
        }
        designer.current = null;
      }
    };
  }, []);

  // Retry function for error recovery
  const retryInitialization = useCallback(() => {
    console.log("DesignerCanvas: Manual retry triggered");
    setError(null);
    setIsInitializing(true);
    
    // Wait a bit then retry
    setTimeout(() => {
      if (designerRef.current && template) {
        buildDesigner();
      } else {
        setError({
          message: "Canvas element still not available",
          details: "Cannot retry - DOM element missing",
          timestamp: Date.now(),
        });
        setIsInitializing(false);
      }
    }, 100);
  }, [buildDesigner, template]);

  // No template state
  if (!template) {
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}
      >
        <div className="text-center">
          <FileText className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">No template loaded</p>
          <p className="text-xs text-gray-400">
            Create or load a template to start designing
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[400px] bg-red-50 rounded-lg border-2 border-dashed border-red-200 ${className}`}
      >
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Canvas Error
          </h3>
          <p className="text-sm text-red-600 mb-2">{error.message}</p>
          {error.details && (
            <p className="text-xs text-red-500 mb-4 font-mono bg-red-100 p-2 rounded">
              {error.details}
            </p>
          )}
          <div className="space-y-2">
            <button
              onClick={retryInitialization}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Loading overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600 mb-2">
              Initializing designer...
            </p>
            <p className="text-xs text-gray-400">Loading PDFme canvas</p>
          </div>
        </div>
      )}

      {/* Designer container - simplified approach like demo */}
      <div
        ref={designerRef}
        className={`w-full h-full min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200 ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{ 
          minHeight: "600px",
          position: "relative",
          display: "block"
        }}
      />

      {/* Status overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center rounded-lg">
          <div className="bg-white px-4 py-2 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Designer disabled</p>
          </div>
        </div>
      )}

      {/* Ready indicator */}
      {isReady && !disabled && (
        <div className="absolute top-2 right-2">
          <div className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium">
            Ready
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white p-2 rounded border max-w-xs">
          <p>Designer Ref: {designerRef.current ? 'Mounted' : 'Not mounted'}</p>
          <p>Designer Instance: {designer.current ? 'Ready' : 'Not ready'}</p>
          <p>Template: {template ? 'Loaded' : 'Missing'}</p>
          <p>Integration: {pdfmeIntegrationRef.current ? 'Ready' : 'Not ready'}</p>
          <p>Initializing: {isInitializing ? 'Yes' : 'No'}</p>
          <p>Ready: {isReady ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}

export default DesignerCanvas;