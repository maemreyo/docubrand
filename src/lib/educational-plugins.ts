// CREATED: 2025-07-04 - Educational pdfme plugins - FIXED VERSION

import { Plugin, Schema, PDFRenderProps, UIRenderProps, PropPanel } from '@pdfme/common';
import { text } from '@pdfme/schemas';

// Educational Schema interfaces
interface MultipleChoiceSchema extends Schema {
  type: 'multipleChoice';
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

interface TrueFalseSchema extends Schema {
  type: 'trueFalse';
  correctAnswer?: boolean;
  points?: number;
}

interface ShortAnswerSchema extends Schema {
  type: 'shortAnswer';
  expectedAnswer?: string;
  maxLength?: number;
  points?: number;
}

interface EssaySchema extends Schema {
  type: 'essay';
  wordLimit?: number;
  points?: number;
}

interface InstructionBoxSchema extends Schema {
  type: 'instructionBox';
  boxStyle?: 'simple' | 'double' | 'rounded' | 'bold';
  backgroundColor?: string;
}

/**
 * Multiple Choice Question Plugin - Fixed for v5
 */
export const multipleChoicePlugin: Plugin<MultipleChoiceSchema> = {
  pdf: (props: PDFRenderProps<MultipleChoiceSchema>) => {
    const { value, schema, pdfLib, pdfDoc, page, options } = props;
    
    // Parse input value
    let questionData;
    try {
      questionData = typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      questionData = { content: value || '', options: schema.options || [] };
    }
    
    const questionText = questionData.content || schema.content || '';
    const questionOptions = questionData.options || schema.options || [];
    
    // Build full text with options
    const fullText = [
      questionText,
      ...questionOptions.map((option: string, index: number) => 
        `${String.fromCharCode(65 + index)}. ${option}`
      )
    ].join('\n');
    
    // Use text plugin for actual rendering
    return text.pdf({
      ...props,
      value: fullText,
      schema: {
        ...schema,
        type: 'text',
        content: fullText,
      } as any
    });
  },
  
  ui: (props: UIRenderProps<MultipleChoiceSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;
    
    // Parse current value
    let currentValue;
    try {
      currentValue = typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      currentValue = { content: '', options: ['', '', '', ''] };
    }
    
    if (mode === 'viewer') {
      // Display mode - show question and options
      const questionText = currentValue.content || schema.content || '';
      const questionOptions = currentValue.options || schema.options || [];
      
      const container = document.createElement('div');
      container.className = 'multiple-choice-viewer';
      container.style.cssText = `
        font-family: ${schema.fontName || 'Arial'};
        font-size: ${schema.fontSize || 12}px;
        color: ${schema.fontColor || '#000000'};
        line-height: 1.4;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #f9f9f9;
      `;
      
      const questionEl = document.createElement('div');
      questionEl.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
      questionEl.textContent = questionText;
      container.appendChild(questionEl);
      
      questionOptions.forEach((option: string, index: number) => {
        const optionEl = document.createElement('div');
        optionEl.style.cssText = 'margin-left: 16px; margin-bottom: 4px;';
        optionEl.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
        container.appendChild(optionEl);
      });
      
      rootElement.appendChild(container);
      
    } else {
      // Edit mode - show input fields
      const container = document.createElement('div');
      container.className = 'multiple-choice-editor';
      container.style.cssText = 'padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
      
      // Question input
      const questionLabel = document.createElement('label');
      questionLabel.textContent = 'Question:';
      questionLabel.style.cssText = 'display: block; font-weight: bold; margin-bottom: 4px;';
      container.appendChild(questionLabel);
      
      const questionInput = document.createElement('textarea');
      questionInput.value = currentValue.content || '';
      questionInput.style.cssText = 'width: 100%; padding: 4px; margin-bottom: 8px; resize: vertical;';
      questionInput.rows = 2;
      questionInput.placeholder = 'Enter your question...';
      questionInput.addEventListener('input', () => {
        const newValue = {
          ...currentValue,
          content: questionInput.value
        };
        onChange && onChange({ key: 'content', value: JSON.stringify(newValue) });
      });
      container.appendChild(questionInput);
      
      // Options inputs
      const optionsLabel = document.createElement('label');
      optionsLabel.textContent = 'Options:';
      optionsLabel.style.cssText = 'display: block; font-weight: bold; margin-bottom: 4px;';
      container.appendChild(optionsLabel);
      
      const options = currentValue.options || ['', '', '', ''];
      options.forEach((option: string, index: number) => {
        const optionContainer = document.createElement('div');
        optionContainer.style.cssText = 'display: flex; align-items: center; margin-bottom: 4px;';
        
        const optionLabel = document.createElement('span');
        optionLabel.textContent = `${String.fromCharCode(65 + index)}.`;
        optionLabel.style.cssText = 'width: 20px; font-weight: bold;';
        optionContainer.appendChild(optionLabel);
        
        const optionInput = document.createElement('input');
        optionInput.type = 'text';
        optionInput.value = option;
        optionInput.style.cssText = 'flex: 1; padding: 4px; margin-left: 8px;';
        optionInput.placeholder = `Option ${String.fromCharCode(65 + index)}`;
        optionInput.addEventListener('input', () => {
          const newOptions = [...options];
          newOptions[index] = optionInput.value;
          const newValue = {
            ...currentValue,
            options: newOptions
          };
          onChange && onChange({ key: 'content', value: JSON.stringify(newValue) });
        });
        optionContainer.appendChild(optionInput);
        
        container.appendChild(optionContainer);
      });
      
      rootElement.appendChild(container);
    }
  },
  
  propPanel: {
    schema: {
      correctAnswer: {
        type: 'string',
        title: 'Correct Answer',
        enum: ['A', 'B', 'C', 'D'],
        default: 'A'
      },
      points: {
        type: 'number',
        title: 'Points',
        minimum: 0,
        default: 1
      }
    },
    defaultSchema: {
      name: 'multipleChoice',
      type: 'multipleChoice',
      content: 'What is the correct answer?',
      position: { x: 0, y: 0 },
      width: 150,
      height: 50,
      fontSize: 12,
      fontColor: '#000000',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'A',
      points: 1
    }
  }
};

/**
 * True/False Question Plugin - Fixed for v5
 */
export const trueFalsePlugin: Plugin<TrueFalseSchema> = {
  pdf: (props: PDFRenderProps<TrueFalseSchema>) => {
    const { value, schema } = props;
    
    const questionText = value || schema.content || '';
    const fullText = `${questionText}\n\n☐ True    ☐ False`;
    
    return text.pdf({
      ...props,
      value: fullText,
      schema: { ...schema, type: 'text', content: fullText } as any
    });
  },
  
  ui: (props: UIRenderProps<TrueFalseSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;
    
    const container = document.createElement('div');
    container.className = 'true-false-container';
    container.style.cssText = `
      font-family: ${schema.fontName || 'Arial'};
      font-size: ${schema.fontSize || 12}px;
      color: ${schema.fontColor || '#000000'};
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    `;
    
    if (mode === 'viewer') {
      const questionText = value || schema.content || '';
      container.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">${questionText}</div>
        <div style="margin-left: 16px;">
          <span style="margin-right: 20px;">☐ True</span>
          <span>☐ False</span>
        </div>
      `;
    } else {
      const questionInput = document.createElement('textarea');
      questionInput.value = value || schema.content || '';
      questionInput.style.cssText = 'width: 100%; padding: 4px; resize: vertical;';
      questionInput.rows = 2;
      questionInput.placeholder = 'Enter your true/false question...';
      questionInput.addEventListener('input', () => {
        onChange && onChange({ key: 'content', value: questionInput.value });
      });
      container.appendChild(questionInput);
    }
    
    rootElement.appendChild(container);
  },
  
  propPanel: {
    schema: {
      correctAnswer: {
        type: 'boolean',
        title: 'Correct Answer',
        default: true
      },
      points: {
        type: 'number',
        title: 'Points',
        minimum: 0,
        default: 1
      }
    },
    defaultSchema: {
      name: 'trueFalse',
      type: 'trueFalse',
      content: 'True or False: This is a sample question.',
      position: { x: 0, y: 0 },
      width: 150,
      height: 30,
      fontSize: 12,
      fontColor: '#000000',
      correctAnswer: true,
      points: 1
    }
  }
};

/**
 * Short Answer Plugin - Fixed for v5
 */
export const shortAnswerPlugin: Plugin<ShortAnswerSchema> = {
  pdf: (props: PDFRenderProps<ShortAnswerSchema>) => {
    const { value, schema } = props;
    
    const questionText = value || schema.content || '';
    const answerLines = '_'.repeat(50);
    const fullText = `${questionText}\n\n${answerLines}`;
    
    return text.pdf({
      ...props,
      value: fullText,
      schema: { ...schema, type: 'text', content: fullText } as any
    });
  },
  
  ui: (props: UIRenderProps<ShortAnswerSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;
    
    const container = document.createElement('div');
    container.className = 'short-answer-container';
    container.style.cssText = `
      font-family: ${schema.fontName || 'Arial'};
      font-size: ${schema.fontSize || 12}px;
      color: ${schema.fontColor || '#000000'};
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    `;
    
    if (mode === 'viewer') {
      const questionText = value || schema.content || '';
      container.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">${questionText}</div>
        <div style="margin-left: 16px; border-bottom: 1px solid #ccc; height: 24px;"></div>
      `;
    } else {
      const questionInput = document.createElement('textarea');
      questionInput.value = value || schema.content || '';
      questionInput.style.cssText = 'width: 100%; padding: 4px; resize: vertical;';
      questionInput.rows = 2;
      questionInput.placeholder = 'Enter your short answer question...';
      questionInput.addEventListener('input', () => {
        onChange && onChange({ key: 'content', value: questionInput.value });
      });
      container.appendChild(questionInput);
    }
    
    rootElement.appendChild(container);
  },
  
  propPanel: {
    schema: {
      expectedAnswer: {
        type: 'string',
        title: 'Expected Answer',
        description: 'Sample or expected answer'
      },
      maxLength: {
        type: 'number',
        title: 'Max Length',
        minimum: 10,
        default: 100
      },
      points: {
        type: 'number',
        title: 'Points',
        minimum: 0,
        default: 2
      }
    },
    defaultSchema: {
      name: 'shortAnswer',
      type: 'shortAnswer',
      content: 'What is your answer?',
      position: { x: 0, y: 0 },
      width: 150,
      height: 30,
      fontSize: 12,
      fontColor: '#000000',
      expectedAnswer: '',
      maxLength: 100,
      points: 2
    }
  }
};

/**
 * Essay Question Plugin - Fixed for v5
 */
export const essayPlugin: Plugin<EssaySchema> = {
  pdf: (props: PDFRenderProps<EssaySchema>) => {
    const { value, schema } = props;
    
    const questionText = value || schema.content || '';
    const answerSpace = Array(8).fill('_'.repeat(70)).join('\n');
    const fullText = `${questionText}\n\n${answerSpace}`;
    
    return text.pdf({
      ...props,
      value: fullText,
      schema: { ...schema, type: 'text', content: fullText } as any
    });
  },
  
  ui: (props: UIRenderProps<EssaySchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;
    
    const container = document.createElement('div');
    container.className = 'essay-container';
    container.style.cssText = `
      font-family: ${schema.fontName || 'Arial'};
      font-size: ${schema.fontSize || 12}px;
      color: ${schema.fontColor || '#000000'};
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    `;
    
    if (mode === 'viewer') {
      const questionText = value || schema.content || '';
      container.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">${questionText}</div>
        <div style="margin-left: 16px; border: 1px solid #ccc; height: 120px; padding: 8px; background: #f9f9f9;">
          Essay response area
        </div>
      `;
    } else {
      const questionInput = document.createElement('textarea');
      questionInput.value = value || schema.content || '';
      questionInput.style.cssText = 'width: 100%; padding: 4px; resize: vertical;';
      questionInput.rows = 3;
      questionInput.placeholder = 'Enter your essay question...';
      questionInput.addEventListener('input', () => {
        onChange && onChange({ key: 'content', value: questionInput.value });
      });
      container.appendChild(questionInput);
    }
    
    rootElement.appendChild(container);
  },
  
  propPanel: {
    schema: {
      wordLimit: {
        type: 'number',
        title: 'Word Limit',
        minimum: 50,
        default: 500
      },
      points: {
        type: 'number',
        title: 'Points',
        minimum: 0,
        default: 10
      }
    },
    defaultSchema: {
      name: 'essay',
      type: 'essay',
      content: 'Write a detailed essay on the following topic:',
      position: { x: 0, y: 0 },
      width: 150,
      height: 80,
      fontSize: 12,
      fontColor: '#000000',
      wordLimit: 500,
      points: 10
    }
  }
};

/**
 * Instruction Box Plugin - Fixed for v5
 */
export const instructionBoxPlugin: Plugin<InstructionBoxSchema> = {
  pdf: (props: PDFRenderProps<InstructionBoxSchema>) => {
    const { value, schema } = props;
    
    const instructionText = value || schema.content || '';
    const boxStyle = schema.boxStyle || 'simple';
    
    let boxedText = instructionText;
    
    // Add simple box styling
    if (boxStyle === 'simple') {
      const border = '─'.repeat(Math.max(instructionText.length + 4, 20));
      boxedText = `┌${border}┐\n│  ${instructionText}  │\n└${border}┘`;
    }
    
    return text.pdf({
      ...props,
      value: boxedText,
      schema: { ...schema, type: 'text', content: boxedText } as any
    });
  },
  
  ui: (props: UIRenderProps<InstructionBoxSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;
    
    const container = document.createElement('div');
    container.className = 'instruction-box-container';
    container.style.cssText = `
      font-family: ${schema.fontName || 'Arial'};
      font-size: ${schema.fontSize || 12}px;
      color: ${schema.fontColor || '#000000'};
      padding: 12px;
      border: 2px solid #007bff;
      border-radius: 8px;
      background: ${schema.backgroundColor || '#f8f9fa'};
    `;
    
    if (mode === 'viewer') {
      const instructionText = value || schema.content || '';
      container.innerHTML = `
        <div style="font-weight: bold; color: #007bff; margin-bottom: 4px;">💡 Instructions</div>
        <div>${instructionText}</div>
      `;
    } else {
      const instructionInput = document.createElement('textarea');
      instructionInput.value = value || schema.content || '';
      instructionInput.style.cssText = 'width: 100%; padding: 4px; resize: vertical; border: 1px solid #ccc;';
      instructionInput.rows = 3;
      instructionInput.placeholder = 'Enter instructions for students...';
      instructionInput.addEventListener('input', () => {
        onChange && onChange({ key: 'content', value: instructionInput.value });
      });
      container.appendChild(instructionInput);
    }
    
    rootElement.appendChild(container);
  },
  
  propPanel: {
    schema: {
      boxStyle: {
        type: 'string',
        title: 'Box Style',
        enum: ['simple', 'double', 'rounded', 'bold'],
        default: 'simple'
      },
      backgroundColor: {
        type: 'string',
        title: 'Background Color',
        default: '#f8f9fa'
      }
    },
    defaultSchema: {
      name: 'instructionBox',
      type: 'instructionBox',
      content: 'Please read these instructions carefully.',
      position: { x: 0, y: 0 },
      width: 150,
      height: 40,
      fontSize: 11,
      fontColor: '#333333',
      boxStyle: 'simple',
      backgroundColor: '#f8f9fa'
    }
  }
};

/**
 * Get all educational plugins - Fixed for v5
 */
export const getEducationalPlugins = () => {
  return {
    multipleChoice: multipleChoicePlugin,
    trueFalse: trueFalsePlugin,
    shortAnswer: shortAnswerPlugin,
    essay: essayPlugin,
    instructionBox: instructionBoxPlugin,
  };
};

/**
 * Register educational plugins with existing pdfme plugins
 */
export const registerEducationalPlugins = (existingPlugins: Record<string, any>) => {
  const educationalPlugins = getEducationalPlugins();
  
  return {
    ...existingPlugins,
    ...educationalPlugins,
  };
};

/**
 * Get plugin by question type
 */
export const getPluginByQuestionType = (questionType: string) => {
  const plugins = getEducationalPlugins();
  
  switch (questionType) {
    case 'multiple_choice':
      return plugins.multipleChoice;
    case 'true_false':
      return plugins.trueFalse;
    case 'short_answer':
      return plugins.shortAnswer;
    case 'essay':
      return plugins.essay;
    default:
      return null;
  }
};

/**
 * Validate educational plugin structure
 */
export const validateEducationalPlugin = (plugin: any): boolean => {
  return !!(
    plugin.pdf &&
    plugin.ui &&
    plugin.propPanel &&
    typeof plugin.pdf === 'function' &&
    typeof plugin.ui === 'function' &&
    typeof plugin.propPanel === 'object'
  );
};

/**
 * Get educational plugin categories
 */
export const getEducationalPluginCategories = () => {
  return {
    questions: ['multipleChoice', 'trueFalse', 'shortAnswer', 'essay'],
    layout: ['instructionBox'],
  };
};