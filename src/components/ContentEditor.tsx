// UPDATED: 2025-07-03 - Enhanced with new SectionEditor components

'use client';

import React, { useState, useRef, useCallback } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as Tabs from '@radix-ui/react-tabs';
import { GeminiAnalysisResponse, ExtractedQuestion, DocumentSection } from '@/types/gemini';
import { EnhancedDocumentSection, ContentType } from '@/types/editor';
import { SectionEditor } from './editor/SectionEditor';
import { contentFormatter } from './editor/ContentFormatter';

interface ContentEditorProps {
  analysisResult: GeminiAnalysisResponse;
  onUpdateQuestion: (questionId: string, question: ExtractedQuestion) => void;
  onUpdateSection: (sectionId: string, section: DocumentSection) => void;
  onUpdateDocumentInfo: (field: string, value: string) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
  mode?: 'enhanced' | 'legacy';
}

export function ContentEditor({
  analysisResult,
  onUpdateQuestion,
  onUpdateSection,
  onUpdateDocumentInfo,
  onAddQuestion,
  onRemoveQuestion,
  mode = 'enhanced'
}: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState('sections');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const sectionRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Convert regular sections to enhanced sections for the enhanced editor
  const enhancedSections = React.useMemo<EnhancedDocumentSection[]>(() => 
    analysisResult.documentStructure.sections.map(section => ({
      ...section,
      isEditing: false,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: contentFormatter.getWordCount(section.content),
      characterCount: contentFormatter.getCharacterCount(section.content),
      validationErrors: [],
      isValid: true,
      type: contentFormatter.detectContentType(section.content) as ContentType
    }) as any)
  , [analysisResult.documentStructure.sections]);

  // Enhanced section update handler
  const handleEnhancedSectionUpdate = useCallback((sectionId: string, updatedSection: EnhancedDocumentSection) => {
    // Convert back to regular DocumentSection for parent component
    const regularSection: DocumentSection = {
      id: updatedSection.id,
      type: updatedSection.type,
      content: updatedSection.content,
      position: updatedSection.position,
      confidence: updatedSection.confidence
    };
    onUpdateSection(sectionId, regularSection);
  }, [onUpdateSection]);

  // Filter content based on search
  const filteredSections = enhancedSections.filter(section => 
    section.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuestions = analysisResult.extractedQuestions.filter(question =>
    question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const stats = {
    totalSections: enhancedSections.length,
    totalQuestions: analysisResult.extractedQuestions.length,
    totalWords: enhancedSections.reduce((sum, s) => sum + (s.wordCount || 0), 0),
    totalCharacters: enhancedSections.reduce((sum, s) => sum + (s.characterCount || 0), 0)
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'enhanced' ? 'Enhanced Content Editor' : 'Content Editor'}
          </h3>
          
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-2 pl-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSections}</div>
            <div className="text-xs text-gray-600">Sections</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.totalQuestions}</div>
            <div className="text-xs text-gray-600">Questions</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.totalWords}</div>
            <div className="text-xs text-gray-600">Words</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalCharacters / 1000)}k</div>
            <div className="text-xs text-gray-600">Characters</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <Tabs.List className="flex border-b border-gray-200 bg-gray-50">
          <Tabs.Trigger
            value="document"
            className="px-6 py-3 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600"
          >
            Document Info
          </Tabs.Trigger>
          <Tabs.Trigger
            value="sections"
            className="px-6 py-3 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600"
          >
            Sections ({filteredSections.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="questions"
            className="px-6 py-3 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600"
          >
            Questions ({filteredQuestions.length})
          </Tabs.Trigger>
        </Tabs.List>

        {/* Document Info Tab */}
        <Tabs.Content value="document" className="p-6">
          <DocumentInfoEditor
            analysisResult={analysisResult}
            onUpdateDocumentInfo={onUpdateDocumentInfo}
          />
        </Tabs.Content>

        {/* Sections Tab */}
        <Tabs.Content value="sections" className="p-6">
          {mode === 'enhanced' ? (
            <EnhancedSectionsTab
              sections={filteredSections}
              onUpdateSection={handleEnhancedSectionUpdate}
              activeSectionId={activeSectionId}
              onSetActiveSection={setActiveSectionId}
              searchTerm={searchTerm}
            />
          ) : (
            <LegacySectionsTab
              sections={filteredSections.map(s => ({
                id: s.id,
                type: s.type,
                content: s.content,
                position: s.position,
                confidence: s.confidence
              }))}
              onUpdateSection={onUpdateSection}
            />
          )}
        </Tabs.Content>

        {/* Questions Tab */}
        <Tabs.Content value="questions" className="p-6">
          <QuestionsTab
            questions={filteredQuestions}
            onUpdateQuestion={onUpdateQuestion}
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

// Document Info Editor Component
function DocumentInfoEditor({
  analysisResult,
  onUpdateDocumentInfo
}: {
  analysisResult: GeminiAnalysisResponse;
  onUpdateDocumentInfo: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={analysisResult.extractedContent.title}
              onChange={(e) => onUpdateDocumentInfo('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter document title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={analysisResult.extractedContent.subtitle || ''}
              onChange={(e) => onUpdateDocumentInfo('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter subtitle (optional)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={analysisResult.documentStructure.subject}
              onChange={(e) => onUpdateDocumentInfo('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter subject..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={analysisResult.documentStructure.type}
              onChange={(e) => onUpdateDocumentInfo('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="quiz">Quiz</option>
              <option value="worksheet">Worksheet</option>
              <option value="exam">Exam</option>
              <option value="assignment">Assignment</option>
              <option value="handout">Handout</option>
              <option value="general">General Document</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={analysisResult.documentStructure.difficulty || 'medium'}
              onChange={(e) => onUpdateDocumentInfo('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={analysisResult.documentStructure.estimatedTime || ''}
              onChange={(e) => onUpdateDocumentInfo('estimatedTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="30"
              min="1"
              max="300"
            />
          </div>
        </div>
      </div>

      {/* Document Statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Document Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Sections:</span>
            <span className="ml-2 font-medium">{analysisResult.documentStructure.sections.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Questions:</span>
            <span className="ml-2 font-medium">{analysisResult.extractedQuestions.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Pages:</span>
            <span className="ml-2 font-medium">
              {Math.max(...analysisResult.documentStructure.sections.map(s => s.position.page), 1)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Confidence:</span>
            <span className="ml-2 font-medium">
              {Math.round(analysisResult.documentStructure.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Sections Tab Component
function EnhancedSectionsTab({
  sections,
  onUpdateSection,
  activeSectionId,
  onSetActiveSection,
  searchTerm
}: {
  sections: EnhancedDocumentSection[];
  onUpdateSection: (sectionId: string, section: EnhancedDocumentSection) => void;
  activeSectionId: string | null;
  onSetActiveSection: (sectionId: string | null) => void;
  searchTerm: string;
}) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchTerm ? 'No matching sections found' : 'No sections detected'}
        </h3>
        <p className="text-gray-600 mb-4">
          {searchTerm ? 
            'Try adjusting your search terms.' : 
            'The document analysis didn\'t detect any content sections.'
          }
        </p>
        {searchTerm && (
          <button
            onClick={() => onSetActiveSection(null)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          Content Sections 
          {searchTerm && (
            <span className="text-sm text-gray-500 ml-2">
              ({sections.length} results for "{searchTerm}")
            </span>
          )}
        </h4>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            onUpdate={(updated) => onUpdateSection(section.id, updated)}
            isActive={activeSectionId === section.id}
            onActivate={() => onSetActiveSection(section.id)}
            config={{
              autoSave: {
                enabled: true,
                interval: 2000,
                maxRetries: 3
              },
              toolbar: {
                enabled: true,
                actions: ['bold', 'italic', 'underline', 'heading1', 'heading2', 'bulletList', 'numberedList', 'undo', 'redo', 'save', 'preview'],
                compact: false
              },
              validation: {
                rules: [
                  {
                    id: 'required',
                    name: 'Required Content',
                    type: 'required',
                    message: 'Section content cannot be empty'
                  },
                  {
                    id: 'maxLength',
                    name: 'Maximum Length',
                    type: 'maxLength',
                    value: 3000,
                    message: 'Section content must be less than 3000 characters'
                  }
                ],
                realTime: true
              },
              features: {
                dragDrop: true,
                autoFormat: true,
                spellCheck: true,
                wordCount: true
              }
            }}
            showStats={true}
            autoFocus={section.id === activeSectionId}
          />
        ))}
      </div>
    </div>
  );
}

// Legacy Sections Tab Component
function LegacySectionsTab({
  sections,
  onUpdateSection
}: {
  sections: DocumentSection[];
  onUpdateSection: (sectionId: string, section: DocumentSection) => void;
}) {
  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">📄</div>
          <p className="text-sm">No sections detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <LegacySectionEditor
              key={section.id}
              section={section}
              onUpdate={(updated) => onUpdateSection(section.id, updated)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Legacy Section Editor Component
function LegacySectionEditor({ 
  section, 
  onUpdate 
}: {
  section: DocumentSection;
  onUpdate: (section: DocumentSection) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(section.content);

  const handleSave = () => {
    onUpdate({ ...section, content });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(section.content);
    setIsEditing(false);
  };

  const calculateRows = (content: string) => {
    const lines = content.split('\n').length;
    return Math.max(3, Math.min(lines + 2, 15));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <select
            value={section.type}
            onChange={(e) => onUpdate({ ...section, type: e.target.value })}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="header">Header</option>
            <option value="content">Content</option>
            <option value="question">Question</option>
            <option value="instruction">Instruction</option>
            <option value="answer">Answer</option>
          </select>
          <span className="text-xs text-gray-500">
            Page {section.position.page}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={calculateRows(content)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-y"
            placeholder="Section content..."
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{content.length} characters</span>
            <span>{content.split('\n').length} lines</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {section.content || <span className="text-gray-400 italic">Empty content</span>}
        </div>
      )}
    </div>
  );
}

// Questions Tab Component
function QuestionsTab({
  questions,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion
}: {
  questions: ExtractedQuestion[];
  onUpdateQuestion: (questionId: string, question: ExtractedQuestion) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Questions</h4>
        <button
          onClick={onAddQuestion}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">❓</div>
          <p className="text-sm mb-4">No questions detected</p>
          <button
            onClick={onAddQuestion}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onUpdate={(updated) => onUpdateQuestion(question.id, updated)}
              onRemove={() => onRemoveQuestion(question.id)}
              canRemove={questions.length > 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Question Editor Component (same as in VerificationUI)
function QuestionEditor({ 
  question, 
  onUpdate, 
  onRemove, 
  canRemove 
}: {
  question: ExtractedQuestion;
  onUpdate: (question: ExtractedQuestion) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const updateField = (field: keyof ExtractedQuestion, value: any) => {
    onUpdate({ ...question, [field]: value });
  };

  return (
    <Collapsible.Root defaultOpen className="border border-gray-200 rounded-lg bg-white">
      <Collapsible.Trigger className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">
            Question {question.number || 'N/A'}
          </span>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            {question.type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
              title="Remove question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </Collapsible.Trigger>

      <Collapsible.Content className="border-t border-gray-200 p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Number
              </label>
              <input
                type="text"
                value={question.number}
                onChange={(e) => updateField('number', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                value={question.type}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="short_answer">Short Answer</option>
                <option value="essay">Essay</option>
                <option value="fill_blank">Fill in Blank</option>
                <option value="true_false">True/False</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Content
            </label>
            <textarea
              value={question.content}
              onChange={(e) => updateField('content', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter question text..."
            />
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}