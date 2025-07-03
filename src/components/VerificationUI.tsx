'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeminiAnalysisResponse, ExtractedQuestion, DocumentSection } from '@/types/gemini';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'sections'>('overview');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    
    if (editedResult.extractedQuestions.length === 0 && editedResult.documentStructure.sections.length === 0) {
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

    setValidationErrors(errors);
  }, [editedResult]);

  const updateQuestion = useCallback((questionId: string, updatedQuestion: ExtractedQuestion) => {
    setEditedResult(prev => ({
      ...prev,
      extractedQuestions: prev.extractedQuestions.map(q =>
        q.id === questionId ? updatedQuestion : q
      )
    }));
  }, []);

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
            {hasUnsavedChanges && (
              <p className="text-xs text-amber-600 mt-1">● Unsaved changes</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AIConfidenceBadge confidence={analysisResult.processingInfo.confidence} />
            {validationErrors.length > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                {validationErrors.length} error{validationErrors.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-900 mb-2">Please fix these issues:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content - Split Screen with improved height and scrolling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[700px]">
        {/* Left Panel - PDF Preview with better scrolling */}
        <div className="border-r border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-900">Original Document</h3>
            <p className="text-xs text-gray-600 mt-1">{file.name}</p>
          </div>
          <div className="flex-1 overflow-auto" style={{ height: "calc(100% - 70px)" }}>
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full h-full"
                title="PDF Preview"
                style={{ border: 'none' }}
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

        {/* Right Panel - Editable Content with improved scrolling */}
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', count: null },
                { id: 'questions', label: 'Questions', count: editedResult.extractedQuestions.length },
                { id: 'sections', label: 'Sections', count: editedResult.documentStructure.sections.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content with improved scrolling */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ height: "calc(100% - 53px)" }}>
            {activeTab === 'overview' && (
              <OverviewTab
                editedResult={editedResult}
                analysisResult={analysisResult}
                onUpdateDocumentInfo={updateDocumentInfo}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionsTab
                questions={editedResult.extractedQuestions}
                onUpdateQuestion={updateQuestion}
                onAddQuestion={addNewQuestion}
                onRemoveQuestion={removeQuestion}
              />
            )}

            {activeTab === 'sections' && (
              <SectionsTab
                sections={editedResult.documentStructure.sections}
                onUpdateSection={updateSection}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Review the extracted content and make any necessary corrections before proceeding.
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

// ENHANCED SectionEditor Component with proper content handling
function SectionEditor({ 
  section, 
  onUpdate 
}: {
  section: DocumentSection;
  onUpdate: (section: DocumentSection) => void;
}) {
  const [displayContent, setDisplayContent] = useState(section.content);
  const [isJSONContent, setIsJSONContent] = useState(false);
  const [contentType, setContentType] = useState<'clean' | 'json' | 'markdown'>('clean');

  useEffect(() => {
    // NEW: Detect and parse different content types
    const processed = processContentForDisplay(section.content);
    setDisplayContent(processed.content);
    setIsJSONContent(processed.isJSON);
    setContentType(processed.type);
  }, [section.content]);

  const handleContentChange = (value: string) => {
    setDisplayContent(value);
    onUpdate({ ...section, content: value });
  };

  // NEW: Calculate dynamic height based on content
  const calculateRows = (content: string) => {
    const lines = content.split('\n').length;
    const minRows = 3;
    const maxRows = 20;
    const calculatedRows = Math.max(minRows, Math.min(lines + 2, maxRows));
    return calculatedRows;
  };

  const updateField = (field: keyof DocumentSection, value: any) => {
    onUpdate({ ...section, [field]: value });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
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
        {/* NEW: Content type indicators */}
        {isJSONContent && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Parsed from AI
          </span>
        )}
        {contentType === 'markdown' && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Markdown
          </span>
        )}
      </div>

      {/* Enhanced textarea with dynamic sizing and better UX */}
      <div className="space-y-2">
        <textarea
          value={displayContent}
          onChange={(e) => handleContentChange(e.target.value)}
          rows={calculateRows(displayContent)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[100px] font-mono leading-relaxed"
          placeholder="Section content..."
          style={{ 
            minHeight: '80px',
            lineHeight: '1.5'
          }}
        />
        
        {/* NEW: Content metadata and actions */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>{displayContent.length} characters</span>
            <span>{displayContent.split('\n').length} lines</span>
            {isJSONContent && (
              <button
                onClick={() => {
                  // Re-process content to try to extract more
                  const reprocessed = processContentForDisplay(section.content, true);
                  setDisplayContent(reprocessed.content);
                }}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Re-extract content
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {contentType !== 'clean' && (
              <span className="text-amber-600">• Modified from original</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: Enhanced content processing function
function processContentForDisplay(content: string, forceReprocess = false): {
  content: string;
  isJSON: boolean;
  type: 'clean' | 'json' | 'markdown';
} {
  if (!content || typeof content !== 'string') {
    return { content: '', isJSON: false, type: 'clean' };
  }

  // Check if content is JSON-wrapped
  if (content.includes('```json') || content.trim().startsWith('{')) {
    try {
      const extracted = extractActualContentFromJSON(content);
      return {
        content: extracted,
        isJSON: true,
        type: 'json'
      };
    } catch (error) {
      console.warn('Failed to extract JSON content:', error);
      // Return cleaned version if JSON parsing fails
      return {
        content: cleanRawContent(content),
        isJSON: true,
        type: 'json'
      };
    }
  }

  // Check if content has markdown
  if (content.includes('```') || content.includes('**') || content.includes('##')) {
    return {
      content: cleanMarkdownContent(content),
      isJSON: false,
      type: 'markdown'
    };
  }

  // Clean content
  return {
    content: cleanRawContent(content),
    isJSON: false,
    type: 'clean'
  };
}

// NEW: Extract actual content from JSON strings (enhanced)
function extractActualContentFromJSON(jsonContent: string): string {
  try {
    // Remove markdown code blocks
    let cleaned = jsonContent.replace(/```json\s*\n?/g, '').replace(/\n?\s*```/g, '');
    
    // If it's a JSON string, parse and extract content
    if (cleaned.trim().startsWith('{')) {
      const parsed = JSON.parse(cleaned);
      
      // Multiple extraction strategies
      const extractions = [];
      
      // Strategy 1: Extract from nested documentStructure
      if (parsed.documentStructure?.sections) {
        const sectionContent = parsed.documentStructure.sections
          .map((s: any) => s.content || s.title || '')
          .filter((c: string) => c.trim())
          .join('\n\n');
        if (sectionContent) extractions.push(sectionContent);
      }
      
      // Strategy 2: Extract from extractedContent
      if (parsed.extractedContent?.rawText) {
        extractions.push(parsed.extractedContent.rawText);
      }
      
      // Strategy 3: Extract from top-level sections
      if (parsed.sections) {
        const topLevelContent = parsed.sections
          .map((s: any) => s.content || '')
          .filter((c: string) => c.trim())
          .join('\n\n');
        if (topLevelContent) extractions.push(topLevelContent);
      }
      
      // Strategy 4: Extract any text values
      const allTextValues = extractAllTextValues(parsed);
      if (allTextValues) extractions.push(allTextValues);
      
      // Return the longest extraction
      if (extractions.length > 0) {
        return extractions.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
      }
    }
    
    return cleanRawContent(cleaned);
  } catch (error) {
    console.warn('JSON extraction failed:', error);
    return cleanRawContent(jsonContent);
  }
}

// NEW: Extract all text values from an object recursively
function extractAllTextValues(obj: any, maxDepth = 3, currentDepth = 0): string {
  if (currentDepth >= maxDepth) return '';
  
  const textValues: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > 10 && !key.includes('id') && !key.includes('type')) {
      textValues.push(value);
    } else if (typeof value === 'object' && value !== null) {
      const nestedText = extractAllTextValues(value, maxDepth, currentDepth + 1);
      if (nestedText) textValues.push(nestedText);
    }
  }
  
  return textValues.join('\n\n');
}

// NEW: Clean markdown content
function cleanMarkdownContent(content: string): string {
  return content
    .replace(/```[\w]*\n?/g, '')
    .replace(/\n?```/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();
}

// NEW: Clean raw content
function cleanRawContent(content: string): string {
  return content
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

// Overview Tab Component
function OverviewTab({
  editedResult,
  analysisResult,
  onUpdateDocumentInfo
}: {
  editedResult: GeminiAnalysisResponse;
  analysisResult: GeminiAnalysisResponse;
  onUpdateDocumentInfo: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Document Title
        </label>
        <input
          type="text"
          value={editedResult.extractedContent.title}
          onChange={(e) => onUpdateDocumentInfo('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          onChange={(e) => onUpdateDocumentInfo('subject', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onUpdateDocumentInfo('instructions', instructions.join('\n'));
          }}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter instructions (one per line)..."
        />
      </div>

      {/* Analysis Summary */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-3">AI Analysis Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Questions Detected:</span>
            <span className="ml-2 font-medium">{editedResult.extractedQuestions.length}</span>
          </div>
          <div>
            <span className="text-blue-700">Sections Found:</span>
            <span className="ml-2 font-medium">{editedResult.documentStructure.sections.length}</span>
          </div>
          <div>
            <span className="text-blue-700">Pages:</span>
            <span className="ml-2 font-medium">{editedResult.documentStructure.metadata.totalPages}</span>
          </div>
          <div>
            <span className="text-blue-700">AI Model:</span>
            <span className="ml-2 font-medium">{analysisResult.processingInfo.model}</span>
          </div>
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
        <h3 className="text-sm font-medium text-gray-900">
          Extracted Questions ({questions.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            {questions.length > 0 ? "Scroll to view all questions" : ""}
          </div>
          <button
            onClick={onAddQuestion}
            className="btn-secondary text-xs"
          >
            + Add Question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">❓</div>
          <p className="text-sm">No questions detected</p>
          <button
            onClick={onAddQuestion}
            className="btn-primary text-sm mt-3"
          >
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 pb-4">
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

// Sections Tab Component
function SectionsTab({
  sections,
  onUpdateSection
}: {
  sections: DocumentSection[];
  onUpdateSection: (sectionId: string, section: DocumentSection) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          Document Sections ({sections.length})
        </h3>
        <div className="text-xs text-gray-500">
          Scroll to view all sections
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">📄</div>
          <p className="text-sm">No sections detected</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 pb-4">
          {sections.map((section) => (
            <SectionEditor
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

// Question Editor Component
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
            className="text-red-600 hover:text-red-700 text-sm p-1"
            title="Remove question"
          >
            ✕
          </button>
        )}
      </div>

      <textarea
        value={question.content}
        onChange={(e) => updateField('content', e.target.value)}
        rows={Math.max(2, Math.min(question.content.split('\n').length + 1, 8))}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        placeholder="Enter question content..."
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

// AI Confidence Badge Component
function AIConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const color = percentage >= 90 
    ? 'bg-green-100 text-green-800' 
    : percentage >= 70 
    ? 'bg-yellow-100 text-yellow-800' 
    : 'bg-red-100 text-red-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      AI: {percentage}%
    </span>
  );
}