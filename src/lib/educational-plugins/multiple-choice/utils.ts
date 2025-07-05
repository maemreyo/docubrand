import { MultipleChoiceSchema } from "../types";

/**
 * Utility functions for Multiple Choice Plugin
 * Separation of concerns: Business logic separate from UI
 */

/**
 * Generate option labels (A, B, C, D, ...)
 */
export const generateOptionLabel = (index: number): string => {
  return String.fromCharCode(65 + index);
};

/**
 * Format question text with options for PDF display
 */
export const formatQuestionForPDF = (
  questionText: string,
  options: string[]
): string => {
  const formattedOptions = options
    .filter(option => option.trim()) // Only include non-empty options
    .map((option, index) => `${generateOptionLabel(index)}. ${option}`);

  return [questionText, "", ...formattedOptions].join("\n");
};

/**
 * Extract current question text from value or schema
 */
export const getCurrentQuestionText = (
  value: string | undefined,
  schema: MultipleChoiceSchema
): string => {
  return value || schema.content || "";
};

/**
 * Get current options array with fallback
 */
export const getCurrentOptions = (schema: MultipleChoiceSchema): string[] => {
  return schema.options || ["", "", "", ""];
};

/**
 * Create base styles for UI components
 */
export const createBaseStyles = (schema: MultipleChoiceSchema) => ({
  fontFamily: schema.fontName || "Arial",
  fontSize: `${schema.fontSize || 12}px`,
  color: schema.fontColor || "#000000",
  lineHeight: 1.4,
});

/**
 * Event handler factory for onChange events
 * Provides consistent interface for different types of changes
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
 * Validate option array and ensure it has the correct structure
 */
export const validateOptions = (options: any): string[] => {
  if (!Array.isArray(options)) {
    return ["", "", "", ""];
  }
  
  const validOptions = options.map(option => 
    typeof option === 'string' ? option : ''
  );
  
  // Ensure we have at least 4 options
  while (validOptions.length < 4) {
    validOptions.push('');
  }
  
  return validOptions.slice(0, 4); // Limit to 4 options
};

/**
 * Clean up event listeners utility
 */
export class EventCleanup {
  private listeners: Array<{
    element: Element | Document;
    event: string;
    handler: EventListener;
  }> = [];

  addListener(
    element: Element | Document,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }

  cleanup(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Safely focus an element with optional delay
   */
  focus: (element: HTMLElement, delay = 0): void => {
    if (delay > 0) {
      setTimeout(() => element.focus(), delay);
    } else {
      element.focus();
    }
  },

  /**
   * Check if element is currently focused
   */
  isFocused: (element: HTMLElement): boolean => {
    return document.activeElement === element;
  },

  /**
   * Find focusable elements within a container
   */
  findFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selector = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }
};

/**
 * CSS utility functions
 */
export const styleUtils = {
  /**
   * Convert style object to CSS string
   */
  objectToCss: (styles: Record<string, string | number>): string => {
    return Object.entries(styles)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  },

  /**
   * Common styles for inputs
   */
  inputStyle: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontFamily: "inherit",
    fontSize: "12px",
  },

  /**
   * Common styles for containers
   */
  containerStyle: {
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    background: "#f8f9fa",
  }
};