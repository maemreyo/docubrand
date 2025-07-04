// CREATED: 2025-07-04 - Data binding utilities for dynamic template variables

import { Template, Schema } from '@pdfme/common';
import { EducationalTemplate, EducationalDataBinding, ValidationRule, ScoringRule } from '@/types/pdfme-extensions';
import { GeminiAnalysisResponse } from '@/types/gemini';

/**
 * Data binding interface for educational content
 */
export interface DataBinding {
  id: string;
  path: string;
  type: 'text' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  educational?: {
    questionType?: string;
    answerFormat?: 'text' | 'number' | 'date' | 'multiple-choice';
    correctAnswer?: any;
    scoringRules?: ScoringRule[];
  };
  format?: string;
  example?: any;
}

/**
 * Data mapping result
 */
export interface DataMappingResult {
  success: boolean;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
}

/**
 * Variable extraction result
 */
export interface VariableExtractionResult {
  variables: DataBinding[];
  totalVariables: number;
  requiredVariables: number;
  optionalVariables: number;
}

/**
 * Data Binding Service for template variables
 */
export class DataBindingService {
  private variablePattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  private educationalVariablePattern = /\{\{(question|answer|student|date|score)\.(\w+)\}\}/g;

  /**
   * Extract variables from template
   */
  extractVariables(template: Template): VariableExtractionResult {
    const variables: DataBinding[] = [];
    const foundVariables = new Set<string>();

    // Process each page schema
    template.schemas.forEach((pageSchemas, pageIndex) => {
      pageSchemas.forEach((schema, schemaIndex) => {
        this.extractVariablesFromSchema(schema, variables, foundVariables, pageIndex, schemaIndex);
      });
    });

    return {
      variables,
      totalVariables: variables.length,
      requiredVariables: variables.filter(v => v.required).length,
      optionalVariables: variables.filter(v => !v.required).length,
    };
  }

  /**
   * Extract variables from individual schema
   */
  private extractVariablesFromSchema(
    schema: Schema,
    variables: DataBinding[],
    foundVariables: Set<string>,
    pageIndex: number,
    schemaIndex: number
  ): void {
    // Check content property
    if (typeof schema.content === 'string') {
      this.extractVariablesFromText(
        schema.content,
        variables,
        foundVariables,
        `Page ${pageIndex + 1}, Element ${schemaIndex + 1}`,
        schema.type || 'text'
      );
    }

    // Check other string properties
    const stringProperties = ['title', 'placeholder', 'label', 'instruction'];
    stringProperties.forEach(prop => {
      const value = (schema as any)[prop];
      if (typeof value === 'string') {
        this.extractVariablesFromText(
          value,
          variables,
          foundVariables,
          `Page ${pageIndex + 1}, Element ${schemaIndex + 1} (${prop})`,
          schema.type || 'text'
        );
      }
    });

    // Check educational-specific properties
    if ('options' in schema && Array.isArray(schema.options)) {
      schema.options.forEach((option: string, optionIndex: number) => {
        if (typeof option === 'string') {
          this.extractVariablesFromText(
            option,
            variables,
            foundVariables,
            `Page ${pageIndex + 1}, Element ${schemaIndex + 1}, Option ${optionIndex + 1}`,
            'multiple-choice-option'
          );
        }
      });
    }
  }

  /**
   * Extract variables from text content
   */
  private extractVariablesFromText(
    text: string,
    variables: DataBinding[],
    foundVariables: Set<string>,
    location: string,
    schemaType: string
  ): void {
    let match;

    // Extract standard variables
    const standardPattern = new RegExp(this.variablePattern);
    while ((match = standardPattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const variablePath = match[1];

      if (!foundVariables.has(variablePath)) {
        foundVariables.add(variablePath);

        const binding = this.createDataBinding(variablePath, location, schemaType);
        variables.push(binding);
      }
    }

    // Extract educational variables
    const educationalPattern = new RegExp(this.educationalVariablePattern);
    while ((match = educationalPattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const category = match[1]; // question, answer, student, date, score
      const property = match[2];
      const variablePath = `${category}.${property}`;

      if (!foundVariables.has(variablePath)) {
        foundVariables.add(variablePath);

        const binding = this.createEducationalDataBinding(category, property, location, schemaType);
        variables.push(binding);
      }
    }
  }

  /**
   * Create standard data binding
   */
  private createDataBinding(
    path: string,
    location: string,
    schemaType: string
  ): DataBinding {
    const parts = path.split('.');
    const fieldName = parts[parts.length - 1];

    // Infer type and default properties based on field name
    let type: DataBinding['type'] = 'text';
    let label = this.humanizeFieldName(fieldName);
    let required = false;
    let defaultValue: any = '';
    let format: string | undefined;

    // Type inference based on field name patterns
    if (fieldName.includes('date') || fieldName.includes('time')) {
      type = 'date';
      format = 'YYYY-MM-DD';
      defaultValue = new Date().toISOString().split('T')[0];
    } else if (fieldName.includes('score') || fieldName.includes('point') || fieldName.includes('grade')) {
      type = 'number';
      defaultValue = 0;
    } else if (fieldName.includes('active') || fieldName.includes('enabled') || fieldName.includes('correct')) {
      type = 'boolean';
      defaultValue = false;
    } else if (fieldName.includes('name') || fieldName.includes('title')) {
      required = true;
    }

    return {
      id: `binding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path,
      type,
      label,
      description: `Variable found in ${location}`,
      required,
      defaultValue,
      format,
      example: this.generateExampleValue(type, fieldName),
    };
  }

  /**
   * Create educational-specific data binding
   */
  private createEducationalDataBinding(
    category: string,
    property: string,
    location: string,
    schemaType: string
  ): DataBinding {
    const path = `${category}.${property}`;
    let type: DataBinding['type'] = 'text';
    let label = `${this.humanizeFieldName(category)} ${this.humanizeFieldName(property)}`;
    let required = false;
    let defaultValue: any = '';
    let educational: DataBinding['educational'] = {};

    // Category-specific configuration
    switch (category) {
      case 'question':
        educational.questionType = this.inferQuestionType(schemaType);
        if (property === 'text' || property === 'content') {
          required = true;
          defaultValue = 'Sample question text';
        } else if (property === 'points') {
          type = 'number';
          defaultValue = 1;
        }
        break;

      case 'answer':
        educational.answerFormat = this.inferAnswerFormat(schemaType);
        if (property === 'correct') {
          educational.correctAnswer = true;
          type = 'boolean';
          defaultValue = false;
        }
        break;

      case 'student':
        if (property === 'name') {
          required = true;
          defaultValue = 'Student Name';
        } else if (property === 'id') {
          defaultValue = 'STU001';
        }
        break;

      case 'date':
        type = 'date';
        defaultValue = new Date().toISOString().split('T')[0];
        break;

      case 'score':
        type = 'number';
        defaultValue = 0;
        break;
    }

    return {
      id: `binding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path,
      type,
      label,
      description: `Educational variable found in ${location}`,
      required,
      defaultValue,
      educational,
      example: this.generateExampleValue(type, property),
    };
  }

  /**
   * Map data to template variables
   */
  mapData(bindings: DataBinding[], inputData: any): DataMappingResult {
    const result: DataMappingResult = {
      success: true,
      data: {},
      errors: [],
      warnings: [],
    };

    try {
      bindings.forEach(binding => {
        const value = this.getNestedValue(inputData, binding.path);
        
        if (value !== undefined && value !== null) {
          // Validate and transform value
          const validationResult = this.validateValue(value, binding);
          if (validationResult.isValid) {
            result.data[binding.path] = this.transformValue(value, binding);
          } else {
            result.errors.push(`Invalid value for ${binding.label}: ${validationResult.error}`);
          }
        } else if (binding.required) {
          result.errors.push(`Missing required value for ${binding.label}`);
        } else {
          // Use default value
          result.data[binding.path] = binding.defaultValue;
        }
      });

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`Data mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate data bindings
   */
  validateBindings(bindings: DataBinding[]): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate paths
    const paths = bindings.map(b => b.path);
    const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate binding paths found: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Validate individual bindings
    bindings.forEach(binding => {
      // Validate path format
      if (!binding.path || !/^[\w.]+$/.test(binding.path)) {
        errors.push(`Invalid path format for binding: ${binding.path}`);
      }

      // Validate type
      if (!['text', 'number', 'boolean', 'array', 'object', 'date'].includes(binding.type)) {
        errors.push(`Invalid type for binding ${binding.path}: ${binding.type}`);
      }

      // Validate required field has no default value of empty string
      if (binding.required && (binding.defaultValue === '' || binding.defaultValue === null || binding.defaultValue === undefined)) {
        warnings.push(`Required binding ${binding.path} has empty default value`);
      }

      // Validate educational configuration
      if (binding.educational) {
        if (binding.educational.questionType && !['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(binding.educational.questionType)) {
          warnings.push(`Unknown question type for binding ${binding.path}: ${binding.educational.questionType}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate sample data for bindings
   */
  generateSampleData(bindings: DataBinding[]): any {
    const sampleData: any = {};

    bindings.forEach(binding => {
      const value = binding.example || binding.defaultValue || this.generateExampleValue(binding.type, binding.path);
      this.setNestedValue(sampleData, binding.path, value);
    });

    return sampleData;
  }

  /**
   * Create bindings from Gemini analysis
   */
  createBindingsFromGeminiAnalysis(analysis: GeminiAnalysisResponse): DataBinding[] {
    const bindings: DataBinding[] = [];

    // Create bindings for document metadata
    bindings.push({
      id: 'doc_title',
      path: 'document.title',
      type: 'text',
      label: 'Document Title',
      required: true,
      defaultValue: analysis.extractedContent.title || 'Untitled Document',
      example: 'Biology Quiz - Chapter 5',
    });

    bindings.push({
      id: 'doc_subject',
      path: 'document.subject',
      type: 'text',
      label: 'Subject',
      required: false,
      defaultValue: analysis.documentStructure.subject || '',
      example: 'Biology',
    });

    // Create bindings for questions
    analysis.extractedQuestions.forEach((question, index) => {
      const questionId = `q${index + 1}`;
      
      bindings.push({
        id: `${questionId}_text`,
        path: `questions.${questionId}.text`,
        type: 'text',
        label: `Question ${index + 1}`,
        required: true,
        defaultValue: question.question,
        educational: {
          questionType: question.type,
          answerFormat: this.inferAnswerFormat(question.type),
        },
        example: question.question,
      });

      if (question.options && question.options.length > 0) {
        question.options.forEach((option, optionIndex) => {
          bindings.push({
            id: `${questionId}_option_${optionIndex}`,
            path: `questions.${questionId}.options.${optionIndex}`,
            type: 'text',
            label: `Question ${index + 1} - Option ${String.fromCharCode(65 + optionIndex)}`,
            required: true,
            defaultValue: option,
            example: option,
          });
        });
      }

      if (question.correctAnswer) {
        bindings.push({
          id: `${questionId}_answer`,
          path: `questions.${questionId}.correctAnswer`,
          type: question.type === 'true_false' ? 'boolean' : 'text',
          label: `Question ${index + 1} - Correct Answer`,
          required: false,
          defaultValue: question.correctAnswer,
          educational: {
            correctAnswer: question.correctAnswer,
          },
          example: question.correctAnswer,
        });
      }
    });

    // Create bindings for sections
    analysis.documentStructure.sections.forEach((section, index) => {
      const sectionId = `section${index + 1}`;
      
      bindings.push({
        id: `${sectionId}_title`,
        path: `sections.${sectionId}.title`,
        type: 'text',
        label: `Section ${index + 1} Title`,
        required: true,
        defaultValue: section.title,
        example: section.title,
      });

      bindings.push({
        id: `${sectionId}_content`,
        path: `sections.${sectionId}.content`,
        type: 'text',
        label: `Section ${index + 1} Content`,
        required: true,
        defaultValue: section.content,
        example: section.content.substring(0, 100) + '...',
      });
    });

    // Add standard educational variables
    bindings.push(
      {
        id: 'student_name',
        path: 'student.name',
        type: 'text',
        label: 'Student Name',
        required: false,
        defaultValue: '{{student.name}}',
        example: 'John Smith',
      },
      {
        id: 'student_id',
        path: 'student.id',
        type: 'text',
        label: 'Student ID',
        required: false,
        defaultValue: '{{student.id}}',
        example: 'STU12345',
      },
      {
        id: 'exam_date',
        path: 'exam.date',
        type: 'date',
        label: 'Exam Date',
        required: false,
        defaultValue: new Date().toISOString().split('T')[0],
        format: 'YYYY-MM-DD',
        example: '2025-07-04',
      },
      {
        id: 'total_score',
        path: 'scoring.total',
        type: 'number',
        label: 'Total Score',
        required: false,
        defaultValue: 0,
        example: 85,
      }
    );

    return bindings;
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private validateValue(value: any, binding: DataBinding): { isValid: boolean; error?: string } {
    // Type validation
    switch (binding.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, error: 'Must be a valid number' };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: 'Must be true or false' };
        }
        break;
      case 'date':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          return { isValid: false, error: 'Must be a valid date' };
        }
        break;
    }

    // Custom validation rules
    if (binding.validation) {
      for (const rule of binding.validation) {
        const validationResult = this.applyValidationRule(value, rule);
        if (!validationResult.isValid) {
          return validationResult;
        }
      }
    }

    return { isValid: true };
  }

  private transformValue(value: any, binding: DataBinding): any {
    switch (binding.type) {
      case 'date':
        if (typeof value === 'string') {
          return new Date(value).toISOString().split('T')[0];
        }
        return value;
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      default:
        return String(value);
    }
  }

  private applyValidationRule(value: any, rule: ValidationRule): { isValid: boolean; error?: string } {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'range':
        if (typeof value === 'number' && (value < rule.value.min || value > rule.value.max)) {
          return { isValid: false, error: rule.message };
        }
        break;
    }
    return { isValid: true };
  }

  private generateExampleValue(type: DataBinding['type'], fieldName: string): any {
    switch (type) {
      case 'text':
        if (fieldName.includes('name')) return 'John Smith';
        if (fieldName.includes('title')) return 'Sample Title';
        if (fieldName.includes('question')) return 'What is the capital of France?';
        return 'Sample text';
      case 'number':
        if (fieldName.includes('score') || fieldName.includes('point')) return 85;
        if (fieldName.includes('age')) return 25;
        return 42;
      case 'boolean':
        return true;
      case 'date':
        return new Date().toISOString().split('T')[0];
      default:
        return 'Sample value';
    }
  }

  private humanizeFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  private inferQuestionType(schemaType: string): string {
    switch (schemaType) {
      case 'multipleChoice':
        return 'multiple_choice';
      case 'trueFalse':
        return 'true_false';
      case 'shortAnswer':
        return 'short_answer';
      case 'essay':
        return 'essay';
      default:
        return 'text';
    }
  }

  private inferAnswerFormat(questionType: string): 'text' | 'number' | 'date' | 'multiple-choice' {
    switch (questionType) {
      case 'multiple_choice':
        return 'multiple-choice';
      case 'true_false':
        return 'text';
      case 'short_answer':
        return 'text';
      case 'essay':
        return 'text';
      default:
        return 'text';
    }
  }

  private isValidDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

// Export singleton instance
export const dataBindingService = new DataBindingService();

// Export types and interfaces
export type { DataBinding, DataMappingResult, VariableExtractionResult };