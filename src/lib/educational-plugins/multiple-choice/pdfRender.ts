import { PDFRenderProps } from '@pdfme/common';
import { MultipleChoiceSchema } from './types';
import { 
  formatQuestionForPDF,
  getCurrentQuestionText,
  getCurrentOptions,
  calculateDynamicFontSize,
  splitTextToLines,
  calculateTextHeight,
} from './helper';
import { 
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_ALIGNMENT,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_CHARACTER_SPACING,
} from './constants';

/**
 * Embed and get font object for PDF rendering
 */
const embedAndGetFontObj = async (arg: PDFRenderProps<MultipleChoiceSchema>) => {
  const { pdfDoc, options, schema } = arg;
  const fontName = schema.fontName || 'NotoSerifJP-Regular';
  
  // Get font from options or embed default
  if (options?.font && options.font[fontName]) {
    return options.font[fontName];
  }
  
  // Fallback to default font
  return pdfDoc.embedFont('Helvetica');
};

/**
 * Get font properties for rendering
 */
const getFontProp = (schema: MultipleChoiceSchema) => ({
  fontSize: schema.fontSize || DEFAULT_FONT_SIZE,
  lineHeight: schema.lineHeight || DEFAULT_LINE_HEIGHT,
  characterSpacing: schema.characterSpacing || DEFAULT_CHARACTER_SPACING,
  alignment: schema.alignment || DEFAULT_ALIGNMENT,
  verticalAlignment: schema.verticalAlignment || DEFAULT_VERTICAL_ALIGNMENT,
});

/**
 * Main PDF rendering function for Multiple Choice
 */
export const pdfRender = async (arg: PDFRenderProps<MultipleChoiceSchema>): Promise<void> => {
  const { value, schema, page, options } = arg;
  const { position, width, height } = schema;
  
  try {
    // Get font objects
    const fontObj = await embedAndGetFontObj(arg);
    const fontProps = getFontProp(schema);
    
    // Get content
    const questionText = getCurrentQuestionText(value, schema);
    const options_array = getCurrentOptions(schema);
    const fullText = formatQuestionForPDF(questionText, options_array);
    
    // Calculate dynamic font size if enabled
    let actualFontSize = fontProps.fontSize;
    if (schema.dynamicFontSize && schema.dynamicFontSize !== 'none') {
      const fontCalcValues = {
        font: fontObj,
        fontSize: fontProps.fontSize,
        characterSpacing: fontProps.characterSpacing,
        dynamicFontSize: schema.dynamicFontSize,
      };
      
      actualFontSize = calculateDynamicFontSize(
        fullText,
        width,
        height,
        fontCalcValues,
        schema.dynamicFontSize
      );
    }
    
    // Draw background if specified
    if (schema.backgroundColor && schema.backgroundColor !== 'transparent') {
      const color = hexToRgb(schema.backgroundColor);
      if (color) {
        page.drawRectangle({
          x: position.x,
          y: position.y,
          width,
          height,
          color: color,
        });
      }
    }
    
    // Draw border if specified
    if (schema.borderColor && schema.borderWidth && schema.borderWidth > 0) {
      const borderColor = hexToRgb(schema.borderColor);
      if (borderColor) {
        page.drawRectangle({
          x: position.x,
          y: position.y,
          width,
          height,
          borderColor: borderColor,
          borderWidth: schema.borderWidth,
        });
      }
    }
    
    // Split text into lines
    const fontCalcValues = {
      font: fontObj,
      fontSize: actualFontSize,
      characterSpacing: fontProps.characterSpacing,
    };
    
    const availableWidth = width - (schema.padding || 0) * 2;
    const lines = splitTextToLines(fullText, availableWidth, fontCalcValues);
    
    // Calculate text positioning
    const textHeight = calculateTextHeight(lines, actualFontSize, fontProps.lineHeight);
    const paddingTop = schema.padding || 0;
    const paddingLeft = schema.padding || 0;
    
    // Calculate Y offset for vertical alignment
    let yOffset = position.y + height - paddingTop - actualFontSize;
    
    if (fontProps.verticalAlignment === 'middle') {
      yOffset = position.y + (height - textHeight) / 2 + textHeight - actualFontSize;
    } else if (fontProps.verticalAlignment === 'bottom') {
      yOffset = position.y + textHeight - actualFontSize + paddingTop;
    }
    
    // Get font color
    const fontColor = hexToRgb(schema.fontColor || '#000000') || { r: 0, g: 0, b: 0 };
    
    // Render each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineY = yOffset - (i * actualFontSize * fontProps.lineHeight);
      
      // Calculate X position for horizontal alignment
      let xPosition = position.x + paddingLeft;
      
      if (fontProps.alignment === 'center') {
        const lineWidth = fontObj.widthOfTextAtSize(line, actualFontSize);
        xPosition = position.x + (width - lineWidth) / 2;
      } else if (fontProps.alignment === 'right') {
        const lineWidth = fontObj.widthOfTextAtSize(line, actualFontSize);
        xPosition = position.x + width - lineWidth - paddingLeft;
      }
      
      // Draw the text line
      page.drawText(line, {
        x: xPosition,
        y: lineY,
        size: actualFontSize,
        font: fontObj,
        color: fontColor,
        characterSpacing: fontProps.characterSpacing,
      });
    }
    
  } catch (error) {
    console.error('Multiple Choice PDF Render Error:', error);
    
    // Fallback rendering - simple text
    try {
      const fallbackText = `${getCurrentQuestionText(value, schema)}\n[Multiple choice options]`;
      const fontObj = await embedAndGetFontObj(arg);
      
      page.drawText(fallbackText, {
        x: position.x + 5,
        y: position.y + height - 20,
        size: DEFAULT_FONT_SIZE,
        font: fontObj,
        color: { r: 0, g: 0, b: 0 },
      });
    } catch (fallbackError) {
      console.error('Multiple Choice PDF Fallback Render Error:', fallbackError);
    }
  }
};

/**
 * Convert hex color to RGB object
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
 * Get font descent in points (utility for precise text positioning)
 */
const getFontDescentInPt = (font: any, fontSize: number): number => {
  try {
    if (font && font.descent) {
      return (font.descent / font.unitsPerEm) * fontSize;
    }
  } catch (error) {
    console.warn('Could not calculate font descent:', error);
  }
  return fontSize * 0.2; // Fallback estimate
};

/**
 * Calculate height of font at given size
 */
const heightOfFontAtSize = (font: any, fontSize: number): number => {
  try {
    if (font && font.ascent && font.descent) {
      const ascent = (font.ascent / font.unitsPerEm) * fontSize;
      const descent = Math.abs((font.descent / font.unitsPerEm) * fontSize);
      return ascent + descent;
    }
  } catch (error) {
    console.warn('Could not calculate font height:', error);
  }
  return fontSize; // Fallback
};

/**
 * Calculate width of text at given size
 */
const widthOfTextAtSize = (font: any, text: string, fontSize: number): number => {
  try {
    if (font && font.widthOfTextAtSize) {
      return font.widthOfTextAtSize(text, fontSize);
    }
  } catch (error) {
    console.warn('Could not calculate text width:', error);
  }
  return text.length * fontSize * 0.6; // Fallback estimate
};