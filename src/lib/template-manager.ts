// CREATED: 2025-07-04 - Template management system for educational documents

import { Template, checkTemplate } from '@pdfme/common';
import { ValidationResult } from './pdfme-integration';
import { GeminiAnalysisResponse } from '@/types/gemini';
import { DataBinding, MappingResult } from './gemini-to-pdfme';

// Template metadata interface
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: 'quiz' | 'worksheet' | 'exam' | 'assignment' | 'handout' | 'general';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: string;
  author?: string;
  thumbnail?: string;
}

// Full template definition
export interface TemplateDefinition {
  metadata: TemplateMetadata;
  template: Template;
  dataBindings: DataBinding[];
  sampleData?: any;
  previewData?: any;
}

// Template storage interface
export interface TemplateStorage {
  save(definition: TemplateDefinition): Promise<void>;
  load(id: string): Promise<TemplateDefinition | null>;
  list(): Promise<TemplateMetadata[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

// Local storage implementation
class LocalTemplateStorage implements TemplateStorage {
  private storageKey = 'pdfme_templates';

  async save(definition: TemplateDefinition): Promise<void> {
    try {
      const stored = this.getStoredTemplates();
      stored[definition.metadata.id] = definition;
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      throw new Error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async load(id: string): Promise<TemplateDefinition | null> {
    try {
      const stored = this.getStoredTemplates();
      return stored[id] || null;
    } catch (error) {
      throw new Error(`Failed to load template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async list(): Promise<TemplateMetadata[]> {
    try {
      const stored = this.getStoredTemplates();
      return Object.values(stored).map(def => def.metadata);
    } catch (error) {
      throw new Error(`Failed to list templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const stored = this.getStoredTemplates();
      delete stored[id];
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const stored = this.getStoredTemplates();
      return id in stored;
    } catch (error) {
      return false;
    }
  }

  private getStoredTemplates(): Record<string, TemplateDefinition> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to parse stored templates, resetting storage');
      localStorage.removeItem(this.storageKey);
      return {};
    }
  }
}

/**
 * Template manager class for educational documents
 */
export class TemplateManager {
  private storage: TemplateStorage;

  constructor(storage?: TemplateStorage) {
    this.storage = storage || new LocalTemplateStorage();
  }

  /**
   * Create new template definition
   */
  async createTemplate(config: {
    name: string;
    description?: string;
    category?: TemplateMetadata['category'];
    tags?: string[];
    author?: string;
    template?: Template;
    dataBindings?: DataBinding[];
    sampleData?: any;
  }): Promise<TemplateDefinition> {
    const id = this.generateId();
    const now = Date.now();

    const metadata: TemplateMetadata = {
      id,
      name: config.name,
      description: config.description || '',
      category: config.category || 'general',
      tags: config.tags || [],
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      author: config.author,
    };

    const definition: TemplateDefinition = {
      metadata,
      template: config.template || this.createBlankTemplate(),
      dataBindings: config.dataBindings || [],
      sampleData: config.sampleData,
    };

    await this.storage.save(definition);
    return definition;
  }

  /**
   * Create template from Gemini analysis
   */
  async createFromGeminiAnalysis(
    analysis: GeminiAnalysisResponse,
    config: {
      name: string;
      description?: string;
      category?: TemplateMetadata['category'];
      tags?: string[];
      author?: string;
    }
  ): Promise<TemplateDefinition> {
    const { geminiToPdfmeMapper } = await import('./gemini-to-pdfme');
    const mappingResult = geminiToPdfmeMapper.convertAnalysisToTemplate(analysis);

    return this.createTemplate({
      ...config,
      template: mappingResult.template,
      dataBindings: mappingResult.dataBindings,
      sampleData: analysis,
    });
  }

  /**
   * Save template definition
   */
  async saveTemplate(definition: TemplateDefinition): Promise<void> {
    // Validate template
    const validation = this.validateTemplate(definition.template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Update timestamp
    definition.metadata.updatedAt = Date.now();

    await this.storage.save(definition);
  }

  /**
   * Load template definition
   */
  async loadTemplate(id: string): Promise<TemplateDefinition | null> {
    return await this.storage.load(id);
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<TemplateMetadata[]> {
    return await this.storage.list();
  }

  /**
   * List templates by category
   */
  async listTemplatesByCategory(category: TemplateMetadata['category']): Promise<TemplateMetadata[]> {
    const templates = await this.storage.list();
    return templates.filter(t => t.category === category);
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string): Promise<TemplateMetadata[]> {
    const templates = await this.storage.list();
    const lowerQuery = query.toLowerCase();
    
    return templates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(id: string, newName: string): Promise<TemplateDefinition> {
    const original = await this.storage.load(id);
    if (!original) {
      throw new Error('Template not found');
    }

    const newId = this.generateId();
    const now = Date.now();

    const duplicated: TemplateDefinition = {
      metadata: {
        ...original.metadata,
        id: newId,
        name: newName,
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
      },
      template: JSON.parse(JSON.stringify(original.template)), // Deep copy
      dataBindings: [...original.dataBindings],
      sampleData: original.sampleData,
      previewData: original.previewData,
    };

    await this.storage.save(duplicated);
    return duplicated;
  }

  /**
   * Export template as JSON
   */
  async exportTemplate(id: string): Promise<string> {
    const definition = await this.storage.load(id);
    if (!definition) {
      throw new Error('Template not found');
    }

    return JSON.stringify(definition, null, 2);
  }

  /**
   * Import template from JSON
   */
  async importTemplate(jsonData: string): Promise<TemplateDefinition> {
    try {
      const definition = JSON.parse(jsonData) as TemplateDefinition;
      
      // Validate structure
      if (!definition.metadata || !definition.template) {
        throw new Error('Invalid template structure');
      }

      // Generate new ID to avoid conflicts
      const newId = this.generateId();
      definition.metadata.id = newId;
      definition.metadata.updatedAt = Date.now();

      // Validate template
      const validation = this.validateTemplate(definition.template);
      if (!validation.valid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      await this.storage.save(definition);
      return definition;
    } catch (error) {
      throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate template
   */
  validateTemplate(template: Template): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      checkTemplate(template);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Template validation failed');
    }

    // Additional validation
    if (!template.schemas || template.schemas.length === 0) {
      errors.push('Template must have at least one schema');
    }

    // Check for duplicate field names
    const fieldNames = new Set<string>();
    template.schemas.forEach((page, pageIndex) => {
      page.forEach((schema, schemaIndex) => {
        if (schema.name) {
          if (fieldNames.has(schema.name)) {
            errors.push(`Duplicate field name "${schema.name}" found on page ${pageIndex + 1}`);
          } else {
            fieldNames.add(schema.name);
          }
        } else {
          warnings.push(`Schema at page ${pageIndex + 1}, position ${schemaIndex + 1} has no name`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Update template metadata
   */
  async updateMetadata(id: string, updates: Partial<TemplateMetadata>): Promise<void> {
    const definition = await this.storage.load(id);
    if (!definition) {
      throw new Error('Template not found');
    }

    definition.metadata = {
      ...definition.metadata,
      ...updates,
      id, // Preserve ID
      updatedAt: Date.now(),
    };

    await this.storage.save(definition);
  }

  /**
   * Get template statistics
   */
  async getStatistics(): Promise<{
    totalTemplates: number;
    categoryCounts: Record<string, number>;
    recentTemplates: TemplateMetadata[];
    totalSize: number;
  }> {
    const templates = await this.storage.list();
    
    const categoryCounts: Record<string, number> = {};
    templates.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    const recentTemplates = templates
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);

    // Estimate storage size
    const totalSize = JSON.stringify(templates).length;

    return {
      totalTemplates: templates.length,
      categoryCounts,
      recentTemplates,
      totalSize,
    };
  }

  /**
   * Create blank template
   */
  private createBlankTemplate(): Template {
    return {
      basePdf: {
        width: 210,
        height: 297,
        padding: [20, 20, 20, 20],
      },
      schemas: [[]],
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get built-in templates
   */
  getBuiltInTemplates(): TemplateDefinition[] {
    return [
      {
        metadata: {
          id: 'builtin_quiz',
          name: 'Quiz Template',
          description: 'Standard quiz template with multiple choice questions',
          category: 'quiz',
          tags: ['quiz', 'multiple-choice', 'assessment'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
          author: 'DocuBrand',
        },
        template: this.createQuizTemplate(),
        dataBindings: this.createQuizDataBindings(),
        sampleData: this.createQuizSampleData(),
      },
      {
        metadata: {
          id: 'builtin_worksheet',
          name: 'Worksheet Template',
          description: 'Educational worksheet template with sections and exercises',
          category: 'worksheet',
          tags: ['worksheet', 'exercises', 'practice'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
          author: 'DocuBrand',
        },
        template: this.createWorksheetTemplate(),
        dataBindings: this.createWorksheetDataBindings(),
        sampleData: this.createWorksheetSampleData(),
      },
    ];
  }

  /**
   * Create quiz template
   */
  private createQuizTemplate(): Template {
    return {
      basePdf: {
        width: 210,
        height: 297,
        padding: [20, 20, 20, 20],
      },
      schemas: [
        [
          {
            name: 'title',
            type: 'text',
            content: 'Quiz Title',
            position: { x: 20, y: 20 },
            width: 170,
            height: 15,
            fontSize: 18,
            fontColor: '#000000',
            fontName: 'Roboto-Regular',
            alignment: 'center',
            fontWeight: 'bold',
          },
          {
            name: 'instructions',
            type: 'text',
            content: 'Choose the best answer for each question.',
            position: { x: 20, y: 45 },
            width: 170,
            height: 10,
            fontSize: 10,
            fontColor: '#666666',
            fontName: 'Roboto-Regular',
            alignment: 'center',
          },
          {
            name: 'question1',
            type: 'text',
            content: '1. Question content here',
            position: { x: 20, y: 70 },
            width: 170,
            height: 12,
            fontSize: 12,
            fontColor: '#000000',
            fontName: 'Roboto-Regular',
            alignment: 'left',
          },
          {
            name: 'question1_options',
            type: 'text',
            content: 'A. Option A\nB. Option B\nC. Option C\nD. Option D',
            position: { x: 30, y: 85 },
            width: 160,
            height: 25,
            fontSize: 10,
            fontColor: '#333333',
            fontName: 'Roboto-Regular',
            alignment: 'left',
          },
        ],
      ],
    };
  }

  /**
   * Create worksheet template
   */
  private createWorksheetTemplate(): Template {
    return {
      basePdf: {
        width: 210,
        height: 297,
        padding: [20, 20, 20, 20],
      },
      schemas: [
        [
          {
            name: 'title',
            type: 'text',
            content: 'Worksheet Title',
            position: { x: 20, y: 20 },
            width: 170,
            height: 15,
            fontSize: 18,
            fontColor: '#000000',
            fontName: 'Roboto-Regular',
            alignment: 'center',
            fontWeight: 'bold',
          },
          {
            name: 'section1_header',
            type: 'text',
            content: 'Section 1: Overview',
            position: { x: 20, y: 50 },
            width: 170,
            height: 12,
            fontSize: 14,
            fontColor: '#000000',
            fontName: 'Roboto-Regular',
            alignment: 'left',
            fontWeight: 'bold',
          },
          {
            name: 'section1_content',
            type: 'text',
            content: 'Section content goes here...',
            position: { x: 20, y: 70 },
            width: 170,
            height: 30,
            fontSize: 12,
            fontColor: '#333333',
            fontName: 'Roboto-Regular',
            alignment: 'left',
          },
        ],
      ],
    };
  }

  /**
   * Create sample data bindings
   */
  private createQuizDataBindings(): DataBinding[] {
    return [
      { path: 'title', type: 'text', fallback: 'Quiz Title' },
      { path: 'question1.content', type: 'text', fallback: 'Question 1' },
      { path: 'question1.options', type: 'list', fallback: [] },
    ];
  }

  private createWorksheetDataBindings(): DataBinding[] {
    return [
      { path: 'title', type: 'text', fallback: 'Worksheet Title' },
      { path: 'section1.header', type: 'text', fallback: 'Section 1' },
      { path: 'section1.content', type: 'text', fallback: 'Content' },
    ];
  }

  /**
   * Create sample data
   */
  private createQuizSampleData(): any {
    return {
      title: 'Sample Quiz',
      question1: {
        content: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
      },
    };
  }

  private createWorksheetSampleData(): any {
    return {
      title: 'Sample Worksheet',
      section1: {
        header: 'Introduction',
        content: 'This is a sample worksheet for educational purposes.',
      },
    };
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();