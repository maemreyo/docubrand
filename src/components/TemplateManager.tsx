// CREATED: 2025-07-04 - Template management interface with CRUD operations

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Eye, 
  FileText, 
  Calendar,
  Tag,
  MoreHorizontal,
  Filter,
  Grid,
  List,
  Star,
  Share
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tabs from '@radix-ui/react-tabs';
import { TemplateDefinition, TemplateMetadata, templateManager } from '@/lib/template-manager';
import { EducationalTemplate } from '@/types/pdfme-extensions';

interface TemplateManagerProps {
  onTemplateSelect?: (template: TemplateDefinition) => void;
  onTemplateCreate?: () => void;
  onTemplateEdit?: (templateId: string) => void;
  selectedTemplateId?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'created' | 'updated' | 'category';
type FilterBy = 'all' | 'quiz' | 'worksheet' | 'exam' | 'assignment' | 'handout' | 'general';

export function TemplateManager({
  onTemplateSelect,
  onTemplateCreate,
  onTemplateEdit,
  selectedTemplateId,
  className = ''
}: TemplateManagerProps) {
  // State
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateList = await templateManager.list();
      const templates = await Promise.all(
        templateList.map(metadata => templateManager.load(metadata.id))
      );
      setTemplates(templates.filter(Boolean) as TemplateDefinition[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (filterBy !== 'all') {
      filtered = filtered.filter(template => template.metadata.category === filterBy);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.metadata.name.toLowerCase().includes(searchLower) ||
        template.metadata.description.toLowerCase().includes(searchLower) ||
        template.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.metadata.name.localeCompare(b.metadata.name);
        case 'created':
          return b.metadata.createdAt - a.metadata.createdAt;
        case 'updated':
          return b.metadata.updatedAt - a.metadata.updatedAt;
        case 'category':
          return a.metadata.category.localeCompare(b.metadata.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchTerm, filterBy, sortBy]);

  // Template actions
  const handleTemplateSelect = (template: TemplateDefinition) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleTemplateEdit = (templateId: string) => {
    onTemplateEdit?.(templateId);
  };

  const handleTemplateDuplicate = async (template: TemplateDefinition) => {
    try {
      await templateManager.duplicate(template.metadata.id);
      await loadTemplates();
    } catch (err) {
      alert(`Failed to duplicate template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleTemplateDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templateManager.delete(templateId);
      await loadTemplates();
      
      // Clear selection if deleted template was selected
      if (selectedTemplate?.metadata.id === templateId) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      alert(`Failed to delete template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleTemplateExport = async (template: TemplateDefinition) => {
    try {
      const jsonData = await templateManager.exportTemplate(template.metadata.id);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.metadata.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed to export template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleTemplateImport = async (file: File) => {
    try {
      const text = await file.text();
      await templateManager.importTemplate(text);
      await loadTemplates();
      setShowImportDialog(false);
    } catch (err) {
      alert(`Failed to import template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Category options
  const categories = [
    { value: 'all', label: 'All Templates', count: templates.length },
    { value: 'quiz', label: 'Quiz', count: templates.filter(t => t.metadata.category === 'quiz').length },
    { value: 'worksheet', label: 'Worksheet', count: templates.filter(t => t.metadata.category === 'worksheet').length },
    { value: 'exam', label: 'Exam', count: templates.filter(t => t.metadata.category === 'exam').length },
    { value: 'assignment', label: 'Assignment', count: templates.filter(t => t.metadata.category === 'assignment').length },
    { value: 'handout', label: 'Handout', count: templates.filter(t => t.metadata.category === 'handout').length },
    { value: 'general', label: 'General', count: templates.filter(t => t.metadata.category === 'general').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={loadTemplates}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`template-manager flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Template Library</h2>
            <p className="text-sm text-gray-600">
              {filteredAndSortedTemplates.length} of {templates.length} templates
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Import Template"
            >
              <Upload className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => {
                setShowCreateDialog(true);
                onTemplateCreate?.();
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSortedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first template to get started'
              }
            </p>
            {!searchTerm && filterBy === 'all' && (
              <button
                onClick={() => {
                  setShowCreateDialog(true);
                  onTemplateCreate?.();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Template
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedTemplates.map((template) => (
              <TemplateCard
                key={template.metadata.id}
                template={template}
                isSelected={selectedTemplateId === template.metadata.id}
                onSelect={() => handleTemplateSelect(template)}
                onEdit={() => handleTemplateEdit(template.metadata.id)}
                onDuplicate={() => handleTemplateDuplicate(template)}
                onDelete={() => handleTemplateDelete(template.metadata.id)}
                onExport={() => handleTemplateExport(template)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedTemplates.map((template) => (
              <TemplateListItem
                key={template.metadata.id}
                template={template}
                isSelected={selectedTemplateId === template.metadata.id}
                onSelect={() => handleTemplateSelect(template)}
                onEdit={() => handleTemplateEdit(template.metadata.id)}
                onDuplicate={() => handleTemplateDuplicate(template)}
                onDelete={() => handleTemplateDelete(template.metadata.id)}
                onExport={() => handleTemplateExport(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleTemplateImport}
      />
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: TemplateDefinition;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function TemplateCard({ 
  template, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onExport 
}: TemplateCardProps) {
  const { metadata } = template;

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {metadata.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {metadata.category}
            </span>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[160px]">
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Edit className="w-4 h-4" />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onExport(); }}
              >
                <Download className="w-4 h-4" />
                Export
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {metadata.description}
      </p>

      {/* Tags */}
      {metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {metadata.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded"
            >
              {tag}
            </span>
          ))}
          {metadata.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{metadata.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Updated {new Date(metadata.updatedAt).toLocaleDateString()}
        </span>
        <span>
          v{metadata.version}
        </span>
      </div>
    </div>
  );
}

// Template List Item Component
interface TemplateListItemProps extends TemplateCardProps {}

function TemplateListItem({ 
  template, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onExport 
}: TemplateListItemProps) {
  const { metadata } = template;

  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      {/* Icon */}
      <div className="p-2 bg-gray-100 rounded-lg">
        <FileText className="w-5 h-5 text-gray-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 truncate">
            {metadata.name}
          </h3>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            {metadata.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {metadata.description}
        </p>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-right">
        <div>Updated {new Date(metadata.updatedAt).toLocaleDateString()}</div>
        <div>v{metadata.version}</div>
      </div>

      {/* Actions */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[160px]">
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onExport(); }}
            >
              <Download className="w-4 h-4" />
              Export
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

// Import Dialog Component
interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
}

function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      onImport(file);
    } else {
      alert('Please select a valid JSON file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Import Template
          </Dialog.Title>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop a template JSON file here, or click to browse
            </p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
              id="template-file-input"
            />
            <label
              htmlFor="template-file-input"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer inline-block"
            >
              Choose File
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}