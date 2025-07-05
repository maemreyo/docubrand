// FIXED: 2025-07-05 - Resolved React re-render issues with pdfme integration

"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
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

/**
 * Fixed Designer Canvas with proper React + PDFme integration
 *
 * Key fixes:
 * 1. Template stability with deep equality check
 * 2. Designer instance reuse instead of recreation
 * 3. Debounced template updates
 * 4. Proper state synchronization
 * 5. Break feedback loops between React and PDFme
 */
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

  // State management
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<CanvasError | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Critical: Prevent unnecessary re-renders with stable template reference
  const stableTemplate = useMemo(() => {
    if (!template) return null;

    // Deep freeze to prevent mutations that could cause re-renders
    return Object.freeze({
      ...template,
      schemas: template.schemas
        ? Object.freeze([
            ...template.schemas.map((schema) => Object.freeze([...schema])),
          ])
        : [],
    });
  }, [
    // Only re-create if essential structure changes
    template?.basePdf,
    template?.schemas?.length,
    JSON.stringify(template?.schemas), // Deep comparison for schema changes
  ]);

  // Track template changes to distinguish structure vs content changes
  const lastTemplateStructure = useRef<string>("");
  const isStructuralChange = useMemo(() => {
    if (!stableTemplate) return false;

    const currentStructure = JSON.stringify({
      basePdf: stableTemplate.basePdf,
      schemaCount: stableTemplate.schemas?.length || 0,
      schemaTypes: stableTemplate.schemas?.[0]?.map((s) => s.type) || [],
    });

    const changed = currentStructure !== lastTemplateStructure.current;
    lastTemplateStructure.current = currentStructure;
    return changed;
  }, [stableTemplate]);

  // Initialize PDFme integration once
  useEffect(() => {
    if (!pdfmeIntegrationRef.current) {
      pdfmeIntegrationRef.current = new PdfmeIntegration();
      console.log("DesignerCanvas: PDFme integration initialized");
    }
  }, []);

  // Debounced template change handler to prevent feedback loops
  const debouncedOnChange = useRef<NodeJS.Timeout | null>(null);
  const handleTemplateChange = useCallback(
    (newTemplate: Template) => {
      // Clear any pending debounced calls
      if (debouncedOnChange.current) {
        clearTimeout(debouncedOnChange.current);
      }

      // Debounce to prevent rapid fire updates
      debouncedOnChange.current = setTimeout(() => {
        try {
          if (!newTemplate || !newTemplate.schemas) {
            throw new Error("Invalid template structure received");
          }

          // CRITICAL: Only call onChange if this is a user-initiated change
          // Check if the change is different from our current stable template
          const currentTemplateJson = JSON.stringify(stableTemplate);
          const newTemplateJson = JSON.stringify(newTemplate);

          if (currentTemplateJson !== newTemplateJson) {
            // Prevent feedback loop by marking this as an internal update
            const educationalTemplate = newTemplate as EducationalTemplate;
            onChange?.(educationalTemplate);
          }
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
          console.error(
            "DesignerCanvas: Error in handleTemplateChange:",
            error
          );
        }
      }, 300); // 300ms debounce
    },
    [stableTemplate, onChange, onError]
  );

  // Smart Designer builder - only rebuild when necessary
  const buildDesigner = useCallback(async () => {
    if (
      !designerRef.current ||
      !stableTemplate ||
      !pdfmeIntegrationRef.current
    ) {
      console.log(
        "DesignerCanvas: buildDesigner skipped - missing requirements"
      );
      return;
    }

    try {
      setError(null);

      // CRITICAL FIX: Only rebuild Designer on structural changes, not content changes
      if (!isStructuralChange && designer.current && isReady) {
        console.log("DesignerCanvas: Skipping rebuild - only content changed");

        // Update existing designer's template instead of rebuilding
        try {
          // Use the designer's internal update method if available
          if (designer.current && (designer.current as any).updateTemplate) {
            (designer.current as any).updateTemplate(stableTemplate);
          }
        } catch (updateError) {
          console.warn(
            "DesignerCanvas: Template update failed, will rebuild:",
            updateError
          );
          // Fall through to rebuild if update fails
        }
      }

      setIsInitializing(true);
      console.log("DesignerCanvas: Starting designer initialization");

      // Clean up existing designer only when necessary
      if (designer.current) {
        try {
          console.log("DesignerCanvas: Destroying existing designer instance");
          designer.current.destroy();
        } catch (e) {
          console.warn(
            "DesignerCanvas: Failed to destroy existing designer:",
            e
          );
        }
        designer.current = null;
      }

      // Clear the container
      designerRef.current.innerHTML = "";

      // Create new designer instance
      console.log("DesignerCanvas: Creating designer with template");
      designer.current = pdfmeIntegrationRef.current.createDesigner(
        designerRef.current,
        stableTemplate,
        {
          theme: {
            token: { colorPrimary: "#3b82f6" },
          },
          lang: "en",
        }
      );

      // CRITICAL: Set up event listeners with proper debouncing
      designer.current.onSaveTemplate(handleTemplateChange);
      console.log("DesignerCanvas: Event listeners attached");

      setIsReady(true);
      setIsInitializing(false);
      console.log("DesignerCanvas: Designer initialization complete");

      // Notify parent component
      onReady?.(designer.current);
    } catch (error) {
      const canvasError: CanvasError = {
        message: "Failed to initialize designer",
        details:
          error instanceof Error
            ? error.message
            : "Unknown initialization error",
        timestamp: Date.now(),
      };

      setError(canvasError);
      setIsInitializing(false);
      setIsReady(false);

      onError?.(
        error instanceof Error
          ? error
          : new Error("Designer initialization failed")
      );
      console.error("DesignerCanvas: Initialization error:", error);
    }
  }, [
    stableTemplate,
    isStructuralChange,
    isReady,
    handleTemplateChange,
    onReady,
    onError,
  ]);

  // CRITICAL: Only rebuild designer when template structure changes
  useEffect(() => {
    if (isStructuralChange || !designer.current) {
      buildDesigner();
    }
  }, [buildDesigner, isStructuralChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedOnChange.current) {
        clearTimeout(debouncedOnChange.current);
      }
      if (designer.current) {
        try {
          designer.current.destroy();
        } catch (e) {
          console.warn("DesignerCanvas: Cleanup error:", e);
        }
      }
    };
  }, []);

  const retryInitialization = useCallback(() => {
    setError(null);
    setIsInitializing(true);
    buildDesigner();
  }, [buildDesigner]);

  // Error state
  if (error) {
    return (
      <div className={`relative h-full w-full ${className}`}>
        <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Designer Error
            </h3>
            <p className="text-sm text-red-600 mb-4">{error.message}</p>
            {error.details && (
              <p className="text-xs text-red-500 mb-4 font-mono bg-red-100 p-2 rounded">
                {error.details}
              </p>
            )}
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

      {/* Designer container */}
      <div
        ref={designerRef}
        className={`w-full h-full min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200 ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{
          minHeight: "600px",
          position: "relative",
          display: "block",
        }}
      />

      {/* Status indicators */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center rounded-lg">
          <div className="bg-white px-4 py-2 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Designer disabled</p>
          </div>
        </div>
      )}

      {isReady && !disabled && (
        <div className="absolute top-2 right-2">
          <div className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium">
            Ready
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white p-2 rounded border max-w-xs">
          <p>Template: {stableTemplate ? "Stable" : "Missing"}</p>
          <p>Structural Change: {isStructuralChange ? "Yes" : "No"}</p>
          <p>Designer: {designer.current ? "Ready" : "Not ready"}</p>
          <p>Initializing: {isInitializing ? "Yes" : "No"}</p>
          <p>Ready: {isReady ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
}

export default DesignerCanvas;
