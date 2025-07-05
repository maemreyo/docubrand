import React, { useRef, useEffect, useState } from 'react';
import { PdfmeIntegration } from '@/lib/pdfme-integration';
import { Template } from '@pdfme/common';
import { Designer } from '@pdfme/ui';
import MultipleChoiceToolbar from './MultipleChoiceToolbar';

/**
 * Enhanced Demo component for Multiple Choice Block Composers
 * 
 * This component demonstrates how to use the multiple choice block composers
 * to create and manage multiple choice questions in a template with a user-friendly UI.
 */
const MultipleChoiceBlockDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [pdfme] = useState(() => new PdfmeIntegration());
  const [template, setTemplate] = useState<Template | null>(null);
  const [blockIds, setBlockIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  // Initialize the designer
  useEffect(() => {
    if (containerRef.current && !designer) {
      // Create a blank template
      const blankTemplate = pdfme.createBlankTemplate();
      setTemplate(blankTemplate);

      // Create the designer
      const newDesigner = pdfme.createDesigner(
        containerRef.current,
        blankTemplate,
        { 
          showGrid: true,
          autoSave: true
        }
      );

      setDesigner(newDesigner);

      // Cleanup
      return () => {
        newDesigner.destroy();
      };
    }
  }, [containerRef, designer, pdfme]);

  // Update block IDs when template changes
  useEffect(() => {
    if (template) {
      const ids = pdfme.findMultipleChoiceBlocks(template);
      setBlockIds(ids);
    }
  }, [template, pdfme]);

  // Remove a question
  const handleRemoveQuestion = (groupId: string) => {
    if (!designer || !template) return;

    try {
      // Remove the question
      const updatedTemplate = pdfme.removeMultipleChoiceBlock(template, groupId);
      
      // Update the template
      setTemplate(updatedTemplate);
      
      // Update the designer
      designer.updateTemplate(updatedTemplate);
    } catch (error) {
      console.error('Failed to remove question:', error);
      alert('Error removing question');
    }
  };

  // Find all questions
  const handleFindQuestions = () => {
    if (!template) return;

    try {
      // Find all questions
      const ids = pdfme.findMultipleChoiceBlocks(template);
      setBlockIds(ids);
      alert(`Found ${ids.length} questions`);
    } catch (error) {
      console.error('Failed to find questions:', error);
      alert('Error finding questions');
    }
  };

  // Clear all questions
  const handleClearAllQuestions = () => {
    if (!designer || !template || blockIds.length === 0) return;
    
    if (window.confirm('Are you sure you want to remove all questions?')) {
      try {
        let updatedTemplate = { ...template };
        
        // Remove each question
        blockIds.forEach(groupId => {
          updatedTemplate = pdfme.removeMultipleChoiceBlock(updatedTemplate, groupId);
        });
        
        // Update the template
        setTemplate(updatedTemplate);
        
        // Update the designer
        designer.updateTemplate(updatedTemplate);
      } catch (error) {
        console.error('Failed to clear questions:', error);
        alert('Error clearing questions');
      }
    }
  };

  // Download the template
  const handleDownloadTemplate = () => {
    if (!template) return;
    
    try {
      const templateJson = JSON.stringify(template, null, 2);
      const blob = new Blob([templateJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'multiple-choice-template.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Error downloading template');
    }
  };

  return (
    <div className="multiple-choice-demo">
      <h1>Multiple Choice Block Demo</h1>
      
      <div className="tabs">
        <button 
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create Questions
        </button>
        <button 
          className={activeTab === 'manage' ? 'active' : ''}
          onClick={() => setActiveTab('manage')}
        >
          Manage Questions ({blockIds.length})
        </button>
      </div>
      
      {activeTab === 'create' && template && (
        <MultipleChoiceToolbar 
          designer={designer}
          template={template}
          onTemplateChange={setTemplate}
          pdfme={pdfme}
        />
      )}
      
      {activeTab === 'manage' && (
        <div className="management-panel">
          <div className="panel-header">
            <h3>Question Management</h3>
            <div className="action-buttons">
              <button onClick={handleFindQuestions} className="find-button">
                Refresh Question List
              </button>
              <button 
                onClick={handleClearAllQuestions} 
                className="clear-button"
                disabled={blockIds.length === 0}
              >
                Clear All Questions
              </button>
              <button 
                onClick={handleDownloadTemplate} 
                className="download-button"
              >
                Download Template
              </button>
            </div>
          </div>
          
          {blockIds.length > 0 ? (
            <div className="block-list">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Group ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blockIds.map((id, index) => (
                    <tr key={id}>
                      <td>{index + 1}</td>
                      <td>{id}</td>
                      <td>
                        <button 
                          onClick={() => handleRemoveQuestion(id)}
                          className="remove-button"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-questions">
              <p>No multiple choice questions found in the template.</p>
              <p>Switch to the "Create Questions" tab to add some!</p>
            </div>
          )}
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="designer-container"
        style={{ width: '100%', height: '600px', border: '1px solid #ccc', marginTop: '20px' }}
      />
      
      <style jsx>{`
        .multiple-choice-demo {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          color: #1890ff;
          margin-bottom: 20px;
        }
        
        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        
        .tabs button {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 16px;
          margin-right: 10px;
        }
        
        .tabs button.active {
          border-bottom: 2px solid #1890ff;
          color: #1890ff;
          font-weight: bold;
        }
        
        .management-panel {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        
        .find-button {
          background: #1890ff;
          color: white;
        }
        
        .clear-button {
          background: #ff4d4f;
          color: white;
        }
        
        .download-button {
          background: #52c41a;
          color: white;
        }
        
        button {
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background: #f0f0f0;
        }
        
        .remove-button {
          background: #ff4d4f;
          color: white;
        }
        
        .no-questions {
          text-align: center;
          padding: 30px;
          background: #fff;
          border: 1px dashed #ddd;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default MultipleChoiceBlockDemo;