// Import individual plugins for re-export
import { multipleChoicePlugin } from "./multiple-choice";
import { trueFalsePlugin } from "./true-false";
import { shortAnswerPlugin } from "./short-answer";
import { instructionBoxPlugin } from "./instruction-box";
import { essayPlugin } from "./essay";

// Educational Plugin Types
export * from "./types";

// Individual Plugin Exports
export { multipleChoicePlugin } from "./multiple-choice";
export { trueFalsePlugin } from "./true-false";
export { shortAnswerPlugin } from "./short-answer";
export { instructionBoxPlugin } from "./instruction-box";
export { essayPlugin } from "./essay";

// Utility Functions
export {
  getEducationalPlugins,
  registerEducationalPlugins,
  getPluginByQuestionType,
  validateEducationalPlugin,
  getEducationalPluginCategories,
} from "./utils";

// Main Plugin Collection - Following the demo pattern
export const getPlugins = () => {
  return {
    "Multiple Choice": multipleChoicePlugin,
    "True/False": trueFalsePlugin,
    "Short Answer": shortAnswerPlugin,
    Essay: essayPlugin,
    "Instruction Box": instructionBoxPlugin,
  };
};
