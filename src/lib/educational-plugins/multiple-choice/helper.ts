import { MultipleChoiceSchema, FontWidthCalcValues, DynamicFontSizeFit } from './types';
import { 
  OPTION_LABELS, 
  DEFAULT_OPTIONS, 
  MIN_OPTIONS, 
  MAX_OPTIONS,
  ERROR_MESSAGES,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT 
} from './constants';

/**
 * Generate option label (A, B, C, D, etc.)
 */
export const generateOptionLabel = (index: number): string => {
  if (index < 0 || index >= OPTION_LABELS.length) {
    return String(index + 1); // Fallback to numbers
  }
  return OPTION_LABELS[index];
};

/**
 * Format question text with options for PDF display
 */
export const formatQuestionForPDF = (
  questionText: string,
  options: string[]
): string => {
  const validOptions = validateAndCleanOptions(options);
  const formattedOptions = validOptions
    .map((option, index) => `${generateOptionLabel(index)}. ${option}`)
    .join('\n');

  return `${questionText}\n\n${formattedOptions}`;
};

/**
 * Validate and clean options array
 */
export const validateAndCleanOptions = (options: any): string[] => {
  if (!Array.isArray(options)) {
    console.warn(ERROR_MESSAGES.INVALID_OPTIONS);
    return DEFAULT_OPTIONS;
  }

  const cleanOptions = options
    .map(option => typeof option === 'string' ? option.trim() : '')
    .filter(option => option.length > 0);

  if (cleanOptions.length < MIN_OPTIONS) {
    console.warn(ERROR_MESSAGES.INVALID_OPTION_COUNT);
    return DEFAULT_OPTIONS;
  }

  if (cleanOptions.length > MAX_OPTIONS) {
    console.warn(ERROR_MESSAGES.INVALID_OPTION_COUNT);
    return cleanOptions.slice(0, MAX_OPTIONS);
  }

  return cleanOptions;
};

/**
 * Get current question text from value or schema
 */
export const getCurrentQuestionText = (
  value: string | undefined,
  schema: MultipleChoiceSchema
): string => {
  return value || schema.content || '';
};

/**
 * Get current options with validation
 */
export const getCurrentOptions = (schema: MultipleChoiceSchema): string[] => {
  return validateAndCleanOptions(schema.options);
};

/**
 * Calculate dynamic font size to fit content in container
 */
export const calculateDynamicFontSize = (
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontCalcValues: FontWidthCalcValues,
  fitMode: DynamicFontSizeFit
): number => {
  const { font, fontSize: baseFontSize } = fontCalcValues;
  
  if (fitMode === 'none' || !font) {
    return baseFontSize;
  }

  let testFontSize = baseFontSize;
  const minFontSize = 6;
  const maxFontSize = 72;

  // Measure text dimensions at current font size
  const measureText = (fontSize: number) => {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize * DEFAULT_LINE_HEIGHT;
    return { width: textWidth, height: textHeight };
  };

  // Binary search for optimal font size
  let low = minFontSize;
  let high = maxFontSize;
  let bestFit = baseFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const { width, height } = measureText(mid);

    let fits = true;
    if (fitMode === 'horizontal' || fitMode === 'both') {
      fits = fits && width <= maxWidth;
    }
    if (fitMode === 'vertical' || fitMode === 'both') {
      fits = fits && height <= maxHeight;
    }

    if (fits) {
      bestFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.min(bestFit, baseFontSize);
};

/**
 * Split text into lines based on container width
 */
export const splitTextToLines = (
  text: string,
  maxWidth: number,
  fontCalcValues: FontWidthCalcValues
): string[] => {
  const { font, fontSize } = fontCalcValues;
  
  if (!font) {
    return [text];
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (lineWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, force break
        lines.push(word);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
};

/**
 * Calculate text height with line breaks
 */
export const calculateTextHeight = (
  lines: string[],
  fontSize: number,
  lineHeight: number = DEFAULT_LINE_HEIGHT
): number => {
  return lines.length * fontSize * lineHeight;
};

/**
 * Browser-specific font adjustments (similar to text plugin)
 */
export const getBrowserVerticalFontAdjustments = (): number => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) {
    return 0.1; // Firefox text positioning adjustment
  }
  
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 0.05; // Safari text positioning adjustment
  }
  
  return 0; // Default for Chrome and others
};

/**
 * Check if browser is Firefox
 */
export const isFirefox = (): boolean => {
  return navigator.userAgent.includes('Firefox');
};

/**
 * Create base styles for UI components
 */
export const createBaseStyles = (schema: MultipleChoiceSchema) => ({
  fontFamily: schema.fontName || 'Arial',
  fontSize: `${schema.fontSize || DEFAULT_FONT_SIZE}px`,
  color: schema.fontColor || '#000000',
  lineHeight: schema.lineHeight || DEFAULT_LINE_HEIGHT,
  backgroundColor: schema.backgroundColor || 'transparent',
  padding: `${schema.padding || 0}px`,
});

/**
 * Debounce utility for input events
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

/**
 * Event handler factory for onChange events
 */
export type ChangeHandler = (key: string, value: any) => void;

export const createChangeHandler = (
  onChange: ((props: { key: string; value: any }) => void) | undefined
): ChangeHandler => {
  return (key: string, value: any) => {
    if (onChange) {
      onChange({ key, value });
    }
  };
};

/**
 * Validate schema structure
 */
export const validateSchema = (schema: any): schema is MultipleChoiceSchema => {
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  if (schema.type !== 'multipleChoice') {
    return false;
  }

  if (typeof schema.content !== 'string') {
    return false;
  }

  if (!Array.isArray(schema.options)) {
    return false;
  }

  return true;
};