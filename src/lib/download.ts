/**
 * Download utilities for PDF files
 */

export const downloadPDF = (pdfBytes: Uint8Array, filename: string): void => {
  try {
    // Create blob from PDF bytes
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`Downloaded: ${filename}`);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw new Error('Could not download PDF file');
  }
};

export const generateBrandedFilename = (originalFilename: string): string => {
  // Remove .pdf extension
  const nameWithoutExt = originalFilename.replace(/\.pdf$/i, '');
  
  // Add branding suffix and timestamp
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  return `${nameWithoutExt}_branded_${timestamp}.pdf`;
};

export const previewPDF = (pdfBytes: Uint8Array): string => {
  try {
    // Create blob URL for preview
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to create preview URL:', error);
    throw new Error('Could not create PDF preview');
  }
};