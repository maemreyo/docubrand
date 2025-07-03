"use client"

// Fabric.js types will be imported dynamically to avoid SSR issues
// Using any for now to avoid build errors
type FabricObject = any;
type FabricIEvent = any;

// =================
// CORE TYPES
// =================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// =================
// BLOCK SYSTEM
// =================

export type BlockType = 
  | 'text' 
  | 'image' 
  | 'table' 
  | 'chart' 
  | 'qr-code' 
  | 'barcode' 
  | 'signature'
  | 'shape'
  | 'line'
  | 'rectangle'
  | 'circle';

export interface BaseBlock {
  id: string;
  type: BlockType;
  position: Position;
  size: Size;
  rotation: number;
  locked: boolean;
  visible: boolean;
  layer: number;
  opacity: number;
  zIndex: number;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}

export interface BlockStyle {
  borderWidth: number;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  backgroundColor: string;
  shadow: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  cornerRadius: number;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textDecoration: 'none' | 'underline' | 'line-through';
  direction: 'ltr' | 'rtl';
  language: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  fit: 'cover' | 'contain' | 'fill' | 'scale-down';
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sepia: number;
    grayscale: number;
  };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  rows: number;
  columns: number;
  data: TableCell[][];
  headerStyle: CellStyle;
  cellStyle: CellStyle;
  borderStyle: BorderStyle;
  alternateRowColors: boolean;
  alternateRowColor: string;
}

export interface TableCell {
  content: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  style?: Partial<CellStyle>;
  colSpan: number;
  rowSpan: number;
}

export interface CellStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  padding: Margins;
}

export interface BorderStyle {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export type Block = TextBlock | ImageBlock | TableBlock;

// =================
// TEMPLATE SYSTEM
// =================

export type TemplateCategory = 
  | 'academic' 
  | 'business' 
  | 'creative' 
  | 'certificate' 
  | 'report' 
  | 'invoice' 
  | 'newsletter'
  | 'flyer'
  | 'presentation';

export type PageSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Tabloid' | 'Custom';

export interface PageDimensions {
  width: number;
  height: number;
  unit: 'mm' | 'inch' | 'px' | 'pt';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  
  // Page setup
  pageSize: PageSize;
  customDimensions?: PageDimensions;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  
  // Content
  blocks: Block[];
  variables: TemplateVariable[];
  
  // Branding
  brandingRules: BrandingRules;
  
  // Metadata
  metadata: TemplateMetadata;
  
  // Preview
  thumbnail: string;
  previewData: any;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'image' | 'boolean' | 'array' | 'object';
  defaultValue: any;
  required: boolean;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface BrandingRules {
  logoPlacement: LogoRule[];
  colorScheme: ColorScheme;
  typography: TypographyRules;
  customElements: BrandElement[];
}

export interface LogoRule {
  position: 'header-left' | 'header-center' | 'header-right' | 'footer-left' | 'footer-center' | 'footer-right' | 'custom';
  customPosition?: Position;
  maxSize: Size;
  padding: Margins;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  custom: Record<string, string>;
}

export interface TypographyRules {
  primaryFont: FontRule;
  secondaryFont: FontRule;
  headingFont: FontRule;
  bodyFont: FontRule;
  customFonts: Record<string, FontRule>;
}

export interface FontRule {
  family: string;
  fallbacks: string[];
  sizes: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    body: number;
    caption: number;
  };
  weights: {
    light: string;
    normal: string;
    medium: string;
    bold: string;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

export interface BrandElement {
  id: string;
  type: 'watermark' | 'border' | 'pattern' | 'frame';
  position: Position;
  size: Size;
  style: any;
  opacity: number;
  blendMode: string;
}

export interface TemplateMetadata {
  createdAt: string;
  updatedAt: string;
  version: string;
  author: string;
  license: string;
  downloadCount: number;
  rating: number;
  featured: boolean;
  compatibility: string[];
  languages: string[];
}

export interface BoundTemplate extends Template {
  boundData: Record<string, any>;
  processedBlocks: Block[];
  generatedAt: string;
}

// =================
// CANVAS & EDITOR
// =================

export interface CanvasState {
  zoom: number;
  panOffset: Position;
  selectedObjects: string[];
  clipboard: Block[];
  grid: {
    enabled: boolean;
    size: number;
    color: string;
    opacity: number;
  };
  guides: {
    enabled: boolean;
    color: string;
    snapDistance: number;
  };
  rulers: {
    enabled: boolean;
    unit: 'mm' | 'inch' | 'px' | 'pt';
  };
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  blocks: string[];
  color: string;
}

export interface EditorConfig {
  canvas: {
    backgroundColor: string;
    width: number;
    height: number;
    dpi: number;
  };
  defaults: {
    fontSize: number;
    fontFamily: string;
    textColor: string;
    backgroundColor: string;
  };
  constraints: {
    minZoom: number;
    maxZoom: number;
    snapThreshold: number;
    gridSize: number;
  };
  features: {
    enableUndo: boolean;
    enableRedo: boolean;
    enableAutoSave: boolean;
    autoSaveInterval: number;
    maxHistorySize: number;
  };
}

// =================
// MULTI-LANGUAGE
// =================

export interface FontConfig {
  family: string;
  variants: FontVariant[];
  unicodeRanges: UnicodeRange[];
  direction: 'ltr' | 'rtl';
  fallbacks: string[];
  files: FontFiles;
  metrics: FontMetrics;
}

export interface FontVariant {
  weight: string;
  style: 'normal' | 'italic';
  file: string;
}

export interface UnicodeRange {
  start: number;
  end: number;
  description: string;
}

export interface FontFiles {
  regular: string;
  bold: string;
  italic: string;
  boldItalic: string;
  light?: string;
  medium?: string;
}

export interface FontMetrics {
  ascent: number;
  descent: number;
  lineGap: number;
  capHeight: number;
  xHeight: number;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  font: string;
  unicodeBlocks: string[];
  inputMethod?: string;
}

// =================
// PDF GENERATION
// =================

export interface PDFGenerationOptions {
  quality: 'draft' | 'standard' | 'high';
  compression: boolean;
  colorProfile: 'RGB' | 'CMYK' | 'Grayscale';
  embedFonts: boolean;
  includeMetadata: boolean;
  passwordProtection?: {
    enabled: boolean;
    userPassword?: string;
    ownerPassword?: string;
    permissions: PDFPermissions;
  };
}

export interface PDFPermissions {
  printing: boolean;
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  extracting: boolean;
  assembling: boolean;
  printingHighQuality: boolean;
}

// =================
// DATA BINDING
// =================

export interface DataSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, DataSchema>;
  items?: DataSchema;
  required?: string[];
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface DataBinding {
  path: string;
  blockId: string;
  property: string;
  transformer?: string;
  defaultValue?: any;
}

// =================
// INTEGRATION
// =================

export interface IntegrationConfig {
  legacyCompatibility: boolean;
  migrationMode: boolean;
  apiEndpoints: {
    templates: string;
    fonts: string;
    assets: string;
  };
  features: {
    enableTemplateSharing: boolean;
    enableCloudSync: boolean;
    enableCollaboration: boolean;
  };
}

// =================
// FABRIC.JS EXTENSIONS
// =================

export interface FabricObjectWithId extends FabricObject {
  id: string;
  blockType: BlockType;
  blockData: Block;
}

export interface CanvasEvents {
  'object:added': (e: FabricIEvent) => void;
  'object:removed': (e: FabricIEvent) => void;
  'object:modified': (e: FabricIEvent) => void;
  'object:selected': (e: FabricIEvent) => void;
  'selection:created': (e: FabricIEvent) => void;
  'selection:updated': (e: FabricIEvent) => void;
  'selection:cleared': (e: FabricIEvent) => void;
  'path:created': (e: FabricIEvent) => void;
  'mouse:down': (e: FabricIEvent) => void;
  'mouse:move': (e: FabricIEvent) => void;
  'mouse:up': (e: FabricIEvent) => void;
}