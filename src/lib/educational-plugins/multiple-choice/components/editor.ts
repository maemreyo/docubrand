import { MultipleChoiceSchema } from "../../types";
import { 
  getCurrentQuestionText, 
  getCurrentOptions, 
  generateOptionLabel,
  createChangeHandler,
  ChangeHandler,
  EventCleanup,
  focusUtils,
  styleUtils,
  validateOptions
} from "../utils";

/**
 * Editor Component for Multiple Choice Plugin
 * Handles edit mode (used in Designer and Form)
 */

export interface EditorProps {
  rootElement: HTMLElement;
  schema: MultipleChoiceSchema;
  value?: string;
  onChange?: (props: { key: string; value: any }) => void;
}

export const createEditorComponent = ({ 
  rootElement, 
  schema, 
  value, 
  onChange 
}: EditorProps): (() => void) => {
  // Clear any existing content
  rootElement.innerHTML = "";

  const questionText = getCurrentQuestionText(value, schema);
  const options = validateOptions(getCurrentOptions(schema));
  const changeHandler = createChangeHandler(onChange);
  const cleanup = new EventCleanup();

  // Create main container
  const container = document.createElement("div");
  container.className = "multiple-choice-editor";
  container.style.cssText = styleUtils.objectToCss(styleUtils.containerStyle);

  // Create question section
  const questionSection = createQuestionSection(
    questionText, 
    changeHandler, 
    cleanup
  );
  container.appendChild(questionSection);

  // Create options section
  const optionsSection = createOptionsSection(
    options, 
    changeHandler, 
    cleanup
  );
  container.appendChild(optionsSection);

  rootElement.appendChild(container);

  // Focus the question textarea after a brief delay
  const questionTextarea = container.querySelector('textarea') as HTMLTextAreaElement;
  if (questionTextarea) {
    focusUtils.focus(questionTextarea, 100);
  }

  // Return cleanup function
  return () => cleanup.cleanup();
};

/**
 * Create question input section
 */
const createQuestionSection = (
  initialValue: string,
  changeHandler: ChangeHandler,
  cleanup: EventCleanup
): HTMLElement => {
  const section = document.createElement("div");
  section.className = "question-section";

  // Question label
  const label = document.createElement("label");
  label.textContent = "Question:";
  label.style.cssText = styleUtils.objectToCss({
    display: "block",
    fontWeight: "bold",
    marginBottom: "4px",
    color: "#333",
  });
  section.appendChild(label);

  // Question textarea
  const textarea = document.createElement("textarea");
  textarea.value = initialValue;
  textarea.rows = 2;
  textarea.placeholder = "Enter your multiple choice question...";
  textarea.style.cssText = styleUtils.objectToCss({
    ...styleUtils.inputStyle,
    marginBottom: "12px",
    resize: "vertical",
  });

  // Event handlers for textarea
  const handleInput = () => {
    changeHandler("content", textarea.value);
  };

  const handleClick = (e: Event) => {
    e.stopPropagation();
  };

  const handleMouseDown = (e: Event) => {
    e.stopPropagation();
  };

  // Add event listeners with cleanup tracking
  cleanup.addListener(textarea, "input", handleInput);
  cleanup.addListener(textarea, "click", handleClick);
  cleanup.addListener(textarea, "mousedown", handleMouseDown);

  section.appendChild(textarea);
  return section;
};

/**
 * Create options input section
 */
const createOptionsSection = (
  initialOptions: string[],
  changeHandler: ChangeHandler,
  cleanup: EventCleanup
): HTMLElement => {
  const section = document.createElement("div");
  section.className = "options-section";

  // Options label
  const label = document.createElement("label");
  label.textContent = "Answer Options:";
  label.style.cssText = styleUtils.objectToCss({
    display: "block",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#333",
  });
  section.appendChild(label);

  // Options container
  const container = document.createElement("div");
  container.style.cssText = styleUtils.objectToCss({
    background: "white",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #e5e5e5",
  });

  // Instruction note
  const note = document.createElement("div");
  note.textContent = "Edit options directly below or use the Properties panel →";
  note.style.cssText = styleUtils.objectToCss({
    fontSize: "11px",
    color: "#666",
    marginBottom: "8px",
    fontStyle: "italic",
  });
  container.appendChild(note);

  // Create option inputs
  initialOptions.forEach((option, index) => {
    const optionWrapper = createOptionInput(
      option, 
      index, 
      initialOptions, 
      changeHandler, 
      cleanup
    );
    container.appendChild(optionWrapper);
  });

  section.appendChild(container);
  return section;
};

/**
 * Create individual option input
 */
const createOptionInput = (
  initialValue: string,
  index: number,
  allOptions: string[],
  changeHandler: ChangeHandler,
  cleanup: EventCleanup
): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = styleUtils.objectToCss({
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
  });

  // Option label (A, B, C, D)
  const label = document.createElement("span");
  label.textContent = `${generateOptionLabel(index)}. `;
  label.style.cssText = styleUtils.objectToCss({
    fontWeight: "bold",
    marginRight: "8px",
    minWidth: "24px",
  });
  wrapper.appendChild(label);

  // Option input
  const input = document.createElement("input");
  input.type = "text";
  input.value = initialValue;
  input.placeholder = `Option ${generateOptionLabel(index)}`;
  input.style.cssText = styleUtils.objectToCss({
    flex: "1",
    padding: "4px 8px",
    border: "1px solid #ccc",
    borderRadius: "2px",
    fontSize: "12px",
  });

  // Event handlers for option input
  const handleInput = () => {
    const newOptions = [...allOptions];
    newOptions[index] = input.value;
    changeHandler("options", newOptions);
  };

  const handleClick = (e: Event) => {
    e.stopPropagation();
  };

  const handleMouseDown = (e: Event) => {
    e.stopPropagation();
  };

  // Add event listeners with cleanup tracking
  cleanup.addListener(input, "input", handleInput);
  cleanup.addListener(input, "click", handleClick);
  cleanup.addListener(input, "mousedown", handleMouseDown);

  wrapper.appendChild(input);
  return wrapper;
};