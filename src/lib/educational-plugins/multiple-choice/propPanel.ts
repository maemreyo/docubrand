import { PropPanel } from '@pdfme/common';
import { MultipleChoiceSchema } from './types';
import { HEX_COLOR_PATTERN } from '../constants';

export const propPanel: PropPanel<MultipleChoiceSchema> = {
  schema: ({ i18n }) => ({
    // Content Properties
    question: {
      title: i18n('schemas.multipleChoice.question') || 'Question',
      type: 'string',
      widget: 'textarea',
      required: true,
    },
    instructionText: {
      title: i18n('schemas.multipleChoice.instruction') || 'Instruction Text',
      type: 'string',
      widget: 'textarea',
      props: {
        placeholder: 'e.g., "Select all correct answers"'
      }
    },
    points: {
      title: i18n('schemas.multipleChoice.points') || 'Points',
      type: 'number',
      widget: 'number',
      minimum: 0,
      maximum: 100,
      required: true,
    },
    
    // Behavior Properties
    minCorrectAnswers: {
      title: i18n('schemas.multipleChoice.minCorrect') || 'Min Correct Answers',
      type: 'number',
      widget: 'number',
      minimum: 1,
      maximum: 10,
    },
    maxCorrectAnswers: {
      title: i18n('schemas.multipleChoice.maxCorrect') || 'Max Correct Answers',
      type: 'number',
      widget: 'number',
      minimum: 1,
      maximum: 10,
    },
    showCorrectAnswers: {
      title: i18n('schemas.multipleChoice.showCorrect') || 'Show Correct Answers',
      type: 'boolean',
      widget: 'checkbox',
    },
    randomizeChoices: {
      title: i18n('schemas.multipleChoice.randomize') || 'Randomize Choices',
      type: 'boolean',
      widget: 'checkbox',
    },
    readOnly: {
      title: i18n('schemas.readOnly') || 'Read Only',
      type: 'boolean',
      widget: 'checkbox',
    },
    required: {
      title: i18n('schemas.required') || 'Required',
      type: 'boolean',
      widget: 'checkbox',
    },
    
    // Styling Properties
    fontName: {
      title: i18n('schemas.text.fontName') || 'Font',
      type: 'string',
      widget: 'select',
      props: {
        options: [
          { label: 'Arial', value: 'Arial' },
          { label: 'Helvetica', value: 'Helvetica' },
          { label: 'Times New Roman', value: 'Times-Roman' },
          { label: 'Courier', value: 'Courier' },
          { label: 'Noto Serif JP', value: 'NotoSerifJP-Regular' },
          { label: 'Noto Sans JP', value: 'NotoSansJP-Regular' },
        ]
      },
      required: true,
    },
    fontSize: {
      title: i18n('schemas.fontSize') || 'Font Size',
      type: 'number',
      widget: 'number',
      minimum: 8,
      maximum: 24,
      required: true,
    },
    fontColor: {
      title: i18n('schemas.color') || 'Text Color',
      type: 'string',
      widget: 'color',
      props: {
        disabledAlpha: true,
      },
      required: true,
      rules: [{ pattern: HEX_COLOR_PATTERN, message: i18n('validation.hexColor') || 'Invalid color format' }],
    },
    backgroundColor: {
      title: i18n('schemas.backgroundColor') || 'Background Color',
      type: 'string',
      widget: 'color',
      props: {
        disabledAlpha: true,
      },
      rules: [{ pattern: HEX_COLOR_PATTERN, message: i18n('validation.hexColor') || 'Invalid color format' }],
    },
    borderColor: {
      title: i18n('schemas.borderColor') || 'Border Color',
      type: 'string',
      widget: 'color',
      props: {
        disabledAlpha: true,
      },
      rules: [{ pattern: HEX_COLOR_PATTERN, message: i18n('validation.hexColor') || 'Invalid color format' }],
    },
    borderWidth: {
      title: i18n('schemas.borderWidth') || 'Border Width',
      type: 'number',
      widget: 'number',
      minimum: 0,
      maximum: 10,
    },
    lineHeight: {
      title: i18n('schemas.lineHeight') || 'Line Height',
      type: 'number',
      widget: 'number',
      minimum: 0.5,
      maximum: 3,
      step: 0.1,
    },
    characterSpacing: {
      title: i18n('schemas.characterSpacing') || 'Character Spacing',
      type: 'number',
      widget: 'number',
      minimum: -5,
      maximum: 10,
      step: 0.1,
    },
    
    // Layout Properties
    padding: {
      title: i18n('schemas.padding') || 'Padding',
      type: 'number',
      widget: 'number',
      minimum: 0,
      maximum: 50,
    },
    optionSpacing: {
      title: i18n('schemas.multipleChoice.optionSpacing') || 'Option Spacing',
      type: 'number',
      widget: 'number',
      minimum: 0,
      maximum: 20,
    },
    questionSpacing: {
      title: i18n('schemas.multipleChoice.questionSpacing') || 'Question Spacing',
      type: 'number',
      widget: 'number',
      minimum: 0,
      maximum: 50,
    },
  }),
  
  defaultSchema: {
    name: '',
    type: 'multipleChoice',
    position: { x: 20, y: 20 },
    width: 170,
    height: 120,
    question: 'What are the primary colors?',
    choices: [
      { id: '1', text: 'Red', isCorrect: true },
      { id: '2', text: 'Blue', isCorrect: true },
      { id: '3', text: 'Green', isCorrect: false },
      { id: '4', text: 'Yellow', isCorrect: true },
    ],
    points: 1,
    fontName: 'Helvetica',
    fontSize: 12,
    fontColor: '#000000',
    backgroundColor: 'transparent',
    borderColor: '#cccccc',
    borderWidth: 1,
    lineHeight: 1.4,
    characterSpacing: 0,
    padding: 8,
    optionSpacing: 4,
    questionSpacing: 8,
    instructionText: 'Select all correct answers',
    showCorrectAnswers: false,
    randomizeChoices: false,
    minCorrectAnswers: 1,
    maxCorrectAnswers: 3,
    readOnly: false,
    required: false,
  } as MultipleChoiceSchema,
  
  // Form UI configuration
  ui: {
    'ui:order': [
      'question',
      'instructionText',
      'points',
      'minCorrectAnswers',
      'maxCorrectAnswers',
      'showCorrectAnswers',
      'randomizeChoices',
      'fontName',
      'fontSize',
      'fontColor',
      'backgroundColor',
      'borderColor',
      'borderWidth',
      'lineHeight',
      'characterSpacing',
      'padding',
      'optionSpacing',
      'questionSpacing',
      'readOnly',
      'required',
    ],
  },
};