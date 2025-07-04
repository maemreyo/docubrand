// CREATED: 2025-07-04 - Template block library for PDFme designer

'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, FileText, HelpCircle, Square, Type, Image, Calendar, Hash, CheckSquare, Circle, BarChart3 } from 'lucide-react';
import { getEducationalPlugins, getEducationalPluginCategories } from '@/lib/educational-plugins';
import { EducationalSchema } from '@/types/pdfme-extensions';

// Block definition interface
export interface EducationalBlock {
  id: string;
  name: string;
  category: 'basic' | 'questions' | 'layout' | 'forms' | 'graphics';
  icon: React.ReactNode;
  description: string;
  schema: Partial<EducationalSchema>;
  thumbnail?: string;
  tags: string[];
  isPremium?: boolean;
}

interface BlockLibraryProps {
  onBlockSelect?: (block: EducationalBlock) => void;
  searchTerm?: string;
  selectedCategory?: string;
  className?: string;
}

// Define educational blocks
const educationalBlocks: EducationalBlock[] = [
  // Basic Elements
  {
    id: 'text',
    name: 'Text',
    category: 'basic',
    icon: <Type className="w-5 h-5" />,
    description: 'Add text content to your document',
    schema: {
      type: 'text',
      content: 'Sample text content',
      position: { x: 0, y: 0 },
      width: 120,
      height: 20,
      fontSize: 12,
      fontColor: '#000000',
    },
    tags: ['text', 'content', 'basic'],
  },
  {
    id: 'title',
    name: 'Title',
    category: 'basic',
    icon: <FileText className="w-5 h-5" />,
    description: 'Add a title or heading',
    schema: {
      type: 'text',
      content: 'Document Title',
      position: { x: 0, y: 0 },
      width: 200,
      height: 30,
      fontSize: 18,
      fontColor: '#000000',
      fontName: 'Arial-Bold',
    },
    tags: ['title', 'heading', 'text'],
  },
  {
    id: 'image',
    name: 'Image',
    category: 'basic',
    icon: <Image className="w-5 h-5" />,
    description: 'Insert an image or logo',
    schema: {
      type: 'image',
      content: '',
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
    },
    tags: ['image', 'picture', 'logo'],
  },

  // Question Elements
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    category: 'questions',
    icon: <CheckSquare className="w-5 h-5" />,
    description: 'Multiple choice question with options',
    schema: {
      type: 'multipleChoice',
      content: 'What is the capital of France?',
      position: { x: 0, y: 0 },
      width: 180,
      height: 80,
      fontSize: 12,
      fontColor: '#000000',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      points: 2,
    },
    tags: ['question', 'multiple choice', 'quiz', 'assessment'],
  },
  {
    id: 'true-false',
    name: 'True/False',
    category: 'questions',
    icon: <Circle className="w-5 h-5" />,
    description: 'True or false question',
    schema: {
      type: 'trueFalse',
      content: 'The Earth is round.',
      position: { x: 0, y: 0 },
      width: 150,
      height: 40,
      fontSize: 12,
      fontColor: '#000000',
      correctAnswer: true,
      points: 1,
    },
    tags: ['question', 'true false', 'quiz', 'assessment'],
  },
  {
    id: 'short-answer',
    name: 'Short Answer',
    category: 'questions',
    icon: <Type className="w-5 h-5" />,
    description: 'Short answer text field',
    schema: {
      type: 'shortAnswer',
      content: 'What is your name?',
      position: { x: 0, y: 0 },
      width: 150,
      height: 30,
      fontSize: 12,
      fontColor: '#000000',
      maxLength: 100,
      points: 2,
    },
    tags: ['question', 'short answer', 'text', 'input'],
  },
  {
    id: 'essay',
    name: 'Essay Question',
    category: 'questions',
    icon: <FileText className="w-5 h-5" />,
    description: 'Long form essay question',
    schema: {
      type: 'essay',
      content: 'Explain the importance of education in modern society.',
      position: { x: 0, y: 0 },
      width: 180,
      height: 100,
      fontSize: 12,
      fontColor: '#000000',
      wordLimit: 500,
      points: 10,
    },
    tags: ['question', 'essay', 'long answer', 'writing'],
  },

  // Layout Elements
  {
    id: 'instruction-box',
    name: 'Instruction Box',
    category: 'layout',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'Highlighted instruction or note box',
    schema: {
      type: 'instructionBox',
      content: 'Please read the instructions carefully before proceeding.',
      position: { x: 0, y: 0 },
      width: 180,
      height: 50,
      fontSize: 11,
      fontColor: '#333333',
      boxStyle: 'simple',
      backgroundColor: '#f8f9fa',
    },
    tags: ['instruction', 'note', 'box', 'layout'],
  },
  {
    id: 'section-divider',
    name: 'Section Divider',
    category: 'layout',
    icon: <Square className="w-5 h-5" />,
    description: 'Horizontal line to separate sections',
    schema: {
      type: 'line',
      position: { x: 0, y: 0 },
      width: 200,
      height: 2,
      color: '#cccccc',
    },
    tags: ['divider', 'line', 'separator', 'layout'],
  },

  // Form Elements
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'forms',
    icon: <CheckSquare className="w-5 h-5" />,
    description: 'Checkbox for selection',
    schema: {
      type: 'checkbox',
      content: '',
      position: { x: 0, y: 0 },
      width: 15,
      height: 15,
    },
    tags: ['checkbox', 'form', 'input', 'selection'],
  },
  {
    id: 'date',
    name: 'Date Field',
    category: 'forms',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Date input field',
    schema: {
      type: 'dateTime',
      content: '',
      position: { x: 0, y: 0 },
      width: 100,
      height: 20,
      format: 'YYYY-MM-DD',
    },
    tags: ['date', 'form', 'input', 'time'],
  },

  // Graphics Elements
  {
    id: 'rectangle',
    name: 'Rectangle',
    category: 'graphics',
    icon: <Square className="w-5 h-5" />,
    description: 'Rectangle shape for borders or backgrounds',
    schema: {
      type: 'rectangle',
      position: { x: 0, y: 0 },
      width: 100,
      height: 60,
      color: '#e5e7eb',
      borderWidth: 1,
      borderColor: '#9ca3af',
    },
    tags: ['rectangle', 'shape', 'border', 'background'],
  },
  {
    id: 'table',
    name: 'Table',
    category: 'graphics',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Table for structured data',
    schema: {
      type: 'table',
      content: JSON.stringify([
        ['Header 1', 'Header 2', 'Header 3'],
        ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
        ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
      ]),
      position: { x: 0, y: 0 },
      width: 180,
      height: 80,
    },
    tags: ['table', 'data', 'grid', 'structure'],
  },
];

// Category definitions
const categories = [
  { id: 'all', name: 'All Blocks', icon: <Square className="w-4 h-4" /> },
  { id: 'basic', name: 'Basic', icon: <Type className="w-4 h-4" /> },
  { id: 'questions', name: 'Questions', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'layout', name: 'Layout', icon: <FileText className="w-4 h-4" /> },
  { id: 'forms', name: 'Forms', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'graphics', name: 'Graphics', icon: <BarChart3 className="w-4 h-4" /> },
];

export function BlockLibrary({ 
  onBlockSelect, 
  searchTerm = '', 
  selectedCategory = 'all', 
  className = '' 
}: BlockLibraryProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);
  const [internalSelectedCategory, setInternalSelectedCategory] = useState(selectedCategory);

  // Filter blocks based on search and category
  const filteredBlocks = useMemo(() => {
    let filtered = educationalBlocks;

    // Filter by category
    if (internalSelectedCategory !== 'all') {
      filtered = filtered.filter(block => block.category === internalSelectedCategory);
    }

    // Filter by search term
    if (internalSearchTerm.trim()) {
      const searchLower = internalSearchTerm.toLowerCase();
      filtered = filtered.filter(block => 
        block.name.toLowerCase().includes(searchLower) ||
        block.description.toLowerCase().includes(searchLower) ||
        block.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [internalSelectedCategory, internalSearchTerm]);

  // Group blocks by category for display
  const blocksByCategory = useMemo(() => {
    const grouped: Record<string, EducationalBlock[]> = {};
    
    filteredBlocks.forEach(block => {
      if (!grouped[block.category]) {
        grouped[block.category] = [];
      }
      grouped[block.category].push(block);
    });

    return grouped;
  }, [filteredBlocks]);

  const handleBlockClick = (block: EducationalBlock) => {
    if (onBlockSelect) {
      onBlockSelect(block);
    }
  };

  return (
    <div className={`block-library flex flex-col h-full ${className}`}>
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={internalSearchTerm}
            onChange={(e) => setInternalSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-3 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-1 text-xs">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setInternalSelectedCategory(category.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-left transition-colors ${
                internalSelectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.icon}
              <span className="truncate">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blocks */}
      <div className="flex-1 overflow-y-auto p-3">
        {internalSelectedCategory === 'all' ? (
          // Show all categories with headers
          <div className="space-y-4">
            {Object.entries(blocksByCategory).map(([categoryId, blocks]) => {
              const category = categories.find(c => c.id === categoryId);
              if (!category || blocks.length === 0) return null;

              return (
                <div key={categoryId}>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    {category.icon}
                    {category.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {blocks.map((block) => (
                      <BlockCard 
                        key={block.id} 
                        block={block} 
                        onClick={() => handleBlockClick(block)} 
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show filtered blocks
          <div className="grid grid-cols-2 gap-2">
            {filteredBlocks.map((block) => (
              <BlockCard 
                key={block.id} 
                block={block} 
                onClick={() => handleBlockClick(block)} 
              />
            ))}
          </div>
        )}

        {filteredBlocks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Square className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No blocks found</p>
            {internalSearchTerm && (
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search terms
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Block card component
interface BlockCardProps {
  block: EducationalBlock;
  onClick: () => void;
}

function BlockCard({ block, onClick }: BlockCardProps) {
  return (
    <button
      onClick={onClick}
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
      title={block.description}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 rounded bg-gray-100 group-hover:bg-blue-100 transition-colors">
          {block.icon}
        </div>
        <span className="text-sm font-medium text-gray-900 truncate">
          {block.name}
        </span>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2">
        {block.description}
      </p>
      
      {/* Tags */}
      {block.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {block.tags.slice(0, 2).map((tag) => (
            <span 
              key={tag}
              className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
          {block.tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{block.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Premium badge */}
      {block.isPremium && (
        <div className="absolute top-1 right-1">
          <span className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded font-medium">
            Pro
          </span>
        </div>
      )}
    </button>
  );
}

// Export block definitions for use in other components
export { educationalBlocks, categories };
export type { EducationalBlock };