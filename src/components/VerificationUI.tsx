// CREATED: 2025-07-03 - Split-screen verification interface for content editing

'use client';

import { useState, useEffect } from 'react';
import { GeminiAnalysisResponse, ExtractedQuestion, DocumentSection } from '@/types/gemini';

interface VerificationUIProps {
  file: File;
  analysisResult: GeminiAnalysisResponse;
  onContentUpdated: (updatedResult: GeminiAnalysisResponse) => void;
  onApprove: () => void;
  onReject: () => void;
}

export function VerificationUI({
  file,
  analysisResult,
  onContentUpdated,
  onApprove,
  onReject
}: VerificationUIProps) {
  const [editedResult, setEditedResult] = useState<GeminiAnalysisResponse>(analysisResult);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'sections'>('overview');
  const [pdfUrl, setPdfUrl] = useState<string>('');

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
  }, [editedResult, onContentUpdated]);

  const updateQuestion = (questionId: string, updatedQuestion: ExtractedQuestion) => {
    setEditedResult(prev => ({
      ...prev,
      extractedQuestions: prev.extractedQuestions.map(q =>
        q.id === questionId ? updatedQuestion : q
      )
    }));
  };

  const updateSection = (sectionId: string, updatedSection: DocumentSection) => {
    setEditedResult(prev => ({
      ...prev,
      documentStructure: {
        ...prev.documentStructure,
        sections: prev.documentStructure.sections.map(s =>
          s.id === sectionId ? updatedSection : s
        )
      }
    }));
  };

  const updateDocumentInfo = (field: string, value: string) => {
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
  };

  const addNewQuestion = () => {
    const newQuestion: ExtractedQuestion = {
      id: `q_${Date.now()}`,
      number: String(editedResult.extractedQuestions.length + 1),
      content: 'New question content...',
      type: 'short_answer'
    };

    setEditedResult(prev => ({
      ...prev,
      extractedQuestions: [...prev.extractedQuestions, newQuestion]
    }));
  };

  const removeQuestion = (questionId: string) => {
    setEditedResult(prev => ({
      ...prev,
      extractedQuestions: prev.extractedQuestions.filter(q => q.id !== questionId)
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Review & Edit Content</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI extracted content below. Review and edit before generating branded PDF.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">
              Confidence: {Math.round(analysisResult.processingInfo.confidence * 100)}%
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" title="AI Analysis Complete"></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'questions', label: 'Questions', count: editedResult.extractedQuestions.length },
            { id: 'sections', label: 'Sections', count: editedResult.documentStructure.sections.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area - Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-96">
        {/* Left Panel - PDF Preview */}
        <div className="border-r border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Original Document</h3>
            <span className="text-xs text-gray-500">{file.name}</span>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg h-80 overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm">Loading PDF preview...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Editable Content */}
        <div className="p-4 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={editedResult.extractedContent.title || ''}
                  onChange={(e) => updateDocumentInfo('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter document title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={editedResult.documentStructure.subject || ''}
                  onChange={(e) => updateDocumentInfo('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter subject or topic..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Instructions
                </label>
                <textarea
                  value={editedResult.extractedContent.instructions?.join('\n') || ''}
                  onChange={(e) => {
                    const instructions = e.target.value.split('\n').filter(line => line.trim());
                    setEditedResult(prev => ({
                      ...prev,
                      extractedContent: {
                        ...prev.extractedContent,
                        instructions
                      }
                    }));
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter instructions (one per line)..."
                />
              </div>

              {/* Analysis Summary */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Analysis Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Questions:</span>
                    <span className="ml-2 font-medium">{editedResult.extractedQuestions.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Sections:</span>
                    <span className="ml-2 font-medium">{editedResult.documentStructure.sections.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Pages:</span>
                    <span className="ml-2 font-medium">{editedResult.documentStructure.metadata.totalPages}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Model:</span>
                    <span className="ml-2 font-medium">{analysisResult.processingInfo.model}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Extracted Questions ({editedResult.extractedQuestions.length})
                </h3>
                <button
                  onClick={addNewQuestion}
                  className="btn-secondary text-xs"
                >
                  + Add Question
                </button>
              </div>

              {editedResult.extractedQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">❓</div>
                  <p className="text-sm">No questions detected</p>
                  <button
                    onClick={addNewQuestion}
                    className="btn-primary text-sm mt-2"
                  >
                    Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {editedResult.extractedQuestions.map((question, index) => (
                    <QuestionEditor
                      key={question.id}
                      question={question}
                      onUpdate={(updated) => updateQuestion(question.id, updated)}
                      onRemove={() => removeQuestion(question.id)}
                      canRemove={editedResult.extractedQuestions.length > 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                Document Sections ({editedResult.documentStructure.sections.length})
              </h3>

              {editedResult.documentStructure.sections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">📄</div>
                  <p className="text-sm">No sections detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editedResult.documentStructure.sections.map((section) => (
                    <SectionEditor
                      key={section.id}
                      section={section}
                      onUpdate={(updated) => updateSection(section.id, updated)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Review the extracted content and make any necessary corrections before proceeding.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={onApprove}
              className="btn-primary"
            >
              Generate Branded PDF →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: ExtractedQuestion;
  onUpdate: (question: ExtractedQuestion) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function QuestionEditor({ question, onUpdate, onRemove, canRemove }: QuestionEditorProps) {
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
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={question.number}
            onChange={(e) => updateField('number', e.target.value)}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={question.type}
            onChange={(e) => updateField('type', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="text-red-600 hover:text-red-700 text-sm"
            title="Remove question"
          >
            ✕
          </button>
        )}
      </div>

      <textarea
        value={question.content}
        onChange={(e) => updateField('content', e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Question content..."
      />

      {question.type === 'multiple_choice' && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Answer Options</label>
            <button
              onClick={addOption}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + Add Option
            </button>
          </div>
          <div className="space-y-2">
            {(question.options || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-6">
                  {String.fromCharCode(65 + index)}.
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
                {question.options && question.options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700 text-sm w-6"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Section Editor Component  
interface SectionEditorProps {
  section: DocumentSection;
  onUpdate: (section: DocumentSection) => void;
}

function SectionEditor({ section, onUpdate }: SectionEditorProps) {
  const updateField = (field: keyof DocumentSection, value: any) => {
    onUpdate({ ...section, [field]: value });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={section.type}
          onChange={(e) => updateField('type', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="header">Header</option>
          <option value="question">Question</option>
          <option value="answer">Answer</option>
          <option value="instruction">Instruction</option>
          <option value="content">Content</option>
        </select>
        <span className="text-xs text-gray-500">
          Page {section.position.page}, Order {section.position.order}
        </span>
      </div>

      <textarea
        value={section.content}
        onChange={(e) => updateField('content', e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Section content..."
      />
    </div>
  );
}