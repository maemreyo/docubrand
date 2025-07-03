// CREATED: 2025-07-03 - Demo component showcasing enhanced SectionEditor features

'use client';

import React, { useState } from 'react';
import { EnhancedDocumentSection, ContentType, DEFAULT_EDITOR_CONFIG } from '@/types/editor';
import { SectionEditor } from '../editor/SectionEditor';
import { contentFormatter, formatContent } from '../editor/ContentFormatter';

export function SectionEditorDemo() {
  const [sections, setSections] = useState<EnhancedDocumentSection[]>([
    {
      id: 'demo_header_1',
      type: 'header',
      content: 'Chapter 1: Introduction to React Components',
      position: { page: 1, x: 0, y: 0, width: 100, height: 10 },
      confidence: 0.95,
      isEditing: false,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: 6,
      characterCount: 42,
      validationErrors: [],
      isValid: true
    },
    {
      id: 'demo_question_1',
      type: 'question',
      content: 'What is the main purpose of React components?\n\nA) To style web pages\nB) To create reusable UI elements\nC) To handle database connections\nD) To manage server requests\n\nCorrect Answer: B',
      position: { page: 1, x: 0, y: 20, width: 100, height: 30 },
      confidence: 0.88,
      isEditing: false,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: 24,
      characterCount: 156,
      validationErrors: [],
      isValid: true
    },
    {
      id: 'demo_instruction_1',
      type: 'instruction',
      content: 'Instructions: Read the following passage carefully and answer the questions below. Pay special attention to the key concepts highlighted in bold.',
      position: { page: 1, x: 0, y: 55, width: 100, height: 15 },
      confidence: 0.92,
      isEditing: false,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: 23,
      characterCount: 145,
      validationErrors: [],
      isValid: true
    },
    {
      id: 'demo_rich_1',
      type: 'rich',
      content: 'React components are **reusable pieces of code** that return JSX elements. They can be *functional* or *class-based*, with functional components being more modern and preferred. Components help create <u>modular applications</u> that are easier to maintain.',
      position: { page: 1, x: 0, y: 75, width: 100, height: 20 },
      confidence: 0.85,
      isEditing: false,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: 38,
      characterCount: 248,
      validationErrors: [],
      isValid: true
    },
    {
      id: 'demo_markdown_1',
      type: 'markdown',
      content: '# Key Benefits of Components\n\n- **Reusability**: Write once, use everywhere\n- **Maintainability**: Easier to update and debug\n- **Modularity**: Clear separation of concerns\n- **Testing**: Individual components can be tested in isolation',
      position: { page: 2, x: 0, y: 0, width: 100, height: 25 },
      confidence: 0.90,
      isEditing: false,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: 32,
      characterCount: 215,
      validationErrors: [],
      isValid: true
    }
  ]);

  const [activeSection, setActiveSection] = useState<string | null>('demo_header_1');
  const [showStats, setShowStats] = useState(true);
  const [editorMode, setEditorMode] = useState<'standard' | 'advanced'>('standard');

  const updateSection = (sectionId: string, updatedSection: EnhancedDocumentSection) => {
    setSections(prev => 
      prev.map(s => s.id === sectionId ? updatedSection : s)
    );
  };

  const addNewSection = (contentType: ContentType) => {
    const templates = {
      text: 'Enter your text content here...',
      header: 'New Section Header',
      question: 'What is your question?\n\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\n\nCorrect Answer: A',
      instruction: 'Instructions: Complete the following task...',
      rich: 'Enter **rich text** with *formatting* and <u>styles</u>...',
      markdown: '# Markdown Section\n\nEnter your **markdown** content here...\n\n- Item 1\n- Item 2',
      code: 'function example() {\n  return "Hello World";\n}',
      list: '• First item\n• Second item\n• Third item'
    };

    const newSection: EnhancedDocumentSection = {
      id: `demo_${contentType}_${Date.now()}`,
      type: contentType,
      content: templates[contentType] || 'New content...',
      position: { page: 1, x: 0, y: 0, width: 100, height: 20 },
      confidence: 1.0,
      isEditing: true,
      isDirty: true,
      lastModified: Date.now(),
      wordCount: contentFormatter.getWordCount(templates[contentType] || 'New content...'),
      characterCount: (templates[contentType] || 'New content...').length,
      validationErrors: [],
      isValid: true
    };

    setSections(prev => [...prev, newSection]);
    setActiveSection(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    if (activeSection === sectionId) {
      setActiveSection(sections.length > 1 ? sections[0].id : null);
    }
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const duplicated: EnhancedDocumentSection = {
        ...section,
        id: `${section.id}_copy_${Date.now()}`,
        content: section.content + ' (Copy)',
        isDirty: true,
        isEditing: true,
        lastModified: Date.now()
      };
      setSections(prev => [...prev, duplicated]);
      setActiveSection(duplicated.id);
    }
  };

  const getEditorConfig = () => {
    const baseConfig = { ...DEFAULT_EDITOR_CONFIG };
    
    if (editorMode === 'advanced') {
      return {
        ...baseConfig,
        toolbar: {
          ...baseConfig.toolbar,
          actions: ['bold', 'italic', 'underline', 'heading1', 'heading2', 'heading3', 'bulletList', 'numberedList', 'alignLeft', 'alignCenter', 'alignRight', 'undo', 'redo', 'save', 'cancel', 'preview', 'fullscreen']
        },
        validation: {
          ...baseConfig.validation,
          rules: [
            ...baseConfig.validation?.rules || [],
            {
              id: 'custom_validation',
              name: 'Demo Validation',
              type: 'custom',
              message: 'Content should not contain the word "bad"',
              validator: (content: string) => !content.toLowerCase().includes('bad')
            }
          ]
        },
        features: {
          ...baseConfig.features,
          lineNumbers: true
        }
      };
    }
    
    return baseConfig;
  };

  const totalStats = {
    sections: sections.length,
    words: sections.reduce((sum, s) => sum + (s.wordCount || 0), 0),
    characters: sections.reduce((sum, s) => sum + (s.characterCount || 0), 0),
    pages: Math.max(...sections.map(s => s.position.page), 1)
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced SectionEditor Demo
        </h1>
        <p className="text-gray-600 mb-4">
          Experience the powerful editing capabilities of the new SectionEditor component suite.
          Try different content types, formatting options, and advanced features.
        </p>
        
        {/* Demo Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Editor Mode
              </label>
              <select
                value={editorMode}
                onChange={(e) => setEditorMode(e.target.value as 'standard' | 'advanced')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showStats"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showStats" className="text-sm font-medium text-gray-700">
                Show Statistics
              </label>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Active:</strong> {activeSection ? activeSection.split('_').slice(-1)[0] : 'None'}
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Total:</strong> {totalStats.sections} sections, {totalStats.words} words
            </div>
          </div>
        </div>

        {/* Add Section Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Section</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'text' as ContentType, label: 'Plain Text', color: 'bg-gray-100 text-gray-800' },
              { type: 'header' as ContentType, label: 'Header', color: 'bg-purple-100 text-purple-800' },
              { type: 'question' as ContentType, label: 'Question', color: 'bg-blue-100 text-blue-800' },
              { type: 'instruction' as ContentType, label: 'Instruction', color: 'bg-yellow-100 text-yellow-800' },
              { type: 'rich' as ContentType, label: 'Rich Text', color: 'bg-green-100 text-green-800' },
              { type: 'markdown' as ContentType, label: 'Markdown', color: 'bg-indigo-100 text-indigo-800' },
              { type: 'code' as ContentType, label: 'Code', color: 'bg-red-100 text-red-800' },
              { type: 'list' as ContentType, label: 'List', color: 'bg-orange-100 text-orange-800' }
            ].map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => addNewSection(type)}
                className={`px-3 py-1 text-xs font-medium rounded-full hover:opacity-80 transition-opacity ${color}`}
              >
                Add {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Document Sections</h3>
              <p className="text-sm text-gray-600 mt-1">{sections.length} sections total</p>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    activeSection === section.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${section.type === 'header' ? 'bg-purple-100 text-purple-800' :
                        section.type === 'question' ? 'bg-blue-100 text-blue-800' :
                        section.type === 'instruction' ? 'bg-yellow-100 text-yellow-800' :
                        section.type === 'rich' ? 'bg-green-100 text-green-800' :
                        section.type === 'markdown' ? 'bg-indigo-100 text-indigo-800' :
                        section.type === 'code' ? 'bg-red-100 text-red-800' :
                        section.type === 'list' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSection(section.id);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 text-xs"
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 text-xs"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-800 line-clamp-2">
                    {section.content.length > 60 
                      ? `${section.content.substring(0, 60)}...` 
                      : section.content}
                  </div>
                  
                  {showStats && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{section.wordCount} words</span>
                      <span>{section.characterCount} chars</span>
                      {section.isDirty && <span className="text-yellow-600">• Unsaved</span>}
                    </div>
                  )}
                </div>
              ))}
              
              {sections.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-2xl mb-2">📄</div>
                  <p className="text-sm">No sections yet</p>
                  <p className="text-xs mt-1">Add a section to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Editor */}
        <div className="lg:col-span-2">
          {activeSection ? (
            <div className="space-y-4">
              {sections
                .filter(s => s.id === activeSection)
                .map(section => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onUpdate={(updated) => updateSection(section.id, updated)}
                    onDelete={() => removeSection(section.id)}
                    isActive={true}
                    config={getEditorConfig()}
                    showStats={showStats}
                    autoFocus={section.isEditing}
                  />
                ))}
              
              {/* Demo Features Panel */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Demo Features</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Keyboard Shortcuts</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li><code className="bg-gray-100 px-1 rounded">Ctrl+S</code> Save</li>
                      <li><code className="bg-gray-100 px-1 rounded">Ctrl+Z</code> Undo</li>
                      <li><code className="bg-gray-100 px-1 rounded">Ctrl+Y</code> Redo</li>
                      <li><code className="bg-gray-100 px-1 rounded">Ctrl+B</code> Bold</li>
                      <li><code className="bg-gray-100 px-1 rounded">Esc</code> Cancel</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Content Types</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>📝 Plain Text</li>
                      <li>🎯 Questions with auto-format</li>
                      <li>💡 Rich text with formatting</li>
                      <li>📋 Markdown with preview</li>
                      <li>💻 Code with syntax awareness</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Section to Edit
              </h3>
              <p className="text-gray-600 mb-4">
                Choose a section from the list on the left to start editing, or add a new section to see the enhanced editor in action.
              </p>
              <button
                onClick={() => addNewSection('text')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create First Section
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Stats Footer */}
      {showStats && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Document Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalStats.sections}</div>
              <div className="text-gray-600">Total Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalStats.words}</div>
              <div className="text-gray-600">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalStats.characters}</div>
              <div className="text-gray-600">Total Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalStats.pages}</div>
              <div className="text-gray-600">Pages</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}