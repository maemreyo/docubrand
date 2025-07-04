// CREATED: 2025-07-04 - Template management interface for CRUD operations

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Copy, 
  Trash2,
  Eye,
  Edit3,
  Filter,
  Grid3X3,
  List,
  Star,
  Clock,
  User,
  Tag,
  FolderOpen,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { templateManager, TemplateDefinition, TemplateMetadata } from '@/lib/template-manager';

interface TemplateManagerProps {
  onTemplateSelect?: (template: TemplateDefinition) => void;
  onTemplateCreate?: (template: TemplateDefinition) => void;
  onClose?: () => void;
  isOpen?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'updated' | 'created' | 'category';

export function TemplateManager({
  onTemplateSelect,
  onTemplateCreate,
  onClose,
  isOpen = true,
  className = ''
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Templates', count: 0 },
    { id: 'quiz', name: 'Quiz', count: 0 },
    { id: 'worksheet', name: 'Worksheet', count: 0 },
    { id: 'exam', name: 'Exam', count: 0 },
    { id: 'assignment', name: 'Assignment', count: 0 },
    { id: 'handout', name: 'Handout', count: 0 },
    { id: 'general', name: 'General', count: 0 },
  ];

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const templateList = await templateManager.listTemplates();
      setTemplates(templateList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort templates
  useEffect(() => {
    let filtered = [...templates];

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          return b.updatedAt - a.updatedAt;
        case 'created':
          return b.createdAt - a.createdAt;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, sortBy]);

  // Update category counts
  const categoriesWithCounts = categories.map(category => ({
    ...category,
    count: category.id === 'all' 
      ? templates.length 
      : templates.filter(t => t.category === category.id).length
  }));

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Handle template selection
  const handleSelectTemplate = useCallback(async (metadata: TemplateMetadata) => {
    try {
      const template = await templateManager.loadTemplate(metadata.id);
      if (template) {
        onTemplateSelect?.(template);
        onClose?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    }
  }, [onTemplateSelect, onClose]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await templateManager.deleteTemplate(id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  }, [loadTemplates]);

  // Handle template duplication
  const handleDuplicateTemplate = useCallback(async (metadata: TemplateMetadata) => {
    try {
      const newName = prompt('Enter name for duplicated template:', `${metadata.name} (Copy)`);
      if (!newName) return;

      await templateManager.duplicateTemplate(metadata.id, newName);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate template');
    }
  }, [loadTemplates]);

  // Handle template export
  const handleExportTemplate = useCallback(async (id: string, name: string) => {
    try {
      const jsonData = await templateManager.exportTemplate(id);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/[^a-z0-9]/gi, '_')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export template');
    }
  }, []);

  // Handle template import
  const handleImportTemplate = useCallback(async () => {
    try {
      const template = await templateManager.importTemplate(importData);
      setShowImportDialog(false);
      setImportData('');
      await loadTemplates();
      onTemplateCreate?.(template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import template');
    }
  }, [importData, loadTemplates, onTemplateCreate]);

  // Create new template
  const handleCreateNew = useCallback(async () => {
    try {
      const name = prompt('Enter template name:', 'New Template');
      if (!name) return;

      const template = await templateManager.createTemplate({
        name,
        description: 'A new educational template',
        category: 'general',
        tags: [],
      });

      await loadTemplates();
      onTemplateCreate?.(template);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  }, [loadTemplates, onTemplateCreate, onClose]);

  // Format date for display
  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Template Manager</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search and filters */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categoriesWithCounts.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>

              {/* Sort by */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Created Date</option>
                <option value="name">Name</option>
                <option value="category">Category</option>
              </select>

              {/* View mode toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first template to get started'}
            </p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode={viewMode}
                onSelect={() => handleSelectTemplate(template)}
                onDuplicate={() => handleDuplicateTemplate(template)}
                onExport={() => handleExportTemplate(template.id, template.name)}
                onDelete={() => handleDeleteTemplate(template.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg w-full max-w-md p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Template</h3>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste template JSON data here..."
            className="w-full h-40 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setShowImportDialog(false)}
              className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImportTemplate}
              disabled={!importData.trim()}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Import
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template card component
interface TemplateCardProps {
  template: TemplateMetadata;
  viewMode: ViewMode;
  onSelect: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
  formatDate: (timestamp: number) => string;
}

function TemplateCard({
  template,
  viewMode,
  onSelect,
  onDuplicate,
  onExport,
  onDelete,
  formatDate
}: TemplateCardProps) {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
          <p className="text-sm text-gray-600 truncate">{template.description}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="capitalize">{template.category}</span>
            <span>•</span>
            <span>{formatDate(template.updatedAt)}</span>
            {template.author && (
              <>
                <span>•</span>
                <span>{template.author}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Select
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={onDuplicate}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={onExport}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={onDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all overflow-hidden">
      {/* Thumbnail area */}
      <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <FileText className="w-12 h-12 text-blue-600" />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-1">{template.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{template.description}</p>
        
        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
            )}
          </div>
        )}
        
        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span className="capitalize">{template.category}</span>
          <span>{formatDate(template.updatedAt)}</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Select
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showActions && (
              <div className="absolute right-0 bottom-full mb-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={onDuplicate}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={onExport}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={onDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateManager;