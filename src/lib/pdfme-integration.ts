// CREATED: 2025-07-04 - Core pdfme integration utilities - FIXED VERSION

import { 
  Template, 
  Font, 
  getDefaultFont, 
  checkTemplate, 
  BLANK_PDF, 
  Schema,
  getInputFromTemplate
} from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { Designer, Form, Viewer } from '@pdfme/ui';
import { 
  text, 
  image, 
  table, 
  multiVariableText,
  barcodes,
  line,
  rectangle,
  ellipse,
  dateTime,
  checkbox,
  radioGroup
} from '@pdfme/schemas';
import { getEducationalPlugins } from './educational-plugins';

// Types
export interface PdfmeIntegrationOptions {
  fonts?: Font;
  plugins?: Record<string, any>;
  lang?: string;
  theme?: any;
}

export interface GenerationOptions {
  template: Template;
  inputs: Record<string, any>[];
  options?: {
    font?: Font;
    lang?: string;
    title?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Core pdfme integration class - Fixed for v5.4.0
 */
export class PdfmeIntegration {
  private plugins: Record<string, any>;
  private fonts: Font;
  private defaultOptions: PdfmeIntegrationOptions;

  constructor(options: PdfmeIntegrationOptions = {}) {
    this.plugins = this.getDefaultPlugins();
    this.fonts = this.getDefaultFonts();
    this.defaultOptions = options;

    // Override with custom options
    if (options.plugins) {
      this.plugins = { ...this.plugins, ...options.plugins };
    }
    if (options.fonts) {
      this.fonts = { ...this.fonts, ...options.fonts };
    }
  }

  /**
   * Get default plugins from @pdfme/schemas
   */
  private getDefaultPlugins(): Record<string, any> {
    // Get educational plugins
    const educationalPlugins = getEducationalPlugins();
    
    return {
      // Basic plugins from @pdfme/schemas
      text: text,
      image: image,
      table: table,
      multiVariableText: multiVariableText,
      
      // Form elements
      checkbox: checkbox,
      radioGroup: radioGroup,
      
      // Graphics
      line: line,
      rectangle: rectangle,
      ellipse: ellipse,
      
      // Date/Time
      dateTime: dateTime,
      
      // Barcodes
      qrcode: barcodes.qrcode,
      ean13: barcodes.ean13,
      code128: barcodes.code128,
      
      // Educational plugins
      ...educationalPlugins,
    };
  }

  /**
   * Get default fonts including educational fonts
   */
  private getDefaultFonts(): Font {
    return {
      ...getDefaultFont(),
      // Educational fonts
      'Roboto-Regular': {
        fallback: false,
        data: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
      },
      'OpenSans-Regular': {
        fallback: false,
        data: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVQUwaEQXjN_mQ.woff2',
      },
      'Lato-Regular': {
        fallback: false,
        data: 'https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wXg.woff2',
      },
      'Poppins-Regular': {
        fallback: false,
        data: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
      },
    };
  }

  /**
   * Create a blank template - Fixed for v5
   */
  createBlankTemplate(): Template {
    return {
      basePdf: BLANK_PDF, // Use BLANK_PDF constant
      schemas: [[]], // Array of arrays for pages
    };
  }

  /**
   * Create a template with educational layout - Fixed for v5
   */
  createEducationalTemplate(config: {
    title?: string;
    pageSize?: 'A4' | 'LETTER';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
  }): Template {
    const { pageSize = 'A4', orientation = 'portrait', margin = 20 } = config;
    
    // A4 dimensions in mm
    const dimensions = {
      A4: { width: 210, height: 297 },
      LETTER: { width: 215.9, height: 279.4 }
    };

    const { width, height } = dimensions[pageSize];
    const finalWidth = orientation === 'landscape' ? height : width;
    const finalHeight = orientation === 'landscape' ? width : height;

    return {
      basePdf: {
        width: finalWidth,
        height: finalHeight,
        padding: [margin, margin, margin, margin],
      },
      schemas: [
        [
          // Header section - Fixed schema structure
          {
            name: 'title',
            type: 'text',
            content: config.title || 'Educational Document',
            position: { x: margin, y: margin },
            width: finalWidth - (margin * 2),
            height: 15,
            fontSize: 18,
            fontColor: '#000000',
            fontName: 'Roboto-Regular',
            alignment: 'center',
            characterSpacing: 0,
            lineHeight: 1.2,
          } as Schema,
          // Content area placeholder - Fixed schema structure
          {
            name: 'content',
            type: 'text',
            content: 'Content will be inserted here',
            position: { x: margin, y: margin + 30 },
            width: finalWidth - (margin * 2),
            height: 20,
            fontSize: 12,
            fontColor: '#333333',
            fontName: 'Roboto-Regular',
            alignment: 'left',
            characterSpacing: 0,
            lineHeight: 1.4,
          } as Schema,
        ],
      ],
    };
  }

  /**
   * Validate template structure - Fixed for v5
   */
  validateTemplate(template: Template): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Use pdfme's built-in validation
      checkTemplate(template);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Template validation failed');
    }

    // Additional validation for v5 structure
    if (!template.schemas || !Array.isArray(template.schemas)) {
      errors.push('Template must have schemas array');
    }

    if (template.schemas.length === 0) {
      errors.push('Template must have at least one page');
    }

    // Check for duplicate field names across all pages
    const fieldNames = new Set<string>();
    template.schemas.forEach((page, pageIndex) => {
      if (!Array.isArray(page)) {
        errors.push(`Page ${pageIndex + 1} schemas must be an array`);
        return;
      }
      
      page.forEach((schema, schemaIndex) => {
        // Check required schema properties
        if (!schema.name) {
          errors.push(`Schema at page ${pageIndex + 1}, position ${schemaIndex + 1} must have a name`);
        }
        if (!schema.type) {
          errors.push(`Schema at page ${pageIndex + 1}, position ${schemaIndex + 1} must have a type`);
        }
        if (!schema.position) {
          errors.push(`Schema at page ${pageIndex + 1}, position ${schemaIndex + 1} must have a position`);
        }
        if (schema.width === undefined) {
          errors.push(`Schema at page ${pageIndex + 1}, position ${schemaIndex + 1} must have a width`);
        }
        if (schema.height === undefined) {
          errors.push(`Schema at page ${pageIndex + 1}, position ${schemaIndex + 1} must have a height`);
        }
        
        // Check for duplicate names
        if (schema.name) {
          if (fieldNames.has(schema.name)) {
            errors.push(`Duplicate field name "${schema.name}" found`);
          } else {
            fieldNames.add(schema.name);
          }
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
   * Generate PDF from template and data - Fixed for v5
   */
  async generatePDF(options: GenerationOptions): Promise<Uint8Array> {
    const { template, inputs } = options;

    // Validate template
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const pdf = await generate({
        template,
        inputs,
        options: {
          font: this.fonts,
          lang: this.defaultOptions.lang || 'en',
          title: options.options?.title || 'Educational Document',
        },
        plugins: this.plugins,
      });

      return pdf;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create Designer instance - Fixed for v5
   */
  createDesigner(
    domContainer: HTMLElement,
    template: Template,
    options: any = {}
  ): Designer {
    const designerOptions = {
      font: this.fonts,
      lang: this.defaultOptions.lang || 'en',
      theme: this.defaultOptions.theme || {
        token: { colorPrimary: '#1890ff' },
      },
      ...options,
    };

    return new Designer({
      domContainer,
      template,
      options: designerOptions,
      plugins: this.plugins,
    });
  }

  /**
   * Create Form instance - Fixed for v5
   */
  createForm(
    domContainer: HTMLElement,
    template: Template,
    inputs: Record<string, any>[] = [],
    options: any = {}
  ): Form {
    const formOptions = {
      font: this.fonts,
      lang: this.defaultOptions.lang || 'en',
      ...options,
    };

    return new Form({
      domContainer,
      template,
      inputs,
      options: formOptions,
      plugins: this.plugins,
    });
  }

  /**
   * Create Viewer instance - Fixed for v5
   */
  createViewer(
    domContainer: HTMLElement,
    template: Template,
    inputs: Record<string, any>[] = [],
    options: any = {}
  ): Viewer {
    const viewerOptions = {
      font: this.fonts,
      lang: this.defaultOptions.lang || 'en',
      ...options,
    };

    return new Viewer({
      domContainer,
      template,
      inputs,
      options: viewerOptions,
      plugins: this.plugins,
    });
  }

  /**
   * Generate sample inputs from template - Fixed for v5
   */
  generateSampleInputs(template: Template): Record<string, any>[] {
    try {
      return getInputFromTemplate(template);
    } catch (error) {
      console.warn('Failed to generate sample inputs:', error);
      return [{}];
    }
  }

  /**
   * Add custom plugin
   */
  addPlugin(name: string, plugin: any): void {
    this.plugins[name] = plugin;
  }

  /**
   * Remove plugin
   */
  removePlugin(name: string): void {
    delete this.plugins[name];
  }

  /**
   * Get available plugins
   */
  getPlugins(): Record<string, any> {
    return { ...this.plugins };
  }

  /**
   * Add custom font
   */
  addFont(name: string, fontData: Font[string]): void {
    this.fonts[name] = fontData;
  }

  /**
   * Get available fonts
   */
  getFonts(): Font {
    return { ...this.fonts };
  }

  /**
   * Create template from JSON
   */
  createTemplateFromJSON(jsonData: any): Template {
    try {
      const template = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const validation = this.validateTemplate(template);
      
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }
      
      return template;
    } catch (error) {
      throw new Error(`Failed to create template from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert template to JSON
   */
  templateToJSON(template: Template): string {
    try {
      return JSON.stringify(template, null, 2);
    } catch (error) {
      throw new Error(`Failed to convert template to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download template as JSON file
   */
  downloadTemplate(template: Template, filename: string = 'template.json'): void {
    try {
      const jsonData = this.templateToJSON(template);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download generated PDF
   */
  async downloadPDF(
    template: Template,
    inputs: Record<string, any>[],
    filename: string = 'document.pdf'
  ): Promise<void> {
    try {
      const pdf = await this.generatePDF({ template, inputs });
      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to read files (from demo-pdfme)
   */
  readFile(file: File | null, type: 'text' | 'dataURL' | 'arrayBuffer'): Promise<string | ArrayBuffer> {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', (e) => {
        if (e && e.target && e.target.result && file !== null) {
          resolve(e.target.result);
        }
      });
      if (file !== null) {
        if (type === 'text') {
          fileReader.readAsText(file);
        } else if (type === 'dataURL') {
          fileReader.readAsDataURL(file);
        } else if (type === 'arrayBuffer') {
          fileReader.readAsArrayBuffer(file);
        }
      }
    });
  }

  /**
   * Helper method to download JSON file (from demo-pdfme)
   */
  downloadJsonFile(json: unknown, title: string): void {
    if (typeof window !== 'undefined') {
      const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }
}

// Export singleton instance
export const pdfmeIntegration = new PdfmeIntegration();

// Export types and utilities
export * from '@pdfme/common';
export { generate } from '@pdfme/generator';
export { Designer, Form, Viewer } from '@pdfme/ui';
export { text, image, table, multiVariableText, barcodes, line, rectangle, ellipse, dateTime, checkbox, radioGroup } from '@pdfme/schemas';