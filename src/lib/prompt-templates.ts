// CREATED: 2025-07-03 - Structured prompts for educational document analysis

import { DocumentStructure, ExtractedQuestion, GeminiAnalysisResponse } from '@/types/gemini';

export class PromptTemplates {
  /**
   * Generate structured prompt for educational document analysis
   */
  static generateEducationalPrompt(language: 'en' | 'vi', documentType: 'quiz' | 'worksheet' | 'general'): string {
    const basePrompt = language === 'vi' ? this.getVietnamesePrompt() : this.getEnglishPrompt();
    const typeSpecific = this.getTypeSpecificInstructions(documentType, language);
    
    return `${basePrompt}\n\n${typeSpecific}\n\n${this.getStructuredOutputInstructions(language)}`;
  }

  /**
   * English base prompt for document analysis
   */
  private static getEnglishPrompt(): string {
    return `You are an expert educational document analyzer. Your task is to carefully extract and structure content from educational PDFs while preserving accuracy and formatting.

CORE PRINCIPLES:
1. ACCURACY IS PARAMOUNT - Never change, modify, or interpret the original content
2. Preserve exact wording, numbers, and formatting
3. Maintain the original structure and order
4. If uncertain about text, mark it clearly as "UNCLEAR" rather than guessing

ANALYSIS TASKS:
1. Extract document title, subject, and metadata
2. Identify and categorize all sections (headers, questions, instructions, content)
3. Parse questions with their numbers, content, and answer choices
4. Maintain original formatting cues (bold, italic, alignment)
5. Track page numbers and content order`;
  }

  /**
   * Vietnamese base prompt for document analysis
   */
  private static getVietnamesePrompt(): string {
    return `Bạn là chuyên gia phân tích tài liệu giáo dục. Nhiệm vụ của bạn là trích xuất và cấu trúc nội dung từ PDF giáo dục một cách chính xác, không thay đổi nội dung gốc.

NGUYÊN TẮC CỐT LÕI:
1. ĐỘ CHÍNH XÁC LÀ QUAN TRỌNG NHẤT - Không bao giờ thay đổi, sửa đổi hoặc diễn giải nội dung gốc
2. Giữ nguyên từng từ, số liệu và định dạng
3. Duy trì cấu trúc và thứ tự ban đầu
4. Nếu không chắc chắn về văn bản, đánh dấu rõ là "KHÔNG RÕ" thay vì đoán

NHIỆM VỤ PHÂN TÍCH:
1. Trích xuất tiêu đề, môn học và metadata của tài liệu
2. Xác định và phân loại tất cả các phần (tiêu đề, câu hỏi, hướng dẫn, nội dung)
3. Phân tích câu hỏi với số thứ tự, nội dung và các lựa chọn trả lời
4. Duy trì các dấu hiệu định dạng gốc (đậm, nghiêng, căn chỉnh)
5. Theo dõi số trang và thứ tự nội dung`;
  }

  /**
   * Document type specific instructions
   */
  private static getTypeSpecificInstructions(documentType: 'quiz' | 'worksheet' | 'general', language: 'en' | 'vi'): string {
    const instructions = {
      en: {
        quiz: `QUIZ DOCUMENT SPECIFIC:
- Focus on identifying numbered questions (1, 2, 3... or Question 1, Question 2...)
- Extract multiple choice options (A, B, C, D or a, b, c, d)
- Identify correct answers if marked
- Note point values and difficulty indicators
- Preserve question numbering exactly as shown`,
        
        worksheet: `WORKSHEET SPECIFIC:
- Identify exercise sections and practice problems
- Extract instructions for each section
- Note fill-in-the-blank patterns (___, [blank], etc.)
- Identify example problems and their solutions
- Preserve formatting of mathematical expressions`,
        
        general: `GENERAL DOCUMENT:
- Extract all text content systematically
- Identify main sections and subsections
- Note any special formatting or emphasis
- Preserve table structures and lists
- Maintain content hierarchy`
      },
      vi: {
        quiz: `ĐẶC THÙ TÀI LIỆU TRẮC NGHIỆM:
- Tập trung xác định câu hỏi có đánh số (1, 2, 3... hoặc Câu 1, Câu 2...)
- Trích xuất các lựa chọn trắc nghiệm (A, B, C, D hoặc a, b, c, d)
- Xác định đáp án đúng nếu có đánh dấu
- Ghi chú điểm số và mức độ khó
- Giữ nguyên cách đánh số câu hỏi như trong tài liệu`,
        
        worksheet: `ĐẶC THÙ TÀI LIỆU BÀI TẬP:
- Xác định các phần bài tập và bài luyện tập
- Trích xuất hướng dẫn cho từng phần
- Ghi chú các ô trống (_____, [trống], v.v.)
- Xác định bài mẫu và lời giải
- Giữ nguyên định dạng biểu thức toán học`,
        
        general: `TÀI LIỆU TỔNG QUÁT:
- Trích xuất toàn bộ nội dung văn bản có hệ thống
- Xác định các phần chính và phần phụ
- Ghi chú định dạng đặc biệt hoặc nhấn mạnh
- Giữ nguyên cấu trúc bảng và danh sách
- Duy trì thứ bậc nội dung`
      }
    };

    return instructions[language][documentType];
  }

  /**
   * Structured output instructions with JSON schema
   */
  private static getStructuredOutputInstructions(language: 'en' | 'vi'): string {
    const instruction = language === 'vi' 
      ? 'Trả về kết quả theo định dạng JSON chính xác sau:'
      : 'Return the results in the following exact JSON format:';

    return `${instruction}

{
  "success": true,
  "documentStructure": {
    "title": "extracted document title",
    "subject": "subject or topic if identifiable",
    "sections": [
      {
        "id": "unique_section_id",
        "type": "header|question|answer|instruction|content",
        "content": "exact text content",
        "position": {
          "page": 1,
          "order": 1
        },
        "formatting": {
          "isBold": false,
          "isItalic": false,
          "fontSize": "normal|large|small",
          "alignment": "left|center|right"
        }
      }
    ],
    "metadata": {
      "totalPages": 1,
      "language": "en|vi",
      "documentType": "quiz|worksheet|general",
      "extractionConfidence": 0.95,
      "questionsCount": 0,
      "sectionsCount": 1
    }
  },
  "extractedQuestions": [
    {
      "id": "q1",
      "number": "1",
      "content": "exact question text",
      "type": "multiple_choice|short_answer|essay|fill_blank|true_false",
      "options": ["A. option 1", "B. option 2"],
      "correctAnswer": "A",
      "points": 1,
      "difficulty": "easy|medium|hard"
    }
  ],
  "extractedContent": {
    "title": "document title",
    "subtitle": "subtitle if any",
    "instructions": ["instruction 1", "instruction 2"],
    "rawText": "complete extracted text"
  },
  "processingInfo": {
    "model": "gemini-2.0-flash",
    "confidence": 0.95
  }
}

CRITICAL RULES:
1. Use EXACT text from the document - no paraphrasing
2. If text is unclear, use "UNCLEAR: [best attempt]"
3. Preserve all numbers, symbols, and formatting
4. Maintain original language (don't translate)
5. Return valid JSON only - no additional text`;
  }

  /**
   * Generate prompt for specific PDF analysis
   */
  static generateAnalysisPrompt(
    documentType: 'quiz' | 'worksheet' | 'general',
    language: 'en' | 'vi' = 'en',
    additionalInstructions?: string
  ): string {
    const basePrompt = this.generateEducationalPrompt(language, documentType);
    
    if (additionalInstructions) {
      return `${basePrompt}\n\nADDITIONAL INSTRUCTIONS:\n${additionalInstructions}`;
    }
    
    return basePrompt;
  }

  /**
   * Generate JSON schema for structured output
   */
  static getResponseSchema(): object {
    return {
      type: "object",
      properties: {
        success: { type: "boolean" },
        documentStructure: {
          type: "object",
          properties: {
            title: { type: "string" },
            subject: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string", enum: ["header", "question", "answer", "instruction", "content"] },
                  content: { type: "string" },
                  position: {
                    type: "object",
                    properties: {
                      page: { type: "number" },
                      order: { type: "number" }
                    },
                    required: ["page", "order"]
                  },
                  formatting: {
                    type: "object",
                    properties: {
                      isBold: { type: "boolean" },
                      isItalic: { type: "boolean" },
                      fontSize: { type: "string" },
                      alignment: { type: "string" }
                    }
                  }
                },
                required: ["id", "type", "content", "position"]
              }
            },
            metadata: {
              type: "object",
              properties: {
                totalPages: { type: "number" },
                language: { type: "string" },
                documentType: { type: "string" },
                extractionConfidence: { type: "number" },
                questionsCount: { type: "number" },
                sectionsCount: { type: "number" }
              },
              required: ["totalPages", "language", "documentType", "extractionConfidence", "sectionsCount"]
            }
          },
          required: ["title", "sections", "metadata"]
        },
        extractedQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              number: { type: "string" },
              content: { type: "string" },
              type: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              correctAnswer: { type: "string" },
              points: { type: "number" },
              difficulty: { type: "string" }
            },
            required: ["id", "number", "content", "type"]
          }
        },
        extractedContent: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            instructions: { type: "array", items: { type: "string" } },
            rawText: { type: "string" }
          },
          required: ["title", "rawText"]
        },
        processingInfo: {
          type: "object",
          properties: {
            model: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["model", "confidence"]
        }
      },
      required: ["success", "documentStructure", "extractedQuestions", "extractedContent", "processingInfo"]
    };
  }
}