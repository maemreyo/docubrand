// CREATED: 2025-07-03 - Rich editing toolbar with formatting actions

'use client';

import React from 'react';
import { EditorToolbarProps, EditorAction } from '@/types/editor';

export function EditorToolbar({
  actions,
  onAction,
  currentState,
  compact = false,
  className = ''
}: EditorToolbarProps) {
  
  // Icon components for different actions
  const getActionIcon = (action: EditorAction) => {
    switch (action) {
      case 'bold':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        );
      case 'italic':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l-2 16h4l2-16h-4z" />
          </svg>
        );
      case 'underline':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20h12" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v8a4 4 0 008 0V4" />
          </svg>
        );
      case 'heading1':
        return <span className="text-sm font-bold">H1</span>;
      case 'heading2':
        return <span className="text-sm font-bold">H2</span>;
      case 'heading3':
        return <span className="text-sm font-bold">H3</span>;
      case 'bulletList':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="3" cy="12" r="1" fill="currentColor" />
            <circle cx="3" cy="6" r="1" fill="currentColor" />
            <circle cx="3" cy="18" r="1" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h14M7 12h14M7 18h14" />
          </svg>
        );
      case 'numberedList':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h14M7 12h14M7 18h14" />
            <text x="3" y="7" className="text-xs fill-current">1</text>
            <text x="3" y="13" className="text-xs fill-current">2</text>
            <text x="3" y="19" className="text-xs fill-current">3</text>
          </svg>
        );
      case 'alignLeft':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h9" />
          </svg>
        );
      case 'alignCenter':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M7 12h10M9 18h6" />
          </svg>
        );
      case 'alignRight':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 12h12M12 18h9" />
          </svg>
        );
      case 'undo':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'redo':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        );
      case 'save':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        );
      case 'cancel':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'preview':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'fullscreen':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get action label for tooltip/accessibility
  const getActionLabel = (action: EditorAction) => {
    switch (action) {
      case 'bold': return 'Bold (Ctrl+B)';
      case 'italic': return 'Italic (Ctrl+I)';
      case 'underline': return 'Underline (Ctrl+U)';
      case 'strikethrough': return 'Strikethrough';
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'bulletList': return 'Bullet List';
      case 'numberedList': return 'Numbered List';
      case 'alignLeft': return 'Align Left';
      case 'alignCenter': return 'Align Center';
      case 'alignRight': return 'Align Right';
      case 'undo': return 'Undo (Ctrl+Z)';
      case 'redo': return 'Redo (Ctrl+Y)';
      case 'save': return 'Save (Ctrl+S)';
      case 'cancel': return 'Cancel (Esc)';
      case 'preview': return 'Toggle Preview';
      case 'fullscreen': return 'Toggle Fullscreen';
      case 'contentType': return 'Content Type';
      default: return action;
    }
  };

  // Check if action should be disabled
  const isActionDisabled = (action: EditorAction) => {
    switch (action) {
      case 'undo':
        return !currentState?.canUndo;
      case 'redo':
        return !currentState?.canRedo;
      default:
        return false;
    }
  };

  // Check if action is currently active/selected
  const isActionActive = (action: EditorAction) => {
    if (!currentState?.formatting) return false;
    
    switch (action) {
      case 'bold':
        return currentState.formatting.bold;
      case 'italic':
        return currentState.formatting.italic;
      case 'underline':
        return currentState.formatting.underline;
      case 'strikethrough':
        return currentState.formatting.strikethrough;
      default:
        return false;
    }
  };

  // Group actions for better organization
  const actionGroups = [
    ['bold', 'italic', 'underline'],
    ['heading1', 'heading2', 'heading3'],
    ['bulletList', 'numberedList'],
    ['alignLeft', 'alignCenter', 'alignRight'],
    ['undo', 'redo'],
    ['save', 'cancel'],
    ['preview', 'fullscreen']
  ];

  // Filter actions to only show what's available
  const availableGroups = actionGroups
    .map(group => group.filter(action => actions.includes(action as EditorAction)))
    .filter(group => group.length > 0);

  return (
    <div className={`
      flex items-center gap-1 p-2 bg-gray-50 border-gray-200 
      ${compact ? 'py-1' : 'py-2'} 
      ${className}
    `}>
      {availableGroups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {groupIndex > 0 && (
            <div className="w-px h-6 bg-gray-300 mx-1" />
          )}
          <div className="flex items-center gap-1">
            {group.map((action) => (
              <button
                key={action}
                onClick={() => onAction(action as EditorAction)}
                disabled={isActionDisabled(action as EditorAction)}
                title={getActionLabel(action as EditorAction)}
                className={`
                  p-2 rounded hover:bg-gray-200 transition-colors
                  ${compact ? 'p-1' : 'p-2'}
                  ${isActionActive(action as EditorAction) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}
                  ${isActionDisabled(action as EditorAction) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                `}
                aria-label={getActionLabel(action as EditorAction)}
              >
                {getActionIcon(action as EditorAction)}
              </button>
            ))}
          </div>
        </React.Fragment>
      ))}
      
      {/* Content Type Indicator */}
      {currentState?.contentType && (
        <>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <div className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-600">
            {currentState.contentType.charAt(0).toUpperCase() + currentState.contentType.slice(1)}
          </div>
        </>
      )}
    </div>
  );
}