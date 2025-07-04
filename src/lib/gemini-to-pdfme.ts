// CREATED: 2025-07-04 - Gemini to pdfme mapping utilities

import { Template, Schema, BLANK_PDF } from '@pdfme/common';
import { 
  GeminiAnalysisResponse, 
  ExtractedQuestion, 
  DocumentSection, 
  QuestionType 
} from '@/types/gemini';

// Types for mapping configuration
export interface MappingConfig {
  pageSize: 'A4' | 'LETTER';
  orientation: 'portrait' | 'landscape';
  margin: number;
  fontSize: {
    title: number;
    header: number;
    body: number;
    question: number;
    option: number;
  };
  colors: {
    title: string;
    header: string;
    body: string;
    question: string;
    option: string;
  };
  spacing: {
    afterTitle: number;
    afterHeader: number;
    afterQuestion: number;
    betweenOptions: number;
  };
}

export interface DataBinding {
  path: string;
  type: 'text' | 'image' | 'table' | 'list';
  format?: string;
  fallback?: string;
  transformer?: (value: any) => any;
}

export interface MappingResult {
  template: Template;
  dataBindings: DataBinding[];
  metadata: {
    totalFields: number;
    questionCount: number;
    sectionCount: number;
    estimatedHeight: number;
  };
}

/**
 * Default mapping configuration
 */
const DEFAULT_CONFIG: MappingConfig = {
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 20,
  fontSize: {
    title: 18,
    header: 16,
    body: 12,
    question: 12,
    option: 10,
  },
  colors: {
    title: '#1a1a1a',
    header: '#2d2d2d',
    body: '#404040',
    question: '#1a1a1a',
    option: '#404040',
  },
  spacing: {
    afterTitle: 25,
    afterHeader: 15,
    afterQuestion: 10,
    betweenOptions: 5,
  },
};

/**
 * Core mapping class for converting Gemini analysis to pdfme templates
 */
export class GeminiToPdfmeMapper {
  private config: MappingConfig;
  private currentY: number = 0;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private contentWidth: number = 0;

  constructor(config: Partial<MappingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDimensions();
  }

  /**
   * Initialize page dimensions
   */
  private initializeDimensions(): void {
    const dimensions = {
      A4: { width: 210, height: 297 },
      LETTER: { width: 215.9, height: 279.4 }
    };

    const { width, height } = dimensions[this.config.pageSize];
    this.pageWidth = this.config.orientation === 'landscape' ? height : width;
    this.pageHeight = this.config.orientation === 'landscape' ? width : height;
    this.contentWidth = this.pageWidth - (this.config.margin * 2);
  }

  /**
   * Convert Gemini analysis to pdfme template
   */
  convertAnalysisToTemplate(analysis: GeminiAnalysisResponse): MappingResult {
    this.currentY = this.config.margin;
    const schemas: Schema[] = [];
    const dataBindings: DataBinding[] = [];

    // Add document title
    if (analysis.extractedContent.title) {
      const titleSchema = this.createTitleSchema(analysis.extractedContent.title);
      schemas.push(titleSchema);
      dataBindings.push({
        path: 'extractedContent.title',
        type: 'text',
        fallback: 'Untitled Document'
      });
    }

    // Add document metadata
    if (analysis.extractedContent.subtitle) {
      const subtitleSchema = this.createSubtitleSchema(analysis.extractedContent.subtitle);
      schemas.push(subtitleSchema);
      dataBindings.push({
        path: 'extractedContent.subtitle',
        type: 'text',
        fallback: ''
      });
    }

    // Add author and course info
    if (analysis.extractedContent.author || analysis.extractedContent.course) {
      const infoSchema = this.createInfoSchema(analysis.extractedContent);
      schemas.push(infoSchema);
      dataBindings.push({
        path: 'extractedContent',
        type: 'text',
        transformer: (content) => {
          const parts = [];
          if (content.author) parts.push(`Author: ${content.author}`);
          if (content.course) parts.push(`Course: ${content.course}`);
          return parts.join(' | ');
        }
      });
    }

    // Add document sections
    analysis.documentStructure.sections.forEach((section, index) => {
      const sectionSchemas = this.convertSectionToSchemas(section, index);
      schemas.push(...sectionSchemas);
      
      dataBindings.push({
        path: `documentStructure.sections[${index}].content`,
        type: 'text',
        fallback: ''
      });
    });

    // Add questions
    analysis.extractedQuestions.forEach((question, index) => {
      const questionSchemas = this.convertQuestionToSchemas(question, index);
      schemas.push(...questionSchemas);
      
      // Add data bindings for question
      dataBindings.push({
        path: `extractedQuestions[${index}].content`,
        type: 'text',
        fallback: ''
      });

      // Add data bindings for options if multiple choice
      if (question.type === 'multiple_choice' && question.options) {
        question.options.forEach((_, optionIndex) => {
          dataBindings.push({
            path: `extractedQuestions[${index}].options[${optionIndex}]`,
            type: 'text',
            fallback: ''
          });
        });
      }
    });

    // Create template
    const template: Template = {
      basePdf: {
        width: this.pageWidth,
        height: this.pageHeight,
        padding: [this.config.margin, this.config.margin, this.config.margin, this.config.margin],
      },
      schemas: [schemas],
    };

    return {
      template,
      dataBindings,
      metadata: {
        totalFields: schemas.length,
        questionCount: analysis.extractedQuestions.length,
        sectionCount: analysis.documentStructure.sections.length,
        estimatedHeight: this.currentY,
      },
    };
  }

  /**
   * Create title schema
   */
  private createTitleSchema(title: string): Schema {
    const schema: Schema = {
      name: 'documentTitle',
      type: 'text',
      content: title,
      position: { x: this.config.margin, y: this.currentY },
      width: this.contentWidth,
      height: this.config.fontSize.title * 1.2,
      fontSize: this.config.fontSize.title,
      fontColor: this.config.colors.title,
      fontName: 'Roboto-Regular',
      alignment: 'center',
      fontWeight: 'bold',
      characterSpacing: 0,
      lineHeight: 1.2,
    };

    this.currentY += this.config.fontSize.title * 1.2 + this.config.spacing.afterTitle;
    return schema;
  }

  /**
   * Create subtitle schema
   */
  private createSubtitleSchema(subtitle: string): Schema {
    const schema: Schema = {
      name: 'documentSubtitle',
      type: 'text',
      content: subtitle,
      position: { x: this.config.margin, y: this.currentY },
      width: this.contentWidth,
      height: this.config.fontSize.body * 1.2,
      fontSize: this.config.fontSize.body,
      fontColor: this.config.colors.body,
      fontName: 'Roboto-Regular',
      alignment: 'center',
      characterSpacing: 0,
      lineHeight: 1.2,
    };

    this.currentY += this.config.fontSize.body * 1.2 + this.config.spacing.afterHeader;
    return schema;
  }

  /**
   * Create info schema for author/course
   */
  private createInfoSchema(content: any): Schema {
    const infoParts = [];
    if (content.author) infoParts.push(`Author: ${content.author}`);
    if (content.course) infoParts.push(`Course: ${content.course}`);
    
    const schema: Schema = {
      name: 'documentInfo',
      type: 'text',
      content: infoParts.join(' | '),
      position: { x: this.config.margin, y: this.currentY },
      width: this.contentWidth,
      height: this.config.fontSize.body * 1.2,
      fontSize: this.config.fontSize.body,
      fontColor: this.config.colors.body,
      fontName: 'Roboto-Regular',
      alignment: 'center',
      characterSpacing: 0,
      lineHeight: 1.2,
    };

    this.currentY += this.config.fontSize.body * 1.2 + this.config.spacing.afterHeader;
    return schema;
  }

  /**
   * Convert document section to schemas
   */
  private convertSectionToSchemas(section: DocumentSection, index: number): Schema[] {
    const schemas: Schema[] = [];

    // Section header (if it's a header type)
    if (section.type === 'header') {
      const headerSchema: Schema = {
        name: `section_${index}_header`,
        type: 'text',
        content: section.content,
        position: { x: this.config.margin, y: this.currentY },
        width: this.contentWidth,
        height: this.config.fontSize.header * 1.2,
        fontSize: this.config.fontSize.header,
        fontColor: this.config.colors.header,
        fontName: 'Roboto-Regular',
        alignment: 'left',
        fontWeight: 'bold',
        characterSpacing: 0,
        lineHeight: 1.2,
      };

      schemas.push(headerSchema);
      this.currentY += this.config.fontSize.header * 1.2 + this.config.spacing.afterHeader;
    } else {
      // Regular section content
      const contentHeight = this.estimateTextHeight(section.content);
      const contentSchema: Schema = {
        name: `section_${index}_content`,
        type: 'text',
        content: section.content,
        position: { x: this.config.margin, y: this.currentY },
        width: this.contentWidth,
        height: contentHeight,
        fontSize: this.config.fontSize.body,
        fontColor: this.config.colors.body,
        fontName: 'Roboto-Regular',
        alignment: 'left',
        characterSpacing: 0,
        lineHeight: 1.4,
      };

      schemas.push(contentSchema);
      this.currentY += contentHeight + this.config.spacing.afterHeader;
    }

    return schemas;
  }

  /**
   * Convert question to schemas
   */
  private convertQuestionToSchemas(question: ExtractedQuestion, index: number): Schema[] {
    const schemas: Schema[] = [];

    // Question content
    const questionHeight = this.estimateTextHeight(question.content);
    const questionSchema: Schema = {
      name: `question_${index}_content`,
      type: 'text',
      content: `${question.number || index + 1}. ${question.content}`,
      position: { x: this.config.margin, y: this.currentY },
      width: this.contentWidth,
      height: questionHeight,
      fontSize: this.config.fontSize.question,
      fontColor: this.config.colors.question,
      fontName: 'Roboto-Regular',
      alignment: 'left',
      fontWeight: 'bold',
      characterSpacing: 0,
      lineHeight: 1.4,
    };

    schemas.push(questionSchema);
    this.currentY += questionHeight + this.config.spacing.afterQuestion;

    // Question options (for multiple choice)
    if (question.type === 'multiple_choice' && question.options) {
      // Create a single multipleChoice schema instead of multiple text schemas
      const multipleChoiceSchema: Schema = {
        name: `question_${index}_mc`,
        type: 'multipleChoice',
        content: JSON.stringify({
          question: question.content,
          options: question.options,
          correctAnswer: question.correctAnswer || '',
          points: question.points || 0
        }),
        position: { x: this.config.margin, y: this.currentY },
        width: this.contentWidth,
        height: (question.options.length * 25) + 40, // Estimated height
        fontSize: this.config.fontSize.question,
        fontColor: this.config.colors.question,
        fontName: 'Roboto-Regular',
        alignment: 'left',
        characterSpacing: 0,
        lineHeight: 1.4,
        options: question.options,
        correctAnswer: question.correctAnswer,
        points: question.points || 0
      };

      schemas.push(multipleChoiceSchema);
      this.currentY += (question.options.length * 25) + 40 + this.config.spacing.afterQuestion;
    }

    // Answer space for other question types
    if (question.type === 'short_answer') {
      const shortAnswerSchema: Schema = {
        name: `question_${index}_short_answer`,
        type: 'shortAnswer',
        content: JSON.stringify({
          question: question.content,
          expectedAnswer: question.expectedAnswer || '',
          maxLength: question.maxLength || 100,
          points: question.points || 0
        }),
        position: { x: this.config.margin, y: this.currentY },
        width: this.contentWidth,
        height: 40,
        fontSize: this.config.fontSize.body,
        fontColor: this.config.colors.body,
        fontName: 'Roboto-Regular',
        alignment: 'left',
        characterSpacing: 0,
        lineHeight: 1.4,
        expectedAnswer: question.expectedAnswer,
        maxLength: question.maxLength || 100,
        points: question.points || 0
      };

      schemas.push(shortAnswerSchema);
      this.currentY += 40 + this.config.spacing.afterQuestion;
    } else if (question.type === 'essay') {
      const essaySchema: Schema = {
        name: `question_${index}_essay`,
        type: 'essay',
        content: JSON.stringify({
          question: question.content,
          wordLimit: question.wordLimit || 500,
          points: question.points || 0
        }),
        position: { x: this.config.margin, y: this.currentY },
        width: this.contentWidth,
        height: 80,
        fontSize: this.config.fontSize.body,
        fontColor: this.config.colors.body,
        fontName: 'Roboto-Regular',
        alignment: 'left',
        characterSpacing: 0,
        lineHeight: 1.4,
        wordLimit: question.wordLimit || 500,
        points: question.points || 0
      };

      schemas.push(essaySchema);
      this.currentY += 80 + this.config.spacing.afterQuestion;
    }

    return schemas;
  }

  /**
   * Estimate text height based on content
   */
  private estimateTextHeight(text: string): number {
    const lines = Math.ceil(text.length / 80); // Rough estimate
    return Math.max(lines * this.config.fontSize.body * 1.4, this.config.fontSize.body * 1.2);
  }

  /**
   * Convert single question to schema
   */
  convertQuestion(question: ExtractedQuestion, position: { x: number; y: number }): Schema {
    return {
      name: `question_${question.id}`,
      type: 'text',
      content: question.content,
      position,
      width: this.contentWidth,
      height: this.estimateTextHeight(question.content),
      fontSize: this.config.fontSize.question,
      fontColor: this.config.colors.question,
      fontName: 'Roboto-Regular',
      alignment: 'left',
      characterSpacing: 0,
      lineHeight: 1.4,
    };
  }

  /**
   * Convert single section to schema
   */
  convertSection(section: DocumentSection, position: { x: number; y: number }): Schema {
    const isHeader = section.type === 'header';
    
    return {
      name: `section_${section.id}`,
      type: 'text',
      content: section.content,
      position,
      width: this.contentWidth,
      height: this.estimateTextHeight(section.content),
      fontSize: isHeader ? this.config.fontSize.header : this.config.fontSize.body,
      fontColor: isHeader ? this.config.colors.header : this.config.colors.body,
      fontName: 'Roboto-Regular',
      alignment: 'left',
      fontWeight: isHeader ? 'bold' : 'normal',
      characterSpacing: 0,
      lineHeight: 1.4,
    };
  }

  /**
   * Create data bindings for Gemini analysis
   */
  createDataBindings(analysis: GeminiAnalysisResponse): DataBinding[] {
    const bindings: DataBinding[] = [];

    // Document metadata bindings
    bindings.push(
      {
        path: 'extractedContent.title',
        type: 'text',
        fallback: 'Untitled Document'
      },
      {
        path: 'extractedContent.subtitle',
        type: 'text',
        fallback: ''
      },
      {
        path: 'extractedContent.author',
        type: 'text',
        fallback: ''
      },
      {
        path: 'extractedContent.course',
        type: 'text',
        fallback: ''
      }
    );

    // Section bindings
    analysis.documentStructure.sections.forEach((section, index) => {
      bindings.push({
        path: `documentStructure.sections[${index}].content`,
        type: 'text',
        fallback: ''
      });
    });

    // Question bindings
    analysis.extractedQuestions.forEach((question, index) => {
      bindings.push({
        path: `extractedQuestions[${index}].content`,
        type: 'text',
        fallback: ''
      });

      // Option bindings for multiple choice
      if (question.type === 'multiple_choice' && question.options) {
        question.options.forEach((_, optionIndex) => {
          bindings.push({
            path: `extractedQuestions[${index}].options[${optionIndex}]`,
            type: 'text',
            fallback: ''
          });
        });
      }
    });

    return bindings;
  }

  /**
   * Update mapping configuration
   */
  updateConfig(config: Partial<MappingConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeDimensions();
  }

  /**
   * Get current configuration
   */
  getConfig(): MappingConfig {
    return { ...this.config };
  }

  /**
   * Reset position counter
   */
  resetPosition(): void {
    this.currentY = this.config.margin;
  }

  /**
   * Get estimated template height
   */
  getEstimatedHeight(): number {
    return this.currentY;
  }
}

// Export singleton instance
export const geminiToPdfmeMapper = new GeminiToPdfmeMapper();

// Export utility functions
export const createMappingConfig = (overrides: Partial<MappingConfig> = {}): MappingConfig => {
  return { ...DEFAULT_CONFIG, ...overrides };
};

export const estimateDocumentHeight = (analysis: GeminiAnalysisResponse): number => {
  const mapper = new GeminiToPdfmeMapper();
  mapper.convertAnalysisToTemplate(analysis);
  return mapper.getEstimatedHeight();
};