import { UIRenderProps } from '@pdfme/common';
import { MultipleChoiceSchema, Choice } from './types';
import { 
  debounce, 
  preventEventPropagation, 
  applyEnhancedInputStyles, 
  generateId, 
  focusElementWithSelectionAtEnd,
  makeElementPlainTextContentEditable
} from './helper';

export const uiRender = (arg: UIRenderProps<MultipleChoiceSchema>) => {
  const { rootElement, schema, value, onChange, mode, theme, stopEditing } = arg;
  
  // Clear existing content first
  rootElement.innerHTML = '';
  
  const isEditable = mode === 'form' || mode === 'designer';
  
  // Create container
  const container = document.createElement('div');
  container.style.cssText = `
    width: 100%;
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
    font-family: ${schema.fontName || 'Arial'}, sans-serif;
    font-size: ${schema.fontSize || 12}px;
    color: ${schema.fontColor || '#000'};
    background: ${isEditable ? 'rgba(240, 240, 240, 0.5)' : 'transparent'};
    border: ${isEditable ? '1px dashed #ccc' : 'none'};
    overflow-y: auto;
    position: relative; /* Ensure proper stacking context */
  `;
  
  // We'll use the original onChange handler for immediate updates
  // No debounce for better responsiveness with add/remove operations
  
  if (mode === 'viewer') {
    // Viewer mode - just display the question and choices
    renderViewMode(container, schema);
  } else {
    // Editor mode - allow editing
    renderEditMode(container, schema, onChange, stopEditing);
  }
  
  rootElement.appendChild(container);
};

function renderViewMode(container: HTMLElement, schema: MultipleChoiceSchema) {
  const { question, choices, instructionText } = schema;
  
  if (instructionText) {
    const instruction = document.createElement('p');
    instruction.style.cssText = 'margin: 0 0 8px 0; font-size: 0.9em; opacity: 0.7;';
    instruction.textContent = instructionText;
    container.appendChild(instruction);
  }
  
  const questionEl = document.createElement('div');
  questionEl.style.cssText = 'font-weight: bold; margin-bottom: 12px;';
  questionEl.textContent = question || 'Question text here...';
  container.appendChild(questionEl);
  
  const choicesContainer = document.createElement('div');
  choices.forEach((choice, index) => {
    const choiceEl = document.createElement('div');
    choiceEl.style.cssText = 'margin-bottom: 8px; display: flex; align-items: center;';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.disabled = true;
    checkbox.style.marginRight = '8px';
    
    const label = document.createElement('label');
    // Ensure index is within valid range for ASCII conversion (A-Z)
    const letterIndex = Math.min(index, 25); // Limit to 0-25 (A-Z)
    label.textContent = `${String.fromCharCode(65 + letterIndex)}. ${choice.text}`;
    label.style.cursor = 'default';
    
    choiceEl.appendChild(checkbox);
    choiceEl.appendChild(label);
    choicesContainer.appendChild(choiceEl);
  });
  
  container.appendChild(choicesContainer);
}

function renderEditMode(
  container: HTMLElement, 
  schema: MultipleChoiceSchema, 
  onChange: any,
  stopEditing?: () => void
) {
  const { question, choices } = schema;
  
  // Question input
  const questionLabel = document.createElement('label');
  questionLabel.style.cssText = 'display: block; margin-bottom: 4px; font-weight: bold;';
  questionLabel.textContent = 'Question:';
  
  const questionInput = document.createElement('textarea');
  questionInput.value = question || '';
  questionInput.placeholder = 'Enter your question here...';
  questionInput.style.cssText = `
    width: 100%;
    min-height: 60px;
    padding: 8px;
    margin-bottom: 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    box-sizing: border-box;
    font-family: inherit;
    position: relative;
    z-index: 5;
  `;
  
  // Apply enhanced input styles and prevent event propagation
  applyEnhancedInputStyles(questionInput);
  preventEventPropagation(questionInput);
  makeElementPlainTextContentEditable(questionInput);
  
  // Handle input with immediate update
  questionInput.addEventListener('input', (e) => {
    const target = e.target as HTMLTextAreaElement;
    // Update immediately without debounce for better responsiveness
    onChange({ 
      key: 'question', 
      value: target.value 
    });
  });
  
  // Handle blur event
  questionInput.addEventListener('blur', () => {
    // Don't call stopEditing on blur to allow moving between fields
  });
  
  container.appendChild(questionLabel);
  container.appendChild(questionInput);
  
  // Choices section
  const choicesLabel = document.createElement('div');
  choicesLabel.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
  choicesLabel.textContent = 'Answer Choices:';
  container.appendChild(choicesLabel);
  
  const choicesContainer = document.createElement('div');
  choicesContainer.style.cssText = 'margin-bottom: 12px;';
  
  // Render existing choices
  choices.forEach((choice, index) => {
    const choiceEl = createChoiceElement(choice, index, choices, onChange);
    choicesContainer.appendChild(choiceEl);
  });
  
  container.appendChild(choicesContainer);
  
  // Add choice button
  const addButton = document.createElement('button');
  addButton.textContent = '+ Add Choice';
  addButton.style.cssText = `
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    position: relative;
    z-index: 5;
  `;
  
  // Prevent event propagation for the button
  preventEventPropagation(addButton);
  
  addButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    const newChoice: Choice = {
      id: generateId(),
      text: '',
      isCorrect: false
    };
    
    // Create a new array with the new choice
    const updatedChoices = [...choices, newChoice];
    
    // Clear the choices container
    choicesContainer.innerHTML = '';
    
    // Re-render all choices with updated indices
    updatedChoices.forEach((choice, idx) => {
      const choiceEl = createChoiceElement(choice, idx, updatedChoices, onChange);
      choicesContainer.appendChild(choiceEl);
    });
    
    // Then update the schema
    onChange({
      key: 'choices',
      value: updatedChoices
    });
    
    // Focus the new choice input immediately
    setTimeout(() => {
      const inputs = choicesContainer.querySelectorAll('input[type="text"]');
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      if (lastInput) {
        focusElementWithSelectionAtEnd(lastInput);
      }
    }, 50);
  });
  
  container.appendChild(addButton);
  
  // Focus the question input on initial render
  setTimeout(() => {
    focusElementWithSelectionAtEnd(questionInput);
  }, 50);
}

function createChoiceElement(
  choice: Choice, 
  index: number, 
  allChoices: Choice[], 
  onChange: any
): HTMLElement {
  const choiceContainer = document.createElement('div');
  choiceContainer.style.cssText = `
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    padding: 8px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    position: relative;
  `;
  
  // Correct answer checkbox
  const correctCheckbox = document.createElement('input');
  correctCheckbox.type = 'checkbox';
  correctCheckbox.checked = choice.isCorrect;
  correctCheckbox.style.cssText = `
    margin-right: 8px;
    position: relative;
    z-index: 5;
    cursor: pointer;
  `;
  correctCheckbox.title = 'Mark as correct answer';
  
  // Prevent event propagation
  preventEventPropagation(correctCheckbox);
  
  correctCheckbox.addEventListener('change', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Apply visual feedback immediately
    if (correctCheckbox.checked) {
      correctCheckbox.style.accentColor = '#4CAF50';
    } else {
      correctCheckbox.style.accentColor = '';
    }
    
    // Update the schema
    const updatedChoices = allChoices.map((c, i) => 
      i === index ? { ...c, isCorrect: correctCheckbox.checked } : c
    );
    
    // Call onChange immediately without debounce
    onChange({ key: 'choices', value: updatedChoices });
  });
  
  // Choice label
  const label = document.createElement('span');
  label.style.cssText = 'margin-right: 8px; min-width: 30px;';
  // Ensure index is within valid range for ASCII conversion (A-Z)
  const letterIndex = Math.min(index, 25); // Limit to 0-25 (A-Z)
  label.textContent = `${String.fromCharCode(65 + letterIndex)}.`;
  
  // Choice text input
  const input = document.createElement('input');
  input.type = 'text';
  input.value = choice.text;
  input.placeholder = 'Enter choice text...';
  input.style.cssText = `
    flex: 1;
    padding: 4px 8px;
    margin-right: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    position: relative;
    z-index: 5;
  `;
  
  // Apply enhanced input styles and prevent event propagation
  applyEnhancedInputStyles(input);
  preventEventPropagation(input);
  
  input.addEventListener('input', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    const target = e.target as HTMLInputElement;
    
    // Update the text immediately in the DOM
    // Ensure index is within valid range for ASCII conversion (A-Z)
    const letterIndex = Math.min(index, 25); // Limit to 0-25 (A-Z)
    label.textContent = `${String.fromCharCode(65 + letterIndex)}.`;
    
    // Update the schema
    const updatedChoices = allChoices.map((c, i) => 
      i === index ? { ...c, text: target.value } : c
    );
    onChange({ key: 'choices', value: updatedChoices });
  });
  
  // Remove button
  const removeButton = document.createElement('button');
  removeButton.textContent = '×';
  removeButton.style.cssText = `
    padding: 4px 8px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    position: relative;
    z-index: 5;
  `;
  
  // Prevent event propagation
  preventEventPropagation(removeButton);
  
  removeButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (allChoices.length > 2) {
      // Get the parent container to remove this choice element
      const parentContainer = choiceContainer.parentElement;
      
      if (parentContainer) {
        // Create a new array without the removed choice
        // Use the choice's unique ID to identify it, not just the index
        const choiceId = allChoices[index].id;
        const updatedChoices = allChoices.filter(choice => choice.id !== choiceId);
        
        // Clear the parent container
        parentContainer.innerHTML = '';
        
        // Re-render all choices with updated indices
        updatedChoices.forEach((choice, idx) => {
          const choiceEl = createChoiceElement(choice, idx, updatedChoices, onChange);
          parentContainer.appendChild(choiceEl);
        });
        
        // Update the schema
        onChange({ key: 'choices', value: updatedChoices });
      }
    } else {
      alert('A multiple choice question must have at least 2 choices.');
    }
  });
  
  choiceContainer.appendChild(correctCheckbox);
  choiceContainer.appendChild(label);
  choiceContainer.appendChild(input);
  choiceContainer.appendChild(removeButton);
  
  return choiceContainer;
}