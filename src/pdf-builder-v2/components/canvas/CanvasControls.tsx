"use client"

import React from 'react';
import { useEditorStore } from '../../stores/editor-store';

interface CanvasControlsProps {
  canvas: any | null;
  className?: string;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  canvas,
  className = '',
}) => {
  const {
    canvasState,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom,
    centerCanvas,
    toggleGrid,
    showGrid,
  } = useEditorStore();

  const zoomPercentage = Math.round(canvasState.zoom * 100);

  return (
    <div className={`bg-white border border-gray-300 rounded-lg shadow-sm p-2 ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Zoom controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Zoom Out"
            disabled={!canvas}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <div className="px-2 py-1 text-sm text-gray-700 min-w-[50px] text-center">
            {zoomPercentage}%
          </div>
          
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Zoom In"
            disabled={!canvas}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Fit controls */}
        <button
          onClick={zoomToFit}
          className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
          title="Zoom to Fit"
          disabled={!canvas}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        <button
          onClick={resetZoom}
          className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
          title="Reset Zoom (100%)"
          disabled={!canvas}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={centerCanvas}
          className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
          title="Center Canvas"
          disabled={!canvas}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Grid toggle */}
        <button
          onClick={toggleGrid}
          className={`p-2 rounded transition-colors ${
            showGrid 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
          title="Toggle Grid"
          disabled={!canvas}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zM4 21a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zM12 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V5zM12 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM12 21a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM20 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V5zM20 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM20 21a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1z" />
          </svg>
        </button>
      </div>
    </div>
  );
};