// Drag and drop functionality for sections

import { useState, useCallback } from 'react';

interface UseDragAndDropProps {
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function useDragAndDrop({ onReorder }: UseDragAndDropProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedItem(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    if (draggedItem !== null && draggedItem !== index) {
      setDragOverItem(index);
    }
  }, [draggedItem]);

  const handleDragEnd = useCallback(() => {
    if (draggedItem !== null && dragOverItem !== null && onReorder) {
      onReorder(draggedItem, dragOverItem);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  }, [draggedItem, dragOverItem, onReorder]);

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null);
  }, []);

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragLeave,
    isDragging: draggedItem !== null
  };
}