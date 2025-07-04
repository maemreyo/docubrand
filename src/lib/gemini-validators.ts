// CREATED: 2025-07-03 - Response validation and sanitization for Gemini API

import { 
  GeminiAnalysisResponse, 
  GeminiAnalysisRequest,
  ExtractedQuestion,
  DocumentSection,
  ExtractedContent,
  DocumentStructure
} from '@/types/gemini';
import { ContentType } from '@/types/editor';
import { contentFormatter } from '@/components/editor/ContentFormatter';

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Gemini API response structure
 */
export function validateGeminiResponse(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic structure
  if (!response || typeof response !== 'object') {
    errors.push('Response must be a valid object');
    return { valid: false, errors, warnings };
  }

  // Validate required top-level properties
  const requiredProps = ['documentStructure', 'extractedQuestions', 'extractedContent'];
  for (const prop of requiredProps) {
    if (!(prop in response)) {
      errors.push(`Missing required property: ${prop}`);
    }
  }

  // Validate document structure
  if (response.documentStructure) {
    const docErrors = validateDocumentStructure(response.documentStructure);
    errors.push(...docErrors.errors);
    warnings.push(...docErrors.warnings);
  }

  // Validate extracted questions
  if (response.extractedQuestions) {
    const questionErrors = validateExtractedQuestions(response.extractedQuestions);
    errors.push(...questionErrors.errors);
    warnings.push(...questionErrors.warnings);
  }

  // Validate extracted content
  if (response.extractedContent) {
    const contentErrors = validateExtractedContent(response.extractedContent);
    errors.push(...contentErrors.errors);
    warnings.push(...contentErrors.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate document structure
 */
function validateDocumentStructure(structure: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!structure.type || typeof structure.type !== 'string') {
    errors.push('DocumentStructure.type is required and must be a string');
  }

  if (!structure.subject || typeof structure.subject !== 'string') {
    errors.push('DocumentStructure.subject is required and must be a string');
  }

  if (typeof structure.confidence !== 'number' || structure.confidence < 0 || structure.confidence > 1) {
    errors.push('DocumentStructure.confidence must be a number between 0 and 1');
  }

  // Validate sections array
  if (!Array.isArray(structure.sections)) {
    errors.push('DocumentStructure.sections must be an array');
  } else {
    structure.sections.forEach((section: any, index: number) => {
      const sectionErrors = validateDocumentSection(section, index);
      errors.push(...sectionErrors.errors);
      warnings.push(...sectionErrors.warnings);
    });
  }

  // Validate optional fields
  if (structure.difficulty && !['beginner', 'intermediate', 'advanced'].includes(structure.difficulty)) {
    warnings.push('DocumentStructure.difficulty should be one of: beginner, intermediate, advanced');
  }

  if (structure.estimatedTime && (typeof structure.estimatedTime !== 'number' || structure.estimatedTime < 0)) {
    warnings.push('DocumentStructure.estimatedTime should be a positive number');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate individual document section
 */
function validateDocumentSection(section: any, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const prefix = `Section[${index}]`;

  // Required fields
  if (!section.id || typeof section.id !== 'string') {
    errors.push(`${prefix}.id is required and must be a string`);
  }

  if (!section.title || typeof section.title !== 'string') {
    errors.push(`${prefix}.title is required and must be a string`);
  }

  if (!section.type || typeof section.type !== 'string') {
    errors.push(`${prefix}.type is required and must be a string`);
  }

  if (!section.content || typeof section.content !== 'string') {
    errors.push(`${prefix}.content is required and must be a string`);
  }

  if (typeof section.confidence !== 'number' || section.confidence < 0 || section.confidence > 1) {
    errors.push(`${prefix}.confidence must be a number between 0 and 1`);
  }

  // Validate position object
  if (section.position) {
    const positionErrors = validatePosition(section.position, `${prefix}.position`);
    errors.push(...positionErrors.errors);
    warnings.push(...positionErrors.warnings);
  } else {
    warnings.push(`${prefix}.position is missing but recommended`);
  }

  // Validate content type
  const validContentTypes = ['text', 'rich', 'markdown', 'question', 'header', 'instruction', 'code', 'list'];
  if (section.type && !validContentTypes.includes(section.type)) {
    warnings.push(`${prefix}.type "${section.type}" is not a recognized content type`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate position object
 */
function validatePosition(position: any, prefix: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields = ['page', 'x', 'y', 'width', 'height'];
  for (const field of requiredFields) {
    if (typeof position[field] !== 'number') {
      errors.push(`${prefix}.${field} must be a number`);
    }
  }

  // Validate ranges
  if (position.page && position.page < 1) {
    errors.push(`${prefix}.page must be >= 1`);
  }

  if (position.x && (position.x < 0 || position.x > 100)) {
    warnings.push(`${prefix}.x should be between 0 and 100 (percentage)`);
  }

  if (position.y && (position.y < 0 || position.y > 100)) {
    warnings.push(`${prefix}.y should be between 0 and 100 (percentage)`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate extracted questions
 */
function validateExtractedQuestions(questions: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(questions)) {
    errors.push('ExtractedQuestions must be an array');
    return { valid: false, errors, warnings };
  }

  questions.forEach((question: any, index: number) => {
    const questionErrors = validateExtractedQuestion(question, index);
    errors.push(...questionErrors.errors);
    warnings.push(...questionErrors.warnings);
  });

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate individual extracted question
 */
function validateExtractedQuestion(question: any, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const prefix = `Question[${index}]`;

  // Required fields
  if (!question.id || typeof question.id !== 'string') {
    errors.push(`${prefix}.id is required and must be a string`);
  }

  if (!question.content || typeof question.content !== 'string') {
    errors.push(`${prefix}.content is required and must be a string`);
  }

  if (!question.type || typeof question.type !== 'string') {
    errors.push(`${prefix}.type is required and must be a string`);
  }

  // Validate question type
  const validTypes = ['multiple_choice', 'short_answer', 'essay', 'fill_blank', 'true_false', 'matching', 'ordering'];
  if (question.type && !validTypes.includes(question.type)) {
    warnings.push(`${prefix}.type "${question.type}" is not a recognized question type`);
  }

  // Validate multiple choice specific fields
  if (question.type === 'multiple_choice') {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${prefix} of type multiple_choice must have at least 2 options`);
    }

    if (question.options) {
      question.options.forEach((option: any, optIndex: number) => {
        if (typeof option !== 'string' || !option.trim()) {
          errors.push(`${prefix}.options[${optIndex}] must be a non-empty string`);
        }
      });
    }
  }

  // Validate confidence
  if (question.confidence !== undefined && 
      (typeof question.confidence !== 'number' || question.confidence < 0 || question.confidence > 1)) {
    errors.push(`${prefix}.confidence must be a number between 0 and 1`);
  }

  // Validate points
  if (question.points !== undefined && 
      (typeof question.points !== 'number' || question.points < 0)) {
    warnings.push(`${prefix}.points should be a positive number`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate extracted content
 */
function validateExtractedContent(content: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || typeof content !== 'object') {
    errors.push('ExtractedContent must be an object');
    return { valid: false, errors, warnings };
  }

  // Title is required
  if (!content.title || typeof content.title !== 'string') {
    errors.push('ExtractedContent.title is required and must be a string');
  }

  // Optional fields validation
  const optionalStringFields = ['subtitle', 'author', 'date', 'course', 'instructions'];
  for (const field of optionalStringFields) {
    if (content[field] !== undefined && typeof content[field] !== 'string') {
      warnings.push(`ExtractedContent.${field} should be a string if provided`);
    }
  }

  // Validate statistics if present
  if (content.statistics) {
    const statsErrors = validateStatistics(content.statistics);
    errors.push(...statsErrors.errors);
    warnings.push(...statsErrors.warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate statistics object
 */
function validateStatistics(stats: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const numericFields = ['wordCount', 'pageCount', 'questionCount', 'sectionCount', 'estimatedReadingTime'];
  for (const field of numericFields) {
    if (stats[field] !== undefined && 
        (typeof stats[field] !== 'number' || stats[field] < 0)) {
      warnings.push(`Statistics.${field} should be a positive number`);
    }
  }

  if (stats.complexityScore !== undefined && 
      (typeof stats.complexityScore !== 'number' || stats.complexityScore < 0 || stats.complexityScore > 1)) {
    warnings.push('Statistics.complexityScore should be a number between 0 and 1');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Sanitize and enhance Gemini response
 */
export function sanitizeGeminiResponse(
  response: any, 
  request: GeminiAnalysisRequest
): GeminiAnalysisResponse {
  console.log('🧹 Sanitizing Gemini response...');

  const sanitized: GeminiAnalysisResponse = {
    documentStructure: sanitizeDocumentStructure(response.documentStructure, request),
    extractedQuestions: sanitizeExtractedQuestions(response.extractedQuestions || []),
    extractedContent: sanitizeExtractedContent(response.extractedContent || {})
  };

  // Add insights if present
  if (response.insights) {
    sanitized.insights = sanitizeInsights(response.insights);
  }

  console.log('✅ Response sanitization complete');
  return sanitized;
}

/**
 * Sanitize document structure
 */
function sanitizeDocumentStructure(structure: any, request: GeminiAnalysisRequest): DocumentStructure {
  const sanitized: DocumentStructure = {
    type: structure?.type || request.documentType || 'general',
    subject: structure?.subject || 'Unknown Subject',
    confidence: Math.max(0, Math.min(1, structure?.confidence || 0.5)),
    sections: []
  };

  // Add optional fields
  if (structure?.difficulty && ['beginner', 'intermediate', 'advanced'].includes(structure.difficulty)) {
    sanitized.difficulty = structure.difficulty;
  }

  if (structure?.estimatedTime && typeof structure.estimatedTime === 'number' && structure.estimatedTime > 0) {
    sanitized.estimatedTime = Math.round(structure.estimatedTime);
  }

  // Sanitize sections
  if (Array.isArray(structure?.sections)) {
    sanitized.sections = structure.sections
      .map((section: any, index: number) => sanitizeDocumentSection(section, index))
      .filter((section: DocumentSection | null) => section !== null) as DocumentSection[];
  }

  // Add metadata
  if (structure?.metadata) {
    sanitized.metadata = {
      author: structure.metadata.author || undefined,
      institution: structure.metadata.institution || undefined,
      course: structure.metadata.course || undefined,
      grade: structure.metadata.grade || undefined,
      tags: Array.isArray(structure.metadata.tags) ? structure.metadata.tags : undefined,
      references: Array.isArray(structure.metadata.references) ? structure.metadata.references : undefined
    };
  }

  return sanitized;
}

/**
 * Sanitize document section
 */
function sanitizeDocumentSection(section: any, index: number): DocumentSection | null {
  if (!section || typeof section !== 'object') {
    return null;
  }

  // Ensure required fields
  const id = section.id || `section_${index + 1}`;
  const title = section.title || `Section ${index + 1}`;
  const content = section.content || '';
  
  if (!content.trim()) {
    return null; // Skip empty sections
  }

  // Detect content type if not provided or invalid
  let type = section.type;
  const validTypes = ['text', 'rich', 'markdown', 'question', 'header', 'instruction', 'code', 'list'];
  if (!type || !validTypes.includes(type)) {
    type = contentFormatter.detectContentType(content) as string;
  }

  const sanitizedSection: DocumentSection = {
    id,
    title: title.trim(),
    type,
    content: content.trim(),
    position: sanitizePosition(section.position, index),
    confidence: Math.max(0, Math.min(1, section.confidence || 0.5))
  };

  // Add optional enhanced properties
  if (section.semanticRole) {
    sanitizedSection.semanticRole = section.semanticRole;
  }

  if (section.level && typeof section.level === 'number') {
    sanitizedSection.level = section.level;
  }

  if (section.formatting) {
    sanitizedSection.formatting = section.formatting;
  }

  return sanitizedSection;
}

/**
 * Sanitize position object
 */
function sanitizePosition(position: any, fallbackIndex: number): any {
  if (!position || typeof position !== 'object') {
    return {
      page: 1,
      x: 0,
      y: fallbackIndex * 10,
      width: 100,
      height: 10
    };
  }

  return {
    page: Math.max(1, position.page || 1),
    x: Math.max(0, Math.min(100, position.x || 0)),
    y: Math.max(0, Math.min(100, position.y || 0)),
    width: Math.max(1, Math.min(100, position.width || 100)),
    height: Math.max(1, Math.min(100, position.height || 10))
  };
}

/**
 * Sanitize extracted questions
 */
function sanitizeExtractedQuestions(questions: any[]): ExtractedQuestion[] {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((question: any, index: number) => sanitizeExtractedQuestion(question, index))
    .filter((question: ExtractedQuestion | null) => question !== null) as ExtractedQuestion[];
}

/**
 * Sanitize individual question
 */
function sanitizeExtractedQuestion(question: any, index: number): ExtractedQuestion | null {
  if (!question || typeof question !== 'object' || !question.content?.trim()) {
    return null;
  }

  const validTypes = ['multiple_choice', 'short_answer', 'essay', 'fill_blank', 'true_false'];
  const type = validTypes.includes(question.type) ? question.type : 'short_answer';

  const sanitized: ExtractedQuestion = {
    id: question.id || `question_${index + 1}`,
    number: question.number || String(index + 1),
    content: question.content.trim(),
    type,
    confidence: Math.max(0, Math.min(1, question.confidence || 0.5))
  };

  // Add options for multiple choice
  if (type === 'multiple_choice' && Array.isArray(question.options)) {
    sanitized.options = question.options
      .filter((opt: any) => typeof opt === 'string' && opt.trim())
      .map((opt: string) => opt.trim());
    
    if (sanitized.options && sanitized.options.length < 2) {
      // Convert to short answer if insufficient options
      sanitized.type = 'short_answer';
      delete sanitized.options;
    }
  }

  // Add correct answer if provided
  if (question.correctAnswer && typeof question.correctAnswer === 'string') {
    sanitized.correctAnswer = question.correctAnswer.trim();
  }

  // Add points if provided
  if (question.points && typeof question.points === 'number' && question.points > 0) {
    sanitized.points = question.points;
  }

  // Add difficulty if provided
  if (question.difficulty && ['easy', 'medium', 'hard'].includes(question.difficulty)) {
    sanitized.difficulty = question.difficulty;
  }

  // Add position if provided
  if (question.position) {
    sanitized.position = sanitizePosition(question.position, index);
  }

  return sanitized;
}

/**
 * Sanitize extracted content
 */
function sanitizeExtractedContent(content: any): ExtractedContent {
  const sanitized: ExtractedContent = {
    title: content?.title?.trim() || 'Untitled Document'
  };

  // Add optional string fields
  const optionalFields = ['subtitle', 'author', 'date', 'course', 'instructions'];
  for (const field of optionalFields) {
    if (content?.[field] && typeof content[field] === 'string') {
      (sanitized as any)[field] = content[field].trim();
    }
  }

  // Add optional array fields
  const arrayFields = ['keywords', 'learningOutcomes', 'prerequisites', 'materials', 'references'];
  for (const field of arrayFields) {
    if (Array.isArray(content?.[field])) {
      (sanitized as any)[field] = content[field].filter((item: any) => 
        typeof item === 'string' && item.trim()
      );
    }
  }

  // Add statistics if present
  if (content?.statistics) {
    sanitized.statistics = {
      wordCount: Math.max(0, content.statistics.wordCount || 0),
      pageCount: Math.max(1, content.statistics.pageCount || 1),
      questionCount: Math.max(0, content.statistics.questionCount || 0),
      sectionCount: Math.max(0, content.statistics.sectionCount || 0),
      estimatedReadingTime: Math.max(1, content.statistics.estimatedReadingTime || 1),
      complexityScore: Math.max(0, Math.min(1, content.statistics.complexityScore || 0.5))
    };
  }

  return sanitized;
}

/**
 * Sanitize insights
 */
function sanitizeInsights(insights: any): any {
  if (!insights || typeof insights !== 'object') {
    return undefined;
  }

  const sanitized: any = {};

  if (insights.contentType) {
    sanitized.contentType = insights.contentType;
  }

  if (insights.difficulty && ['beginner', 'intermediate', 'advanced'].includes(insights.difficulty)) {
    sanitized.difficulty = insights.difficulty;
  }

  if (typeof insights.completeness === 'number') {
    sanitized.completeness = Math.max(0, Math.min(1, insights.completeness));
  }

  if (Array.isArray(insights.suggestions)) {
    sanitized.suggestions = insights.suggestions
      .filter((s: any) => typeof s === 'string' && s.trim())
      .map((s: string) => s.trim());
  }

  if (Array.isArray(insights.improvements)) {
    sanitized.improvements = insights.improvements
      .filter((imp: any) => imp && typeof imp === 'object' && imp.description)
      .map((imp: any) => ({
        type: imp.type || 'content',
        description: imp.description.trim(),
        priority: ['low', 'medium', 'high'].includes(imp.priority) ? imp.priority : 'medium',
        sectionId: imp.sectionId || undefined,
        questionId: imp.questionId || undefined
      }));
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Create fallback response for failed analysis
 */
export function createFallbackResponse(request: GeminiAnalysisRequest): GeminiAnalysisResponse {
  return {
    documentStructure: {
      type: request.documentType || 'general',
      subject: 'Analysis Failed',
      confidence: 0,
      sections: []
    },
    extractedQuestions: [],
    extractedContent: {
      title: 'Document Analysis Failed',
      subtitle: 'Unable to process the uploaded document'
    }
  };
}