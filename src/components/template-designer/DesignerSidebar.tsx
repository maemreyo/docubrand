// CREATED: 2025-07-04 - Complete sidebar with tabs for template designer

'use client';

import React, { useState, useCallback } from 'react';
import { 
  Layers, 
  Settings, 
  FileText, 
  Copy, 
  Plus,
  FolderOpen,
  Undo,
  Redo,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Badge,
  Save
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { EducationalTemplate } from '@/types/pdfme-extensions';
import { TemplateDefinition } from '@/lib/template-manager';
import { DataBinding } from '@/lib/data-binding';
import { ValidationReport } from '@/lib/template-validator';
import { EducationalBlock } from './BlockLibrary';
import BlockLibrary from './BlockLibrary';

interface DesignerSidebarProps {
  templateDefinition: TemplateDefinition | null;
  validation: ValidationReport | null;
  bindings: DataBinding[];
  data: Record<string, any>;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isAutoSaveEnabled: boolean;
  onMetadataChange?: (updates: Partial<TemplateDefinition['metadata']>) => void;
  onBlockSelect?: (block: EducationalBlock) => void;
  onTemplateSelect?: (templateDef: TemplateDefinition) => void;
  onNew?: () => void;
  onLoad?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onValidate?: () => void;
  onDataChange?: (path: string, value: any) => void;
  onToggleAutoSave?: () => void;
  className?: string;
}

export function DesignerSidebar({
  templateDefinition,
  validation,
  bindings,
  data,
  isDirty,
  canUndo,
  canRedo,
  isAutoSaveEnabled,
  onMetadataChange,
  onBlockSelect,
  onTemplateSelect,
  onNew,
  onLoad,
  onUndo,
  onRedo,
  onValidate,
  onDataChange,
  onToggleAutoSave,
  className = ''
}: DesignerSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    validation: false,
    bindings: false
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleMetadataUpdate = useCallback((field: string, value: any) => {
    if (!onMetadataChange) return;
    onMetadataChange({ [field]: value });
  }, [onMetadataChange]);

  const handleDataUpdate = useCallback((path: string, value: any) => {
    onDataChange?.(path, value);
  }, [onDataChange]);

  return (
    <div className={`w-80 border-r border-gray-200 bg-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Template Designer</h2>
          <div className="flex items-center gap-2">
            {isAutoSaveEnabled && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                Auto-save
              </span>
            )}
            {isDirty && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">
                Unsaved
              </span>
            )}
          </div>
        </div>
        
        {/* Template Info */}
        {templateDefinition && (
          <div className="text-sm text-gray-600 space-y-1">
            <div className="font-medium truncate">{templateDefinition.metadata.name}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="capitalize">{templateDefinition.metadata.category}</span>
              <span>•</span>
              <span>{templateDefinition.template.schemas.length} page(s)</span>
              {validation && (
                <>
                  <span>•</span>
                  <span className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
                    {validation.isValid ? 'Valid' : 'Issues'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onNew}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New
          </button>
          <button
            onClick={onLoad}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            <FolderOpen className="w-3 h-3" />
            Load
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={onValidate}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors ml-auto"
          >
            <CheckCircle className="w-3 h-3" />
            Validate
          </button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="blocks" className="h-full flex flex-col">
          {/* Tab triggers */}
          <TabsList className="grid grid-cols-4 m-4 bg-gray-100">
            <TabsTrigger value="blocks" className="flex items-center gap-1 text-xs">
              <Layers className="w-3 h-3" />
              Blocks
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1 text-xs">
              <Settings className="w-3 h-3" />
              Props
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              Data
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1 text-xs">
              <Copy className="w-3 h-3" />
              Library
            </TabsTrigger>
          </TabsList>

          {/* Block Library Tab */}
          <TabsContent value="blocks" className="flex-1 overflow-hidden m-0">
            <BlockLibrary
              onBlockSelect={onBlockSelect}
              className="h-full"
            />
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-4">
              {/* Template Metadata Section */}
              <Collapsible 
                open={expandedSections.metadata} 
                onOpenChange={() => toggleSection('metadata')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">Template Metadata</span>
                  {expandedSections.metadata ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-3">
                  {templateDefinition && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={templateDefinition.metadata.name}
                          onChange={(e) => handleMetadataUpdate('name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={templateDefinition.metadata.description}
                          onChange={(e) => handleMetadataUpdate('description', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={templateDefinition.metadata.category}
                          onChange={(e) => handleMetadataUpdate('category', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="general">General</option>
                          <option value="quiz">Quiz</option>
                          <option value="worksheet">Worksheet</option>
                          <option value="exam">Exam</option>
                          <option value="assignment">Assignment</option>
                          <option value="handout">Handout</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags
                        </label>
                        <input
                          type="text"
                          value={templateDefinition.metadata.tags.join(', ')}
                          onChange={(e) => handleMetadataUpdate('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                          placeholder="tag1, tag2, tag3"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Auto-save toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Auto-save</span>
                        <button
                          onClick={onToggleAutoSave}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isAutoSaveEnabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              isAutoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Validation Section */}
              {validation && (
                <Collapsible 
                  open={expandedSections.validation} 
                  onOpenChange={() => toggleSection('validation')}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900 flex items-center gap-2">
                      Validation Report
                      {validation.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </span>
                    {expandedSections.validation ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Score: </span>
                        <span className={validation.score >= 80 ? 'text-green-600' : validation.score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                          {validation.score}/100
                        </span>
                      </div>
                      
                      {validation.issues.length > 0 && (
                        <div className="space-y-1">
                          {validation.issues.slice(0, 5).map((issue, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                              {issue.severity === 'error' ? (
                                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                              ) : issue.severity === 'warning' ? (
                                <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                              )}
                              <span className="text-gray-700">{issue.message}</span>
                            </div>
                          ))}
                          {validation.issues.length > 5 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{validation.issues.length - 5} more issues
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-4">
              {/* Data Bindings Section */}
              <Collapsible 
                open={expandedSections.bindings} 
                onOpenChange={() => toggleSection('bindings')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">
                    Data Bindings ({bindings.length})
                  </span>
                  {expandedSections.bindings ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {bindings.length > 0 ? (
                    bindings.map((binding) => (
                      <div key={binding.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {binding.label}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {binding.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {binding.description || binding.path}
                        </div>
                        <input
                          type="text"
                          value={data[binding.path] || binding.defaultValue || ''}
                          onChange={(e) => handleDataUpdate(binding.path, e.target.value)}
                          placeholder={binding.example || `Enter ${binding.label.toLowerCase()}`}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No data bindings found</p>
                      <p className="text-xs">Add form fields to create data bindings</p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </TabsContent>

          {/* Templates Library Tab */}
          <TabsContent value="templates" className="flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Copy className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium mb-1">Template Library</p>
                <p className="text-xs">Browse and load existing templates</p>
                <button
                  onClick={onLoad}
                  className="mt-3 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Browse Templates
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DesignerSidebar;