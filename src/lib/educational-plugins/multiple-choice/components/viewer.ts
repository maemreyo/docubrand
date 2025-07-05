import { MultipleChoiceSchema } from "../../types";
import { 
  getCurrentQuestionText, 
  getCurrentOptions, 
  generateOptionLabel,
  createBaseStyles,
  styleUtils
} from "../utils";

/**
 * Viewer Component for Multiple Choice Plugin
 * Handles display-only mode (used in Viewer and Designer when not selected)
 */

export interface ViewerProps {
  rootElement: HTMLElement;
  schema: MultipleChoiceSchema;
  value?: string;
}

export const createViewerComponent = ({ 
  rootElement, 
  schema, 
  value 
}: ViewerProps): void => {
  // Clear any existing content
  rootElement.innerHTML = "";

  const questionText = getCurrentQuestionText(value, schema);
  const options = getCurrentOptions(schema);
  const baseStyles = createBaseStyles(schema);

  // Create main container
  const container = document.createElement("div");
  container.className = "multiple-choice-viewer";
  
  const containerStyles = {
    ...baseStyles,
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    background: "#f9f9f9",
  };
  
  container.style.cssText = styleUtils.objectToCss(containerStyles);

  // Create question element
  if (questionText.trim()) {
    const questionEl = document.createElement("div");
    questionEl.className = "question-text";
    questionEl.style.cssText = styleUtils.objectToCss({
      fontWeight: "bold",
      marginBottom: "8px",
    });
    questionEl.textContent = questionText;
    container.appendChild(questionEl);
  }

  // Create options elements
  const optionsContainer = document.createElement("div");
  optionsContainer.className = "options-container";
  
  options.forEach((option, index) => {
    if (option.trim()) { // Only show non-empty options
      const optionEl = document.createElement("div");
      optionEl.className = `option-item option-${index}`;
      optionEl.style.cssText = styleUtils.objectToCss({
        marginLeft: "16px",
        marginBottom: "4px",
      });
      optionEl.textContent = `${generateOptionLabel(index)}. ${option}`;
      optionsContainer.appendChild(optionEl);
    }
  });

  container.appendChild(optionsContainer);
  rootElement.appendChild(container);
};