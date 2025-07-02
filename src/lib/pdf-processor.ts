// UPDATED: 2025-07-03 - Integrated with Gemini AI for content extraction

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { BrandKit, QuizElement, PDFProcessingResult } from '@/types';
import { GeminiAnalysisResponse, DocumentSection } from '@/types/gemini';
import { GeminiService } from './gemini-service';

export class PDFProcessor {
  private pdfDoc: PDFDocument | null = null;
  private originalBytes: Uint8Array | null = null;
  private elements: QuizElement[] = [];
  private analysisResult: GeminiAnalysisResponse | null = null;

  /**
   * Load PDF file and extract content using Gemini AI
   */
  async loadPDF(file: File): Promise<void> {
    try {
      console.log('📄 Loading PDF file:', file.name);
      
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      this.originalBytes = new Uint8Array(arrayBuffer);
      
      // Load PDF with pdf-lib for processing
      this.pdfDoc = await PDFDocument.load(this.originalBytes);
      
      console.log(`📋 PDF loaded: ${this.pdfDoc.getPageCount()} pages`);
      
      // Extract content using Gemini AI
      await this.extractContentWithGemini(file);
      
    } catch (error) {
      console.error('❌ Failed to load PDF:', error);
      throw new Error(`Could not load PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract content using Gemini AI API
   */
  private async extractContentWithGemini(file: File): Promise<void> {
    try {
      console.log('🤖 Starting Gemini AI analysis...');
      
      // Convert file to base64
      const base64Data = await GeminiService.fileToBase64(file);
      
      // Validate file
      const validation = GeminiService.validatePDFFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Call our API endpoint
      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pdfBase64: base64Data,
          documentType: this.detectDocumentType(file.name),
          language: 'en', // Default for MVP
          fileName: file.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const apiResult = await response.json();
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Analysis failed');
      }

      this.analysisResult = apiResult.data;
      
      // Convert Gemini analysis to QuizElement format
      this.convertGeminiToElements();
      
      console.log('✅ Gemini analysis completed:', {
        questionsFound: this.analysisResult.extractedQuestions.length,
        sectionsFound: this.analysisResult.documentStructure.sections.length,
        confidence: this.analysisResult.processingInfo.confidence
      });

    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      
      // Fallback to basic extraction if AI fails
      console.log('🔄 Falling back to basic extraction...');
      await this.fallbackExtraction();
    }
  }

  /**
   * Convert Gemini analysis results to QuizElement format
   */
  private convertGeminiToElements(): void {
    if (!this.analysisResult) return;

    this.elements = [];
    const { documentStructure, extractedQuestions } = this.analysisResult;

    // Convert document sections to QuizElements
    documentStructure.sections.forEach((section: DocumentSection, index: number) => {
      const element: QuizElement = {
        type: this.mapSectionTypeToElementType(section.type),
        content: section.content,
        position: {
          x: 100, // Default positioning - can be enhanced
          y: 800 - (index * 50) // Rough vertical positioning
        },
        originalFont: section.formatting?.fontSize || 'Helvetica',
        originalSize: this.mapFontSizeToNumber(section.formatting?.fontSize)
      };

      this.elements.push(element);
    });

    // Add extracted questions as separate elements
    extractedQuestions.forEach((question, index) => {
      const questionElement: QuizElement = {
        type: 'question',
        content: `${question.number}. ${question.content}`,
        position: {
          x: 120,
          y: 700 - (index * 100) // Space out questions
        },
        originalFont: 'Helvetica-Bold',
        originalSize: 12
      };

      this.elements.push(questionElement);

      // Add options if it's multiple choice
      if (question.options && question.options.length > 0) {
        question.options.forEach((option, optIndex) => {
          const optionElement: QuizElement = {
            type: 'answer',
            content: option,
            position: {
              x: 140,
              y: 680 - (index * 100) - (optIndex * 20)
            },
            originalFont: 'Helvetica',
            originalSize: 10
          };

          this.elements.push(optionElement);
        });
      }
    });

    console.log(`📝 Converted ${this.elements.length} elements from Gemini analysis`);
  }

  /**
   * Map Gemini section types to QuizElement types
   */
  private mapSectionTypeToElementType(sectionType: string): QuizElement['type'] {
    switch (sectionType) {
      case 'header':
        return 'title';
      case 'question':
        return 'question';
      case 'answer':
        return 'answer';
      case 'instruction':
      case 'content':
      default:
        return 'text';
    }
  }

  /**
   * Map font size strings to numbers
   */
  private mapFontSizeToNumber(fontSize?: string): number {
    switch (fontSize) {
      case 'large':
        return 16;
      case 'small':
        return 10;
      case 'normal':
      default:
        return 12;
    }
  }

  /**
   * Detect document type from filename
   */
  private detectDocumentType(fileName: string): 'quiz' | 'worksheet' | 'general' {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('quiz') || lowerName.includes('test') || lowerName.includes('exam')) {
      return 'quiz';
    }
    
    if (lowerName.includes('worksheet') || lowerName.includes('exercise') || lowerName.includes('practice')) {
      return 'worksheet';
    }
    
    return 'general';
  }

  /**
   * Fallback content extraction (basic method)
   */
  private async fallbackExtraction(): Promise<void> {
    if (!this.pdfDoc) return;

    console.log('📝 Using fallback extraction method...');
    
    this.elements = [];
    const pages = this.pdfDoc.getPages();

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // Create basic structure based on page layout
      if (pageIndex === 0) {
        // Main title
        this.elements.push({
          type: 'title',
          content: 'Document Title (Please edit)',
          position: { x: width / 2, y: height - 100 },
          originalFont: 'Helvetica-Bold',
          originalSize: 18,
        });

        // Instructions
        this.elements.push({
          type: 'text',
          content: 'Instructions: Please review and edit the extracted content below.',
          position: { x: 100, y: height - 150 },
          originalFont: 'Helvetica',
          originalSize: 12,
        });
      }

      // Add placeholder questions
      for (let i = 1; i <= 3; i++) {
        this.elements.push({
          type: 'question',
          content: `Question ${pageIndex * 3 + i}: [Please edit this question content]`,
          position: { x: 120, y: height - 200 - (i * 80) },
          originalFont: 'Helvetica-Bold',
          originalSize: 12,
        });
      }
    }

    console.log(`📋 Fallback extraction created ${this.elements.length} placeholder elements`);
  }

  /**
   * Apply brand kit to the document
   */
  async applyBranding(brandKit: BrandKit): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');

    console.log('🎨 Applying branding...', {
      hasLogo: !!brandKit.logo.dataUrl,
      color: brandKit.color,
      font: brandKit.font
    });
    
    const pages = this.pdfDoc.getPages();
    
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      await this.applyBrandingToPage(page, brandKit, pageIndex);
    }

    console.log('✅ Branding applied to all pages');
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

      // 2. Apply brand color header
      await this.applyBrandColorToPage(page, brandKit.color, width, height);

      // 3. Add footer with branding
      await this.addBrandedFooter(page, brandKit, width, height);

      // 4. Apply enhanced content formatting
      if (this.analysisResult) {
        await this.applyContentFormatting(page, brandKit);
      }

    } catch (error) {
      console.warn(`⚠️ Could not apply branding to page ${pageIndex + 1}:`, error);
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
        console.warn('⚠️ Unsupported image format, skipping logo');
        return;
      }

      // Calculate logo size (max 60px height, maintain aspect ratio)
      const maxHeight = 60;
      const imageAspectRatio = image.width / image.height;
      const logoHeight = Math.min(maxHeight, image.height);
      const logoWidth = logoHeight * imageAspectRatio;

      // Position logo in top-right corner
      page.drawImage(image, {
        x: width - logoWidth - 30,
        y: height - logoHeight - 30,
        width: logoWidth,
        height: logoHeight,
      });

      console.log('✅ Logo added to page');

    } catch (error) {
      console.warn('⚠️ Could not add logo:', error);
    }
  }

  /**
   * Apply brand color header
   */
  private async applyBrandColorToPage(page: PDFPage, color: string, width: number, height: number): Promise<void> {
    try {
      // Convert hex color to RGB
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;

      // Add colored header bar
      page.drawRectangle({
        x: 0,
        y: height - 15,
        width: width,
        height: 15,
        color: rgb(r, g, b),
      });

      // Add accent border on the left
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 5,
        height: height,
        color: rgb(r, g, b),
      });

      console.log('✅ Brand color applied');

    } catch (error) {
      console.warn('⚠️ Could not apply brand color:', error);
    }
  }

  /**
   * Add branded footer
   */
  private async addBrandedFooter(page: PDFPage, brandKit: BrandKit, width: number, height: number): Promise<void> {
    try {
      const font = await this.pdfDoc!.embedFont(StandardFonts.Helvetica);
      
      // Add brand text in footer
      page.drawText('Branded with DocuBrand', {
        x: 30,
        y: 25,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Add processing info if available
      if (this.analysisResult) {
        const confidence = Math.round(this.analysisResult.processingInfo.confidence * 100);
        page.drawText(`AI Confidence: ${confidence}%`, {
          x: width - 120,
          y: 25,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

    } catch (error) {
      console.warn('⚠️ Could not add footer:', error);
    }
  }

  /**
   * Apply enhanced content formatting based on Gemini analysis
   */
  private async applyContentFormatting(page: PDFPage, brandKit: BrandKit): Promise<void> {
    if (!this.analysisResult) return;

    try {
      const font = await this.pdfDoc!.embedFont(StandardFonts.Helvetica);
      const boldFont = await this.pdfDoc!.embedFont(StandardFonts.HelveticaBold);

      // Add document title if extracted
      if (this.analysisResult.extractedContent.title) {
        page.drawText(this.analysisResult.extractedContent.title, {
          x: 50,
          y: page.getSize().height - 80,
          size: 16,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      // Add subject if available
      if (this.analysisResult.documentStructure.subject) {
        page.drawText(`Subject: ${this.analysisResult.documentStructure.subject}`, {
          x: 50,
          y: page.getSize().height - 110,
          size: 12,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

    } catch (error) {
      console.warn('⚠️ Could not apply content formatting:', error);
    }
  }

  /**
   * Generate the final branded PDF
   */
  async generatePDF(): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');

    try {
      const pdfBytes = await this.pdfDoc.save();
      console.log(`✅ Generated branded PDF: ${pdfBytes.length} bytes`);
      return pdfBytes;
    } catch (error) {
      console.error('❌ Failed to generate PDF:', error);
      throw new Error('Could not generate branded PDF');
    }
  }

  /**
   * Get processing result with enhanced information
   */
  getProcessingResult(): PDFProcessingResult | null {
    if (!this.originalBytes || !this.pdfDoc) return null;

    return {
      originalPdf: this.originalBytes,
      brandedPdf: null, // Will be set after generatePDF()
      elements: this.elements,
      pageCount: this.pdfDoc.getPageCount(),
      // Add Gemini analysis info
      ...(this.analysisResult && {
        aiAnalysis: {
          confidence: this.analysisResult.processingInfo.confidence,
          questionsDetected: this.analysisResult.extractedQuestions.length,
          sectionsDetected: this.analysisResult.documentStructure.sections.length,
          model: this.analysisResult.processingInfo.model
        }
      })
    };
  }

  /**
   * Public method to process entire workflow with enhanced AI
   */
  async processDocument(file: File, brandKit: BrandKit): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting enhanced PDF processing with AI...');
      
      // Step 1: Load PDF and extract content with Gemini
      await this.loadPDF(file);
      
      // Step 2: Apply branding
      await this.applyBranding(brandKit);
      
      // Step 3: Generate branded PDF
      const brandedPdf = await this.generatePDF();
      
      // Step 4: Return result
      const result = this.getProcessingResult()!;
      result.brandedPdf = brandedPdf;
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Enhanced PDF processing completed in ${processingTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      throw error;
    }
  }

  /**
   * Get analysis summary for user display
   */
  getAnalysisSummary(): {
    hasAIAnalysis: boolean;
    confidence?: number;
    questionsFound?: number;
    sectionsFound?: number;
    documentType?: string;
    processingMethod: 'ai' | 'fallback';
  } {
    if (this.analysisResult) {
      return {
        hasAIAnalysis: true,
        confidence: this.analysisResult.processingInfo.confidence,
        questionsFound: this.analysisResult.extractedQuestions.length,
        sectionsFound: this.analysisResult.documentStructure.sections.length,
        documentType: this.analysisResult.documentStructure.metadata.documentType,
        processingMethod: 'ai'
      };
    }

    return {
      hasAIAnalysis: false,
      processingMethod: 'fallback'
    };
  }
}