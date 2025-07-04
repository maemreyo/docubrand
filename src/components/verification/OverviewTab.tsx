// CREATED: 2025-07-04 - OverviewTab component for VerificationUI

"use client";

import React from "react";
import { GeminiAnalysisResponse } from "@/types/gemini";
import { ScrollArea } from "../ui/scroll-area";
import {
  InfoIcon,
  FileTextIcon,
  HelpCircleIcon,
  TypeIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";

interface OverviewTabProps {
  editedResult: GeminiAnalysisResponse;
  totalSections: number;
  totalQuestions: number;
  totalWords: number;
  validSections: number;
  validQuestions: number;
  validationErrors: string[];
}

export function OverviewTab({
  editedResult,
  totalSections,
  totalQuestions,
  totalWords,
  validSections,
  validQuestions,
  validationErrors,
}: OverviewTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Overview Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <InfoIcon className="w-4 h-4" />
            Document Overview
          </h4>
          <div className="flex items-center gap-2">
            <div
              className={`text-2xl font-bold ${
                validationErrors.length === 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {validationErrors.length === 0 ? "✓" : "✗"}
            </div>
            <div className="text-sm text-gray-600">Valid</div>
          </div>
        </div>
      </div>

      {/* Overview Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-900 mb-3">
                Issues Found
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success State */}
          {validationErrors.length === 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-medium text-green-900">
                  All Content Valid
                </h4>
              </div>
              <p className="text-sm text-green-700">
                Your document is ready for branded PDF generation!
              </p>
            </div>
          )}

          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                Document Title
              </h5>
              <p className="text-sm text-blue-700">
                {editedResult.extractedContent.title ||
                  "Untitled Document"}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-green-900 mb-2">
                Document Type
              </h5>
              <p className="text-sm text-green-700">
                {editedResult.documentStructure.type || "Unknown"}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">
              Content Statistics
            </h5>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {validSections}/{totalSections}
                </div>
                <div className="text-xs text-gray-500">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validQuestions}/{totalQuestions}
                </div>
                <div className="text-xs text-gray-500">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totalWords}
                </div>
                <div className="text-xs text-gray-500">Words</div>
              </div>
            </div>
          </div>

          {/* Content Analysis */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-yellow-900 mb-3">
              Content Analysis
            </h5>
            <div className="space-y-2 text-sm text-yellow-700">
              <div className="flex items-center gap-2">
                <FileTextIcon className="w-4 h-4" />
                <span>Subject: {editedResult.documentStructure.subject || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <TypeIcon className="w-4 h-4" />
                <span>Difficulty: {editedResult.documentStructure.difficulty || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircleIcon className="w-4 h-4" />
                <span>
                  Estimated Time: {editedResult.documentStructure.estimatedTime || "Not specified"} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {editedResult.extractedContent.author && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-indigo-900 mb-2">
                Author Information
              </h5>
              <p className="text-sm text-indigo-700">
                {editedResult.extractedContent.author}
              </p>
            </div>
          )}

          {editedResult.extractedContent.instructions && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-orange-900 mb-2">
                Instructions
              </h5>
              <p className="text-sm text-orange-700">
                {editedResult.extractedContent.instructions}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}