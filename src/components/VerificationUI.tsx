// UPDATED: 2025-07-04 - Enhanced layout with improved Radix UI Tabs for better UX

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GeminiAnalysisResponse,
  ExtractedQuestion,
  DocumentSection,
} from "@/types/gemini";
import { EnhancedDocumentSection, ContentType } from "@/types/editor";
import { DirectPDFViewer } from "./DirectPDFViewer";
import { contentFormatter } from "./editor/ContentFormatter";
import { SectionsTab, QuestionsTab, OverviewTab } from "./verification";
import * as Tabs from "@radix-ui/react-tabs";
import {
  FileTextIcon,
  HelpCircleIcon,
  EyeIcon,
  FilePlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { TemplateDesignerDialog } from "./TemplateDesignerDialog";



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
  isProcessing = false,
}: VerificationUIProps) {
  const [editedResult, setEditedResult] =
    useState<GeminiAnalysisResponse>(analysisResult);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [showTemplateSystem, setShowTemplateSystem] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "sections" | "questions" | "overview"
  >("sections");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // Enhanced sections with editor-specific properties
  const [enhancedSections, setEnhancedSections] = useState<
    EnhancedDocumentSection[]
  >(() => convertToEnhancedSections(analysisResult.documentStructure.sections));

  // Create PDF preview URL
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Validate content and update errors
  const validateContent = useCallback(() => {
    const errors: string[] = [];

    // Validate sections
    enhancedSections.forEach((section, index) => {
      if (!section.title?.trim()) {
        errors.push(`Section ${index + 1}: Title is required`);
      }
      if (!section.content?.trim()) {
        errors.push(`Section ${index + 1}: Content is required`);
      }
    });

    // Validate questions
    editedResult.extractedQuestions.forEach((question, index) => {
      if (!question.content?.trim()) {
        errors.push(`Question ${index + 1}: Question text is required`);
      }
      if (
        question.type === "multiple_choice" &&
        (!question.options || question.options.length < 2)
      ) {
        errors.push(
          `Question ${
            index + 1
          }: At least 2 options required for multiple choice`
        );
      }
    });

    setValidationErrors(errors);
  }, [enhancedSections, editedResult.extractedQuestions]);

  // Run validation on content changes
  useEffect(() => {
    validateContent();
  }, [validateContent]);

  // Convert sections to enhanced format
  function convertToEnhancedSections(
    sections: DocumentSection[]
  ): EnhancedDocumentSection[] {
    return sections.map((section, index) => ({
      id: `section-${index}`,
      title: section.title,
      content: section.content,
      type: "text" as ContentType,
      order: index,
      metadata: {
        originalIndex: index,
        wordCount: section.content.split(/\s+/).length,
        lastModified: new Date().toISOString(),
      },
      isCollapsed: false,
      isDirty: false,
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    }));
  }

  // Handle section updates
  const handleSectionUpdate = useCallback(
    (sectionId: string, updatedSection: EnhancedDocumentSection) => {
      setEnhancedSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? {
                ...updatedSection,
                isDirty: true,
                metadata: {
                  ...updatedSection.metadata,
                  lastModified: new Date().toISOString(),
                },
              }
            : section
        )
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  // Handle question updates
  const handleQuestionUpdate = useCallback(
    (questionIndex: number, updatedQuestion: ExtractedQuestion) => {
      setEditedResult((prev) => ({
        ...prev,
        extractedQuestions: prev.extractedQuestions.map((q, i) =>
          i === questionIndex ? updatedQuestion : q
        ),
      }));
      setHasUnsavedChanges(true);
    },
    []
  );

  // Handle content approval
  const handleApprove = useCallback(() => {
    if (validationErrors.length > 0) {
      alert("Please fix validation errors before proceeding");
      return;
    }

    // Update the analysis result with enhanced sections
    const updatedResult = {
      ...editedResult,
      documentStructure: {
        ...editedResult.documentStructure,
        sections: enhancedSections.map((section) => ({
          title: section.title,
          content: section.content,
          type: section.type,
        })),
      },
    };

    onContentUpdated(updatedResult);
    setHasUnsavedChanges(false);
    onApprove();
  }, [
    editedResult,
    enhancedSections,
    validationErrors,
    onContentUpdated,
    onApprove,
  ]);

  // Handle rejection
  const handleReject = useCallback(() => {
    if (hasUnsavedChanges) {
      if (
        !confirm(
          "Are you sure you want to start over? You have unsaved changes."
        )
      ) {
        return;
      }
    }
    setHasUnsavedChanges(false);
    onReject();
  }, [hasUnsavedChanges, onReject]);

  // Toggle section collapse
  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Count statistics
  const totalSections = enhancedSections.length;
  const totalQuestions = editedResult.extractedQuestions.length;
  const totalWords = enhancedSections.reduce(
    (sum, section) => sum + (section.content?.split(/\s+/).length || 0),
    0
  );
  const validSections = enhancedSections.filter(
    (section) => section.title?.trim() && section.content?.trim()
  ).length;
  const validQuestions = editedResult.extractedQuestions.filter((question) =>
    question.content?.trim()
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Review & Edit Content
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              AI extracted content below. Review and edit before generating
              branded PDF.
            </p>
          </div>

          {/* Enhanced Stats Summary */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalSections}
              </div>
              <div className="text-xs text-gray-500">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalQuestions}
              </div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {totalWords}
              </div>
              <div className="text-xs text-gray-500">Words</div>
            </div>
            {validationErrors.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationErrors.length}
                </div>
                <div className="text-xs text-gray-500">Issues</div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Validation Status */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircleIcon className="w-5 h-5 text-red-600" />
              <h4 className="text-sm font-medium text-red-800">
                Please fix these issues:
              </h4>
            </div>
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
      </div>

      {/* Main Content - Enhanced Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* PDF Viewer Panel */}
        <div className="border-r border-gray-200">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <EyeIcon className="w-4 h-4" />
                Original Document
              </h3>
              <span className="text-sm text-gray-500">
                {file.name} • {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          </div>
          <div className="h-[600px]">
            <DirectPDFViewer file={file} dataUrl={pdfUrl} />
          </div>
        </div>

        {/* Enhanced Content Editor Panel */}
        <div className="flex flex-col h-[600px]">
          {/* Tab Navigation */}
          <Tabs.Root
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="flex flex-col flex-grow h-full"
          >
            <Tabs.List className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
              <Tabs.Trigger
                value="sections"
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <FileTextIcon className="w-4 h-4" />
                  <span>Sections</span>
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 text-xs rounded-full">
                    {validSections}/{totalSections}
                  </span>
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="questions"
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <HelpCircleIcon className="w-4 h-4" />
                  <span>Questions</span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded-full">
                    {validQuestions}/{totalQuestions}
                  </span>
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="overview"
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <InfoIcon className="w-4 h-4" />
                  <span>Overview</span>
                  {validationErrors.length === 0 && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </Tabs.Trigger>
            </Tabs.List>

            {/* Tab Content */}

            {/* Sections Tab */}
            <Tabs.Content
              value="sections"
              className="flex flex-col h-full"
            >
              <SectionsTab
                enhancedSections={enhancedSections}
                onSectionUpdate={handleSectionUpdate}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                collapsedSections={collapsedSections}
                toggleSectionCollapse={toggleSectionCollapse}
                validSections={validSections}
                totalSections={totalSections}
              />
            </Tabs.Content>

            {/* Questions Tab */}
            <Tabs.Content value="questions" className="flex flex-col h-full">
              <QuestionsTab
                extractedQuestions={editedResult.extractedQuestions}
                onQuestionUpdate={handleQuestionUpdate}
                validQuestions={validQuestions}
                totalQuestions={totalQuestions}
              />
            </Tabs.Content>

            {/* Overview Tab */}
            <Tabs.Content value="overview" className="flex flex-col h-full">
              <OverviewTab
                editedResult={editedResult}
                totalSections={totalSections}
                totalQuestions={totalQuestions}
                totalWords={totalWords}
                validSections={validSections}
                validQuestions={validQuestions}
                validationErrors={validationErrors}
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      {/* Enhanced Action Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            <Button
              onClick={() => setShowTemplateSystem(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FilePlusIcon className="w-4 h-4" />
              Use Template System
            </Button>
            
            <TemplateDesignerDialog
              isOpen={showTemplateSystem}
              onOpenChange={setShowTemplateSystem}
              geminiAnalysis={analysisResult}
              onSave={(template) => {
                // Handle template save
                console.log('Template saved:', template);
              }}
              onPreview={(template) => {
                // Handle template preview
                console.log('Template preview:', template);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Over
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing || validationErrors.length > 0}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Generate Branded PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
