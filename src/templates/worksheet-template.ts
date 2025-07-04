// CREATED: 2025-07-04 - Pre-built worksheet document template

import { EducationalTemplate } from '@/types/pdfme-extensions';
import { BLANK_PDF } from '@pdfme/common';

/**
 * Worksheet template for exercises and practice problems
 */
export const worksheetTemplate: EducationalTemplate = {
  basePdf: BLANK_PDF,
  schemas: [
    [
      // Page 1 - Worksheet Header and Exercises
      {
        type: 'text',
        name: 'worksheet_title',
        content: '{{worksheet.title}}',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 16,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'worksheet_subtitle',
        content: '{{worksheet.subject}} - {{worksheet.topic}}',
        position: { x: 20, y: 38 },
        width: 170,
        height: 10,
        fontSize: 12,
        fontColor: '#6b7280',
        fontName: 'Arial',
      },
      
      // Student Information
      {
        type: 'text',
        name: 'name_label',
        content: 'Name:',
        position: { x: 20, y: 55 },
        width: 15,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'name_field',
        content: '{{student.name}}',
        position: { x: 40, y: 55 },
        width: 50,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'line',
        name: 'name_line',
        position: { x: 40, y: 63 },
        width: 50,
        height: 1,
        color: '#9ca3af',
      },
      
      {
        type: 'text',
        name: 'date_label',
        content: 'Date:',
        position: { x: 100, y: 55 },
        width: 15,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'date_field',
        content: '{{worksheet.date}}',
        position: { x: 120, y: 55 },
        width: 30,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'line',
        name: 'date_line',
        position: { x: 120, y: 63 },
        width: 30,
        height: 1,
        color: '#9ca3af',
      },
      
      {
        type: 'text',
        name: 'class_label',
        content: 'Class:',
        position: { x: 160, y: 55 },
        width: 15,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'class_field',
        content: '{{student.class}}',
        position: { x: 180, y: 55 },
        width: 20,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'line',
        name: 'class_line',
        position: { x: 180, y: 63 },
        width: 20,
        height: 1,
        color: '#9ca3af',
      },
      
      // Instructions Box
      {
        type: 'instructionBox',
        name: 'instructions',
        content: '{{worksheet.instructions}}',
        position: { x: 20, y: 75 },
        width: 170,
        height: 20,
        fontSize: 10,
        fontColor: '#374151',
        boxStyle: 'simple',
        backgroundColor: '#f9fafb',
      },
      
      // Section 1: Vocabulary
      {
        type: 'text',
        name: 'section_1_title',
        content: 'Section 1: {{sections.section1.title}}',
        position: { x: 20, y: 105 },
        width: 170,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'section_1_description',
        content: '{{sections.section1.description}}',
        position: { x: 20, y: 118 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#6b7280',
      },
      
      // Vocabulary Exercise 1
      {
        type: 'text',
        name: 'vocab_1_number',
        content: '1.',
        position: { x: 25, y: 135 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'vocab_1_question',
        content: '{{exercises.vocab1.question}}',
        position: { x: 35, y: 135 },
        width: 100,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'line',
        name: 'vocab_1_answer_line',
        position: { x: 140, y: 143 },
        width: 50,
        height: 1,
        color: '#9ca3af',
      },
      
      // Vocabulary Exercise 2
      {
        type: 'text',
        name: 'vocab_2_number',
        content: '2.',
        position: { x: 25, y: 155 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'vocab_2_question',
        content: '{{exercises.vocab2.question}}',
        position: { x: 35, y: 155 },
        width: 100,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'line',
        name: 'vocab_2_answer_line',
        position: { x: 140, y: 163 },
        width: 50,
        height: 1,
        color: '#9ca3af',
      },
      
      // Vocabulary Exercise 3
      {
        type: 'text',
        name: 'vocab_3_number',
        content: '3.',
        position: { x: 25, y: 175 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'vocab_3_question',
        content: '{{exercises.vocab3.question}}',
        position: { x: 35, y: 175 },
        width: 100,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'line',
        name: 'vocab_3_answer_line',
        position: { x: 140, y: 183 },
        width: 50,
        height: 1,
        color: '#9ca3af',
      },
      
      // Section 2: Problem Solving
      {
        type: 'text',
        name: 'section_2_title',
        content: 'Section 2: {{sections.section2.title}}',
        position: { x: 20, y: 205 },
        width: 170,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'section_2_description',
        content: '{{sections.section2.description}}',
        position: { x: 20, y: 218 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#6b7280',
      },
      
      // Problem 1
      {
        type: 'text',
        name: 'problem_1_number',
        content: '1.',
        position: { x: 25, y: 235 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'problem_1_question',
        content: '{{exercises.problem1.question}}',
        position: { x: 35, y: 235 },
        width: 155,
        height: 16,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'rectangle',
        name: 'problem_1_work_area',
        position: { x: 35, y: 255 },
        width: 155,
        height: 25,
        color: 'transparent',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      {
        type: 'text',
        name: 'problem_1_work_label',
        content: 'Show your work:',
        position: { x: 40, y: 260 },
        width: 40,
        height: 6,
        fontSize: 9,
        fontColor: '#9ca3af',
        fontName: 'Arial-Italic',
      },
    ],
    [
      // Page 2 - Additional Exercises and Activities
      {
        type: 'text',
        name: 'page_2_header',
        content: '{{worksheet.title}} - Page 2',
        position: { x: 20, y: 20 },
        width: 170,
        height: 10,
        fontSize: 12,
        fontColor: '#6b7280',
        fontName: 'Arial',
      },
      
      // Problem 2 (continued from page 1)
      {
        type: 'text',
        name: 'problem_2_number',
        content: '2.',
        position: { x: 25, y: 40 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'problem_2_question',
        content: '{{exercises.problem2.question}}',
        position: { x: 35, y: 40 },
        width: 155,
        height: 16,
        fontSize: 11,
        fontColor: '#1f2937',
      },
      {
        type: 'rectangle',
        name: 'problem_2_work_area',
        position: { x: 35, y: 60 },
        width: 155,
        height: 25,
        color: 'transparent',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      {
        type: 'text',
        name: 'problem_2_work_label',
        content: 'Show your work:',
        position: { x: 40, y: 65 },
        width: 40,
        height: 6,
        fontSize: 9,
        fontColor: '#9ca3af',
        fontName: 'Arial-Italic',
      },
      
      // Section 3: Application
      {
        type: 'text',
        name: 'section_3_title',
        content: 'Section 3: {{sections.section3.title}}',
        position: { x: 20, y: 100 },
        width: 170,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'section_3_description',
        content: '{{sections.section3.description}}',
        position: { x: 20, y: 113 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#6b7280',
      },
      
      // Application Exercise 1
      {
        type: 'text',
        name: 'application_1_number',
        content: '1.',
        position: { x: 25, y: 130 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'shortAnswer',
        name: 'application_1',
        content: '{{exercises.application1.question}}',
        position: { x: 35, y: 130 },
        width: 155,
        height: 30,
        fontSize: 11,
        fontColor: '#1f2937',
        maxLength: 200,
        points: 5,
      },
      
      // Application Exercise 2
      {
        type: 'text',
        name: 'application_2_number',
        content: '2.',
        position: { x: 25, y: 170 },
        width: 8,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'shortAnswer',
        name: 'application_2',
        content: '{{exercises.application2.question}}',
        position: { x: 35, y: 170 },
        width: 155,
        height: 30,
        fontSize: 11,
        fontColor: '#1f2937',
        maxLength: 200,
        points: 5,
      },
      
      // Reflection Section
      {
        type: 'text',
        name: 'reflection_title',
        content: 'Reflection:',
        position: { x: 20, y: 215 },
        width: 30,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'essay',
        name: 'reflection_question',
        content: '{{exercises.reflection.question}}',
        position: { x: 20, y: 230 },
        width: 170,
        height: 40,
        fontSize: 11,
        fontColor: '#1f2937',
        wordLimit: 150,
        points: 5,
      },
      
      // Footer with completion checklist
      {
        type: 'instructionBox',
        name: 'completion_checklist',
        content: '{{worksheet.completionChecklist}}',
        position: { x: 20, y: 275 },
        width: 170,
        height: 15,
        fontSize: 9,
        fontColor: '#374151',
        boxStyle: 'simple',
        backgroundColor: '#f3f4f6',
      },
    ],
  ],
  
  // Educational metadata
  educational: {
    category: 'worksheet',
    metadata: {
      gradeLevel: 'middle-school',
      subject: 'Mathematics',
      timeLimit: 30,
      totalPoints: 15,
      instructions: 'Complete all sections of this worksheet. Show your work for problem-solving questions.',
      learningObjectives: [
        'Apply vocabulary in context',
        'Solve problems step by step',
        'Connect concepts to real-world applications',
        'Reflect on learning process',
      ],
      standards: ['Common Core Math Standards'],
      keywords: ['practice', 'vocabulary', 'problem solving', 'application'],
      difficulty: 'intermediate',
      language: 'en',
      accessibility: {
        largeText: false,
        highContrast: false,
        screenReader: true,
      },
    },
  },
};

/**
 * Sample data for worksheet template
 */
export const worksheetSampleData = {
  worksheet: {
    title: 'Fractions and Decimals Practice',
    subject: 'Mathematics',
    topic: 'Fractions and Decimals',
    date: '2025-07-04',
    instructions: 'Complete all sections of this worksheet. Show your work for problem-solving questions. Use proper mathematical notation.',
    completionChecklist: '✓ Completed all vocabulary questions ✓ Showed work for all problems ✓ Answered application questions ✓ Completed reflection',
  },
  student: {
    name: 'Emily Johnson',
    class: '7A',
  },
  sections: {
    section1: {
      title: 'Vocabulary Review',
      description: 'Define the following terms and provide an example for each.',
    },
    section2: {
      title: 'Problem Solving',
      description: 'Solve the following problems. Show all your work and explain your reasoning.',
    },
    section3: {
      title: 'Real-World Applications',
      description: 'Apply your knowledge to solve real-world scenarios.',
    },
  },
  exercises: {
    vocab1: {
      question: 'Define "equivalent fractions" and give an example:',
    },
    vocab2: {
      question: 'What is a "decimal point" and how is it used?',
    },
    vocab3: {
      question: 'Explain the term "improper fraction" with an example:',
    },
    problem1: {
      question: 'Convert 3/4 to a decimal. Show your division work.',
    },
    problem2: {
      question: 'Find the equivalent fraction for 0.6 in lowest terms.',
    },
    application1: {
      question: 'A recipe calls for 2/3 cup of flour, but you only have a 1/4 cup measuring tool. How many 1/4 cups do you need?',
    },
    application2: {
      question: 'If you scored 17.5 out of 20 points on a test, what fraction of the test did you answer correctly? Express as both a fraction and percentage.',
    },
    reflection: {
      question: 'Which concept from today\'s worksheet do you find most challenging? Explain why and describe a strategy you could use to better understand it.',
    },
  },
};

/**
 * Worksheet template metadata
 */
export const worksheetTemplateMetadata = {
  id: 'worksheet_basic_template',
  name: 'Basic Worksheet Template',
  description: 'A comprehensive worksheet template with vocabulary, problem-solving, and application sections',
  category: 'worksheet' as const,
  tags: ['worksheet', 'practice', 'exercises', 'math'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: '1.0.0',
  author: 'DocuBrand System',
  thumbnail: undefined,
};

/**
 * Complete worksheet template definition
 */
export const worksheetTemplateDefinition = {
  metadata: worksheetTemplateMetadata,
  template: worksheetTemplate,
  dataBindings: [], // Will be generated automatically
  sampleData: worksheetSampleData,
  previewData: worksheetSampleData,
};

/**
 * Science worksheet template variant
 */
export const scienceWorksheetTemplate: EducationalTemplate = {
  basePdf: BLANK_PDF,
  schemas: [
    [
      // Header
      {
        type: 'text',
        name: 'worksheet_title',
        content: '{{worksheet.title}}',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 16,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'lab_number',
        content: 'Lab {{worksheet.labNumber}}: {{worksheet.topic}}',
        position: { x: 20, y: 38 },
        width: 170,
        height: 10,
        fontSize: 12,
        fontColor: '#6b7280',
        fontName: 'Arial',
      },
      
      // Lab partner and date info
      {
        type: 'text',
        name: 'student_name_label',
        content: 'Student:',
        position: { x: 20, y: 55 },
        width: 20,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'line',
        name: 'student_name_line',
        position: { x: 45, y: 63 },
        width: 50,
        height: 1,
        color: '#9ca3af',
      },
      
      {
        type: 'text',
        name: 'partner_label',
        content: 'Lab Partner:',
        position: { x: 105, y: 55 },
        width: 25,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'line',
        name: 'partner_line',
        position: { x: 135, y: 63 },
        width: 55,
        height: 1,
        color: '#9ca3af',
      },
      
      // Hypothesis section
      {
        type: 'text',
        name: 'hypothesis_title',
        content: 'Hypothesis:',
        position: { x: 20, y: 80 },
        width: 30,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'hypothesis_prompt',
        content: '{{worksheet.hypothesisPrompt}}',
        position: { x: 20, y: 95 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#6b7280',
      },
      {
        type: 'rectangle',
        name: 'hypothesis_area',
        position: { x: 20, y: 108 },
        width: 170,
        height: 20,
        color: 'transparent',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      },
      
      // Observations section
      {
        type: 'text',
        name: 'observations_title',
        content: 'Observations:',
        position: { x: 20, y: 140 },
        width: 30,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'table',
        name: 'observations_table',
        content: JSON.stringify([
          ['Time', 'Observation', 'Measurement'],
          ['0 min', '', ''],
          ['5 min', '', ''],
          ['10 min', '', ''],
          ['15 min', '', ''],
        ]),
        position: { x: 20, y: 155 },
        width: 170,
        height: 60,
      },
      
      // Conclusion section
      {
        type: 'text',
        name: 'conclusion_title',
        content: 'Conclusion:',
        position: { x: 20, y: 230 },
        width: 30,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'essay',
        name: 'conclusion_response',
        content: '{{worksheet.conclusionPrompt}}',
        position: { x: 20, y: 245 },
        width: 170,
        height: 40,
        fontSize: 11,
        fontColor: '#1f2937',
        wordLimit: 100,
        points: 10,
      },
    ],
  ],
  
  educational: {
    category: 'worksheet',
    metadata: {
      gradeLevel: 'high-school',
      subject: 'Science',
      timeLimit: 45,
      totalPoints: 10,
      instructions: 'Complete all sections of this lab worksheet. Record your observations carefully and support your conclusion with evidence.',
      learningObjectives: [
        'Form testable hypotheses',
        'Make careful observations',
        'Record data accurately',
        'Draw evidence-based conclusions',
      ],
      standards: ['Next Generation Science Standards'],
      keywords: ['lab', 'experiment', 'hypothesis', 'observation', 'conclusion'],
      difficulty: 'intermediate',
      language: 'en',
    },
  },
};

/**
 * Language arts worksheet template variant
 */
export const languageArtsWorksheetTemplate: EducationalTemplate = {
  basePdf: BLANK_PDF,
  schemas: [
    [
      // Header
      {
        type: 'text',
        name: 'worksheet_title',
        content: '{{worksheet.title}}',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 16,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'reading_selection',
        content: 'Reading Selection: {{worksheet.readingTitle}}',
        position: { x: 20, y: 38 },
        width: 170,
        height: 10,
        fontSize: 12,
        fontColor: '#6b7280',
        fontName: 'Arial',
      },
      
      // Student info
      {
        type: 'text',
        name: 'name_label',
        content: 'Name:',
        position: { x: 20, y: 55 },
        width: 15,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'line',
        name: 'name_line',
        position: { x: 40, y: 63 },
        width: 70,
        height: 1,
        color: '#9ca3af',
      },
      
      {
        type: 'text',
        name: 'date_label',
        content: 'Date:',
        position: { x: 120, y: 55 },
        width: 15,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'line',
        name: 'date_line',
        position: { x: 140, y: 63 },
        width: 50,
        height: 1,
        color: '#9ca3af',
      },
      
      // Vocabulary section
      {
        type: 'text',
        name: 'vocab_title',
        content: 'Vocabulary:',
        position: { x: 20, y: 80 },
        width: 30,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'text',
        name: 'vocab_instructions',
        content: 'Use context clues to determine the meaning of these words from the reading.',
        position: { x: 20, y: 95 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#6b7280',
      },
      
      // Vocabulary exercises (using a simpler layout)
      {
        type: 'text',
        name: 'vocab_word_1',
        content: '1. {{vocabulary.word1}}:',
        position: { x: 25, y: 110 },
        width: 40,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'line',
        name: 'vocab_answer_1',
        position: { x: 70, y: 118 },
        width: 120,
        height: 1,
        color: '#9ca3af',
      },
      
      {
        type: 'text',
        name: 'vocab_word_2',
        content: '2. {{vocabulary.word2}}:',
        position: { x: 25, y: 130 },
        width: 40,
        height: 8,
        fontSize: 11,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'line',
        name: 'vocab_answer_2',
        position: { x: 70, y: 138 },
        width: 120,
        height: 1,
        color: '#9ca3af',
      },
      
      // Comprehension questions
      {
        type: 'text',
        name: 'comprehension_title',
        content: 'Reading Comprehension:',
        position: { x: 20, y: 160 },
        width: 50,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      
      {
        type: 'shortAnswer',
        name: 'comprehension_1',
        content: '1. {{comprehension.question1}}',
        position: { x: 25, y: 175 },
        width: 165,
        height: 25,
        fontSize: 11,
        fontColor: '#1f2937',
        maxLength: 150,
        points: 3,
      },
      
      {
        type: 'shortAnswer',
        name: 'comprehension_2',
        content: '2. {{comprehension.question2}}',
        position: { x: 25, y: 210 },
        width: 165,
        height: 25,
        fontSize: 11,
        fontColor: '#1f2937',
        maxLength: 150,
        points: 3,
      },
      
      // Writing prompt
      {
        type: 'text',
        name: 'writing_title',
        content: 'Writing Response:',
        position: { x: 20, y: 250 },
        width: 50,
        height: 12,
        fontSize: 13,
        fontColor: '#1f2937',
        fontName: 'Arial-Bold',
      },
      {
        type: 'essay',
        name: 'writing_prompt',
        content: '{{writing.prompt}}',
        position: { x: 20, y: 265 },
        width: 170,
        height: 25,
        fontSize: 11,
        fontColor: '#1f2937',
        wordLimit: 200,
        points: 10,
      },
    ],
  ],
  
  educational: {
    category: 'worksheet',
    metadata: {
      gradeLevel: 'elementary',
      subject: 'Language Arts',
      timeLimit: 40,
      totalPoints: 16,
      instructions: 'Read the selection carefully before answering questions. Use complete sentences in your responses.',
      learningObjectives: [
        'Use context clues for vocabulary',
        'Demonstrate reading comprehension',
        'Express ideas in writing',
        'Support answers with text evidence',
      ],
      standards: ['Common Core ELA Standards'],
      keywords: ['reading', 'vocabulary', 'comprehension', 'writing'],
      difficulty: 'beginner',
      language: 'en',
    },
  },
};

export default worksheetTemplate;