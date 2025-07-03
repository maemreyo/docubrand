import React, { useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useEditorStore } from '../../stores/editor-store';
import { PDFCanvas } from '../canvas/PDFCanvas';
import { BlockLibrary } from '../blocks/BlockLibrary';
import { EditorToolbar } from './EditorToolbar';
import { LayerPanel } from '../panels/LayerPanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { TemplatePanel } from '../panels/TemplatePanel';
import type { Block, BlockType, Position } from '../../types';

interface PDFEditorProps {
  className?: string;
  width?: number;
  height?: number;
  showPanels?: {
    blocks?: boolean;
    layers?: boolean;
    properties?: boolean;
    templates?: boolean;
  };
  onSave?: (template: any) => void;
  onExport?: () => void;
}

export const PDFEditor: React.FC<PDFEditorProps> = ({
  className = '',
  width = 1200,
  height = 800,
  showPanels = {
    blocks: true,
    layers: true,
    properties: true,
    templates: true,
  },
  onSave,
  onExport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Store selectors
  const {
    canvas,
    currentTemplate,
    selectedObjects,
    isLoading,
    isDirty,
    showGrid,
    showRulers,
    showGuides,
    addBlock,
    setLoading,
    config,
  } = useEditorStore();

  // Canvas dimensions
  const canvasWidth = width - (showPanels.blocks ? 300 : 0) - (showPanels.layers || showPanels.properties ? 300 : 0);
  const canvasHeight = height - 60; // Subtract toolbar height

  // Initialize editor
  useEffect(() => {
    setIsInitialized(true);
    setLoading(false);
  }, [setLoading]);

  // Handle block drop from library
  const handleBlockDrop = (blockType: BlockType, position: Position) => {
    const blockId = `${blockType}-${Date.now()}`;
    
    // Create block based on type
    const baseBlock = {
      id: blockId,
      type: blockType,
      position,
      size: { width: 200, height: 100 },
      rotation: 0,
      locked: false,
      visible: true,
      layer: 0,
      opacity: 1,
      zIndex: 0,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
      },
    };

    let newBlock: Block;

    switch (blockType) {
      case 'text':
        newBlock = {
          ...baseBlock,
          type: 'text',
          content: 'Sample Text',
          fontFamily: config.defaults.fontFamily,
          fontSize: config.defaults.fontSize,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          color: config.defaults.textColor,
          lineHeight: 1.2,
          letterSpacing: 0,
          textDecoration: 'none',
          direction: 'ltr',
          language: 'en',
        } as Block;
        break;

      case 'image':
        newBlock = {
          ...baseBlock,
          type: 'image',
          src: '/placeholder-image.png',
          alt: 'Placeholder Image',
          fit: 'contain',
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            sepia: 0,
            grayscale: 0,
          },
          crop: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
        } as Block;
        break;

      case 'table':
        newBlock = {
          ...baseBlock,
          type: 'table',
          size: { width: 400, height: 200 },
          rows: 3,
          columns: 3,
          data: Array(3).fill(null).map(() => 
            Array(3).fill(null).map(() => ({
              content: 'Cell',
              type: 'text' as const,
              colSpan: 1,
              rowSpan: 1,
            }))
          ),
          headerStyle: {
            backgroundColor: '#f0f0f0',
            textColor: '#000000',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'left',
            verticalAlign: 'middle',
            padding: { top: 8, right: 8, bottom: 8, left: 8 },
          },
          cellStyle: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            fontSize: 11,
            fontWeight: 'normal',
            textAlign: 'left',
            verticalAlign: 'middle',
            padding: { top: 6, right: 6, bottom: 6, left: 6 },
          },
          borderStyle: {
            width: 1,
            color: '#cccccc',
            style: 'solid',
          },
          alternateRowColors: false,
          alternateRowColor: '#f9f9f9',
        } as Block;
        break;

      default:
        newBlock = baseBlock as Block;
    }

    addBlock(newBlock);
  };

  // Handle save
  const handleSave = () => {
    if (onSave && currentTemplate) {
      onSave(currentTemplate);
    }
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              useEditorStore.getState().redo();
            } else {
              useEditorStore.getState().undo();
            }
            break;
          case 'c':
            if (selectedObjects.length > 0) {
              e.preventDefault();
              useEditorStore.getState().copySelection();
            }
            break;
          case 'v':
            e.preventDefault();
            useEditorStore.getState().paste();
            break;
          case 'x':
            if (selectedObjects.length > 0) {
              e.preventDefault();
              useEditorStore.getState().cut();
            }
            break;
        }
      }
      
      // Delete key
      if (e.key === 'Delete' && selectedObjects.length > 0) {
        selectedObjects.forEach(id => {
          useEditorStore.getState().removeBlock(id);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjects, currentTemplate, onSave]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Initializing PDF Builder...</div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        ref={containerRef}
        className={`pdf-builder-editor flex flex-col h-full bg-gray-100 ${className}`}
        style={{ width, height }}
      >
        {/* Toolbar */}
        <EditorToolbar
          onSave={handleSave}
          onExport={handleExport}
          isDirty={isDirty}
          isLoading={isLoading}
        />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Block Library Sidebar */}
          {showPanels.blocks && (
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Block Library</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <BlockLibrary onBlockDrop={handleBlockDrop} />
              </div>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Canvas Container */}
            <div className="flex-1 overflow-hidden relative">
              <PDFCanvas
                width={canvasWidth}
                height={canvasHeight}
                showGrid={showGrid}
                showRulers={showRulers}
                showGuides={showGuides}
                onBlockDrop={handleBlockDrop}
              />
            </div>

            {/* Status Bar */}
            <div className="h-8 bg-gray-200 border-t border-gray-300 flex items-center justify-between px-4 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Canvas: {config.canvas.width} × {config.canvas.height} pt</span>
                <span>Objects: {selectedObjects.length} selected</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Zoom: {Math.round(useEditorStore.getState().canvasState.zoom * 100)}%</span>
                {isDirty && <span className="text-orange-600">• Unsaved changes</span>}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          {(showPanels.layers || showPanels.properties || showPanels.templates) && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {/* Template Panel */}
              {showPanels.templates && (
                <div className="border-b border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
                  </div>
                  <div className="h-48 overflow-y-auto">
                    <TemplatePanel />
                  </div>
                </div>
              )}

              {/* Layer Panel */}
              {showPanels.layers && (
                <div className="border-b border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
                  </div>
                  <div className="h-48 overflow-y-auto">
                    <LayerPanel />
                  </div>
                </div>
              )}

              {/* Property Panel */}
              {showPanels.properties && (
                <div className="flex-1">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <PropertyPanel />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg text-gray-900">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};