import multipleChoice from './multiple-choice';
import { trueFalsePlugin } from "./true-false";
import { shortAnswerPlugin } from "./short-answer";
import { essayPlugin } from "./essay";
import { instructionBoxPlugin } from "./instruction-box";
import { LucideIcon } from "lucide-react";

// Import custom plugins from plugins directory
import { customPlugins } from "../plugins/custom";

/**
 * Get all educational plugins - FIXED
 */
export const getEducationalPlugins = () => {
  return {
    // Legacy educational plugins
    multipleChoice,
    trueFalse: trueFalsePlugin,
    shortAnswer: shortAnswerPlugin,
    essay: essayPlugin,
    instructionBox: instructionBoxPlugin,
    
    // New custom plugins
    multipleChoiceQuestion: customPlugins.multipleChoiceQuestion,
    linedAnswerBox: customPlugins.linedAnswerBox,
    fillInTheBlank: customPlugins.fillInTheBlank,
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
      // Prefer the new plugin if available, fall back to legacy
      return plugins.multipleChoiceQuestion || plugins.multipleChoice;
    case "true_false":
      return plugins.trueFalse;
    case "short_answer":
      return plugins.shortAnswer;
    case "essay":
      return plugins.essay;
    case "lined_answer_box":
      return plugins.linedAnswerBox;
    case "fill_in_the_blank":
      return plugins.fillInTheBlank;
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
    questions: [
      "multipleChoice", 
      "multipleChoiceQuestion", 
      "trueFalse", 
      "shortAnswer", 
      "essay",
      "fillInTheBlank"
    ],
    layout: [
      "instructionBox", 
    ],
    writing: [
      "linedAnswerBox"
    ],
  };
};

/**
 * Creates an SVG string from a Lucide icon component
 * @param icon - Lucide icon component
 * @param attrs - Additional attributes for the icon
 * @returns SVG string
 */
export const createSvgStr = (icon: LucideIcon, attrs?: Record<string, string>): string => {
  // In lucide 0.525.0, the icon is an array of elements, not a single SVG element
  // We need to create an SVG wrapper and add the elements as children

  // Handle non-array input
  if (!Array.isArray(icon)) {
    return String(icon);
  }

  // Create default SVG attributes
  const svgAttrs = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    ...(attrs || {}),
  };

  // Format SVG attributes string
  const svgAttrString = Object.entries(svgAttrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  // Helper function to process a single element
  const processElement = (element: unknown): string => {
    if (!Array.isArray(element)) {
      return String(element);
    }

    const [tag, attributes = {}, children = []] = element as [
      unknown,
      Record<string, string>,
      unknown[],
    ];
    const tagName = String(tag);

    // Format attributes string
    const attrString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    // Process children recursively
    let childrenString = '';

    if (Array.isArray(children) && children.length > 0) {
      childrenString = children.map((child) => processElement(child)).join('');
    }

    // Return properly formatted element string
    if (childrenString) {
      return `<${String(tagName)}${attrString ? ' ' + String(attrString) : ''}>${childrenString}</${String(tagName)}>`;
    } else {
      // Self-closing tag for empty children
      return `<${String(tagName)}${attrString ? ' ' + String(attrString) : ''}/>`;
    }
  };

  // Process all elements and join them
  const elementsString = Array.isArray(icon)
    ? icon.map((element) => processElement(element)).join('')
    : processElement(icon);

  // Return the complete SVG string
  return `<svg ${svgAttrString}>${elementsString}</svg>`;
};

/**
 * Checks if the schema is editable based on the mode
 * @param mode - The current mode ('viewer', 'form', 'designer')
 * @param schema - The schema object
 * @returns boolean indicating if editable
 */
export const isEditable = (mode: string, schema: any): boolean => {
  if (mode === 'viewer') return false;
  if (schema.readOnly) return false;
  return mode === 'form' || mode === 'designer';
};

/**
 * Generates a unique ID
 * @returns A unique string ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};