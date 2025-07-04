// Integration component that connects PDF Template System with existing DocuBrand workflow

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, 
  Eye, 
  Download, 
  Settings, 
  Layers, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowRight,
  File
} from 'lucide-react';

import { PDFTemplateDesigner } from './PDFTemplateDesigner';
import { TemplateLibrary } from './TemplateLibrary';
import type { GeminiAnalysisResponse } from '@/types/gemini';
import type { BrandKit } from '@/types';
import {
  DocuBrandTemplate,
  TemplateCreationResult,
  TemplateLibraryEntry
} from '@/lib/pdf-template-system/types/template-types';
import { getPDFTemplateSystem } from '@/lib/pdf-template-system/PDFTemplateSystem';

interface TemplateSystemIntegrationProps {
  analysisResult: GeminiAnalysisResponse;
  brandKit: BrandKit;
  onPDFGenerated?: (pdf: Uint8Array) => void;
  onClose?: () => void;
  className?: string;
}

interface IntegrationState {
  step: 'library' | 'create' | 'design' | 'generate';
  isLoading: boolean;
  error: string | null;
  selectedTemplate: DocuBrandTemplate | null;
  createdTemplate: DocuBrandTemplate | null;
  generatedPDF: Uint8Array | null;
  showLibrary: boolean;
  showDesigner: boolean;
  templateCreationResult: TemplateCreationResult | null;
}

export function TemplateSystemIntegration({
  analysisResult,
  brandKit,
  onPDFGenerated,
  onClose,
  className = ''
}: TemplateSystemIntegrationProps) {
  const [state, setState] = useState<IntegrationState>({
    step: 'library',
    isLoading: false,
    error: null,
    selectedTemplate: null,
    createdTemplate: null,
    generatedPDF: null,
    showLibrary: true,
    showDesigner: false,
    templateCreationResult: null
  });

  const templateSystem = getPDFTemplateSystem();

  // Initialize template system
  useEffect(() => {
    initializeSystem();
  }, []);

  /**
   * Initialize the template system
   */
  const initializeSystem = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await templateSystem.initialize();
      
      // Check if we have any templates, if not create samples
      const templates = await templateSystem.getTemplateLibrary();
      
      if (templates.length === 0) {
        console.log('📝 No templates found, creating samples...');
        await templateSystem.createSampleTemplates();
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      
    } catch (error) {
      console.error('❌ Template system initialization failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  }, [templateSystem]);

  /**
   * Create new template from analysis
   */
  const handleCreateTemplate = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, step: 'create' }));
      
      const result = await templateSystem.createTemplateFromAnalysis(analysisResult);
      
      if (result.success && result.template) {
        setState(prev => ({ 
          ...prev, 
          createdTemplate: result.template!,
          templateCreationResult: result,
          isLoading: false,
          step: 'design',
          showDesigner: true,
          showLibrary: false
        }));
        
        console.log('✅ Template created successfully:', result.template.id);
      } else {
        throw new Error(result.errors?.[0] || 'Template creation failed');
      }
      
    } catch (error) {
      console.error('❌ Template creation failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Template creation failed'
      }));
    }
  }, [analysisResult, templateSystem]);

  /**
   * Select existing template
   */
  const handleTemplateSelect = useCallback(async (template: DocuBrandTemplate) => {
    try {
      setState(prev => ({ 
        ...prev, 
        selectedTemplate: template,
        step: 'generate'
      }));
      
      console.log('✅ Template selected:', template.id);
      
    } catch (error) {
      console.error('❌ Template selection failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Template selection failed'
      }));
    }
  }, []);

  /**
   * Edit template in designer
   */
  const handleTemplateEdit = useCallback(async (template: DocuBrandTemplate) => {
    try {
      setState(prev => ({ 
        ...prev, 
        selectedTemplate: template,
        step: 'design',
        showDesigner: true,
        showLibrary: false
      }));
      
      console.log('✅ Opening template for editing:', template.id);
      
    } catch (error) {
      console.error('❌ Template edit failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Template edit failed'
      }));
    }
  }, []);

  /**
   * Generate PDF from template
   */
  const handleGeneratePDF = useCallback(async (template: DocuBrandTemplate) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, step: 'generate' }));
      
      // Prepare data from analysis result
      const data = {
        // Basic document info
        title: analysisResult.extractedContent?.title || 'Document',
        subtitle: analysisResult.extractedContent?.subtitle || '',
        
        // Sections
        sections: analysisResult.documentStructure.sections?.map(section => ({
          content: section.content,
          type: section.type
        })) || [],
        
        // Questions
        questions: analysisResult.extractedQuestions?.map(question => ({
          content: question.content,
          type: question.type,
          options: question.options || []
        })) || [],
        
        // Metadata
        metadata: {
          subject: analysisResult.documentStructure.subject,
          difficulty: analysisResult.documentStructure.difficulty,
          estimatedTime: analysisResult.documentStructure.estimatedTime
        },
        
        // Brand information
        brand: {
          name: brandKit.companyName || 'Company Name',
          logo: brandKit.logo?.url || '',
          color: brandKit.primaryColor || '#000000'
        }
      };
      
      // Generate PDF
      const pdfBuffer = await templateSystem.generatePDFFromTemplate(template, data, {
        title: template.name,
        creator: 'DocuBrand Template System',
        author: brandKit.companyName || 'DocuBrand User'
      });
      
      setState(prev => ({ 
        ...prev, 
        generatedPDF: pdfBuffer,
        isLoading: false
      }));
      
      if (onPDFGenerated) {
        onPDFGenerated(pdfBuffer);
      }
      
      console.log('✅ PDF generated successfully');
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'PDF generation failed'
      }));
    }
  }, [analysisResult, brandKit, templateSystem, onPDFGenerated]);

  /**
   * Download generated PDF
   */
  const handleDownloadPDF = useCallback(() => {
    if (state.generatedPDF) {
      const blob = new Blob([state.generatedPDF], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${analysisResult.extractedContent?.title || 'document'}_branded.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded');
    }
  }, [state.generatedPDF, analysisResult]);

  /**
   * Render workflow steps
   */
  const renderWorkflowSteps = () => {
    const steps = [
      { id: 'library', label: 'Choose Template', icon: File },
      { id: 'create', label: 'Create New', icon: Wand2 },
      { id: 'design', label: 'Design', icon: Layers },
      { id: 'generate', label: 'Generate PDF', icon: FileText }
    ];
    
    return (
      <div className="flex items-center gap-2 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = state.step === step.id;
          const isCompleted = steps.findIndex(s => s.id === state.step) > index;
          
          return (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : isCompleted 
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  /**
   * Render template creation result
   */
  const renderCreationResult = () => {
    if (!state.templateCreationResult) return null;
    
    const result = state.templateCreationResult;
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Template Created Successfully
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Sections Processed:</span> {result.stats.sectionsProcessed}
              </div>
              <div>
                <span className="font-medium">Questions Processed:</span> {result.stats.questionsProcessed}
              </div>
              <div>
                <span className="font-medium">Schemas Generated:</span> {result.stats.schemasGenerated}
              </div>
              <div>
                <span className="font-medium">Processing Time:</span> {result.stats.processingTime}ms
              </div>
            </div>
            
            {result.warnings && result.warnings.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Warnings:</span>
                </div>
                <ul className="text-sm text-amber-700 space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Suggestions:</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render analysis summary
   */
  const renderAnalysisSummary = () => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Document Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Document Type:</span> {analysisResult.documentStructure.type}
            </div>
            <div>
              <span className="font-medium">Subject:</span> {analysisResult.documentStructure.subject}
            </div>
            <div>
              <span className="font-medium">Difficulty:</span> {analysisResult.documentStructure.difficulty}
            </div>
            <div>
              <span className="font-medium">Estimated Time:</span> {analysisResult.documentStructure.estimatedTime} min
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{analysisResult.documentStructure.type}</Badge>
            <Badge variant="secondary">{analysisResult.documentStructure.difficulty}</Badge>
            {analysisResult.documentStructure.sections && (
              <Badge variant="outline">{analysisResult.documentStructure.sections.length} sections</Badge>
            )}
            {analysisResult.extractedQuestions && (
              <Badge variant="outline">{analysisResult.extractedQuestions.length} questions</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">PDF Template System</h2>
          
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        
        {renderWorkflowSteps()}
      </div>

      {/* Error Display */}
      {state.error && (
        <Card className="flex-shrink-0 mb-4 border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {state.isLoading && (
        <Card className="flex-shrink-0 mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {state.step === 'create' ? 'Creating template...' :
                 state.step === 'generate' ? 'Generating PDF...' :
                 'Loading...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={state.step} className="w-full">
          {/* Template Library */}
          <TabsContent value="library" className="mt-0">
            <div className="space-y-4">
              {renderAnalysisSummary()}
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Choose Template</CardTitle>
                    <Button onClick={handleCreateTemplate} disabled={state.isLoading}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Create from Analysis
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <TemplateLibrary
                    onTemplateSelect={handleTemplateSelect}
                    onTemplateEdit={handleTemplateEdit}
                    showActions={true}
                    className="h-96"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Template Creation */}
          <TabsContent value="create" className="mt-0">
            <div className="space-y-4">
              {renderAnalysisSummary()}
              {renderCreationResult()}
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Wand2 className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                    <h3 className="font-medium mb-2">Creating Template</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Converting your document analysis into a reusable template...
                    </p>
                    
                    {state.isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    ) : (
                      <Button onClick={handleCreateTemplate}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Create Template
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Template Design */}
          <TabsContent value="design" className="mt-0">
            <div className="h-full">
              {state.showDesigner && (state.createdTemplate || state.selectedTemplate) && (
                <PDFTemplateDesigner
                  analysisResult={analysisResult}
                  existingTemplate={state.createdTemplate || state.selectedTemplate!}
                  onTemplateCreated={(template) => {
                    setState(prev => ({ ...prev, createdTemplate: template }));
                  }}
                  onTemplateUpdated={(template) => {
                    setState(prev => ({ 
                      ...prev, 
                      createdTemplate: template,
                      selectedTemplate: template
                    }));
                  }}
                  className="h-full"
                />
              )}
            </div>
          </TabsContent>

          {/* PDF Generation */}
          <TabsContent value="generate" className="mt-0">
            <div className="space-y-4">
              {renderAnalysisSummary()}
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Generate PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(state.selectedTemplate || state.createdTemplate) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Selected Template</h4>
                        <div className="text-sm text-gray-600">
                          <div><strong>Name:</strong> {(state.selectedTemplate || state.createdTemplate)!.name}</div>
                          <div><strong>Category:</strong> {(state.selectedTemplate || state.createdTemplate)!.category}</div>
                          <div><strong>Version:</strong> {(state.selectedTemplate || state.createdTemplate)!.version}</div>
                        </div>
                      </div>
                    )}
                    
                    {state.generatedPDF ? (
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                        <h3 className="font-medium mb-2">PDF Generated Successfully!</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Your branded PDF is ready for download.
                        </p>
                        
                        <div className="flex gap-2 justify-center">
                          <Button onClick={handleDownloadPDF}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            onClick={() => setState(prev => ({ ...prev, step: 'library' }))}
                          >
                            Create Another
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                        <h3 className="font-medium mb-2">Ready to Generate PDF</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Generate your branded PDF using the selected template.
                        </p>
                        
                        <Button 
                          onClick={() => handleGeneratePDF((state.selectedTemplate || state.createdTemplate)!)}
                          disabled={!state.selectedTemplate && !state.createdTemplate || state.isLoading}
                        >
                          {state.isLoading ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Generate PDF
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}