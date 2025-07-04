// CREATED: 2025-07-04 - Template preview component with PDF viewer

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Template } from '@pdfme/common';
import { Viewer, Form } from '@pdfme/ui';
import { pdfmeIntegration } from '@/lib/pdfme-integration';
import { GeminiAnalysisResponse } from '@/types/gemini';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  Edit, 
  Download, 
  FileText, 
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface TemplatePreviewProps {
  template: Template;
  sampleData?: any;
  geminiAnalysis?: GeminiAnalysisResponse;
  mode?: 'viewer' | 'form';
  onDataChange?: (data: any) => void;
  onGeneratePDF?: (template: Template, data: any) => void;
  className?: string;
}

export function TemplatePreview({
  template,
  sampleData,
  geminiAnalysis,
  mode = 'viewer',
  onDataChange,
  onGeneratePDF,
  className = ''
}: TemplatePreviewProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | Form | null>(null);
  const [currentMode, setCurrentMode] = useState<'viewer' | 'form'>(mode);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<any>(sampleData || {});
  const [zoomLevel, setZoomLevel] = useState(1);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize viewer/form
  useEffect(() => {
    if (viewerRef.current && template) {
      initializeViewer();
    }

    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, [template, currentMode]);

  // Initialize pdfme viewer or form
  const initializeViewer = useCallback(async () => {
    if (!viewerRef.current) return;

    try {
      setIsLoading(true);
      setPreviewError(null);

      // Prepare input data
      const inputData = currentData || generateSampleData();
      const inputs = Array.isArray(inputData) ? inputData : [inputData];

      // Create viewer or form
      if (currentMode === 'viewer') {
        viewer.current = pdfmeIntegration.createViewer(
          viewerRef.current,
          template,
          inputs,
          {
            lang: 'en',
            zoomLevel,
          }
        );
      } else {
        viewer.current = pdfmeIntegration.createForm(
          viewerRef.current,
          template,
          inputs,
          {
            lang: 'en',
            zoomLevel,
          }
        );

        // Listen for form changes
        if (typeof (viewer.current as Form).onChangeInputs === 'function') {
          (viewer.current as Form).onChangeInputs((inputs) => {
            setCurrentData(inputs[0]);
            onDataChange?.(inputs[0]);
          });
        }
      }

      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize preview:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to initialize preview');
    } finally {
      setIsLoading(false);
    }
  }, [template, currentMode, currentData, zoomLevel, onDataChange]);

  // Generate sample data from template
  const generateSampleData = useCallback(() => {
    if (geminiAnalysis) {
      return generateDataFromGeminiAnalysis(geminiAnalysis);
    }

    // Generate basic sample data from template schema
    const sampleData: any = {};
    
    template.schemas.forEach((page) => {
      page.forEach((schema) => {
        if (schema.name) {
          switch (schema.type) {
            case 'text':
              sampleData[schema.name] = schema.content || 'Sample text';
              break;
            case 'image':
              sampleData[schema.name] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
              break;
            case 'multipleChoice':
              sampleData[schema.name] = {
                content: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid']
              };
              break;
            case 'trueFalse':
              sampleData[schema.name] = {
                content: 'The Earth is round.'
              };
              break;
            case 'shortAnswer':
              sampleData[schema.name] = {
                content: 'What is photosynthesis?'
              };
              break;
            case 'essay':
              sampleData[schema.name] = {
                content: 'Discuss the impact of climate change on global ecosystems.'
              };
              break;
            default:
              sampleData[schema.name] = schema.content || 'Sample content';
          }
        }
      });
    });

    return sampleData;
  }, [template, geminiAnalysis]);

  // Generate data from Gemini analysis
  const generateDataFromGeminiAnalysis = useCallback((analysis: GeminiAnalysisResponse) => {
    const data: any = {
      // Document metadata
      documentTitle: analysis.extractedContent.title || 'Sample Document',
      documentSubtitle: analysis.extractedContent.subtitle || '',
      documentInfo: [
        analysis.extractedContent.author && `Author: ${analysis.extractedContent.author}`,
        analysis.extractedContent.course && `Course: ${analysis.extractedContent.course}`,
      ].filter(Boolean).join(' | '),
    };

    // Add sections
    analysis.documentStructure.sections.forEach((section, index) => {
      data[`section_${index}_content`] = section.content;
      if (section.type === 'header') {
        data[`section_${index}_header`] = section.content;
      }
    });

    // Add questions
    analysis.extractedQuestions.forEach((question, index) => {
      data[`question_${index}_content`] = question.content;
      
      if (question.type === 'multiple_choice' && question.options) {
        question.options.forEach((option, optionIndex) => {
          data[`question_${index}_option_${optionIndex}`] = option;
        });
      }
    });

    return data;
  }, []);

  // Handle mode change
  const handleModeChange = useCallback((newMode: 'viewer' | 'form') => {
    setCurrentMode(newMode);
  }, []);

  // Handle zoom change
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(Math.max(0.25, Math.min(4, newZoom)));
  }, []);

  // Handle PDF generation
  const handleGeneratePDF = useCallback(async () => {
    if (!template || isGenerating) return;

    try {
      setIsGenerating(true);
      
      // Get current data
      let dataToUse = currentData;
      if (currentMode === 'form' && viewer.current) {
        dataToUse = (viewer.current as Form).getInputs()[0];
      }

      if (onGeneratePDF) {
        await onGeneratePDF(template, dataToUse);
      } else {
        // Generate and download PDF
        await pdfmeIntegration.downloadPDF(template, [dataToUse], 'preview.pdf');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setPreviewError('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [template, currentData, currentMode, onGeneratePDF, isGenerating]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    initializeViewer();
  }, [initializeViewer]);

  return (
    <div className={`template-preview flex h-full ${className}`}>
      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Tabs value={currentMode} onValueChange={handleModeChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="viewer" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Viewer
                </TabsTrigger>
                <TabsTrigger value="form" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Form
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {isReady && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Ready
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-gray-200 rounded">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoomChange(zoomLevel - 0.25)}
                disabled={zoomLevel <= 0.25}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="px-2 text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoomChange(zoomLevel + 0.25)}
                disabled={zoomLevel >= 4}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating || !isReady}
              size="sm"
            >
              <Download className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-gray-50 p-4">
          {previewError ? (
            <Card className="max-w-md mx-auto mt-8">
              <CardHeader>
                <CardTitle className="text-red-600">Preview Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{previewError}</p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="w-full h-full border border-gray-200 rounded-lg bg-white shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading preview...</p>
                  </div>
                </div>
              ) : (
                <div ref={viewerRef} className="w-full h-full" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Preview Settings</h3>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pages:</span>
                  <span className="font-medium">{template.schemas.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fields:</span>
                  <span className="font-medium">
                    {template.schemas.reduce((total, page) => total + page.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">
                    {template.basePdf?.width || 210} × {template.basePdf?.height || 297} mm
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Data Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sample Data</CardTitle>
                <CardDescription>
                  Data used for preview generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded p-3">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(currentData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Gemini Analysis Info */}
            {geminiAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Source Analysis</CardTitle>
                  <CardDescription>
                    Information from Gemini analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{geminiAnalysis.extractedQuestions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sections:</span>
                    <span className="font-medium">{geminiAnalysis.documentStructure.sections.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">{geminiAnalysis.documentStructure.subject}</span>
                  </div>
                  {geminiAnalysis.extractedContent.author && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Author:</span>
                      <span className="font-medium">{geminiAnalysis.extractedContent.author}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Zoom Level</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.25"
                      max="4"
                      step="0.25"
                      value={zoomLevel}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 min-w-[45px]">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={currentMode === 'viewer' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleModeChange('viewer')}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Viewer
                    </Button>
                    <Button
                      variant={currentMode === 'form' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleModeChange('form')}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Form
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}