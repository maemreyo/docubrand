// CREATED: 2025-07-03 - Enhanced SectionEditor with rich editing capabilities

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  SectionEditorProps, 
  EditorConfig, 
  KeyboardShortcut,
  ContentType,
  DEFAULT_EDITOR_CONFIG
} from '@/types/editor';
import { EditorToolbar } from './EditorToolbar';
import { ContentTypeEditor } from './ContentTypeEditor';
import { useEditorHistory } from './hooks/useEditorHistory';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function SectionEditor({
  section,
  onUpdate,
  onDelete,
  config = {},
  isActive = false,
  onActivate,
  readonly = false,
  autoFocus = false,
  showStats = true,
  showPreview = false,
  onSave,
  onCancel,
  onValidation
}: SectionEditorProps) {
  // Merge config with defaults
  const editorConfig = useMemo<EditorConfig>(() => ({
    ...DEFAULT_EDITOR_CONFIG,
    ...config
  }), [config]);

  // Editor state
  const [isEditing, setIsEditing] = useState(section.isEditing || false);
  const [content, setContent] = useState(section.content);
  const [contentType, setContentType] = useState<ContentType>(
    (section.type as ContentType) || 'text'
  );
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreviewMode, setShowPreviewMode] = useState(showPreview);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Custom hooks
  const { 
    pushState, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useEditorHistory({
    initialContent: content,
    maxSize: 50
  });

  const { saveStatus, lastSaved } = useAutoSave({
    content,
    enabled: editorConfig.autoSave?.enabled,
    interval: editorConfig.autoSave?.interval,
    onSave: handleAutoSave
  });

  // Keyboard shortcuts
  const shortcuts = useMemo<KeyboardShortcut[]>(() => [
    ...editorConfig.keyboard?.shortcuts || [],
    { 
      key: 'Enter', 
      action: () => setIsEditing(true), 
      description: 'Start editing' 
    },
    { 
      key: 'Escape', 
      // action: handleCancel, 
      action: () => {}, 
      description: 'Cancel editing' 
    }
  ], [editorConfig.keyboard?.shortcuts]);

  useKeyboardShortcuts(shortcuts, isEditing && editorConfig.keyboard?.enabled);

  // Auto-save handler
  async function handleAutoSave(content: string) {
    if (onSave) {
      await onSave(content);
    }
    // Update section with auto-save
    updateSection({ content, lastModified: Date.now() });
  }

  // Content validation
  const validateContent = useCallback((newContent: string) => {
    const rules = editorConfig.validation?.rules || [];
    const errors: string[] = [];

    rules.forEach(rule => {
      switch (rule.type) {
        case 'required':
          if (!newContent.trim()) {
            errors.push(rule.message);
          }
          break;
        case 'minLength':
          if (newContent.length < rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'maxLength':
          if (newContent.length > rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'pattern':
          if (!new RegExp(rule.value).test(newContent)) {
            errors.push(rule.message);
          }
          break;
        case 'custom':
          if (rule.validator && !rule.validator(newContent)) {
            errors.push(rule.message);
          }
          break;
      }
    });

    return errors;
  }, [editorConfig.validation?.rules]);

  // Update section helper
  const updateSection = useCallback((updates: Partial<typeof section>) => {
    const updatedSection = {
      ...section,
      ...updates,
      isDirty: true,
      lastModified: Date.now(),
      wordCount: updates.content ? updates.content.trim().split(/\s+/).length : section.wordCount,
      characterCount: updates.content ? updates.content.length : section.characterCount
    };
    onUpdate(updatedSection);
  }, [section, onUpdate]);

  // Content change handler
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);

    // Push to history for undo/redo
    pushState({
      content: newContent,
      contentType,
      timestamp: Date.now()
    });

    // Real-time validation
    if (editorConfig.validation?.realTime) {
      const errors = validateContent(newContent);
      setValidationErrors(errors);
      onValidation?.(errors);
    }

    // Update section
    updateSection({ content: newContent });
  }, [contentType, pushState, editorConfig.validation?.realTime, validateContent, onValidation, updateSection]);

  // Content type change handler
  const handleContentTypeChange = useCallback((newType: ContentType) => {
    setContentType(newType);
    updateSection({ 
      type: newType,
      content: content // Keep existing content
    });
  }, [content, updateSection]);

  // Editor actions
  const handleSave = useCallback(async () => {
    const errors = validateContent(content);
    if (errors.length > 0) {
      setValidationErrors(errors);
      onValidation?.(errors);
      return;
    }

    setIsEditing(false);
    setIsDirty(false);
    updateSection({ 
      content, 
      type: contentType,
      isEditing: false,
      validationErrors: [],
      isValid: true
    });
    
    if (onSave) {
      await onSave(content);
    }
  }, [content, contentType, validateContent, onValidation, updateSection, onSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setContent(section.content);
    setContentType((section.type as ContentType) || 'text');
    setIsDirty(false);
    setValidationErrors([]);
    onCancel?.();
  }, [section.content, section.type, onCancel]);

  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setContent(state.content);
      setContentType(state.contentType);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setContent(state.content);
      setContentType(state.contentType);
    }
  }, [redo]);

  // Toolbar action handler
  const handleToolbarAction = useCallback((action: string) => {
    switch (action) {
      case 'save':
        handleSave();
        break;
      case 'cancel':
        handleCancel();
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'preview':
        setShowPreviewMode(!showPreviewMode);
        break;
      case 'fullscreen':
        // Toggle fullscreen editing mode
        if (containerRef.current) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            containerRef.current.requestFullscreen();
          }
        }
        break;
      default:
        // Handle other formatting actions
        console.log('Toolbar action:', action);
    }
  }, [handleSave, handleCancel, handleUndo, handleRedo, showPreviewMode]);

  // Focus management
  useEffect(() => {
    if (isEditing && autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isEditing, autoFocus]);

  // Activate on click
  const handleClick = useCallback(() => {
    if (!isActive && onActivate) {
      onActivate();
    }
  }, [isActive, onActivate]);

  // Get type color for visual distinction
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'header': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'question': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'instruction': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rich': return 'bg-green-100 text-green-800 border-green-200';
      case 'markdown': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Content preview for collapsed state
  const getContentPreview = (content: string, maxLength = 100) => {
    if (!content.trim()) return 'Empty content';
    const trimmed = content.trim();
    return trimmed.length > maxLength ? `${trimmed.substring(0, maxLength)}...` : trimmed;
  };

  return (
    <div
      ref={containerRef}
      className={`
        border rounded-lg overflow-hidden transition-all duration-200 bg-white
        ${isActive ? 'border-blue-400 shadow-sm ring-1 ring-blue-200' : 'border-gray-200'}
        ${isEditing ? 'border-blue-500 shadow-md' : ''}
        ${readonly ? 'opacity-75' : 'hover:border-gray-300'}
      `}
      onClick={handleClick}
    >
      {/* Section Header */}
      <div className={`
        px-4 py-3 border-b border-gray-100 
        ${isEditing ? 'bg-blue-50' : 'bg-gray-50'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Section Type Badge */}
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full border
              ${getTypeColor(contentType)}
            `}>
              {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </span>
            
            {/* Section Meta Info */}
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>#{section.id.split('_').pop()}</span>
              {section.position && (
                <span>Page {section.position.page}</span>
              )}
            </div>
            
            {/* Dirty indicator */}
            {isDirty && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Unsaved changes" />
            )}
            
            {/* Auto-save status */}
            {saveStatus === 'saving' && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  disabled={readonly}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Edit
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={validationErrors.length > 0}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {validationErrors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}
      </div>
      
      {/* Editor Toolbar */}
      {isEditing && editorConfig.toolbar?.enabled && (
        <EditorToolbar
          actions={editorConfig.toolbar.actions}
          onAction={handleToolbarAction}
          currentState={{
            contentType,
            formatting: {},
            canUndo,
            canRedo
          }}
          compact={editorConfig.toolbar.compact}
          className="border-b border-gray-100"
        />
      )}
      
      {/* Content Area */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            {/* Content Type Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Content Type:
              </label>
              <select
                value={contentType}
                onChange={(e) => handleContentTypeChange(e.target.value as ContentType)}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="text">Plain Text</option>
                <option value="rich">Rich Text</option>
                <option value="markdown">Markdown</option>
                <option value="question">Question</option>
                <option value="header">Header</option>
                <option value="instruction">Instruction</option>
              </select>
            </div>
            
            {/* Content Editor */}
            <ContentTypeEditor
              content={content}
              contentType={contentType}
              onChange={handleContentChange}
              config={editorConfig}
              readonly={readonly}
            />
            
            {/* Editor Stats */}
            {showStats && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span>{content.length} characters</span>
                  <span>{content.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span>{content.split('\n').length} lines</span>
                </div>
                <div className="flex items-center gap-2">
                  {lastSaved && (
                    <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                  )}
                  <span>
                    {canUndo ? 'Can undo' : ''} {canRedo ? 'Can redo' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Preview Mode
          <div className="min-h-[60px]">
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {getContentPreview(content, 300)}
            </div>
            {content.length > 300 && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700"
              >
                Show more...
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}