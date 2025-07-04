// CREATED: 2025-07-04 - Test component for pdfme integration

import React, { useRef, useEffect, useState } from 'react';
import { Template } from '@pdfme/common';
import { pdfmeIntegration } from '@/lib/pdfme-integration';
import { getEducationalPlugins } from '@/lib/educational-plugins';

export function PDFmeTest() {
  const designerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);

  // Test template with educational plugins
  const testTemplate: Template = {
    basePdf: {
      width: 210,
      height: 297,
      padding: [20, 20, 20, 20],
    },
    schemas: [
      [
        {
          name: 'title',
          type: 'text',
          content: 'Educational Test Document',
          position: { x: 20, y: 20 },
          width: 170,
          height: 15,
          fontSize: 18,
          fontColor: '#000000',
          fontName: 'Helvetica',
          alignment: 'center',
        },
        {
          name: 'question1',
          type: 'multipleChoice',
          content: 'What is the capital of France?',
          position: { x: 20, y: 50 },
          width: 170,
          height: 40,
          fontSize: 12,
          fontColor: '#000000',
          fontName: 'Helvetica',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 'C',
        },
        {
          name: 'question2',
          type: 'trueFalse',
          content: 'The Earth is round.',
          position: { x: 20, y: 100 },
          width: 170,
          height: 25,
          fontSize: 12,
          fontColor: '#000000',
          fontName: 'Helvetica',
          correctAnswer: true,
        },
        {
          name: 'instructions',
          type: 'instructionBox',
          content: 'Please answer all questions carefully.',
          position: { x: 20, y: 140 },
          width: 170,
          height: 30,
          fontSize: 11,
          fontColor: '#333333',
          fontName: 'Helvetica',
        },
      ],
    ],
  };

  const sampleData = {
    title: 'Sample Quiz',
    question1: JSON.stringify({
      content: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid']
    }),
    question2: 'The Earth is round.',
    instructions: 'Please answer all questions carefully.'
  };

  // Initialize designer
  useEffect(() => {
    if (designerRef.current) {
      initializeDesigner();
    }
  }, []);

  // Initialize viewer
  useEffect(() => {
    if (viewerRef.current && template) {
      initializeViewer();
    }
  }, [template]);

  const initializeDesigner = async () => {
    if (!designerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add educational plugins
      const educationalPlugins = getEducationalPlugins();
      Object.entries(educationalPlugins).forEach(([name, plugin]) => {
        pdfmeIntegration.addPlugin(name, plugin);
      });

      // Validate template
      const validation = pdfmeIntegration.validateTemplate(testTemplate);
      if (!validation.valid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      // Create designer
      const designer = pdfmeIntegration.createDesigner(
        designerRef.current,
        testTemplate,
        {
          lang: 'en',
          theme: {
            token: { colorPrimary: '#1890ff' },
          },
        }
      );

      // Listen for template changes
      designer.onSaveTemplate((newTemplate) => {
        setTemplate(newTemplate);
        console.log('Template updated:', newTemplate);
      });

      console.log('Designer initialized successfully');
    } catch (err) {
      console.error('Designer initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize designer');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeViewer = async () => {
    if (!viewerRef.current || !template) return;

    try {
      const viewer = pdfmeIntegration.createViewer(
        viewerRef.current,
        template,
        [sampleData],
        {
          lang: 'en',
        }
      );

      console.log('Viewer initialized successfully');
    } catch (err) {
      console.error('Viewer initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
    }
  };

  const handleGeneratePDF = async () => {
    if (!template) return;

    try {
      setIsLoading(true);
      await pdfmeIntegration.downloadPDF(template, [sampleData], 'test-document.pdf');
      console.log('PDF generated successfully');
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!template) return;

    try {
      pdfmeIntegration.downloadTemplate(template, 'test-template.json');
      console.log('Template downloaded successfully');
    } catch (err) {
      console.error('Template download failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to download template');
    }
  };

  const handleValidateTemplate = () => {
    const validation = pdfmeIntegration.validateTemplate(testTemplate);
    console.log('Template validation:', validation);
    
    if (validation.valid) {
      alert('Template is valid!');
    } else {
      alert(`Template validation failed:\n${validation.errors.join('\n')}`);
    }
  };

  const handleTestPlugins = () => {
    const plugins = pdfmeIntegration.getPlugins();
    console.log('Available plugins:', Object.keys(plugins));
    
    const educationalPlugins = getEducationalPlugins();
    console.log('Educational plugins:', Object.keys(educationalPlugins));
    
    alert(`Total plugins: ${Object.keys(plugins).length}\nEducational plugins: ${Object.keys(educationalPlugins).length}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDFme Integration Test</h1>
        <p className="text-gray-600">Testing pdfme v5.4.0 integration with educational plugins</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium mb-2">Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Control Panel */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium mb-4">Test Controls</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleValidateTemplate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            Validate Template
          </button>
          <button
            onClick={handleTestPlugins}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={isLoading}
          >
            Test Plugins
          </button>
          <button
            onClick={handleGeneratePDF}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            disabled={isLoading || !template}
          >
            Generate PDF
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            disabled={isLoading || !template}
          >
            Download Template
          </button>
        </div>
      </div>

      {/* Designer and Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Designer */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Designer</h2>
          <div className="border border-gray-200 rounded-lg bg-white" style={{ height: '600px' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading designer...</p>
                </div>
              </div>
            ) : (
              <div ref={designerRef} className="w-full h-full" />
            )}
          </div>
        </div>

        {/* Viewer */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Viewer</h2>
          <div className="border border-gray-200 rounded-lg bg-white" style={{ height: '600px' }}>
            {template ? (
              <div ref={viewerRef} className="w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No template available for preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium mb-4">Debug Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Template Pages:</strong> {testTemplate.schemas.length}
          </div>
          <div>
            <strong>Template Fields:</strong> {testTemplate.schemas.reduce((total, page) => total + page.length, 0)}
          </div>
          <div>
            <strong>Available Plugins:</strong> {Object.keys(pdfmeIntegration.getPlugins()).length}
          </div>
          <div>
            <strong>Educational Plugins:</strong> {Object.keys(getEducationalPlugins()).length}
          </div>
        </div>
      </div>

      {/* Sample Data */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium mb-4">Sample Data</h3>
        <pre className="text-xs text-gray-700 overflow-x-auto">
          {JSON.stringify(sampleData, null, 2)}
        </pre>
      </div>
    </div>
  );
}