// CREATED: 2025-07-04 - Professional toolbar for template designer actions

'use client';

import React, { useState, useCallback } from 'react';
import { 
  Save, 
  Eye, 
  Download, 
  Share2, 
  Settings, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Edit3
} from 'lucide-react';

interface DesignerToolbarProps {
  templateName: string;
  isReady: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  isDirty: boolean;
  lastAutoSave: number | null;
  lastSaved: number | null;
  onSave?: () => void;
  onPreview?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onNameChange?: (name: string) => void;
  className?: string;
}

export function DesignerToolbar({
  templateName,
  isReady,
  isSaving,
  isGenerating,
  isDirty,
  lastAutoSave,
  lastSaved,
  onSave,
  onPreview,
  onExport,
  onShare,
  onSettings,
  onNameChange,
  className = ''
}: DesignerToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(templateName);

  // Handle name editing
  const handleStartEdit = useCallback(() => {
    setEditName(templateName);
    setIsEditingName(true);
  }, [templateName]);

  const handleSaveName = useCallback(() => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== templateName) {
      onNameChange?.(trimmedName);
    }
    setIsEditingName(false);
  }, [editName, templateName, onNameChange]);

  const handleCancelEdit = useCallback(() => {
    setEditName(templateName);
    setIsEditingName(false);
  }, [templateName]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveName, handleCancelEdit]);

  // Format timestamp for display
  const formatTime = useCallback((timestamp: number | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  // Get status info
  const getStatusInfo = useCallback(() => {
    if (!isReady) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Loading...',
        className: 'text-gray-500'
      };
    }
    
    if (isSaving) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Saving...',
        className: 'text-blue-600'
      };
    }
    
    if (isDirty) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Unsaved changes',
        className: 'text-amber-600'
      };
    }
    
    return {
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'Saved',
      className: 'text-green-600'
    };
  }, [isReady, isSaving, isDirty]);

  const status = getStatusInfo();

  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left section - Template name and status */}
        <div className="flex items-center gap-4">
          {/* Template name */}
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            {isEditingName ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                className="text-lg font-semibold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none min-w-0"
                autoFocus
              />
            ) : (
              <button
                onClick={handleStartEdit}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1 group"
              >
                {templateName}
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-1.5 text-sm ${status.className}`}>
            {status.icon}
            <span>{status.text}</span>
          </div>

          {/* Last saved time */}
          {(lastSaved || lastAutoSave) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {lastSaved ? `Saved ${formatTime(lastSaved)}` : `Auto-saved ${formatTime(lastAutoSave)}`}
              </span>
            </div>
          )}
        </div>

        {/* Right section - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Preview button */}
          <button
            onClick={onPreview}
            disabled={!isReady || isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Preview
          </button>

          {/* Export button */}
          <button
            onClick={onExport}
            disabled={!isReady}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Share button */}
          {onShare && (
            <button
              onClick={onShare}
              disabled={!isReady}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}

          {/* Settings button */}
          {onSettings && (
            <button
              onClick={onSettings}
              disabled={!isReady}
              className="flex items-center gap-2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Save button */}
          <button
            onClick={onSave}
            disabled={!isReady || isSaving || !isDirty}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Additional info bar for development/debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Ready: {isReady ? 'Yes' : 'No'}</span>
          <span>Dirty: {isDirty ? 'Yes' : 'No'}</span>
          <span>Saving: {isSaving ? 'Yes' : 'No'}</span>
          <span>Generating: {isGenerating ? 'Yes' : 'No'}</span>
          {lastSaved && <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>}
          {lastAutoSave && <span>Auto-saved: {new Date(lastAutoSave).toLocaleTimeString()}</span>}
        </div>
      )}
    </div>
  );
}

export default DesignerToolbar;