"use client";

import React, { useState } from "react";
import { PDFEditor } from "../components/editor/PDFEditor";
import type { Template } from "../types";

export const PDFBuilderDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<"editor" | "preview">(
    "editor"
  );
  const [showPanels, setShowPanels] = useState({
    blocks: true,
    layers: true,
    properties: true,
    templates: true,
  });

  const handleSave = (template: Template) => {
    console.log("💾 Saving template:", template);
    alert("Template saved successfully! (Check console for details)");
  };

  const handleExport = () => {
    console.log("📄 Exporting PDF...");
    alert("PDF export functionality will be implemented in Phase 4!");
  };

  const handleImport = () => {
    console.log("📂 Importing template...");
    alert("Template import functionality coming soon!");
  };

  const togglePanel = (panel: keyof typeof showPanels) => {
    setShowPanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  };

  

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              PDF Builder v2 Demo
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Advanced PDF template editor with drag & drop functionality
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentView("editor")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentView === "editor"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setCurrentView("preview")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentView === "preview"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Preview
              </button>
            </div>

            {/* Panel toggles */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Panels:</span>
              {Object.entries(showPanels).map(([panel, visible]) => (
                <button
                  key={panel}
                  onClick={() => togglePanel(panel as keyof typeof showPanels)}
                  className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                    visible
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {panel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === "editor" ? (
          <PDFEditor
            width={window.innerWidth}
            height={window.innerHeight - 100} // Subtract header height
            showPanels={showPanels}
            onSave={handleSave}
            onExport={handleExport}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preview Mode
              </h3>
              <p className="text-gray-600 mb-4">
                PDF preview functionality will be implemented in Phase 2
              </p>
              <button
                onClick={() => setCurrentView("editor")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Editor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Demo Footer */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>🚀 Phase 1: Core Editor Foundation</span>
            <span>✅ Fabric.js Canvas</span>
            <span>✅ Drag & Drop</span>
            <span>✅ Block Library</span>
            <span>✅ Property Panel</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Next: Phase 2 - Template System</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
