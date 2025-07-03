'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ExtractedQuestion, DocumentSection } from '@/types/gemini';

interface ContentEditorProps {
  title: string;
  subtitle: string;
  subject: string;
  questions: ExtractedQuestion[];
  sections: DocumentSection[];
  onUpdateTitle: (title: string) => void;
  onUpdateSubtitle: (subtitle: string) => void;
  onUpdateSubject: (subject: string) => void;
  onUpdateQuestion: (questionId: string, question: ExtractedQuestion) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
  onUpdateSection: (sectionId: string, section: DocumentSection) => void;
}

export function ContentEditor({
  title,
  subtitle,
  subject,
  questions,
  sections,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateSubject,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateSection
}: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <Tabs.List className="flex border-b border-gray-200 bg-gray-50 px-4">
          <Tabs.Trigger 
            value="overview"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="questions"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'questions' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Questions
            <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {questions.length}
            </span>
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="sections"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sections' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sections
            <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {sections.length}
            </span>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="p-6 overflow-y-auto flex-1">
          <OverviewTab 
            title={title}
            subtitle={subtitle}
            subject={subject}
            onUpdateTitle={onUpdateTitle}
            onUpdateSubtitle={onUpdateSubtitle}
            onUpdateSubject={onUpdateSubject}
          />
        </Tabs.Content>

        <Tabs.Content value="questions" className="p-6 overflow-y-auto flex-1">
          <QuestionsTab 
            questions={questions}
            onUpdateQuestion={onUpdateQuestion}
            onAddQuestion={onAddQuestion}
            onRemoveQuestion={onRemoveQuestion}
          />
        </Tabs.Content>

        <Tabs.Content value="sections" className="p-6 overflow-y-auto flex-1">
          <SectionsTab 
            sections={sections}
            onUpdateSection={onUpdateSection}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  title,
  subtitle,
  subject,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateSubject
}: {
  title: string;
  subtitle: string;
  subject: string;
  onUpdateTitle: (title: string) => void;
  onUpdateSubtitle: (subtitle: string) => void;
  onUpdateSubject: (subject: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Document Information</h3>
        <p className="text-xs text-gray-500 mb-4">
          Edit the basic information about your document
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Document Title"
            />
          </div>
          
          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              id="subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => onUpdateSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Document Subtitle (optional)"
            />
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => onUpdateSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Subject or Category"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Document Preview
        </h4>
        <div className="bg-white border border-gray-200 rounded p-4">
          <h1 className="text-xl font-bold text-gray-900">{title || 'Untitled Document'}</h1>
          {subtitle && <h2 className="text-lg text-gray-700 mt-1">{subtitle}</h2>}
          {subject && <p className="text-sm text-gray-500 mt-2">Subject: {subject}</p>}
          
          {/* Document statistics section - uncomment if needed
          <div className="mt-4 text-sm text-gray-600">
            <p>Document Statistics:</p>
            <div className="flex gap-4 mt-2">
              <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 text-xs font-medium">
                Questions: {questions.length}
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-xs font-medium">
                Sections: {sections.length}
              </div>
            </div>
          </div>
          */}
        </div>
      </div>
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Questions ({questions.length})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Edit or add questions extracted from your document
          </p>
        </div>
        <button
          onClick={onAddQuestion}
          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">❓</div>
          <p className="text-gray-600 mb-4">No questions have been extracted</p>
          <button
            onClick={onAddQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updatedQuestion) => onUpdateQuestion(question.id, updatedQuestion)}
              onRemove={() => onRemoveQuestion(question.id)}
              canRemove={questions.length > 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Question Editor Component
function QuestionEditor({
  question,
  index,
  onUpdate,
  onRemove,
  canRemove
}: {
  question: ExtractedQuestion;
  index: number;
  onUpdate: (question: ExtractedQuestion) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const handleTypeChange = (type: string) => {
    if (type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
      // Initialize with two empty options if switching to multiple choice
      onUpdate({
        ...question,
        type: type as 'multiple_choice' | 'short_answer',
        options: question.options || ['', '']
      });
    } else {
      onUpdate({
        ...question,
        type: type as 'multiple_choice' | 'short_answer'
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!question.options) return;
    
    const newOptions = [...question.options];
    newOptions[index] = value;
    
    onUpdate({
      ...question,
      options: newOptions
    });
  };

  const addOption = () => {
    onUpdate({
      ...question,
      options: [...(question.options || []), '']
    });
  };

  const removeOption = (index: number) => {
    if (!question.options) return;
    
    const newOptions = question.options.filter((_, i) => i !== index);
    
    onUpdate({
      ...question,
      options: newOptions
    });
  };

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <Collapsible.Trigger asChild>
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">
                {question.content || 'New Question'}
              </p>
              <p className="text-xs text-gray-500">
                {question.type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
                {question.type === 'multiple_choice' && question.options && (
                  <span> • {question.options.length} options</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              disabled={!canRemove}
              className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
              aria-label="Remove question"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </Collapsible.Trigger>
      
      <Collapsible.Content>
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Question Content */}
          <div>
            <label htmlFor={`question-${question.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Question Text
            </label>
            <textarea
              id={`question-${question.id}`}
              value={question.content}
              onChange={(e) => onUpdate({ ...question, content: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] resize-y"
              placeholder="Enter your question here..."
            />
          </div>
          
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={question.type === 'short_answer'}
                  onChange={() => handleTypeChange('short_answer')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Short Answer</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={question.type === 'multiple_choice'}
                  onChange={() => handleTypeChange('multiple_choice')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Multiple Choice</span>
              </label>
            </div>
          </div>
          
          {/* Multiple Choice Options */}
          {question.type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Options
              </label>
              <div className="space-y-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <button
                      onClick={() => removeOption(optionIndex)}
                      disabled={question.options?.length <= 2}
                      className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
                      aria-label="Remove option"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addOption}
                  className="mt-2 px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

// Sections Tab Component
function SectionsTab({
  sections,
  onUpdateSection
}: {
  sections: DocumentSection[];
  onUpdateSection: (sectionId: string, section: DocumentSection) => void;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const sectionRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Filter sections based on search term
  const filteredSections = sections.filter(section => 
    section.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sections by page for better organization
  const sectionsByPage = filteredSections.reduce<{[key: number]: DocumentSection[]}>((acc, section) => {
    const page = section.position.page;
    if (!acc[page]) acc[page] = [];
    acc[page].push(section);
    return acc;
  }, {});

  // Sort pages numerically
  const sortedPages = Object.keys(sectionsByPage).map(Number).sort((a, b) => a - b);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, sections: DocumentSection[]) => {
    if (!activeSection) return;
    
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex === -1) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < sections.length - 1) {
          const nextSection = sections[currentIndex + 1];
          setActiveSection(nextSection.id);
          sectionRefs.current[nextSection.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevSection = sections[currentIndex - 1];
          setActiveSection(prevSection.id);
          sectionRefs.current[prevSection.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        break;
      case 'Enter':
        e.preventDefault();
        // Toggle the active section
        const sectionElement = sectionRefs.current[activeSection];
        if (sectionElement) {
          const button = sectionElement.querySelector('button[data-edit]');
          button?.click();
        }
        break;
    }
  };

  return (
    <div className="space-y-4" onKeyDown={(e) => handleKeyDown(e, filteredSections)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Document Sections ({sections.length})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Edit content sections extracted from your document
          </p>
        </div>
        
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-600">No sections have been extracted</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {searchTerm && filteredSections.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">No sections match your search</p>
            </div>
          ) : (
            sortedPages.map(page => (
              <div key={page} className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    Page {page}
                  </div>
                  <div className="ml-2 text-xs text-gray-500">
                    {sectionsByPage[page].length} section{sectionsByPage[page].length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {sectionsByPage[page]
                    .sort((a, b) => a.position.order - b.position.order)
                    .map((section) => (
                      <SectionEditor
                        key={section.id}
                        section={section}
                        onUpdate={(updatedSection) => onUpdateSection(section.id, updatedSection)}
                        isActive={activeSection === section.id}
                        onActivate={() => setActiveSection(section.id)}
                        ref={(el) => sectionRefs.current[section.id] = el}
                      />
                    ))
                  }
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Keyboard navigation help */}
      <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Keyboard Navigation</h4>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center text-xs text-gray-600">
            <span className="bg-gray-200 px-1.5 py-0.5 rounded mr-1.5 font-mono">↑</span>
            <span className="bg-gray-200 px-1.5 py-0.5 rounded mr-1.5 font-mono">↓</span>
            Navigate sections
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="bg-gray-200 px-1.5 py-0.5 rounded mr-1.5 font-mono">Enter</span>
            Edit section
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="bg-gray-200 px-1.5 py-0.5 rounded mr-1.5 font-mono">Esc</span>
            Close editor
          </div>
        </div>
      </div>
    </div>
  );
}

// Section Editor Component
const SectionEditor = React.forwardRef<HTMLDivElement, {
  section: DocumentSection;
  onUpdate: (section: DocumentSection) => void;
  isActive: boolean;
  onActivate: () => void;
}>(({ section, onUpdate, isActive, onActivate }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayContent, setDisplayContent] = useState(section.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get type color based on section type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'header': return 'bg-purple-100 text-purple-800';
      case 'question': return 'bg-blue-100 text-blue-800';
      case 'answer': return 'bg-green-100 text-green-800';
      case 'instruction': return 'bg-yellow-100 text-yellow-800';
      case 'content': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    setDisplayContent(section.content);
  }, [section.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleContentChange = (value: string) => {
    setDisplayContent(value);
    onUpdate({ ...section, content: value });
  };

  // Calculate dynamic height based on content
  const calculateRows = (content: string) => {
    const lines = content.split('\n').length;
    const minRows = 3;
    const maxRows = 20;
    return Math.max(minRows, Math.min(lines + 2, maxRows));
  };

  // Handle keyboard events in the editor
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Get preview content (first 100 characters)
  const getPreviewContent = (content: string) => {
    if (!content) return 'Empty content';
    const trimmed = content.trim();
    return trimmed.length > 100 ? `${trimmed.substring(0, 100)}...` : trimmed;
  };

  return (
    <div 
      ref={ref}
      className={`border rounded-lg overflow-hidden transition-all ${
        isActive ? 'border-blue-400 shadow-sm' : 'border-gray-200'
      } ${isEditing ? 'bg-white' : 'bg-white hover:bg-gray-50'}`}
      onClick={onActivate}
    >
      {/* Section Header - Always visible */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Type Badge */}
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(section.type)}`}>
            {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
          </div>
          
          {/* Order Badge */}
          <div className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
            #{section.position.order}
          </div>
          
          {/* Content Preview */}
          <div className="text-sm text-gray-700 truncate flex-1">
            {!isEditing && getPreviewContent(section.content)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <button
            data-edit="true"
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            aria-label={isEditing ? "Close editor" : "Edit section"}
          >
            {isEditing ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Expanded Editor */}
      {isEditing && (
        <div className="p-3 border-t border-gray-200 space-y-3" onKeyDown={handleEditorKeyDown}>
          {/* Section Type */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Section Type
              </label>
              <select
                value={section.type}
                onChange={(e) => onUpdate({ ...section, type: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="header">Header</option>
                <option value="question">Question</option>
                <option value="answer">Answer</option>
                <option value="instruction">Instruction</option>
                <option value="content">Content</option>
              </select>
            </div>
            
            {/* Position Information */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Page
              </label>
              <input
                type="number"
                min="1"
                value={section.position.page}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  position: { 
                    ...section.position, 
                    page: parseInt(e.target.value) || 1 
                  } 
                })}
                className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                min="1"
                value={section.position.order}
                onChange={(e) => onUpdate({ 
                  ...section, 
                  position: { 
                    ...section.position, 
                    order: parseInt(e.target.value) || 1 
                  } 
                })}
                className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Section Content */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              ref={textareaRef}
              value={displayContent}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={calculateRows(displayContent)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-y min-h-[100px]"
              placeholder="Section content..."
            />
            
            {/* Content stats */}
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span>{displayContent.length} characters</span>
                <span>{displayContent.split('\n').length} lines</span>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-blue-600 hover:text-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SectionEditor.displayName = 'SectionEditor';