// CREATED: 2025-07-04 - SectionsTab component for VerificationUI

"use client";

import React from "react";
import { EnhancedDocumentSection } from "@/types/editor";
import { SectionEditor } from "../editor/SectionEditor";
import { ScrollArea } from "../ui/scroll-area";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
} from "lucide-react";

interface SectionsTabProps {
  enhancedSections: EnhancedDocumentSection[];
  onSectionUpdate: (sectionId: string, updatedSection: EnhancedDocumentSection) => void;
  activeSection: string | null;
  setActiveSection: (sectionId: string | null) => void;
  collapsedSections: Set<string>;
  toggleSectionCollapse: (sectionId: string) => void;
  validSections: number;
  totalSections: number;
}

export function SectionsTab({
  enhancedSections,
  onSectionUpdate,
  activeSection,
  setActiveSection,
  collapsedSections,
  toggleSectionCollapse,
  validSections,
  totalSections,
}: SectionsTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Sections Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <FileTextIcon className="w-4 h-4" />
            Document Sections
          </h4>
          <div className="text-sm text-gray-500">
            {totalSections} sections
          </div>
        </div>
      </div>

      {/* Sections List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {enhancedSections.map((section, index) => (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <Collapsible.Root
                open={!collapsedSections.has(section.id)}
                onOpenChange={() => toggleSectionCollapse(section.id)}
              >
                <Collapsible.Trigger asChild>
                  <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between border-b border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-blue-600">
                        Section {index + 1}
                      </span>
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {section.title || "Untitled Section"}
                      </span>
                      {section.isDirty && (
                        <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {section.content?.length || 0} chars
                      </span>
                      {collapsedSections.has(section.id) ? (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                </Collapsible.Trigger>
                <Collapsible.Content
                  className={
                    !collapsedSections.has(section.id) ? "block" : "hidden"
                  }
                >
                  <div className="p-4 border-t border-gray-200">
                    <SectionEditor
                      section={section}
                      onUpdate={(updatedSection) =>
                        onSectionUpdate(section.id, updatedSection)
                      }
                      isActive={activeSection === section.id}
                      onActivate={() => setActiveSection(section.id)}
                      showAdvanced={false}
                    />
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          ))}

          {enhancedSections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No sections found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sections Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {validSections} of {totalSections} sections are valid
          </span>
          <span className="text-xs">
            {validSections === totalSections ? "✓ All valid" : "⚠ Needs review"}
          </span>
        </div>
      </div>
    </div>
  );
}