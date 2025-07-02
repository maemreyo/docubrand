import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { BrandKit, QuizElement, PDFProcessingResult } from '@/types';

export class PDFProcessor {
  private pdfDoc: PDFDocument | null = null;
  private originalBytes: Uint8Array | null = null;
  private elements: QuizElement[] = [];

  /**
   * Load PDF file and extract basic information
   */
  async loadPDF(file: File): Promise<void> {
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      this.originalBytes = new Uint8Array(arrayBuffer);
      
      // Load PDF with pdf-lib
      this.pdfDoc = await PDFDocument.load(this.originalBytes);
      
      console.log(`PDF loaded: ${this.pdfDoc.getPageCount()} pages`);
      
      // Extract text content from all pages
      await this.extractContent();
      
    } catch (error) {
      console.error('Failed to load PDF:', error);
      throw new Error('Could not load PDF file. Please ensure it\'s a valid PDF.');
    }
  }

  /**
   * Extract text content and detect document structure
   */
  private async extractContent(): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');

    this.elements = [];
    const pages = this.pdfDoc.getPages();

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      
      try {
        // Get page dimensions
        const { width, height } = page.getSize();
        console.log(`Page ${pageIndex + 1}: ${width}x${height}`);

        // For MVP, we'll detect basic patterns from the document structure
        // This is a simplified approach - in production would need more sophisticated text extraction
        await this.detectBasicStructure(page, pageIndex);
        
      } catch (error) {
        console.warn(`Could not process page ${pageIndex + 1}:`, error);
      }
    }

    console.log(`Extracted ${this.elements.length} elements`);
  }

  /**
   * Detect basic document structure patterns
   * MVP: Focus on titles and question patterns
   */
  private async detectBasicStructure(page: PDFPage, pageIndex: number): Promise<void> {
    const { width, height } = page.getSize();

    // For MVP, we'll create mock elements based on the sample document
    // In a real implementation, we'd use pdf-lib's text extraction capabilities
    
    if (pageIndex === 0) {
      // Detect main title
      this.elements.push({
        type: 'title',
        content: 'PHIẾU HỌC TẬP',
        position: { x: width / 2, y: height - 150 },
        originalFont: 'Helvetica-Bold',
        originalSize: 24,
      });

      // Detect subject line
      this.elements.push({
        type: 'text',
        content: 'Bài: Luyện tập mệnh đề (Tiết 3)',
        position: { x: 100, y: height - 200 },
        originalFont: 'Helvetica',
        originalSize: 14,
      });
    }

    // Detect question patterns - simplified for MVP
    const questionPatterns = [
      'Bài 1:', 'Bài 2:', 'Bài 3:', 'Bài 4:', 'Bài 5:', 'Bài 6:'
    ];

    questionPatterns.forEach((pattern, index) => {
      if (pageIndex === Math.floor(index / 2) + 1) { // Distribute across pages
        this.elements.push({
          type: 'question',
          content: pattern,
          position: { x: 120, y: height - 150 - (index % 2) * 300 },
          originalFont: 'Helvetica-Bold',
          originalSize: 12,
        });
      }
    });
  }

  /**
   * Apply brand kit to the document
   */
  async applyBranding(brandKit: BrandKit): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');

    console.log('Applying branding...', brandKit);
    
    const pages = this.pdfDoc.getPages();
    
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      await this.applyBrandingToPage(page, brandKit, pageIndex);
    }
  }

  /**
   * Apply branding to a specific page
   */
  private async applyBrandingToPage(page: PDFPage, brandKit: BrandKit, pageIndex: number): Promise<void> {
    const { width, height } = page.getSize();

    try {
      // 1. Add logo if provided
      if (brandKit.logo.dataUrl) {
        await this.addLogoToPage(page, brandKit.logo.dataUrl, width, height);
      }

      // 2. Apply brand color to headers/titles
      await this.applyBrandColorToPage(page, brandKit.color, pageIndex);

      // 3. Add footer with brand info
      await this.addBrandedFooter(page, brandKit, width, height);

    } catch (error) {
      console.warn(`Could not apply branding to page ${pageIndex + 1}:`, error);
    }
  }

  /**
   * Add logo to page header
   */
  private async addLogoToPage(page: PDFPage, logoDataUrl: string, width: number, height: number): Promise<void> {
    try {
      // Convert data URL to image bytes
      const base64Data = logoDataUrl.split(',')[1];
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Determine image type and embed
      let image;
      if (logoDataUrl.includes('data:image/png')) {
        image = await this.pdfDoc!.embedPng(imageBytes);
      } else if (logoDataUrl.includes('data:image/jpeg') || logoDataUrl.includes('data:image/jpg')) {
        image = await this.pdfDoc!.embedJpg(imageBytes);
      } else {
        console.warn('Unsupported image format, skipping logo');
        return;
      }

      // Calculate logo size (max 50px height, maintain aspect ratio)
      const maxHeight = 50;
      const imageAspectRatio = image.width / image.height;
      const logoHeight = Math.min(maxHeight, image.height);
      const logoWidth = logoHeight * imageAspectRatio;

      // Position logo in top-right corner
      page.drawImage(image, {
        x: width - logoWidth - 20,
        y: height - logoHeight - 20,
        width: logoWidth,
        height: logoHeight,
      });

    } catch (error) {
      console.warn('Could not add logo:', error);
    }
  }

  /**
   * Apply brand color to title elements
   */
  private async applyBrandColorToPage(page: PDFPage, color: string, pageIndex: number): Promise<void> {
    // Convert hex color to RGB
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    // For MVP, add a colored header bar
    page.drawRectangle({
      x: 0,
      y: page.getSize().height - 10,
      width: page.getSize().width,
      height: 10,
      color: rgb(r, g, b),
    });
  }

  /**
   * Add branded footer
   */
  private async addBrandedFooter(page: PDFPage, brandKit: BrandKit, width: number, height: number): Promise<void> {
    try {
      const font = await this.pdfDoc!.embedFont(StandardFonts.Helvetica);
      
      // Add brand text in footer
      page.drawText(`Branded with DocuBrand`, {
        x: 20,
        y: 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

    } catch (error) {
      console.warn('Could not add footer:', error);
    }
  }

  /**
   * Generate the final branded PDF
   */
  async generatePDF(): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');

    try {
      const pdfBytes = await this.pdfDoc.save();
      console.log(`Generated branded PDF: ${pdfBytes.length} bytes`);
      return pdfBytes;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw new Error('Could not generate branded PDF');
    }
  }

  /**
   * Get processing result
   */
  getProcessingResult(): PDFProcessingResult | null {
    if (!this.originalBytes || !this.pdfDoc) return null;

    return {
      originalPdf: this.originalBytes,
      brandedPdf: null, // Will be set after generatePDF()
      elements: this.elements,
      pageCount: this.pdfDoc.getPageCount(),
    };
  }

  /**
   * Public method to process entire workflow
   */
  async processDocument(file: File, brandKit: BrandKit): Promise<PDFProcessingResult> {
    // Step 1: Load PDF
    await this.loadPDF(file);
    
    // Step 2: Apply branding
    await this.applyBranding(brandKit);
    
    // Step 3: Generate branded PDF
    const brandedPdf = await this.generatePDF();
    
    // Step 4: Return result
    const result = this.getProcessingResult()!;
    result.brandedPdf = brandedPdf;
    
    return result;
  }
}