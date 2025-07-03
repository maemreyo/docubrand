// CREATED: 2025-07-03 - Auto-save functionality for editors

import { useState, useEffect, useRef } from 'react';

interface UseAutoSaveProps {
  content: string;
  enabled?: boolean;
  interval?: number;
  onSave?: (content: string) => Promise<void>;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave({
  content,
  enabled = true,
  interval = 2000,
  onSave
}: UseAutoSaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const lastContentRef = useRef(content);
  const saveCountRef = useRef(0);

  useEffect(() => {
    if (!enabled || !onSave) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only auto-save if content has changed
    if (content !== lastContentRef.current && content.trim() !== '') {
      setSaveStatus('idle');
      setError(null);
      
      timeoutRef.current = setTimeout(async () => {
        try {
          setSaveStatus('saving');
          await onSave(content);
          setSaveStatus('saved');
          setLastSaved(Date.now());
          lastContentRef.current = content;
          saveCountRef.current += 1;
          setError(null);
          
          // Reset to idle after showing saved status
          setTimeout(() => {
            setSaveStatus('idle');
          }, 1000);
        } catch (err) {
          setSaveStatus('error');
          setError(err instanceof Error ? err.message : 'Save failed');
          console.error('Auto-save failed:', err);
        }
      }, interval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, interval, onSave]);

  // Manual save function
  const saveNow = async () => {
    if (!onSave) return;

    // Clear any pending auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      setSaveStatus('saving');
      await onSave(content);
      setSaveStatus('saved');
      setLastSaved(Date.now());
      lastContentRef.current = content;
      saveCountRef.current += 1;
      setError(null);
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 1000);
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Save failed');
      throw err;
    }
  };

  // Check if content has unsaved changes
  const hasUnsavedChanges = content !== lastContentRef.current;

  // Get time since last save
  const timeSinceLastSave = lastSaved ? Date.now() - lastSaved : null;

  // Format last saved time
  const lastSavedFormatted = lastSaved ? new Date(lastSaved).toLocaleTimeString() : null;

  return {
    saveStatus,
    lastSaved,
    lastSavedFormatted,
    timeSinceLastSave,
    hasUnsavedChanges,
    saveCount: saveCountRef.current,
    error,
    saveNow,
    isSaving: saveStatus === 'saving',
    isError: saveStatus === 'error'
  };
}