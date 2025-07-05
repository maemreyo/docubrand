import { PropPanel } from "@pdfme/common";
import { MultipleChoiceSchema } from "./types";
import {
  DEFAULT_MULTIPLE_CHOICE_SCHEMA,
  OPTION_LABELS,
  MIN_OPTIONS,
  MAX_OPTIONS,
} from "./constants";

/**
 * Property Panel configuration for Multiple Choice plugin
 * Uses form-render JSON schema format
 */
export const propPanel: PropPanel<MultipleChoiceSchema> = {
  schema: {
    properties: {
      // Base Schema Properties (Required by PDFme)
      name: {
        title: "Field Name",
        type: "string",
        description: "Unique identifier for this field",
        default: "multipleChoice",
        pattern: "^[a-zA-Z][a-zA-Z0-9_]*",
      },

      // Question Content
      content: {
        title: "Question Text",
        type: "string",
        widget: "textarea",
        description: "The main question text",
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.content,
        props: {
          rows: 3,
          placeholder: "Enter your multiple choice question...",
        },
      },

      position: {
        title: "Position",
        type: "object",
        properties: {
          x: {
            title: "X Position",
            type: "number",
            default: 0,
          },
          y: {
            title: "Y Position",
            type: "number",
            default: 0,
          },
        },
        required: ["x", "y"],
        default: { x: 0, y: 0 },
        description: "Position in PDF document",
      },

      // width: {
      //   title: "Width",
      //   type: "number",
      //   minimum: 10,
      //   maximum: 1000,
      //   default: 150,
      //   description: "Field width in points",
      // },

      height: {
        title: "Height",
        type: "number",
        minimum: 20,
        maximum: 1000,
        default: 80,
        description: "Field height in points",
      },

      // Answer Options
      options: {
        title: "Answer Options",
        type: "array",
        items: {
          type: "string",
          title: "Option",
        },
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.options,
        description: `Answer options (${MIN_OPTIONS}-${MAX_OPTIONS} options)`,
        props: {
          min: MIN_OPTIONS,
          max: MAX_OPTIONS,
        },
        widget: "list",
      },

      // Correct Answer
      correctAnswer: {
        title: "Correct Answer",
        type: "string",
        enum: OPTION_LABELS.slice(0, 10), // A-J
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.correctAnswer,
        description: "Select the correct answer",
      },

      // Point Value
      points: {
        title: "Points",
        type: "number",
        minimum: 0,
        maximum: 100,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.points,
        description: "Point value for this question",
      },

      // Font Properties
      fontName: {
        title: "Font Family",
        type: "string",
        widget: "select",
        enum: [
          "NotoSerifJP-Regular",
          "NotoSansJP-Regular",
          "Helvetica",
          "Times-Roman",
          "Courier",
        ],
        enumNames: [
          "Noto Serif JP",
          "Noto Sans JP",
          "Helvetica",
          "Times Roman",
          "Courier",
        ],
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.fontName,
      },

      fontSize: {
        title: "Font Size",
        type: "number",
        minimum: 6,
        maximum: 72,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.fontSize,
        description: "Font size in points",
      },

      fontColor: {
        title: "Font Color",
        type: "string",
        widget: "color",
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.fontColor,
        description: "Text color",
      },

      lineHeight: {
        title: "Line Height",
        type: "number",
        minimum: 0.5,
        maximum: 3,
        step: 0.1,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.lineHeight,
        description: "Line height multiplier",
      },

      characterSpacing: {
        title: "Character Spacing",
        type: "number",
        minimum: -5,
        maximum: 10,
        step: 0.1,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.characterSpacing,
        description: "Space between characters",
      },

      // Alignment Properties
      alignment: {
        title: "Text Alignment",
        type: "string",
        widget: "select",
        enum: ["left", "center", "right"],
        enumNames: ["Left", "Center", "Right"],
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.alignment,
      },

      verticalAlignment: {
        title: "Vertical Alignment",
        type: "string",
        widget: "select",
        enum: ["top", "middle", "bottom"],
        enumNames: ["Top", "Middle", "Bottom"],
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.verticalAlignment,
      },

      // Dynamic Font Size
      dynamicFontSize: {
        title: "Dynamic Font Size",
        type: "string",
        widget: "select",
        enum: ["none", "horizontal", "vertical", "both"],
        enumNames: ["None", "Fit Width", "Fit Height", "Fit Both"],
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.dynamicFontSize,
        description: "Auto-adjust font size to fit container",
      },

      // Visual Properties
      backgroundColor: {
        title: "Background Color",
        type: "string",
        widget: "color",
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.backgroundColor,
        description: "Background color (transparent if empty)",
      },

      borderColor: {
        title: "Border Color",
        type: "string",
        widget: "color",
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.borderColor,
        description: "Border color",
      },

      borderWidth: {
        title: "Border Width",
        type: "number",
        minimum: 0,
        maximum: 10,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.borderWidth,
        description: "Border width in points",
      },

      // Layout Properties
      padding: {
        title: "Padding",
        type: "number",
        minimum: 0,
        maximum: 50,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.padding,
        description: "Internal padding in points",
      },

      questionSpacing: {
        title: "Question Spacing",
        type: "number",
        minimum: 0,
        maximum: 50,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.questionSpacing,
        description: "Space between question and options",
      },

      optionSpacing: {
        title: "Option Spacing",
        type: "number",
        minimum: 0,
        maximum: 20,
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.optionSpacing,
        description: "Space between options",
      },

      // Behavior Properties
      readOnly: {
        title: "Read Only",
        type: "boolean",
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.readOnly,
        description: "Make field read-only",
      },

      required: {
        title: "Required",
        type: "boolean",
        default: DEFAULT_MULTIPLE_CHOICE_SCHEMA.required,
        description: "Mark field as required",
      },
    },

    // Property grouping for better UI organization
    order: [
      "content",
      "options",
      "correctAnswer",
      "points",
      "*", // All other properties
    ],
  },

  // Default schema values
  defaultSchema: {
    ...DEFAULT_MULTIPLE_CHOICE_SCHEMA,
    // Required base Schema properties
    name: "multipleChoice",
    type: "multipleChoice",
    position: { x: 0, y: 0 },
    width: 150,
    height: 80,
  },

  // Form UI configuration
  ui: {
    "ui:order": [
      "name",
      "position",
      "width",
      "height",
      "content",
      "options",
      "correctAnswer",
      "points",
      "fontName",
      "fontSize",
      "fontColor",
      "lineHeight",
      "characterSpacing",
      "alignment",
      "verticalAlignment",
      "dynamicFontSize",
      "backgroundColor",
      "borderColor",
      "borderWidth",
      "padding",
      "questionSpacing",
      "optionSpacing",
      "readOnly",
      "required",
    ],

    // Collapsible sections
    name: {
      "ui:widget": "text",
      "ui:placeholder": "fieldName",
    },

    position: {
      "ui:widget": "object",
      x: {
        "ui:widget": "updown",
      },
      y: {
        "ui:widget": "updown",
      },
    },

    width: {
      "ui:widget": "updown",
    },

    height: {
      "ui:widget": "updown",
    },

    content: {
      "ui:widget": "textarea",
      "ui:options": {
        rows: 3,
      },
    },

    options: {
      "ui:widget": "list",
      "ui:options": {
        addable: true,
        removable: true,
        orderable: true,
      },
      items: {
        "ui:placeholder": "Enter option text...",
      },
    },

    correctAnswer: {
      "ui:widget": "select",
    },

    points: {
      "ui:widget": "updown",
    },

    fontSize: {
      "ui:widget": "updown",
    },

    lineHeight: {
      "ui:widget": "updown",
    },

    characterSpacing: {
      "ui:widget": "updown",
    },

    borderWidth: {
      "ui:widget": "updown",
    },

    padding: {
      "ui:widget": "updown",
    },

    questionSpacing: {
      "ui:widget": "updown",
    },

    optionSpacing: {
      "ui:widget": "updown",
    },

    fontColor: {
      "ui:widget": "color",
    },

    backgroundColor: {
      "ui:widget": "color",
    },

    borderColor: {
      "ui:widget": "color",
    },

    readOnly: {
      "ui:widget": "checkbox",
    },

    required: {
      "ui:widget": "checkbox",
    },
  },
};
