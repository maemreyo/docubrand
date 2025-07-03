// CREATED: 2025-07-03 - Keyboard shortcuts for editors

import { useEffect, useCallback, useRef } from 'react';
import { KeyboardShortcut } from '@/types/editor';

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;

    // Don't trigger shortcuts when typing in inputs (unless specifically allowed)
    const target = event.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';

    for (const shortcut of shortcutsRef.current) {
      const matches = (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.metaKey === !!shortcut.metaKey
      );

      if (matches) {
        // Allow some shortcuts even in input elements
        const allowInInputs = ['s', 'z', 'y', 'c', 'v', 'x'].includes(shortcut.key.toLowerCase()) &&
                             (shortcut.ctrlKey || shortcut.metaKey);

        if (!isInputElement || allowInInputs) {
          event.preventDefault();
          
          if (typeof shortcut.action === 'function') {
            shortcut.action();
          }
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // Helper function to format shortcut display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.metaKey) parts.push('Cmd');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join('+');
  }, []);

  // Get all registered shortcuts with formatted display
  const getShortcuts = useCallback(() => {
    return shortcuts.map(shortcut => ({
      ...shortcut,
      display: formatShortcut(shortcut)
    }));
  }, [shortcuts, formatShortcut]);

  return {
    formatShortcut,
    getShortcuts,
    enabled
  };
}