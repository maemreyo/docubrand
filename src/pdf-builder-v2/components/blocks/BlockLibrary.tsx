import React from 'react';
import { useDrag } from 'react-dnd';
import type { BlockType, Position } from '../../types';

interface BlockLibraryProps {
  onBlockDrop?: (blockType: BlockType, position: Position) => void;
}

interface BlockDefinition {
  type: BlockType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'text' | 'media' | 'layout' | 'data' | 'interactive';
  preview?: string;
}

const blockDefinitions: BlockDefinition[] = [
  // Text blocks
  {
    type: 'text',
    name: 'Text',
    description: 'Add text content with formatting',
    category: 'text',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  
  // Media blocks
  {
    type: 'image',
    name: 'Image',
    description: 'Insert images with resize and filters',
    category: 'media',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },

  // Layout blocks
  {
    type: 'rectangle',
    name: 'Rectangle',
    description: 'Basic rectangle shape',
    category: 'layout',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
      </svg>
    ),
  },
  {
    type: 'circle',
    name: 'Circle',
    description: 'Basic circle shape',
    category: 'layout',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
      </svg>
    ),
  },
  {
    type: 'line',
    name: 'Line',
    description: 'Draw lines and dividers',
    category: 'layout',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
  },

  // Data blocks
  {
    type: 'table',
    name: 'Table',
    description: 'Structured data in rows and columns',
    category: 'data',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h12a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
      </svg>
    ),
  },
  {
    type: 'chart',
    name: 'Chart',
    description: 'Data visualization charts',
    category: 'data',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },

  // Interactive blocks
  {
    type: 'qr-code',
    name: 'QR Code',
    description: 'Generate QR codes',
    category: 'interactive',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
  },
  {
    type: 'barcode',
    name: 'Barcode',
    description: 'Generate barcodes',
    category: 'interactive',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4z" />
      </svg>
    ),
  },
  {
    type: 'signature',
    name: 'Signature',
    description: 'Digital signature area',
    category: 'interactive',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
];

interface DraggableBlockProps {
  block: BlockDefinition;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'block',
    item: { type: block.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'text': return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'media': return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'layout': return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'data': return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
      case 'interactive': return 'bg-pink-50 border-pink-200 hover:bg-pink-100';
      default: return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getCategoryIconColor = (category: string) => {
    switch (category) {
      case 'text': return 'text-blue-600';
      case 'media': return 'text-green-600';
      case 'layout': return 'text-purple-600';
      case 'data': return 'text-orange-600';
      case 'interactive': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div
      ref={drag}
      className={`
        p-3 border-2 border-dashed rounded-lg cursor-move transition-all duration-200
        ${getCategoryColor(block.category)}
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
      title={block.description}
    >
      <div className="flex items-center space-x-3">
        <div className={`${getCategoryIconColor(block.category)}`}>
          {block.icon}
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">{block.name}</div>
          <div className="text-xs text-gray-500 mt-1">{block.description}</div>
        </div>
      </div>
    </div>
  );
};

export const BlockLibrary: React.FC<BlockLibraryProps> = ({ onBlockDrop }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  const categories = [
    { id: 'all', name: 'All', icon: '📋' },
    { id: 'text', name: 'Text', icon: '📝' },
    { id: 'media', name: 'Media', icon: '🖼️' },
    { id: 'layout', name: 'Layout', icon: '📐' },
    { id: 'data', name: 'Data', icon: '📊' },
    { id: 'interactive', name: 'Interactive', icon: '🔗' },
  ];

  const filteredBlocks = blockDefinitions.filter(block => {
    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <svg 
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 pb-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors
                ${selectedCategory === category.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Block Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {filteredBlocks.length > 0 ? (
            filteredBlocks.map((block) => (
              <DraggableBlock key={block.type} block={block} />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">🔍</div>
              <div className="text-gray-500 text-sm">
                No blocks found matching "{searchTerm}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Tip */}
      <div className="p-4 bg-blue-50 border-t border-blue-100">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-blue-800 text-xs">
            <div className="font-medium">💡 Tip</div>
            <div className="mt-1">Drag blocks onto the canvas to add them to your template.</div>
          </div>
        </div>
      </div>
    </div>
  );
};