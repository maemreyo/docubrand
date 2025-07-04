// CREATED: 2025-07-04 - Comprehensive template validation system

import { Template, Schema, checkTemplate } from '@pdfme/common';
import { EducationalTemplate, EducationalSchema, ValidationResult } from '@/types/pdfme-extensions';
import { DataBinding, dataBindingService } from './data-binding';
import { getEducationalPlugins } from './educational-plugins';

/**
 * Validation issue severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue interface
 */
export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: 'structure' | 'content' | 'educational' | 'performance' | 'accessibility';
  message: string;
  details?: string;
  location?: {
    page?: number;
    element?: number;
    property?: string;
  };
  suggestion?: string;
  fixable?: boolean;
}

/**
 * Validation report interface
 */
export interface ValidationReport {
  isValid: boolean;
  score: number; // 0-100 quality score
  issues: ValidationIssue[];
  statistics: {
    totalElements: number;
    totalPages: number;
    totalQuestions: number;
    totalDataBindings: number;
    complexity: 'low' | 'medium' | 'high';
  };
  suggestions: string[];
  performanceMetrics: {
    estimatedRenderTime: number; // in milliseconds
    memoryUsage: 'low' | 'medium' | 'high';
    optimizationOpportunities: string[];
  };
}

/**
 * Educational content validation options
 */
export interface EducationalValidationOptions {
  validateQuestions: boolean;
  validateAnswers: boolean;
  validateScoring: boolean;
  validateAccessibility: boolean;
  strictMode: boolean; // More rigorous validation
  targetGradeLevel?: string;
  expectedDuration?: number; // in minutes
}

/**
 * Template Validator Class
 */
export class TemplateValidator {
  private educationalPlugins = getEducationalPlugins();
  private issueCounter = 0;

  /**
   * Validate educational template
   */
  validateTemplate(
    template: EducationalTemplate,
    options: Partial<EducationalValidationOptions> = {}
  ): ValidationReport {
    const validationOptions: EducationalValidationOptions = {
      validateQuestions: true,
      validateAnswers: true,
      validateScoring: true,
      validateAccessibility: true,
      strictMode: false,
      ...options,
    };

    const report: ValidationReport = {
      isValid: true,
      score: 100,
      issues: [],
      statistics: this.calculateStatistics(template),
      suggestions: [],
      performanceMetrics: this.analyzePerformance(template),
    };

    // Reset issue counter
    this.issueCounter = 0;

    // Run validation checks
    this.validateTemplateStructure(template, report);
    this.validateSchemas(template, report, validationOptions);
    this.validateEducationalContent(template, report, validationOptions);
    this.validateDataBindings(template, report);
    this.validateAccessibility(template, report, validationOptions);
    this.validatePerformance(template, report);

    // Calculate final score and validity
    report.score = this.calculateQualityScore(report.issues);
    report.isValid = !report.issues.some(issue => issue.severity === 'error');

    // Generate suggestions
    report.suggestions = this.generateSuggestions(report);

    return report;
  }

  /**
   * Validate template structure
   */
  private validateTemplateStructure(template: EducationalTemplate, report: ValidationReport): void {
    // Check basic template structure
    if (!template.basePdf) {
      this.addIssue(report, {
        severity: 'error',
        category: 'structure',
        message: 'Template missing base PDF',
        details: 'Every template must have a base PDF document',
        suggestion: 'Add a base PDF or use BLANK_PDF for new templates',
        fixable: true,
      });
    }

    if (!template.schemas || !Array.isArray(template.schemas)) {
      this.addIssue(report, {
        severity: 'error',
        category: 'structure',
        message: 'Template missing schemas array',
        details: 'Schemas define the form fields and content areas',
        suggestion: 'Initialize schemas as an array of page schemas',
        fixable: true,
      });
      return;
    }

    if (template.schemas.length === 0) {
      this.addIssue(report, {
        severity: 'warning',
        category: 'structure',
        message: 'Template has no pages',
        details: 'Template should have at least one page with content',
        suggestion: 'Add page schemas with educational content',
        fixable: true,
      });
    }

    // Validate metadata if present
    if (template.educational?.metadata) {
      this.validateEducationalMetadata(template.educational.metadata, report);
    }
  }

  /**
   * Validate individual schemas
   */
  private validateSchemas(
    template: EducationalTemplate,
    report: ValidationReport,
    options: EducationalValidationOptions
  ): void {
    template.schemas.forEach((pageSchemas, pageIndex) => {
      if (!Array.isArray(pageSchemas)) {
        this.addIssue(report, {
          severity: 'error',
          category: 'structure',
          message: `Page ${pageIndex + 1} schemas is not an array`,
          location: { page: pageIndex },
          suggestion: 'Each page should have an array of schema objects',
          fixable: true,
        });
        return;
      }

      pageSchemas.forEach((schema, elementIndex) => {
        this.validateSchema(schema, report, pageIndex, elementIndex, options);
      });

      // Check for page-level issues
      this.validatePageLayout(pageSchemas, report, pageIndex);
    });
  }

  /**
   * Validate individual schema
   */
  private validateSchema(
    schema: Schema,
    report: ValidationReport,
    pageIndex: number,
    elementIndex: number,
    options: EducationalValidationOptions
  ): void {
    const location = { page: pageIndex, element: elementIndex };

    // Required properties
    if (!schema.type) {
      this.addIssue(report, {
        severity: 'error',
        category: 'structure',
        message: 'Schema missing type property',
        location,
        suggestion: 'Add a valid schema type (text, image, etc.)',
        fixable: true,
      });
    }

    if (!schema.position) {
      this.addIssue(report, {
        severity: 'error',
        category: 'structure',
        message: 'Schema missing position',
        location,
        suggestion: 'Add position with x and y coordinates',
        fixable: true,
      });
    } else {
      // Validate position values
      if (typeof schema.position.x !== 'number' || typeof schema.position.y !== 'number') {
        this.addIssue(report, {
          severity: 'error',
          category: 'structure',
          message: 'Invalid position coordinates',
          location,
          suggestion: 'Position x and y must be numbers',
          fixable: true,
        });
      }
    }

    if (!schema.width || !schema.height) {
      this.addIssue(report, {
        severity: 'error',
        category: 'structure',
        message: 'Schema missing dimensions',
        location,
        suggestion: 'Add width and height properties',
        fixable: true,
      });
    }

    // Educational schema validation
    if (this.isEducationalSchema(schema)) {
      this.validateEducationalSchema(schema as EducationalSchema, report, location, options);
    }

    // Content validation
    this.validateSchemaContent(schema, report, location);

    // Accessibility validation
    if (options.validateAccessibility) {
      this.validateSchemaAccessibility(schema, report, location);
    }
  }

  /**
   * Validate educational schema
   */
  private validateEducationalSchema(
    schema: EducationalSchema,
    report: ValidationReport,
    location: { page: number; element: number },
    options: EducationalValidationOptions
  ): void {
    const questionType = schema.type;

    // Validate question content
    if (options.validateQuestions && this.isQuestionSchema(schema)) {
      if (!schema.content || schema.content.trim() === '') {
        this.addIssue(report, {
          severity: 'error',
          category: 'educational',
          message: 'Question missing content',
          location,
          suggestion: 'Add question text content',
          fixable: true,
        });
      }

      // Validate question-specific properties
      switch (questionType) {
        case 'multipleChoice':
          this.validateMultipleChoiceQuestion(schema, report, location, options);
          break;
        case 'trueFalse':
          this.validateTrueFalseQuestion(schema, report, location, options);
          break;
        case 'shortAnswer':
          this.validateShortAnswerQuestion(schema, report, location, options);
          break;
        case 'essay':
          this.validateEssayQuestion(schema, report, location, options);
          break;
      }
    }

    // Validate scoring
    if (options.validateScoring && 'points' in schema) {
      if (typeof schema.points !== 'number' || schema.points < 0) {
        this.addIssue(report, {
          severity: 'warning',
          category: 'educational',
          message: 'Invalid point value',
          location,
          suggestion: 'Points should be a positive number',
          fixable: true,
        });
      }
    }
  }

  /**
   * Validate multiple choice question
   */
  private validateMultipleChoiceQuestion(
    schema: EducationalSchema,
    report: ValidationReport,
    location: { page: number; element: number },
    options: EducationalValidationOptions
  ): void {
    if (!('options' in schema) || !Array.isArray(schema.options)) {
      this.addIssue(report, {
        severity: 'error',
        category: 'educational',
        message: 'Multiple choice question missing options',
        location,
        suggestion: 'Add an array of answer options',
        fixable: true,
      });
      return;
    }

    if (schema.options.length < 2) {
      this.addIssue(report, {
        severity: 'error',
        category: 'educational',
        message: 'Multiple choice question needs at least 2 options',
        location,
        suggestion: 'Add more answer options',
        fixable: true,
      });
    }

    if (schema.options.length > 8) {
      this.addIssue(report, {
        severity: 'warning',
        category: 'educational',
        message: 'Too many options may confuse students',
        location,
        suggestion: 'Consider reducing to 4-5 options',
        fixable: false,
      });
    }

    // Check for empty options
    schema.options.forEach((option, index) => {
      if (!option || option.trim() === '') {
        this.addIssue(report, {
          severity: 'warning',
          category: 'educational',
          message: `Option ${index + 1} is empty`,
          location,
          suggestion: 'Remove empty options or add content',
          fixable: true,
        });
      }
    });

    // Validate correct answer
    if (options.validateAnswers && 'correctAnswer' in schema) {
      if (!schema.options.includes(schema.correctAnswer as string)) {
        this.addIssue(report, {
          severity: 'error',
          category: 'educational',
          message: 'Correct answer not found in options',
          location,
          suggestion: 'Ensure correct answer matches one of the options',
          fixable: true,
        });
      }
    }
  }

  /**
   * Validate true/false question
   */
  private validateTrueFalseQuestion(
    schema: EducationalSchema,
    report: ValidationReport,
    location: { page: number; element: number },
    options: EducationalValidationOptions
  ): void {
    if (options.validateAnswers && 'correctAnswer' in schema) {
      if (typeof schema.correctAnswer !== 'boolean') {
        this.addIssue(report, {
          severity: 'error',
          category: 'educational',
          message: 'True/false question answer must be boolean',
          location,
          suggestion: 'Set correctAnswer to true or false',
          fixable: true,
        });
      }
    }
  }

  /**
   * Validate short answer question
   */
  private validateShortAnswerQuestion(
    schema: EducationalSchema,
    report: ValidationReport,
    location: { page: number; element: number },
    options: EducationalValidationOptions
  ): void {
    if ('maxLength' in schema) {
      if (typeof schema.maxLength !== 'number' || schema.maxLength <= 0) {
        this.addIssue(report, {
          severity: 'warning',
          category: 'educational',
          message: 'Invalid max length for short answer',
          location,
          suggestion: 'Set a reasonable character limit (e.g., 100-500)',
          fixable: true,
        });
      }
    }
  }

  /**
   * Validate essay question
   */
  private validateEssayQuestion(
    schema: EducationalSchema,
    report: ValidationReport,
    location: { page: number; element: number },
    options: EducationalValidationOptions
  ): void {
    if ('wordLimit' in schema) {
      if (typeof schema.wordLimit !== 'number' || schema.wordLimit <= 0) {
        this.addIssue(report, {
          severity: 'warning',
          category: 'educational',
          message: 'Invalid word limit for essay',
          location,
          suggestion: 'Set a reasonable word limit (e.g., 200-1000)',
          fixable: true,
        });
      }
    }
  }

  /**
   * Validate educational content
   */
  private validateEducationalContent(
    template: EducationalTemplate,
    report: ValidationReport,
    options: EducationalValidationOptions
  ): void {
    if (!template.educational) return;

    const metadata = template.educational.metadata;
    if (metadata) {
      // Validate time limits
      if (metadata.timeLimit && metadata.timeLimit <= 0) {
        this.addIssue(report, {
          severity: 'warning',
          category: 'educational',
          message: 'Invalid time limit',
          suggestion: 'Set a reasonable time limit in minutes',
          fixable: true,
        });
      }

      // Validate scoring
      if (metadata.totalPoints && metadata.totalPoints <= 0) {
        this.addIssue(report, {
          severity: 'warning',
          category: 'educational',
          message: 'Invalid total points',
          suggestion: 'Set total points based on question values',
          fixable: true,
        });
      }

      // Validate learning objectives
      if (metadata.learningObjectives && metadata.learningObjectives.length === 0) {
        this.addIssue(report, {
          severity: 'info',
          category: 'educational',
          message: 'No learning objectives specified',
          suggestion: 'Add learning objectives to improve educational value',
          fixable: false,
        });
      }
    }
  }

  /**
   * Validate data bindings
   */
  private validateDataBindings(template: EducationalTemplate, report: ValidationReport): void {
    try {
      const extraction = dataBindingService.extractVariables(template);
      const validation = dataBindingService.validateBindings(extraction.variables);

      // Add validation issues
      validation.errors.forEach(error => {
        this.addIssue(report, {
          severity: 'error',
          category: 'content',
          message: `Data binding error: ${error}`,
          suggestion: 'Fix data binding configuration',
          fixable: true,
        });
      });

      validation.warnings.forEach(warning => {
        this.addIssue(report, {
          severity: 'warning',
          category: 'content',
          message: `Data binding warning: ${warning}`,
          suggestion: 'Review data binding configuration',
          fixable: false,
        });
      });
    } catch (error) {
      this.addIssue(report, {
        severity: 'error',
        category: 'content',
        message: 'Failed to validate data bindings',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check template structure and variable syntax',
        fixable: false,
      });
    }
  }

  /**
   * Validate accessibility
   */
  private validateAccessibility(
    template: EducationalTemplate,
    report: ValidationReport,
    options: EducationalValidationOptions
  ): void {
    if (!options.validateAccessibility) return;

    template.schemas.forEach((pageSchemas, pageIndex) => {
      pageSchemas.forEach((schema, elementIndex) => {
        this.validateSchemaAccessibility(schema, report, { page: pageIndex, element: elementIndex });
      });
    });
  }

  /**
   * Validate schema accessibility
   */
  private validateSchemaAccessibility(
    schema: Schema,
    report: ValidationReport,
    location: { page: number; element: number }
  ): void {
    // Check font size
    if (schema.fontSize && schema.fontSize < 10) {
      this.addIssue(report, {
        severity: 'warning',
        category: 'accessibility',
        message: 'Font size too small for accessibility',
        location,
        suggestion: 'Use font size of at least 10-12pt',
        fixable: true,
      });
    }

    // Check contrast (simplified check)
    if (schema.fontColor && schema.backgroundColor) {
      if (schema.fontColor === schema.backgroundColor) {
        this.addIssue(report, {
          severity: 'error',
          category: 'accessibility',
          message: 'No contrast between text and background',
          location,
          suggestion: 'Use contrasting colors for text and background',
          fixable: true,
        });
      }
    }

    // Check for alt text on images
    if (schema.type === 'image' && !('alt' in schema)) {
      this.addIssue(report, {
        severity: 'warning',
        category: 'accessibility',
        message: 'Image missing alt text',
        location,
        suggestion: 'Add descriptive alt text for screen readers',
        fixable: true,
      });
    }
  }

  /**
   * Validate performance
   */
  private validatePerformance(template: EducationalTemplate, report: ValidationReport): void {
    const stats = report.statistics;

    // Check for excessive elements
    if (stats.totalElements > 100) {
      this.addIssue(report, {
        severity: 'warning',
        category: 'performance',
        message: 'High number of elements may impact performance',
        details: `Template has ${stats.totalElements} elements`,
        suggestion: 'Consider simplifying the template or splitting into multiple pages',
        fixable: false,
      });
    }

    // Check for excessive pages
    if (stats.totalPages > 20) {
      this.addIssue(report, {
        severity: 'info',
        category: 'performance',
        message: 'Large template may be slow to process',
        details: `Template has ${stats.totalPages} pages`,
        suggestion: 'Consider breaking into smaller templates',
        fixable: false,
      });
    }
  }

  // Helper methods
  private calculateStatistics(template: EducationalTemplate) {
    let totalElements = 0;
    let totalQuestions = 0;

    template.schemas.forEach(pageSchemas => {
      totalElements += pageSchemas.length;
      totalQuestions += pageSchemas.filter(schema => this.isQuestionSchema(schema)).length;
    });

    const complexity = totalElements > 50 ? 'high' : totalElements > 20 ? 'medium' : 'low';

    return {
      totalElements,
      totalPages: template.schemas.length,
      totalQuestions,
      totalDataBindings: 0, // Will be calculated separately
      complexity: complexity as 'low' | 'medium' | 'high',
    };
  }

  private analyzePerformance(template: EducationalTemplate) {
    const stats = this.calculateStatistics(template);
    
    // Rough estimates based on complexity
    const estimatedRenderTime = stats.totalElements * 10 + stats.totalPages * 50;
    const memoryUsage = stats.totalElements > 50 ? 'high' : stats.totalElements > 20 ? 'medium' : 'low';
    
    const optimizationOpportunities: string[] = [];
    if (stats.totalElements > 50) {
      optimizationOpportunities.push('Reduce number of elements per page');
    }
    if (stats.totalPages > 10) {
      optimizationOpportunities.push('Consider template pagination');
    }

    return {
      estimatedRenderTime,
      memoryUsage: memoryUsage as 'low' | 'medium' | 'high',
      optimizationOpportunities,
    };
  }

  private calculateQualityScore(issues: ValidationIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    });

    return Math.max(0, score);
  }

  private generateSuggestions(report: ValidationReport): string[] {
    const suggestions: string[] = [];

    // General suggestions based on statistics
    if (report.statistics.totalQuestions === 0) {
      suggestions.push('Add educational questions to make this template interactive');
    }

    if (report.statistics.totalPages === 1 && report.statistics.totalElements > 20) {
      suggestions.push('Consider splitting content across multiple pages for better readability');
    }

    if (report.issues.filter(i => i.category === 'accessibility').length > 0) {
      suggestions.push('Improve accessibility by following WCAG guidelines');
    }

    if (report.score < 80) {
      suggestions.push('Address validation issues to improve template quality');
    }

    return suggestions;
  }

  private addIssue(report: ValidationReport, issue: Omit<ValidationIssue, 'id'>): void {
    report.issues.push({
      id: `issue_${++this.issueCounter}`,
      ...issue,
    });
  }

  private validateEducationalMetadata(metadata: any, report: ValidationReport): void {
    // Add metadata validation logic here
  }

  private validatePageLayout(pageSchemas: Schema[], report: ValidationReport, pageIndex: number): void {
    // Check for overlapping elements
    for (let i = 0; i < pageSchemas.length; i++) {
      for (let j = i + 1; j < pageSchemas.length; j++) {
        if (this.elementsOverlap(pageSchemas[i], pageSchemas[j])) {
          this.addIssue(report, {
            severity: 'warning',
            category: 'structure',
            message: 'Elements may be overlapping',
            location: { page: pageIndex, element: i },
            suggestion: 'Adjust element positions to avoid overlap',
            fixable: true,
          });
        }
      }
    }
  }

  private validateSchemaContent(schema: Schema, report: ValidationReport, location: { page: number; element: number }): void {
    if (schema.type === 'text' && schema.content) {
      // Check for very long text that might not fit
      if (typeof schema.content === 'string' && schema.content.length > 1000) {
        this.addIssue(report, {
          severity: 'warning',
          category: 'content',
          message: 'Text content is very long',
          location,
          suggestion: 'Consider breaking up long text or increasing element size',
          fixable: false,
        });
      }
    }
  }

  private isEducationalSchema(schema: Schema): boolean {
    const educationalTypes = ['multipleChoice', 'trueFalse', 'shortAnswer', 'essay', 'instructionBox'];
    return educationalTypes.includes(schema.type || '');
  }

  private isQuestionSchema(schema: Schema): boolean {
    const questionTypes = ['multipleChoice', 'trueFalse', 'shortAnswer', 'essay'];
    return questionTypes.includes(schema.type || '');
  }

  private elementsOverlap(schema1: Schema, schema2: Schema): boolean {
    if (!schema1.position || !schema2.position || !schema1.width || !schema1.height || !schema2.width || !schema2.height) {
      return false;
    }

    const rect1 = {
      left: schema1.position.x,
      top: schema1.position.y,
      right: schema1.position.x + schema1.width,
      bottom: schema1.position.y + schema1.height,
    };

    const rect2 = {
      left: schema2.position.x,
      top: schema2.position.y,
      right: schema2.position.x + schema2.width,
      bottom: schema2.position.y + schema2.height,
    };

    return !(rect1.right <= rect2.left || 
             rect2.right <= rect1.left || 
             rect1.bottom <= rect2.top || 
             rect2.bottom <= rect1.top);
  }
}

// Export singleton instance
export const templateValidator = new TemplateValidator();

// Export types and interfaces
export type { ValidationReport, ValidationIssue, ValidationSeverity, EducationalValidationOptions };