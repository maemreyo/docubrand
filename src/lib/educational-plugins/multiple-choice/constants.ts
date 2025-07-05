import { ALIGNMENT, VERTICAL_ALIGNMENT, DYNAMIC_FONT_SIZE_FIT } from './types';

/**
 * Default font size for multiple choice questions
 */
export const DEFAULT_FONT_SIZE = 12;

/**
 * Default font name
 */
export const DEFAULT_FONT_NAME = 'NotoSerifJP-Regular';

/**
 * Default font color (black)
 */
export const DEFAULT_FONT_COLOR = '#000000';

/**
 * Default background color (transparent)
 */
export const DEFAULT_BACKGROUND_COLOR = 'transparent';

/**
 * Default border color
 */
export const DEFAULT_BORDER_COLOR = '#cccccc';

/**
 * Default border width
 */
export const DEFAULT_BORDER_WIDTH = 1;

/**
 * Default line height
 */
export const DEFAULT_LINE_HEIGHT = 1.4;

/**
 * Default character spacing
 */
export const DEFAULT_CHARACTER_SPACING = 0;

/**
 * Default alignment options
 */
export const DEFAULT_ALIGNMENT = ALIGNMENT.LEFT;
export const DEFAULT_VERTICAL_ALIGNMENT = VERTICAL_ALIGNMENT.TOP;

/**
 * Default dynamic font size fitting
 */
export const DEFAULT_DYNAMIC_FONT_SIZE = DYNAMIC_FONT_SIZE_FIT.NONE;

/**
 * Default padding around content
 */
export const DEFAULT_PADDING = 8;

/**
 * Default spacing between options
 */
export const DEFAULT_OPTION_SPACING = 4;

/**
 * Default spacing between question and options
 */
export const DEFAULT_QUESTION_SPACING = 8;

/**
 * Default number of options
 */
export const DEFAULT_OPTION_COUNT = 4;

/**
 * Default options array
 */
export const DEFAULT_OPTIONS = ['Option A', 'Option B', 'Option C', 'Option D'];

/**
 * Default question text
 */
export const DEFAULT_QUESTION_TEXT = 'Multiple choice question?';

/**
 * Default correct answer
 */
export const DEFAULT_CORRECT_ANSWER = 'A';

/**
 * Default point value
 */
export const DEFAULT_POINTS = 1;

/**
 * Option label prefixes (A, B, C, D, etc.)
 */
export const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Maximum number of options supported
 */
export const MAX_OPTIONS = OPTION_LABELS.length;

/**
 * Minimum number of options required
 */
export const MIN_OPTIONS = 2;

/**
 * Default schema object for new multiple choice questions
 */
export const DEFAULT_MULTIPLE_CHOICE_SCHEMA = {
  // Base Schema properties (required by PDFme)
  name: 'multipleChoice',
  type: 'multipleChoice' as const,
  position: { x: 0, y: 0 },
  width: 150,
  height: 80,
  
  // Multiple Choice specific properties
  content: DEFAULT_QUESTION_TEXT,
  options: DEFAULT_OPTIONS,
  correctAnswer: DEFAULT_CORRECT_ANSWER,
  points: DEFAULT_POINTS,
  fontName: DEFAULT_FONT_NAME,
  fontSize: DEFAULT_FONT_SIZE,
  fontColor: DEFAULT_FONT_COLOR,
  lineHeight: DEFAULT_LINE_HEIGHT,
  characterSpacing: DEFAULT_CHARACTER_SPACING,
  alignment: DEFAULT_ALIGNMENT,
  verticalAlignment: DEFAULT_VERTICAL_ALIGNMENT,
  dynamicFontSize: DEFAULT_DYNAMIC_FONT_SIZE,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  borderColor: DEFAULT_BORDER_COLOR,
  borderWidth: DEFAULT_BORDER_WIDTH,
  padding: DEFAULT_PADDING,
  optionSpacing: DEFAULT_OPTION_SPACING,
  questionSpacing: DEFAULT_QUESTION_SPACING,
  readOnly: false,
  required: false,
};

/**
 * CSS class names for styling
 */
export const CSS_CLASSES = {
  CONTAINER: 'multiple-choice-container',
  QUESTION: 'multiple-choice-question',
  OPTIONS: 'multiple-choice-options',
  OPTION: 'multiple-choice-option',
  OPTION_LABEL: 'multiple-choice-option-label',
  OPTION_TEXT: 'multiple-choice-option-text',
  EDITOR_CONTAINER: 'multiple-choice-editor',
  VIEWER_CONTAINER: 'multiple-choice-viewer',
} as const;

/**
 * UI mode specific settings
 */
export const UI_MODES = {
  VIEWER: 'viewer',
  FORM: 'form', 
  DESIGNER: 'designer',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_OPTIONS: 'Invalid options array',
  INVALID_OPTION_COUNT: `Option count must be between ${MIN_OPTIONS} and ${MAX_OPTIONS}`,
  INVALID_FONT_SIZE: 'Font size must be a positive number',
  INVALID_SCHEMA: 'Invalid multiple choice schema',
} as const;