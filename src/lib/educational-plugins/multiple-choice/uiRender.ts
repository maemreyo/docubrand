import { UIRenderProps } from '@pdfme/common';
import { MultipleChoiceSchema } from './types';
import { 
  getCurrentQuestionText,
  getCurrentOptions,
  generateOptionLabel,
  createBaseStyles,
  createChangeHandler,
  isFirefox,
} from './helper';
import { 
  CSS_CLASSES,
  UI_MODES,
  DEFAULT_QUESTION_SPACING,
  DEFAULT_OPTION_SPACING,
} from './constants';

/**
 * Main UI rendering function for Multiple Choice
 */
export const uiRender = async (arg: UIRenderProps<MultipleChoiceSchema>): Promise<void> => {
  const { rootElement, schema, value, onChange, mode, placeholder, tabIndex, stopEditing } = arg;
  
  try {
    // Clear existing content
    rootElement.innerHTML = '';
    
    // Get current content
    const questionText = getCurrentQuestionText(value, schema);
    const options = getCurrentOptions(schema);
    
    // Determine if should show placeholder
    const shouldShowPlaceholder = !questionText && placeholder && mode !== 'viewer';
    const displayText = shouldShowPlaceholder ? placeholder : questionText;
    
    // Create container
    const container = createContainer(schema, mode);
    rootElement.appendChild(container);
    
    // Render based on mode
    switch (mode) {
      case UI_MODES.VIEWER:
        renderViewer(container, displayText, options, schema);
        break;
        
      case UI_MODES.FORM:
        renderForm(container, displayText, options, schema, onChange, tabIndex);
        break;
        
      case UI_MODES.DESIGNER:
        renderDesigner(container, displayText, options, schema, onChange, tabIndex, stopEditing);
        break;
        
      default:
        console.warn(`Unknown UI mode: ${mode}`);
        renderViewer(container, displayText, options, schema);
    }
    
  } catch (error) {
    console.error('Multiple Choice UI Render Error:', error);
    renderErrorFallback(rootElement, error);
  }
};

/**
 * Create main container element
 */
const createContainer = (schema: MultipleChoiceSchema, mode: string): HTMLDivElement => {
  const container = document.createElement('div');
  const baseStyles = createBaseStyles(schema);
  
  container.className = `${CSS_CLASSES.CONTAINER} ${CSS_CLASSES.CONTAINER}-${mode}`;
  
  // Apply base styles
  Object.assign(container.style, {
    ...baseStyles,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
  });
  
  return container;
};

/**
 * Render viewer mode (read-only preview)
 */
const renderViewer = (
  container: HTMLDivElement,
  questionText: string,
  options: string[],
  schema: MultipleChoiceSchema
): void => {
  // Question section
  const questionEl = document.createElement('div');
  questionEl.className = CSS_CLASSES.QUESTION;
  questionEl.textContent = questionText;
  questionEl.style.cssText = `
    font-weight: bold;
    margin-bottom: ${schema.questionSpacing || DEFAULT_QUESTION_SPACING}px;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  container.appendChild(questionEl);
  
  // Options section
  const optionsContainer = document.createElement('div');
  optionsContainer.className = CSS_CLASSES.OPTIONS;
  
  options.forEach((option, index) => {
    if (option.trim()) {
      const optionEl = document.createElement('div');
      optionEl.className = CSS_CLASSES.OPTION;
      optionEl.style.cssText = `
        margin-bottom: ${schema.optionSpacing || DEFAULT_OPTION_SPACING}px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      `;
      
      // Option label (A., B., C., etc.)
      const labelEl = document.createElement('span');
      labelEl.className = CSS_CLASSES.OPTION_LABEL;
      labelEl.textContent = `${generateOptionLabel(index)}.`;
      labelEl.style.cssText = `
        font-weight: bold;
        min-width: 20px;
        flex-shrink: 0;
      `;
      
      // Option text
      const textEl = document.createElement('span');
      textEl.className = CSS_CLASSES.OPTION_TEXT;
      textEl.textContent = option;
      textEl.style.cssText = `
        flex: 1;
        word-wrap: break-word;
      `;
      
      optionEl.appendChild(labelEl);
      optionEl.appendChild(textEl);
      optionsContainer.appendChild(optionEl);
    }
  });
  
  container.appendChild(optionsContainer);
};

/**
 * Render form mode (user input)
 */
const renderForm = (
  container: HTMLDivElement,
  questionText: string,
  options: string[],
  schema: MultipleChoiceSchema,
  onChange?: (arg: { key: string; value: any }) => void,
  tabIndex?: number
): void => {
  // For form mode, we typically show the question and options as radio buttons
  // But since this is for design purposes, we'll show it as read-only with selection capability
  
  // Question section
  const questionEl = document.createElement('div');
  questionEl.className = CSS_CLASSES.QUESTION;
  questionEl.textContent = questionText;
  questionEl.style.cssText = `
    font-weight: bold;
    margin-bottom: ${schema.questionSpacing || DEFAULT_QUESTION_SPACING}px;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  container.appendChild(questionEl);
  
  // Options with radio buttons
  const optionsContainer = document.createElement('div');
  optionsContainer.className = CSS_CLASSES.OPTIONS;
  
  options.forEach((option, index) => {
    if (option.trim()) {
      const optionEl = document.createElement('label');
      optionEl.className = CSS_CLASSES.OPTION;
      optionEl.style.cssText = `
        margin-bottom: ${schema.optionSpacing || DEFAULT_OPTION_SPACING}px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      `;
      
      // Radio button
      const radioEl = document.createElement('input');
      radioEl.type = 'radio';
      radioEl.name = 'multiple-choice-option';
      radioEl.value = generateOptionLabel(index);
      radioEl.tabIndex = tabIndex || 0;
      
      // Option text
      const textEl = document.createElement('span');
      textEl.textContent = `${generateOptionLabel(index)}. ${option}`;
      
      optionEl.appendChild(radioEl);
      optionEl.appendChild(textEl);
      optionsContainer.appendChild(optionEl);
    }
  });
  
  container.appendChild(optionsContainer);
};

/**
 * Render designer mode (editable)
 */
const renderDesigner = (
  container: HTMLDivElement,
  questionText: string,
  options: string[],
  schema: MultipleChoiceSchema,
  onChange?: (arg: { key: string; value: any }) => void,
  tabIndex?: number,
  stopEditing?: () => void
): void => {
  const changeHandler = createChangeHandler(onChange);
  
  // Question input section
  const questionSection = document.createElement('div');
  questionSection.style.cssText = `
    margin-bottom: ${schema.questionSpacing || DEFAULT_QUESTION_SPACING}px;
  `;
  
  const questionLabel = document.createElement('label');
  questionLabel.textContent = 'Question:';
  questionLabel.style.cssText = `
    display: block;
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 12px;
    color: #666;
  `;
  
  const questionTextarea = document.createElement('textarea');
  questionTextarea.value = questionText;
  questionTextarea.placeholder = 'Enter your multiple choice question...';
  questionTextarea.rows = 2;
  questionTextarea.tabIndex = tabIndex || 0;
  questionTextarea.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: inherit;
    resize: vertical;
    box-sizing: border-box;
  `;
  
  // Question event handlers
  questionTextarea.addEventListener('input', (e) => {
    const target = e.target as HTMLTextAreaElement;
    changeHandler('content', target.value);
  });
  
  questionTextarea.addEventListener('blur', () => {
    stopEditing && stopEditing();
  });
  
  questionSection.appendChild(questionLabel);
  questionSection.appendChild(questionTextarea);
  container.appendChild(questionSection);
  
  // Options input section
  const optionsSection = document.createElement('div');
  const optionsLabel = document.createElement('label');
  optionsLabel.textContent = 'Answer Options:';
  optionsLabel.style.cssText = `
    display: block;
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 12px;
    color: #666;
  `;
  optionsSection.appendChild(optionsLabel);
  
  const optionsContainer = document.createElement('div');
  
  // Render option inputs
  options.forEach((option, index) => {
    const optionWrapper = document.createElement('div');
    optionWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    `;
    
    const optionLabel = document.createElement('span');
    optionLabel.textContent = `${generateOptionLabel(index)}.`;
    optionLabel.style.cssText = `
      font-weight: bold;
      min-width: 20px;
      font-size: 12px;
    `;
    
    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.value = option;
    optionInput.placeholder = `Option ${generateOptionLabel(index)}`;
    optionInput.style.cssText = `
      flex: 1;
      padding: 6px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: inherit;
      font-size: 12px;
    `;
    
    // Option event handlers
    optionInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const newOptions = [...options];
      newOptions[index] = target.value;
      changeHandler('options', newOptions);
    });
    
    optionInput.addEventListener('blur', () => {
      stopEditing && stopEditing();
    });
    
    optionWrapper.appendChild(optionLabel);
    optionWrapper.appendChild(optionInput);
    optionsContainer.appendChild(optionWrapper);
  });
  
  optionsSection.appendChild(optionsContainer);
  container.appendChild(optionsSection);
  
  // Focus the question textarea
  setTimeout(() => {
    questionTextarea.focus();
    questionTextarea.setSelectionRange(questionText.length, questionText.length);
  }, 50);
};

/**
 * Handle Firefox-specific contentEditable issues
 */
const makeElementPlainTextContentEditable = (element: HTMLElement): void => {
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
 * Map vertical alignment to CSS flexbox values
 */
const mapVerticalAlignToFlex = (verticalAlign: string): string => {
  switch (verticalAlign) {
    case 'top':
      return 'flex-start';
    case 'middle':
      return 'center';
    case 'bottom':
      return 'flex-end';
    default:
      return 'flex-start';
  }
};

/**
 * Get background color with transparency handling
 */
const getBackgroundColor = (schema: MultipleChoiceSchema): string => {
  if (!schema.backgroundColor || schema.backgroundColor === 'transparent') {
    return 'transparent';
  }
  return schema.backgroundColor;
};

/**
 * Render error fallback
 */
const renderErrorFallback = (rootElement: HTMLElement, error: any): void => {
  rootElement.innerHTML = '';
  
  const errorEl = document.createElement('div');
  errorEl.style.cssText = `
    padding: 8px;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c66;
    font-size: 12px;
  `;
  errorEl.textContent = `Error rendering multiple choice: ${error.message || 'Unknown error'}`;
  
  rootElement.appendChild(errorEl);
};