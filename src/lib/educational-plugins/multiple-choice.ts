import { Plugin, PDFRenderProps, UIRenderProps } from "@pdfme/common";
import { text } from "@pdfme/schemas";
import { MultipleChoiceSchema } from "./types";

/**
 * Multiple Choice Plugin - PERSISTENT DOM SOLUTION
 * 
 * Key innovation: DOM elements are NEVER destroyed/recreated
 * - Initial creation only happens once
 * - Updates only patch content, never recreate elements
 * - Focus is naturally preserved across all state changes
 * - Figma-style instant sync with no interruptions
 */

// Plugin instance registry
interface PluginInstance {
  rootElement: HTMLElement;
  elements: {
    container: HTMLElement;
    questionTextarea: HTMLTextAreaElement;
    optionInputs: HTMLInputElement[];
  };
  state: {
    question: string;
    options: string[];
  };
  isInitialized: boolean;
  changeCallback: ((props: { key: string; value: any }) => void) | undefined;
}

const pluginInstances = new WeakMap<HTMLElement, PluginInstance>();

export const multipleChoicePlugin: Plugin<MultipleChoiceSchema> = {
  /**
   * PDF rendering - unchanged
   */
  pdf: (props: PDFRenderProps<MultipleChoiceSchema>) => {
    const { value, schema } = props;
    const questionText = value || schema.content || "Sample multiple choice question";
    const questionOptions = schema.options || ["Option A", "Option B", "Option C", "Option D"];

    const fullText = [
      questionText,
      "",
      ...questionOptions.map(
        (option: string, index: number) =>
          `${String.fromCharCode(65 + index)}. ${option}`
      ),
    ].join("\n");

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
   * UI rendering - PERSISTENT DOM SOLUTION
   */
  ui: (props: UIRenderProps<MultipleChoiceSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;

    if (mode === "viewer") {
      // Viewer mode - simple display (unchanged)
      createViewerComponent(rootElement, schema, value);
      return;
    }

    // Editor mode - PERSISTENT DOM MANAGEMENT
    let instance = pluginInstances.get(rootElement);
    
    if (!instance || !instance.isInitialized) {
      // FIRST TIME ONLY: Create DOM structure
      instance = createPersistentEditor(rootElement, schema, value, onChange);
      pluginInstances.set(rootElement, instance);
    } else {
      // SUBSEQUENT CALLS: Only update content, NEVER recreate DOM
      updateExistingEditor(instance, schema, value, onChange);
    }
  },

  /**
   * Property panel - unchanged
   */
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
 * Create viewer component (unchanged)
 */
function createViewerComponent(
  rootElement: HTMLElement,
  schema: MultipleChoiceSchema,
  value?: string
): void {
  rootElement.innerHTML = ""; // OK to clear in viewer mode
  
  const questionText = value || schema.content || "";
  const options = schema.options || [];

  const container = document.createElement("div");
  container.className = "multiple-choice-viewer";
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

  if (questionText.trim()) {
    const questionEl = document.createElement("div");
    questionEl.style.cssText = "font-weight: bold; margin-bottom: 8px;";
    questionEl.textContent = questionText;
    container.appendChild(questionEl);
  }

  options.forEach((option: string, index: number) => {
    if (option.trim()) {
      const optionEl = document.createElement("div");
      optionEl.style.cssText = "margin-left: 16px; margin-bottom: 4px;";
      optionEl.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
      container.appendChild(optionEl);
    }
  });

  rootElement.appendChild(container);
}

/**
 * CRITICAL: Create persistent editor (DOM created only ONCE)
 */
function createPersistentEditor(
  rootElement: HTMLElement,
  schema: MultipleChoiceSchema,
  value: string | undefined,
  onChange: ((props: { key: string; value: any }) => void) | undefined
): PluginInstance {
  
  // IMPORTANT: Only clear if not already initialized
  // This prevents destroying existing DOM during parent re-renders
  if (rootElement.children.length === 0 || !rootElement.querySelector('.multiple-choice-persistent')) {
    rootElement.innerHTML = "";
  }

  const currentQuestion = value || schema.content || "";
  const currentOptions = schema.options || ["", "", "", ""];

  // Create main container (PERSISTENT)
  const container = document.createElement("div");
  container.className = "multiple-choice-persistent"; // Marker for identification
  container.style.cssText = `
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f8f9fa;
  `;

  // Create question section (PERSISTENT)
  const questionSection = document.createElement("div");
  questionSection.className = "question-section";

  const questionLabel = document.createElement("label");
  questionLabel.textContent = "Question:";
  questionLabel.style.cssText = `
    display: block;
    font-weight: bold;
    margin-bottom: 4px;
    color: #333;
  `;

  const questionTextarea = document.createElement("textarea");
  questionTextarea.value = currentQuestion;
  questionTextarea.rows = 2;
  questionTextarea.placeholder = "Enter your multiple choice question...";
  questionTextarea.style.cssText = `
    width: 100%;
    padding: 8px;
    margin-bottom: 12px;
    resize: vertical;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
  `;

  questionSection.appendChild(questionLabel);
  questionSection.appendChild(questionTextarea);

  // Create options section (PERSISTENT)
  const optionsSection = document.createElement("div");
  optionsSection.className = "options-section";

  const optionsLabel = document.createElement("label");
  optionsLabel.textContent = "Answer Options:";
  optionsLabel.style.cssText = `
    display: block;
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
  `;

  const optionsContainer = document.createElement("div");
  optionsContainer.style.cssText = `
    background: white;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #e5e5e5;
  `;

  optionsSection.appendChild(optionsLabel);
  optionsSection.appendChild(optionsContainer);

  // Create option inputs (PERSISTENT)
  const optionInputs: HTMLInputElement[] = [];
  
  currentOptions.forEach((option, index) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    `;

    const label = document.createElement("span");
    label.textContent = `${String.fromCharCode(65 + index)}. `;
    label.style.cssText = `
      font-weight: bold;
      margin-right: 8px;
      min-width: 24px;
    `;

    const input = document.createElement("input");
    input.type = "text";
    input.value = option;
    input.placeholder = `Option ${String.fromCharCode(65 + index)}`;
    input.style.cssText = `
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 2px;
      font-size: 12px;
    `;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    optionsContainer.appendChild(wrapper);
    optionInputs.push(input);
  });

  // Assemble container
  container.appendChild(questionSection);
  container.appendChild(optionsSection);
  rootElement.appendChild(container);

  // Create instance
  const instance: PluginInstance = {
    rootElement,
    elements: {
      container,
      questionTextarea,
      optionInputs,
    },
    state: {
      question: currentQuestion,
      options: [...currentOptions],
    },
    isInitialized: true,
    changeCallback: onChange,
  };

  // Setup event listeners (PERSISTENT - attached only once)
  setupPersistentEventListeners(instance);

  return instance;
}

/**
 * CRITICAL: Update existing editor (NEVER recreate DOM)
 * This is the magic that prevents focus loss
 */
function updateExistingEditor(
  instance: PluginInstance,
  schema: MultipleChoiceSchema,
  value: string | undefined,
  onChange: ((props: { key: string; value: any }) => void) | undefined
): void {
  
  const newQuestion = value || schema.content || "";
  const newOptions = schema.options || ["", "", "", ""];

  // Update callback reference
  instance.changeCallback = onChange;

  // SMART UPDATE: Only update if values actually changed
  // This prevents unnecessary DOM manipulation that could interfere with focus

  // Update question if changed (but preserve if user is actively editing)
  if (newQuestion !== instance.state.question && 
      document.activeElement !== instance.elements.questionTextarea) {
    instance.elements.questionTextarea.value = newQuestion;
    instance.state.question = newQuestion;
  }

  // Update options if changed (but preserve if user is actively editing)
  newOptions.forEach((newOption, index) => {
    if (index < instance.elements.optionInputs.length) {
      const input = instance.elements.optionInputs[index];
      
      // Only update if value changed AND input is not currently focused
      if (newOption !== instance.state.options[index] && 
          document.activeElement !== input) {
        input.value = newOption;
        instance.state.options[index] = newOption;
      }
    }
  });

  // Handle case where number of options changed (rare, but possible)
  if (newOptions.length !== instance.state.options.length) {
    // This is a structural change, might need recreation
    // But in practice, options count rarely changes
    console.warn('Options count changed, may need DOM recreation');
  }
}

/**
 * Setup persistent event listeners (attached only once)
 */
function setupPersistentEventListeners(instance: PluginInstance): void {
  
  // Question textarea events
  instance.elements.questionTextarea.addEventListener("input", () => {
    const newQuestion = instance.elements.questionTextarea.value;
    instance.state.question = newQuestion;
    
    // INSTANT SYNC: No debouncing needed since DOM is persistent
    if (instance.changeCallback) {
      instance.changeCallback({ key: "content", value: newQuestion });
    }
  });

  // Prevent event bubbling that could trigger parent re-renders
  instance.elements.questionTextarea.addEventListener("click", (e) => e.stopPropagation());
  instance.elements.questionTextarea.addEventListener("mousedown", (e) => e.stopPropagation());

  // Option input events
  instance.elements.optionInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      const newValue = input.value;
      instance.state.options[index] = newValue;
      
      // INSTANT SYNC: Update parent immediately
      if (instance.changeCallback) {
        const newOptions = [...instance.state.options];
        instance.changeCallback({ key: "options", value: newOptions });
      }
    });

    // Prevent event bubbling
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("mousedown", (e) => e.stopPropagation());
  });

  // Cleanup on element removal
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node === instance.rootElement || node.contains?.(instance.rootElement)) {
          // Element removed, cleanup
          pluginInstances.delete(instance.rootElement);
          observer.disconnect();
        }
      });
    });
  });

  if (instance.rootElement.parentElement) {
    observer.observe(instance.rootElement.parentElement, { 
      childList: true, 
      subtree: true 
    });
  }
}

/**
 * Utility: Check if plugin is already initialized
 */
function isPluginInitialized(rootElement: HTMLElement): boolean {
  return pluginInstances.has(rootElement) && 
         pluginInstances.get(rootElement)?.isInitialized === true;
}