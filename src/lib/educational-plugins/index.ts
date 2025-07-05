// Import individual plugins
import multipleChoice from './multiple-choice';
import { trueFalsePlugin } from "./true-false";
import { shortAnswerPlugin } from "./short-answer";
import { instructionBoxPlugin } from "./instruction-box";
import { essayPlugin } from "./essay";

// Export all educational plugins
export const educationalPlugins = {
  multipleChoice,
  trueFalse: trueFalsePlugin,
  shortAnswer: shortAnswerPlugin,
  instructionBox: instructionBoxPlugin,
  essay: essayPlugin,
};

// Export individual plugins
export { default as multipleChoice } from './multiple-choice';
export { trueFalsePlugin as trueFalse } from './true-false';
export { shortAnswerPlugin as shortAnswer } from './short-answer';
export { instructionBoxPlugin as instructionBox } from './instruction-box';
export { essayPlugin as essay } from './essay';

// Export types
export type { MultipleChoiceSchema, Choice } from './multiple-choice/types';
export type {
  TrueFalseSchema,
  ShortAnswerSchema,
  EssaySchema,
  InstructionBoxSchema
} from './types';

// Utility Functions
export {
  getEducationalPlugins,
  registerEducationalPlugins,
  getPluginByQuestionType,
  validateEducationalPlugin,
  getEducationalPluginCategories,
} from "./utils";

// Legacy function for backward compatibility
export const getPlugins = () => {
  return {
    "Multiple Choice": multipleChoice,
    "True/False": trueFalsePlugin,
    "Short Answer": shortAnswerPlugin,
    Essay: essayPlugin,
    "Instruction Box": instructionBoxPlugin,
  };
};