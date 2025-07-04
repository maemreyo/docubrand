// CREATED: 2025-07-04 - Export barrel for template designer components

export { default as DesignerSidebar } from './DesignerSidebar';
export { default as DesignerToolbar } from './DesignerToolbar';
export { default as DesignerCanvas } from './DesignerCanvas';
export { default as BlockLibrary } from './BlockLibrary';
export { default as TemplateManager } from './TemplateManager';

export type { EducationalBlock } from './BlockLibrary';

// Re-export the main container component
export { default as TemplateDesigner } from '../TemplateDesigner';