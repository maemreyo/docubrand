// UPDATED: 2025-07-03 - Enhanced layout with Radix UI Tabs for better UX

'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeminiAnalysisResponse, ExtractedQuestion, DocumentSection } from '@/types/gemini';
import { EnhancedDocumentSection, ContentType } from '@/types/editor';
import { SectionEditor } from './editor/SectionEditor';
import { QuestionEditor } from './editor/QuestionEditor';
import { ContentEditor } from './ContentEditor';
import { DirectPDFViewer } from './DirectPDFViewer';
import { contentFormatter } from './editor/ContentFormatter';
import * as Tabs from '@radix-ui/react-tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDownIcon, ChevronUpIcon, FileTextIcon, HelpCircleIcon, EyeIcon, FilePlusIcon } from 'lucide-react';
import { Button } from './ui/button';

interface VerificationUIProps {
  file: File;
  analysisResult: GeminiAnalysisResponse;
  onContentUpdated: (updatedResult: GeminiAnalysisResponse) => void;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function VerificationUI({
  file,
  analysisResult,
  onContentUpdated,
  onApprove,
  onReject,
  isProcessing = false
}: VerificationUIProps) {
  const [editedResult, setEditedResult] = useState<GeminiAnalysisResponse>(analysisResult);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showTemplateSystem, setShowTemplateSystem] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'questions' | 'overview'>('sections');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Enhanced sections with editor-specific properties
  const [enhancedSections, setEnhancedSections] = useState<EnhancedDocumentSection[]>(() => 
    convertToEnhancedSections(analysisResult.documentStructure.sections)
  );

  // Create PDF preview URL
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Update parent when content changes
  useEffect(() => {
    onContentUpdated(editedResult);
    setHasUnsavedChanges(true);
  }, [editedResult, onContentUpdated]);

  // Content validation
  useEffect(() => {
    const errors: string[] = [];
    
    if (!editedResult.extractedContent.title.trim()) {
      errors.push('Document title is required');
    }
    
    if (editedResult.extractedQuestions.length === 0 && enhancedSections.length === 0) {
      errors.push('At least one question or content section is required');
    }

    editedResult.extractedQuestions.forEach((q, index) => {
      if (!q.content.trim()) {
        errors.push(`Question ${index + 1} content is empty`);
      }
      if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        errors.push(`Question ${index + 1} needs at least 2 options`);
      }
    });

    // Validate enhanced sections
    enhancedSections.forEach((section, index) => {
      if (section.validationErrors && section.validationErrors.length > 0) {
        errors.push(`Section ${index + 1}: ${section.validationErrors.join(', ')}`);
      }
    });

    setValidationErrors(errors);
  }, [editedResult, enhancedSections]);

  // Convert regular sections to enhanced sections
  function convertToEnhancedSections(sections: DocumentSection[]): EnhancedDocumentSection[] {
    return sections.map(section => ({
      ...section,
      isEditing: false,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: contentFormatter.getWordCount(section.content),
      characterCount: contentFormatter.getCharacterCount(section.content),
      validationErrors: [],
      isValid: true,
      // Auto-detect content type
      type: contentFormatter.detectContentType(section.content) as ContentType
    }));
  }

  // Enhanced section update handler
  const updateEnhancedSection = useCallback((sectionId: string, updatedSection: EnhancedDocumentSection) => {
    setEnhancedSections(prev => 
      prev.map(s => s.id === sectionId ? updatedSection : s)
    );

    // Also update the main analysis result
    setEditedResult(prev => ({
      ...prev,
      documentStructure: {
        ...prev.documentStructure,
        sections: enhancedSections.map(s => 
          s.id === sectionId ? {
            id: updatedSection.id,
            type: updatedSection.type,
            content: updatedSection.content,
            position: updatedSection.position,
            confidence: updatedSection.confidence
          } : {
            id: s.id,
            type: s.type,
            content: s.content,
            position: s.position,
            confidence: s.confidence
          }
        )
      }
    }));
  }, [enhancedSections]);

  // Legacy section update handler (for backward compatibility)
  const updateSection = useCallback((sectionId: string, updatedSection: DocumentSection) => {
    setEditedResult(prev => ({
      ...prev,
      documentStructure: {
        ...prev.documentStructure,
        sections: prev.documentStructure.sections.map(s =>
          s.id === sectionId ? updatedSection : s
        )
      }
    }));
  }, []);

  const updateQuestion = useCallback((questionId: string, updatedQuestion: ExtractedQuestion) => {
    setEditedResult(prev => ({
      ...prev,
      extractedQuestions: prev.extractedQuestions.map(q =>
        q.id === questionId ? updatedQuestion : q
      )
    }));
  }, []);

  const updateDocumentInfo = useCallback((field: string, value: string) => {
    if (field === 'title' || field === 'subtitle') {
      setEditedResult(prev => ({
        ...prev,
        extractedContent: {
          ...prev.extractedContent,
          [field]: value
        }
      }));
    } else if (field === 'subject') {
      setEditedResult(prev => ({
        ...prev,
        documentStructure: {
          ...prev.documentStructure,
          subject: value
        }
      }));
    }
  }, []);

  const addNewQuestion = useCallback(() => {
    const newQuestion: ExtractedQuestion = {
      id: `q_${Date.now()}`,
      number: String(editedResult.extractedQuestions.length + 1),
      content: '',
      type: 'short_answer'
    };

    setEditedResult(prev => ({
      ...prev,
      extractedQuestions: [...prev.extractedQuestions, newQuestion]
    }));
  }, [editedResult.extractedQuestions.length]);

  const removeQuestion = useCallback((questionId: string) => {
    setEditedResult(prev => ({
      ...prev,
      extractedQuestions: prev.extractedQuestions.filter(q => q.id !== questionId)
    }));
  }, []);

  const addNewSection = useCallback(() => {
    const newSection: EnhancedDocumentSection = {
      id: `section_${Date.now()}`,
      type: 'text',
      content: '',
      position: { page: 1, x: 0, y: 0, width: 100, height: 20 },
      confidence: 1.0,
      isEditing: true,
      isDirty: false,
      lastModified: Date.now(),
      wordCount: 0,
      characterCount: 0,
      validationErrors: [],
      isValid: true
    };

    setEnhancedSections(prev => [...prev, newSection]);
    setActiveSection(newSection.id);
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setEnhancedSections(prev => prev.filter(s => s.id !== sectionId));
    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  }, [activeSection]);

  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleApprove = useCallback(() => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before proceeding');
      return;
    }
    setHasUnsavedChanges(false);
    onApprove();
  }, [validationErrors, onApprove]);

  const handleReject = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to start over?')) {
        return;
      }
    }
    setHasUnsavedChanges(false);
    onReject();
  }, [hasUnsavedChanges, onReject]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review & Edit Content</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI extracted content below. Review and edit before generating branded PDF.
            </p>
          </div>
          
          {/* Stats Summary */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FileTextIcon className="w-4 h-4" />
              <span>{enhancedSections.length} sections</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircleIcon className="w-4 h-4" />
              <span>{editedResult.extractedQuestions.length} questions</span>
            </div>
            {validationErrors.length > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span>{validationErrors.length} issues</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">Please fix these issues:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content - Improved Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* PDF Viewer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Original Document</h3>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <DirectPDFViewer file={file} dataUrl={pdfUrl} />
          </div>
        </div>

        {/* Content Editor - Enhanced with Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Content Editor</h3>
          </div>

          {/* Radix UI Tabs for Better Organization */}
          <Tabs.Root 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className="w-full"
          >
            <Tabs.List className="flex border-b border-gray-200">
              <Tabs.Trigger
                value="sections"
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                <div className="flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4" />
                  <span>Sections ({enhancedSections.length})</span>
                </div>
              </Tabs.Trigger>
              
              <Tabs.Trigger
                value="questions"
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                <div className="flex items-center gap-2">
                  <HelpCircleIcon className="w-4 h-4" />
                  <span>Questions ({editedResult.extractedQuestions.length})</span>
                </div>
              </Tabs.Trigger>
              
              <Tabs.Trigger
                value="overview"
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                <div className="flex items-center gap-2">
                  <EyeIcon className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </Tabs.Trigger>
            </Tabs.List>

            {/* Sections Tab */}
            <Tabs.Content value="sections" className="mt-4">
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Edit document sections below. Click to expand or collapse.
                  </p>
                  <button
                    onClick={addNewSection}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Section
                  </button>
                </div>
                
                {enhancedSections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                    <div className="text-2xl mb-2">📄</div>
                    <p className="text-sm">No sections detected</p>
                    <button
                      onClick={addNewSection}
                      className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add First Section
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enhancedSections.map((section) => (
                      <Collapsible.Root
                        key={section.id}
                        open={!collapsedSections.has(section.id)}
                        onOpenChange={() => toggleSectionCollapse(section.id)}
                      >
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <Collapsible.Trigger asChild>
                            <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  px-2 py-1 rounded text-xs font-medium
                                  ${section.type === 'header' ? 'bg-purple-100 text-purple-800' : 
                                    section.type === 'question' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-gray-100 text-gray-800'}
                                `}>
                                  {section.type}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {section.content.slice(0, 50)}...
                                </span>
                              </div>
                              {collapsedSections.has(section.id) ? (
                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </Collapsible.Trigger>
                          
                          <Collapsible.Content>
                            <div className="p-4 border-t border-gray-200">
                              <SectionEditor
                                section={section}
                                onUpdate={(updated) => updateEnhancedSection(section.id, updated)}
                                onDelete={() => removeSection(section.id)}
                                isActive={activeSection === section.id}
                                onActivate={() => setActiveSection(section.id)}
                                config={{
                                  autoSave: { enabled: true, interval: 3000 },
                                  toolbar: { enabled: true, compact: true },
                                  validation: { enabled: true }
                                }}
                              />
                            </div>
                          </Collapsible.Content>
                        </div>
                      </Collapsible.Root>
                    ))}
                  </div>
                )}
              </div>
            </Tabs.Content>

            {/* Questions Tab */}
            <Tabs.Content value="questions" className="mt-4">
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Edit questions extracted from the document.
                  </p>
                  <button
                    onClick={addNewQuestion}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Question
                  </button>
                </div>
                
                {editedResult.extractedQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                    <div className="text-2xl mb-2">❓</div>
                    <p className="text-sm">No questions detected</p>
                    <button
                      onClick={addNewQuestion}
                      className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add First Question
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editedResult.extractedQuestions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              Question {index + 1}
                            </span>
                            <span className={`
                              px-2 py-1 rounded text-xs font-medium
                              ${question.type === 'multiple_choice' ? 'bg-green-100 text-green-800' : 
                                question.type === 'short_answer' ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'}
                            `}>
                              {question.type.replace('_', ' ')}
                            </span>
                          </div>
                          <button
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <QuestionEditor
                          question={question}
                          onUpdate={(updated) => updateQuestion(question.id, updated)}
                          onRemove={() => removeQuestion(question.id)}
                          canRemove={editedResult.extractedQuestions.length > 1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs.Content>

            {/* Overview Tab */}
            <Tabs.Content value="overview" className="mt-4">
              <div className="space-y-6">
                {/* Document Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Document Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editedResult.extractedContent.title}
                        onChange={(e) => updateDocumentInfo('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={editedResult.documentStructure.subject}
                        onChange={(e) => updateDocumentInfo('subject', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Statistics */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Content Statistics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {enhancedSections.length}
                      </div>
                      <div className="text-blue-800">Sections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {editedResult.extractedQuestions.length}
                      </div>
                      <div className="text-blue-800">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {enhancedSections.reduce((acc, s) => acc + (s.wordCount || 0), 0)}
                      </div>
                      <div className="text-blue-800">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {validationErrors.length === 0 ? '✅' : '❌'}
                      </div>
                      <div className="text-blue-800">Valid</div>
                    </div>
                  </div>
                </div>

                {/* Validation Status */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-900 mb-3">Issues to Fix</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasUnsavedChanges && (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowTemplateSystem(true)}
              className="mb-4"
            >
              <FilePlusIcon className="w-4 h-4 mr-2" />
              Use Template System
            </Button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Start Over
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing || validationErrors.length > 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Branded PDF →'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

