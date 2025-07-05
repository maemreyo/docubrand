import {
  Template,
  Font,
  getDefaultFont,
  checkTemplate,
  BLANK_PDF,
  Schema,
  getInputFromTemplate,
} from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { Designer, Form, Viewer } from "@pdfme/ui";
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
  radioGroup,
} from "@pdfme/schemas";
import { getEducationalPlugins } from "./educational-plugins";
import {
  createBlankEducationalTemplate,
  validateTemplateBasePdf,
  fixTemplateBasePdf,
} from "./template-utils";

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
 * Fixed pdfme integration class with proper basePdf handling
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
      "Roboto-Regular": {
        fallback: false,
        data: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
      },
      "OpenSans-Regular": {
        fallback: false,
        data: "https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVQUwaEQXjN_mQ.woff2",
      },
      "Lato-Regular": {
        fallback: false,
        data: "https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wXg.woff2",
      },
      "Poppins-Regular": {
        fallback: false,
        data: "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2",
      },
    };
  }

  /**
   * Create a blank template - FIXED with proper basePdf
   */
  createBlankTemplate(): Template {
    return createBlankEducationalTemplate();
  }

  /**
   * Create a template with educational layout - FIXED
   */
  createEducationalTemplate(
    config: {
      title?: string;
      pageSize?: "A4" | "LETTER";
      orientation?: "portrait" | "landscape";
      margin?: [number, number, number, number];
    } = {}
  ): Template {
    const {
      title = "Educational Template",
      pageSize = "A4",
      orientation = "portrait",
      margin = [20, 10, 20, 10],
    } = config;

    // Calculate dimensions based on page size and orientation
    let width = 210; // A4 width in mm
    let height = 297; // A4 height in mm

    if (pageSize === "LETTER") {
      width = 216; // Letter width in mm
      height = 279; // Letter height in mm
    }

    if (orientation === "landscape") {
      [width, height] = [height, width];
    }

    return {
      basePdf: {
        width,
        height,
        padding: margin,
      },
      schemas: [
        [
          // Title schema
          {
            name: "title",
            type: "text",
            content: title,
            position: { x: margin[3], y: margin[0] },
            width: width - margin[1] - margin[3],
            height: 15,
            fontSize: 16,
            fontColor: "#1f2937",
            fontName: "NotoSerifJP-Regular",
          },
        ],
      ],
    };
  }

  /**
   * Validate template - ENHANCED with basePdf validation
   */
  validateTemplate(template: Template): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check basic template structure
      if (!template) {
        errors.push("Template is null or undefined");
        return { valid: false, errors, warnings };
      }

      // CRITICAL: Validate basePdf
      if (!validateTemplateBasePdf(template)) {
        errors.push(
          "template.basePdf must be valid PDF data (BLANK_PDF, custom page config, or PDF data)"
        );
      }

      // Check schemas
      if (!template.schemas) {
        errors.push("Template must have schemas property");
      } else if (!Array.isArray(template.schemas)) {
        errors.push("Template schemas must be an array");
      } else if (template.schemas.length === 0) {
        warnings.push("Template has no pages");
      }

      // Use PDFme's built-in validation if basePdf is valid
      if (errors.length === 0) {
        try {
          checkTemplate(template);
        } catch (pdfmeError) {
          if (pdfmeError instanceof Error) {
            errors.push(`PDFme validation failed: ${pdfmeError.message}`);
          } else {
            errors.push("PDFme validation failed");
          }
        }
      }
    } catch (error) {
      errors.push(
        `Template validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Safe template processing - auto-fix basePdf issues
   */
  processTemplate(template: Template): Template {
    if (!validateTemplateBasePdf(template)) {
      console.warn("Invalid basePdf detected, auto-fixing...");
      return fixTemplateBasePdf(template);
    }
    return template;
  }

  /**
   * Create Designer instance - ENHANCED with template validation
   */
  createDesigner(
    domContainer: HTMLElement,
    template: Template,
    options: any = {}
  ): Designer {
    // Ensure template has valid basePdf
    const safeTemplate = this.processTemplate(template);

    // Validate template before creating designer
    const validation = this.validateTemplate(safeTemplate);
    if (!validation.valid) {
      throw new Error(
        `Template validation failed: ${validation.errors.join(", ")}`
      );
    }

    const designerOptions = {
      font: this.fonts,
      lang: this.defaultOptions.lang || "en",
      theme: this.defaultOptions.theme || {
        token: { colorPrimary: "#1890ff" },
      },
      ...options,
    };

    return new Designer({
      domContainer,
      template: safeTemplate,
      options: designerOptions,
      plugins: this.plugins,
    });
  }

  /**
   * Create Form instance - ENHANCED with template validation
   */
  createForm(
    domContainer: HTMLElement,
    template: Template,
    inputs: Record<string, any>[] = [],
    options: any = {}
  ): Form {
    // Ensure template has valid basePdf
    const safeTemplate = this.processTemplate(template);

    const formOptions = {
      font: this.fonts,
      lang: this.defaultOptions.lang || "en",
      ...options,
    };

    return new Form({
      domContainer,
      template: safeTemplate,
      inputs,
      options: formOptions,
      plugins: this.plugins,
    });
  }

  /**
   * Create Viewer instance - ENHANCED with template validation
   */
  createViewer(
    domContainer: HTMLElement,
    template: Template,
    inputs: Record<string, any>[] = [],
    options: any = {}
  ): Viewer {
    // Ensure template has valid basePdf
    const safeTemplate = this.processTemplate(template);

    const viewerOptions = {
      font: this.fonts,
      lang: this.defaultOptions.lang || "en",
      ...options,
    };

    return new Viewer({
      domContainer,
      template: safeTemplate,
      inputs,
      options: viewerOptions,
      plugins: this.plugins,
    });
  }

  /**
   * Generate PDF - ENHANCED with template validation
   */
  async generatePDF(
    template: Template,
    inputs: Record<string, any>[],
    options: any = {}
  ): Promise<Uint8Array> {
    // Ensure template has valid basePdf
    const safeTemplate = this.processTemplate(template);

    const generationOptions = {
      font: this.fonts,
      lang: this.defaultOptions.lang || "en",
      ...options,
    };

    const pdf = await generate({
      template: safeTemplate,
      inputs,
      options: generationOptions,
      plugins: this.plugins,
    });

    return pdf.buffer;
  }

  /**
   * Generate sample inputs from template - FIXED
   */
  generateSampleInputs(template: Template): Record<string, any>[] {
    try {
      // Ensure template has valid basePdf
      const safeTemplate = this.processTemplate(template);
      return getInputFromTemplate(safeTemplate);
    } catch (error) {
      console.warn("Failed to generate sample inputs:", error);
      return [{}];
    }
  }

  /**
   * Download PDF utility
   */
  async downloadPDF(
    template: Template,
    inputs: Record<string, any>[],
    filename: string = "document.pdf",
    options: any = {}
  ): Promise<void> {
    try {
      const pdfBuffer = await this.generatePDF(template, inputs, options);
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(
        `PDF download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
   * Create template from JSON - ENHANCED with validation
   */
  createTemplateFromJSON(jsonData: any): Template {
    try {
      const template =
        typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

      // Auto-fix basePdf issues
      const safeTemplate = this.processTemplate(template);

      const validation = this.validateTemplate(safeTemplate);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
      }

      return safeTemplate;
    } catch (error) {
      throw new Error(
        `Failed to create template from JSON: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
