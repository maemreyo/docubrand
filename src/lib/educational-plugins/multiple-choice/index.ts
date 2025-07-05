import { Plugin } from '@pdfme/common';
import { MultipleChoiceSchema } from './types';
import { pdfRender } from './pdfRender';
import { uiRender } from './uiRender';
import { propPanel } from './propPanel';
import { ListChecks } from 'lucide-react';
import { createSvgStr } from '../utils';

/**
 * Multiple Choice Plugin
 * 
 * A comprehensive multiple-choice question plugin for educational assessments
 * that allows teachers to create questions with multiple correct answers.
 */
const multipleChoicePlugin: Plugin<MultipleChoiceSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  // icon: createSvgStr(ListChecks),
  // Enable uninterrupted edit mode to prevent re-rendering during active editing
  uninterruptedEditMode: true,
};

// Export helper functions for external use
export * from './helper';

export default multipleChoicePlugin;
export type { MultipleChoiceSchema, Choice } from './types';