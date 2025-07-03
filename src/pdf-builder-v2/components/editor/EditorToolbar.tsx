import React from 'react';
import { useEditorStore } from '../../stores/editor-store';

interface EditorToolbarProps {
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  isDirty?: boolean;
  isLoading?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onSave,
  onExport,
  onImport,
  isDirty = false,
  isLoading = false,
}) => {
  const {
    canvas,
    selectedObjects,
    history,
    historyIndex,
    undo,
    redo,
    copySelection,
    cut,
    paste,
    clipboard,
    toggleGrid,
    toggleRulers,
    toggleGuides,
    showGrid,
    showRulers,
    showGuides,
    clearSelection,
    zoomToFit,
    centerCanvas,
  } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedObjects.length > 0;
  const canPaste = clipboard.length > 0;

  const handleDelete = () => {
    if (hasSelection) {
      selectedObjects.forEach(id => {
        useEditorStore.getState().removeBlock(id);
      });
      clearSelection();
    }
  };

  const handleDuplicate = () => {
    if (hasSelection) {
      selectedObjects.forEach(id => {
        useEditorStore.getState().duplicateBlock(id);
      });
    }
  };

  const handleAlignLeft = () => {
    if (canvas && hasSelection) {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 1) {
        const leftMost = Math.min(...activeObjects.map(obj => obj.left || 0));
        activeObjects.forEach(obj => {
          obj.set('left', leftMost);
        });
        canvas.renderAll();
      }
    }
  };

  const handleAlignCenter = () => {
    if (canvas && hasSelection) {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 1) {
        const centerX = canvas.getWidth() / 2;
        activeObjects.forEach(obj => {
          obj.set('left', centerX - (obj.width || 0) / 2);
        });
        canvas.renderAll();
      }
    }
  };

  const handleAlignRight = () => {
    if (canvas && hasSelection) {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 1) {
        const rightMost = Math.max(...activeObjects.map(obj => (obj.left || 0) + (obj.width || 0)));
        activeObjects.forEach(obj => {
          obj.set('left', rightMost - (obj.width || 0));
        });
        canvas.renderAll();
      }
    }
  };

  const handleBringToFront = () => {
    if (canvas && hasSelection) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.bringToFront(activeObject);
        canvas.renderAll();
      }
    }
  };

  const handleSendToBack = () => {
    if (canvas && hasSelection) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.sendToBack(activeObject);
        canvas.renderAll();
      }
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left section - File operations */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={onSave}
            disabled={isLoading || !isDirty}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${isDirty 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title="Save Template"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </>
            )}
          </button>

          <button
            onClick={onExport}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            title="Export as PDF"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>

          {onImport && (
            <button
              onClick={onImport}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              title="Import Template"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import
            </button>
          )}
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* History controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={undo}
            disabled={!canUndo || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            onClick={redo}
            disabled={!canRedo || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Clipboard operations */}
        <div className="flex items-center space-x-1">
          <button
            onClick={copySelection}
            disabled={!hasSelection || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Copy"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={cut}
            disabled={!hasSelection || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Cut"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
          </button>

          <button
            onClick={paste}
            disabled={!canPaste || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Paste"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>

          <button
            onClick={handleDelete}
            disabled={!hasSelection || isLoading}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <button
            onClick={handleDuplicate}
            disabled={!hasSelection || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Duplicate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        {/* Alignment tools */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleAlignLeft}
            disabled={selectedObjects.length < 2 || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>

          <button
            onClick={handleAlignCenter}
            disabled={selectedObjects.length < 2 || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            onClick={handleAlignRight}
            disabled={selectedObjects.length < 2 || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M4 18h16" />
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          <button
            onClick={handleBringToFront}
            disabled={!hasSelection || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Bring to Front"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </button>

          <button
            onClick={handleSendToBack}
            disabled={!hasSelection || isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Send to Back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right section - View controls */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleGrid}
            className={`
              p-2 rounded-md transition-colors
              ${showGrid 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
            title="Toggle Grid"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zM4 21a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zM12 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V5zM12 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM12 21a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM20 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V5zM20 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM20 21a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1z" />
            </svg>
          </button>

          <button
            onClick={toggleRulers}
            className={`
              p-2 rounded-md transition-colors
              ${showRulers 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
            title="Toggle Rulers"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21l3-3-3-3-3 3 3 3zm0 0l3-3m0 0l3 3m-3-3v12" />
            </svg>
          </button>

          <button
            onClick={toggleGuides}
            className={`
              p-2 rounded-md transition-colors
              ${showGuides 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
            title="Toggle Guides"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300"></div>

        <div className="flex items-center space-x-1">
          <button
            onClick={zoomToFit}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom to Fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <button
            onClick={centerCanvas}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Center Canvas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};