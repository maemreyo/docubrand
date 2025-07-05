/**
 * Helper functions for multiple choice plugin
 */

/**
 * Debounce utility for input events
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number = 300
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

/**
 * Check if browser is Firefox
 */
export const isFirefox = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent.includes('Firefox');
  }
  return false;
};

/**
 * Handle Firefox-specific contentEditable issues
 */
export const makeElementPlainTextContentEditable = (element: HTMLElement): void => {
  if (isFirefox()) {
    element.addEventListener('keydown', (e) => {
      // Prevent rich text formatting in Firefox
      if (e.ctrlKey || e.metaKey) {
        const preventKeys = ['b', 'i', 'u'];
        if (preventKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
    });
  }
};

/**
 * Prevent event propagation for input elements
 */
export const preventEventPropagation = (element: HTMLElement): void => {
  const events = ['click', 'mousedown', 'touchstart', 'focus', 'pointerdown'];
  
  events.forEach(eventType => {
    element.addEventListener(eventType, (e) => {
      e.stopPropagation();
    });
  });
};

/**
 * Apply enhanced input styles to make inputs more accessible
 */
export const applyEnhancedInputStyles = (input: HTMLElement): void => {
  Object.assign(input.style, {
    position: 'relative',
    zIndex: '5',
    outline: 'none',
  });
  
  // Add focus styles
  input.addEventListener('focus', () => {
    Object.assign(input.style, {
      boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.5)',
      borderColor: '#4299e1',
    });
  });
  
  // Remove focus styles on blur
  input.addEventListener('blur', () => {
    Object.assign(input.style, {
      boxShadow: 'none',
      borderColor: '#ddd',
    });
  });
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Focus an element with selection at the end
 */
export const focusElementWithSelectionAtEnd = (element: HTMLInputElement | HTMLTextAreaElement): void => {
  setTimeout(() => {
    element.focus();
    if (element.value) {
      if (element instanceof HTMLInputElement) {
        element.setSelectionRange(element.value.length, element.value.length);
      } else if (element instanceof HTMLTextAreaElement) {
        element.setSelectionRange(element.value.length, element.value.length);
      }
    }
  }, 50);
};