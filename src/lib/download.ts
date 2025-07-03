/**
 * Download utilities for PDF files
 */

export const downloadPDF = (pdfBytes: Uint8Array, filename: string): void => {
  try {
    // Validate input
    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('PDF bytes are empty or invalid');
    }

    console.log(`📦 Preparing download: ${filename} (${pdfBytes.length} bytes)`);

    // Validate PDF header
    const header = Array.from(pdfBytes.slice(0, 8))
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    if (!header.startsWith('%PDF-')) {
      console.warn('⚠️ PDF bytes do not have valid PDF header:', header);
    }

    // Create blob from PDF bytes with explicit MIME type
    const blob = new Blob([pdfBytes], { 
      type: 'application/pdf'
    });
    
    // Validate blob creation
    if (blob.size === 0) {
      throw new Error('Failed to create PDF blob - blob size is 0');
    }

    console.log(`✅ PDF blob created: ${blob.size} bytes, type: ${blob.type}`);
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Add debugging attributes
    link.setAttribute('data-size', blob.size.toString());
    link.setAttribute('data-type', blob.type);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Small delay before cleanup to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log(`✅ Download cleanup completed for: ${filename}`);
    }, 100);
    
    console.log(`📥 Download initiated: ${filename}`);
  } catch (error) {
    console.error('❌ Failed to download PDF:', error);
    console.error('PDF bytes info:', {
      length: pdfBytes?.length || 0,
      type: typeof pdfBytes,
      isUint8Array: pdfBytes instanceof Uint8Array
    });
    throw new Error(`Could not download PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

/**
 * Test PDF validity by trying to create and immediately test a blob
 */
export const testPDFValidity = async (pdfBytes: Uint8Array): Promise<{
  isValid: boolean;
  error?: string;
  details: {
    size: number;
    hasValidHeader: boolean;
    hasValidFooter: boolean;
    blobCreated: boolean;
  };
}> => {
  const details = {
    size: pdfBytes.length,
    hasValidHeader: false,
    hasValidFooter: false,
    blobCreated: false,
  };

  try {
    // Check size
    if (pdfBytes.length === 0) {
      return { isValid: false, error: 'PDF is empty', details };
    }

    // Check header
    const header = Array.from(pdfBytes.slice(0, 8))
      .map(byte => String.fromCharCode(byte))
      .join('');
    details.hasValidHeader = header.startsWith('%PDF-');

    // Check footer
    const footer = Array.from(pdfBytes.slice(-20))
      .map(byte => String.fromCharCode(byte))
      .join('');
    details.hasValidFooter = footer.includes('%%EOF');

    // Test blob creation
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    details.blobCreated = blob.size > 0;

    // Overall validity
    const isValid = details.hasValidHeader && details.blobCreated;

    return {
      isValid,
      error: isValid ? undefined : 'PDF structure validation failed',
      details
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      details
    };
  }
};