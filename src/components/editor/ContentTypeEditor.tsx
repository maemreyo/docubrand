// CREATED: 2025-07-03 - Specialized editors for different content types

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ContentTypeEditorProps, ContentType } from '@/types/editor';

export function ContentTypeEditor({
  content,
  contentType,
  onChange,
  config,
  readonly = false
}: ContentTypeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  // Auto-resize textarea based on content
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [content]);

  // Calculate number of rows based on content type and length
  const getMinRows = (type: ContentType) => {
    switch (type) {
      case 'header': return 2;
      case 'instruction': return 3;
      case 'question': return 4;
      case 'rich': return 5;
      case 'markdown': return 6;
      default: return 3;
    }
  };

  // Get placeholder text based on content type
  const getPlaceholder = (type: ContentType) => {
    switch (type) {
      case 'header':
        return 'Enter section header or title...';
      case 'question':
        return 'Enter question text...\n\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\n\nCorrect Answer: A';
      case 'instruction':
        return 'Enter instructions for students...';
      case 'rich':
        return 'Enter rich text content with formatting...';
      case 'markdown':
        return '# Enter markdown content...\n\n- Use **bold** and *italic*\n- Create [links](url)\n- Add `code` blocks';
      case 'list':
        return '• Item 1\n• Item 2\n• Item 3';
      case 'code':
        return 'function example() {\n  return "Enter code here";\n}';
      default:
        return config?.placeholder || 'Enter content...';
    }
  };

  // Handle content changes with type-specific formatting
  const handleContentChange = (newContent: string) => {
    let processedContent = newContent;

    // Apply type-specific processing
    switch (contentType) {
      case 'question':
        // Auto-format question structure
        if (newContent.includes('\n') && !newContent.includes('A)')) {
          // Add basic multiple choice structure if user is creating a question
          const lines = newContent.split('\n');
          if (lines.length === 1 && lines[0].trim().endsWith('?')) {
            processedContent += '\n\nA) \nB) \nC) \nD) \n\nCorrect Answer: ';
          }
        }
        break;
      case 'header':
        // Ensure header is on single line
        processedContent = newContent.replace(/\n+/g, ' ').trim();
        break;
      case 'list':
        // Auto-format list items
        if (newContent.includes('\n')) {
          const lines = newContent.split('\n');
          processedContent = lines
            .map(line => {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.match(/^\d+\./)) {
                return '• ' + trimmed;
              }
              return line;
            })
            .join('\n');
        }
        break;
    }

    onChange(processedContent);
  };

  // Specialized editors for different content types
  const renderSpecializedEditor = () => {
    switch (contentType) {
      case 'question':
        return <QuestionEditor content={content} onChange={onChange} readonly={readonly} />;
      case 'rich':
        return <RichTextEditor content={content} onChange={onChange} readonly={readonly} />;
      case 'markdown':
        return <MarkdownEditor content={content} onChange={onChange} readonly={readonly} />;
      default:
        return null;
    }
  };

  const specializedEditor = renderSpecializedEditor();

  if (specializedEditor) {
    return specializedEditor;
  }

  // Default textarea editor for most content types
  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={getPlaceholder(contentType)}
        readOnly={readonly}
        rows={getMinRows(contentType)}
        maxLength={config?.maxLength}
        className={`
          w-full px-3 py-3 text-sm border border-gray-300 rounded-md resize-y
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${contentType === 'header' ? 'font-semibold text-lg' : ''}
          ${contentType === 'instruction' ? 'bg-yellow-50 border-yellow-300' : ''}
          ${contentType === 'code' ? 'font-mono bg-gray-50' : ''}
          ${readonly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          ${focused ? 'shadow-sm' : ''}
          transition-all duration-200
        `}
        style={{
          minHeight: `${getMinRows(contentType) * 1.5}rem`,
          fontFamily: contentType === 'code' ? 'monospace' : 'inherit'
        }}
      />
      
      {/* Character count for limited inputs */}
      {config?.maxLength && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
          {content.length}/{config.maxLength}
        </div>
      )}
      
      {/* Content type specific hints */}
      {focused && (
        <div className="mt-2 text-xs text-gray-600">
          {getContentTypeHint(contentType)}
        </div>
      )}
    </div>
  );
}

// Question Editor with structured input
function QuestionEditor({ content, onChange, readonly }: {
  content: string;
  onChange: (content: string) => void;
  readonly: boolean;
}) {
  const [parts, setParts] = useState(() => parseQuestionContent(content));

  useEffect(() => {
    // Reconstruct content when parts change
    const newContent = reconstructQuestionContent(parts);
    if (newContent !== content) {
      onChange(newContent);
    }
  }, [parts, content, onChange]);

  const updatePart = (key: string, value: string) => {
    setParts(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-3">
      {/* Question Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Question
        </label>
        <textarea
          value={parts.question}
          onChange={(e) => updatePart('question', e.target.value)}
          placeholder="Enter the question..."
          readOnly={readonly}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Answer Options
        </label>
        <div className="space-y-2">
          {['A', 'B', 'C', 'D'].map((letter) => (
            <div key={letter} className="flex items-center gap-2">
              <span className="w-6 text-sm font-medium text-gray-600">{letter})</span>
              <input
                type="text"
                value={parts[`option${letter}`] || ''}
                onChange={(e) => updatePart(`option${letter}`, e.target.value)}
                placeholder={`Option ${letter}`}
                readOnly={readonly}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Correct Answer
        </label>
        <select
          value={parts.correctAnswer}
          onChange={(e) => updatePart('correctAnswer', e.target.value)}
          disabled={readonly}
          className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select correct answer...</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>
    </div>
  );
}

// Rich Text Editor with basic formatting
function RichTextEditor({ content, onChange, readonly }: {
  content: string;
  onChange: (content: string) => void;
  readonly: boolean;
}) {
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (format: 'bold' | 'italic' | 'underline') => {
    if (!selection || readonly) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeSelection = content.substring(0, selection.start);
    const selectedText = content.substring(selection.start, selection.end);
    const afterSelection = content.substring(selection.end);

    let formattedText = selectedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
    }

    const newContent = beforeSelection + formattedText + afterSelection;
    onChange(newContent);
  };

  const handleSelectionChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      setSelection({
        start: textarea.selectionStart,
        end: textarea.selectionEnd
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      {!readonly && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
          <button
            onClick={() => applyFormatting('bold')}
            className="p-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            className="p-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => applyFormatting('underline')}
            className="p-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            title="Underline"
          >
            <u>U</u>
          </button>
        </div>
      )}

      {/* Rich Text Area */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelectionChange}
        placeholder="Enter rich text content... Use **bold**, *italic*, and <u>underline</u>"
        readOnly={readonly}
        rows={6}
        className="w-full px-3 py-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
    </div>
  );
}

// Markdown Editor with preview
function MarkdownEditor({ content, onChange, readonly }: {
  content: string;
  onChange: (content: string) => void;
  readonly: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-2">
      {/* Markdown Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded">
        <div className="text-xs text-gray-600">Markdown Editor</div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {showPreview ? (
        <div className="p-3 border border-gray-300 rounded bg-white min-h-[150px]">
          <div className="prose prose-sm max-w-none">
            {/* Simple markdown preview - in real implementation, use a markdown parser */}
            <div dangerouslySetInnerHTML={{ 
              __html: content
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                .replace(/\n/gim, '<br>')
            }} />
          </div>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="# Markdown Content&#10;&#10;Use **bold**, *italic*, and [links](url)&#10;&#10;- Create lists&#10;- With bullets"
          readOnly={readonly}
          rows={8}
          className="w-full px-3 py-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
        />
      )}
    </div>
  );
}

// Helper functions
function parseQuestionContent(content: string) {
  const lines = content.split('\n');
  const parts: Record<string, string> = {
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: ''
  };

  let currentSection = 'question';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('A)')) {
      parts.optionA = trimmed.substring(2).trim();
    } else if (trimmed.startsWith('B)')) {
      parts.optionB = trimmed.substring(2).trim();
    } else if (trimmed.startsWith('C)')) {
      parts.optionC = trimmed.substring(2).trim();
    } else if (trimmed.startsWith('D)')) {
      parts.optionD = trimmed.substring(2).trim();
    } else if (trimmed.startsWith('Correct Answer:')) {
      parts.correctAnswer = trimmed.substring(15).trim();
    } else if (currentSection === 'question' && trimmed) {
      parts.question += (parts.question ? ' ' : '') + trimmed;
    }
  }

  return parts;
}

function reconstructQuestionContent(parts: Record<string, string>) {
  let content = parts.question || '';
  
  if (parts.optionA || parts.optionB || parts.optionC || parts.optionD) {
    content += '\n\n';
    if (parts.optionA) content += `A) ${parts.optionA}\n`;
    if (parts.optionB) content += `B) ${parts.optionB}\n`;
    if (parts.optionC) content += `C) ${parts.optionC}\n`;
    if (parts.optionD) content += `D) ${parts.optionD}\n`;
  }
  
  if (parts.correctAnswer) {
    content += `\nCorrect Answer: ${parts.correctAnswer}`;
  }
  
  return content;
}

function getContentTypeHint(contentType: ContentType) {
  switch (contentType) {
    case 'question':
      return 'Structure: Question text, then A) B) C) D) options, then Correct Answer';
    case 'markdown':
      return 'Use # for headers, **bold**, *italic*, [links](url), and - for lists';
    case 'rich':
      return 'Select text and use toolbar buttons for formatting';
    case 'header':
      return 'Keep headers concise and descriptive';
    case 'instruction':
      return 'Provide clear, step-by-step instructions for students';
    case 'code':
      return 'Enter code with proper indentation and syntax';
    default:
      return 'Enter your content here';
  }
}