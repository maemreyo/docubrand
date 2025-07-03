// Content statistics hook

import { useMemo } from 'react';

export function useContentStats(content: string) {
  const stats = useMemo(() => {
    const text = content.trim();
    
    return {
      characters: content.length,
      charactersNoSpaces: content.replace(/\s/g, '').length,
      words: text ? text.split(/\s+/).filter(Boolean).length : 0,
      lines: content.split('\n').length,
      paragraphs: text ? text.split(/\n\s*\n/).filter(Boolean).length : 0,
      sentences: text ? text.split(/[.!?]+/).filter(Boolean).length : 0
    };
  }, [content]);

  return stats;
}