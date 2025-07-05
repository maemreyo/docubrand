import { Plugin } from '@pdfme/common';
import { MultipleChoiceSchema } from './types';
import { pdfRender } from './pdfRender';
import { uiRender } from './uiRender';
import { propPanel } from './propPanel';

/**
 * Multiple Choice Plugin Icon (SVG)
 * A simple icon representing multiple choice questions
 */
const multipleChoiceIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="4" width="20" height="2" rx="1" fill="currentColor"/>
  <rect x="2" y="8" width="20" height="2" rx="1" fill="currentColor"/>
  <rect x="2" y="12" width="20" height="2" rx="1" fill="currentColor"/>
  <rect x="2" y="16" width="20" height="2" rx="1" fill="currentColor"/>
  <circle cx="18" cy="9" r="2" fill="currentColor"/>
  <circle cx="18" cy="13" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <circle cx="18" cy="17" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
</svg>
`.trim();

/**
 * Multiple Choice Plugin Definition
 * 
 * This plugin implements a complete multiple choice question system with:
 * - PDF rendering with formatted question and options
 * - UI rendering for viewer, form, and designer modes
 * - Property panel for comprehensive customization
 * - Support for dynamic font sizing and alignment
 * - Accessibility and browser compatibility features
 */
export const multipleChoicePlugin: Plugin<MultipleChoiceSchema> = {
  /**
   * PDF rendering function
   * Generates formatted multiple choice questions in PDF documents
   */
  pdf: pdfRender,
  
  /**
   * UI rendering function  
   * Handles display and interaction in web interfaces
   * Supports three modes:
   * - viewer: Read-only display
   * - form: Interactive form input
   * - designer: WYSIWYG editing
   */
  ui: uiRender,
  
  /**
   * Property panel configuration
   * Provides comprehensive customization options in the designer
   * Uses form-render JSON schema format
   */
  propPanel,
  
  /**
   * Plugin icon for UI display
   */
  icon: multipleChoiceIcon,
  
  /**
   * Uninterrupted edit mode
   * When enabled, prevents re-rendering during active editing
   * to preserve user focus and input state
   */
  uninterruptedEditMode: true,
};

// Export all types and utilities for external use
export * from './types';
export * from './constants';
export * from './helper';

// Export individual functions for testing or custom implementations
export { pdfRender } from './pdfRender';
export { uiRender } from './uiRender';
export { propPanel } from './propPanel';

// Default export for convenience
export default multipleChoicePlugin;