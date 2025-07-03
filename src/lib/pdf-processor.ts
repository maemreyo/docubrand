// UPDATED: 2025-07-03 - Fixed fontkit integration and Vietnamese support

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getSimpleFontManager, registerFontkitSafely } from "./fontkit-manager";
import {
  GeminiAnalysisRequest,
  GeminiAnalysisResponse,
  ProcessingResult,
  AnalysisStatus,
  DEFAULT_ANALYSIS_OPTIONS,
} from "@/types/gemini";
import { getGeminiClient } from "./gemini-client";
import { BrandKit } from "@/types";


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
 * Enhanced PDF processor with proper fontkit integration
 */
export class PDFProcessor {
  private config: PDFProcessorConfig;
  private fontManager: any;
  private defaultConfig: PDFProcessorConfig = {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    supportedTypes: ["application/pdf"],
    enableFallback: true,
    geminiConfig: {
      model: "gemini-2.0-flash",
      temperature: 0.1,
      maxTokens: 8192,
    },
  };

  constructor(config: Partial<PDFProcessorConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.fontManager = getSimpleFontManager();
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
      console.log("📄 Starting PDF processing with fontkit support...");
      
      // Log font manager status
      const fontStatus = this.fontManager.getStatus();
      console.log("🔤 Font status:", fontStatus);

      // Validate input
      await this.validateFile(file);

      const {
        documentType = "general" as any,
        language = "en",
        extractContent = true,
        applyBranding = true,
        onProgress,
      } = options;

      // Update progress
      onProgress?.({
        status: "processing",
        progress: 5,
        currentStep: "Validating PDF file...",
      });

      // Convert file to base64 for AI analysis
      let analysisResult: GeminiAnalysisResponse | undefined;

      if (extractContent) {
        onProgress?.({
          status: "processing",
          progress: 10,
          currentStep: "Converting PDF for analysis...",
        });

        const pdfBase64 = await this.convertToBase64(file);

        onProgress?.({
          status: "analyzing",
          progress: 20,
          currentStep: "Analyzing content with AI...",
        });

        // Analyze with Gemini AI
        const analysisRequest: GeminiAnalysisRequest = {
          pdfBase64,
          documentType,
          analysisOptions: {
            ...DEFAULT_ANALYSIS_OPTIONS,
            detectLanguage: true,
            analyzeDifficulty: true,
          },
          userContext: {
            role: "teacher",
            language,
            preferences: {
              detailLevel: "standard",
              focusAreas: ["content", "questions"],
            },
          },
        };

        const processingResult = await this.analyzeWithGemini(
          analysisRequest,
          onProgress
        );
        analysisResult = processingResult;

        if (processingResult.warnings) {
          warnings.push(...processingResult.warnings);
        }
        if (processingResult.errors) {
          errors.push(...processingResult.errors.map((e) => e.message));
        }
      }

      // Apply branding if requested
      let brandedPdf: Uint8Array | undefined;

      if (applyBranding) {
        onProgress?.({
          status: "processing",
          progress: 80,
          currentStep: "Applying brand styling with fontkit...",
        });

        try {
          brandedPdf = await this.applyBranding(file, brandKit, analysisResult);
          console.log("✅ Branding applied successfully");
        } catch (brandingError) {
          console.error("❌ Branding failed:", brandingError);
          warnings.push(`Branding failed: ${brandingError instanceof Error ? brandingError.message : 'Unknown error'}`);
          
          // Return original PDF if branding fails
          brandedPdf = new Uint8Array(await file.arrayBuffer());
        }
      }

      // Get PDF metadata
      const metadata = await this.extractMetadata(file);

      onProgress?.({
        status: "complete",
        progress: 100,
        currentStep: "Processing completed successfully",
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
          brandingApplied: !!brandedPdf,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("❌ PDF processing failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown processing error";
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
          brandingApplied: false,
        },
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
    console.log("📄 Extracting content from PDF...");

    try {
      // Validate file
      await this.validateFile(file);

      // Convert to base64
      const pdfBase64 = await this.convertToBase64(file);

      // Create analysis request
      const analysisRequest: GeminiAnalysisRequest = {
        pdfBase64,
        documentType: options.documentType || ("general" as any),
        analysisOptions: DEFAULT_ANALYSIS_OPTIONS,
        userContext: {
          role: "teacher",
          language: options.language || "en",
          preferences: {
            detailLevel: "standard",
            focusAreas: ["content", "questions"],
          },
        },
      };

      // Analyze with Gemini
      return await this.analyzeWithGemini(analysisRequest, options.onProgress);
    } catch (error) {
      console.error("❌ Content extraction failed:", error);
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
    console.log("🎨 Applying branding to PDF...");

    try {
      await this.validateFile(file);
      return await this.applyBranding(file, brandKit, analysisResult);
    } catch (error) {
      console.error("❌ Branding application failed:", error);
      throw error;
    }
  }

  /**
   * Validate PDF file
   */
  private async validateFile(file: File): Promise<void> {
    // Check file type
    if (!this.config.supportedTypes?.includes(file.type)) {
      throw new Error(
        `Unsupported file type: ${file.type}. Only PDF files are supported.`
      );
    }

    // Check file size
    if (file.size > (this.config.maxFileSize || 20 * 1024 * 1024)) {
      const maxSizeMB = Math.round(
        (this.config.maxFileSize || 20 * 1024 * 1024) / 1024 / 1024
      );
      const fileSizeMB = Math.round(file.size / 1024 / 1024);
      throw new Error(
        `File too large: ${fileSizeMB}MB. Maximum size: ${maxSizeMB}MB.`
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error("File is empty");
    }

    // Validate PDF header (basic check)
    const firstBytes = await this.readFirstBytes(file, 8);
    const pdfHeader = new TextDecoder().decode(firstBytes);
    if (!pdfHeader.startsWith("%PDF-")) {
      throw new Error("File does not appear to be a valid PDF");
    }

    console.log(
      `✅ PDF validation passed - Size: ${Math.round(file.size / 1024)}KB`
    );
  }

  /**
   * Convert file to base64 for AI analysis
   */
  private async convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
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
      console.error("❌ Gemini analysis failed:", error);

      if (this.config.enableFallback) {
        console.log("🔄 Using fallback analysis...");
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
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
      });

      // Apply brand elements
      await this.addBrandElements(pdfDoc, brandKit, analysisResult);

      // Generate final PDF
      const finalPdfBytes = await pdfDoc.save();
      return finalPdfBytes;
    } catch (error) {
      throw new Error(
        `Branding failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Add brand elements with proper fontkit handling
   */
  private async addBrandElements(
    pdfDoc: PDFDocument,
    brandKit: BrandKit,
    analysisResult?: GeminiAnalysisResponse
  ): Promise<void> {
    try {
      console.log(`🎨 Applying branding with fontkit support...`);

      // Initialize font manager
      const fontInitialized = await this.fontManager.initialize(pdfDoc);
      console.log(`🔤 Font manager initialized: ${fontInitialized}`);

      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        try {
          // Apply brand styling (colors and borders)
          await this.applyBrandStyling(page, brandKit, width, height);

          // Add footer with font manager
          await this.addSmartFooter(page, pdfDoc, brandKit, width, height);

          // Add watermark if specified
          if (brandKit.watermark) {
            await this.addSmartWatermark(page, pdfDoc, brandKit.watermark, width, height);
          }

          console.log(`✅ Page ${i + 1} branding applied successfully`);
        } catch (pageError) {
          console.warn(`⚠️ Page ${i + 1} branding failed:`, pageError);
          // Continue with other pages
        }
      }

      // Set document metadata
      await this.setDocumentMetadata(pdfDoc, analysisResult);

      console.log("✅ All branding applied with fontkit support");
    } catch (error) {
      console.error("❌ Branding failed:", error);
      // Don't throw error, continue without branding
      console.log("⚠️ Continuing without visual branding...");
    }
  }

  /**
   * Add footer using font manager
   */
  private async addSmartFooter(
    page: any,
    pdfDoc: PDFDocument,
    brandKit: BrandKit,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    try {
      const footerText = brandKit.footerText || "Created with DocuBrand";
      
      // Try to render with font manager
      const success = await this.fontManager.renderText(page, pdfDoc, footerText, {
        x: 20,
        y: 15,
        size: 8,
        color: { r: 128, g: 128, b: 128 },
        align: 'left'
      });

      if (success) {
        // Add timestamp
        const timestamp = this.createTimestamp();
        await this.fontManager.renderText(page, pdfDoc, timestamp, {
          x: pageWidth - 20,
          y: 15,
          size: 8,
          color: { r: 128, g: 128, b: 128 },
          align: 'right'
        });

        console.log("✅ Smart footer added successfully");
      } else {
        console.warn("⚠️ Smart footer failed, using fallback");
        await this.addBasicFooter(page, pdfDoc, brandKit, pageWidth, pageHeight);
      }

    } catch (error) {
      console.warn("⚠️ Smart footer error:", error);
      await this.addBasicFooter(page, pdfDoc, brandKit, pageWidth, pageHeight);
    }
  }

  /**
   * Add watermark using font manager
   */
  private async addSmartWatermark(
    page: any,
    pdfDoc: PDFDocument,
    watermarkText: string,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    try {
      const success = await this.fontManager.renderText(page, pdfDoc, watermarkText, {
        x: pageWidth / 2,
        y: pageHeight / 2,
        size: 48,
        color: { r: 230, g: 230, b: 230 },
        align: 'center'
      });

      if (success) {
        console.log("✅ Smart watermark added successfully");
      } else {
        console.warn("⚠️ Smart watermark failed");
      }

    } catch (error) {
      console.warn("⚠️ Smart watermark error:", error);
    }
  }

  /**
   * Fallback footer with basic font
   */
  private async addBasicFooter(
    page: any,
    pdfDoc: PDFDocument,
    brandKit: BrandKit,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 8;
      
      // Convert Vietnamese to ASCII for safety
      const rawText = brandKit.footerText || "Created with DocuBrand";
      const safeText = this.fontManager.toASCII(rawText);
      
      page.drawText(safeText, {
        x: 20,
        y: 15,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Safe timestamp
      const timestamp = this.createTimestamp();
      page.drawText(timestamp, {
        x: pageWidth - 120,
        y: 15,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      console.log("✅ Basic footer added successfully");
    } catch (error) {
      console.warn("⚠️ Even basic footer failed:", error);
    }
  }

  /**
   * Set document metadata with Vietnamese support
   */
  private async setDocumentMetadata(
    pdfDoc: PDFDocument,
    analysisResult?: GeminiAnalysisResponse
  ): Promise<void> {
    try {
      // Convert Vietnamese metadata to ASCII for PDF compatibility
      const title = analysisResult?.extractedContent.title || "Branded Document";
      const subject = analysisResult?.documentStructure.subject || "Educational Document";
      
      const safeTitle = this.fontManager.toASCII(title);
      const safeSubject = this.fontManager.toASCII(subject);

      pdfDoc.setTitle(safeTitle);
      pdfDoc.setSubject(safeSubject);
      pdfDoc.setCreator("DocuBrand - Document Branding Tool");
      pdfDoc.setProducer("DocuBrand v1.0");
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      console.log("✅ Document metadata set successfully");
    } catch (error) {
      console.warn("⚠️ Metadata setting failed:", error);
    }
  }

  /**
   * Create safe timestamp
   */
  private createTimestamp(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    
    return `Generated: ${day}/${month}/${year}`;
  }

  /**
   * Add logo to page
   */
  private async addLogo(
    page: any,
    logoUrl: string,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    try {
      // For now, we'll add a placeholder for logo
      // In production, you'd need to fetch and embed the actual image
      console.log("🖼️ Logo placement reserved for:", logoUrl);

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
      console.warn("⚠️ Failed to add logo:", error);
    }
  }






  /**
   * Apply brand styling to page (existing method, no changes needed)
   */
  private async applyBrandStyling(
    page: any,
    brandKit: BrandKit,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    try {
      // Add brand color accents
      if (brandKit.color && this.isValidHexColor(brandKit.color)) {
        const color = this.hexToRgb(brandKit.color);

        // Add thin colored border at top
        page.drawRectangle({
          x: 0,
          y: pageHeight - 5,
          width: pageWidth,
          height: 5,
          color: rgb(color.r / 255, color.g / 255, color.b / 255),
        });
      }

      // Add secondary color accent if available
      if (
        brandKit.secondaryColor &&
        this.isValidHexColor(brandKit.secondaryColor)
      ) {
        const color = this.hexToRgb(brandKit.secondaryColor);

        // Add thin colored border at bottom
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageWidth,
          height: 3,
          color: rgb(color.r / 255, color.g / 255, color.b / 255),
        });
      }

      console.log("✅ Brand styling applied successfully");
    } catch (error) {
      console.warn("⚠️ Brand styling failed:", error);
    }
  }

  /**
   * Add footer with brand information
   */
  private async addFooter(
    page: any,
    brandKit: BrandKit,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    try {
      const font = await page.doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 8;

      // SAFE: Use only ASCII characters
      const safeText = "Branded with DocuBrand";

      page.drawText(safeText, {
        x: 20,
        y: 15,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Safe timestamp
      const now = new Date();
      const timestamp = `Generated: ${
        now.getMonth() + 1
      }/${now.getDate()}/${now.getFullYear()}`;

      page.drawText(timestamp, {
        x: pageWidth - 120,
        y: 15,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    } catch (error) {
      console.warn("⚠️ Failed to add footer:", error);
    }
  }

  /**
   * Add watermark to page
   */
  private async addWatermark(
    page: any,
    watermarkText: string,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
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
        opacity: 0.3,
      });
    } catch (error) {
      console.warn("⚠️ Failed to add watermark:", error);
    }
  }

  /**
   * Extract basic PDF metadata
   */
  private async extractMetadata(
    file: File
  ): Promise<{ pages: number; size: number }> {
    try {
      const pdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
      });

      return {
        pages: pdfDoc.getPageCount(),
        size: file.size,
      };
    } catch (error) {
      console.warn("⚠️ Failed to extract metadata:", error);
      return {
        pages: 1,
        size: file.size,
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
   * Validate hex color format
   */
  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Convert hex to RGB with validation
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    if (!this.isValidHexColor(hex)) {
      console.warn(`Invalid hex color: ${hex}, using default`);
      return { r: 0, g: 0, b: 0 };
    }

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
   * Process content with Vietnamese support
   */
  async processVietnameseContent(
    file: File,
    brandKit: BrandKit,
    analysisResult: GeminiAnalysisResponse
  ): Promise<{
    success: boolean;
    brandedPdf?: Uint8Array;
    error?: string;
    vietnameseStats?: {
      hasVietnamese: boolean;
      vietnameseTextCount: number;
      fontUsed: string;
    };
  }> {
    try {
      console.log("🇻🇳 Processing Vietnamese content...");

      // Analyze Vietnamese content
      const vietnameseStats = this.analyzeVietnameseContent(analysisResult);

      // Process with appropriate font selection
      const result = await this.processPDF(file, brandKit, {
        documentType: "general",
        language: "vi",
        extractContent: false,
        applyBranding: true,
        onProgress: (status) => {
          console.log(`📊 Vietnamese processing: ${status.currentStep}`);
        },
      });

      if (!result.success) {
        return {
          success: false,
          error: result.errors.join(", "),
          vietnameseStats,
        };
      }

      return {
        success: true,
        brandedPdf: result.brandedPdf,
        vietnameseStats,
      };
    } catch (error) {
      console.error("❌ Vietnamese content processing failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Analyze Vietnamese content in analysis result
   */
  private analyzeVietnameseContent(analysisResult: GeminiAnalysisResponse): {
    hasVietnamese: boolean;
    vietnameseTextCount: number;
    fontUsed: string;
  } {
    let vietnameseTextCount = 0;
    let hasVietnamese = false;

    // Check title
    if (analysisResult.extractedContent.title) {
      if (
        this.fontManager.containsVietnamese(
          analysisResult.extractedContent.title
        )
      ) {
        hasVietnamese = true;
        vietnameseTextCount++;
      }
    }

    // Check subtitle
    if (analysisResult.extractedContent.subtitle) {
      if (
        this.fontManager.containsVietnamese(
          analysisResult.extractedContent.subtitle
        )
      ) {
        hasVietnamese = true;
        vietnameseTextCount++;
      }
    }

    // Check sections
    if (analysisResult.documentStructure.sections) {
      analysisResult.documentStructure.sections.forEach((section) => {
        if (this.fontManager.containsVietnamese(section.content)) {
          hasVietnamese = true;
          vietnameseTextCount++;
        }
      });
    }

    // Check questions
    if (analysisResult.extractedQuestions) {
      analysisResult.extractedQuestions.forEach((question) => {
        if (this.fontManager.containsVietnamese(question.content)) {
          hasVietnamese = true;
          vietnameseTextCount++;
        }
      });
    }

    const fontUsed = hasVietnamese ? "inter" : "helvetica";

    return {
      hasVietnamese,
      vietnameseTextCount,
      fontUsed,
    };
  }

  /**
   * Legacy compatibility method with Vietnamese support
   */
  async processDocument(
    file: File,
    brandKit: BrandKit,
    analysisResult: GeminiAnalysisResponse
  ): Promise<{
    brandedPdf: Uint8Array;
    originalPdf: Uint8Array;
    pageCount: number;
    elements: Array<{
      type: string;
      content: string;
      position: { x: number; y: number; width: number; height: number };
      pageNumber: number;
    }>;
    metadata: {
      title: string;
      subject: string;
      createdAt: string;
      vietnameseSupport?: boolean;
    };
  }> {
    console.log("🇻🇳 Legacy processDocument with Vietnamese support");

    try {
      // Use the new Vietnamese processing method
      const result = await this.processVietnameseContent(
        file,
        brandKit,
        analysisResult
      );

      if (!result.success || !result.brandedPdf) {
        throw new Error(result.error || "Vietnamese PDF processing failed");
      }

      const originalPdf = new Uint8Array(await file.arrayBuffer());

      return {
        brandedPdf: result.brandedPdf,
        originalPdf,
        pageCount: await this.getPageCount(file),
        elements: this.createElementsFromAnalysis(analysisResult),
        metadata: {
          title:
            analysisResult.extractedContent.title ||
            "Tài liệu được đổi thương hiệu",
          subject:
            analysisResult.documentStructure.subject || "Tài liệu giáo dục",
          createdAt: new Date().toISOString(),
          vietnameseSupport: result.vietnameseStats?.hasVietnamese || false,
        },
      };
    } catch (error) {
      console.error("❌ Vietnamese processDocument failed:", error);
      throw new Error(
        `Vietnamese document processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get page count from PDF
   */
  private async getPageCount(file: File): Promise<number> {
    try {
      const pdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      return pdfDoc.getPageCount();
    } catch (error) {
      console.warn("⚠️ Failed to get page count:", error);
      return 1;
    }
  }

  /**
   * Detect document type from analysis result
   */
  private detectDocumentTypeFromAnalysis(
    analysisResult: GeminiAnalysisResponse
  ): "quiz" | "worksheet" | "general" {
    const hasQuestions =
      analysisResult.extractedQuestions &&
      analysisResult.extractedQuestions.length > 0;

    if (hasQuestions) {
      const hasMultipleChoice = analysisResult.extractedQuestions.some(
        (q) => q.type === "multiple_choice"
      );
      return hasMultipleChoice ? "quiz" : "worksheet";
    }

    return "general";
  }

  /**
   * Create elements array from analysis result
   */
  private createElementsFromAnalysis(
    analysisResult: GeminiAnalysisResponse
  ): Array<{
    type: string;
    content: string;
    position: { x: number; y: number; width: number; height: number };
    pageNumber: number;
  }> {
    const elements = [];

    // Add title element
    if (analysisResult.extractedContent.title) {
      elements.push({
        type: "title",
        content: analysisResult.extractedContent.title,
        position: { x: 0, y: 0, width: 100, height: 10 },
        pageNumber: 1,
      });
    }

    // Add sections
    if (analysisResult.documentStructure.sections) {
      analysisResult.documentStructure.sections.forEach((section, index) => {
        elements.push({
          type: section.type,
          content: section.content,
          position: section.position || {
            x: 0,
            y: 20 + index * 15,
            width: 100,
            height: 10,
          },
          pageNumber: section.position?.page || 1,
        });
      });
    }

    // Add questions
    if (analysisResult.extractedQuestions) {
      analysisResult.extractedQuestions.forEach((question, index) => {
        elements.push({
          type: "question",
          content: question.content,
          position: { x: 0, y: 50 + index * 20, width: 100, height: 15 },
          pageNumber: 1,
        });
      });
    }

    return elements;
  }

  /**
   * Create fallback analysis for when Gemini fails
   */
  private createFallbackAnalysis(
    request: GeminiAnalysisRequest
  ): ProcessingResult {
    console.log("🔄 Creating fallback analysis...");

    return {
      success: true,
      processingTime: 0,
      warnings: ["AI analysis unavailable, using basic extraction"],
      errors: [],
      extractedQuestions: [],
      documentStructure: {
        type: request.documentType || "general",
        subject: "Document Analysis",
        confidence: 0.1,
        sections: [
          {
            id: "fallback_section_1",
            type: "content",
            content:
              "Content extraction unavailable. Please review document manually.",
            position: { page: 1, x: 0, y: 0, width: 100, height: 100 },
            confidence: 0.1,
          },
        ],
      },
      extractedContent: {
        title: "Document (Analysis Unavailable)",
        subtitle: "Please review content manually",
      },
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
export function getPDFProcessor(
  config?: Partial<PDFProcessorConfig>
): PDFProcessor {
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

/**
 * Export utility function for easier usage with Vietnamese support
 */
export async function processDocumentWithVietnameseSupport(
  file: File,
  brandKit: BrandKit,
  analysisResult: GeminiAnalysisResponse
): Promise<{
  success: boolean;
  brandedPdf?: Uint8Array;
  error?: string;
  vietnameseStats?: {
    hasVietnamese: boolean;
    vietnameseTextCount: number;
    fontUsed: string;
  };
}> {
  try {
    const processor = new PDFProcessor();
    const result = await processor.processVietnameseContent(
      file,
      brandKit,
      analysisResult
    );

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Simplified function for document processing with branding
 * Provides backward compatibility with legacy interfaces
 */
export async function processDocumentWithBranding(
  file: File,
  brandKit: BrandKit,
  analysisResult: GeminiAnalysisResponse
): Promise<{
  success: boolean;
  brandedPdf?: Uint8Array;
  error?: string;
}> {
  try {
    const processor = new PDFProcessor();
    const result = await processor.processDocument(
      file,
      brandKit,
      analysisResult
    );

    return {
      success: true,
      brandedPdf: result.brandedPdf,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
