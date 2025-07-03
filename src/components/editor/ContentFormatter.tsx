// CREATED: 2025-07-03 - Content formatting and processing utilities

import { ContentType, TextFormatting, ContentValidationRule, ContentFormatter } from '@/types/editor';

/**
 * Content Formatter Implementation
 * Provides utilities for content conversion, detection, and formatting
 */
export class ContentFormatterImpl implements ContentFormatter {
  
  // Format conversion methods
  toPlainText(content: string): string {
    return content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
      .replace(/`(.*?)`/g, '$1') // Remove markdown code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links, keep text
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .replace(/^\s*[-*+]\s*/gm, '') // Remove list bullets
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered list markers
      .trim();
  }

  toRichText(content: string): string {
    // Convert plain text to rich text with basic HTML formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Code
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Links
      .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1
      .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2
      .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3
      .replace(/^\* (.*$)/gm, '<li>$1</li>') // List items
      .replace(/\n/g, '<br>'); // Line breaks
  }

  toMarkdown(content: string): string {
    // Convert rich text/HTML to markdown
    return content
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**') // Bold
      .replace(/<b>(.*?)<\/b>/g, '**$1**') // Bold (b tag)
      .replace(/<em>(.*?)<\/em>/g, '*$1*') // Italic
      .replace(/<i>(.*?)<\/i>/g, '*$1*') // Italic (i tag)
      .replace(/<code>(.*?)<\/code>/g, '`$1`') // Code
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)') // Links
      .replace(/<h1>(.*?)<\/h1>/g, '# $1') // H1
      .replace(/<h2>(.*?)<\/h2>/g, '## $1') // H2
      .replace(/<h3>(.*?)<\/h3>/g, '### $1') // H3
      .replace(/<li>(.*?)<\/li>/g, '* $1') // List items
      .replace(/<br\s*\/?>/g, '\n') // Line breaks
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .trim();
  }

  // Content type detection
  detectContentType(content: string): ContentType {
    const trimmed = content.trim().toLowerCase();
    
    // Check for question patterns
    if (this.isQuestion(content)) {
      return 'question';
    }
    
    // Check for header patterns
    if (this.isHeader(content)) {
      return 'header';
    }
    
    // Check for instruction patterns
    if (this.isInstruction(content)) {
      return 'instruction';
    }
    
    // Check for code patterns
    if (this.isCode(content)) {
      return 'code';
    }
    
    // Check for list patterns
    if (this.isList(content)) {
      return 'list';
    }
    
    // Check for markdown patterns
    if (this.isMarkdown(content)) {
      return 'markdown';
    }
    
    // Check for rich text patterns
    if (this.isRichText(content)) {
      return 'rich';
    }
    
    return 'text';
  }

  // Content type detection helpers
  private isQuestion(content: string): boolean {
    const patterns = [
      /\?.*\n.*[A-D]\)/i, // Question with multiple choice
      /question\s*:?\s*/i, // Explicit question label
      /what|how|why|when|where|which|who/i, // Question words
      /choose.*correct|select.*answer|pick.*option/i, // Multiple choice indicators
      /correct\s*answer\s*:/i // Correct answer indicator
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  private isHeader(content: string): boolean {
    const lines = content.split('\n');
    if (lines.length > 3) return false; // Headers should be short
    
    const patterns = [
      /^#+\s+/m, // Markdown header
      /^[A-Z\s]{5,}$/m, // All caps
      /^(chapter|section|part|unit)\s+\d+/i, // Chapter/section numbers
      /^[IVX]+\./m // Roman numerals
    ];
    
    return patterns.some(pattern => pattern.test(content)) || 
           (lines.length === 1 && content.length < 100 && /^[A-Z]/.test(content));
  }

  private isInstruction(content: string): boolean {
    const patterns = [
      /instruction\s*:?\s*/i,
      /^(read|write|complete|solve|answer|choose|select|fill|match)/i,
      /please\s+(read|write|complete|solve|answer|choose|select|fill|match)/i,
      /follow\s+these\s+steps/i,
      /^step\s+\d+/im
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  private isCode(content: string): boolean {
    const patterns = [
      /^function\s+\w+\s*\(/m,
      /^(const|let|var)\s+\w+\s*=/m,
      /^(if|for|while|switch)\s*\(/m,
      /^import\s+/m,
      /^<\w+.*>/m, // HTML/XML tags
      /^\s*\{[\s\S]*\}$/m, // JSON-like structure
      /^\s*```/m // Code blocks
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  private isList(content: string): boolean {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return false;
    
    const listMarkers = lines.filter(line => 
      /^\s*[-*+•]\s+/.test(line) || // Bullet lists
      /^\s*\d+\.\s+/.test(line) || // Numbered lists
      /^\s*[a-z]\)\s+/i.test(line) // Lettered lists
    );
    
    return listMarkers.length >= Math.min(3, lines.length * 0.6);
  }

  private isMarkdown(content: string): boolean {
    const patterns = [
      /#+\s+/, // Headers
      /\*\*.*?\*\*/, // Bold
      /\*.*?\*/, // Italic
      /`.*?`/, // Code
      /\[.*?\]\(.*?\)/, // Links
      /^[-*+]\s+/m, // Lists
      /^\d+\.\s+/m, // Numbered lists
      /^>/m, // Blockquotes
      /```[\s\S]*?```/m // Code blocks
    ];
    
    return patterns.filter(pattern => pattern.test(content)).length >= 2;
  }

  private isRichText(content: string): boolean {
    const patterns = [
      /<[^>]+>/g, // HTML tags
      /&\w+;/g // HTML entities
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  // Formatting application
  applyFormatting(content: string, formatting: TextFormatting): string {
    let formatted = content;
    
    if (formatting.bold) {
      formatted = `**${formatted}**`;
    }
    
    if (formatting.italic) {
      formatted = `*${formatted}*`;
    }
    
    if (formatting.underline) {
      formatted = `<u>${formatted}</u>`;
    }
    
    if (formatting.strikethrough) {
      formatted = `~~${formatted}~~`;
    }
    
    return formatted;
  }

  stripFormatting(content: string): string {
    return this.toPlainText(content);
  }

  // Content statistics
  getWordCount(content: string): number {
    const plainText = this.toPlainText(content);
    if (!plainText.trim()) return 0;
    return plainText.trim().split(/\s+/).length;
  }

  getCharacterCount(content: string): number {
    return content.length;
  }

  getLineCount(content: string): number {
    return content.split('\n').length;
  }

  // Content validation
  validateContent(content: string, rules: ContentValidationRule[]): string[] {
    const errors: string[] = [];
    
    rules.forEach(rule => {
      switch (rule.type) {
        case 'required':
          if (!content.trim()) {
            errors.push(rule.message);
          }
          break;
        case 'minLength':
          if (content.length < rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'maxLength':
          if (content.length > rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'pattern':
          if (!new RegExp(rule.value).test(content)) {
            errors.push(rule.message);
          }
          break;
        case 'custom':
          if (rule.validator && !rule.validator(content)) {
            errors.push(rule.message);
          }
          break;
      }
    });
    
    return errors;
  }

  // Advanced formatting utilities
  formatQuestion(questionText: string, options: string[], correctAnswer: string): string {
    let formatted = `Question: ${questionText}\n\n`;
    
    options.forEach((option, index) => {
      const letter = String.fromCharCode(65 + index); // A, B, C, D
      formatted += `${letter}) ${option}\n`;
    });
    
    formatted += `\nCorrect Answer: ${correctAnswer}`;
    
    return formatted;
  }

  formatHeader(text: string, level: number = 1): string {
    const hashes = '#'.repeat(Math.min(level, 6));
    return `${hashes} ${text}`;
  }

  formatList(items: string[], ordered: boolean = false): string {
    return items.map((item, index) => {
      const marker = ordered ? `${index + 1}.` : '•';
      return `${marker} ${item}`;
    }).join('\n');
  }

  formatCodeBlock(code: string, language?: string): string {
    return `\`\`\`${language || ''}\n${code}\n\`\`\``;
  }

  // Content cleaning utilities
  cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, '  ') // Convert tabs to spaces
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
      .trim();
  }

  extractPlainText(content: string): string {
    return this.toPlainText(content);
  }

  // Template processing
  processTemplate(template: string, placeholders: Record<string, string>): string {
    let processed = template;
    
    Object.entries(placeholders).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key.toUpperCase()}\\]`, 'g');
      processed = processed.replace(regex, value);
    });
    
    return processed;
  }
}

// Export singleton instance
export const contentFormatter = new ContentFormatterImpl();

// Helper functions for common formatting tasks
export const formatContent = {
  // Quick format functions
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `*${text}*`,
  underline: (text: string) => `<u>${text}</u>`,
  code: (text: string) => `\`${text}\``,
  
  // Content type formatters
  asQuestion: (text: string, options: string[] = [], answer = '') => 
    contentFormatter.formatQuestion(text, options, answer),
  asHeader: (text: string, level = 1) => 
    contentFormatter.formatHeader(text, level),
  asList: (items: string[], ordered = false) => 
    contentFormatter.formatList(items, ordered),
  asCode: (code: string, language?: string) => 
    contentFormatter.formatCodeBlock(code, language),
  
  // Utilities
  clean: (content: string) => contentFormatter.cleanContent(content),
  stats: (content: string) => ({
    words: contentFormatter.getWordCount(content),
    characters: contentFormatter.getCharacterCount(content),
    lines: contentFormatter.getLineCount(content)
  }),
  detect: (content: string) => contentFormatter.detectContentType(content)
};