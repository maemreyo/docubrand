// UPDATED: 2025-07-03 - Advanced prompts with content type detection

import { ContentType } from '@/types/editor';
import { QuestionType } from '@/types/gemini';

/**
 * Prompt input parameters
 */
export interface PromptInput {
  documentType: string;
  language: string;
  detailLevel: 'minimal' | 'standard' | 'detailed';
  focusAreas: string[];
  extractQuestions: boolean;
  extractSections: boolean;
  extractMetadata: boolean;
  questionTypes: QuestionType[];
  contentTypes: ContentType[];
}

/**
 * System prompts for different languages
 */
const SYSTEM_PROMPTS = {
  en: {
    role: "You are an expert educational content analyst specializing in document processing and content extraction.",
    expertise: "You excel at analyzing PDFs of educational materials and extracting structured information with high accuracy.",
    output: "Always respond with valid JSON format and maintain educational content standards."
  },
  vi: {
    role: "Bạn là chuyên gia phân tích nội dung giáo dục chuyên về xử lý tài liệu và trích xuất nội dung.",
    expertise: "Bạn xuất sắc trong việc phân tích file PDF của tài liệu giáo dục và trích xuất thông tin có cấu trúc với độ chính xác cao.",
    output: "Luôn phản hồi với định dạng JSON hợp lệ và duy trì tiêu chuẩn nội dung giáo dục."
  }
};

/**
 * Document type specific instructions
 */
const DOCUMENT_TYPE_INSTRUCTIONS = {
  quiz: {
    en: {
      focus: "Focus on extracting questions, answer choices, correct answers, and scoring rubrics.",
      structure: "Identify question types (multiple choice, true/false, short answer, essay) and organize systematically.",
      quality: "Ensure each question has clear wording and appropriate difficulty level."
    },
    vi: {
      focus: "Tập trung vào trích xuất câu hỏi, lựa chọn đáp án, đáp án đúng và thang điểm.",
      structure: "Xác định loại câu hỏi (trắc nghiệm, đúng/sai, câu trả lời ngắn, luận) và tổ chức có hệ thống.",
      quality: "Đảm bảo mỗi câu hỏi có từ ngữ rõ ràng và mức độ khó phù hợp."
    }
  },
  worksheet: {
    en: {
      focus: "Extract exercises, instructions, learning objectives, and practice problems.",
      structure: "Organize content by sections, topics, and skill levels.",
      quality: "Maintain educational progression and clear learning paths."
    },
    vi: {
      focus: "Trích xuất bài tập, hướng dẫn, mục tiêu học tập và bài luyện tập.",
      structure: "Tổ chức nội dung theo phần, chủ đề và mức độ kỹ năng.",
      quality: "Duy trì sự tiến bộ giáo dục và con đường học tập rõ ràng."
    }
  },
  exam: {
    en: {
      focus: "Prioritize formal assessment structure, time limits, and grading criteria.",
      structure: "Extract sections, question weighting, and instruction clarity.",
      quality: "Ensure academic rigor and fair assessment standards."
    },
    vi: {
      focus: "Ưu tiên cấu trúc đánh giá chính thức, giới hạn thời gian và tiêu chí chấm điểm.",
      structure: "Trích xuất các phần, trọng số câu hỏi và sự rõ ràng của hướng dẫn.",
      quality: "Đảm bảo tính nghiêm ngặt học thuật và tiêu chuẩn đánh giá công bằng."
    }
  },
  general: {
    en: {
      focus: "Extract main content, identify structure, and preserve educational value.",
      structure: "Organize by logical sections and maintain content hierarchy.",
      quality: "Focus on clarity and educational effectiveness."
    },
    vi: {
      focus: "Trích xuất nội dung chính, xác định cấu trúc và bảo tồn giá trị giáo dục.",
      structure: "Tổ chức theo các phần logic và duy trì thứ bậc nội dung.",
      quality: "Tập trung vào sự rõ ràng và hiệu quả giáo dục."
    }
  }
};

/**
 * Content type detection patterns
 */
const CONTENT_TYPE_PATTERNS = {
  question: [
    "Questions that start with: What, How, Why, When, Where, Which, Who",
    "Content with A), B), C), D) options",
    "True/False statements",
    "Fill-in-the-blank exercises",
    "Essay prompts and open-ended questions"
  ],
  header: [
    "Section titles and chapter headings",
    "Large text that introduces new topics",
    "Numbered sections (1., 2., 3.)",
    "Centered or emphasized text",
    "Content that appears to organize other sections"
  ],
  instruction: [
    "Text starting with: Read, Write, Complete, Solve, Answer, Choose",
    "Directions for students",
    "Guidelines and procedures",
    "Step-by-step instructions",
    "Requirements and expectations"
  ],
  rich: [
    "Content with bold, italic, or underlined text",
    "Mixed formatting and emphasis",
    "Complex text layouts",
    "Content with inline formatting"
  ],
  markdown: [
    "Content with # headers",
    "Text with **bold** and *italic* markers",
    "Lists with - or * bullets",
    "Code blocks with ``` markers"
  ],
  code: [
    "Programming code snippets",
    "Function definitions",
    "Variable declarations",
    "Code examples and syntax"
  ],
  list: [
    "Bulleted or numbered lists",
    "Sequential items",
    "Enumerated content",
    "Step-by-step procedures"
  ]
};

/**
 * JSON schema for response structure
 */
const RESPONSE_SCHEMA = {
  type: "object",
  required: ["documentStructure", "extractedQuestions", "extractedContent"],
  properties: {
    documentStructure: {
      type: "object",
      properties: {
        type: { type: "string" },
        subject: { type: "string" },
        difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string" },
              content: { type: "string" },
              position: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" }
                }
              },
              confidence: { type: "number", minimum: 0, maximum: 1 }
            }
          }
        }
      }
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
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    extractedContent: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        author: { type: "string" },
        date: { type: "string" },
        course: { type: "string" },
        instructions: { type: "string" }
      }
    }
  }
};

/**
 * Generate comprehensive prompt for document analysis
 */
export function getPromptTemplate(input: PromptInput): string {
  const { language, documentType, detailLevel, focusAreas } = input;
  const lang = language === 'vi' ? 'vi' : 'en';
  const systemPrompt = SYSTEM_PROMPTS[lang];
  const docInstructions = DOCUMENT_TYPE_INSTRUCTIONS[documentType as keyof typeof DOCUMENT_TYPE_INSTRUCTIONS]?.[lang] || 
                         DOCUMENT_TYPE_INSTRUCTIONS.general[lang];

  const prompt = `${systemPrompt.role} ${systemPrompt.expertise} ${systemPrompt.output}

## ANALYSIS TASK
Analyze the provided PDF document and extract structured educational content.

## DOCUMENT TYPE: ${documentType.toUpperCase()}
${docInstructions.focus}
${docInstructions.structure}
${docInstructions.quality}

## ANALYSIS REQUIREMENTS

### Content Type Detection
Identify and classify content using these patterns:
${Object.entries(CONTENT_TYPE_PATTERNS).map(([type, patterns]) => 
  `**${type.toUpperCase()}:**\n${patterns.map(p => `- ${p}`).join('\n')}`
).join('\n\n')}

### Extraction Guidelines
${input.extractQuestions ? '✅ EXTRACT QUESTIONS: Extract all questions with proper classification' : '❌ Skip question extraction'}
${input.extractSections ? '✅ EXTRACT SECTIONS: Extract and organize content sections' : '❌ Skip section extraction'}
${input.extractMetadata ? '✅ EXTRACT METADATA: Extract document metadata and properties' : '❌ Skip metadata extraction'}

### Question Types to Focus On:
${input.questionTypes.map(type => `- ${type.replace('_', ' ')}`).join('\n')}

### Content Types to Identify:
${input.contentTypes.map(type => `- ${type}`).join('\n')}

### Detail Level: ${detailLevel.toUpperCase()}
${getDetailLevelInstructions(detailLevel, lang)}

### Focus Areas: ${focusAreas.join(', ').toUpperCase()}
${getFocusAreaInstructions(focusAreas, lang)}

## OUTPUT FORMAT
Respond with ONLY valid JSON matching this exact structure:

\`\`\`json
{
  "documentStructure": {
    "type": "${documentType}",
    "subject": "detected subject area",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedTime": number_in_minutes,
    "confidence": 0.0_to_1.0,
    "sections": [
      {
        "id": "section_unique_id",
        "type": "detected_content_type",
        "content": "extracted_and_cleaned_content",
        "position": {
          "page": page_number,
          "x": x_coordinate,
          "y": y_coordinate,
          "width": width_percentage,
          "height": height_percentage
        },
        "confidence": 0.0_to_1.0,
        "semanticRole": "title|subtitle|header|instruction|content|note|reference",
        "level": heading_level_if_applicable
      }
    ],
    "metadata": {
      "totalPages": number,
      "language": "detected_language",
      "documentType": "${documentType}",
      "extractionConfidence": 0.0_to_1.0,
      "questionsCount": number,
      "sectionsCount": number
    }
  },
  "extractedQuestions": [
    {
      "id": "question_unique_id",
      "number": "question_number_or_label",
      "content": "question_text_cleaned",
      "type": "multiple_choice|short_answer|essay|true_false|fill_blank",
      "options": ["option_a", "option_b", "option_c", "option_d"],
      "correctAnswer": "correct_answer_if_available",
      "points": points_value,
      "difficulty": "easy|medium|hard",
      "confidence": 0.0_to_1.0,
      "position": {
        "page": page_number,
        "x": x_coordinate,
        "y": y_coordinate,
        "width": width_percentage,
        "height": height_percentage
      }
    }
  ],
  "extractedContent": {
    "title": "document_title",
    "subtitle": "document_subtitle_if_exists",
    "author": "author_if_detected",
    "date": "date_if_detected",
    "course": "course_name_if_detected",
    "instructions": "general_instructions_if_any",
    "keywords": ["keyword1", "keyword2"],
    "learningObjectives": ["objective1", "objective2"],
    "statistics": {
      "wordCount": estimated_word_count,
      "pageCount": total_pages,
      "questionCount": total_questions,
      "sectionCount": total_sections,
      "estimatedReadingTime": minutes,
      "complexityScore": 0.0_to_1.0
    }
  },
  "insights": {
    "contentType": "${documentType}",
    "difficulty": "beginner|intermediate|advanced",
    "completeness": 0.0_to_1.0,
    "suggestions": [
      "improvement_suggestion_1",
      "improvement_suggestion_2"
    ],
    "improvements": [
      {
        "type": "content|structure|formatting|clarity",
        "description": "improvement_description",
        "priority": "low|medium|high",
        "sectionId": "affected_section_id_if_applicable"
      }
    ]
  }
}
\`\`\`

## QUALITY STANDARDS
- Preserve original content exactly as written
- Maintain proper formatting and structure
- Assign confidence scores based on clarity of detection
- Use appropriate content type classifications
- Provide helpful improvement suggestions
- Ensure all extracted text is clean and readable
- Maintain educational context and meaning

## LANGUAGE CONSIDERATIONS
- Analyze content in its original language
- Preserve terminology and technical terms
- Maintain cultural and educational context
- Use appropriate classification for the language

Begin analysis now. Remember: Output ONLY the JSON response, no additional text.`;

  return prompt;
}

/**
 * Get detail level specific instructions
 */
function getDetailLevelInstructions(level: string, language: string): string {
  const instructions = {
    minimal: {
      en: "Extract only essential information. Focus on main content and skip detailed metadata.",
      vi: "Chỉ trích xuất thông tin cần thiết. Tập trung vào nội dung chính và bỏ qua metadata chi tiết."
    },
    standard: {
      en: "Extract comprehensive information including content, structure, and basic metadata.",
      vi: "Trích xuất thông tin toàn diện bao gồm nội dung, cấu trúc và metadata cơ bản."
    },
    detailed: {
      en: "Extract everything possible including fine-grained analysis, suggestions, and comprehensive metadata.",
      vi: "Trích xuất mọi thứ có thể bao gồm phân tích chi tiết, đề xuất và metadata toàn diện."
    }
  };

  return instructions[level as keyof typeof instructions]?.[language as keyof typeof instructions.minimal] || 
         instructions.standard.en;
}

/**
 * Get focus area specific instructions
 */
function getFocusAreaInstructions(areas: string[], language: string): string {
  const areaInstructions = {
    content: {
      en: "Prioritize text extraction and content organization",
      vi: "Ưu tiên trích xuất văn bản và tổ chức nội dung"
    },
    structure: {
      en: "Focus on document hierarchy and section organization",
      vi: "Tập trung vào thứ bậc tài liệu và tổ chức phần"
    },
    questions: {
      en: "Emphasize question detection and classification",
      vi: "Nhấn mạnh phát hiện và phân loại câu hỏi"
    },
    accessibility: {
      en: "Consider accessibility and readability factors",
      vi: "Xem xét các yếu tố khả năng tiếp cận và dễ đọc"
    }
  };

  return areas.map(area => 
    areaInstructions[area as keyof typeof areaInstructions]?.[language as keyof typeof areaInstructions.content] ||
    `Focus on ${area}`
  ).join('; ');
}

/**
 * Validate prompt inputs
 */
export function validatePromptInputs(input: PromptInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate document type
  const validTypes = ['quiz', 'worksheet', 'exam', 'assignment', 'handout', 'general'];
  if (!validTypes.includes(input.documentType)) {
    errors.push(`Invalid document type: ${input.documentType}`);
  }

  // Validate language
  const validLanguages = ['en', 'vi'];
  if (!validLanguages.includes(input.language)) {
    errors.push(`Invalid language: ${input.language}`);
  }

  // Validate detail level
  const validLevels = ['minimal', 'standard', 'detailed'];
  if (!validLevels.includes(input.detailLevel)) {
    errors.push(`Invalid detail level: ${input.detailLevel}`);
  }

  // Validate focus areas
  const validAreas = ['content', 'structure', 'questions', 'accessibility'];
  const invalidAreas = input.focusAreas.filter(area => !validAreas.includes(area));
  if (invalidAreas.length > 0) {
    errors.push(`Invalid focus areas: ${invalidAreas.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get example prompts for testing
 */
export function getExamplePrompts() {
  return {
    quiz_english: getPromptTemplate({
      documentType: 'quiz',
      language: 'en',
      detailLevel: 'standard',
      focusAreas: ['questions', 'content'],
      extractQuestions: true,
      extractSections: true,
      extractMetadata: true,
      questionTypes: ['multiple_choice', 'short_answer', 'essay'],
      contentTypes: ['question', 'instruction', 'header']
    }),
    
    worksheet_vietnamese: getPromptTemplate({
      documentType: 'worksheet',
      language: 'vi',
      detailLevel: 'detailed',
      focusAreas: ['content', 'structure'],
      extractQuestions: true,
      extractSections: true,
      extractMetadata: true,
      questionTypes: ['short_answer', 'fill_blank'],
      contentTypes: ['text', 'instruction', 'list']
    }),
    
    general_minimal: getPromptTemplate({
      documentType: 'general',
      language: 'en',
      detailLevel: 'minimal',
      focusAreas: ['content'],
      extractQuestions: false,
      extractSections: true,
      extractMetadata: false,
      questionTypes: [],
      contentTypes: ['text', 'header']
    })
  };
}