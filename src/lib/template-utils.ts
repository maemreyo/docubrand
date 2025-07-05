// FIXED: 2025-07-05 - Proper template creation utilities

import { BLANK_PDF, Template } from '@pdfme/common';
import { EducationalTemplate } from '@/types/pdfme-extensions';

/**
 * Create a blank educational template with proper basePdf
 */
export const createBlankEducationalTemplate = (): EducationalTemplate => {
  return {
    basePdf: BLANK_PDF, // Use BLANK_PDF constant for valid PDF data
    schemas: [[]],
  };
};

/**
 * Create a blank template with custom page setup
 */
export const createCustomBlankTemplate = (config?: {
  width?: number;
  height?: number;
  padding?: [number, number, number, number];
}): EducationalTemplate => {
  const {
    width = 210,  // A4 width in mm
    height = 297, // A4 height in mm  
    padding = [20, 10, 20, 10] // top, right, bottom, left
  } = config || {};

  return {
    basePdf: {
      width,
      height,
      padding,
    },
    schemas: [[]],
  };
};

/**
 * Validate template basePdf
 */
export const validateTemplateBasePdf = (template: Template): boolean => {
  if (!template.basePdf) {
    return false;
  }

  // Check if basePdf is BLANK_PDF constant
  if (template.basePdf === BLANK_PDF) {
    return true;
  }

  // Check if basePdf is a valid custom page setup
  if (typeof template.basePdf === 'object' && 
      'width' in template.basePdf && 
      'height' in template.basePdf) {
    return true;
  }

  // Check if basePdf is valid PDF data (string or Uint8Array)
  if (typeof template.basePdf === 'string' && template.basePdf.length > 0) {
    return true;
  }

  if (template.basePdf instanceof Uint8Array && template.basePdf.length > 0) {
    return true;
  }

  return false;
};

/**
 * Fix template basePdf if invalid
 */
export const fixTemplateBasePdf = (template: Template): Template => {
  if (validateTemplateBasePdf(template)) {
    return template;
  }

  console.warn('Invalid basePdf detected, fixing with BLANK_PDF');
  
  return {
    ...template,
    basePdf: BLANK_PDF,
  };
};

/**
 * Safe template creation that always has valid basePdf
 */
export const createSafeTemplate = (
  partialTemplate?: Partial<EducationalTemplate>
): EducationalTemplate => {
  const baseTemplate = createBlankEducationalTemplate();
  
  if (!partialTemplate) {
    return baseTemplate;
  }

  const mergedTemplate = {
    ...baseTemplate,
    ...partialTemplate,
  };

  // Ensure basePdf is valid
  return fixTemplateBasePdf(mergedTemplate) as EducationalTemplate;
};