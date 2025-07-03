// CREATED: 2025-07-03 - Undo/redo functionality for editors

import { useState, useCallback } from 'react';
import { EditorState, EditorHistory } from '@/types/editor';

interface UseEditorHistoryProps {
  initialContent: string;
  maxSize?: number;
}

export function useEditorHistory({ 
  initialContent, 
  maxSize = 50 
}: UseEditorHistoryProps) {
  const [history, setHistory] = useState<EditorHistory>(() => ({
    states: [{
      content: initialContent,
      contentType: 'text',
      timestamp: Date.now()
    }],
    currentIndex: 0,
    maxSize
  }));

  const pushState = useCallback((state: EditorState) => {
    setHistory(prev => {
      const newStates = [
        ...prev.states.slice(0, prev.currentIndex + 1),
        state
      ];

      // Limit history size
      if (newStates.length > maxSize) {
        newStates.shift();
      }

      return {
        ...prev,
        states: newStates,
        currentIndex: Math.min(newStates.length - 1, maxSize - 1)
      };
    });
  }, [maxSize]);

  const undo = useCallback(() => {
    if (history.currentIndex > 0) {
      const newIndex = history.currentIndex - 1;
      setHistory(prev => ({ ...prev, currentIndex: newIndex }));
      return history.states[newIndex];
    }
    return null;
  }, [history.currentIndex, history.states]);

  const redo = useCallback(() => {
    if (history.currentIndex < history.states.length - 1) {
      const newIndex = history.currentIndex + 1;
      setHistory(prev => ({ ...prev, currentIndex: newIndex }));
      return history.states[newIndex];
    }
    return null;
  }, [history.currentIndex, history.states]);

  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.states.length - 1;

  const clearHistory = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      states: [prev.states[prev.currentIndex]],
      currentIndex: 0
    }));
  }, []);

  const getCurrentState = useCallback(() => {
    return history.states[history.currentIndex];
  }, [history.states, history.currentIndex]);

  return {
    history,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getCurrentState,
    stateCount: history.states.length,
    currentIndex: history.currentIndex
  };
}