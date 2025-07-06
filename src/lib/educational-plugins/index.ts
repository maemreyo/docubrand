// Import individual plugins
import multipleChoice from './multiple-choice';
import { trueFalsePlugin } from "./true-false";
import { shortAnswerPlugin } from "./short-answer";
import { instructionBoxPlugin } from "./instruction-box";
import { essayPlugin } from "./essay";

// Import custom plugins
import { customPlugins } from "../plugins/custom";

// Export all educational plugins
export const educationalPlugins = {
  // Legacy plugins
  multipleChoice,
  trueFalse: trueFalsePlugin,
  shortAnswer: shortAnswerPlugin,
  instructionBox: instructionBoxPlugin,
  essay: essayPlugin,
  
  // New custom plugins
  multipleChoiceQuestion: customPlugins.multipleChoiceQuestion,
  linedAnswerBox: customPlugins.linedAnswerBox,
  fillInTheBlank: customPlugins.fillInTheBlank,
};

// Export individual plugins
export { default as multipleChoice } from './multiple-choice';
export { trueFalsePlugin as trueFalse } from './true-false';
export { shortAnswerPlugin as shortAnswer } from './short-answer';
export { instructionBoxPlugin as instructionBox } from './instruction-box';
export { essayPlugin as essay } from './essay';

// Export new custom plugins
export const multipleChoiceQuestion = customPlugins.multipleChoiceQuestion;
export const linedAnswerBox = customPlugins.linedAnswerBox;
export const fillInTheBlank = customPlugins.fillInTheBlank;

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
    // Legacy plugins
    "Multiple Choice": multipleChoice,
    "True/False": trueFalsePlugin,
    "Short Answer": shortAnswerPlugin,
    Essay: essayPlugin,
    "Instruction Box": instructionBoxPlugin,
    
    // New custom plugins
    "Multiple Choice Question": customPlugins.multipleChoiceQuestion,
    "Lined Answer Box": customPlugins.linedAnswerBox,
    "Fill in the Blank": customPlugins.fillInTheBlank,
  };
};