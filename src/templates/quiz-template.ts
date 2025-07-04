// CREATED: 2025-07-04 - Pre-built quiz document template

import { EducationalTemplate } from "@/types/pdfme-extensions";
import { BLANK_PDF } from "@pdfme/common";

/**
 * Quiz template for multiple choice and mixed question types
 */
export const quizTemplate: EducationalTemplate = {
  basePdf: BLANK_PDF,
  schemas: [
    [
      // Page 1 - Quiz Header and Instructions
      {
        type: "text",
        name: "quiz_title",
        content: "{{quiz.title}}",
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 18,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "quiz_subtitle",
        content: "{{quiz.subject}} - {{quiz.chapter}}",
        position: { x: 20, y: 40 },
        width: 170,
        height: 10,
        fontSize: 12,
        fontColor: "#6b7280",
        fontName: "Arial",
      },
      {
        type: "instructionBox",
        name: "instructions",
        content: "{{quiz.instructions}}",
        position: { x: 20, y: 55 },
        width: 170,
        height: 25,
        fontSize: 10,
        fontColor: "#374151",
        boxStyle: "simple",
        backgroundColor: "#f3f4f6",
      },

      // Student Information Section
      {
        type: "text",
        name: "student_name_label",
        content: "Name:",
        position: { x: 20, y: 90 },
        width: 20,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "student_name_field",
        content: "{{student.name}}",
        position: { x: 45, y: 90 },
        width: 60,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
      },
      {
        type: "line",
        name: "name_underline",
        position: { x: 45, y: 98 },
        width: 60,
        height: 1,
        color: "#9ca3af",
      },

      {
        type: "text",
        name: "student_id_label",
        content: "Student ID:",
        position: { x: 115, y: 90 },
        width: 25,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "student_id_field",
        content: "{{student.id}}",
        position: { x: 145, y: 90 },
        width: 35,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
      },
      {
        type: "line",
        name: "id_underline",
        position: { x: 145, y: 98 },
        width: 35,
        height: 1,
        color: "#9ca3af",
      },

      {
        type: "text",
        name: "date_label",
        content: "Date:",
        position: { x: 20, y: 105 },
        width: 15,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "date_field",
        content: "{{quiz.date}}",
        position: { x: 40, y: 105 },
        width: 30,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
      },
      {
        type: "line",
        name: "date_underline",
        position: { x: 40, y: 113 },
        width: 30,
        height: 1,
        color: "#9ca3af",
      },

      {
        type: "text",
        name: "time_limit_label",
        content: "Time Limit:",
        position: { x: 80, y: 105 },
        width: 25,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "time_limit_field",
        content: "{{quiz.timeLimit}} minutes",
        position: { x: 110, y: 105 },
        width: 30,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
      },

      {
        type: "text",
        name: "total_points_label",
        content: "Total Points:",
        position: { x: 150, y: 105 },
        width: 25,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "total_points_field",
        content: "{{quiz.totalPoints}}",
        position: { x: 180, y: 105 },
        width: 15,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
      },

      // Question 1 - Multiple Choice
      {
        type: "text",
        name: "question_1_number",
        content: "1.",
        position: { x: 20, y: 130 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "multipleChoice",
        name: "question_1",
        content: "{{questions.q1.text}}",
        position: { x: 30, y: 130 },
        width: 160,
        height: 35,
        fontSize: 11,
        fontColor: "#1f2937",
        options: [
          "{{questions.q1.options.0}}",
          "{{questions.q1.options.1}}",
          "{{questions.q1.options.2}}",
          "{{questions.q1.options.3}}",
        ],
        correctAnswer: "{{questions.q1.correctAnswer}}",
        points: 2,
      },

      // Question 2 - Multiple Choice
      {
        type: "text",
        name: "question_2_number",
        content: "2.",
        position: { x: 20, y: 175 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "multipleChoice",
        name: "question_2",
        content: "{{questions.q2.text}}",
        position: { x: 30, y: 175 },
        width: 160,
        height: 35,
        fontSize: 11,
        fontColor: "#1f2937",
        options: [
          "{{questions.q2.options.0}}",
          "{{questions.q2.options.1}}",
          "{{questions.q2.options.2}}",
          "{{questions.q2.options.3}}",
        ],
        correctAnswer: "{{questions.q2.correctAnswer}}",
        points: 2,
      },

      // Question 3 - True/False
      {
        type: "text",
        name: "question_3_number",
        content: "3.",
        position: { x: 20, y: 220 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "trueFalse",
        name: "question_3",
        content: "{{questions.q3.text}}",
        position: { x: 30, y: 220 },
        width: 160,
        height: 20,
        fontSize: 11,
        fontColor: "#1f2937",
        correctAnswer: "{{questions.q3.correctAnswer}}",
        points: 1,
      },

      // Question 4 - True/False
      {
        type: "text",
        name: "question_4_number",
        content: "4.",
        position: { x: 20, y: 250 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "trueFalse",
        name: "question_4",
        content: "{{questions.q4.text}}",
        position: { x: 30, y: 250 },
        width: 160,
        height: 20,
        fontSize: 11,
        fontColor: "#1f2937",
        correctAnswer: "{{questions.q4.correctAnswer}}",
        points: 1,
      },
    ],
    [
      // Page 2 - Additional Questions
      {
        type: "text",
        name: "page_2_header",
        content: "{{quiz.title}} - Page 2",
        position: { x: 20, y: 20 },
        width: 170,
        height: 12,
        fontSize: 12,
        fontColor: "#6b7280",
        fontName: "Arial",
      },

      // Question 5 - Short Answer
      {
        type: "text",
        name: "question_5_number",
        content: "5.",
        position: { x: 20, y: 40 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "shortAnswer",
        name: "question_5",
        content: "{{questions.q5.text}}",
        position: { x: 30, y: 40 },
        width: 160,
        height: 25,
        fontSize: 11,
        fontColor: "#1f2937",
        maxLength: 100,
        points: 3,
      },

      // Question 6 - Short Answer
      {
        type: "text",
        name: "question_6_number",
        content: "6.",
        position: { x: 20, y: 75 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "shortAnswer",
        name: "question_6",
        content: "{{questions.q6.text}}",
        position: { x: 30, y: 75 },
        width: 160,
        height: 25,
        fontSize: 11,
        fontColor: "#1f2937",
        maxLength: 100,
        points: 3,
      },

      // Question 7 - Essay
      {
        type: "text",
        name: "question_7_number",
        content: "7.",
        position: { x: 20, y: 110 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "essay",
        name: "question_7",
        content: "{{questions.q7.text}}",
        position: { x: 30, y: 110 },
        width: 160,
        height: 60,
        fontSize: 11,
        fontColor: "#1f2937",
        wordLimit: 200,
        points: 5,
      },

      // Question 8 - Essay
      {
        type: "text",
        name: "question_8_number",
        content: "8.",
        position: { x: 20, y: 180 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "essay",
        name: "question_8",
        content: "{{questions.q8.text}}",
        position: { x: 30, y: 180 },
        width: 160,
        height: 60,
        fontSize: 11,
        fontColor: "#1f2937",
        wordLimit: 200,
        points: 5,
      },

      // Footer
      {
        type: "text",
        name: "footer",
        content: "End of Quiz - Please review your answers before submitting",
        position: { x: 20, y: 270 },
        width: 170,
        height: 8,
        fontSize: 9,
        fontColor: "#6b7280",
        fontName: "Arial-Italic",
      },
    ],
  ],

  // Educational metadata
  educational: {
    category: "quiz",
    metadata: {
      gradeLevel: "high-school",
      subject: "General",
      timeLimit: 45,
      totalPoints: 22,
      passingScore: 70,
      instructions:
        "Read each question carefully and select the best answer. For essay questions, write clearly and concisely.",
      learningObjectives: [
        "Demonstrate understanding of key concepts",
        "Apply knowledge to solve problems",
        "Analyze and evaluate information",
        "Communicate ideas effectively in writing",
      ],
      standards: ["Common Core", "State Standards"],
      keywords: ["assessment", "evaluation", "knowledge check"],
      difficulty: "intermediate",
      language: "en",
      accessibility: {
        largeText: false,
        highContrast: false,
        screenReader: true,
      },
    },
  },
};

/**
 * Sample data for quiz template
 */
export const quizSampleData = {
  quiz: {
    title: "Biology Chapter 5 Quiz",
    subject: "Biology",
    chapter: "Cell Structure and Function",
    instructions:
      "Read each question carefully and select the best answer. For essay questions, write clearly and concisely. You have 45 minutes to complete this quiz.",
    date: "2025-07-04",
    timeLimit: 45,
    totalPoints: 22,
  },
  student: {
    name: "John Smith",
    id: "STU12345",
  },
  questions: {
    q1: {
      text: "Which organelle is responsible for protein synthesis in eukaryotic cells?",
      options: [
        "Mitochondria",
        "Ribosomes",
        "Golgi apparatus",
        "Endoplasmic reticulum",
      ],
      correctAnswer: "Ribosomes",
    },
    q2: {
      text: "What is the primary function of the cell membrane?",
      options: [
        "Energy production",
        "Protein synthesis",
        "Selective permeability",
        "DNA storage",
      ],
      correctAnswer: "Selective permeability",
    },
    q3: {
      text: "Plant cells have cell walls while animal cells do not.",
      correctAnswer: true,
    },
    q4: {
      text: "Mitochondria are found only in plant cells.",
      correctAnswer: false,
    },
    q5: {
      text: "Name the process by which cells obtain energy from glucose.",
    },
    q6: {
      text: "What is the difference between prokaryotic and eukaryotic cells?",
    },
    q7: {
      text: "Explain the role of the nucleus in cellular function and describe its key components.",
    },
    q8: {
      text: "Describe how the structure of mitochondria relates to their function in cellular respiration.",
    },
  },
};

/**
 * Quiz template metadata
 */
export const quizTemplateMetadata = {
  id: "quiz_basic_template",
  name: "Basic Quiz Template",
  description:
    "A comprehensive quiz template with multiple choice, true/false, short answer, and essay questions",
  category: "quiz" as const,
  tags: ["quiz", "assessment", "mixed-questions", "education"],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: "1.0.0",
  author: "DocuBrand System",
  thumbnail: undefined,
};

/**
 * Complete quiz template definition
 */
export const quizTemplateDefinition = {
  metadata: quizTemplateMetadata,
  template: quizTemplate,
  dataBindings: [], // Will be generated automatically
  sampleData: quizSampleData,
  previewData: quizSampleData,
};

/**
 * Advanced quiz template with additional features
 */
export const advancedQuizTemplate: EducationalTemplate = {
  basePdf: BLANK_PDF,
  schemas: [
    [
      // Enhanced header with logo space
      {
        type: "image",
        name: "school_logo",
        content: "{{school.logo}}",
        position: { x: 20, y: 10 },
        width: 25,
        height: 25,
      },
      {
        type: "text",
        name: "school_name",
        content: "{{school.name}}",
        position: { x: 50, y: 15 },
        width: 140,
        height: 10,
        fontSize: 12,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "department",
        content: "{{school.department}}",
        position: { x: 50, y: 25 },
        width: 140,
        height: 8,
        fontSize: 10,
        fontColor: "#6b7280",
      },

      {
        type: "text",
        name: "quiz_title",
        content: "{{quiz.title}}",
        position: { x: 20, y: 45 },
        width: 170,
        height: 15,
        fontSize: 16,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "quiz_code",
        content: "Quiz Code: {{quiz.code}}",
        position: { x: 20, y: 60 },
        width: 80,
        height: 8,
        fontSize: 10,
        fontColor: "#6b7280",
      },
      {
        type: "text",
        name: "semester",
        content: "Semester: {{quiz.semester}}",
        position: { x: 110, y: 60 },
        width: 80,
        height: 8,
        fontSize: 10,
        fontColor: "#6b7280",
      },

      // Enhanced instruction box
      {
        type: "instructionBox",
        name: "detailed_instructions",
        content: "{{quiz.detailedInstructions}}",
        position: { x: 20, y: 75 },
        width: 170,
        height: 30,
        fontSize: 9,
        fontColor: "#374151",
        boxStyle: "double",
        backgroundColor: "#f9fafb",
      },

      // Enhanced student information with barcode space
      {
        type: "rectangle",
        name: "student_info_box",
        position: { x: 15, y: 110 },
        width: 180,
        height: 25,
        color: "transparent",
        borderWidth: 1,
        borderColor: "#d1d5db",
      },

      // Student information grid
      {
        type: "text",
        name: "student_name_label",
        content: "Student Name:",
        position: { x: 20, y: 115 },
        width: 30,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "student_name_field",
        content: "{{student.name}}",
        position: { x: 55, y: 115 },
        width: 60,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
      },

      {
        type: "text",
        name: "student_id_label",
        content: "Student ID:",
        position: { x: 125, y: 115 },
        width: 25,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "student_id_field",
        content: "{{student.id}}",
        position: { x: 155, y: 115 },
        width: 30,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
      },

      {
        type: "text",
        name: "class_section_label",
        content: "Class/Section:",
        position: { x: 20, y: 125 },
        width: 30,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "class_section_field",
        content: "{{student.classSection}}",
        position: { x: 55, y: 125 },
        width: 40,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
      },

      {
        type: "text",
        name: "exam_date_label",
        content: "Date:",
        position: { x: 105, y: 125 },
        width: 15,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "exam_date_field",
        content: "{{quiz.date}}",
        position: { x: 125, y: 125 },
        width: 25,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
      },

      {
        type: "text",
        name: "duration_label",
        content: "Duration:",
        position: { x: 155, y: 125 },
        width: 20,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "duration_field",
        content: "{{quiz.timeLimit}} min",
        position: { x: 180, y: 125 },
        width: 20,
        height: 6,
        fontSize: 9,
        fontColor: "#1f2937",
      },

      // Question numbering and scoring grid
      {
        type: "text",
        name: "scoring_header",
        content: "Scoring Guide:",
        position: { x: 20, y: 145 },
        width: 30,
        height: 8,
        fontSize: 10,
        fontColor: "#1f2937",
        fontName: "Arial-Bold",
      },
      {
        type: "text",
        name: "scoring_breakdown",
        content:
          "Multiple Choice (1-4): 2 pts each | True/False (5-8): 1 pt each | Short Answer (9-10): 3 pts each | Essay (11-12): 5 pts each",
        position: { x: 20, y: 155 },
        width: 170,
        height: 6,
        fontSize: 8,
        fontColor: "#6b7280",
      },

      // Questions start here with better spacing
      // [Additional questions would follow the same pattern as the basic template but with enhanced formatting]
    ],
  ],

  educational: {
    category: "quiz",
    metadata: {
      gradeLevel: "college",
      subject: "Advanced Biology",
      timeLimit: 90,
      totalPoints: 30,
      passingScore: 75,
      instructions:
        "This is a comprehensive assessment covering multiple topics. Read all instructions carefully.",
      learningObjectives: [
        "Demonstrate mastery of advanced biological concepts",
        "Apply theoretical knowledge to practical scenarios",
        "Analyze complex biological processes",
        "Synthesize information from multiple sources",
      ],
      standards: ["Advanced Placement", "College Level"],
      keywords: ["comprehensive", "assessment", "advanced", "biology"],
      difficulty: "advanced",
      language: "en",
      accessibility: {
        largeText: true,
        highContrast: false,
        screenReader: true,
      },
    },
  },
};

export default quizTemplate;
