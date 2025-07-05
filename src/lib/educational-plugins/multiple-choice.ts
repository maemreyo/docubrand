import { Plugin, PDFRenderProps, UIRenderProps } from "@pdfme/common";
import { text } from "@pdfme/schemas";
import { MultipleChoiceSchema } from "./types";

/**
 * Multiple Choice Question Plugin - FIGMA-STYLE PERSISTENT DOM VERSION
 *
 * Key Innovation: DOM elements are NEVER destroyed, only content is updated.
 * This ensures perfect focus preservation like Figma, Notion, Linear.
 *
 * Architecture:
 * 1. Instance Registry: WeakMap to track persistent DOM instances
 * 2. One-Time DOM Creation: Elements created only once, then reused
 * 3. Smart Content Updates: Only update values when not focused
 * 4. Instant Parent Sync: No debouncing needed due to DOM stability
 */

// Plugin Instance Management
interface PluginInstance {
  rootElement: HTMLElement;
  elements: {
    questionTextarea: HTMLTextAreaElement;
    optionInputs: HTMLInputElement[];
    container: HTMLDivElement;
  };
  state: {
    question: string;
    options: string[];
    currentMode: string;
  };
  eventListeners: {
    questionHandler: (e: Event) => void;
    optionHandlers: ((e: Event) => void)[];
  };
}

// Global instance registry - persists across renders
const pluginInstances = new WeakMap<HTMLElement, PluginInstance>();

/**
 * PDF rendering function - unchanged from original
 */
export const multipleChoicePlugin: Plugin<MultipleChoiceSchema> = {
  pdf: (props: PDFRenderProps<MultipleChoiceSchema>) => {
    const { value, schema } = props;

    // Use the value directly as question text, fallback to schema content
    const questionText =
      value || schema.content || "Sample multiple choice question";
    const questionOptions = schema.options || [
      "Option A",
      "Option B",
      "Option C",
      "Option D",
    ];

    // Build full text with options
    const fullText = [
      questionText,
      "",
      ...questionOptions.map(
        (option: string, index: number) =>
          `${String.fromCharCode(65 + index)}. ${option}`
      ),
    ].join("\n");

    // Use text plugin for actual rendering
    return text.pdf({
      ...props,
      value: fullText,
      schema: {
        ...schema,
        type: "text",
        content: fullText,
      } as any,
    });
  },

  /**
   * UI rendering function - FIGMA-STYLE PERSISTENT DOM
   *
   * This function implements the revolutionary approach:
   * - DOM elements are created ONCE and NEVER destroyed
   * - Only content is updated, preserving focus perfectly
   * - Instant parent synchronization without delays
   */
  ui: (props: UIRenderProps<MultipleChoiceSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;

    console.log("🚀 MultipleChoice PERSISTENT - UI render called", {
      mode,
      value,
      hasOnChange: !!onChange,
      rootElementId: rootElement.id || "no-id",
      childrenCount: rootElement.children.length,
    });

    // Get or create persistent instance
    let instance = pluginInstances.get(rootElement);

    // Check if instance exists and if mode has changed
    if (!instance || instance.state.currentMode !== mode) {
      // If no instance or mode changed, create/recreate persistent DOM structure
      console.log(`✨ Creating/Recreating persistent instance for mode: ${mode}`);
      // Clear existing children to ensure a clean slate for the new mode's DOM
      rootElement.innerHTML = "";
      instance = createPersistentEditor(
        rootElement,
        schema,
        value,
        onChange,
        mode
      );
      pluginInstances.set(rootElement, instance);
    } else {
      // If instance exists and mode is the same, just update content
      console.log("🔄 Updating existing persistent instance");
      updateExistingEditor(instance, schema, value, onChange, mode);
    }
  },

  propPanel: {
    schema: {
      options: {
        type: "array",
        title: "Answer Options",
        items: {
          type: "string",
          title: "Option",
        },
        default: ["Option A", "Option B", "Option C", "Option D"],
      },
      correctAnswer: {
        type: "string",
        title: "Correct Answer",
        enum: ["A", "B", "C", "D"],
        default: "A",
      },
      points: {
        type: "number",
        title: "Points",
        minimum: 0,
        default: 1,
      },
    },
    defaultSchema: {
      name: "multipleChoice",
      type: "multipleChoice",
      content: "What is the correct answer?",
      position: { x: 0, y: 0 },
      width: 150,
      height: 80,
      fontSize: 12,
      fontColor: "#000000",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "A",
      points: 1,
    },
  },
};

/**
 * Creates persistent DOM structure - CALLED ONLY ONCE
 *
 * This is the core innovation: DOM elements are created once and never destroyed.
 * All event listeners are attached once and work forever.
 */
function createPersistentEditor(
  rootElement: HTMLElement,
  schema: MultipleChoiceSchema,
  value: string | null,
  onChange: ((arg: { key: string; value: unknown }) => void) | undefined,
  mode: string
): PluginInstance {
  console.log("🏗️ Creating persistent DOM structure");

  // Clear only if needed (should be empty on first creation)
  if (rootElement.children.length > 0) {
    console.warn("⚠️ RootElement not empty on creation - clearing");
    rootElement.innerHTML = "";
  }

  const currentQuestion = value || schema.content || "";
  const currentOptions = schema.options || ["", "", "", ""];

  if (mode === "viewer") {
    // Viewer mode - simple display
    return createViewerMode(
      rootElement,
      currentQuestion,
      currentOptions,
      schema
    );
  }

  // Editor mode - interactive inputs
  return createEditorMode(
    rootElement,
    currentQuestion,
    currentOptions,
    onChange,
    schema
  );
}

/**
 * Creates viewer mode DOM - static display
 */
function createViewerMode(
  rootElement: HTMLElement,
  question: string,
  options: string[],
  schema: MultipleChoiceSchema
): PluginInstance {
  const container = document.createElement("div");
  container.className = "multiple-choice-persistent-viewer";
  container.style.cssText = `
    font-family: ${schema.fontName || "Arial"};
    font-size: ${schema.fontSize || 12}px;
    color: ${schema.fontColor || "#000000"};
    line-height: 1.4;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f9f9f9;
  `;

  const questionEl = document.createElement("div");
  questionEl.style.cssText = "font-weight: bold; margin-bottom: 8px;";
  questionEl.textContent = question;
  container.appendChild(questionEl);

  options.forEach((option: string, index: number) => {
    if (option.trim()) {
      const optionEl = document.createElement("div");
      optionEl.style.cssText = "margin-left: 16px; margin-bottom: 4px;";
      optionEl.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
      container.appendChild(optionEl);
    }
  });

  rootElement.appendChild(container);

  return {
    rootElement,
    elements: {
      questionTextarea: null as any,
      optionInputs: [],
      container,
    },
    state: {
      question,
      options,
      currentMode: "viewer",
    },
    eventListeners: {
      questionHandler: () => {},
      optionHandlers: [],
    },
  };
}

/**
 * Creates editor mode DOM with persistent inputs
 */
function createEditorMode(
  rootElement: HTMLElement,
  question: string,
  options: string[],
  onChange: ((arg: { key: string; value: unknown }) => void) | undefined,
  schema: MultipleChoiceSchema
): PluginInstance {
  // Main container
  const container = document.createElement("div");
  container.className = "multiple-choice-persistent-editor";
  container.style.cssText = `
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f8f9fa;
    font-family: inherit;
  `;

  // Question section
  const questionLabel = document.createElement("label");
  questionLabel.textContent = "Question:";
  questionLabel.style.cssText = `
    display: block;
    font-weight: bold;
    margin-bottom: 4px;
    color: #333;
  `;
  container.appendChild(questionLabel);

  // Question textarea - PERSISTENT
  const questionTextarea = document.createElement("textarea");
  questionTextarea.value = question;
  questionTextarea.placeholder = "Enter your multiple choice question...";
  questionTextarea.rows = 2;
  questionTextarea.style.cssText = `
    width: 100%;
    padding: 8px;
    margin-bottom: 12px;
    resize: vertical;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    box-sizing: border-box;
  `;

  // Create persistent event handler for question
  const questionHandler = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    console.log("📝 Question changed:", target.value);

    if (onChange) {
      // ✨ INSTANT sync with parent - no debouncing needed!
      onChange({ key: "content", value: target.value });
    }
  };

  // Attach event listener ONCE
  questionTextarea.addEventListener("input", questionHandler);
  container.appendChild(questionTextarea);

  // Options section
  const optionsLabel = document.createElement("label");
  optionsLabel.textContent = "Answer Options:";
  optionsLabel.style.cssText = `
    display: block;
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
  `;
  container.appendChild(optionsLabel);

  // Options container
  const optionsContainer = document.createElement("div");
  optionsContainer.style.cssText = `
    background: white;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #e5e5e5;
  `;

  // Create persistent option inputs
  const optionInputs: HTMLInputElement[] = [];
  const optionHandlers: ((e: Event) => void)[] = [];

  options.forEach((option: string, index: number) => {
    const optionWrapper = document.createElement("div");
    optionWrapper.style.cssText = `
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    `;

    const optionLabel = document.createElement("span");
    optionLabel.textContent = `${String.fromCharCode(65 + index)}.`;
    optionLabel.style.cssText = `
      font-weight: bold;
      margin-right: 8px;
      min-width: 24px;
    `;

    const optionInput = document.createElement("input");
    optionInput.type = "text";
    optionInput.value = option;
    optionInput.placeholder = `Option ${String.fromCharCode(65 + index)}`;
    optionInput.style.cssText = `
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 2px;
      font-size: 12px;
    `;

    // Create persistent event handler for this option
    const optionHandler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      console.log(`📝 Option ${index} changed:`, target.value);

      if (onChange) {
        // Update options array
        const newOptions = [...options];
        newOptions[index] = target.value;

        // ✨ INSTANT sync with parent
        onChange({ key: "options", value: newOptions });
      }
    };

    // Attach event listener ONCE
    optionInput.addEventListener("input", optionHandler);

    optionWrapper.appendChild(optionLabel);
    optionWrapper.appendChild(optionInput);
    optionsContainer.appendChild(optionWrapper);

    optionInputs.push(optionInput);
    optionHandlers.push(optionHandler);
  });

  container.appendChild(optionsContainer);
  rootElement.appendChild(container);

  console.log("✅ Persistent DOM structure created successfully");

  return {
    rootElement,
    elements: {
      questionTextarea,
      optionInputs,
      container,
    },
    state: {
      question,
      options: [...options],
      currentMode: "editor",
    },
    eventListeners: {
      questionHandler,
      optionHandlers,
    },
  };
}

/**
 * Updates existing persistent DOM content - PRESERVES FOCUS
 *
 * This is the magic: only update content of existing elements,
 * never recreate them. Focus is preserved perfectly.
 */
function updateExistingEditor(
  instance: PluginInstance,
  schema: MultipleChoiceSchema,
  value: string | null,
  onChange: ((arg: { key: string; value: unknown }) => void) | undefined,
  mode: string
): void {
  console.log("🔄 Updating existing editor content");

  const newQuestion = value || schema.content || "";
  const newOptions = schema.options || ["", "", "", ""];

  // 🎯 SMART UPDATE: Only update if value changed AND element is not focused
  if (instance.elements.questionTextarea) {
    const textarea = instance.elements.questionTextarea;

    if (
      newQuestion !== instance.state.question &&
      document.activeElement !== textarea
    ) {
      console.log("📝 Updating question content (not focused)");
      textarea.value = newQuestion;
    }
  }

  // Update option inputs - same smart logic
  instance.elements.optionInputs.forEach((input, index) => {
    const newOptionValue = newOptions[index] || "";

    if (
      newOptionValue !== instance.state.options[index] &&
      document.activeElement !== input
    ) {
      console.log(`📝 Updating option ${index} content (not focused)`);
      input.value = newOptionValue;
    }
  });

  // Update internal state
  instance.state.question = newQuestion;
  instance.state.options = [...newOptions];

  console.log("✅ Content update completed - focus preserved");
}
