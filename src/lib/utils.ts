/**
 * Detects the document type based on the filename or content
 * @param filename The name of the file to analyze
 * @returns The detected document type
 */
export function detectDocumentType(filename: string): "quiz" | "worksheet" | "general" {
  const lowerFilename = filename.toLowerCase();
  
  // Check for quiz or exam related documents
  if (lowerFilename.includes('quiz') || lowerFilename.includes('test') || lowerFilename.includes('exam')) {
    return 'quiz';
  }
  
  // Check for worksheet documents
  if (lowerFilename.includes('worksheet') || lowerFilename.includes('exercise')) {
    return 'worksheet';
  }
  
  // Default to general for all other document types
  return 'general';
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes The size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 * @param str The string to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Generates a random ID for temporary elements
 * @returns Random ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Debounces a function call
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}