Bạn nghĩ sao về kế hoạch phát triển PDF Builder với hệ thống template như chúng ta đã thảo luận?

Hiện tại, chúng ta có thể đã có các component và file liên quan đến xử lý PDF, nhưng chúng có thể sẽ sớm trở nên lỗi thời so so với hệ thống template được thiết kế dưới đây. Do đó, hãy bắt đầu phát triển hệ thống template một cách độc lập. Sau đó, chúng ta sẽ cần các tác vụ để tích hợp nó với hệ thống hiện có.

Ví dụ, cần có cơ chế để tải dữ liệu API (đây là ví dụ về response `/sampleResponse.json`), tạo các block template và file template từ dữ liệu này.

**Ý tưởng tổng thể:**
Tôi đang xây dựng một trình tạo tài liệu với branding mới dành cho người dùng không chuyên về kỹ thuật. Quy trình sẽ như sau:
1.  Người dùng tải lên một file PDF cũ.
2.  Gemini sẽ trích xuất văn bản và cấu trúc tài liệu theo các kiểu đầu ra cụ thể. Các kiểu đầu ra này được định nghĩa trong `GeminiAnalysisResponse` tại `src/types/gemini.ts` (`GeminiAnalysisResponse`).
3.  Từ các kiểu đầu ra của Gemini, người dùng có thể tạo các "block template" nhỏ (ví dụ: block template cho Header, Footer, các câu hỏi đúng/sai, trắc nghiệm, bảng đánh dấu đúng/sai, v.v.).
4.  Tôi muốn tạo một cơ chế để xây dựng các "template lớn" (ví dụ: tài liệu ôn tập, bài kiểm tra, ... (tương lai có thể nhiều hơn, nhưng tạm thời để 2 template này trước)) từ các block template nhỏ này. Hệ thống sẽ gợi ý việc tạo các block template thay vì tạo toàn bộ template cho một tài liệu ôn tập hay bài kiểm tra.

**Mục tiêu:**
Hệ thống có khả năng trích xuất văn bản và tạo file PDF từ văn bản đó chỉ với một cú nhấp chuột.

**Yêu cầu kỹ thuật:**
*   Code phải sạch (clean code) và tuân thủ nguyên tắc Tách biệt mối quan tâm (Separation of Concern).
*   **Phân chia Component:** Tránh các file quá dài. Tuy nhiên, cũng không nên phân mảnh quá mức. Hãy nhóm các chức năng liên quan vào cùng một component hoặc module, đảm bảo tính dễ đọc và dễ bảo trì.
*   **Nguyên tắc thiết kế UI/UX:**
    *   **Phân chia giai đoạn rõ ràng:** Mỗi giai đoạn chính trong quy trình (Tải lên & Phân tích, Thiết kế Template, Nhập dữ liệu, Tạo PDF) nên được đại diện bằng một trang/view riêng biệt, sử dụng tab, wizard hoặc route rõ ràng.
    *   **Tối ưu hóa không gian hiển thị PDF:** Trong giao diện thiết kế, khu vực canvas hiển thị PDF preview phải là trung tâm. Các bảng điều khiển thông tin (Block Library, Properties Panel, Data Manager) nên có cơ chế ẩn/hiện (collapsible/expandable) hoặc tab để tối đa hóa không gian cho preview. Các tác vụ phụ có thể dùng modal/drawer.
*   **Lưu ý quan trọng về Gemini Types:** Luôn tham chiếu và tuân thủ chặt chẽ cấu trúc dữ liệu từ `GeminiAnalysisResponse` (được định nghĩa tại `src/types/gemini.ts`). Các trường `type`, `semanticRole`, `content`, và `position` là nền tảng để tự động hóa việc tạo block và data binding. Việc hiểu rõ các loại này sẽ giúp xây dựng các plugin và luồng làm việc hiệu quả.
*   **Lưu ý quan trọng về PDFme Fields:** Tất cả các trường (fields) trong `pdfme` cần có tên chuẩn và duy nhất để tránh lỗi trong quá trình tạo template và xử lý dữ liệu.
*   Sử dụng hệ thống package `pdfme`. Các file quan trọng để tham khảo trong thư mục `demo-pdfme/playground` bao gồm:
    *   Demo folder từ PDFme: `/demo-pdfme/playground`
    *   File chính: `/demo-pdfme/playground/src/App.tsx` (để hiểu cách `pdfme` được tích hợp và các route liên quan đến Designer, FormAndViewer, Templates).
    *   Các file khác trong `demo-pdfme/playground/src/routes/` và `demo-pdfme/playground/src/components/` cũng rất hữu ích để hiểu sâu hơn về cách `pdfme` được sử dụng.

**Lưu ý chung về thiết kế và phát triển:**
*   **Tầm quan trọng của Gemini Types:** Luôn tham chiếu và tuân thủ chặt chẽ cấu trúc dữ liệu từ `GeminiAnalysisResponse` (được định nghĩa tại `src/types/gemini.ts`). Các trường `type`, `semanticRole`, `content`, và `position` là nền tảng để tự động hóa việc tạo block và data binding. Việc hiểu rõ các loại này sẽ giúp xây dựng các plugin và luồng làm việc hiệu quả.
*   **Tối ưu hóa không gian UI:** Khi thiết kế giao diện người dùng, đặc biệt là trong PDFme Designer, hãy ưu tiên tối đa hóa không gian hiển thị cho bản xem trước PDF. Các bảng điều khiển chứa thông tin chi tiết về file, template, thuộc tính block, v.v., nên có cơ chế ẩn/hiện (collapsible/expandable) hoặc tab để người dùng có thể dễ dàng truy cập khi cần mà không làm che khuất khu vực xem trước chính.


IDEA
```
# Thiết Kế Chi Tiết PDF Template System với PDFme

## 1. TỔNG QUAN KIẾN TRÚC

### **Core Components:**
```
📁 PDF Template System
├── 🎨 Template Designer (Sử dụng @pdfme/ui để cung cấp giao diện thiết kế)
├── 📊 Data Management Layer
├── 🌐 Multi-language Engine
├── 📄 PDF Generation Engine (Sử dụng @pdfme/generator để tạo PDF)
├── 💾 Template Storage System
└── 🔧 Plugin System (Mở rộng các loại trường của PDFme)
```

### **User Flow:**
```
1. Upload JSON Data → 2. Choose/Create Template → 3. Design Layout (Sử dụng PDFme Designer) → 
4. Configure Multi-language → 5. Preview → 6. Generate PDF
```

## 2. TEMPLATE DESIGNER ARCHITECTURE

### **A. Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│                    Header Toolbar                    │
├─────────────┬─────────────────────┬─────────────────┤
│             │                     │                 │
│   Block     │    Canvas Area      │   Properties    │
│   Library   │    (PDFme UI)       │     Panel       │
│             │                     │                 │
├─────────────┴─────────────────────┴─────────────────┤
│              Data & Template Panel                   │
└─────────────────────────────────────────────────────┘
```

### **B. Component Hierarchy:**
```
PDFTemplateEditor
├── HeaderToolbar
│   ├── FileOperations (Save/Load/Export)
│   ├── LanguageSelector
│   ├── PreviewButton
│   └── GenerateButton
├── MainWorkspace
│   ├── BlockLibrary (Các loại trường (fields) của PDFme và các Custom Plugin)
│   │   ├── TextBlock (PDFme Text Field - Nâng cao để hỗ trợ Rich Text)
│   │   ├── ImageBlock (PDFme Image Field)
│   │   ├── ListBlock (Custom Plugin cho danh sách)
│   │   ├── TableBlock (Custom Plugin cho bảng)
│   │   ├── MultipleChoiceQuestionBlock (Custom Plugin cho câu hỏi trắc nghiệm)
│   ├── DesignCanvas (PDFme Designer - Giao diện chính để kéo thả và chỉnh sửa)
│   └── PropertiesPanel (Chỉnh sửa thuộc tính của các trường PDFme)
│       ├── BlockProperties
│       ├── StyleProperties
│       ├── DataBindingProperties
│       └── LanguageProperties
└── BottomPanel
    ├── DataManager
    ├── TemplateManager
    └── PreviewPanel
```

## 3. DATA MANAGEMENT LAYER

### **A. JSON Data Structure:**
```json
{
  "metadata": {
    "version": "1.0",
    "createdAt": "2024-07-04T00:00:00Z",
    "language": "vi",
    "fallbackLanguage": "en"
  },
  "document": {
    "title": "PHIẾU HỌC TẬP",
    "subtitle": "Luyện tập mệnh đề (Tiết 3)",
    "author": "Thầy Lưu Huy Thưởng – Thầy Nguyễn Mạnh Cường",
    "course": "Khóa học Học tốt Toán 10 – Kết nối tri thức với cuộc sống",
    "sections": [
      {
        "id": "sec_p1_header_01",
        "type": "header",
        "content": "Tài Liệu Ôn Thi Group"
      },
      {
        "id": "sec_p1_content_01",
        "type": "text",
        "content": "Mệnh đề\nKhẳng định\nHoặc đúng hoặc sai,\nkhông thể vừa đúng vừa sai"
      }
    ],
    "questions": [
      {
        "id": "q_p2_b1_01",
        "number": "Bài 1 - 1",
        "content": "Bài này dài quá!",
        "type": "multiple_choice",
        "options": [
          "Không phải mệnh đề",
          "Mệnh đề Đúng",
          "Mệnh đề Sai",
          "Mệnh đề chứa biến"
        ]
      }
    ]
  },
  "i18n": {
    "en": {
      "documentTitle": "STUDY SHEET",
      "questionTypeMultipleChoice": "Multiple Choice"
    },
    "vi": {
      "documentTitle": "PHIẾU HỌC TẬP",
      "questionTypeMultipleChoice": "Trắc nghiệm"
    }
  }
}
```

### **B. Data Binding System:**
```typescript
interface DataBinding {
  path: string;           // "document.questions[0].content"
  type: 'text' | 'image' | 'table' | 'list';
  format?: string;        // Date format, number format
  i18nKey?: string;       // For translatable content
  fallback?: string;      // Default value
  transformer?: string;   // Custom data transformation
}

// Example bindings
const bindings = {
  documentTitle: {
    path: "document.title",
    type: "text",
    i18nKey: "documentTitle", // Assuming i18n for title
    fallback: "Untitled Document"
  },
  firstQuestionContent: {
    path: "document.questions[0].content",
    type: "text"
  },
  firstQuestionOptions: {
    path: "document.questions[0].options",
    type: "list" // Assuming a list type for options
  },
  sectionHeader: {
    path: "document.sections[0].content",
    type: "text"
  }
};
```
```

## 4. MULTI-LANGUAGE ENGINE

### **A. Font Management:**
```typescript
interface FontConfig {
  language: string;
  fontFamily: string;
  fontFiles: {
    regular: string;
    bold: string;
    italic: string;
    boldItalic: string;
  };
  direction: 'ltr' | 'rtl';
  unicodeRange: string;
  fallbacks: string[];
}

const fontConfigs: FontConfig[] = [
  {
    language: 'en',
    fontFamily: 'NotoSans',
    fontFiles: {
      regular: '/fonts/NotoSans-Regular.ttf',
      bold: '/fonts/NotoSans-Bold.ttf',
      italic: '/fonts/NotoSans-Italic.ttf',
      boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
    },
    direction: 'ltr',
    unicodeRange: 'U+0000-007F',
    fallbacks: ['Arial', 'Helvetica']
  },
  {
    language: 'ar',
    fontFamily: 'NotoSansArabic',
    fontFiles: {
      regular: '/fonts/NotoSansArabic-Regular.ttf',
      bold: '/fonts/NotoSansArabic-Bold.ttf',
      italic: '/fonts/NotoSansArabic-Italic.ttf',
      boldItalic: '/fonts/NotoSansArabic-Italic'
    },
    direction: 'rtl',
    unicodeRange: 'U+0600-06FF',
    fallbacks: ['Arial Unicode MS']
  }
];
```

### **B. RTL Support System:**
```typescript
interface RTLConfig {
  language: string;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right' | 'center';
  layoutDirection: 'normal' | 'reverse';
  mirrorElements: boolean;
  bidiProcessor: (text: string) => string;
}

// RTL processing workflow
const rtlProcessor = {
  processText: (text: string, language: string) => {
    if (isRTLLanguage(language)) {
      return bidiJS(text, { dir: 'rtl' });
    }
    return text;
  },
  
  adjustLayout: (schema: Schema, language: string) => {
    if (isRTLLanguage(language)) {
      return mirrorLayout(schema);
    }
    return schema;
  }
};
```

## 5. TEMPLATE SYSTEM ARCHITECTURE

### **A. Template Schema Structure:**
```typescript
interface PDFmeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  
  // Multi-language metadata
  languages: string[];
  defaultLanguage: string;
  
  // PDFme specific
  basePdf?: string;           // Base PDF file
  schemas: Schema[];          // Page schemas
  
  // Custom extensions
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    author: string;
    thumbnail?: string;
  };
  
  // Data requirements
  dataSchema: JSONSchema;     // Expected JSON structure
  sampleData: any;           // Sample data for preview
  
  // Multi-language configurations
  i18nConfig: {
    [language: string]: {
      fontConfig: FontConfig;
      layoutModifications?: any;
      customStyles?: any;
    };
  };
}
```

### **B. Schema Extensions:**
```typescript
interface ExtendedSchema extends PDFmeSchema {
  // Multi-language support
  i18n?: {
    [language: string]: {
      content?: string;
      style?: any;
      position?: Position;
    };
  };
  
  // Data binding
  dataBinding?: DataBinding;
  
  // Conditional rendering
  conditions?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: any;
  }[];
  
  // Custom behaviors
  behaviors?: {
    onDataChange?: string;
    onRender?: string;
    validation?: string;
  };
}
```

## 6. PLUGIN SYSTEM

### **A. Core Plugins:**
```typescript
// Text Plugin với multi-language
const textPlugin = {
  name: 'text',
  render: (value: string, schema: ExtendedSchema, context: RenderContext) => {
    const language = context.language;
    const processedText = rtlProcessor.processText(value, language);
    const fontConfig = getFontConfig(language);
    
    return {
      ...baseTextRender(processedText, schema),
      font: fontConfig.fontFamily,
      direction: fontConfig.direction
    };
  },
  
  ui: (schema: ExtendedSchema) => TextEditor,
  
  validator: (value: string, schema: ExtendedSchema) => {
    // Validation logic
  }
};

// Table Plugin với multi-language headers
const tablePlugin = {
  name: 'table',
  render: (data: any[], schema: ExtendedSchema, context: RenderContext) => {
    const language = context.language;
    const headers = getLocalizedHeaders(schema.headers, language);
    
    return renderTable(data, headers, schema, context);
  },
  
  ui: (schema: ExtendedSchema) => TableEditor
};
```

### **B. Custom Plugins:**
```typescript
// QR Code Plugin
const qrCodePlugin = {
  name: 'qrcode',
  render: (value: string, schema: ExtendedSchema) => {
    return generateQRCode(value, schema.size);
  },
  ui: (schema: ExtendedSchema) => QRCodeEditor
};

// Chart Plugin
const chartPlugin = {
  name: 'chart',
  render: (data: any, schema: ExtendedSchema) => {
    return generateChart(data, schema.chartType, schema.options);
  },
  ui: (schema: ExtendedSchema) => ChartEditor
};
```

## 7. WORKFLOW SYSTEM

### **A. Template Creation Workflow:**
```
1. Create New Template
   ├── Choose base template or blank
   ├── Configure page settings
   └── Set default language

2. Design Layout (Sử dụng PDFme Designer)
   ├── Drag blocks from library (Các trường PDFme hoặc Custom Plugins)
   ├── Configure block properties
   ├── Set data bindings
   └── Configure multi-language settings

3. Data Integration
   ├── Upload sample JSON
   ├── Map data fields
   ├── Configure transformations
   └── Set fallback values

4. Multi-language Setup
   ├── Add supported languages
   ├── Configure fonts
   ├── Set RTL/LTR directions
   └── Test language switching

5. Preview & Test
   ├── Preview with sample data
   ├── Test all languages
   ├── Check responsive layout
   └── Validate output

6. Save & Export
   ├── Save template configuration
   ├── Export template file
   └── Generate documentation
```

### **B. PDF Generation Workflow:**
```
1. Data Input
   ├── Upload JSON data
   ├── Validate against schema
   └── Process i18n content

2. Template Processing
   ├── Load template configuration
   ├── Select language
   ├── Apply RTL/LTR settings
   └── Process data bindings

3. Rendering (Sử dụng PDFme Generator)
   ├── Initialize PDFme generator
   ├── Load fonts
   ├── Process each page
   └── Apply styling

4. Output
   ├── Generate PDF buffer
   ├── Apply post-processing
   └── Return downloadable file
```

### **C. Block Template Creation Workflow (Leveraging Gemini Analysis):**
```
1. Start with Gemini Analysis:
   ├── User uploads PDF, Gemini processes it.
   └── System presents `GeminiAnalysisResponse` (structured sections and questions).

2. "Suggest Blocks" View:
   ├── UI displays a list of identified sections/questions from Gemini output.
   ├── Each item shows: content, type (e.g., header, multiple_choice), semanticRole.
   └── Visual preview (highlighted snippet from original PDF or rendered PDFme field).

3. User Selects a Block:
   └── User chooses an item to turn into a reusable "block template" (e.g., a specific header, a multiple-choice question).

4. System Auto-Configures:
   ├── Based on selected item's type, semanticRole, and position, system suggests PDFme field type and initial properties.
   ├── Position (x, y, width, height) is pre-filled.
   ├── Content is pre-filled as placeholder or data binding path (e.g., `document.sections[0].content`).

5. User Refines (Optional):
   ├── Simplified PDFme designer-like interface focused on this single block.
   ├── User can: name the block, adjust basic styling (font size, bold, alignment).
   ├── Confirm/adjust data binding path.
   └── Add i18n keys if needed.

6. Save as Block Template:
   └── System saves this configuration as a reusable PDFme schema snippet with metadata (e.g., `blockType: 'header'`, `sourceGeminiId: 'sec_p1_header_01'`).
```

### **C. Block Template Creation Workflow (Leveraging Gemini Analysis):**
```
1. Start with Gemini Analysis:
   ├── User uploads PDF, Gemini processes it.
   └── System presents `GeminiAnalysisResponse` (structured sections and questions).

2. "Suggest Blocks" View:
   ├── UI displays a list of identified sections/questions from Gemini output.
   ├── Each item shows: content, type (e.g., header, multiple_choice), semanticRole.
   └── Visual preview (highlighted snippet from original PDF or rendered PDFme field).

3. User Selects a Block:
   └── User chooses an item to turn into a reusable "block template" (e.g., a specific header, a multiple-choice question).

4. System Auto-Configures:
   ├── Based on selected item's type, semanticRole, and position, system suggests PDFme field type and initial properties.
   ├── Position (x, y, width, height) is pre-filled.
   ├── Content is pre-filled as placeholder or data binding path (e.g., `document.sections[0].content`).

5. User Refines (Optional):
   ├── Simplified PDFme designer-like interface focused on this single block.
   ├── User can: name the block, adjust basic styling (font size, bold, alignment).
   ├── Confirm/adjust data binding path.
   └── Add i18n keys if needed.

6. Save as Block Template:
   └── System saves this configuration as a reusable PDFme schema snippet with metadata (e.g., `blockType: 'header'`, `sourceGeminiId: 'sec_p1_header_01'`).
```

### **D. Overall User Workflow (from Gemini Analysis to PDF Generation):**
```
1. Review Gemini Analysis Results:
   ├── Display PDF preview with highlighted sections/questions.
   ├── Side panel lists detailed extracted items (content, type, semanticRole).
   └── User navigates and inspects extracted data.

2. Create or Update Template:
   ├── Option 1: "Create New Template from Analysis":
   │   ├── System auto-generates a new PDFme template with pre-filled fields/plugins based on Gemini's output.
   │   └── User is directed to PDFme Designer with the pre-populated template.
   ├── Option 2: "Add to Existing Template":
   │   ├── User selects an existing PDFme template.
   │   ├── Gemini analysis is re-displayed.
   │   ├── User can drag-and-drop extracted items from the analysis panel onto the PDFme Designer canvas.
   │       (System automatically creates appropriate PDFme fields/plugins and sets data bindings/relative positions).

3. Design and Refine Template in PDFme Designer:
   ├── Block Library: Contains standard PDFme fields and saved "Block Templates" (e.g., "Standard Header", "4-Option MC Question").
   ├── Drag & Drop: User adds blocks from the library or from Gemini's suggested items.
   ├── Property Panel: User adjusts block properties (size, position, styling, conditional rendering).
   ├── Data Binding Management: Intuitive interface to link PDFme fields to specific data paths in `GeminiAnalysisResponse` (system suggests relevant paths).
   └── Instant Preview: User can preview the generated PDF with sample data from `sampleResponse.json` in real-time.

4. Save Template:
   └── User saves the designed PDFme template (including field structures, data bindings, and settings).

5. Generate PDF:
   ├── User provides new JSON data (conforming to `GeminiAnalysisResponse` structure).
   └── System uses `pdfme/generator` to populate the template and produce the final PDF file.
```

## 8. PERFORMANCE OPTIMIZATIONS

### **A. Caching Strategy:**
```typescript
interface CacheConfig {
  templates: {
    maxSize: number;
    ttl: number;
  };
  fonts: {
    maxSize: number;
    preload: string[];
  };
  generated: {
    maxSize: number;
    ttl: number;
  };
}

const cacheStrategy = {
  templateCache: new LRUCache(100),
  fontCache: new Map(),
  generatedPDFCache: new LRUCache(50)
};
```

### **B. Lazy Loading:**
```typescript
const optimizations = {
  lazyLoadFonts: true,
  lazyLoadTemplates: true,
  virtualizedBlockLibrary: true,
  debouncePreview: 500,
  optimizedRendering: true
};
```

## 9. INTEGRATION POINTS

### **A. External System Integration:**
```typescript
interface IntegrationConfig {
  // File storage
  storage: {
    templates: 'local' | 's3' | 'gcs';
    fonts: 'local' | 'cdn';
    generated: 'local' | 's3';
  };
  
  // API endpoints
  api: {
    templates: string;
    fonts: string;
    generation: string;
  };
  
  // Authentication
  auth: {
    enabled: boolean;
    provider: 'jwt' | 'oauth';
  };
}
```

### **B. Export/Import System:**
```typescript
interface ExportConfig {
  template: {
    format: 'json' | 'zip';
    includeSampleData: boolean;
    includeFonts: boolean;
  };
  
  pdf: {
    format: 'pdf' | 'png' | 'jpeg';
    quality: number;
    compression: boolean;
  };
}
```

## 10. ERROR HANDLING & VALIDATION

### **A. Validation Rules:**
```typescript
interface ValidationRules {
  template: {
    requiredFields: string[];
    schemaValidation: JSONSchema;
    customValidators: Function[];
  };
  
  data: {
    requiredFields: string[];
    typeValidation: boolean;
    customValidators: Function[];
  };
  
  fonts: {
    supportedFormats: string[];
    maxFileSize: number;
    unicodeValidation: boolean;
  };
}
```

### **B. Error Recovery:**
```typescript
const errorHandling = {
  gracefulDegradation: true,
  fallbackFonts: true,
  retryGeneration: 3,
  errorReporting: true,
  userFeedback: true
};
```

Thiết kế này cung cấp foundation hoàn chỉnh cho việc xây dựng PDF Template System với PDFme, tối ưu hóa cho multi-language support và user experience.
