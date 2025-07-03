// UPDATED: 2025-07-03 - Enhanced with Gemini AI integration for content extraction

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  GeminiAnalysisRequest, 
  GeminiAnalysisResponse, 
  ProcessingResult, 
  AnalysisStatus,
  DEFAULT_ANALYSIS_OPTIONS 
} from '@/types/gemini';
import { getGeminiClient } from './gemini-client';
import { BrandKit } from '@/types';

/**
 * PDF processing configuration
 */
interface PDFProcessorConfig {
  maxFileSize?: number; // in bytes
  supportedTypes?: string[];
  geminiConfig?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  enableFallback?: boolean;
}

/**
 * PDF processing result
 */
interface PDFProcessingResult {
  success: boolean;
  analysisResult?: GeminiAnalysisResponse;
  brandedPdf?: Uint8Array;
  processingTime: number;
  warnings: string[];
  errors: string[];
  metadata: {
    originalFileSize: number;
    pages: number;
    extractedContent: boolean;
    brandingApplied: boolean;
  };
}

/**
 * Enhanced PDF processor with AI-powered content extraction
 */
export class PDFProcessor {
  private config: PDFProcessorConfig;
  private defaultConfig: PDFProcessorConfig = {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    supportedTypes: ['application/pdf'],
    enableFallback: true,
    geminiConfig: {
      model: 'gemini-2.0-flash',
      temperature: 0.1,
      maxTokens: 8192
    }
  };

  constructor(config: Partial<PDFProcessorConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Process PDF file: extract content and apply branding
   */
  async processPDF(
    file: File,
    brandKit: BrandKit,
    options: {
      documentType?: string;
      language?: string;
      extractContent?: boolean;
      applyBranding?: boolean;
      onProgress?: (status: AnalysisStatus) => void;
    } = {}
  ): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      console.log('📄 Starting PDF processing...');
      
      // Validate input
      await this.validateFile(file);
      
      const {
        documentType = 'general' as any,
        language = 'en',
        extractContent = true,
        applyBranding = true,
        onProgress
      } = options;

      // Update progress
      onProgress?.({
        status: 'processing',
        progress: 5,
        currentStep: 'Validating PDF file...'
      });

      // Convert file to base64 for AI analysis
      let analysisResult: GeminiAnalysisResponse | undefined;
      
      if (extractContent) {
        onProgress?.({
          status: 'processing',
          progress: 10,
          currentStep: 'Converting PDF for analysis...'
        });

        const pdfBase64 = await this.convertToBase64(file);
        
        onProgress?.({
          status: 'analyzing',
          progress: 20,
          currentStep: 'Analyzing content with AI...'
        });

        // Analyze with Gemini AI
        const analysisRequest: GeminiAnalysisRequest = {
          pdfBase64,
          documentType,
          analysisOptions: {
            ...DEFAULT_ANALYSIS_OPTIONS,
            detectLanguage: true,
            analyzeDifficulty: true
          },
          userContext: {
            role: 'teacher',
            language,
            preferences: {
              detailLevel: 'standard',
              focusAreas: ['content', 'questions']
            }
          }
        };

        const processingResult = await this.analyzeWithGemini(analysisRequest, onProgress);
        analysisResult = processingResult;

        if (processingResult.warnings) {
          warnings.push(...processingResult.warnings);
        }
        if (processingResult.errors) {
          errors.push(...processingResult.errors.map(e => e.message));
        }
      }

      // Apply branding if requested
      let brandedPdf: Uint8Array | undefined;
      
      if (applyBranding) {
        onProgress?.({
          status: 'processing',
          progress: 80,
          currentStep: 'Applying brand styling...'
        });

        brandedPdf = await this.applyBranding(file, brandKit, analysisResult);
      }

      // Get PDF metadata
      const metadata = await this.extractMetadata(file);

      onProgress?.({
        status: 'complete',
        progress: 100,
        currentStep: 'Processing completed successfully'
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ PDF processing completed in ${processingTime}ms`);

      return {
        success: true,
        analysisResult,
        brandedPdf,
        processingTime,
        warnings,
        errors,
        metadata: {
          originalFileSize: file.size,
          pages: metadata.pages,
          extractedContent: !!analysisResult,
          brandingApplied: !!brandedPdf
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ PDF processing failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      errors.push(errorMessage);

      return {
        success: false,
        processingTime,
        warnings,
        errors,
        metadata: {
          originalFileSize: file.size,
          pages: 0,
          extractedContent: false,
          brandingApplied: false
        }
      };
    }
  }

  /**
   * Extract content only (without branding)
   */
  async extractContent(
    file: File,
    options: {
      documentType?: string;
      language?: string;
      onProgress?: (status: AnalysisStatus) => void;
    } = {}
  ): Promise<ProcessingResult> {
    console.log('📄 Extracting content from PDF...');

    try {
      // Validate file
      await this.validateFile(file);

      // Convert to base64
      const pdfBase64 = await this.convertToBase64(file);

      // Create analysis request
      const analysisRequest: GeminiAnalysisRequest = {
        pdfBase64,
        documentType: options.documentType || 'general' as any,
        analysisOptions: DEFAULT_ANALYSIS_OPTIONS,
        userContext: {
          role: 'teacher',
          language: options.language || 'en',
          preferences: {
            detailLevel: 'standard',
            focusAreas: ['content', 'questions']
          }
        }
      };

      // Analyze with Gemini
      return await this.analyzeWithGemini(analysisRequest, options.onProgress);

    } catch (error) {
      console.error('❌ Content extraction failed:', error);
      throw error;
    }
  }

  /**
   * Apply branding only (without content extraction)
   */
  async applyBrandingOnly(
    file: File,
    brandKit: BrandKit,
    analysisResult?: GeminiAnalysisResponse
  ): Promise<Uint8Array> {
    console.log('🎨 Applying branding to PDF...');

    try {
      await this.validateFile(file);
      return await this.applyBranding(file, brandKit, analysisResult);
    } catch (error) {
      console.error('❌ Branding application failed:', error);
      throw error;
    }
  }

  /**
   * Validate PDF file
   */
  private async validateFile(file: File): Promise<void> {
    // Check file type
    if (!this.config.supportedTypes?.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Only PDF files are supported.`);
    }

    // Check file size
    if (file.size > (this.config.maxFileSize || 20 * 1024 * 1024)) {
      const maxSizeMB = Math.round((this.config.maxFileSize || 20 * 1024 * 1024) / 1024 / 1024);
      const fileSizeMB = Math.round(file.size / 1024 / 1024);
      throw new Error(`File too large: ${fileSizeMB}MB. Maximum size: ${maxSizeMB}MB.`);
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error('File is empty');
    }

    // Validate PDF header (basic check)
    const firstBytes = await this.readFirstBytes(file, 8);
    const pdfHeader = new TextDecoder().decode(firstBytes);
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('File does not appear to be a valid PDF');
    }

    console.log(`✅ PDF validation passed - Size: ${Math.round(file.size / 1024)}KB`);
  }

  /**
   * Convert file to base64 for AI analysis
   */
  private async convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Analyze PDF with Gemini AI
   */
  private async analyzeWithGemini(
    request: GeminiAnalysisRequest,
    onProgress?: (status: AnalysisStatus) => void
  ): Promise<ProcessingResult> {
    try {
      const client = await getGeminiClient(this.config.geminiConfig);
      return await client.analyzePDF(request, onProgress);
    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      
      if (this.config.enableFallback) {
        console.log('🔄 Using fallback analysis...');
        return this.createFallbackAnalysis(request);
      }
      
      throw error;
    }
  }

  /**
   * Apply branding to PDF
   */
  private async applyBranding(
    file: File,
    brandKit: BrandKit,
    analysisResult?: GeminiAnalysisResponse
  ): Promise<Uint8Array> {
    try {
      // Read original PDF
      const pdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Apply brand elements
      await this.addBrandElements(pdfDoc, brandKit, analysisResult);

      // Generate final PDF
      const finalPdfBytes = await pdfDoc.save();
      return finalPdfBytes;

    } catch (error) {
      throw new Error(`Branding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add brand elements to PDF
   */
  private async addBrandElements(
    pdfDoc: PDFDocument,
    brandKit: BrandKit,
    analysisResult?: GeminiAnalysisResponse
  ): Promise<void> {
    const pages = pdfDoc.getPages();
    
    // Apply branding to each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Add logo if available
      if (brandKit.logo) {
        await this.addLogo(page, brandKit.logo, width, height);
      }

      // Add brand colors and styling
      await this.applyBrandStyling(page, brandKit, width, height);

      // Add footer with brand information
      if (brandKit.footerText) {
        await this.addFooter(page, brandKit, width, height);
      }

      // Add watermark if specified
      if (brandKit.watermark) {
        await this.addWatermark(page, brandKit.watermark, width, height);
      }
    }

    // Update document metadata
    pdfDoc.setTitle(analysisResult?.extractedContent.title || 'Branded Document');
    pdfDoc.setCreator('DocuBrand - Document Branding Tool');
    pdfDoc.setProducer('DocuBrand v1.0');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  }

  /**
   * Add logo to page
   */
  private async addLogo(page: any, logoUrl: string, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      // For now, we'll add a placeholder for logo
      // In production, you'd need to fetch and embed the actual image
      console.log('🖼️ Logo placement reserved for:', logoUrl);
      
      // Reserve space for logo (top-right corner)
      const logoWidth = Math.min(100, pageWidth * 0.15);
      const logoHeight = logoWidth * 0.6; // Maintain aspect ratio
      
      // This is where you'd embed the actual logo image
      // const logoImage = await pdfDoc.embedPng(logoBytes);
      // page.drawImage(logoImage, {
      //   x: pageWidth - logoWidth - 20,
      //   y: pageHeight - logoHeight - 20,
      //   width: logoWidth,
      //   height: logoHeight
      // });
      
    } catch (error) {
      console.warn('⚠️ Failed to add logo:', error);
    }
  }

  /**
   * Apply brand styling to page
   */
  private async applyBrandStyling(page: any, brandKit: BrandKit, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      // Add brand color accents
      if (brandKit.color) {
        const color = this.hexToRgb(brandKit.color);
        
        // Add thin colored border at top
        page.drawRectangle({
          x: 0,
          y: pageHeight - 5,
          width: pageWidth,
          height: 5,
          color: rgb(color.r / 255, color.g / 255, color.b / 255)
        });
      }

      // Add secondary color accent if available
      if (brandKit.secondaryColor) {
        const color = this.hexToRgb(brandKit.secondaryColor);
        
        // Add thin colored border at bottom
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageWidth,
          height: 3,
          color: rgb(color.r / 255, color.g / 255, color.b / 255)
        });
      }

    } catch (error) {
      console.warn('⚠️ Failed to apply brand styling:', error);
    }
  }

  /**
   * Add footer with brand information
   */
  private async addFooter(page: any, brandKit: BrandKit, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      const font = await page.doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 8;
      const text = brandKit.footerText || 'Branded with DocuBrand';
      
      page.drawText(text, {
        x: 20,
        y: 15,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5)
      });

      // Add timestamp
      const timestamp = `Generated: ${new Date().toLocaleDateString()}`;
      page.drawText(timestamp, {
        x: pageWidth - 120,
        y: 15,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5)
      });

    } catch (error) {
      console.warn('⚠️ Failed to add footer:', error);
    }
  }

  /**
   * Add watermark to page
   */
  private async addWatermark(page: any, watermarkText: string, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      const font = await page.doc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 48;
      
      // Calculate center position
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const x = (pageWidth - textWidth) / 2;
      const y = pageHeight / 2;

      // Add semi-transparent watermark
      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.3
      });

    } catch (error) {
      console.warn('⚠️ Failed to add watermark:', error);
    }
  }

  /**
   * Extract basic PDF metadata
   */
  private async extractMetadata(file: File): Promise<{ pages: number; size: number }> {
    try {
      const pdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      return {
        pages: pdfDoc.getPageCount(),
        size: file.size
      };
    } catch (error) {
      console.warn('⚠️ Failed to extract metadata:', error);
      return {
        pages: 1,
        size: file.size
      };
    }
  }

  /**
   * Read first few bytes of file for validation
   */
  private async readFirstBytes(file: File, count: number): Promise<Uint8Array> {
    const slice = file.slice(0, count);
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Create fallback analysis for when Gemini fails
   */
  private createFallbackAnalysis(request: GeminiAnalysisRequest): ProcessingResult {
    console.log('🔄 Creating fallback analysis...');
    
    return {
      success: true,
      processingTime: 0,
      warnings: ['AI analysis unavailable, using basic extraction'],
      errors: [],
      extractedQuestions: [],
      documentStructure: {
        type: request.documentType || 'general',
        subject: 'Document Analysis',
        confidence: 0.1,
        sections: [{
          id: 'fallback_section_1',
          type: 'content',
          content: 'Content extraction unavailable. Please review document manually.',
          position: { page: 1, x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.1
        }]
      },
      extractedContent: {
        title: 'Document (Analysis Unavailable)',
        subtitle: 'Please review content manually'
      }
    };
  }
}

/**
 * Singleton PDF processor instance
 */
let pdfProcessorInstance: PDFProcessor | null = null;

/**
 * Get PDF processor instance
 */
export function getPDFProcessor(config?: Partial<PDFProcessorConfig>): PDFProcessor {
  if (!pdfProcessorInstance) {
    pdfProcessorInstance = new PDFProcessor(config);
  }
  return pdfProcessorInstance;
}

/**
 * Reset PDF processor instance
 */
export function resetPDFProcessor(): void {
  pdfProcessorInstance = null;
}