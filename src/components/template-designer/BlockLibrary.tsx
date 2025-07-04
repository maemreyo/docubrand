// CREATED: 2025-07-04 - Educational block library for PDFme template designer

'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  HelpCircle, 
  Square, 
  Type, 
  Image, 
  Calendar, 
  Hash, 
  CheckSquare, 
  Circle, 
  BarChart3,
  Layers,
  Edit3,
  AlignLeft,
  Star,
  Crown
} from 'lucide-react';
import { EducationalSchema } from '@/types/pdfme-extensions';

// Block definition interface
export interface EducationalBlock {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'questions' | 'layout' | 'forms' | 'graphics';
  icon: React.ReactNode;
  schema: Partial<EducationalSchema>;
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
      fontWeight: 'bold',
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
      educational: {
        questionType: 'multiple_choice',
        correctAnswer: 'Paris',
        points: 2,
        difficulty: 'medium',
      },
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
      educational: {
        questionType: 'true_false',
        correctAnswer: 'true',
        points: 1,
        difficulty: 'easy',
      },
    },
    tags: ['question', 'true false', 'quiz', 'assessment'],
  },
  {
    id: 'short-answer',
    name: 'Short Answer',
    category: 'questions',
    icon: <Edit3 className="w-5 h-5" />,
    description: 'Short answer text input',
    schema: {
      type: 'shortAnswer',
      content: 'Explain the water cycle:',
      position: { x: 0, y: 0 },
      width: 180,
      height: 60,
      fontSize: 12,
      fontColor: '#000000',
      educational: {
        questionType: 'short_answer',
        points: 5,
        difficulty: 'medium',
        answerFormat: 'text',
      },
    },
    tags: ['question', 'short answer', 'text input', 'assessment'],
  },
  {
    id: 'essay',
    name: 'Essay Question',
    category: 'questions',
    icon: <AlignLeft className="w-5 h-5" />,
    description: 'Long-form essay question',
    schema: {
      type: 'essay',
      content: 'Discuss the impact of climate change on global ecosystems:',
      position: { x: 0, y: 0 },
      width: 180,
      height: 100,
      fontSize: 12,
      fontColor: '#000000',
      educational: {
        questionType: 'essay',
        points: 10,
        difficulty: 'hard',
        answerFormat: 'text',
        timeLimit: 30,
      },
    },
    tags: ['question', 'essay', 'long answer', 'assessment'],
  },

  // Layout Elements
  {
    id: 'line',
    name: 'Line',
    category: 'layout',
    icon: <Square className="w-5 h-5" />,
    description: 'Add a dividing line',
    schema: {
      type: 'line',
      position: { x: 0, y: 0 },
      width: 150,
      height: 2,
      color: '#000000',
    },
    tags: ['line', 'divider', 'separator', 'layout'],
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    category: 'layout',
    icon: <Square className="w-5 h-5" />,
    description: 'Add a rectangular shape',
    schema: {
      type: 'rectangle',
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
      color: '#e5e7eb',
      borderColor: '#000000',
      borderWidth: 1,
    },
    tags: ['rectangle', 'shape', 'box', 'layout'],
  },
  {
    id: 'instruction-box',
    name: 'Instructions',
    category: 'layout',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'Add instruction text box',
    schema: {
      type: 'instructionBox',
      content: 'Instructions: Read each question carefully before answering.',
      position: { x: 0, y: 0 },
      width: 180,
      height: 40,
      fontSize: 11,
      fontColor: '#374151',
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
      borderWidth: 1,
    },
    tags: ['instructions', 'text box', 'guidance', 'layout'],
  },

  // Form Elements
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'forms',
    icon: <CheckSquare className="w-5 h-5" />,
    description: 'Add a checkbox input',
    schema: {
      type: 'checkbox',
      content: 'I agree to the terms',
      position: { x: 0, y: 0 },
      width: 120,
      height: 20,
      fontSize: 11,
      fontColor: '#000000',
    },
    tags: ['checkbox', 'input', 'form', 'agreement'],
  },
  {
    id: 'signature',
    name: 'Signature',
    category: 'forms',
    icon: <Edit3 className="w-5 h-5" />,
    description: 'Add signature field',
    schema: {
      type: 'signature',
      content: 'Signature: _______________',
      position: { x: 0, y: 0 },
      width: 150,
      height: 30,
      fontSize: 12,
      fontColor: '#000000',
    },
    tags: ['signature', 'form', 'authentication', 'legal'],
  },
  {
    id: 'date',
    name: 'Date Field',
    category: 'forms',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Add date input field',
    schema: {
      type: 'date',
      content: 'Date: ___/___/_____',
      position: { x: 0, y: 0 },
      width: 100,
      height: 20,
      fontSize: 12,
      fontColor: '#000000',
    },
    tags: ['date', 'input', 'form', 'time'],
  },

  // Graphics Elements
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
  {
    id: 'score-box',
    name: 'Score Box',
    category: 'graphics',
    icon: <Star className="w-5 h-5" />,
    description: 'Score display box',
    schema: {
      type: 'scoreBox',
      content: 'Score: ___/100',
      position: { x: 0, y: 0 },
      width: 80,
      height: 30,
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
      borderWidth: 2,
    },
    tags: ['score', 'assessment', 'grading', 'feedback'],
    isPremium: true,
  },
  {
    id: 'rubric',
    name: 'Rubric',
    category: 'graphics',
    icon: <Crown className="w-5 h-5" />,
    description: 'Assessment rubric table',
    schema: {
      type: 'rubric',
      content: 'Assessment Rubric',
      position: { x: 0, y: 0 },
      width: 180,
      height: 120,
      fontSize: 10,
      fontColor: '#000000',
      educational: {
        rubricCriteria: [
          {
            id: 'criteria1',
            name: 'Understanding',
            description: 'Demonstrates understanding of concepts',
            levels: [
              { score: 4, label: 'Excellent', description: 'Complete understanding' },
              { score: 3, label: 'Good', description: 'Good understanding' },
              { score: 2, label: 'Fair', description: 'Some understanding' },
              { score: 1, label: 'Poor', description: 'Little understanding' },
            ],
          },
        ],
      },
    },
    tags: ['rubric', 'assessment', 'grading', 'evaluation'],
    isPremium: true,
  },
];

// Category definitions
const categories = [
  { id: 'all', name: 'All Blocks', icon: <Layers className="w-4 h-4" /> },
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
  }, [internalSearchTerm, internalSelectedCategory]);

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
    onBlockSelect?.(block);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={internalSearchTerm}
            onChange={(e) => setInternalSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setInternalSelectedCategory(category.id)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                internalSelectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks list */}
      <div className="flex-1 overflow-y-auto p-4">
        {internalSelectedCategory === 'all' ? (
          // Show all categories
          <>
            {Object.entries(blocksByCategory).map(([categoryId, blocks]) => {
              const category = categories.find(c => c.id === categoryId);
              if (!blocks.length || !category) return null;

              return (
                <div key={categoryId} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {category.icon}
                    <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                    <span className="text-xs text-gray-500">({blocks.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {blocks.map((block) => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        onClick={() => handleBlockClick(block)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          // Show selected category only
          <div className="grid grid-cols-1 gap-2">
            {filteredBlocks.map((block) => (
              <BlockItem
                key={block.id}
                block={block}
                onClick={() => handleBlockClick(block)}
              />
            ))}
          </div>
        )}

        {filteredBlocks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No blocks found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Block item component
interface BlockItemProps {
  block: EducationalBlock;
  onClick: () => void;
}

function BlockItem({ block, onClick }: BlockItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
    >
      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-md group-hover:bg-blue-100 transition-colors">
        {block.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 text-sm truncate">
            {block.name}
          </h4>
          {block.isPremium && (
            <Crown className="w-3 h-3 text-yellow-500" />
          )}
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">
          {block.description}
        </p>
        {block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {block.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {block.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{block.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
    </button>
  );
}

export default BlockLibrary;