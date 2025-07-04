// Educational content plugins for specialized educational document types

import { 
  TemplatePlugin, 
  DocuBrandSchema, 
  DataTransformer, 
  TransformerContext 
} from '../types/template-types';

/**
 * Question Block Plugin
 * Handles different types of questions (multiple choice, true/false, fill-in-blank, essay)
 */
export const questionBlockPlugin: TemplatePlugin = {
  id: 'question-block',
  name: 'Question Block',
  version: '1.0.0',
  description: 'Specialized plugin for educational questions with multiple formats',
  
  capabilities: {
    schemas: ['question', 'multiple-choice', 'true-false', 'fill-blank', 'essay'],
    generators: ['question-numbering', 'option-formatting'],
    validators: ['question-completeness', 'answer-validation'],
    transformers: ['question-formatter', 'option-processor']
  },
  
  registerSchemas: () => ({
    question: {
      pdf: (value: any, args: any) => {
        const { schema, options, _context } = args;
        
        // Generate question text with automatic numbering
        const questionNumber = schema.questionNumber || 1;
        const questionText = `${questionNumber}. ${value.content || value}`;
        
        return {
          type: 'text',
          value: questionText,
          ...getQuestionStyles(schema.questionType || 'general'),
          fontSize: schema.fontSize || 12,
          fontWeight: schema.fontWeight || 'normal',
          textAlign: schema.textAlign || 'left'
        };
      },
      
      ui: {
        viewer: ({ value, schema, onChange }) => {
          const content = typeof value === 'string' ? value : value?.content || '';
          const questionNumber = schema.questionNumber || 1;
          
          return `
            <div class="question-block" style="margin-bottom: 10px;">
              <div class="question-number" style="font-weight: bold; color: #666; margin-bottom: 5px;">
                Question ${questionNumber}
              </div>
              <div class="question-content" style="line-height: 1.4;">
                ${content}
              </div>
            </div>
          `;
        },
        
        form: ({ value, schema, onChange }) => {
          const content = typeof value === 'string' ? value : value?.content || '';
          
          return `
            <div class="question-form">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                Question Content
              </label>
              <textarea
                value="${content}"
                onchange="onChange(this.value)"
                style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                placeholder="Enter question content..."
              />
            </div>
          `;
        },
        
        designer: ({ value, schema, onChange }) => {
          const content = typeof value === 'string' ? value : value?.content || '';
          
          return `
            <div class="question-designer">
              <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Question Type
                </label>
                <select
                  value="${schema.questionType || 'general'}"
                  onchange="onChange({...value, questionType: this.value})"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                >
                  <option value="general">General Question</option>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="fill-blank">Fill in the Blank</option>
                  <option value="essay">Essay Question</option>
                </select>
              </div>
              
              <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Question Content
                </label>
                <textarea
                  value="${content}"
                  onchange="onChange({...value, content: this.value})"
                  style="width: 100%; min-height: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                  placeholder="Enter question content..."
                />
              </div>
              
              <div style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                    Points
                  </label>
                  <input
                    type="number"
                    value="${schema.points || 1}"
                    onchange="onChange({...value, points: parseInt(this.value)})"
                    style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div style="flex: 1;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                    Difficulty
                  </label>
                  <select
                    value="${schema.difficulty || 'medium'}"
                    onchange="onChange({...value, difficulty: this.value})"
                    style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          `;
        }
      },
      
      propPanel: {
        schema: {
          type: 'object',
          properties: {
            questionType: {
              type: 'string',
              title: 'Question Type',
              enum: ['general', 'multiple-choice', 'true-false', 'fill-blank', 'essay'],
              enumNames: ['General', 'Multiple Choice', 'True/False', 'Fill in Blank', 'Essay']
            },
            points: {
              type: 'number',
              title: 'Points',
              minimum: 1,
              maximum: 100,
              default: 1
            },
            difficulty: {
              type: 'string',
              title: 'Difficulty',
              enum: ['easy', 'medium', 'hard'],
              enumNames: ['Easy', 'Medium', 'Hard']
            },
            showAnswerSpace: {
              type: 'boolean',
              title: 'Show Answer Space',
              default: true
            },
            answerLines: {
              type: 'number',
              title: 'Answer Lines',
              minimum: 1,
              maximum: 20,
              default: 3
            }
          }
        },
        defaultSchema: {
          questionType: 'general',
          points: 1,
          difficulty: 'medium',
          showAnswerSpace: true,
          answerLines: 3
        }
      }
    },
    
    'multiple-choice': {
      pdf: (value: any, args: any) => {
        const { schema, _options, _context } = args;
        
        const question = value.question || value.content || '';
        const options = value.options || [];
        const questionNumber = schema.questionNumber || 1;
        
        let content = `${questionNumber}. ${question}\n\n`;
        
        options.forEach((option: string, index: number) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D...
          content += `${letter}. ${option}\n`;
        });
        
        return {
          type: 'text',
          value: content,
          fontSize: schema.fontSize || 12,
          fontWeight: schema.fontWeight || 'normal',
          textAlign: schema.textAlign || 'left'
        };
      },
      
      ui: {
        viewer: ({ value, schema, onChange }) => {
          const question = value.question || value.content || '';
          const options = value.options || [];
          const questionNumber = schema.questionNumber || 1;
          
          const optionsHtml = options.map((option: string, index: number) => {
            const letter = String.fromCharCode(65 + index);
            return `<div style="margin: 5px 0; padding-left: 20px;">${letter}. ${option}</div>`;
          }).join('');
          
          return `
            <div class="multiple-choice-block" style="margin-bottom: 15px;">
              <div class="question-number" style="font-weight: bold; color: #666; margin-bottom: 5px;">
                Question ${questionNumber}
              </div>
              <div class="question-content" style="line-height: 1.4; margin-bottom: 10px;">
                ${question}
              </div>
              <div class="options">
                ${optionsHtml}
              </div>
            </div>
          `;
        },
        
        form: ({ value, schema, onChange }) => {
          const question = value.question || value.content || '';
          const options = value.options || ['', '', '', ''];
          
          const optionsHtml = options.map((option: string, index: number) => {
            const letter = String.fromCharCode(65 + index);
            return `
              <div style="margin-bottom: 8px;">
                <label style="display: block; margin-bottom: 3px; font-weight: bold;">
                  Option ${letter}
                </label>
                <input
                  type="text"
                  value="${option}"
                  onchange="updateOption(${index}, this.value)"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                  placeholder="Enter option ${letter}..."
                />
              </div>
            `;
          }).join('');
          
          return `
            <div class="multiple-choice-form">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Question
                </label>
                <textarea
                  value="${question}"
                  onchange="onChange({...value, question: this.value})"
                  style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                  placeholder="Enter question..."
                />
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                  Options
                </label>
                ${optionsHtml}
              </div>
              
              <script>
                function updateOption(index, value) {
                  const newOptions = [...options];
                  newOptions[index] = value;
                  onChange({...value, options: newOptions});
                }
              </script>
            </div>
          `;
        }
      }
    }
  }),
  
  registerTransformers: () => ({
    'question-formatter': questionFormatterTransformer,
    'option-processor': optionProcessorTransformer
  }),
  
  registerValidators: () => ({
    'question-completeness': validateQuestionCompleteness,
    'answer-validation': validateAnswerFormat
  })
};

/**
 * Answer Sheet Plugin
 * Creates structured answer sheets for quizzes and exams
 */
export const answerSheetPlugin: TemplatePlugin = {
  id: 'answer-sheet',
  name: 'Answer Sheet',
  version: '1.0.0',
  description: 'Creates structured answer sheets for educational assessments',
  
  capabilities: {
    schemas: ['answer-sheet', 'bubble-sheet', 'written-answer'],
    generators: ['answer-grid', 'bubble-generator'],
    validators: ['answer-format'],
    transformers: ['answer-formatter']
  },
  
  registerSchemas: () => ({
    'answer-sheet': {
      pdf: (value: any, args: any) => {
        const { schema, options, _context } = args;
        
        const questionCount = value.questionCount || 20;
        const columns = value.columns || 2;
        const answerType = value.answerType || 'line';
        
        if (answerType === 'bubble') {
          return generateBubbleSheet(questionCount, columns, schema);
        } else {
          return generateLineAnswerSheet(questionCount, columns, schema);
        }
      },
      
      ui: {
        viewer: ({ value, schema, onChange }) => {
          const questionCount = value.questionCount || 20;
          const answerType = value.answerType || 'line';
          
          return `
            <div class="answer-sheet-preview" style="border: 1px solid #ddd; padding: 15px; background: #f9f9f9;">
              <h3 style="margin: 0 0 15px 0; text-align: center;">Answer Sheet</h3>
              <div style="text-align: center; margin-bottom: 10px;">
                <strong>Questions: ${questionCount}</strong> | 
                <strong>Type: ${answerType === 'bubble' ? 'Bubble Sheet' : 'Written Answers'}</strong>
              </div>
              ${answerType === 'bubble' ? generateBubblePreview(questionCount) : generateLinePreview(questionCount)}
            </div>
          `;
        },
        
        designer: ({ value, schema, onChange }) => {
          const questionCount = value.questionCount || 20;
          const columns = value.columns || 2;
          const answerType = value.answerType || 'line';
          
          return `
            <div class="answer-sheet-designer">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Answer Type
                </label>
                <select
                  value="${answerType}"
                  onchange="onChange({...value, answerType: this.value})"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                >
                  <option value="line">Line Answers</option>
                  <option value="bubble">Bubble Sheet</option>
                  <option value="box">Box Answers</option>
                </select>
              </div>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value="${questionCount}"
                  onchange="onChange({...value, questionCount: parseInt(this.value)})"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                  min="1"
                  max="200"
                />
              </div>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Columns
                </label>
                <select
                  value="${columns}"
                  onchange="onChange({...value, columns: parseInt(this.value)})"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                >
                  <option value="1">1 Column</option>
                  <option value="2">2 Columns</option>
                  <option value="3">3 Columns</option>
                  <option value="4">4 Columns</option>
                </select>
              </div>
              
              ${answerType === 'bubble' ? `
                <div style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                    Options per Question
                  </label>
                  <select
                    value="${value.optionsPerQuestion || 4}"
                    onchange="onChange({...value, optionsPerQuestion: parseInt(this.value)})"
                    style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                  >
                    <option value="2">2 Options (A, B)</option>
                    <option value="3">3 Options (A, B, C)</option>
                    <option value="4">4 Options (A, B, C, D)</option>
                    <option value="5">5 Options (A, B, C, D, E)</option>
                  </select>
                </div>
              ` : ''}
            </div>
          `;
        }
      }
    }
  })
};

/**
 * Instruction Block Plugin
 * Handles instructional content with special formatting
 */
export const instructionBlockPlugin: TemplatePlugin = {
  id: 'instruction-block',
  name: 'Instruction Block',
  version: '1.0.0',
  description: 'Specialized formatting for instructional content',
  
  capabilities: {
    schemas: ['instruction', 'directions', 'note', 'warning'],
    generators: ['instruction-formatting'],
    validators: ['instruction-clarity'],
    transformers: ['instruction-processor']
  },
  
  registerSchemas: () => ({
    instruction: {
      pdf: (value: any, args: any) => {
        const { schema, options, _context } = args;
        
        const content = value.content || value;
        const instructionType = schema.instructionType || 'general';
        const icon = getInstructionIcon(instructionType);
        
        return {
          type: 'text',
          value: `${icon} ${content}`,
          ...getInstructionStyles(instructionType),
          fontSize: schema.fontSize || 11,
          fontStyle: schema.fontStyle || 'italic'
        };
      },
      
      ui: {
        viewer: ({ value, schema, onChange }) => {
          const content = value.content || value;
          const instructionType = schema.instructionType || 'general';
          const styles = getInstructionUIStyles(instructionType);
          
          return `
            <div class="instruction-block" style="${styles.container}">
              <div class="instruction-icon" style="${styles.icon}">
                ${getInstructionIcon(instructionType)}
              </div>
              <div class="instruction-content" style="${styles.content}">
                ${content}
              </div>
            </div>
          `;
        },
        
        designer: ({ value, schema, onChange }) => {
          const content = value.content || value;
          const instructionType = schema.instructionType || 'general';
          
          return `
            <div class="instruction-designer">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Instruction Type
                </label>
                <select
                  value="${instructionType}"
                  onchange="onChange({...value, instructionType: this.value})"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"
                >
                  <option value="general">General Instruction</option>
                  <option value="directions">Directions</option>
                  <option value="note">Note</option>
                  <option value="warning">Warning</option>
                  <option value="tip">Tip</option>
                  <option value="important">Important</option>
                </select>
              </div>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                  Instruction Content
                </label>
                <textarea
                  value="${content}"
                  onchange="onChange({...value, content: this.value})"
                  style="width: 100%; min-height: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                  placeholder="Enter instruction content..."
                />
              </div>
            </div>
          `;
        }
      }
    }
  })
};

/**
 * Helper functions
 */
function getQuestionStyles(questionType: string) {
  switch (questionType) {
    case 'multiple-choice':
      return {
        fontWeight: 'normal',
        textAlign: 'left',
        marginBottom: 5
      };
    case 'true-false':
      return {
        fontWeight: 'normal',
        textAlign: 'left',
        marginBottom: 3
      };
    case 'essay':
      return {
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 10
      };
    default:
      return {
        fontWeight: 'normal',
        textAlign: 'left',
        marginBottom: 5
      };
  }
}

function getInstructionIcon(type: string): string {
  switch (type) {
    case 'directions': return '📋';
    case 'note': return '📝';
    case 'warning': return '⚠️';
    case 'tip': return '💡';
    case 'important': return '❗';
    default: return '📖';
  }
}

function getInstructionStyles(type: string) {
  switch (type) {
    case 'warning':
      return {
        color: '#d97706',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        padding: 8
      };
    case 'note':
      return {
        color: '#1e40af',
        backgroundColor: '#dbeafe',
        border: '1px solid #3b82f6',
        padding: 8
      };
    case 'important':
      return {
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        border: '1px solid #ef4444',
        padding: 8
      };
    default:
      return {
        color: '#374151',
        backgroundColor: '#f9fafb',
        border: '1px solid #d1d5db',
        padding: 8
      };
  }
}

function getInstructionUIStyles(type: string) {
  const baseStyles = {
    container: 'display: flex; align-items: flex-start; gap: 8px; padding: 12px; border-radius: 6px; margin: 8px 0;',
    icon: 'flex-shrink: 0; font-size: 16px;',
    content: 'flex: 1; font-style: italic; line-height: 1.4;'
  };
  
  switch (type) {
    case 'warning':
      return {
        ...baseStyles,
        container: baseStyles.container + ' background-color: #fef3c7; border: 1px solid #f59e0b;',
        content: baseStyles.content + ' color: #d97706;'
      };
    case 'note':
      return {
        ...baseStyles,
        container: baseStyles.container + ' background-color: #dbeafe; border: 1px solid #3b82f6;',
        content: baseStyles.content + ' color: #1e40af;'
      };
    case 'important':
      return {
        ...baseStyles,
        container: baseStyles.container + ' background-color: #fee2e2; border: 1px solid #ef4444;',
        content: baseStyles.content + ' color: #dc2626;'
      };
    default:
      return {
        ...baseStyles,
        container: baseStyles.container + ' background-color: #f9fafb; border: 1px solid #d1d5db;',
        content: baseStyles.content + ' color: #374151;'
      };
  }
}

function generateBubbleSheet(questionCount: number, columns: number, schema: any) {
  // Implementation for bubble sheet generation
  return {
    type: 'text',
    value: `Bubble Sheet - ${questionCount} questions in ${columns} columns`,
    fontSize: 10
  };
}

function generateLineAnswerSheet(questionCount: number, columns: number, schema: any) {
  // Implementation for line answer sheet generation
  return {
    type: 'text',
    value: `Answer Sheet - ${questionCount} questions with lines`,
    fontSize: 10
  };
}

function generateBubblePreview(questionCount: number): string {
  let preview = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">';
  
  for (let i = 1; i <= Math.min(questionCount, 8); i++) {
    preview += `
      <div style="display: flex; align-items: center; gap: 5px;">
        <span style="font-weight: bold; width: 20px;">${i}.</span>
        <span>Ⓐ Ⓑ Ⓒ Ⓓ</span>
      </div>
    `;
  }
  
  if (questionCount > 8) {
    preview += `<div style="grid-column: 1 / -1; text-align: center; color: #666;">... and ${questionCount - 8} more</div>`;
  }
  
  preview += '</div>';
  return preview;
}

function generateLinePreview(questionCount: number): string {
  let preview = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">';
  
  for (let i = 1; i <= Math.min(questionCount, 8); i++) {
    preview += `
      <div style="display: flex; align-items: center; gap: 5px;">
        <span style="font-weight: bold; width: 20px;">${i}.</span>
        <span style="border-bottom: 1px solid #ccc; flex: 1; height: 20px;"></span>
      </div>
    `;
  }
  
  if (questionCount > 8) {
    preview += `<div style="grid-column: 1 / -1; text-align: center; color: #666;">... and ${questionCount - 8} more</div>`;
  }
  
  preview += '</div>';
  return preview;
}

/**
 * Data transformers
 */
const questionFormatterTransformer: DataTransformer = (value: any, context: TransformerContext) => {
  if (typeof value === 'string') {
    return value;
  }
  
  if (value && typeof value === 'object') {
    const questionNumber = context.schema.questionNumber || 1;
    const content = value.content || value.question || '';
    
    return `${questionNumber}. ${content}`;
  }
  
  return value;
};

const optionProcessorTransformer: DataTransformer = (value: any, context: TransformerContext) => {
  if (Array.isArray(value)) {
    return value.map((option: string, index: number) => {
      const letter = String.fromCharCode(65 + index);
      return `${letter}. ${option}`;
    }).join('\n');
  }
  
  return value;
};

/**
 * Validators
 */
function validateQuestionCompleteness(value: any, schema: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (value && typeof value === 'object') {
    const content = value.content || value.question || '';
    return content.trim().length > 0;
  }
  
  return false;
}

function validateAnswerFormat(value: any, schema: any): boolean {
  if (schema.questionType === 'multiple-choice') {
    return value.options && Array.isArray(value.options) && value.options.length >= 2;
  }
  
  return true;
}

/**
 * Export all plugins
 */
export const educationalContentPlugins = [
  questionBlockPlugin,
  answerSheetPlugin,
  instructionBlockPlugin
];

export default educationalContentPlugins;