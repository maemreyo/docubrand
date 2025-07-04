// CREATED: 2025-07-04 - Template Designer Dialog Component

"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { TemplateDesigner } from "./TemplateDesigner";
import { GeminiAnalysisResponse } from "@/types/gemini";
import { EducationalTemplate } from "@/types/pdfme-extensions";

interface TemplateDesignerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplate?: EducationalTemplate;
  onSave?: (template: EducationalTemplate) => void;
  onPreview?: (template: EducationalTemplate) => void;
}

export function TemplateDesignerDialog({
  isOpen,
  onOpenChange,
  geminiAnalysis,
  onSave,
  onPreview,
}: TemplateDesignerDialogProps) {
  const handleSave = (template: EducationalTemplate) => {
    if (onSave) {
      onSave(template);
    }
    onOpenChange(false);
  };

  const handlePreview = (template: EducationalTemplate) => {
    if (onPreview) {
      onPreview(template);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-0 left-0 right-0 bottom-0 bg-white z-50 flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Template Designer
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Design and edit your educational templates.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          
          {/* Modal Content */}
          <div className="flex-1 overflow-hidden">
            <TemplateDesigner
              // initialTemplate={initialTemplate}
              onSave={handleSave}
              onPreview={handlePreview}
              className="h-full"
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}