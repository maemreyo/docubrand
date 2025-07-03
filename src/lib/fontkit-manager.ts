/**
 * Fontkit Manager for proper font registration with pdf-lib
 * Handles import issues and browser compatibility
 */

let fontkitCache: any = null;
let registrationAttempted = false;

/**
 * Load fontkit dynamically to avoid SSR issues
 */
async function loadFontkit(): Promise<any> {
  if (fontkitCache) {
    return fontkitCache;
  }

  try {
    // Try dynamic import first
    if (typeof window !== 'undefined') {
      // Browser environment - use @pdf-lib/fontkit
      const fontkit = await import('@pdf-lib/fontkit');
      fontkitCache = fontkit.default || fontkit;
      console.log('✅ @pdf-lib/fontkit loaded successfully in browser');
      return fontkitCache;
    } else {
      // Server environment (should not happen in our case)
      console.warn('⚠️ Fontkit loading attempted on server side');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to load @pdf-lib/fontkit:', error);
    return null;
  }
}

/**
 * Register fontkit with PDFDocument
 */
export async function registerFontkitSafely(pdfDoc: any): Promise<boolean> {
  try {
    // Reset registration state for each new document
    const fontkit = await loadFontkit();
    
    if (fontkit && pdfDoc && typeof pdfDoc.registerFontkit === 'function') {
      pdfDoc.registerFontkit(fontkit);
      console.log('✅ @pdf-lib/fontkit registered successfully with PDFDocument');
      registrationAttempted = true;
      return true;
    } else {
      console.warn('⚠️ Fontkit or registerFontkit method not available:', {
        fontkit: !!fontkit,
        fontkitType: typeof fontkit,
        pdfDoc: !!pdfDoc,
        registerFontkit: typeof pdfDoc?.registerFontkit,
        fontkitProperties: fontkit ? Object.keys(fontkit).slice(0, 5) : 'none'
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Fontkit registration failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.slice(0, 200)
    });
    return false;
  }
}

/**
 * Check if fontkit is available
 */
export function isFontkitAvailable(): boolean {
  return fontkitCache !== null;
}

/**
 * Reset fontkit cache (for testing)
 */
export function resetFontkitCache(): void {
  fontkitCache = null;
  registrationAttempted = false;
}

// Font data as base64 (embedded Noto Sans subset for Vietnamese)
const NOTO_SANS_VIETNAMESE_BASE64 = `
data:font/truetype;base64,AAEAAAAOAIAAAwBgT1MvMj7LSSgAAADsAAAAYGNtYXAAbQLgAAABTAAAAKhjdnQgAAAAAAAAAfQAAAAKZnBnbUzGGCMAAAIAAAABvGdseWaH3l1sAAAEvAAAADBhZWFkEA8FAAAAAAQAA...
`;

/**
 * Simple Vietnamese Font Manager without external dependencies
 */
export class SimpleFontManager {
  private fontRegistered = false;

  /**
   * Initialize font support
   */
  async initialize(pdfDoc: any): Promise<boolean> {
    const registered = await registerFontkitSafely(pdfDoc);
    this.fontRegistered = registered;
    return registered;
  }

  /**
   * Check if text contains Vietnamese
   */
  containsVietnamese(text: string): boolean {
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
    return vietnamesePattern.test(text);
  }

  /**
   * Convert Vietnamese to ASCII fallback
   */
  toASCII(text: string): string {
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
      .replace(/[^\x20-\x7E]/g, '');
  }

  /**
   * Render text with automatic font selection
   */
  async renderText(
    page: any,
    pdfDoc: any,
    text: string,
    options: {
      x: number;
      y: number;
      size: number;
      color?: { r: number; g: number; b: number };
      align?: 'left' | 'center' | 'right';
    }
  ): Promise<boolean> {
    const { x, y, size, color = { r: 0, g: 0, b: 0 }, align = 'left' } = options;

    try {
      // Initialize fontkit if not done
      if (!this.fontRegistered) {
        await this.initialize(pdfDoc);
      }

      const hasVietnamese = this.containsVietnamese(text);
      
      if (hasVietnamese && this.fontRegistered) {
        // Try to render with Vietnamese font
        return await this.renderWithVietnameseFont(page, pdfDoc, text, options);
      } else {
        // Use standard font
        return await this.renderWithStandardFont(page, pdfDoc, text, options);
      }

    } catch (error) {
      console.warn('⚠️ Text rendering failed, using fallback:', error);
      return await this.renderFallback(page, pdfDoc, text, options);
    }
  }

  /**
   * Render with Vietnamese font
   */
  private async renderWithVietnameseFont(
    page: any,
    pdfDoc: any,
    text: string,
    options: any
  ): Promise<boolean> {
    try {
      // Try to embed a Vietnamese-supported font
      // For now, use embedded font bytes or fallback to ASCII
      
      // Option 1: Try embedded font (if available)
      // const fontBytes = this.getVietnameseFontBytes();
      // const vietnameseFont = await pdfDoc.embedFont(fontBytes);
      
      // Option 2: Fallback to ASCII for now
      console.log('🇻🇳 Vietnamese text detected, converting to ASCII for compatibility');
      const asciiText = this.toASCII(text);
      return await this.renderWithStandardFont(page, pdfDoc, asciiText, options);

    } catch (error) {
      console.warn('⚠️ Vietnamese font rendering failed:', error);
      return false;
    }
  }

  /**
   * Render with standard font
   */
  private async renderWithStandardFont(
    page: any,
    pdfDoc: any,
    text: string,
    options: any
  ): Promise<boolean> {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const { x, y, size, color, align } = options;
      
      // Calculate positioning
      let adjustedX = x;
      if (align === 'center') {
        const textWidth = font.widthOfTextAtSize(text, size);
        adjustedX = x - (textWidth / 2);
      } else if (align === 'right') {
        const textWidth = font.widthOfTextAtSize(text, size);
        adjustedX = x - textWidth;
      }

      page.drawText(text, {
        x: adjustedX,
        y,
        size,
        font,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
      });

      return true;

    } catch (error) {
      console.error('❌ Standard font rendering failed:', error);
      return false;
    }
  }

  /**
   * Ultimate fallback rendering
   */
  private async renderFallback(
    page: any,
    pdfDoc: any,
    text: string,
    options: any
  ): Promise<boolean> {
    try {
      const { StandardFonts, rgb } = await import('pdf-lib');
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const safeText = this.toASCII(text);
      const { x, y, size, color } = options;

      page.drawText(safeText, {
        x,
        y,
        size,
        font,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
      });

      console.log(`⚠️ Fallback render: "${safeText}"`);
      return true;

    } catch (error) {
      console.error('❌ Even fallback rendering failed:', error);
      return false;
    }
  }

  /**
   * Get font status for debugging
   */
  getStatus(): {
    fontkitRegistered: boolean;
    fontkitAvailable: boolean;
  } {
    return {
      fontkitRegistered: this.fontRegistered,
      fontkitAvailable: isFontkitAvailable()
    };
  }
}

// Export singleton instance
let fontManagerInstance: SimpleFontManager | null = null;

export function getSimpleFontManager(): SimpleFontManager {
  if (!fontManagerInstance) {
    fontManagerInstance = new SimpleFontManager();
  }
  return fontManagerInstance;
}