// Template library for browsing and selecting templates

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { 
//   Select, 
//   SelectContent, 
//   SelectItem, 
//   SelectTrigger, 
//   SelectValue 
// } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  Star, 
  Clock, 
  User, 
  FileText, 
  Layers,
  Tag
} from 'lucide-react';

import {
  DocuBrandTemplate,
  TemplateLibraryEntry,
  TemplateCategory,
  TemplateStorage
} from '@/lib/pdf-template-system/types/template-types';

import { getTemplateStorage } from '@/lib/pdf-template-system/storage/LocalTemplateStorage';

interface TemplateLibraryProps {
  onTemplateSelect?: (template: DocuBrandTemplate) => void;
  onTemplateEdit?: (template: DocuBrandTemplate) => void;
  onTemplateDelete?: (templateId: string) => void;
  onCreateNew?: () => void;
  selectedTemplateId?: string;
  showActions?: boolean;
  className?: string;
}

interface LibraryState {
  templates: TemplateLibraryEntry[];
  filteredTemplates: TemplateLibraryEntry[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: TemplateCategory | 'all';
  selectedTags: string[];
  sortBy: 'name' | 'created' | 'updated' | 'downloads';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  selectedTemplate: DocuBrandTemplate | null;
  showPreview: boolean;
}

const CATEGORIES: Array<{ value: TemplateCategory | 'all', label: string }> = [
  { value: 'all', label: 'All Categories' },
  { value: 'educational', label: 'Educational' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'exam', label: 'Exam' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'report', label: 'Report' },
  { value: 'business', label: 'Business' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'general', label: 'General' }
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Created Date' },
  { value: 'updated', label: 'Last Updated' },
  { value: 'downloads', label: 'Downloads' }
];

export function TemplateLibrary({
  onTemplateSelect,
  onTemplateEdit,
  onTemplateDelete,
  onCreateNew,
  selectedTemplateId,
  showActions = true,
  className = ''
}: TemplateLibraryProps) {
  const [state, setState] = useState<LibraryState>({
    templates: [],
    filteredTemplates: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    selectedCategory: 'all',
    selectedTags: [],
    sortBy: 'updated',
    sortOrder: 'desc',
    viewMode: 'grid',
    selectedTemplate: null,
    showPreview: false
  });

  const storage = useMemo(() => getTemplateStorage(), []);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter and sort templates when criteria change
  useEffect(() => {
    filterAndSortTemplates();
  }, [
    state.templates,
    state.searchQuery,
    state.selectedCategory,
    state.selectedTags,
    state.sortBy,
    state.sortOrder
  ]);

  /**
   * Load templates from storage
   */
  const loadTemplates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const templates = await storage.list();
      
      setState(prev => ({ 
        ...prev, 
        templates, 
        isLoading: false 
      }));
      
      console.log(`✅ Loaded ${templates.length} templates`);
      
    } catch (error) {
      console.error('❌ Template loading failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load templates'
      }));
    }
  }, [storage]);

  /**
   * Filter and sort templates
   */
  const filterAndSortTemplates = useCallback(() => {
    let filtered = [...state.templates];

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (state.selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === state.selectedCategory);
    }

    // Apply tags filter
    if (state.selectedTags.length > 0) {
      filtered = filtered.filter(template => 
        state.selectedTags.some(tag => template.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (state.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.metadata.author);
          bValue = new Date(b.metadata.author);
          break;
        case 'updated':
          aValue = new Date(a.usage.lastUpdated);
          bValue = new Date(b.usage.lastUpdated);
          break;
        case 'downloads':
          aValue = a.usage.downloads;
          bValue = b.usage.downloads;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return state.sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return state.sortOrder === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return state.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    setState(prev => ({ ...prev, filteredTemplates: filtered }));
  }, [state.templates, state.searchQuery, state.selectedCategory, state.selectedTags, state.sortBy, state.sortOrder]);

  /**
   * Handle template selection
   */
  const handleTemplateSelect = useCallback(async (entry: TemplateLibraryEntry) => {
    try {
      // Load full template data
      const template = await storage.load(entry.id);
      
      if (template && onTemplateSelect) {
        onTemplateSelect(template);
      }
      
    } catch (error) {
      console.error('❌ Template selection failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to select template'
      }));
    }
  }, [storage, onTemplateSelect]);

  /**
   * Handle template preview
   */
  const handleTemplatePreview = useCallback(async (entry: TemplateLibraryEntry) => {
    try {
      const template = await storage.load(entry.id);
      
      if (template) {
        setState(prev => ({ 
          ...prev, 
          selectedTemplate: template, 
          showPreview: true 
        }));
      }
      
    } catch (error) {
      console.error('❌ Template preview failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to preview template'
      }));
    }
  }, [storage]);

  /**
   * Handle template deletion
   */
  const handleTemplateDelete = useCallback(async (templateId: string) => {
    try {
      await storage.delete(templateId);
      
      // Refresh templates
      await loadTemplates();
      
      if (onTemplateDelete) {
        onTemplateDelete(templateId);
      }
      
      console.log('✅ Template deleted successfully');
      
    } catch (error) {
      console.error('❌ Template deletion failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to delete template'
      }));
    }
  }, [storage, onTemplateDelete, loadTemplates]);

  /**
   * Get available tags
   */
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    state.templates.forEach(template => {
      template.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [state.templates]);

  /**
   * Render template card
   */
  const renderTemplateCard = useCallback((entry: TemplateLibraryEntry) => {
    const isSelected = selectedTemplateId === entry.id;
    
    return (
      <Card 
        key={entry.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => handleTemplateSelect(entry)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base line-clamp-1">
                {entry.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {entry.description}
              </p>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplatePreview(entry);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTemplateEdit) {
                      handleTemplateSelect(entry).then(() => {
                        if (entry.templateData) {
                          onTemplateEdit(entry.templateData);
                        }
                      });
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this template?')) {
                      handleTemplateDelete(entry.id);
                    }
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Category and Tags */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {entry.category}
              </Badge>
              {entry.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {entry.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{entry.tags.length - 3}
                </Badge>
              )}
            </div>
            
            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{entry.metadata.author}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(entry.usage.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Usage stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{entry.usage.downloads}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {entry.metadata.difficulty}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [selectedTemplateId, showActions, handleTemplateSelect, handleTemplatePreview, onTemplateEdit, handleTemplateDelete]);

  /**
   * Render template list item
   */
  const renderTemplateListItem = useCallback((entry: TemplateLibraryEntry) => {
    const isSelected = selectedTemplateId === entry.id;
    
    return (
      <Card 
        key={entry.id} 
        className={`cursor-pointer transition-all hover:shadow-sm ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => handleTemplateSelect(entry)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-medium line-clamp-1">{entry.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {entry.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {entry.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{entry.metadata.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(entry.usage.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{entry.usage.downloads}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplatePreview(entry);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTemplateEdit) {
                      handleTemplateSelect(entry).then(() => {
                        if (entry.templateData) {
                          onTemplateEdit(entry.templateData);
                        }
                      });
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this template?')) {
                      handleTemplateDelete(entry.id);
                    }
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, [selectedTemplateId, showActions, handleTemplateSelect, handleTemplatePreview, onTemplateEdit, handleTemplateDelete]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Template Library</h2>
          
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Template
            </Button>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            {/* <Select
              value={state.selectedCategory}
              onValueChange={(value) => setState(prev => ({ 
                ...prev, 
                selectedCategory: value as TemplateCategory | 'all' 
              }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={state.sortBy}
              onValueChange={(value) => setState(prev => ({ 
                ...prev, 
                sortBy: value as any 
              }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
              }))}
              className="w-20"
            >
              {state.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ 
                ...prev, 
                viewMode: prev.viewMode === 'grid' ? 'list' : 'grid' 
              }))}
              className="w-10"
            >
              {state.viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Results summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {state.filteredTemplates.length} of {state.templates.length} templates
            </span>
            
            {state.filteredTemplates.length !== state.templates.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  searchQuery: '', 
                  selectedCategory: 'all', 
                  selectedTags: [] 
                }))}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading templates...</p>
            </div>
          </div>
        ) : state.error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center text-red-700">
                <p className="font-medium">Error loading templates</p>
                <p className="text-sm mt-1">{state.error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadTemplates}
                  className="mt-3"
                >
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : state.filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No templates found</p>
                <p className="text-sm mt-1">
                  {state.templates.length === 0 
                    ? 'Create your first template to get started'
                    : 'Try adjusting your search or filters'
                  }
                </p>
                {onCreateNew && state.templates.length === 0 && (
                  <Button 
                    onClick={onCreateNew}
                    className="mt-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={
            state.viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          }>
            {state.filteredTemplates.map(entry => 
              state.viewMode === 'grid' 
                ? renderTemplateCard(entry)
                : renderTemplateListItem(entry)
            )}
          </div>
        )}
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={state.showPreview} onOpenChange={(open) => 
        setState(prev => ({ ...prev, showPreview: open }))
      }>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          
          {state.selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Template Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {state.selectedTemplate.name}</div>
                    <div><strong>Category:</strong> {state.selectedTemplate.category}</div>
                    <div><strong>Author:</strong> {state.selectedTemplate.metadata.author}</div>
                    <div><strong>Version:</strong> {state.selectedTemplate.version}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {state.selectedTemplate.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-600">
                  {state.selectedTemplate.description}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Schema Information</h3>
                <div className="text-sm text-gray-600">
                  <div>Pages: {state.selectedTemplate.schemas.length}</div>
                  <div>
                    Total Elements: {state.selectedTemplate.schemas.reduce((sum, page) => sum + page.length, 0)}
                  </div>
                  <div>
                    Supported Languages: {state.selectedTemplate.i18nConfig.supportedLanguages.join(', ')}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, showPreview: false }))}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (state.selectedTemplate && onTemplateSelect) {
                      onTemplateSelect(state.selectedTemplate);
                      setState(prev => ({ ...prev, showPreview: false }));
                    }
                  }}
                >
                  Select Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}