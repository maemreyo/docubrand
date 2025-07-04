// CREATED: 2025-07-04 - pdfme Designer wrapper component

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Template, Schema } from '@pdfme/common';
import { Designer } from '@pdfme/ui';
import { pdfmeIntegration } from '@/lib/pdfme-integration';
import { getEducationalPlugins } from '@/lib/educational-plugins';
import { GeminiAnalysisResponse } from '@/types/gemini';
import { EducationalTemplate } from '@/types/pdfme-extensions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Download, 
  Eye, 
  Settings, 
  Layers, 
  Type,
  Image as ImageIcon,
  Table,
  CheckSquare,
  FileText,
  HelpCircle
} from 'lucide-react';

interface TemplateDesignerProps {
  initialTemplate?: Template;
  geminiAnalysis?: GeminiAnalysisResponse;
  onTemplateChange?: (template: Template) => void;
  onSave?: (template: Template) => void;
  onPreview?: (template: Template) => void;
  className?: string;
}

interface BlockLibraryItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'basic' | 'educational' | 'layout' | 'assessment';
  schema: Partial<Schema>;
}

export function TemplateDesigner({
  initialTemplate,
  geminiAnalysis,
  onTemplateChange,
  onSave,
  onPreview,
  className = ''
}: TemplateDesignerProps) {
  const designerRef = useRef<HTMLDivElement>(null);
  const designer = useRef<Designer | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template>(
    initialTemplate || pdfmeIntegration.createBlankTemplate()
  );
  const [isDesignerReady, setIsDesignerReady] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'blocks' | 'properties' | 'data'>('blocks');
  const [isLoading, setIsLoading] = useState(false);

  // Block library items
  const blockLibrary: BlockLibraryItem[] = [
    // Basic blocks
    {
      id: 'text',
      name: 'Text',
      description: 'Basic text field',
      icon: <Type className="w-4 h-4" />,
      category: 'basic',
      schema: {
        type: 'text',
        fontSize: 12,
        fontColor: '#000000',
        fontName: 'Roboto-Regular',
        alignment: 'left',
      }
    },
    {
      id: 'image',
      name: 'Image',
      description: 'Image placeholder',
      icon: <ImageIcon className="w-4 h-4" />,
      category: 'basic',
      schema: {
        type: 'image',
        width: 100,
        height: 100,
      }
    },
    {
      id: 'table',
      name: 'Table',
      description: 'Data table',
      icon: <Table className="w-4 h-4" />,
      category: 'basic',
      schema: {
        type: 'table',
        fontSize: 10,
        fontColor: '#000000',
      }
    },
    // Educational blocks
    {
      id: 'multipleChoice',
      name: 'Multiple Choice',
      description: 'Multiple choice question',
      icon: <CheckSquare className="w-4 h-4" />,
      category: 'educational',
      schema: {
        type: 'multipleChoice',
        fontSize: 12,
        fontColor: '#000000',
        educational: {
          questionType: 'multiple_choice',
          points: 1,
          difficulty: 'medium',
        }
      }
    },
    {
      id: 'trueFalse',
      name: 'True/False',
      description: 'True or false question',
      icon: <CheckSquare className="w-4 h-4" />,
      category: 'educational',
      schema: {
        type: 'trueFalse',
        fontSize: 12,
        fontColor: '#000000',
        educational: {
          questionType: 'true_false',
          points: 1,
        }
      }
    },
    {
      id: 'shortAnswer',
      name: 'Short Answer',
      description: 'Short answer question',
      icon: <FileText className="w-4 h-4" />,
      category: 'educational',
      schema: {
        type: 'shortAnswer',
        fontSize: 12,
        fontColor: '#000000',
        educational: {
          questionType: 'short_answer',
          points: 2,
        }
      }
    },
    {
      id: 'essay',
      name: 'Essay',
      description: 'Essay question',
      icon: <FileText className="w-4 h-4" />,
      category: 'educational',
      schema: {
        type: 'essay',
        fontSize: 12,
        fontColor: '#000000',
        educational: {
          questionType: 'essay',
          points: 10,
        }
      }
    },
    // Layout blocks
    {
      id: 'instructionBox',
      name: 'Instructions',
      description: 'Instruction box',
      icon: <HelpCircle className="w-4 h-4" />,
      category: 'layout',
      schema: {
        type: 'instructionBox',
        fontSize: 11,
        fontColor: '#333333',
        alignment: 'center',
      }
    },
    // Assessment blocks
    {
      id: 'rubric',
      name: 'Rubric',
      description: 'Grading rubric',
      icon: <Table className="w-4 h-4" />,
      category: 'assessment',
      schema: {
        type: 'rubric',
        fontSize: 10,
        fontColor: '#000000',
      }
    },
    {
      id: 'answerKey',
      name: 'Answer Key',
      description: 'Answer key section',
      icon: <CheckSquare className="w-4 h-4" />,
      category: 'assessment',
      schema: {
        type: 'answerKey',
        fontSize: 10,
        fontColor: '#000000',
      }
    },
  ];

  // Initialize designer
  useEffect(() => {
    if (designerRef.current && !designer.current) {
      initializeDesigner();
    }

    return () => {
      if (designer.current) {
        designer.current.destroy();
        designer.current = null;
      }
    };
  }, []);

  // Initialize pdfme designer
  const initializeDesigner = useCallback(async () => {
    if (!designerRef.current) return;

    try {
      setIsLoading(true);
      
      // Get educational plugins
      const plugins = getEducationalPlugins();
      
      designer.current = pdfmeIntegration.createDesigner(
        designerRef.current,
        currentTemplate,
        {
          lang: 'en',
          theme: {
            token: { colorPrimary: '#3b82f6' },
          },
          labels: {
            'multipleChoice': '📝 Multiple Choice',
            'trueFalse': '✅ True/False',
            'shortAnswer': '📄 Short Answer',
            'essay': '📋 Essay',
            'instructionBox': '💡 Instructions',
            'rubric': '📊 Rubric',
            'answerKey': '🔑 Answer Key',
          },
          icons: {
            multipleChoice: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>',
            trueFalse: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
            shortAnswer: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
          },
          zoomLevel: 1,
          sidebarOpen: false, // We'll use our own sidebar
        }
      );

      // Listen for template changes
      designer.current.onChangeTemplate((template) => {
        setCurrentTemplate(template);
        onTemplateChange?.(template);
      });

      // Listen for save events
      designer.current.onSaveTemplate((template) => {
        onSave?.(template);
      });

      setIsDesignerReady(true);
    } catch (error) {
      console.error('Failed to initialize designer:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTemplate, onTemplateChange, onSave]);

  // Update designer template
  useEffect(() => {
    if (designer.current && initialTemplate) {
      designer.current.updateTemplate(initialTemplate);
      setCurrentTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  // Handle template save
  const handleSave = useCallback(() => {
    if (designer.current) {
      const template = designer.current.getTemplate();
      onSave?.(template);
    }
  }, [onSave]);

  // Handle template preview
  const handlePreview = useCallback(() => {
    if (designer.current) {
      const template = designer.current.getTemplate();
      onPreview?.(template);
    }
  }, [onPreview]);

  // Handle template download
  const handleDownload = useCallback(() => {
    if (designer.current) {
      const template = designer.current.getTemplate();
      pdfmeIntegration.downloadTemplate(template, 'template.json');
    }
  }, []);

  // Add block from library
  const addBlockFromLibrary = useCallback((blockItem: BlockLibraryItem) => {
    if (!designer.current) return;

    const template = designer.current.getTemplate();
    const newSchema: Schema = {
      name: `${blockItem.id}_${Date.now()}`,
      position: { x: 20, y: 20 },
      width: 100,
      height: 20,
      ...blockItem.schema,
    } as Schema;

    // Add to first page
    if (template.schemas.length === 0) {
      template.schemas.push([]);
    }
    template.schemas[0].push(newSchema);

    designer.current.updateTemplate(template);
  }, []);

  // Group blocks by category
  const blocksByCategory = blockLibrary.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, BlockLibraryItem[]>);

  const categoryLabels = {
    basic: 'Basic Elements',
    educational: 'Educational',
    layout: 'Layout',
    assessment: 'Assessment',
  };

  const categoryColors = {
    basic: 'bg-blue-100 text-blue-800',
    educational: 'bg-green-100 text-green-800',
    layout: 'bg-purple-100 text-purple-800',
    assessment: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className={`template-designer flex h-full ${className}`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Template Designer</h2>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop elements to build your template
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-4">
            <TabsTrigger value="blocks" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Blocks
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Block Library */}
          <TabsContent value="blocks" className="flex-1 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {Object.entries(blocksByCategory).map(([category, blocks]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className={categoryColors[category as keyof typeof categoryColors]}>
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {blocks.map((block) => (
                        <Card 
                          key={block.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addBlockFromLibrary(block)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {block.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {block.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {block.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Properties Panel */}
          <TabsContent value="properties" className="flex-1 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Element Properties</CardTitle>
                    <CardDescription>
                      Select an element to edit its properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 text-center py-8">
                      No element selected
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Data Panel */}
          <TabsContent value="data" className="flex-1 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Data Sources</CardTitle>
                    <CardDescription>
                      Configure data bindings for your template
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {geminiAnalysis ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Available Data:</div>
                        <div className="space-y-2">
                          <div className="p-2 bg-gray-50 rounded text-xs">
                            <strong>Title:</strong> {geminiAnalysis.extractedContent.title || 'N/A'}
                          </div>
                          <div className="p-2 bg-gray-50 rounded text-xs">
                            <strong>Questions:</strong> {geminiAnalysis.extractedQuestions.length} found
                          </div>
                          <div className="p-2 bg-gray-50 rounded text-xs">
                            <strong>Sections:</strong> {geminiAnalysis.documentStructure.sections.length} found
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-8">
                        No data source connected
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={handlePreview} variant="outline" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Designer Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Header */}
        <div className="h-12 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {currentTemplate.schemas.length > 0 ? `${currentTemplate.schemas.length} page(s)` : 'No pages'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="text-sm text-gray-500">Loading designer...</div>
            )}
            {isDesignerReady && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Ready
              </Badge>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-50 p-4">
          <div 
            ref={designerRef} 
            className="w-full h-full border border-gray-200 rounded-lg bg-white shadow-sm"
            style={{ minHeight: '600px' }}
          />
        </div>
      </div>
    </div>
  );
}