// Debug utility to test and validate template schemas

import { getPDFTemplateSystem } from '@/lib/pdf-template-system/PDFTemplateSystem';
import type { GeminiAnalysisResponse } from '@/types/gemini';

/**
 * Debug function to test template creation and validation
 */
export async function debugTemplateSchemas() {
  console.log('🔍 Starting template schema debug...');
  
  try {
    // Initialize template system
    const templateSystem = getPDFTemplateSystem();
    await templateSystem.initialize();
    
    console.log('✅ Template system initialized');
    
    // Create a sample analysis result for testing
    const sampleAnalysis: GeminiAnalysisResponse = {
      documentStructure: {
        type: 'quiz',
        subject: 'Mathematics',
        difficulty: 'easy',
        confidence: 0.9,
        sections: [
          {
            id: 'section_1',
            type: 'header',
            content: 'Mathematics Quiz',
            position: { page: 1, x: 0, y: 0, width: 100, height: 10 },
            confidence: 0.95
          },
          {
            id: 'section_2',
            type: 'instruction',
            content: 'Answer all questions carefully',
            position: { page: 1, x: 0, y: 15, width: 100, height: 10 },
            confidence: 0.9
          }
        ]
      },
      extractedQuestions: [
        {
          id: 'question_1',
          number: '1',
          content: 'What is 2 + 2?',
          type: 'multiple_choice',
          options: ['2', '3', '4', '5'],
          correctAnswer: '4',
          confidence: 0.95
        },
        {
          id: 'question_2',
          number: '2',
          content: 'What is 5 - 3?',
          type: 'multiple_choice',
          options: ['1', '2', '3', '4'],
          correctAnswer: '2',
          confidence: 0.9
        }
      ],
      extractedContent: {
        title: 'Sample Mathematics Quiz',
        subtitle: 'Basic arithmetic questions'
      }
    };
    
    // Test template creation
    console.log('🔄 Creating template from analysis...');
    const result = await templateSystem.createTemplateFromAnalysis(sampleAnalysis);
    
    if (result.success && result.template) {
      console.log('✅ Template created successfully');
      console.log('📊 Template stats:', result.stats);
      
      // Debug schema structure
      console.log('🔍 Debugging template schemas...');
      const template = result.template;
      
      console.log('📋 Template basic info:');
      console.log('- ID:', template.id);
      console.log('- Name:', template.name);
      console.log('- Category:', template.category);
      console.log('- Schemas pages:', template.schemas.length);
      
      // Check each schema page
      template.schemas.forEach((pageSchemas, pageIndex) => {
        console.log(`\n📄 Page ${pageIndex + 1} (${pageSchemas.length} schemas):`);
        
        pageSchemas.forEach((schema, schemaIndex) => {
          console.log(`  🔸 Schema ${schemaIndex + 1}:`);
          console.log(`    - Name: ${schema.name || 'MISSING NAME!'}`);
          console.log(`    - Type: ${schema.type || 'MISSING TYPE!'}`);
          console.log(`    - Position: ${JSON.stringify(schema.position)}`);
          console.log(`    - Size: ${schema.width}x${schema.height}`);
          
          if (schema.dataBinding) {
            console.log(`    - Data binding: ${schema.dataBinding.path}`);
          }
          
          if (schema.educational) {
            console.log(`    - Educational: ${schema.educational.contentType}`);
          }
          
          // Check for required fields
          const requiredFields = ['name', 'type', 'position', 'width', 'height'];
          const missingFields = requiredFields.filter(field => !schema[field]);
          
          if (missingFields.length > 0) {
            console.log(`    ❌ Missing required fields: ${missingFields.join(', ')}`);
          } else {
            console.log('    ✅ All required fields present');
          }
        });
      });
      
      // Test template validation
      console.log('\n🔍 Validating template...');
      const validation = await templateSystem.validateTemplate(template);
      
      if (validation.valid) {
        console.log('✅ Template validation passed');
      } else {
        console.log('❌ Template validation failed');
        console.log('Errors:', validation.errors);
      }
      
      if (validation.warnings.length > 0) {
        console.log('⚠️ Warnings:', validation.warnings);
      }
      
      // Test sample data
      console.log('\n🔍 Testing sample data...');
      const dataValidation = await templateSystem.validateData(template, template.sampleData);
      
      if (dataValidation.valid) {
        console.log('✅ Sample data validation passed');
      } else {
        console.log('❌ Sample data validation failed');
        console.log('Errors:', dataValidation.errors);
      }
      
      console.log('\n✅ Debug completed successfully!');
      return {
        success: true,
        template,
        validation,
        dataValidation
      };
      
    } else {
      console.log('❌ Template creation failed');
      console.log('Errors:', result.errors);
      return {
        success: false,
        errors: result.errors
      };
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Quick validation function to check if a template has proper schema structure
 */
export function validateTemplateSchemas(template: any): boolean {
  console.log('🔍 Quick schema validation...');
  
  if (!template.schemas || !Array.isArray(template.schemas)) {
    console.log('❌ Missing or invalid schemas array');
    return false;
  }
  
  let isValid = true;
  
  template.schemas.forEach((pageSchemas: any[], pageIndex: number) => {
    if (!Array.isArray(pageSchemas)) {
      console.log(`❌ Page ${pageIndex} schemas is not an array`);
      isValid = false;
      return;
    }
    
    pageSchemas.forEach((schema: any, schemaIndex: number) => {
      const requiredFields = ['name', 'type', 'position', 'width', 'height'];
      const missingFields = requiredFields.filter(field => !schema[field]);
      
      if (missingFields.length > 0) {
        console.log(`❌ Page ${pageIndex}, Schema ${schemaIndex}: Missing ${missingFields.join(', ')}`);
        isValid = false;
      }
      
      // Check if name is unique
      if (schema.name) {
        const duplicates = pageSchemas.filter(s => s.name === schema.name);
        if (duplicates.length > 1) {
          console.log(`❌ Page ${pageIndex}, Schema ${schemaIndex}: Duplicate name "${schema.name}"`);
          isValid = false;
        }
      }
    });
  });
  
  if (isValid) {
    console.log('✅ All schemas are valid');
  }
  
  return isValid;
}

/**
 * Generate a simple valid template for testing
 */
export function generateSimpleTemplate(): any {
  return {
    id: 'test_template_' + Date.now(),
    name: 'Test Template',
    description: 'A simple template for testing',
    category: 'general',
    tags: ['test'],
    basePdf: '',
    schemas: [[
      {
        name: 'title_text',
        type: 'text',
        position: { x: 20, y: 20 },
        width: 170,
        height: 15,
        content: 'Test Title',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        name: 'content_text',
        type: 'text',
        position: { x: 20, y: 40 },
        width: 170,
        height: 25,
        content: 'Test content goes here',
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left'
      }
    ]],
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Test System'
    },
    i18nConfig: {
      supportedLanguages: ['en'],
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      languages: {
        en: {
          code: 'en',
          name: 'English',
          direction: 'ltr',
          fontFamily: 'NotoSans',
          fallbackFonts: ['Arial', 'Helvetica'],
          fontFiles: {
            regular: '/fonts/NotoSans-Regular.ttf',
            bold: '/fonts/NotoSans-Bold.ttf',
            italic: '/fonts/NotoSans-Italic.ttf',
            boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
          },
          unicodeRange: 'U+0000-007F'
        }
      }
    },
    dataSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' }
      }
    },
    sampleData: {
      title: 'Test Title',
      content: 'Test content'
    },
    version: '1.0.0'
  };
}

/**
 * Test PDFme template structure
 */
export async function testPDFmeTemplate() {
  console.log('🔍 Testing PDFme template structure...');
  
  const simpleTemplate = generateSimpleTemplate();
  
  // Test validation
  const isValid = validateTemplateSchemas(simpleTemplate);
  
  if (isValid) {
    console.log('✅ Simple template is valid');
    
    // Try to create PDFme template
    const pdfmeTemplate = {
      basePdf: simpleTemplate.basePdf,
      schemas: simpleTemplate.schemas
    };
    
    console.log('📋 PDFme template structure:');
    console.log(JSON.stringify(pdfmeTemplate, null, 2));
    
    return {
      success: true,
      template: pdfmeTemplate
    };
  } else {
    console.log('❌ Simple template validation failed');
    return {
      success: false,
      error: 'Template validation failed'
    };
  }
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).debugTemplateSchemas = debugTemplateSchemas;
  (window as any).validateTemplateSchemas = validateTemplateSchemas;
  (window as any).generateSimpleTemplate = generateSimpleTemplate;
  (window as any).testPDFmeTemplate = testPDFmeTemplate;
}