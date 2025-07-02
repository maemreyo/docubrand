DocuBrand - Kế hoạch Tổng thể v1.0
Dự án: DocuBrand
Slogan: Your intelligent document branding assistant. (Trợ lý tái định vị tài liệu thông minh của bạn.)
Ngày tạo: 03/07/2025
Tác giả: RuthlessCode
Phiên bản: 1.0

1. Tổng quan Dự án
1.1. Tầm nhìn
DocuBrand sẽ trở thành công cụ web thông minh (AI-powered micro-SaaS) và là trợ lý đáng tin cậy nhất cho các nhà giáo dục, gia sư, và nhà đào tạo độc lập. Sứ mệnh của chúng tôi là giúp họ xây dựng thương hiệu cá nhân một cách chuyên nghiệp và dễ dàng, bắt đầu từ chính những tài liệu giảng dạy hàng ngày.

1.2. Vấn đề cần giải quyết
Các nhà giáo dục thường xuyên sử dụng lại tài liệu từ nhiều nguồn khác nhau. Khi muốn xây dựng thương hiệu cá nhân, họ gặp phải các vấn đề:

Chỉnh sửa thủ công: Mất rất nhiều thời gian để sao chép và định dạng lại tài liệu.

Rủi ro sai lệch: Quá trình thủ công rất dễ gây ra lỗi chính tả hoặc làm thay đổi nội dung bài tập.

AI "ảo giác": Sử dụng các AI tổng quát để "tái tạo" tài liệu thường dẫn đến "ảo giác" (hallucination), làm thay đổi các câu hỏi hoặc đáp án - một lỗi không thể chấp nhận trong giáo dục.

1.3. Giải pháp
Chúng tôi xây dựng một ứng dụng web một trang, nơi AI thực hiện công việc nặng nhọc là "hiểu" tài liệu, và người dùng đóng vai trò là người "kiểm duyệt cuối cùng" để đảm bảo sự chính xác 100% trước khi tạo ra sản phẩm cuối cùng. Chúng tôi gọi đây là phương pháp "AI-First, Human-in-the-Loop".

2. Đối tượng Mục tiêu
Nhóm chính: Gia sư Tiếng Anh, giáo viên tự do, người dạy học trực tuyến.

Nhóm phụ: Các nhà đào tạo doanh nghiệp nhỏ, người tạo khóa học, chuyên gia cần tạo tài liệu mang thương hiệu cá nhân.

3. Lộ trình Phát triển (Product Roadmap)
Giai đoạn 1: MVP (Sprint #1 | Tháng 7/2025)
Mục tiêu: Ra mắt phiên bản đầu tiên, chứng minh tính khả thi của mô hình "Extract, Verify, Generate".

Tính năng chính:

Thiết lập Brand Kit cơ bản (logo, màu sắc).

Phân tích PDF bằng AI để trích xuất nội dung thành JSON.

Giao diện kiểm duyệt để người dùng chỉnh sửa và xác nhận.

Tạo file PDF mới dựa trên một template cố định duy nhất.

Giai đoạn 2: The Template Library (v1.1 | Quý 4/2025)
Mục tiêu: Tăng tính linh hoạt và giá trị cho người dùng.

Tính năng chính:

Xây dựng một thư viện với nhiều mẫu template đầu ra (ví dụ: Mẫu Lý thuyết, Mẫu Trắc nghiệm, Mẫu Từ vựng).

Cho phép người dùng chọn template họ muốn trước khi tạo PDF.

Giai đoạn 3: The Creative Studio (v2.0 | 2026)
Mục tiêu: Trao toàn quyền sáng tạo cho người dùng.

Tính năng chính:

Trình soạn thảo kéo-thả (Drag-and-Drop) cho phép người dùng tự sắp xếp các khối nội dung (tiêu đề, đoạn văn, câu hỏi) trên trang.

Tính năng tài khoản người dùng (sử dụng Supabase) để lưu trữ Brand Kit và các dự án.

Giới thiệu phiên bản Pro trả phí.

4. Danh sách Tính năng
4.1. Tính năng trong MVP (Sprint #1)
Thiết lập Brand Kit:

Tải lên logo (PNG, JPG).

Chọn màu chủ đạo.

Lưu Brand Kit vào localStorage của trình duyệt.

Phân tích Tài liệu:

Tải lên file PDF.

Gọi API backend để AI phân tích và trích xuất nội dung.

Hiển thị trạng thái đang xử lý.

Giao diện Kiểm duyệt:

Hiển thị song song file PDF gốc và nội dung AI đã trích xuất.

Cho phép người dùng chỉnh sửa tự do nội dung trong các ô nhập liệu.

Tạo PDF:

Tạo file PDF mới từ dữ liệu đã được người dùng xác thực.

Áp dụng logo và màu sắc từ Brand Kit theo một template cố định.

Cho phép người dùng tải file PDF đã hoàn thiện về máy.

4.2. Tính năng Tương lai (Không trong MVP)
Thư viện Template đa dạng.

Trình soạn thảo Kéo-Thả.

Hệ thống tài khoản người dùng (Đăng ký/Đăng nhập).

Lưu trữ Brand Kit và dự án trên cloud (Supabase).

Hỗ trợ nhiều định dạng file đầu vào hơn (DOCX, PPTX).

Các tính năng AI nâng cao (gợi ý cải thiện câu chữ, tự động tạo thêm câu hỏi).

Phiên bản trả phí (Subscription Model).

5. Luồng Người dùng (MVP User Flow)
Bước 1: Upload & Brand: Người dùng truy cập trang, thiết lập Brand Kit (logo, màu sắc) và upload file PDF của họ.

Bước 2: AI Processing: Người dùng nhấn nút "Analyze Document". Hệ thống gửi file PDF đến AI backend.

Bước 3: Verification UI (Giao diện Kiểm duyệt): Màn hình chia đôi. Bên trái là hình ảnh PDF gốc. Bên phải là các ô input/textarea chứa dữ liệu AI đã trích xuất để người dùng kiểm tra và chỉnh sửa.

Bước 4: Generate & Download: Sau khi kiểm tra xong, người dùng nhấn "Generate PDF". Ứng dụng tạo ra file PDF mới từ dữ liệu đã được chỉnh sửa và cho phép tải về.

6. Công nghệ Sử dụng (Tech Stack)
Framework: Next.js (Cho cả Frontend và Backend API).

Styling: Tailwind CSS.

Deployment & Hosting: Vercel.

AI Engine: Gemini API (hoặc các multi-modal AI khác), được gọi thông qua Vercel Serverless Function.

Xử lý PDF (Client-side): pdf-lib (Để tạo file PDF mới từ dữ liệu JSON).

Lưu trữ Client-side: localStorage (Để lưu Brand Kit trong MVP).

7. Quyền riêng tư & Dữ liệu
Đây là một cam kết cốt lõi của sản phẩm:

Không lưu trữ file của người dùng: File PDF người dùng tải lên chỉ được xử lý trong bộ nhớ tạm của server và sẽ bị hủy ngay sau khi tác vụ hoàn thành. Chúng tôi tuyệt đối không lưu file vào bất kỳ cơ sở dữ liệu hay ổ cứng nào.

Quyền riêng tư là trên hết: Chính sách này là một tính năng, một điểm bán hàng quan trọng, đảm bảo sự an toàn và tin cậy tuyệt đối cho người dùng.

8. Tiêu chí Chấp nhận (Acceptance Criteria - Client-side)
Epic 1: Thiết lập Thương hiệu (Brand Kit)
AC 1.1: Tải lên Logo: Người dùng có thể tải lên và xem trước logo của mình.

AC 1.2: Chọn Màu chủ đạo: Người dùng có thể chọn màu và thấy bản xem trước thay đổi theo.

AC 1.3: Lưu Brand Kit vào trình duyệt: Dữ liệu Brand Kit được lưu lại sau khi tải lại trang.

Epic 2: Phân tích Tài liệu
AC 2.1: Tải lên file PDF: Người dùng có thể tải lên một file PDF.

AC 2.2: Hiển thị trạng thái xử lý: Người dùng thấy một chỉ báo tải khi AI đang làm việc.

Epic 3: Kiểm duyệt Nội dung (Verification UI)
AC 3.1: Hiển thị giao diện so sánh: Hiển thị song song PDF gốc và nội dung AI đã trích xuất.

AC 3.2: Chỉnh sửa nội dung đã trích xuất: Người dùng có thể chỉnh sửa tự do nội dung trong các ô nhập liệu.

Epic 4: Tạo và Tải về PDF cuối cùng
AC 4.1: Tạo PDF từ dữ liệu đã xác thực: Hệ thống tạo PDF từ dữ liệu người dùng đã chỉnh sửa.

AC 4.2: Áp dụng Branding vào file PDF mới: File mới có logo và màu sắc theo Brand Kit và một template cố định.

AC 4.3: Tải file về máy: Người dùng có thể tải file PDF hoàn chỉnh về máy.