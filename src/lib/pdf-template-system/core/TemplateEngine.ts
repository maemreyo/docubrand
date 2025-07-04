// Core template engine for managing PDF templates

import { generate } from '@pdfme/generator';
import type { Template as PDFMeTemplate } from '@pdfme/common';
import { text, image, barcodes } from '@pdfme/schemas';

import {
  DocuBrandTemplate,
  TemplateEngine as ITemplateEngine,
  TemplateCreationResult,
  TemplateGenerationOptions,
  ConversionContext,
  ValidationResult,
  ValidationError,
  TemplatePlugin,
  TemplateStorage,
  TemplateLibraryEntry,
  TemplateCategory
} from '../types/template-types';

import type { GeminiAnalysisResponse } from '@/types/gemini';
import { GeminiToPDFMeDataAdapter } from './DataAdapter';

/**
 * Core template engine implementation
 */
export class PDFTemplateEngine implements ITemplateEngine {
  private dataAdapter: GeminiToPDFMeDataAdapter;
  private storage: TemplateStorage;
  private plugins: Map<string, TemplatePlugin> = new Map();
  private schemaRegistry: Map<string, any> = new Map();

  constructor(storage: TemplateStorage) {
    this.storage = storage;
    this.dataAdapter = new GeminiToPDFMeDataAdapter();
    
    // Initialize with default plugins
    this.initializeDefaultPlugins();
  }

  /**
   * Create template from Gemini analysis
   */
  public async createFromAnalysis(
    analysis: GeminiAnalysisResponse,
    options: TemplateGenerationOptions
  ): Promise<TemplateCreationResult> {
    console.log('🎨 Creating template from analysis...');
    
    try {
      // Create conversion context
      const context: ConversionContext = {
        sourceAnalysis: analysis,
        targetLanguage: options.language,
        templateCategory: this.determineCategory(analysis),
        options: {
          autoLayoutOptimization: options.layout.autoOptimize,
          preserveOriginalFormatting: !options.layout.autoOptimize,
          generateSampleData: true,
          createMultiLanguageBindings: true
        },
        pageConfig: {
          format: 'A4',
          orientation: 'portrait',
          margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        }
      };

      // Convert using data adapter
      const result = await this.dataAdapter.convertAnalysisToTemplate(analysis, context);
      
      if (result.success && result.template) {
        // Apply generation options
        await this.applyGenerationOptions(result.template, options);
        
        // Validate the created template
        const validation = await this.validateTemplate(result.template);
        
        if (!validation.valid) {
          console.warn('⚠️ Template validation warnings:', validation.warnings);
          result.warnings = validation.warnings.map(w => w.message);
        }
        
        // Save template to storage
        await this.saveTemplate(result.template);
        
        console.log('✅ Template created successfully:', result.template.id);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Template creation failed:', error);
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        stats: {
          sectionsProcessed: 0,
          questionsProcessed: 0,
          schemasGenerated: 0,
          processingTime: 0
        }
      };
    }
  }

  /**
   * Load template from storage
   */
  public async loadTemplate(id: string): Promise<DocuBrandTemplate | null> {
    console.log(`📁 Loading template: ${id}`);
    
    try {
      const template = await this.storage.load(id);
      
      if (template) {
        console.log('✅ Template loaded successfully');
        return template;
      } else {
        console.warn('⚠️ Template not found');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Template loading failed:', error);
      return null;
    }
  }

  /**
   * Save template to storage
   */
  public async saveTemplate(template: DocuBrandTemplate): Promise<void> {
    console.log(`💾 Saving template: ${template.id}`);
    
    try {
      // Update timestamp
      template.metadata.updatedAt = new Date().toISOString();
      
      await this.storage.save(template);
      console.log('✅ Template saved successfully');
      
    } catch (error) {
      console.error('❌ Template saving failed:', error);
      throw error;
    }
  }

  /**
   * Delete template from storage
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    console.log(`🗑️ Deleting template: ${id}`);
    
    try {
      const result = await this.storage.delete(id);
      
      if (result) {
        console.log('✅ Template deleted successfully');
      } else {
        console.warn('⚠️ Template not found for deletion');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Template deletion failed:', error);
      return false;
    }
  }

  /**
   * Generate PDF from template
   */
  public async generatePDF(
    template: DocuBrandTemplate,
    data: any,
    options?: any
  ): Promise<Uint8Array> {
    console.log(`🔄 Generating PDF from template: ${template.id}`);
    
    try {
      // Validate data against template schema
      const dataValidation = await this.validateData(template, data);
      
      if (!dataValidation.valid) {
        console.warn('⚠️ Data validation warnings:', dataValidation.warnings);
        // Continue with warnings, but throw on errors
        if (dataValidation.errors.length > 0) {
          throw new Error(`Data validation failed: ${dataValidation.errors[0].message}`);
        }
      }
      
      // Prepare PDFme template
      const pdfmeTemplate: PDFMeTemplate = {
        basePdf: template.basePdf,
        schemas: template.schemas.map((pageSchemas, pageIndex) => {
          return pageSchemas.map((schema) => {
            if (schema.dataBinding?.addQuestionNumberPrefix && schema.type === 'text') {
              const questionIndex = pageIndex + 1; // Assuming questions are numbered per page
              return {
                ...schema,
                content: `${questionIndex}. ${schema.content}`
              };
            }
            return schema;
          });
        })
      };
      
      // Prepare input data
      const inputs = this.prepareInputData(data, template);
      
      // Generate PDF using PDFme
      const pdfBuffer = await generate({
        template: pdfmeTemplate,
        inputs,
        options: {
          ...options,
          ...this.getGenerationOptions(template)
        },
        plugins: this.getActivePlugins()
      });
      
      console.log('✅ PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    }
  }

  /**
   * Validate template structure
   */
  public async validateTemplate(template: DocuBrandTemplate): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    try {
      // Check required fields
      if (!template.id) {
        errors.push({
          field: 'id',
          message: 'Template ID is required',
          code: 'MISSING_ID',
          severity: 'error'
        });
      }
      
      if (!template.name) {
        errors.push({
          field: 'name',
          message: 'Template name is required',
          code: 'MISSING_NAME',
          severity: 'error'
        });
      }
      
      if (!template.basePdf) {
        errors.push({
          field: 'basePdf',
          message: 'Base PDF is required',
          code: 'MISSING_BASE_PDF',
          severity: 'error'
        });
      }
      
      if (!template.schemas || template.schemas.length === 0) {
        errors.push({
          field: 'schemas',
          message: 'At least one schema is required',
          code: 'MISSING_SCHEMAS',
          severity: 'error'
        });
      }
      
      // Validate schemas
      if (template.schemas && template.schemas.length > 0) {
        for (const pageSchemas of template.schemas) {
          for (const [index, schema] of pageSchemas.entries()) {
            if (!schema.type) {
              errors.push({
                field: `schemas[${index}].type`,
                message: 'Schema type is required',
                code: 'MISSING_SCHEMA_TYPE',
                severity: 'error'
              });
            }
            
            if (!schema.position) {
              errors.push({
                field: `schemas[${index}].position`,
                message: 'Schema position is required',
                code: 'MISSING_SCHEMA_POSITION',
                severity: 'error'
              });
            }
            
            // Check for overlapping schemas
            const overlapping = this.checkSchemaOverlap(schema, pageSchemas, index);
            if (overlapping.length > 0) {
              warnings.push({
                field: `schemas[${index}]`,
                message: `Schema overlaps with other schemas: ${overlapping.join(', ')}`,
                code: 'SCHEMA_OVERLAP',
                severity: 'warning',
                suggestions: ['Adjust schema positions to avoid overlap']
              });
            }
          }
        }
      }
      
      // Check i18n configuration
      if (template.i18nConfig) {
        if (!template.i18nConfig.defaultLanguage) {
          warnings.push({
            field: 'i18nConfig.defaultLanguage',
            message: 'Default language should be specified',
            code: 'MISSING_DEFAULT_LANGUAGE',
            severity: 'warning'
          });
        }
        
        if (!template.i18nConfig.fallbackLanguage) {
          warnings.push({
            field: 'i18nConfig.fallbackLanguage',
            message: 'Fallback language should be specified',
            code: 'MISSING_FALLBACK_LANGUAGE',
            severity: 'warning'
          });
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'template',
          message: error instanceof Error ? error.message : 'Validation failed',
          code: 'VALIDATION_ERROR',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate data against template schema
   */
  public async validateData(template: DocuBrandTemplate, data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    try {
      // Check if data is provided
      if (!data || typeof data !== 'object') {
        errors.push({
          field: 'data',
          message: 'Data object is required',
          code: 'MISSING_DATA',
          severity: 'error'
        });
        
        return { valid: false, errors, warnings };
      }
      
      // Validate against data schema
      if (template.dataSchema) {
        const schemaErrors = await this.validateAgainstSchema(data, template.dataSchema);
        errors.push(...schemaErrors);
      }
      
      // Check data bindings
      for (const pageSchemas of template.schemas) {
        for (const schema of pageSchemas) {
          if (schema.dataBinding) {
            const value = this.getValueFromPath(data, schema.dataBinding.path);
            
            if (value === undefined && schema.dataBinding.validation?.required) {
              errors.push({
                field: schema.dataBinding.path,
                message: `Required data field is missing: ${schema.dataBinding.path}`,
                code: 'MISSING_REQUIRED_DATA',
                severity: 'error'
              });
            }
            
            if (value !== undefined && schema.dataBinding.validation?.type) {
              const expectedType = schema.dataBinding.validation.type;
              const actualType = typeof value;
              
              if (actualType !== expectedType) {
                warnings.push({
                  field: schema.dataBinding.path,
                  message: `Data type mismatch: expected ${expectedType}, got ${actualType}`,
                  code: 'DATA_TYPE_MISMATCH',
                  severity: 'warning'
                });
              }
            }
          }
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'data',
          message: error instanceof Error ? error.message : 'Data validation failed',
          code: 'DATA_VALIDATION_ERROR',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Register plugin
   */
  public registerPlugin(plugin: TemplatePlugin): void {
    console.log(`🔌 Registering plugin: ${plugin.name}`);
    
    this.plugins.set(plugin.id, plugin);
    
    // Register schemas
    if (plugin.registerSchemas) {
      const schemas = plugin.registerSchemas();
      for (const [key, schema] of Object.entries(schemas)) {
        this.schemaRegistry.set(key, schema);
      }
    }
    
    // Initialize plugin
    if (plugin.initialize) {
      plugin.initialize().catch(error => {
        console.error(`❌ Plugin initialization failed: ${plugin.name}`, error);
      });
    }
    
    console.log(`✅ Plugin registered: ${plugin.name}`);
  }

  /**
   * Get registered plugins
   */
  public getPlugins(): TemplatePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get template library entries
   */
  public async getTemplateLibrary(): Promise<TemplateLibraryEntry[]> {
    return await this.storage.list();
  }

  /**
   * Search templates
   */
  public async searchTemplates(query: string): Promise<TemplateLibraryEntry[]> {
    return await this.storage.search(query);
  }

  /**
   * Get templates by category
   */
  public async getTemplatesByCategory(category: TemplateCategory): Promise<TemplateLibraryEntry[]> {
    return await this.storage.findByCategory(category);
  }

  /**
   * Private helper methods
   */
  private initializeDefaultPlugins(): void {
    // Register default PDFme schemas
    this.schemaRegistry.set('text', text);
    this.schemaRegistry.set('image', image);
    this.schemaRegistry.set('qrcode', barcodes.qrcode);
    this.schemaRegistry.set('barcode', barcodes.code128);
  }

  private determineCategory(analysis: GeminiAnalysisResponse): TemplateCategory {
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

  private async applyGenerationOptions(
    template: DocuBrandTemplate,
    options: TemplateGenerationOptions
  ): Promise<void> {
    // Apply font configuration
    if (options.fontConfig) {
      const languageConfig = template.i18nConfig.languages[options.language];
      if (languageConfig) {
        Object.assign(languageConfig, options.fontConfig);
      }
    }
    
    // Apply layout options
    if (options.layout.autoOptimize) {
      await this.optimizeLayout(template);
    }
    
    // Apply content processing options
    if (options.content.generateDataBindings) {
      await this.enhanceDataBindings(template);
    }
  }

  private async optimizeLayout(template: DocuBrandTemplate): Promise<void> {
    // Implement layout optimization logic
    console.log('🎯 Optimizing template layout...');
    
    for (const pageSchemas of template.schemas) {
      // Sort schemas by position
      pageSchemas.sort((a, b) => {
        if (a.position.y !== b.position.y) {
          return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
      });
      
      // Adjust positions to avoid overlaps
      let currentY = 20;
      for (const schema of pageSchemas) {
        if (schema.position.y < currentY) {
          schema.position.y = currentY;
        }
        currentY = schema.position.y + (schema.height || 12) + 5;
      }
    }
  }

  private async enhanceDataBindings(template: DocuBrandTemplate): Promise<void> {
    // Implement data binding enhancement
    console.log('🔗 Enhancing data bindings...');
    
    for (const pageSchemas of template.schemas) {
      for (const schema of pageSchemas) {
        if (schema.dataBinding) {
          // Add validation if missing
          if (!schema.dataBinding.validation) {
            schema.dataBinding.validation = {
              required: false,
              type: 'string'
            };
          }
          
          // Add fallback if missing
          if (!schema.dataBinding.fallback) {
            schema.dataBinding.fallback = `[${schema.dataBinding.path}]`;
          }
        }
      }
    }
  }

  private getGenerationOptions(template: DocuBrandTemplate): any {
    return {
      // Add template-specific generation options
      title: template.name,
      author: template.metadata.author,
      creator: 'DocuBrand Template System',
      producer: 'PDFme Generator'
    };
  }

  private getActivePlugins(): any {
    // Return active plugin schemas
    return Object.fromEntries(this.schemaRegistry.entries());
  }

  private prepareInputData(data: any, template: DocuBrandTemplate): any[] {
    // Prepare data for PDFme generation
    // PDFme expects array of objects, one per page
    
    if (Array.isArray(data)) {
      return data;
    }
    
    // Convert single object to array
    return [data];
  }

  private checkSchemaOverlap(
    schema: any,
    allSchemas: any[],
    currentIndex: number
  ): string[] {
    const overlapping: string[] = [];
    
    for (const [index, otherSchema] of allSchemas.entries()) {
      if (index === currentIndex) continue;
      
      const overlap = this.checkRectangleOverlap(
        {
          x: schema.position.x,
          y: schema.position.y,
          width: schema.width || 50,
          height: schema.height || 12
        },
        {
          x: otherSchema.position.x,
          y: otherSchema.position.y,
          width: otherSchema.width || 50,
          height: otherSchema.height || 12
        }
      );
      
      if (overlap) {
        overlapping.push(`schema[${index}]`);
      }
    }
    
    return overlapping;
  }

  private checkRectangleOverlap(rect1: any, rect2: any): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  private getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        // Handle array indices
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const indexStr = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
          const index = parseInt(indexStr, 10);
          
          if (current[arrayKey] && Array.isArray(current[arrayKey])) {
            return current[arrayKey][index];
          }
        }
        
        return current[key];
      }
      return undefined;
    }, obj);
  }

  private async validateAgainstSchema(data: any, schema: any): Promise<ValidationError[]> {
    // Implement JSON schema validation
    const errors: ValidationError[] = [];
    
    // Basic validation implementation
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push({
            field,
            message: `Required field '${field}' is missing`,
            code: 'REQUIRED_FIELD_MISSING',
            severity: 'error'
          });
        }
      }
    }
    
    return errors;
  }
}