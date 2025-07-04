// Safe wrapper for PDFme Designer to handle lifecycle properly

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Designer } from '@pdfme/ui';
import { text, image, barcodes } from '@pdfme/schemas';
import type { Template as PDFMeTemplate } from '@pdfme/common';

interface SafeDesignerWrapperProps {
  template: PDFMeTemplate;
  onTemplateChange?: (template: PDFMeTemplate) => void;
  onSaveTemplate?: (template: PDFMeTemplate) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface DesignerState {
  isInitialized: boolean;
  isDestroyed: boolean;
  error: string | null;
}

// Define the ref type for better reusability
type DesignerRefType = {
  getCurrentTemplate: () => PDFMeTemplate | null;
  updateTemplate: (template: PDFMeTemplate) => boolean;
  isInitialized: boolean;
  isDestroyed: boolean;
};

// Internal implementation that uses forwardRef
const SafeDesignerWrapperInternal = React.forwardRef<
  DesignerRefType,
  SafeDesignerWrapperProps
>(function SafeDesignerWrapperInternalComponent(
  {
    template,
    onTemplateChange,
    onSaveTemplate,
    onError,
    className = ''
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const isDestroyedRef = useRef<boolean>(false);
  
  const [state, setState] = useState<DesignerState>({
    isInitialized: false,
    isDestroyed: false,
    error: null
  });

  /**
   * Initialize designer
   */
  const initializeDesigner = useCallback(async () => {
    if (!containerRef.current || isDestroyedRef.current || designerRef.current) {
      return;
    }

    try {
      console.log('🎨 Initializing PDFme Designer...');
      
      const designer = new Designer({
        domContainer: containerRef.current,
        template: template,
        options: {
          zoomLevel: 1,
          sidebarOpen: true
        },
        plugins: {
          text,
          image,
          qrcode: barcodes.qrcode,
          barcode: barcodes.code128
        }
      });

      // Check if component was destroyed during initialization
      if (isDestroyedRef.current) {
        designer.destroy();
        return;
      }

      // Store designer reference
      designerRef.current = designer;

      // Set up event listeners with safety checks
      designer.onChangeTemplate((updatedTemplate) => {
        if (!isDestroyedRef.current && onTemplateChange) {
          onTemplateChange(updatedTemplate);
        }
      });

      designer.onSaveTemplate((savedTemplate) => {
        if (!isDestroyedRef.current && onSaveTemplate) {
          onSaveTemplate(savedTemplate);
        }
      });

      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        error: null
      }));

      console.log('✅ PDFme Designer initialized successfully');

    } catch (error) {
      console.error('❌ Designer initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Designer initialization failed';
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isInitialized: false
      }));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [template, onTemplateChange, onSaveTemplate, onError]);

  /**
   * Destroy designer safely
   */
  const destroyDesigner = useCallback(() => {
    if (designerRef.current) {
      try {
        console.log('🧹 Destroying PDFme Designer...');
        isDestroyedRef.current = true;
        designerRef.current.destroy();
        designerRef.current = null;
        
        setState(prev => ({ 
          ...prev, 
          isDestroyed: true,
          isInitialized: false
        }));
        
        console.log('✅ PDFme Designer destroyed successfully');
      } catch (error) {
        console.warn('⚠️ Designer destroy warning:', error);
      }
    }
  }, []);

  /**
   * Get current template safely
   */
  const getCurrentTemplate = useCallback((): PDFMeTemplate | null => {
    if (!designerRef.current || isDestroyedRef.current) {
      console.warn('Designer not available for getTemplate');
      return null;
    }

    try {
      return designerRef.current.getTemplate();
    } catch (error) {
      console.error('❌ Failed to get template:', error);
      return null;
    }
  }, []);

  /**
   * Update template safely
   */
  const updateTemplate = useCallback((newTemplate: PDFMeTemplate) => {
    if (!designerRef.current || isDestroyedRef.current) {
      console.warn('Designer not available for updateTemplate');
      return false;
    }

    try {
      designerRef.current.updateTemplate(newTemplate);
      return true;
    } catch (error) {
      console.error('❌ Failed to update template:', error);
      return false;
    }
  }, []);

  // Initialize designer when component mounts
  useEffect(() => {
    if (containerRef.current && !state.isInitialized && !isDestroyedRef.current) {
      initializeDesigner();
    }
  }, [initializeDesigner, state.isInitialized]);

  // Update template when prop changes
  useEffect(() => {
    if (state.isInitialized && !isDestroyedRef.current) {
      // Get current template to compare
      const currentTemplate = getCurrentTemplate();
      
      // Only update if there's an actual change to avoid infinite loops
      if (currentTemplate && (
        JSON.stringify(template.schemas) !== JSON.stringify(currentTemplate.schemas) ||
        template.basePdf !== currentTemplate.basePdf
      )) {
        updateTemplate(template);
      }
    }
  }, [template, state.isInitialized, updateTemplate, getCurrentTemplate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyDesigner();
    };
  }, [destroyDesigner]);

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    getCurrentTemplate,
    updateTemplate,
    isInitialized: state.isInitialized,
    isDestroyed: state.isDestroyed
  }));

  return (
    <div className={`safe-designer-wrapper ${className}`}>
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="text-red-700 text-sm">
            <strong>Designer Error:</strong> {state.error}
          </div>
        </div>
      )}
      
      {!state.isInitialized && !state.error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading designer...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ 
          minHeight: '500px',
          opacity: state.isInitialized ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
});

// Export the component with ref forwarding
export const SafeDesignerWrapper = SafeDesignerWrapperInternal;

// For backward compatibility
export const SafeDesignerWrapperWithRef = SafeDesignerWrapper;

// Set display names for better debugging
SafeDesignerWrapper.displayName = 'SafeDesignerWrapper';
SafeDesignerWrapperWithRef.displayName = 'SafeDesignerWrapperWithRef';