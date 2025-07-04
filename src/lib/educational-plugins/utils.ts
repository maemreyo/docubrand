import { multipleChoicePlugin } from "./multiple-choice";
import { trueFalsePlugin } from "./true-false";
import { shortAnswerPlugin } from "./short-answer";
import { essayPlugin } from "./essay";
import { instructionBoxPlugin } from "./instruction-box";

/**
 * Get all educational plugins - FIXED
 */
export const getEducationalPlugins = () => {
  return {
    multipleChoice: multipleChoicePlugin,
    trueFalse: trueFalsePlugin,
    shortAnswer: shortAnswerPlugin,
    essay: essayPlugin,
    instructionBox: instructionBoxPlugin,
  };
};

/**
 * Register educational plugins with existing pdfme plugins
 */
export const registerEducationalPlugins = (
  existingPlugins: Record<string, any>
) => {
  const educationalPlugins = getEducationalPlugins();

  return {
    ...existingPlugins,
    ...educationalPlugins,
  };
};

/**
 * Get plugin by question type
 */
export const getPluginByQuestionType = (questionType: string) => {
  const plugins = getEducationalPlugins();

  switch (questionType) {
    case "multiple_choice":
      return plugins.multipleChoice;
    case "true_false":
      return plugins.trueFalse;
    case "short_answer":
      return plugins.shortAnswer;
    case "essay":
      return plugins.essay;
    default:
      return null;
  }
};

/**
 * Validate educational plugin structure
 */
export const validateEducationalPlugin = (plugin: any): boolean => {
  return !!(
    plugin.pdf &&
    plugin.ui &&
    plugin.propPanel &&
    typeof plugin.pdf === "function" &&
    typeof plugin.ui === "function" &&
    typeof plugin.propPanel === "object"
  );
};

/**
 * Get educational plugin categories
 */
export const getEducationalPluginCategories = () => {
  return {
    questions: ["multipleChoice", "trueFalse", "shortAnswer", "essay"],
    layout: ["instructionBox"],
  };
};
