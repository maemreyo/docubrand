export const DEFAULT_OPACITY = 1;
export const HEX_COLOR_PATTERN = '^#(?:[A-Fa-f0-9]{6})$';

export const DEFAULT_MULTIPLE_CHOICE = {
  FONT_SIZE: 12,
  FONT_COLOR: '#000000',
  MIN_CHOICES: 2,
  MAX_CHOICES: 10,
  DEFAULT_POINTS: 1,
};

export const EDUCATIONAL_PLUGIN_TYPES = {
  MULTIPLE_CHOICE: 'multipleChoice',
  TRUE_FALSE: 'trueFalse',
  SHORT_ANSWER: 'shortAnswer',
  ESSAY: 'essay',
  MATCHING: 'matching',
  FILL_IN_BLANK: 'fillInBlank',
} as const;