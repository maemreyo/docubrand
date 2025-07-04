import { 
  DocuBrandTemplate, 
  DocuBrandSchema, 
  ConversionContext,
  TemplateCreationResult,
  TemplateCategory,
  I18nConfig,
  LanguageConfig,
  DataSchema,
  DataBinding,
  TemplateMetadata
} from '../types/template-types';

import type { 
  GeminiAnalysisResponse, 
  DocumentSection, 
  ExtractedQuestion,
  ExtractedContent
} from '@/types/gemini';

import { BLANK_PDF } from '@pdfme/common';

/**
 * Data adapter for converting Gemini analysis to PDFme templates
 */
export class GeminiToPDFMeDataAdapter {
  private readonly defaultPageConfig = {
    format: 'A4' as const,
    orientation: 'portrait' as const,
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  };

  private readonly defaultLanguageConfig: LanguageConfig = {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    fontFamily: 'NotoSans',
    fallbackFonts: ['Arial', 'Helvetica', 'sans-serif'],
    fontFiles: {
      regular: '/fonts/NotoSans-Regular.ttf',
      bold: '/fonts/NotoSans-Bold.ttf',
      italic: '/fonts/NotoSans-Italic.ttf',
      boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
    },
    unicodeRange: 'U+0000-007F'
  };

  private readonly vietnameseLanguageConfig: LanguageConfig = {
    code: 'vi',
    name: 'Tiếng Việt',
    direction: 'ltr',
    fontFamily: 'NotoSansVietnamese',
    fallbackFonts: ['Arial Unicode MS', 'Tahoma', 'sans-serif'],
    fontFiles: {
      regular: '/fonts/NotoSans-Vietnamese-Regular.ttf',
      bold: '/fonts/NotoSans-Vietnamese-Bold.ttf',
      italic: '/fonts/NotoSans-Vietnamese-Italic.ttf',
      boldItalic: '/fonts/NotoSans-Vietnamese-BoldItalic.ttf'
    },
    unicodeRange: 'U+0000-007F,U+0100-017F,U+1EA0-1EF9'
  };

  /**
   * Convert Gemini analysis to PDFme template
   */
  public async convertAnalysisToTemplate(
    analysis: GeminiAnalysisResponse,
    context: ConversionContext
  ): Promise<TemplateCreationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Converting Gemini analysis to PDFme template...');
      
      // Create template metadata
      const metadata = this.createTemplateMetadata(analysis, context);
      
      // Create i18n configuration
      const i18nConfig = this.createI18nConfiguration(context);
      
      // Convert sections to schemas
      const schemas = await this.convertSectionsToSchemas(
        analysis.documentStructure.sections || [],
        context
      );
      
      // Convert questions to schemas
      const questionSchemas = await this.convertQuestionsToSchemas(
        analysis.extractedQuestions || [],
        context
      );
      
      // Combine all schemas
      const allSchemas = [...schemas, ...questionSchemas];
      
      // Create data schema for validation
      const dataSchema = this.createDataSchema(analysis, allSchemas);
      
      // Generate sample data
      const sampleData = this.generateSampleData(analysis, dataSchema);
      
      // Create final template
      const template: DocuBrandTemplate = {
        id: this.generateTemplateId(),
        name: this.generateTemplateName(analysis),
        description: this.generateTemplateDescription(analysis),
        category: this.determineTemplateCategory(analysis),
        tags: this.generateTemplateTags(analysis),
        
        // PDFme required fields
        basePdf: BLANK_PDF,
        schemas: [allSchemas], // PDFme expects array of page schemas
        
        // DocuBrand extensions
        metadata,
        i18nConfig,
        dataSchema,
        sampleData,
        version: '1.0.0',
        sourceAnalysis: analysis
      };
      
      const processingTime = Date.now() - startTime;
      
      // Create success result
      const result: TemplateCreationResult = {
        success: true,
        template,
        stats: {
          sectionsProcessed: analysis.documentStructure.sections?.length || 0,
          questionsProcessed: analysis.extractedQuestions?.length || 0,
          schemasGenerated: allSchemas.length,
          processingTime
        },
        suggestions: this.generateSuggestions(analysis, template)
      };
      
      console.log('✅ Template conversion completed successfully');
      console.log(`📊 Stats: ${result.stats.sectionsProcessed} sections, ${result.stats.questionsProcessed} questions, ${result.stats.schemasGenerated} schemas in ${processingTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Template conversion failed:', error);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown conversion error'],
        stats: {
          sectionsProcessed: 0,
          questionsProcessed: 0,
          schemasGenerated: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Convert document sections to PDFme schemas
   */
  private async convertSectionsToSchemas(
    sections: DocumentSection[],
    context: ConversionContext
  ): Promise<DocuBrandSchema[]> {
    const schemas: DocuBrandSchema[] = [];
    let currentY = context.pageConfig.margins.top;
    
    for (const [index, section] of sections.entries()) {
      const schema = this.createSchemaFromSection(section, index, currentY, context);
      schemas.push(schema);
      
      // Update Y position for next element
      currentY += this.calculateSchemaHeight(schema);
    }
    
    return schemas;
  }

  /**
   * Convert questions to PDFme schemas
   */
  private async convertQuestionsToSchemas(
    questions: ExtractedQuestion[],
    context: ConversionContext
  ): Promise<DocuBrandSchema[]> {
    const schemas: DocuBrandSchema[] = [];
    let currentY = 150; // Start questions below content sections
    
    for (const [index, question] of questions.entries()) {
      const schema = this.createSchemaFromQuestion(question, index, currentY, context);
      schemas.push(schema);
      
      // Update Y position for next question
      currentY += this.calculateSchemaHeight(schema);
      
      // Add options if multiple choice
      if (question.options && question.options.length > 0) {
        const optionSchemas = this.createOptionSchemas(question.options, currentY, context);
        schemas.push(...optionSchemas);
        currentY += optionSchemas.length * 15; // 15mm per option
      }
    }
    
    return schemas;
  }

  /**
   * Create schema from document section
   */
  private createSchemaFromSection(
    section: DocumentSection,
    index: number,
    yPosition: number,
    context: ConversionContext
  ): DocuBrandSchema {
    const baseSchema: DocuBrandSchema = {
      // PDFme required fields
      name: `section_${index}_${section.type}`, // Unique name for each schema
      type: this.mapContentTypeToSchemaType(section.type),
      position: {
        x: context.pageConfig.margins.left,
        y: yPosition
      },
      width: 170, // A4 width minus margins
      height: this.calculateContentHeight(section.content),
      
      // Data binding
      dataBinding: {
        path: `sections[${index}].content`,
        type: 'text',
        fallback: section.content
      },
      
      // Multi-language support
      i18n: {
        [context.targetLanguage]: {
          content: section.content
        }
      },
      
      // Educational content metadata
      educational: {
        contentType: this.mapSectionTypeToEducationalType(section.type),
        difficulty: this.inferDifficulty(section.content),
        tags: this.generateContentTags(section.content)
      }
    };
    
    // Add styling based on content type
    this.applyContentTypeStyles(baseSchema, section.type);
    
    return baseSchema;
  }

  /**
   * Create schema from question
   */
  private createSchemaFromQuestion(
    question: ExtractedQuestion,
    index: number,
    yPosition: number,
    context: ConversionContext
  ): DocuBrandSchema {
    const baseSchema: DocuBrandSchema = {
      // PDFme required fields
      name: `question_${index}_${question.type}`, // Unique name for each question
      type: 'text',
      position: {
        x: context.pageConfig.margins.left,
        y: yPosition
      },
      width: 170,
      height: this.calculateContentHeight(question.content),
      
      // Data binding
      dataBinding: {
        path: `questions[${index}].content`,
        type: 'text',
        fallback: question.content
      },
      
      // Multi-language support
      i18n: {
        [context.targetLanguage]: {
          content: question.content
        }
      },
      
      // Educational content metadata
      educational: {
        contentType: 'question',
        difficulty: this.inferQuestionDifficulty(question),
        points: question.points || 1,
        tags: [question.type, ...this.generateContentTags(question.content)]
      }
    };
    
    // Apply question-specific styling
    this.applyQuestionStyles(baseSchema, question.type);
    
    return baseSchema;
  }

  /**
   * Create option schemas for multiple choice questions
   */
  private createOptionSchemas(
    options: string[],
    startY: number,
    context: ConversionContext
  ): DocuBrandSchema[] {
    return options.map((option, index) => ({
      // PDFme required fields
      name: `option_${index}_${Date.now()}`, // Unique name for each option
      type: 'text',
      position: {
        x: context.pageConfig.margins.left + 10, // Indent options
        y: startY + (index * 15)
      },
      width: 160,
      height: 12,
      
      // Data binding
      dataBinding: {
        path: `options[${index}]`,
        type: 'text',
        fallback: option
      },
      
      // Multi-language support
      i18n: {
        [context.targetLanguage]: {
          content: option
        }
      },
      
      // Educational content metadata
      educational: {
        contentType: 'answer',
        tags: ['option', 'multiple-choice']
      }
    }));
  }

  /**
   * Create template metadata
   */
  private createTemplateMetadata(
    analysis: GeminiAnalysisResponse,
    context: ConversionContext
  ): TemplateMetadata {
    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'DocuBrand Template Generator',
      
      // Educational metadata
      educational: {
        subject: analysis.documentStructure.subject || 'General',
        gradeLevel: this.inferGradeLevel(analysis),
        difficulty: analysis.documentStructure.difficulty || 'intermediate',
        estimatedTime: analysis.documentStructure.estimatedTime || 30
      }
    };
  }

  /**
   * Create i18n configuration
   */
  private createI18nConfiguration(context: ConversionContext): I18nConfig {
    const supportedLanguages = ['en', 'vi'];
    
    return {
      supportedLanguages,
      defaultLanguage: context.targetLanguage,
      fallbackLanguage: 'en',
      languages: {
        en: this.defaultLanguageConfig,
        vi: this.vietnameseLanguageConfig
      }
    };
  }

  /**
   * Create data schema for validation
   */
  private createDataSchema(
    analysis: GeminiAnalysisResponse,
    schemas: DocuBrandSchema[]
  ): DataSchema {
    const properties: Record<string, any> = {};
    
    // Add sections schema
    if (analysis.documentStructure.sections) {
      properties.sections = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            type: { type: 'string' }
          }
        }
      };
    }
    
    // Add questions schema
    if (analysis.extractedQuestions) {
      properties.questions = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            type: { type: 'string' },
            options: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      };
    }
    
    return {
      type: 'object',
      properties,
      required: ['sections']
    };
  }

  /**
   * Generate sample data for template testing
   */
  private generateSampleData(
    analysis: GeminiAnalysisResponse,
    dataSchema: DataSchema
  ): any {
    const sampleData: any = {};
    
    // Generate sample sections
    if (analysis.documentStructure.sections) {
      sampleData.sections = analysis.documentStructure.sections.map(section => ({
        content: section.content,
        type: section.type
      }));
    }
    
    // Generate sample questions
    if (analysis.extractedQuestions) {
      sampleData.questions = analysis.extractedQuestions.map(question => ({
        content: question.content,
        type: question.type,
        options: question.options || []
      }));
    }
    
    return sampleData;
  }

  /**
   * Helper methods
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateName(analysis: GeminiAnalysisResponse): string {
    const title = analysis.extractedContent?.title;
    const subject = analysis.documentStructure.subject;
    
    if (title) {
      return `${title} - Template`;
    }
    
    if (subject) {
      return `${subject} Document Template`;
    }
    
    return 'Document Template';
  }

  private generateTemplateDescription(analysis: GeminiAnalysisResponse): string {
    const type = analysis.documentStructure.type;
    const subject = analysis.documentStructure.subject;
    const sectionsCount = analysis.documentStructure.sections?.length || 0;
    const questionsCount = analysis.extractedQuestions?.length || 0;
    
    let description = `A ${type} template`;
    
    if (subject) {
      description += ` for ${subject}`;
    }
    
    if (sectionsCount > 0) {
      description += ` with ${sectionsCount} content sections`;
    }
    
    if (questionsCount > 0) {
      description += ` and ${questionsCount} questions`;
    }
    
    return description + '.';
  }

  private determineTemplateCategory(analysis: GeminiAnalysisResponse): TemplateCategory {
    const type = analysis.documentStructure.type;
    
    switch (type) {
      case 'quiz':
        return 'quiz';
      case 'worksheet':
        return 'worksheet';
      case 'exam':
        return 'exam';
      default:
        return 'educational';
    }
  }

  private generateTemplateTags(analysis: GeminiAnalysisResponse): string[] {
    const tags: string[] = [];
    
    // Add document type
    if (analysis.documentStructure.type) {
      tags.push(analysis.documentStructure.type);
    }
    
    // Add subject
    if (analysis.documentStructure.subject) {
      tags.push(analysis.documentStructure.subject.toLowerCase());
    }
    
    // Add difficulty
    if (analysis.documentStructure.difficulty) {
      tags.push(analysis.documentStructure.difficulty);
    }
    
    // Add content-based tags
    if (analysis.extractedQuestions && analysis.extractedQuestions.length > 0) {
      tags.push('questions');
      
      const hasMultipleChoice = analysis.extractedQuestions.some(q => q.type === 'multiple_choice');
      if (hasMultipleChoice) {
        tags.push('multiple-choice');
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private mapContentTypeToSchemaType(contentType: string): string {
    switch (contentType) {
      case 'header':
        return 'text';
      case 'question':
        return 'text';
      case 'instruction':
        return 'text';
      case 'rich':
        return 'text';
      case 'markdown':
        return 'text';
      default:
        return 'text';
    }
  }

  private mapSectionTypeToEducationalType(type: string): 'question' | 'answer' | 'instruction' | 'header' | 'content' {
    switch (type) {
      case 'header':
        return 'header';
      case 'question':
        return 'question';
      case 'instruction':
        return 'instruction';
      default:
        return 'content';
    }
  }

  private calculateContentHeight(content: string): number {
    // Simple height calculation based on content length
    const lines = Math.ceil(content.length / 80); // ~80 chars per line
    return Math.max(12, lines * 6); // Minimum 12mm, 6mm per line
  }

  private calculateSchemaHeight(schema: DocuBrandSchema): number {
    return (schema.height || 12) + 5; // Add spacing
  }

  private inferDifficulty(content: string): 'easy' | 'medium' | 'hard' {
    const complexWords = ['analyze', 'evaluate', 'synthesize', 'compare', 'contrast'];
    const hasComplexWords = complexWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (hasComplexWords) return 'hard';
    if (content.length > 200) return 'medium';
    return 'easy';
  }

  private inferQuestionDifficulty(question: ExtractedQuestion): 'easy' | 'medium' | 'hard' {
    // Use question confidence and content complexity
    const confidence = question.confidence || 0.5;
    const contentLength = question.content.length;
    
    if (confidence < 0.7 || contentLength > 150) return 'hard';
    if (confidence < 0.85 || contentLength > 80) return 'medium';
    return 'easy';
  }

  private inferGradeLevel(analysis: GeminiAnalysisResponse): string {
    const difficulty = analysis.documentStructure.difficulty;
    
    switch (difficulty) {
      case 'beginner':
        return 'Elementary';
      case 'intermediate':
        return 'Middle School';
      case 'advanced':
        return 'High School';
      default:
        return 'General';
    }
  }

  private generateContentTags(content: string): string[] {
    const tags: string[] = [];
    
    // Simple keyword extraction
    if (content.includes('?')) tags.push('question');
    if (content.includes('calculate') || content.includes('solve')) tags.push('math');
    if (content.includes('analyze') || content.includes('explain')) tags.push('analysis');
    if (content.includes('compare') || content.includes('contrast')) tags.push('comparison');
    
    return tags;
  }

  private applyContentTypeStyles(schema: DocuBrandSchema, contentType: string): void {
    // Add default styles based on content type
    switch (contentType) {
      case 'header':
        schema.fontSize = 16;
        schema.fontWeight = 'bold';
        schema.textAlign = 'center';
        break;
      case 'question':
        schema.fontSize = 12;
        schema.fontWeight = 'normal';
        schema.textAlign = 'left';
        break;
      case 'instruction':
        schema.fontSize = 10;
        schema.fontStyle = 'italic';
        schema.textAlign = 'left';
        break;
      default:
        schema.fontSize = 11;
        schema.fontWeight = 'normal';
        schema.textAlign = 'left';
    }
  }

  private applyQuestionStyles(schema: DocuBrandSchema, questionType: string): void {
    schema.fontSize = 12;
    schema.fontWeight = 'normal';
    schema.textAlign = 'left';
    
    // Add question number prefix
    if (schema.dataBinding) {
      schema.dataBinding.addQuestionNumberPrefix = true;
    }
  }

  private generateSuggestions(
    analysis: GeminiAnalysisResponse,
    template: DocuBrandTemplate
  ): string[] {
    const suggestions: string[] = [];
    
    // Check for improvement opportunities
    if (analysis.documentStructure.confidence < 0.8) {
      suggestions.push('Consider reviewing the template structure as the AI analysis had lower confidence.');
    }
    
    if (template.schemas[0].length > 20) {
      suggestions.push('Consider breaking this template into multiple pages for better readability.');
    }
    
    if (analysis.extractedQuestions && analysis.extractedQuestions.length > 10) {
      suggestions.push('Consider grouping questions by topic or difficulty level.');
    }
    
    return suggestions;
  }
}