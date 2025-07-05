import { PDFRenderProps } from '@pdfme/common';
import { MultipleChoiceSchema } from './types';

/**
 * Convert hex color to RGB object for PDF rendering
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : null;
};

/**
 * PDF rendering function for Multiple Choice plugin
 */
export const pdfRender = async (arg: PDFRenderProps<MultipleChoiceSchema>) => {
  const { page, schema, options, value } = arg;
  const { question, choices, instructionText } = schema;
  const pageHeight = page.getHeight();
  
  try {
    // Calculate positions
    const x = schema.position.x;
    let y = pageHeight - schema.position.y;
    
    // Get font or use fallback
    const fontName = schema.fontName || 'Helvetica';
    const font = options.font && options.font[fontName] 
      ? options.font[fontName] 
      : options.font && Object.keys(options.font).length > 0 
        ? options.font[Object.keys(options.font)[0]]
        : null;
    
    if (!font) {
      console.warn('No font available for multiple choice rendering');
      return;
    }
    
    // Font sizes
    const questionFontSize = schema.fontSize || 12;
    const choiceFontSize = questionFontSize * 0.9;
    const instructionFontSize = questionFontSize * 0.8;
    
    // Colors
    const textColorHex = schema.fontColor || '#000000';
    const textColor = hexToRgb(textColorHex) || { r: 0, g: 0, b: 0 };
    const checkboxSize = choiceFontSize * 0.8;
    
    // Draw background if specified
    if (schema.backgroundColor && schema.backgroundColor !== 'transparent') {
      const bgColor = hexToRgb(schema.backgroundColor);
      if (bgColor) {
        page.drawRectangle({
          x: schema.position.x,
          y: pageHeight - schema.position.y - schema.height,
          width: schema.width,
          height: schema.height,
          color: bgColor,
        });
      }
    }
    
    // Draw instruction text if provided
    if (instructionText) {
      page.drawText(instructionText, {
        x,
        y: y - instructionFontSize,
        size: instructionFontSize,
        font,
        color: textColor,
        opacity: 0.7,
      });
      y -= instructionFontSize * 1.5;
    }
    
    // Draw question
    page.drawText(question || 'Question text here...', {
      x,
      y: y - questionFontSize,
      size: questionFontSize,
      font,
      color: textColor,
    });
    
    y -= questionFontSize * 2;
    
    // Draw choices with checkboxes
    const validChoices = choices.filter(choice => choice.text.trim().length > 0);
    
    validChoices.forEach((choice, index) => {
      // Draw checkbox
      page.drawRectangle({
        x: x,
        y: y - checkboxSize,
        width: checkboxSize,
        height: checkboxSize,
        borderColor: textColor,
        borderWidth: 1,
        opacity: 1,
      });
      
      // If showCorrectAnswers is enabled and this is a correct answer, fill the checkbox
      if (schema.showCorrectAnswers && choice.isCorrect) {
        page.drawRectangle({
          x: x + 2,
          y: y - checkboxSize + 2,
          width: checkboxSize - 4,
          height: checkboxSize - 4,
          color: textColor,
          opacity: 0.7,
        });
      }
      
      // Draw choice text
      // Ensure index is within valid range for ASCII conversion (A-Z)
      const letterIndex = Math.min(index, 25); // Limit to 0-25 (A-Z)
      const choiceText = `${String.fromCharCode(65 + letterIndex)}. ${choice.text}`;
      page.drawText(choiceText, {
        x: x + checkboxSize + 5,
        y: y - choiceFontSize,
        size: choiceFontSize,
        font,
        color: textColor,
      });
      
      y -= choiceFontSize * 1.8;
    });
    
    // Draw border if specified
    if (schema.borderColor && schema.borderWidth && schema.borderWidth > 0) {
      const borderColor = hexToRgb(schema.borderColor);
      if (borderColor) {
        page.drawRectangle({
          x: schema.position.x,
          y: pageHeight - schema.position.y - schema.height,
          width: schema.width,
          height: schema.height,
          borderColor: borderColor,
          borderWidth: schema.borderWidth || 1,
        });
      }
    }
  } catch (error) {
    console.error('Error rendering multiple choice question:', error);
    
    // Fallback rendering
    try {
      const x = schema.position.x;
      const y = pageHeight - schema.position.y;
      const fontName = schema.fontName || 'Helvetica';
      const font = options.font && options.font[fontName] 
        ? options.font[fontName] 
        : options.font && Object.keys(options.font).length > 0 
          ? options.font[Object.keys(options.font)[0]]
          : null;
      
      if (font) {
        page.drawText('Error rendering multiple choice question', {
          x,
          y: y - 12,
          size: 12,
          font,
          color: { r: 1, g: 0, b: 0 },
        });
      }
    } catch (fallbackError) {
      console.error('Fallback rendering failed:', fallbackError);
    }
  }
};