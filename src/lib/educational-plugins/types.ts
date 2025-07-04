import { Schema } from "@pdfme/common";

/**
 * Educational Plugin Schema Interfaces
 * Shared type definitions for all educational plugins
 */

export interface MultipleChoiceSchema extends Schema {
  type: "multipleChoice";
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

export interface TrueFalseSchema extends Schema {
  type: "trueFalse";
  correctAnswer?: boolean;
  points?: number;
}

export interface ShortAnswerSchema extends Schema {
  type: "shortAnswer";
  expectedAnswer?: string;
  maxLength?: number;
  points?: number;
}

export interface EssaySchema extends Schema {
  type: "essay";
  wordLimit?: number;
  points?: number;
}

export interface InstructionBoxSchema extends Schema {
  type: "instructionBox";
  boxStyle?: "simple" | "double" | "rounded" | "bold";
  backgroundColor?: string;
}