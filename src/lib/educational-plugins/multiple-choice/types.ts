import { Schema } from '@pdfme/common';

/**
 * Alignment options for text content
 */
export const ALIGNMENT = {
  LEFT: 'left',
  CENTER: 'center', 
  RIGHT: 'right',
} as const;

export type Alignment = typeof ALIGNMENT[keyof typeof ALIGNMENT];

/**
 * Vertical alignment options
 */
export const VERTICAL_ALIGNMENT = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
} as const;

export type VerticalAlignment = typeof VERTICAL_ALIGNMENT[keyof typeof VERTICAL_ALIGNMENT];

/**
 * Dynamic font size fitting modes
 */
export const DYNAMIC_FONT_SIZE_FIT = {
  NONE: 'none',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  BOTH: 'both',
} as const;

export type DynamicFontSizeFit = typeof DYNAMIC_FONT_SIZE_FIT[keyof typeof DYNAMIC_FONT_SIZE_FIT];

/**
 * Font width calculation values interface
 */
export interface FontWidthCalcValues {
  font: any; // fontkit font object
  fontSize: number;
  characterSpacing: number;
  dynamicFontSize?: DynamicFontSizeFit;
}

/**
 * Multiple Choice Schema interface extending base Schema
 */
export interface MultipleChoiceSchema extends Schema {
  // Base Schema properties (inherited but specified for clarity)
  name: string; // Field identifier
  type: 'multipleChoice';
  position: { x: number; y: number }; // Position in PDF
  width: number; // Field width
  height: number; // Field height
  
  // Content properties
  content: string; // The question text
  options: string[]; // Array of answer options
  correctAnswer?: string; // Correct answer (A, B, C, D)
  points?: number; // Point value for this question
  
  // Font and text properties
  fontName?: string;
  fontSize?: number;
  fontColor?: string;
  lineHeight?: number;
  characterSpacing?: number;
  
  // Alignment properties
  alignment?: Alignment;
  verticalAlignment?: VerticalAlignment;
  
  // Dynamic sizing
  dynamicFontSize?: DynamicFontSizeFit;
  
  // Visual properties
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  
  // Layout properties
  padding?: number;
  optionSpacing?: number; // Space between options
  questionSpacing?: number; // Space between question and options
  
  // Behavior properties
  readOnly?: boolean;
  required?: boolean;
}

/**
 * Props for Multiple Choice UI components
 */
export interface MultipleChoiceUIProps {
  schema: MultipleChoiceSchema;
  value: string;
  onChange?: (data: { key: string; value: any }) => void;
  mode: 'viewer' | 'form' | 'designer';
  placeholder?: string;
  tabIndex?: number;
  stopEditing?: () => void;
}

/**
 * Props for PDF rendering
 */
export interface MultipleChoicePDFProps {
  schema: MultipleChoiceSchema;
  value: string;
  pdfDoc: any; // PDFDocument from pdf-lib
  page: any; // PDFPage from pdf-lib
  options?: {
    font?: any;
    lang?: string;
  };
}

/**
 * Option label generator type
 */
export type OptionLabelGenerator = (index: number) => string;