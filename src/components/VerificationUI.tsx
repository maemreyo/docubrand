// UPDATED: 2025-07-03 - Integrated enhanced SectionEditor components

'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeminiAnalysisResponse, ExtractedQuestion, DocumentSection } from '@/types/gemini';
import { EnhancedDocumentSection, ContentType } from '@/types/editor';
import { SectionEditor } from './editor/SectionEditor';
import { ContentEditor } from './ContentEditor';
import { DirectPDFViewer } from './DirectPDFViewer';
import { contentFormatter } from './editor/ContentFormatter';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'enhanced' | 'legacy'>('enhanced');

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
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Editor Mode:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'enhanced' | 'legacy')}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="enhanced">Enhanced Editor</option>
                <option value="legacy">Legacy Editor</option>
              </select>
            </div>
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* PDF Viewer */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Original Document</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <DirectPDFViewer file={file} dataUrl={pdfUrl} />
          </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {viewMode === 'enhanced' ? 'Enhanced Content Editor' : 'Legacy Content Editor'}
            </h3>
            
            {viewMode === 'enhanced' && (
              <button
                onClick={addNewSection}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Section
              </button>
            )}
          </div>

          {viewMode === 'enhanced' ? (
            // Enhanced Editor Mode
            <div className="space-y-4">
              {/* Document Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Document Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editedResult.extractedContent.title}
                      onChange={(e) => updateDocumentInfo('title', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={editedResult.documentStructure.subject}
                      onChange={(e) => updateDocumentInfo('subject', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Sections */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Content Sections ({enhancedSections.length})
                </h4>
                
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
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {enhancedSections.map((section) => (
                      <SectionEditor
                        key={section.id}
                        section={section}
                        onUpdate={(updated) => updateEnhancedSection(section.id, updated)}
                        onDelete={() => removeSection(section.id)}
                        isActive={activeSection === section.id}
                        onActivate={() => setActiveSection(section.id)}
                        config={{
                          autoSave: {
                            enabled: true,
                            interval: 3000,
                            maxRetries: 3
                          },
                          toolbar: {
                            enabled: true,
                            actions: ['bold', 'italic', 'heading1', 'heading2', 'bulletList', 'numberedList', 'undo', 'redo', 'save', 'preview'],
                            compact: false
                          },
                          validation: {
                            rules: [
                              {
                                id: 'required',
                                name: 'Required Content',
                                type: 'required',
                                message: 'Content cannot be empty'
                              },
                              {
                                id: 'maxLength',
                                name: 'Maximum Length',
                                type: 'maxLength',
                                value: 5000,
                                message: 'Content must be less than 5000 characters'
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
                        autoFocus={section.id === activeSection}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Questions Section */}
              {editedResult.extractedQuestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      Questions ({editedResult.extractedQuestions.length})
                    </h4>
                    <button
                      onClick={addNewQuestion}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Question
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editedResult.extractedQuestions.map((question) => (
                      <QuestionEditor
                        key={question.id}
                        question={question}
                        onUpdate={(updated) => updateQuestion(question.id, updated)}
                        onRemove={() => removeQuestion(question.id)}
                        canRemove={editedResult.extractedQuestions.length > 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Legacy Editor Mode
            <ContentEditor
              analysisResult={editedResult}
              onUpdateQuestion={updateQuestion}
              onUpdateSection={updateSection}
              onUpdateDocumentInfo={updateDocumentInfo}
              onAddQuestion={addNewQuestion}
              onRemoveQuestion={removeQuestion}
            />
          )}
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

// Legacy Question Editor Component (for backward compatibility)
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

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    updateField('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    updateField('options', newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index);
    updateField('options', newOptions);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={question.number}
            onChange={(e) => updateField('number', e.target.value)}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1"
          />
          <select
            value={question.type}
            onChange={(e) => updateField('type', e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="short_answer">Short Answer</option>
            <option value="essay">Essay</option>
            <option value="fill_blank">Fill in Blank</option>
            <option value="true_false">True/False</option>
          </select>
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            title="Remove question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Content
          </label>
          <textarea
            value={question.content}
            onChange={(e) => updateField('content', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter question text..."
          />
        </div>

        {question.type === 'multiple_choice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options
            </label>
            <div className="space-y-2">
              {(question.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 w-6">
                    {String.fromCharCode(65 + index)}:
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  {(question.options || []).length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Remove option"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
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

        {question.type === 'multiple_choice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correct Answer
            </label>
            <select
              value={question.correctAnswer || ''}
              onChange={(e) => updateField('correctAnswer', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select correct answer...</option>
              {(question.options || []).map((_, index) => (
                <option key={index} value={String.fromCharCode(65 + index)}>
                  Option {String.fromCharCode(65 + index)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}