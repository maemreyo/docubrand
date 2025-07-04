// CREATED: 2025-07-03 - QuestionEditor component for editing extracted questions

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ExtractedQuestion } from '@/types/gemini';
import { TrashIcon, PlusIcon, MinusIcon } from 'lucide-react';

interface QuestionEditorProps {
  question: ExtractedQuestion;
  onUpdate: (question: ExtractedQuestion) => void;
  onRemove: () => void;
  canRemove?: boolean;
  readonly?: boolean;
  showAdvanced?: boolean;
}

export function QuestionEditor({
  question,
  onUpdate,
  onRemove,
  canRemove = true,
  readonly = false,
  showAdvanced = false
}: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState<ExtractedQuestion>(question);
  const [isDirty, setIsDirty] = useState(false);

  // Update local state when question prop changes
  useEffect(() => {
    setLocalQuestion(question);
    setIsDirty(false);
  }, [question]);

  // Auto-save when local question changes
  useEffect(() => {
    if (isDirty) {
      const timeout = setTimeout(() => {
        onUpdate(localQuestion);
        setIsDirty(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [localQuestion, isDirty, onUpdate]);

  const handleContentChange = useCallback((content: string) => {
    setLocalQuestion(prev => ({ ...prev, content }));
    setIsDirty(true);
  }, []);

  const handleTypeChange = useCallback((type: ExtractedQuestion['type']) => {
    setLocalQuestion(prev => ({ 
      ...prev, 
      type,
      // Clear options if changing from multiple choice
      options: type === 'multiple_choice' ? (prev.options || ['', '']) : undefined
    }));
    setIsDirty(true);
  }, []);

  const handleOptionChange = useCallback((index: number, value: string) => {
    setLocalQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt)
    }));
    setIsDirty(true);
  }, []);

  const addOption = useCallback(() => {
    setLocalQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
    setIsDirty(true);
  }, []);

  const removeOption = useCallback((index: number) => {
    setLocalQuestion(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  }, []);

  if (readonly) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-900">{question.content}</div>
        {question.type === 'multiple_choice' && question.options && (
          <ul className="text-sm text-gray-600 space-y-1">
            {question.options.map((option, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-4 h-4 border border-gray-300 rounded text-xs flex items-center justify-center">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Question Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Type
        </label>
        <select
          value={localQuestion.type}
          onChange={(e) => handleTypeChange(e.target.value as ExtractedQuestion['type'])}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
          <option value="essay">Essay</option>
          <option value="true_false">True/False</option>
        </select>
      </div>

      {/* Question Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question
        </label>
        <textarea
          value={localQuestion.content}
          onChange={(e) => handleContentChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter your question here..."
        />
      </div>

      {/* Options for Multiple Choice */}
      {localQuestion.type === 'multiple_choice' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Answer Options
            </label>
            <button
              onClick={addOption}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusIcon className="w-3 h-3" />
              Add Option
            </button>
          </div>
          <div className="space-y-2">
            {localQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 h-6 border border-gray-300 rounded text-xs flex items-center justify-center bg-gray-50">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
                {localQuestion.options && localQuestion.options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {isDirty && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Unsaved changes
            </span>
          )}
        </div>
        
        {canRemove && (
          <button
            onClick={onRemove}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800"
          >
            <TrashIcon className="w-3 h-3" />
            Remove Question
          </button>
        )}
      </div>
    </div>
  );
}