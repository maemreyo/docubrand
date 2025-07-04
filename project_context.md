# Project Context Summary for Docubrand Template Designer

## 1. Mục tiêu Dự án (Project Goal)
Mục tiêu tổng thể của dự án Docubrand là phát triển một công cụ thiết kế template giáo dục dựa trên PDFme, cho phép người dùng tạo và quản lý các tài liệu như bài kiểm tra, phiếu bài tập, và tài liệu hướng dẫn. Công cụ này tập trung vào việc cung cấp các "block" template tiện lợi và dễ sử dụng để xây dựng nội dung.

## 2. Các Triển khai Chính đã Hoàn thành (Key Implementations Completed)

### 2.1. `src/components/template-designer/BlockLibrary.tsx`
- **Mô tả chức năng chính:** Định nghĩa và quản lý thư viện các "block" template giáo dục có sẵn để người dùng kéo và thả vào canvas thiết kế. Các block được phân loại thành "basic", "questions", "layout", "forms", và "graphics".
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:**
    - `EducationalBlock`: Interface định nghĩa cấu trúc của một block, bao gồm `id`, `name`, `description`, `category`, `icon`, `schema` (định nghĩa cấu trúc dữ liệu của block trong PDFme), và `tags`.
    - `EducationalSchema`: Mở rộng từ `Schema` của PDFme, thêm các thuộc tính giáo dục như `questionType`, `correctAnswer`, `points`, `difficulty`, v.v.
    - `educationalBlocks`: Mảng chứa tất cả các định nghĩa block có sẵn.
    - `categories`: Định nghĩa các danh mục block để lọc và hiển thị.

### 2.2. `src/lib/educational-plugins.ts`
- **Mô tả chức năng chính:** Chứa các plugin tùy chỉnh cho PDFme để hỗ trợ các loại block giáo dục như trắc nghiệm, đúng/sai, trả lời ngắn, và câu hỏi tự luận. Các plugin này định nghĩa cách các block được render trong PDF và trong giao diện người dùng (UI).
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:**
    - `MultipleChoiceSchema`, `TrueFalseSchema`, `ShortAnswerSchema`, `EssaySchema`, `InstructionBoxSchema`: Các interface mở rộng `Schema` của PDFme để định nghĩa các thuộc tính cụ thể cho từng loại câu hỏi/block.
    - `multipleChoicePlugin`, `trueFalsePlugin`, `shortAnswerPlugin`, `essayPlugin`, `instructionBoxPlugin`: Các đối tượng `Plugin` của PDFme, mỗi đối tượng chứa logic `pdf` (render ra PDF), `ui` (render trong UI designer), và `propPanel` (cấu hình thuộc tính).
    - `getEducationalPlugins()`: Hàm trả về tất cả các plugin giáo dục đã định nghĩa.
    - `registerEducationalPlugins()`: Hàm để đăng ký các plugin giáo dục với các plugin PDFme hiện có.

### 2.3. `src/components/TemplateDesigner.tsx`
- **Mô tả chức năng chính:** Là component chính tích hợp toàn bộ công cụ thiết kế template. Nó quản lý trạng thái của template, tương tác với `useTemplateData` hook, và điều phối các component con như `DesignerSidebar`, `DesignerToolbar`, và `DesignerCanvas`.
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:**
    - `EducationalTemplate`: Mở rộng từ `Template` của PDFme, đại diện cho cấu trúc template hoàn chỉnh.
    - `useTemplateData`: Custom hook (không có trong các file được cung cấp nhưng được tham chiếu) để quản lý dữ liệu template, trạng thái lưu, undo/redo, và validation.
    - `designerInstance`: Tham chiếu đến instance của PDFme Designer UI.

### 2.4. `src/components/template-designer/DesignerCanvas.tsx`
- **Mô tả chức năng chính:** Component hiển thị canvas thiết kế thực tế, nơi người dùng tương tác với các block template. Nó khởi tạo và quản lý instance của PDFme `Designer` UI.
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:**
    - `Designer`: Class từ `@pdfme/ui` cung cấp giao diện thiết kế.
    - `PdfmeIntegration`: Class (không có trong các file được cung cấp nhưng được tham chiếu) để tích hợp PDFme và các plugin tùy chỉnh.
    - `CanvasError`: Interface để định nghĩa cấu trúc lỗi trên canvas.

### 2.5. `src/components/template-designer/DesignerSidebar.tsx`
- **Mô tả chức năng chính:** Thanh bên trái của công cụ thiết kế, chứa các tab để quản lý block (thư viện block), thuộc tính template (metadata, validation), dữ liệu (data bindings), và thư viện template.
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:**
    - `TemplateDefinition`: Interface định nghĩa cấu trúc của một template, bao gồm `metadata` và `template` (cấu trúc PDFme).
    - `ValidationReport`: Interface để báo cáo kết quả validation template.
    - `DataBinding`: Interface để định nghĩa các liên kết dữ liệu trong template.

### 2.6. `src/components/template-designer/DesignerToolbar.tsx`
- **Mô tả chức năng chính:** Thanh công cụ ở phía trên của công cụ thiết kế, cung cấp các hành động như lưu, xem trước, xuất, chia sẻ, cài đặt, và chỉnh sửa tên template.
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:** Không có kiểu dữ liệu đặc biệt nào được định nghĩa trong file này, chủ yếu là quản lý UI state và gọi các hàm callback.

### 2.7. `src/components/template-designer/TemplateManager.tsx`
- **Mô tả chức năng chính:** Giao diện quản lý template, cho phép người dùng xem, tìm kiếm, lọc, sắp xếp, tạo mới, tải, xóa, sao chép, xuất và nhập các template đã lưu.
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:**
    - `TemplateMetadata`: Interface chứa thông tin metadata của template (id, name, description, category, tags, createdAt, updatedAt).
    - `templateManager`: Đối tượng (không có trong các file được cung cấp nhưng được tham chiếu) để tương tác với hệ thống lưu trữ template.

### 2.8. `src/components/TemplateDesignerDialog.tsx`
- **Mô tả chức năng chính:** Một component wrapper sử dụng Radix UI Dialog để hiển thị `TemplateDesigner` trong một modal dialog.
- **Các kiểu dữ liệu (types) hoặc khái niệm quan trọng:** Không có kiểu dữ liệu đặc biệt nào được định nghĩa trong file này, chủ yếu là quản lý trạng thái đóng/mở dialog.

### 2.9. `src/components/template-designer/index.tsx`
- **Mô tả chức năng chính:** File barrel export để tập trung các export từ các component con của `template-designer`, giúp việc import dễ dàng hơn.

## 3. Kế hoạch Dự án và Theo dõi Tiến độ (Project Plan and Progress Tracking)
Dựa trên mô tả, có vẻ như kế hoạch và tiến độ dự án được theo dõi thông qua các file như `docs/PDFme_impl_todo.md`.
- **Các giai đoạn/nhiệm vụ chính:**
    - Phát triển `DesignCanvas` với các block template.
    - Cải thiện các template hiện có (ví dụ: `multiple choice` không thể nhập text).
    - Đảm bảo tính tiện dụng và ổn định của các template.
    - Kiểm tra và hiểu cách `educational-plugins.ts` hoạt động để hỗ trợ các tính năng template.
    - Đảm bảo luồng chọn template hoạt động chính xác.

## 4. Các Phụ thuộc (Dependencies)
Dựa trên `package.json`, các thư viện và framework chính đang được sử dụng bao gồm:
- **Frontend:**
    - `next`: Framework React.
    - `react`, `react-dom`: Thư viện UI.
    - `@pdfme/ui`, `@pdfme/common`, `@pdfme/generator`, `@pdfme/schemas`: Các thư viện chính của PDFme để thiết kế và tạo PDF.
    - `lucide-react`: Thư viện icon.
    - `@radix-ui/react-*`: Các thư viện UI component không có style (headless UI) từ Radix UI.
- **Backend/Utilities:**
    - `@google/generative-ai`: Có thể được sử dụng cho các tính năng liên quan đến AI.
    - `pdf-lib`, `@pdf-lib/fontkit`: Thư viện xử lý PDF.
- **Công cụ phát triển:**
    - `typescript`: Ngôn ngữ lập trình.
    - `eslint`, `eslint-config-next`: Linting.
    - `tailwindcss`, `@tailwindcss/postcss`: CSS framework.

## 5. Các Bước Tiếp theo (Next Steps)
Dựa trên mô tả của bạn:
- **Ưu tiên cao:**
    - Khắc phục sự cố với các template block hiện có, đặc biệt là `multiple choice` không cho phép nhập text.
    - Đảm bảo các template block khác hoạt động ổn định và tiện dụng.
    - Kiểm tra và điều chỉnh logic trong `src/lib/educational-plugins.ts` để đảm bảo các plugin hoạt động chính xác với các block template.
    - Đảm bảo tính năng chọn template hoạt động trơn tru và cung cấp đầy đủ ngữ cảnh cho người dùng.
- **Tổng quát:**
    - Tiếp tục phát triển và hoàn thiện các loại block template mới.
    - Cải thiện trải nghiệm người dùng (UX) của công cụ thiết kế.
    - Tối ưu hóa hiệu suất và xử lý lỗi.
