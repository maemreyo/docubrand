import React, { useState } from 'react';
import { PdfmeIntegration } from '@/lib/pdfme-integration';
import { Designer } from '@pdfme/ui';
import { Template } from '@pdfme/common';

interface MultipleChoiceToolbarProps {
  designer: Designer | null;
  template: Template;
  onTemplateChange: (template: Template) => void;
  pdfme: PdfmeIntegration;
}

/**
 * Multiple Choice Question Toolbar
 * 
 * This component provides a user interface for adding multiple choice questions
 * to the canvas. It includes a form for customizing the question and choices.
 */
const MultipleChoiceToolbar: React.FC<MultipleChoiceToolbarProps> = ({
  designer,
  template,
  onTemplateChange,
  pdfme
}) => {
  // State for the question form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState(['', '', '', '']);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [width, setWidth] = useState(180);

  // Toggle the question form
  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  // Add a choice input field
  const addChoice = () => {
    if (choices.length < 8) { // Maximum 8 choices (A-H)
      setChoices([...choices, '']);
    }
  };

  // Remove a choice input field
  const removeChoice = (index: number) => {
    if (choices.length > 2) { // Minimum 2 choices
      const newChoices = [...choices];
      newChoices.splice(index, 1);
      setChoices(newChoices);
    }
  };

  // Update a choice input field
  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  // Add the question to the canvas
  const handleAddQuestion = () => {
    if (!designer || !template) return;
    
    // Validate inputs
    if (!questionText.trim()) {
      alert('Please enter a question');
      return;
    }
    
    const validChoices = choices.filter(choice => choice.trim() !== '');
    if (validChoices.length < 2) {
      alert('Please enter at least 2 choices');
      return;
    }
    
    try {
      // Create a multiple choice block
      const result = pdfme.addMultipleChoiceBlock(template, {
        position,
        questionText: questionText.trim(),
        choices: validChoices,
        width
      });
      
      // Update the template
      onTemplateChange(result.template);
      
      // Update the designer
      designer.updateTemplate(result.template);
      
      // Reset the form
      setQuestionText('');
      setChoices(['', '', '', '']);
      setIsFormOpen(false);
      
      // Show success message
      alert('Question added successfully!');
    } catch (error) {
      console.error('Failed to add question:', error);
      alert('Error adding question');
    }
  };

  // Add a preset question
  const handleAddPreset = (type: 'geography' | 'science' | 'math' | 'history') => {
    if (!designer || !template) return;
    
    try {
      // Create a preset multiple choice block
      const result = pdfme.addPresetMultipleChoiceBlock(
        template,
        type,
        position
      );
      
      // Update the template
      onTemplateChange(result.template);
      
      // Update the designer
      designer.updateTemplate(result.template);
      
      // Show success message
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} question added successfully!`);
    } catch (error) {
      console.error('Failed to add preset question:', error);
      alert('Error adding preset question');
    }
  };

  return (
    <div className="multiple-choice-toolbar">
      <div className="toolbar-header">
        <h3>Multiple Choice Questions</h3>
        <button 
          onClick={toggleForm}
          className="toggle-button"
        >
          {isFormOpen ? 'Close Form' : 'Create Custom Question'}
        </button>
      </div>
      
      {isFormOpen && (
        <div className="question-form">
          <div className="form-group">
            <label htmlFor="questionText">Question:</label>
            <textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              rows={2}
            />
          </div>
          
          <div className="form-group">
            <label>Choices:</label>
            {choices.map((choice, index) => (
              <div key={index} className="choice-input">
                <span className="choice-letter">
                  {String.fromCharCode(65 + index)}:
                </span>
                <input
                  type="text"
                  value={choice}
                  onChange={(e) => updateChoice(index, e.target.value)}
                  placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                />
                <button 
                  onClick={() => removeChoice(index)}
                  className="remove-choice"
                  disabled={choices.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button 
              onClick={addChoice}
              className="add-choice"
              disabled={choices.length >= 8}
            >
              + Add Choice
            </button>
          </div>
          
          <div className="form-group">
            <label>Position:</label>
            <div className="position-inputs">
              <div>
                <label htmlFor="posX">X:</label>
                <input
                  id="posX"
                  type="number"
                  value={position.x}
                  onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div>
                <label htmlFor="posY">Y:</label>
                <input
                  id="posY"
                  type="number"
                  value={position.y}
                  onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="width">Width:</label>
            <input
              id="width"
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={50}
            />
          </div>
          
          <button 
            onClick={handleAddQuestion}
            className="add-question"
          >
            Add Question to Canvas
          </button>
        </div>
      )}
      
      <div className="preset-buttons">
        <h4>Quick Add Presets:</h4>
        <div className="button-group">
          <button onClick={() => handleAddPreset('geography')}>
            Geography Question
          </button>
          <button onClick={() => handleAddPreset('science')}>
            Science Question
          </button>
          <button onClick={() => handleAddPreset('math')}>
            Math Question
          </button>
          <button onClick={() => handleAddPreset('history')}>
            History Question
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .multiple-choice-toolbar {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .toolbar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .toggle-button {
          background: #4a90e2;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .question-form {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        textarea, input[type="text"], input[type="number"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .choice-input {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .choice-letter {
          width: 25px;
          font-weight: bold;
        }
        
        .remove-choice {
          background: #ff4d4f;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-left: 10px;
          cursor: pointer;
        }
        
        .add-choice {
          background: #52c41a;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          margin-top: 5px;
          cursor: pointer;
        }
        
        .position-inputs {
          display: flex;
          gap: 10px;
        }
        
        .position-inputs div {
          flex: 1;
        }
        
        .add-question {
          background: #1890ff;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
        }
        
        .preset-buttons h4 {
          margin-bottom: 10px;
        }
        
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .button-group button {
          background: #722ed1;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MultipleChoiceToolbar;