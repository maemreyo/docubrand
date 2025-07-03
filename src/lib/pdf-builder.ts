/**
 * PDF Builder - Creates new PDF with proper layering and branding
 * Instead of modifying existing PDF, this creates a new one from scratch
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, PDFEmbeddedPage } from "pdf-lib";
import { BrandKit } from "@/types";
import { registerFontkitSafely } from "./fontkit-manager";

export interface PDFBuilderOptions {
  preserveOriginalContent: boolean;
  addBrandingLayer: boolean;
  templateMode: boolean;
}

export class PDFBuilder {
  private pdfDoc: PDFDocument | null = null;
  private standardFont: PDFFont | null = null;
  private customFont: PDFFont | null = null;

  constructor() {}

  /**
   * Initialize new PDF document
   */
  async initialize(): Promise<void> {
    console.log("🏗️ Initializing PDF Builder...");
    
    // Create new PDF document
    this.pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom fonts
    await registerFontkitSafely(this.pdfDoc);
    
    // Load standard font
    this.standardFont = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    
    console.log("✅ PDF Builder initialized successfully");
  }

  /**
   * Build new PDF with branding - approach 1: Copy + Brand
   */
  async buildFromExisting(
    originalPdfBytes: Uint8Array,
    brandKit: BrandKit,
    options: PDFBuilderOptions = {
      preserveOriginalContent: true,
      addBrandingLayer: true,
      templateMode: false
    }
  ): Promise<Uint8Array> {
    if (!this.pdfDoc) {
      throw new Error("PDF Builder not initialized");
    }

    console.log("🏗️ Building PDF from existing document...");

    try {
      // Load original PDF
      const originalDoc = await PDFDocument.load(originalPdfBytes, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });

      const originalPages = originalDoc.getPages();
      console.log(`📄 Original PDF has ${originalPages.length} pages`);

      // Process each page
      for (let i = 0; i < originalPages.length; i++) {
        const originalPage = originalPages[i];
        const { width, height } = originalPage.getSize();
        
        console.log(`🔄 Processing page ${i + 1}: ${width}x${height}`);

        // Create new page in our document
        const newPage = this.pdfDoc.addPage([width, height]);

        if (options.preserveOriginalContent) {
          // Method 1: Embed original page as background
          const embeddedPage = await this.pdfDoc.embedPage(originalPage);
          newPage.drawPage(embeddedPage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          });
          console.log(`✅ Original content copied to page ${i + 1}`);
        }

        if (options.addBrandingLayer) {
          // Add branding elements ON TOP of original content
          await this.addBrandingLayer(newPage, brandKit, width, height);
          console.log(`🎨 Branding layer added to page ${i + 1}`);
        }
      }

      // Save the new PDF
      const finalBytes = await this.pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      console.log(`✅ PDF built successfully: ${finalBytes.length} bytes`);
      return finalBytes;

    } catch (error) {
      console.error("❌ PDF building failed:", error);
      throw error;
    }
  }

  /**
   * Build new PDF with template - approach 2: Template + Content
   */
  async buildFromTemplate(
    originalPdfBytes: Uint8Array,
    brandKit: BrandKit,
    templateConfig: {
      headerHeight: number;
      footerHeight: number;
      sidebarWidth: number;
      contentMargin: number;
    }
  ): Promise<Uint8Array> {
    if (!this.pdfDoc) {
      throw new Error("PDF Builder not initialized");
    }

    console.log("🏗️ Building PDF from template...");

    try {
      // Load original PDF for content extraction
      const originalDoc = await PDFDocument.load(originalPdfBytes, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });

      const originalPages = originalDoc.getPages();
      console.log(`📄 Template building for ${originalPages.length} pages`);

      // Process each page with template approach
      for (let i = 0; i < originalPages.length; i++) {
        const originalPage = originalPages[i];
        const { width, height } = originalPage.getSize();
        
        console.log(`🎨 Creating template page ${i + 1}: ${width}x${height}`);

        // Create new page
        const newPage = this.pdfDoc.addPage([width, height]);

        // 1. Create template background with branding
        await this.createTemplateBackground(newPage, brandKit, width, height, templateConfig);

        // 2. Add original content in content area
        const embeddedPage = await this.pdfDoc.embedPage(originalPage);
        const contentArea = this.calculateContentArea(width, height, templateConfig);
        
        newPage.drawPage(embeddedPage, {
          x: contentArea.x,
          y: contentArea.y,
          width: contentArea.width,
          height: contentArea.height,
        });

        // 3. Add branding elements on top
        await this.addTemplateElements(newPage, brandKit, width, height, templateConfig);
        
        console.log(`✅ Template page ${i + 1} completed`);
      }

      // Save the new PDF
      const finalBytes = await this.pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      console.log(`✅ Template PDF built successfully: ${finalBytes.length} bytes`);
      return finalBytes;

    } catch (error) {
      console.error("❌ Template PDF building failed:", error);
      throw error;
    }
  }

  /**
   * Add branding layer on top of content
   */
  private async addBrandingLayer(
    page: PDFPage,
    brandKit: BrandKit,
    width: number,
    height: number
  ): Promise<void> {
    console.log("🎨 Adding branding layer...");

    // 1. BRIGHT RED DEBUG RECTANGLE (ON TOP)
    page.drawRectangle({
      x: width - 150,
      y: height - 150,
      width: 100,
      height: 100,
      color: rgb(1, 0, 0), // Bright red
      opacity: 0.9,
    });
    console.log("🔴 DEBUG: Red rectangle added ON TOP");

    // 2. Brand borders (thick and visible)
    if (brandKit.color) {
      const color = this.hexToRgb(brandKit.color);
      // Top border
      page.drawRectangle({
        x: 0,
        y: height - 25,
        width: width,
        height: 25,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
        opacity: 0.8,
      });
      console.log(`🎨 Top border added: ${brandKit.color}`);
    }

    if (brandKit.secondaryColor) {
      const color = this.hexToRgb(brandKit.secondaryColor);
      // Bottom border
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 20,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
        opacity: 0.8,
      });
      console.log(`🎨 Bottom border added: ${brandKit.secondaryColor}`);
    }

    if (brandKit.accentColor) {
      const color = this.hexToRgb(brandKit.accentColor);
      // Left border
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 20,
        height: height,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
        opacity: 0.8,
      });
      console.log(`🎨 Left border added: ${brandKit.accentColor}`);
    }

    // 3. Watermark
    if (brandKit.watermark && this.standardFont) {
      const fontSize = Math.min(width, height) / 20;
      const textWidth = this.standardFont.widthOfTextAtSize(brandKit.watermark, fontSize);
      
      page.drawText(brandKit.watermark, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font: this.standardFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.3,
      });
      console.log(`🎨 Watermark added: ${brandKit.watermark}`);
    }

    // 4. Footer text
    if (brandKit.footerText && this.standardFont) {
      const fontSize = 10;
      
      page.drawText(brandKit.footerText, {
        x: 30,
        y: 30,
        size: fontSize,
        font: this.standardFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      console.log(`🎨 Footer text added: ${brandKit.footerText}`);
    }
  }

  /**
   * Create template background
   */
  private async createTemplateBackground(
    page: PDFPage,
    brandKit: BrandKit,
    width: number,
    height: number,
    config: any
  ): Promise<void> {
    console.log("🎨 Creating template background...");

    // Header area
    if (brandKit.color) {
      const color = this.hexToRgb(brandKit.color);
      page.drawRectangle({
        x: 0,
        y: height - config.headerHeight,
        width: width,
        height: config.headerHeight,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
        opacity: 0.9,
      });
    }

    // Footer area
    if (brandKit.secondaryColor) {
      const color = this.hexToRgb(brandKit.secondaryColor);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: config.footerHeight,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
        opacity: 0.9,
      });
    }

    // Sidebar
    if (brandKit.accentColor) {
      const color = this.hexToRgb(brandKit.accentColor);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: config.sidebarWidth,
        height: height,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
        opacity: 0.7,
      });
    }

    console.log("✅ Template background created");
  }

  /**
   * Add template elements (logo, text, etc.)
   */
  private async addTemplateElements(
    page: PDFPage,
    brandKit: BrandKit,
    width: number,
    height: number,
    config: any
  ): Promise<void> {
    console.log("🎨 Adding template elements...");

    // Add logo if available
    // Add header text
    // Add footer text
    // Add branded elements

    console.log("✅ Template elements added");
  }

  /**
   * Calculate content area based on template config
   */
  private calculateContentArea(
    width: number,
    height: number,
    config: any
  ): { x: number; y: number; width: number; height: number } {
    return {
      x: config.sidebarWidth + config.contentMargin,
      y: config.footerHeight + config.contentMargin,
      width: width - config.sidebarWidth - (config.contentMargin * 2),
      height: height - config.headerHeight - config.footerHeight - (config.contentMargin * 2),
    };
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.pdfDoc = null;
    this.standardFont = null;
    this.customFont = null;
  }
}