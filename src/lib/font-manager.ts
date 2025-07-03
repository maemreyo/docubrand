// CREATED: 2025-07-03 - Complete Vietnamese Unicode font support system

import { PDFDocument, StandardFonts } from 'pdf-lib';

export interface FontConfig {
  name: string;
  displayName: string;
  supportsVietnamese: boolean;
  fontBytes?: Uint8Array;
  embedFunction?: (pdfDoc: PDFDocument) => Promise<any>;
  fallback?: boolean;
}

export interface TextRenderOptions {
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
  x: number;
  y: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Vietnamese Font Manager
 * Handles Unicode font embedding and Vietnamese text rendering
 */
export class VietnameseFontManager {
  private fonts: Map<string, FontConfig> = new Map();
  private embedCache: Map<string, any> = new Map();
  private defaultFont: string = 'inter';

  constructor() {
    this.initializeFonts();
  }

  /**
   * Initialize font configurations
   */
  private initializeFonts(): void {
    // Standard fonts (ASCII only)
    this.fonts.set('helvetica', {
      name: 'helvetica',
      displayName: 'Helvetica',
      supportsVietnamese: false,
      embedFunction: async (pdfDoc) => await pdfDoc.embedFont(StandardFonts.Helvetica),
      fallback: true
    });

    this.fonts.set('times', {
      name: 'times',
      displayName: 'Times New Roman',
      supportsVietnamese: false,
      embedFunction: async (pdfDoc) => await pdfDoc.embedFont(StandardFonts.TimesRoman),
      fallback: true
    });

    // Vietnamese-supported fonts (need to be loaded dynamically)
    this.fonts.set('inter', {
      name: 'inter',
      displayName: 'Inter',
      supportsVietnamese: true,
      embedFunction: async (pdfDoc) => await this.embedGoogleFont(pdfDoc, 'Inter')
    });

    this.fonts.set('roboto', {
      name: 'roboto',
      displayName: 'Roboto',
      supportsVietnamese: true,
      embedFunction: async (pdfDoc) => await this.embedGoogleFont(pdfDoc, 'Roboto')
    });

    this.fonts.set('open-sans', {
      name: 'open-sans',
      displayName: 'Open Sans',
      supportsVietnamese: true,
      embedFunction: async (pdfDoc) => await this.embedGoogleFont(pdfDoc, 'Open Sans')
    });

    this.fonts.set('noto-sans', {
      name: 'noto-sans',
      displayName: 'Noto Sans',
      supportsVietnamese: true,
      embedFunction: async (pdfDoc) => await this.embedGoogleFont(pdfDoc, 'Noto Sans')
    });
  }

  /**
   * Detect if text contains Vietnamese characters
   */
  containsVietnamese(text: string): boolean {
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
    return vietnamesePattern.test(text);
  }

  /**
   * Get appropriate font for text
   */
  getFontForText(text: string, preferredFont?: string): string {
    const hasVietnamese = this.containsVietnamese(text);
    
    // If text has Vietnamese, use Vietnamese-supported font
    if (hasVietnamese) {
      if (preferredFont && this.fonts.has(preferredFont)) {
        const font = this.fonts.get(preferredFont)!;
        if (font.supportsVietnamese) {
          return preferredFont;
        }
      }
      return this.defaultFont; // Default to Inter for Vietnamese
    }

    // If no Vietnamese, can use any font
    return preferredFont || 'helvetica';
  }

  /**
   * Embed Google Font dynamically
   */
  private async embedGoogleFont(pdfDoc: PDFDocument, fontFamily: string): Promise<any> {
    const cacheKey = `${fontFamily}-regular`;
    
    if (this.embedCache.has(cacheKey)) {
      return this.embedCache.get(cacheKey);
    }

    try {
      // Try to load font from Google Fonts
      const fontUrl = await this.getGoogleFontUrl(fontFamily);
      const fontBytes = await this.fetchFontBytes(fontUrl);
      
      if (fontBytes) {
        const embedFont = await pdfDoc.embedFont(fontBytes);
        this.embedCache.set(cacheKey, embedFont);
        return embedFont;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to embed Google Font ${fontFamily}:`, error);
    }

    // Fallback to standard font
    const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    this.embedCache.set(cacheKey, fallbackFont);
    return fallbackFont;
  }

  /**
   * Get Google Font URL
   */
  private async getGoogleFontUrl(fontFamily: string): Promise<string> {
    const familyParam = fontFamily.replace(/\s+/g, '+');
    const apiUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400&display=swap`;
    
    try {
      const response = await fetch(apiUrl);
      const css = await response.text();
      
      // Extract font URL from CSS
      const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
      if (urlMatch) {
        return urlMatch[1];
      }
    } catch (error) {
      console.warn(`⚠️ Failed to get Google Font URL for ${fontFamily}:`, error);
    }

    throw new Error(`Font URL not found for ${fontFamily}`);
  }

  /**
   * Fetch font bytes from URL
   */
  private async fetchFontBytes(url: string): Promise<Uint8Array | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch font bytes:`, error);
      return null;
    }
  }

  /**
   * Render text with appropriate font
   */
  async renderText(
    page: any,
    pdfDoc: PDFDocument,
    options: TextRenderOptions
  ): Promise<void> {
    const { text, fontSize, color, x, y, maxWidth, align = 'left' } = options;
    
    try {
      // Get appropriate font
      const fontName = this.getFontForText(text);
      const font = await this.getOrEmbedFont(pdfDoc, fontName);
      
      // Calculate text positioning
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      let adjustedX = x;
      
      if (align === 'center') {
        adjustedX = x - (textWidth / 2);
      } else if (align === 'right') {
        adjustedX = x - textWidth;
      }
      
      // Handle max width (simple truncation for now)
      let finalText = text;
      if (maxWidth && textWidth > maxWidth) {
        finalText = this.truncateText(text, font, fontSize, maxWidth);
      }
      
      // Render text
      page.drawText(finalText, {
        x: adjustedX,
        y,
        size: fontSize,
        font,
        color: this.rgbToColor(color),
      });
      
    } catch (error) {
      console.warn(`⚠️ Failed to render text "${text}":`, error);
      
      // Fallback: render with standard font and ASCII-only text
      try {
        const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const safeText = this.toASCII(text);
        
        page.drawText(safeText, {
          x,
          y,
          size: fontSize,
          font: fallbackFont,
          color: this.rgbToColor(color),
        });
      } catch (fallbackError) {
        console.error(`❌ Even fallback text rendering failed:`, fallbackError);
      }
    }
  }

  /**
   * Get or embed font
   */
  private async getOrEmbedFont(pdfDoc: PDFDocument, fontName: string): Promise<any> {
    const font = this.fonts.get(fontName);
    if (!font || !font.embedFunction) {
      throw new Error(`Font not found: ${fontName}`);
    }
    
    return await font.embedFunction(pdfDoc);
  }

  /**
   * Convert RGB object to pdf-lib color format
   */
  private rgbToColor(color: { r: number; g: number; b: number }): any {
    const { rgb } = require('pdf-lib');
    return rgb(color.r / 255, color.g / 255, color.b / 255);
  }

  /**
   * Truncate text to fit within max width
   */
  private truncateText(text: string, font: any, fontSize: number, maxWidth: number): string {
    const ellipsis = '...';
    const ellipsisWidth = font.widthOfTextAtSize(ellipsis, fontSize);
    
    for (let i = text.length; i > 0; i--) {
      const truncated = text.substring(0, i);
      const width = font.widthOfTextAtSize(truncated, fontSize);
      
      if (width + ellipsisWidth <= maxWidth) {
        return truncated + ellipsis;
      }
    }
    
    return ellipsis;
  }

  /**
   * Convert Vietnamese text to ASCII (fallback)
   */
  private toASCII(text: string): string {
    return text
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[ÌÍỊỈĨ]/g, 'I')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/[ỲÝỴỶỸ]/g, 'Y')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^\x20-\x7E]/g, ''); // Remove any remaining non-ASCII
  }

  /**
   * Render multiple lines of text
   */
  async renderMultiLineText(
    page: any,
    pdfDoc: PDFDocument,
    text: string,
    options: TextRenderOptions & { lineHeight?: number }
  ): Promise<void> {
    const { lineHeight = 1.2, ...baseOptions } = options;
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      await this.renderText(page, pdfDoc, {
        ...baseOptions,
        text: lines[i],
        y: baseOptions.y - (i * baseOptions.fontSize * lineHeight)
      });
    }
  }

  /**
   * Get available fonts
   */
  getAvailableFonts(): FontConfig[] {
    return Array.from(this.fonts.values());
  }

  /**
   * Get Vietnamese-supported fonts
   */
  getVietnameseFonts(): FontConfig[] {
    return Array.from(this.fonts.values()).filter(font => font.supportsVietnamese);
  }
}

// Singleton instance
let fontManagerInstance: VietnameseFontManager | null = null;

export function getFontManager(): VietnameseFontManager {
  if (!fontManagerInstance) {
    fontManagerInstance = new VietnameseFontManager();
  }
  return fontManagerInstance;
}