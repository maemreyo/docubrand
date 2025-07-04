// Main integration class that brings together all template system components

import { PDFTemplateEngine } from './core/TemplateEngine';
import { GeminiToPDFMeDataAdapter } from './core/DataAdapter';
import { LocalTemplateStorage, getTemplateStorage } from './storage/LocalTemplateStorage';
import { educationalContentPlugins } from './plugins/educational-content-plugins';

import {
  DocuBrandTemplate,
  TemplateCreationResult,
  TemplateGenerationOptions,
  TemplateLibraryEntry,
  TemplateCategory,
  ValidationResult,
  TemplateEngine as ITemplateEngine,
  TemplateStorage
} from './types/template-types';

import type { GeminiAnalysisResponse } from '@/types/gemini';

/**
 * Main PDF Template System class
 * Provides a unified interface for all template system functionality
 */
export class PDFTemplateSystem {
  private engine: ITemplateEngine;
  private storage: TemplateStorage;
  private adapter: GeminiToPDFMeDataAdapter;
  private initialized: boolean = false;

  constructor() {
    this.storage = getTemplateStorage();
    this.engine = new PDFTemplateEngine(this.storage);
    this.adapter = new GeminiToPDFMeDataAdapter();
  }

  /**
   * Initialize the template system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🚀 Initializing PDF Template System...');

      // Register educational content plugins
      for (const plugin of educationalContentPlugins) {
        this.engine.registerPlugin(plugin);
      }

      this.initialized = true;
      console.log('✅ PDF Template System initialized successfully');

    } catch (error) {
      console.error('❌ PDF Template System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create template from Gemini analysis
   */
  public async createTemplateFromAnalysis(
    analysis: GeminiAnalysisResponse,
    options?: Partial<TemplateGenerationOptions>
  ): Promise<TemplateCreationResult> {
    await this.ensureInitialized();

    const defaultOptions: TemplateGenerationOptions = {
      language: 'vi',
      fallbackLanguage: 'en',
      fontConfig: {
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
      },
      layout: {
        autoOptimize: true,
        preserveWhitespace: false,
        respectOriginalPositions: false,
        generateResponsiveLayout: true
      },
      content: {
        processMarkdown: true,
        generateDataBindings: true,
        createConditionalElements: false,
        optimizeImages: true
      },
      quality: {
        imageQuality: 0.8,
        fontEmbedding: true,
        vectorizeText: true,
        compression: true
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return await this.engine.createFromAnalysis(analysis, mergedOptions);
  }

  /**
   * Generate PDF from template
   */
  public async generatePDF(
    templateId: string,
    data: any,
    options?: any
  ): Promise<Uint8Array> {
    await this.ensureInitialized();

    const template = await this.engine.loadTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return await this.engine.generatePDF(template, data, options);
  }

  /**
   * Generate PDF from template object
   */
  public async generatePDFFromTemplate(
    template: DocuBrandTemplate,
    data: any,
    options?: any
  ): Promise<Uint8Array> {
    await this.ensureInitialized();

    return await this.engine.generatePDF(template, data, options);
  }

  /**
   * Get template library
   */
  public async getTemplateLibrary(): Promise<TemplateLibraryEntry[]> {
    await this.ensureInitialized();
    return await this.engine.getTemplateLibrary();
  }

  /**
   * Search templates
   */
  public async searchTemplates(query: string): Promise<TemplateLibraryEntry[]> {
    await this.ensureInitialized();
    return await this.engine.searchTemplates(query);
  }

  /**
   * Get templates by category
   */
  public async getTemplatesByCategory(category: TemplateCategory): Promise<TemplateLibraryEntry[]> {
    await this.ensureInitialized();
    return await this.engine.getTemplatesByCategory(category);
  }

  /**
   * Load template
   */
  public async loadTemplate(id: string): Promise<DocuBrandTemplate | null> {
    await this.ensureInitialized();
    return await this.engine.loadTemplate(id);
  }

  /**
   * Save template
   */
  public async saveTemplate(template: DocuBrandTemplate): Promise<void> {
    await this.ensureInitialized();
    return await this.engine.saveTemplate(template);
  }

  /**
   * Delete template
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return await this.engine.deleteTemplate(id);
  }

  /**
   * Validate template
   */
  public async validateTemplate(template: DocuBrandTemplate): Promise<ValidationResult> {
    await this.ensureInitialized();
    return await this.engine.validateTemplate(template);
  }

  /**
   * Validate data against template
   */
  public async validateData(template: DocuBrandTemplate, data: any): Promise<ValidationResult> {
    await this.ensureInitialized();
    return await this.engine.validateData(template, data);
  }

  /**
   * Get system statistics
   */
  public async getSystemStats(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const templates = await this.getTemplateLibrary();
      const storageStats = await this.storage.getStorageStats();
      
      // Calculate category distribution
      const categoryStats = templates.reduce((acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Calculate usage statistics
      const totalDownloads = templates.reduce((sum, template) => sum + template.usage.downloads, 0);
      const avgRating = templates.reduce((sum, template) => sum + template.usage.rating, 0) / templates.length;
      
      // Calculate recent activity
      const recentTemplates = templates.filter(template => {
        const lastUpdated = new Date(template.usage.lastUpdated);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastUpdated > weekAgo;
      });
      
      return {
        templateCount: templates.length,
        categoryStats,
        totalDownloads,
        avgRating: Number(avgRating.toFixed(1)),
        recentActivity: recentTemplates.length,
        storageStats,
        plugins: this.engine.getPlugins().length,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to get system stats:', error);
      return {
        templateCount: 0,
        categoryStats: {},
        totalDownloads: 0,
        avgRating: 0,
        recentActivity: 0,
        storageStats: null,
        plugins: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Export templates for backup
   */
  public async exportTemplates(): Promise<string> {
    await this.ensureInitialized();
    return await this.storage.exportTemplates();
  }

  /**
   * Import templates from backup
   */
  public async importTemplates(jsonString: string): Promise<number> {
    await this.ensureInitialized();
    return await this.storage.importTemplates(jsonString);
  }

  /**
   * Clear all templates (for testing)
   */
  public async clearAllTemplates(): Promise<void> {
    await this.ensureInitialized();
    return await this.storage.clearAll();
  }

  /**
   * Get registered plugins
   */
  public getPlugins(): string[] {
    return this.engine.getPlugins().map(plugin => plugin.name);
  }

  /**
   * Create sample templates for demonstration
   */
  public async createSampleTemplates(): Promise<void> {
    await this.ensureInitialized();
    
    console.log('📝 Creating sample templates...');
    
    try {
      // Create sample quiz template
      const quizTemplate = await this.createSampleQuizTemplate();
      await this.saveTemplate(quizTemplate);
      
      // Create sample worksheet template
      const worksheetTemplate = await this.createSampleWorksheetTemplate();
      await this.saveTemplate(worksheetTemplate);
      
      // Create sample exam template
      const examTemplate = await this.createSampleExamTemplate();
      await this.saveTemplate(examTemplate);
      
      console.log('✅ Sample templates created successfully');
      
    } catch (error) {
      console.error('❌ Failed to create sample templates:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async createSampleQuizTemplate(): Promise<DocuBrandTemplate> {
    const template: DocuBrandTemplate = {
      id: 'sample_quiz_' + Date.now(),
      name: 'Sample Quiz Template',
      description: 'A sample quiz template with multiple choice questions',
      category: 'quiz',
      tags: ['quiz', 'multiple-choice', 'educational', 'sample'],
      
      basePdf: '', // Will be set to BLANK_PDF
      schemas: [[
        {
          name: 'quiz_title', // Required PDFme field
          type: 'text',
          position: { x: 20, y: 20 },
          width: 170,
          height: 15,
          content: 'Quiz: {{quiz.title}}',
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center',
          dataBinding: {
            path: 'quiz.title',
            type: 'text',
            fallback: 'Sample Quiz'
          }
        },
        {
          name: 'question_1', // Required PDFme field
          type: 'text',
          position: { x: 20, y: 40 },
          width: 170,
          height: 25,
          questionType: 'multiple-choice',
          questionNumber: 1,
          dataBinding: {
            path: 'questions[0].content',
            type: 'text',
            fallback: 'What is 2 + 2?'
          }
        }
      ]],
      
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'PDF Template System',
        educational: {
          subject: 'Mathematics',
          gradeLevel: 'Elementary',
          difficulty: 'easy',
          estimatedTime: 15
        }
      },
      
      i18nConfig: {
        supportedLanguages: ['vi', 'en'],
        defaultLanguage: 'vi',
        fallbackLanguage: 'en',
        languages: {
          vi: {
            code: 'vi',
            name: 'Tiếng Việt',
            direction: 'ltr',
            fontFamily: 'NotoSansVietnamese',
            fallbackFonts: ['Arial Unicode MS', 'Tahoma'],
            fontFiles: {
              regular: '/fonts/NotoSans-Vietnamese-Regular.ttf',
              bold: '/fonts/NotoSans-Vietnamese-Bold.ttf',
              italic: '/fonts/NotoSans-Vietnamese-Italic.ttf',
              boldItalic: '/fonts/NotoSans-Vietnamese-BoldItalic.ttf'
            },
            unicodeRange: 'U+0000-007F,U+0100-017F,U+1EA0-1EF9'
          },
          en: {
            code: 'en',
            name: 'English',
            direction: 'ltr',
            fontFamily: 'NotoSans',
            fallbackFonts: ['Arial', 'Helvetica'],
            fontFiles: {
              regular: '/fonts/NotoSans-Regular.ttf',
              bold: '/fonts/NotoSans-Bold.ttf',
              italic: '/fonts/NotoSans-Italic.ttf',
              boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
            },
            unicodeRange: 'U+0000-007F'
          }
        }
      },
      
      dataSchema: {
        type: 'object',
        properties: {
          quiz: {
            type: 'object',
            properties: {
              title: { type: 'string' }
            }
          },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                options: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      },
      
      sampleData: {
        quiz: {
          title: 'Sample Mathematics Quiz'
        },
        questions: [
          {
            content: 'What is 2 + 2?',
            options: ['3', '4', '5', '6']
          }
        ]
      },
      
      version: '1.0.0'
    };

    return template;
  }

  private async createSampleWorksheetTemplate(): Promise<DocuBrandTemplate> {
    const template: DocuBrandTemplate = {
      id: 'sample_worksheet_' + Date.now(),
      name: 'Sample Worksheet Template',
      description: 'A sample worksheet template with various exercise types',
      category: 'worksheet',
      tags: ['worksheet', 'exercises', 'educational', 'sample'],
      
      basePdf: '', // Will be set to BLANK_PDF
      schemas: [[
        {
          name: 'worksheet_title', // Required PDFme field
          type: 'text',
          position: { x: 20, y: 20 },
          width: 170,
          height: 15,
          content: 'Worksheet: {{worksheet.title}}',
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center',
          dataBinding: {
            path: 'worksheet.title',
            type: 'text',
            fallback: 'Sample Worksheet'
          }
        },
        {
          name: 'worksheet_instruction', // Required PDFme field
          type: 'text',
          position: { x: 20, y: 40 },
          width: 170,
          height: 20,
          instructionType: 'directions',
          content: 'Complete the following exercises',
          fontSize: 11,
          fontStyle: 'italic'
        }
      ]],
      
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'PDF Template System',
        educational: {
          subject: 'General',
          gradeLevel: 'Elementary',
          difficulty: 'medium',
          estimatedTime: 30
        }
      },
      
      i18nConfig: {
        supportedLanguages: ['vi', 'en'],
        defaultLanguage: 'vi',
        fallbackLanguage: 'en',
        languages: {
          vi: {
            code: 'vi',
            name: 'Tiếng Việt',
            direction: 'ltr',
            fontFamily: 'NotoSansVietnamese',
            fallbackFonts: ['Arial Unicode MS', 'Tahoma'],
            fontFiles: {
              regular: '/fonts/NotoSans-Vietnamese-Regular.ttf',
              bold: '/fonts/NotoSans-Vietnamese-Bold.ttf',
              italic: '/fonts/NotoSans-Vietnamese-Italic.ttf',
              boldItalic: '/fonts/NotoSans-Vietnamese-BoldItalic.ttf'
            },
            unicodeRange: 'U+0000-007F,U+0100-017F,U+1EA0-1EF9'
          },
          en: {
            code: 'en',
            name: 'English',
            direction: 'ltr',
            fontFamily: 'NotoSans',
            fallbackFonts: ['Arial', 'Helvetica'],
            fontFiles: {
              regular: '/fonts/NotoSans-Regular.ttf',
              bold: '/fonts/NotoSans-Bold.ttf',
              italic: '/fonts/NotoSans-Italic.ttf',
              boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
            },
            unicodeRange: 'U+0000-007F'
          }
        }
      },
      
      dataSchema: {
        type: 'object',
        properties: {
          worksheet: {
            type: 'object',
            properties: {
              title: { type: 'string' }
            }
          },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                type: { type: 'string' }
              }
            }
          }
        }
      },
      
      sampleData: {
        worksheet: {
          title: 'Sample Practice Worksheet'
        },
        exercises: [
          {
            content: 'Complete the following sentences',
            type: 'fill-blank'
          }
        ]
      },
      
      version: '1.0.0'
    };

    return template;
  }

  private async createSampleExamTemplate(): Promise<DocuBrandTemplate> {
    const template: DocuBrandTemplate = {
      id: 'sample_exam_' + Date.now(),
      name: 'Sample Exam Template',
      description: 'A sample exam template with formal assessment layout',
      category: 'exam',
      tags: ['exam', 'assessment', 'formal', 'sample'],
      
      basePdf: '', // Will be set to BLANK_PDF
      schemas: [[
        {
          name: 'exam_title', // Required PDFme field
          type: 'text',
          position: { x: 20, y: 20 },
          width: 170,
          height: 15,
          content: 'EXAM: {{exam.title}}',
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          dataBinding: {
            path: 'exam.title',
            type: 'text',
            fallback: 'Sample Exam'
          }
        },
        {
          name: 'exam_info', // Required PDFme field
          type: 'text',
          position: { x: 20, y: 35 },
          width: 170,
          height: 10,
          content: 'Time: {{exam.timeLimit}} minutes | Total Points: {{exam.totalPoints}}',
          fontSize: 11,
          textAlign: 'center',
          dataBinding: {
            path: 'exam.info',
            type: 'text',
            fallback: 'Time: 60 minutes | Total Points: 100'
          }
        }
      ]],
      
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'PDF Template System',
        educational: {
          subject: 'General',
          gradeLevel: 'High School',
          difficulty: 'advanced',
          estimatedTime: 60
        }
      },
      
      i18nConfig: {
        supportedLanguages: ['vi', 'en'],
        defaultLanguage: 'vi',
        fallbackLanguage: 'en',
        languages: {
          vi: {
            code: 'vi',
            name: 'Tiếng Việt',
            direction: 'ltr',
            fontFamily: 'NotoSansVietnamese',
            fallbackFonts: ['Arial Unicode MS', 'Tahoma'],
            fontFiles: {
              regular: '/fonts/NotoSans-Vietnamese-Regular.ttf',
              bold: '/fonts/NotoSans-Vietnamese-Bold.ttf',
              italic: '/fonts/NotoSans-Vietnamese-Italic.ttf',
              boldItalic: '/fonts/NotoSans-Vietnamese-BoldItalic.ttf'
            },
            unicodeRange: 'U+0000-007F,U+0100-017F,U+1EA0-1EF9'
          },
          en: {
            code: 'en',
            name: 'English',
            direction: 'ltr',
            fontFamily: 'NotoSans',
            fallbackFonts: ['Arial', 'Helvetica'],
            fontFiles: {
              regular: '/fonts/NotoSans-Regular.ttf',
              bold: '/fonts/NotoSans-Bold.ttf',
              italic: '/fonts/NotoSans-Italic.ttf',
              boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
            },
            unicodeRange: 'U+0000-007F'
          }
        }
      },
      
      dataSchema: {
        type: 'object',
        properties: {
          exam: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              timeLimit: { type: 'number' },
              totalPoints: { type: 'number' }
            }
          }
        }
      },
      
      sampleData: {
        exam: {
          title: 'Sample Final Exam',
          timeLimit: 60,
          totalPoints: 100
        }
      },
      
      version: '1.0.0'
    };

    return template;
  }
}

/**
 * Singleton instance for application-wide use
 */
let templateSystemInstance: PDFTemplateSystem | null = null;

/**
 * Get the global template system instance
 */
export function getPDFTemplateSystem(): PDFTemplateSystem {
  if (!templateSystemInstance) {
    templateSystemInstance = new PDFTemplateSystem();
  }
  return templateSystemInstance;
}

/**
 * Initialize the template system
 */
export async function initializePDFTemplateSystem(): Promise<PDFTemplateSystem> {
  const system = getPDFTemplateSystem();
  await system.initialize();
  return system;
}

/**
 * Reset the template system instance (for testing)
 */
export function resetPDFTemplateSystem(): void {
  templateSystemInstance = null;
}

export default PDFTemplateSystem;