// Integration configuration for the template system

import { PdfmeIntegration } from './pdfme-integration';
import { templateManager } from './template-manager';
import { dataBindingService } from './data-binding';
import { templateValidator } from './template-validator';
import { getEducationalPlugins } from './educational-plugins';
import { quizTemplate, quizTemplateDefinition } from '@/templates/quiz-template';
import { worksheetTemplate, worksheetTemplateDefinition } from '@/templates/worksheet-template';

/**
 * Initialize template system with all components
 */
export async function initializeTemplateSystem() {
  try {
    // Initialize PDFme integration
    const pdfmeIntegration = new PdfmeIntegration();

    // Register educational plugins
    const educationalPlugins = getEducationalPlugins();
    Object.entries(educationalPlugins).forEach(([name, plugin]) => {
      pdfmeIntegration.addPlugin(name, plugin);
    });

    // Load default templates if they don't exist
    await loadDefaultTemplates();

    console.log('✅ Template system initialized successfully');
    return pdfmeIntegration;
  } catch (error) {
    console.error('❌ Failed to initialize template system:', error);
    throw error;
  }
}

/**
 * Load default templates into storage
 */
async function loadDefaultTemplates() {
  try {
    // Check if quiz template exists
    const quizExists = await templateManager.loadTemplate(quizTemplateDefinition.metadata.id);
    if (!quizExists) {
      await templateManager.saveTemplate(quizTemplateDefinition);
      console.log('✅ Quiz template loaded');
    }

    // Check if worksheet template exists
    const worksheetExists = await templateManager.loadTemplate(worksheetTemplateDefinition.metadata.id);
    if (!worksheetExists) {
      await templateManager.saveTemplate(worksheetTemplateDefinition);
      console.log('✅ Worksheet template loaded');
    }
  } catch (error) {
    console.error('❌ Failed to load default templates:', error);
  }
}

/**
 * Template system utilities
 */
export const templateSystem = {
  pdfme: new PdfmeIntegration(),
  manager: templateManager,
  dataBinding: dataBindingService,
  validator: templateValidator,
  initialize: initializeTemplateSystem,
};