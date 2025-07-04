// CREATED: 2025-07-04 - QuestionsTab component for VerificationUI

"use client";

import React from "react";
import { ExtractedQuestion } from "@/types/gemini";
import { QuestionEditor } from "../editor/QuestionEditor";
import { ScrollArea } from "../ui/scroll-area";
import {
  HelpCircleIcon,
} from "lucide-react";

interface QuestionsTabProps {
  extractedQuestions: ExtractedQuestion[];
  onQuestionUpdate: (questionIndex: number, updatedQuestion: ExtractedQuestion) => void;
  validQuestions: number;
  totalQuestions: number;
}

export function QuestionsTab({
  extractedQuestions,
  onQuestionUpdate,
  validQuestions,
  totalQuestions,
}: QuestionsTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Questions Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <HelpCircleIcon className="w-4 h-4" />
            Extracted Questions
          </h4>
          <div className="text-sm text-gray-500">
            {totalQuestions} questions
          </div>
        </div>
      </div>

      {/* Questions List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {extractedQuestions.map((question, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900">
                  Question {index + 1}
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                  {question.type?.replace("_", " ") || "Unknown"}
                </span>
              </div>
              <QuestionEditor
                question={question}
                onUpdate={(updatedQuestion) =>
                  onQuestionUpdate(index, updatedQuestion)
                }
                showAdvanced={false}
              />
            </div>
          ))}

          {extractedQuestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <HelpCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No questions found</p>
              <p className="text-sm mt-2">
                Try uploading a document with questions or exercises
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Questions Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {validQuestions} of {totalQuestions} questions are valid
          </span>
          <span className="text-xs">
            {validQuestions === totalQuestions ? "✓ All valid" : "⚠ Needs review"}
          </span>
        </div>
      </div>
    </div>
  );
}