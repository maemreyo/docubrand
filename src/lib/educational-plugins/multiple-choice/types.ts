import { Schema } from '@pdfme/common';

/**
 * Choice interface for multiple choice options
 */
export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Multiple Choice Schema interface
 */
export interface MultipleChoiceSchema extends Schema {
  // Content properties
  question: string;
  choices: Choice[];
  points: number;
  instructionText?: string;
  
  // Behavior properties
  showCorrectAnswers?: boolean;
  randomizeChoices?: boolean;
  minCorrectAnswers?: number;
  maxCorrectAnswers?: number;
  readOnly?: boolean;
  required?: boolean;
  
  // Styling properties
  fontName?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  lineHeight?: number;
  characterSpacing?: number;
  
  // Layout properties
  padding?: number;
  optionSpacing?: number;
  questionSpacing?: number;
}

/**
 * Multiple Choice Value interface
 */
export interface MultipleChoiceValue {
  question: string;
  choices: Choice[];
  selectedChoices?: string[]; // IDs of selected choices
}