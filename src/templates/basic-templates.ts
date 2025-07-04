// CREATED: 2025-07-04 - Basic template definitions for educational documents

import { Template } from '@pdfme/common';
import { EducationalTemplate } from '@/types/pdfme-extensions';
import { DataBinding } from '@/lib/gemini-to-pdfme';

/**
 * Basic educational document template
 */
export const basicTemplate: EducationalTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [20, 20, 20, 20],
  },
  schemas: [
    [
      // Document title
      {
        name: 'documentTitle',
        type: 'text',
        content: 'Educational Document',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 18,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Document subtitle
      {
        name: 'documentSubtitle',
        type: 'text',
        content: 'Subtitle',
        position: { x: 20, y: 40 },
        width: 170,
        height: 10,
        fontSize: 14,
        fontColor: '#666666',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        lineHeight: 1.2,
      },
      // Document info
      {
        name: 'documentInfo',
        type: 'text',
        content: 'Author: Name | Course: Course Name',
        position: { x: 20, y: 55 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#888888',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        lineHeight: 1.2,
      },
      // Instructions
      {
        name: 'instructions',
        type: 'instructionBox',
        content: 'Please read all instructions carefully before proceeding.',
        position: { x: 20, y: 75 },
        width: 170,
        height: 20,
        fontSize: 11,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        lineHeight: 1.3,
      },
      // Main content area
      {
        name: 'mainContent',
        type: 'text',
        content: 'Main content will appear here.',
        position: { x: 20, y: 110 },
        width: 170,
        height: 150,
        fontSize: 12,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
      },
    ],
  ],
  educational: {
    category: 'general',
    duration: 30,
    difficulty: 'intermediate',
    language: 'en',
    instructions: 'Complete all sections as instructed.',
    keywords: ['education', 'template', 'basic'],
    learningObjectives: ['Understand basic concepts', 'Apply knowledge'],
  },
  version: { major: 1, minor: 0, patch: 0 },
};

/**
 * Quiz template with multiple choice questions
 */
export const quizTemplate: EducationalTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [20, 20, 20, 20],
  },
  schemas: [
    [
      // Quiz title
      {
        name: 'quizTitle',
        type: 'text',
        content: 'Quiz Title',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 18,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Quiz info
      {
        name: 'quizInfo',
        type: 'text',
        content: 'Subject: [Subject] | Time: [Duration] minutes | Points: [Total Points]',
        position: { x: 20, y: 40 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#666666',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        lineHeight: 1.2,
      },
      // Instructions
      {
        name: 'quizInstructions',
        type: 'instructionBox',
        content: 'Choose the best answer for each question. Mark your answers clearly.',
        position: { x: 20, y: 55 },
        width: 170,
        height: 20,
        fontSize: 11,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        lineHeight: 1.3,
      },
      // Question 1
      {
        name: 'question1',
        type: 'multipleChoice',
        content: '1. What is the primary function of photosynthesis?',
        position: { x: 20, y: 90 },
        width: 170,
        height: 35,
        fontSize: 12,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
        educational: {
          questionType: 'multiple_choice',
          points: 2,
          difficulty: 'medium',
          subject: 'Biology',
          correctAnswer: 'C',
        },
      },
      // Question 2
      {
        name: 'question2',
        type: 'multipleChoice',
        content: '2. Which of the following is NOT a renewable energy source?',
        position: { x: 20, y: 140 },
        width: 170,
        height: 35,
        fontSize: 12,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
        educational: {
          questionType: 'multiple_choice',
          points: 2,
          difficulty: 'easy',
          subject: 'Environmental Science',
          correctAnswer: 'B',
        },
      },
      // Question 3
      {
        name: 'question3',
        type: 'trueFalse',
        content: '3. True or False: The Earth revolves around the Sun.',
        position: { x: 20, y: 190 },
        width: 170,
        height: 25,
        fontSize: 12,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
        educational: {
          questionType: 'true_false',
          points: 1,
          difficulty: 'easy',
          subject: 'Astronomy',
          correctAnswer: true,
        },
      },
      // Answer key (hidden by default)
      {
        name: 'answerKey',
        type: 'answerKey',
        content: '',
        position: { x: 20, y: 230 },
        width: 170,
        height: 30,
        fontSize: 10,
        fontColor: '#666666',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.3,
      },
    ],
  ],
  educational: {
    category: 'quiz',
    duration: 20,
    totalPoints: 5,
    passingScore: 3,
    difficulty: 'intermediate',
    language: 'en',
    instructions: 'Choose the best answer for each question. You have 20 minutes to complete this quiz.',
    keywords: ['quiz', 'multiple choice', 'assessment'],
    learningObjectives: ['Test knowledge retention', 'Assess understanding'],
  },
  version: { major: 1, minor: 0, patch: 0 },
};

/**
 * Worksheet template for exercises and practice
 */
export const worksheetTemplate: EducationalTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [20, 20, 20, 20],
  },
  schemas: [
    [
      // Worksheet title
      {
        name: 'worksheetTitle',
        type: 'text',
        content: 'Worksheet: Practice Exercises',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 18,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Student info section
      {
        name: 'studentInfo',
        type: 'text',
        content: 'Name: _________________________ Date: _____________ Class: _____________',
        position: { x: 20, y: 45 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.2,
      },
      // Section 1 header
      {
        name: 'section1Header',
        type: 'text',
        content: 'Section 1: Vocabulary',
        position: { x: 20, y: 70 },
        width: 170,
        height: 12,
        fontSize: 14,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Section 1 content
      {
        name: 'section1Content',
        type: 'text',
        content: 'Define the following terms:\n\n1. _________________________________\n\n2. _________________________________\n\n3. _________________________________',
        position: { x: 20, y: 90 },
        width: 170,
        height: 50,
        fontSize: 12,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.6,
      },
      // Section 2 header
      {
        name: 'section2Header',
        type: 'text',
        content: 'Section 2: Short Answer',
        position: { x: 20, y: 155 },
        width: 170,
        height: 12,
        fontSize: 14,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Short answer questions
      {
        name: 'shortAnswer1',
        type: 'shortAnswer',
        content: '1. Explain the main concept discussed in today\'s lesson.',
        position: { x: 20, y: 175 },
        width: 170,
        height: 30,
        fontSize: 12,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
        educational: {
          questionType: 'short_answer',
          points: 5,
          difficulty: 'medium',
        },
      },
      {
        name: 'shortAnswer2',
        type: 'shortAnswer',
        content: '2. Provide an example of how this concept applies in real life.',
        position: { x: 20, y: 220 },
        width: 170,
        height: 30,
        fontSize: 12,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
        educational: {
          questionType: 'short_answer',
          points: 5,
          difficulty: 'medium',
        },
      },
    ],
  ],
  educational: {
    category: 'worksheet',
    duration: 45,
    totalPoints: 10,
    difficulty: 'intermediate',
    language: 'en',
    instructions: 'Complete all sections. Write your answers clearly in the spaces provided.',
    keywords: ['worksheet', 'practice', 'exercises'],
    learningObjectives: ['Practice key concepts', 'Develop understanding'],
  },
  version: { major: 1, minor: 0, patch: 0 },
};

/**
 * Exam template for formal assessments
 */
export const examTemplate: EducationalTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [20, 20, 20, 20],
  },
  schemas: [
    [
      // Exam header
      {
        name: 'examTitle',
        type: 'text',
        content: 'FINAL EXAMINATION',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 20,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Course info
      {
        name: 'courseInfo',
        type: 'text',
        content: 'Course: [Course Name] | Instructor: [Instructor Name] | Date: [Date]',
        position: { x: 20, y: 40 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#666666',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        lineHeight: 1.2,
      },
      // Student info
      {
        name: 'studentExamInfo',
        type: 'text',
        content: 'Student Name: _________________________ Student ID: _____________',
        position: { x: 20, y: 55 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.2,
      },
      // Exam instructions
      {
        name: 'examInstructions',
        type: 'instructionBox',
        content: 'READ ALL INSTRUCTIONS CAREFULLY\n• Answer all questions\n• Show all work\n• Use pen or pencil\n• Time limit: 90 minutes',
        position: { x: 20, y: 70 },
        width: 170,
        height: 25,
        fontSize: 10,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.3,
      },
      // Part A: Multiple Choice
      {
        name: 'partAHeader',
        type: 'text',
        content: 'PART A: Multiple Choice (20 points)',
        position: { x: 20, y: 110 },
        width: 170,
        height: 12,
        fontSize: 14,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // MC Question 1
      {
        name: 'examQuestion1',
        type: 'multipleChoice',
        content: '1. Which of the following best describes...?',
        position: { x: 20, y: 130 },
        width: 170,
        height: 35,
        fontSize: 12,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
        educational: {
          questionType: 'multiple_choice',
          points: 4,
          difficulty: 'hard',
        },
      },
      // Part B: Essay
      {
        name: 'partBHeader',
        type: 'text',
        content: 'PART B: Essay Questions (30 points)',
        position: { x: 20, y: 180 },
        width: 170,
        height: 12,
        fontSize: 14,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Essay question
      {
        name: 'essayQuestion1',
        type: 'essay',
        content: '1. Discuss the major themes and their significance. Use specific examples to support your analysis.',
        position: { x: 20, y: 200 },
        width: 170,
        height: 60,
        fontSize: 12,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
        educational: {
          questionType: 'essay',
          points: 15,
          difficulty: 'hard',
        },
      },
    ],
  ],
  educational: {
    category: 'exam',
    duration: 90,
    totalPoints: 50,
    passingScore: 35,
    difficulty: 'advanced',
    language: 'en',
    instructions: 'This is a formal examination. Read all instructions carefully and manage your time effectively.',
    keywords: ['exam', 'assessment', 'evaluation'],
    learningObjectives: ['Demonstrate mastery', 'Apply knowledge comprehensively'],
  },
  version: { major: 1, minor: 0, patch: 0 },
};

/**
 * Assignment template for homework and projects
 */
export const assignmentTemplate: EducationalTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [20, 20, 20, 20],
  },
  schemas: [
    [
      // Assignment title
      {
        name: 'assignmentTitle',
        type: 'text',
        content: 'Assignment: [Title]',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        fontSize: 18,
        fontColor: '#1a1a1a',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      // Assignment details
      {
        name: 'assignmentDetails',
        type: 'text',
        content: 'Due Date: [Date] | Points: [Points] | Format: [Format]',
        position: { x: 20, y: 40 },
        width: 170,
        height: 8,
        fontSize: 10,
        fontColor: '#666666',
        fontName: 'Roboto-Regular',
        alignment: 'center',
        lineHeight: 1.2,
      },
      // Objectives
      {
        name: 'objectives',
        type: 'text',
        content: 'Learning Objectives:\n• Objective 1\n• Objective 2\n• Objective 3',
        position: { x: 20, y: 60 },
        width: 170,
        height: 25,
        fontSize: 11,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
      },
      // Instructions
      {
        name: 'assignmentInstructions',
        type: 'instructionBox',
        content: 'Complete all parts of this assignment. Follow the guidelines carefully and submit on time.',
        position: { x: 20, y: 95 },
        width: 170,
        height: 20,
        fontSize: 11,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.3,
      },
      // Main assignment content
      {
        name: 'assignmentContent',
        type: 'text',
        content: 'Assignment Description:\n\nPart 1: [Description]\n\nPart 2: [Description]\n\nPart 3: [Description]',
        position: { x: 20, y: 125 },
        width: 170,
        height: 100,
        fontSize: 12,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.4,
      },
      // Rubric
      {
        name: 'assignmentRubric',
        type: 'rubric',
        content: '',
        position: { x: 20, y: 235 },
        width: 170,
        height: 40,
        fontSize: 10,
        fontColor: '#333333',
        fontName: 'Roboto-Regular',
        alignment: 'left',
        lineHeight: 1.3,
      },
    ],
  ],
  educational: {
    category: 'assignment',
    duration: 180, // 3 hours
    totalPoints: 25,
    difficulty: 'intermediate',
    language: 'en',
    instructions: 'Complete all parts of the assignment according to the rubric criteria.',
    keywords: ['assignment', 'homework', 'project'],
    learningObjectives: ['Apply course concepts', 'Demonstrate understanding'],
  },
  version: { major: 1, minor: 0, patch: 0 },
};

/**
 * Data bindings for templates
 */
export const templateDataBindings: Record<string, DataBinding[]> = {
  basic: [
    { path: 'documentTitle', type: 'text', fallback: 'Educational Document' },
    { path: 'documentSubtitle', type: 'text', fallback: 'Subtitle' },
    { path: 'documentInfo', type: 'text', fallback: 'Document Information' },
    { path: 'instructions', type: 'text', fallback: 'Instructions' },
    { path: 'mainContent', type: 'text', fallback: 'Main content' },
  ],
  quiz: [
    { path: 'quizTitle', type: 'text', fallback: 'Quiz Title' },
    { path: 'quizInfo', type: 'text', fallback: 'Quiz Information' },
    { path: 'quizInstructions', type: 'text', fallback: 'Quiz Instructions' },
    { path: 'question1', type: 'text', fallback: 'Question 1' },
    { path: 'question2', type: 'text', fallback: 'Question 2' },
    { path: 'question3', type: 'text', fallback: 'Question 3' },
  ],
  worksheet: [
    { path: 'worksheetTitle', type: 'text', fallback: 'Worksheet Title' },
    { path: 'studentInfo', type: 'text', fallback: 'Student Information' },
    { path: 'section1Header', type: 'text', fallback: 'Section 1' },
    { path: 'section1Content', type: 'text', fallback: 'Section 1 Content' },
    { path: 'section2Header', type: 'text', fallback: 'Section 2' },
    { path: 'shortAnswer1', type: 'text', fallback: 'Short Answer 1' },
    { path: 'shortAnswer2', type: 'text', fallback: 'Short Answer 2' },
  ],
  exam: [
    { path: 'examTitle', type: 'text', fallback: 'Exam Title' },
    { path: 'courseInfo', type: 'text', fallback: 'Course Information' },
    { path: 'studentExamInfo', type: 'text', fallback: 'Student Information' },
    { path: 'examInstructions', type: 'text', fallback: 'Exam Instructions' },
    { path: 'partAHeader', type: 'text', fallback: 'Part A' },
    { path: 'examQuestion1', type: 'text', fallback: 'Question 1' },
    { path: 'partBHeader', type: 'text', fallback: 'Part B' },
    { path: 'essayQuestion1', type: 'text', fallback: 'Essay Question 1' },
  ],
  assignment: [
    { path: 'assignmentTitle', type: 'text', fallback: 'Assignment Title' },
    { path: 'assignmentDetails', type: 'text', fallback: 'Assignment Details' },
    { path: 'objectives', type: 'text', fallback: 'Learning Objectives' },
    { path: 'assignmentInstructions', type: 'text', fallback: 'Instructions' },
    { path: 'assignmentContent', type: 'text', fallback: 'Assignment Content' },
    { path: 'assignmentRubric', type: 'text', fallback: 'Rubric' },
  ],
};

/**
 * Get all available templates
 */
export const getAllTemplates = () => {
  return {
    basic: basicTemplate,
    quiz: quizTemplate,
    worksheet: worksheetTemplate,
    exam: examTemplate,
    assignment: assignmentTemplate,
  };
};

/**
 * Get template by category
 */
export const getTemplateByCategory = (category: string): EducationalTemplate | null => {
  const templates = getAllTemplates();
  return templates[category as keyof typeof templates] || null;
};

/**
 * Get template sample data
 */
export const getTemplateSampleData = (templateType: string): any => {
  const sampleData: Record<string, any> = {
    basic: {
      documentTitle: 'Introduction to Biology',
      documentSubtitle: 'Chapter 1: Cell Structure',
      documentInfo: 'Author: Dr. Smith | Course: Biology 101',
      instructions: 'Read carefully and take notes on key concepts.',
      mainContent: 'This chapter covers the basic structure of cells, including organelles and their functions.',
    },
    quiz: {
      quizTitle: 'Biology Quiz #1',
      quizInfo: 'Subject: Biology | Time: 20 minutes | Points: 5',
      quizInstructions: 'Choose the best answer for each question.',
      question1: {
        content: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Endoplasmic Reticulum']
      },
      question2: {
        content: 'Which organelle is responsible for protein synthesis?',
        options: ['Mitochondria', 'Ribosome', 'Golgi Apparatus', 'Lysosome']
      },
      question3: {
        content: 'The cell membrane is selectively permeable.'
      },
    },
    worksheet: {
      worksheetTitle: 'Cell Biology Worksheet',
      studentInfo: 'Name: _________________________ Date: _____________ Class: _____________',
      section1Header: 'Section 1: Cell Organelles',
      section1Content: 'Define the following organelles and their functions:\n\n1. Nucleus: _________________________________\n\n2. Mitochondria: _________________________________\n\n3. Ribosomes: _________________________________',
      section2Header: 'Section 2: Cell Processes',
      shortAnswer1: 'Explain the process of cellular respiration.',
      shortAnswer2: 'Describe the difference between prokaryotic and eukaryotic cells.',
    },
    exam: {
      examTitle: 'BIOLOGY MIDTERM EXAM',
      courseInfo: 'Course: Biology 101 | Instructor: Dr. Johnson | Date: March 15, 2024',
      studentExamInfo: 'Student Name: _________________________ Student ID: _____________',
      examInstructions: 'READ ALL INSTRUCTIONS CAREFULLY\n• Answer all questions\n• Show all work\n• Use pen or pencil\n• Time limit: 90 minutes',
      partAHeader: 'PART A: Multiple Choice (20 points)',
      examQuestion1: {
        content: 'Which of the following is NOT a characteristic of living organisms?',
        options: ['Growth', 'Reproduction', 'Metabolism', 'Crystallization']
      },
      partBHeader: 'PART B: Essay Questions (30 points)',
      essayQuestion1: 'Discuss the role of enzymes in cellular metabolism. Include specific examples and explain how environmental factors affect enzyme activity.',
    },
    assignment: {
      assignmentTitle: 'Cell Research Project',
      assignmentDetails: 'Due Date: April 1, 2024 | Points: 25 | Format: Written Report',
      objectives: 'Learning Objectives:\n• Research a specific cell type\n• Analyze cellular structure and function\n• Present findings clearly',
      assignmentInstructions: 'Choose a specific cell type to research. Create a detailed report including structure, function, and significance.',
      assignmentContent: 'Assignment Description:\n\nPart 1: Choose a cell type (nerve, muscle, blood, etc.)\n\nPart 2: Research structure and function\n\nPart 3: Create a detailed report with diagrams',
      assignmentRubric: 'Grading Criteria:\n• Content Accuracy (10 pts)\n• Organization (5 pts)\n• Presentation (5 pts)\n• References (5 pts)',
    },
  };

  return sampleData[templateType] || {};
};

/**
 * Create custom template from base
 */
export const createCustomTemplate = (
  baseTemplate: EducationalTemplate,
  customizations: Partial<EducationalTemplate>
): EducationalTemplate => {
  return {
    ...baseTemplate,
    ...customizations,
    schemas: customizations.schemas || baseTemplate.schemas,
    educational: {
      ...baseTemplate.educational,
      ...customizations.educational,
    },
    version: customizations.version || baseTemplate.version,
  };
};