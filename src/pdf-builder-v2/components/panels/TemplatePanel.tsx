import React, { useState } from 'react';
import { useEditorStore } from '../../stores/editor-store';
import type { Template, TemplateCategory } from '../../types';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onPreview,
}) => {
  const getCategoryColor = (category: TemplateCategory) => {
    const colors = {
      academic: 'bg-blue-100 text-blue-800',
      business: 'bg-green-100 text-green-800',
      creative: 'bg-purple-100 text-purple-800',
      certificate: 'bg-yellow-100 text-yellow-800',
      report: 'bg-gray-100 text-gray-800',
      invoice: 'bg-red-100 text-red-800',
      newsletter: 'bg-indigo-100 text-indigo-800',
      flyer: 'bg-pink-100 text-pink-800',
      presentation: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className={`
        border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
      onClick={onSelect}
    >
      {/* Template thumbnail */}
      <div className="aspect-[3/4] bg-gray-100 rounded-md mb-3 overflow-hidden">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Template info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium text-gray-900 truncate">{template.name}</h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Preview template"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>

        {/* Category badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
          <div className="text-xs text-gray-500">
            {template.blocks.length} blocks
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const TemplatePanel: React.FC = () => {
  const { templates, currentTemplate, setCurrentTemplate } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample templates for demo
  const sampleTemplates: Template[] = [
    {
      id: 'academic-worksheet',
      name: 'Academic Worksheet',
      description: 'Clean worksheet template for educational content',
      category: 'academic',
      tags: ['education', 'worksheet', 'clean'],
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      blocks: [],
      variables: [],
      brandingRules: {
        logoPlacement: [],
        colorScheme: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#3b82f6',
          background: '#ffffff',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          custom: {},
        },
        typography: {
          primaryFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          secondaryFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          headingFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          bodyFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          customFonts: {},
        },
        customElements: [],
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        author: 'PDF Builder',
        license: 'Free',
        downloadCount: 0,
        rating: 5,
        featured: true,
        compatibility: ['pdf-builder-v2'],
        languages: ['en'],
      },
      thumbnail: '/api/placeholder/200/250',
      previewData: {},
    },
    {
      id: 'business-report',
      name: 'Business Report',
      description: 'Professional business report template',
      category: 'business',
      tags: ['business', 'report', 'professional'],
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 25, right: 25, bottom: 25, left: 25 },
      blocks: [],
      variables: [],
      brandingRules: {
        logoPlacement: [],
        colorScheme: {
          primary: '#059669',
          secondary: '#6b7280',
          accent: '#10b981',
          background: '#ffffff',
          text: '#111827',
          textSecondary: '#6b7280',
          border: '#d1d5db',
          custom: {},
        },
        typography: {
          primaryFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          secondaryFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          headingFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          bodyFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          customFonts: {},
        },
        customElements: [],
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        author: 'PDF Builder',
        license: 'Free',
        downloadCount: 0,
        rating: 4,
        featured: true,
        compatibility: ['pdf-builder-v2'],
        languages: ['en'],
      },
      thumbnail: '/api/placeholder/200/250',
      previewData: {},
    },
    {
      id: 'creative-flyer',
      name: 'Creative Flyer',
      description: 'Eye-catching flyer template for events',
      category: 'creative',
      tags: ['creative', 'flyer', 'events'],
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      blocks: [],
      variables: [],
      brandingRules: {
        logoPlacement: [],
        colorScheme: {
          primary: '#7c3aed',
          secondary: '#a78bfa',
          accent: '#8b5cf6',
          background: '#ffffff',
          text: '#1f2937',
          textSecondary: '#6b7280',
          border: '#e5e7eb',
          custom: {},
        },
        typography: {
          primaryFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          secondaryFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          headingFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          bodyFont: {
            family: 'Arial',
            fallbacks: ['sans-serif'],
            sizes: { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12, body: 12, caption: 10 },
            weights: { light: '300', normal: '400', medium: '500', bold: '700' },
            lineHeights: { tight: 1.2, normal: 1.4, relaxed: 1.6, loose: 1.8 },
          },
          customFonts: {},
        },
        customElements: [],
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        author: 'PDF Builder',
        license: 'Free',
        downloadCount: 0,
        rating: 5,
        featured: false,
        compatibility: ['pdf-builder-v2'],
        languages: ['en'],
      },
      thumbnail: '/api/placeholder/200/250',
      previewData: {},
    },
  ];

  // Combine existing templates with sample templates
  const allTemplates = [...templates, ...sampleTemplates];

  const categories = [
    { id: 'all', name: 'All', count: allTemplates.length },
    { id: 'academic', name: 'Academic', count: allTemplates.filter(t => t.category === 'academic').length },
    { id: 'business', name: 'Business', count: allTemplates.filter(t => t.category === 'business').length },
    { id: 'creative', name: 'Creative', count: allTemplates.filter(t => t.category === 'creative').length },
    { id: 'certificate', name: 'Certificate', count: allTemplates.filter(t => t.category === 'certificate').length },
  ];

  const filteredTemplates = allTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: Template) => {
    setCurrentTemplate(template);
  };

  const handlePreviewTemplate = (template: Template) => {
    // TODO: Implement template preview modal
    console.log('Preview template:', template.name);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg 
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category tabs */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex space-x-1 text-xs">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-3 py-1 rounded-full transition-colors
                ${selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={currentTemplate?.id === template.id}
                onSelect={() => handleSelectTemplate(template)}
                onPreview={() => handlePreviewTemplate(template)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📄</div>
            <div className="text-sm text-gray-600 mb-1">No templates found</div>
            <div className="text-xs text-gray-500">
              {searchTerm ? `No results for "${searchTerm}"` : 'No templates in this category'}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>{filteredTemplates.length} templates</span>
          {currentTemplate && (
            <span className="text-blue-600">
              Current: {currentTemplate.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};