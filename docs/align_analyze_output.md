Chắc chắn rồi. Việc thiết kế một "hợp đồng" (contract) dữ liệu rõ ràng giữa Gemini và ứng dụng của bạn là bước quan trọng nhất để xây dựng một hệ thống ổn định và dễ bảo trì. Dưới đây là tài liệu hướng dẫn chi tiết về cách bạn nên cấu trúc lại output của Gemini, cùng với lý do và cách nó ánh xạ trực tiếp vào các block template đã được lên ý tưởng.

---

### Tài liệu Hướng dẫn: Tối ưu hóa Output của Gemini cho Docubrand & `pdfme`

**Mục tiêu:** Định nghĩa một cấu trúc JSON đầu ra (output schema) cho Gemini sao cho nó có thể được chuyển đổi một cách trực tiếp và dễ dàng thành template của `pdfme`, giảm thiểu tối đa logic xử lý phức tạp ở phía client.

**Nguyên tắc thiết kế:**
1.  **Tư duy theo "Block":** Mỗi đối tượng trong output của Gemini nên tương ứng với một "Block" chức năng trong Docubrand (Trắc nghiệm, Điền từ, v.v.).
2.  **Cú pháp tương thích:** Sử dụng cú pháp mà các plugin của bạn đã được thiết kế để hiểu (ví dụ: cú pháp `{biến}` của MVT).
3.  **Cấu trúc rõ ràng, không nhập nhằng:** Tránh việc Gemini trả về một chuỗi văn bản lớn và bắt client phải tự phân tích (parse). Hãy để Gemini phân tích và trả về các thành phần đã được bóc tách.

---

### Cấu trúc Output Gemini được Đề xuất

Dưới đây là cấu trúc JSON lý tưởng mà bạn nên hướng tới khi "prompt-engineer" hoặc "fine-tune" Gemini.

```json
{
  "documentMetadata": {
    "title": "Bài kiểm tra cuối kỳ - Môn Lịch sử Lớp 7",
    "subject": "Lịch sử",
    "author": "Nguyễn Văn B",
    "instructions": "Các em đọc kỹ đề bài và chọn đáp án đúng nhất."
  },
  "contentBlocks": [
    // Một mảng chứa tất cả các block nội dung theo đúng thứ tự
    // ... các block sẽ được định nghĩa chi tiết bên dưới ...
  ]
}
```

-   **`documentMetadata`**: Chứa thông tin chung về tài liệu. Dữ liệu này có thể được dùng để điền vào **Block "Tiêu đề & Chân trang Động" (Top 7)**.
-   **`contentBlocks`**: Đây là phần quan trọng nhất. Nó là một mảng các đối tượng, mỗi đối tượng đại diện cho một block nội dung. Mỗi block sẽ có một thuộc tính `type` để xác định nó là loại gì.

---

### Chi tiết Cấu trúc cho từng `contentBlock`

#### 1. Block Văn bản (Tương ứng `text` plugin)

Dùng cho các đoạn văn, tiêu đề, hướng dẫn không chứa câu hỏi.

```json
{
  "type": "paragraph", // Hoặc 'heading1', 'heading2', 'instruction'
  "content": "Phần I: Lịch sử Việt Nam thời kỳ phong kiến."
}
```
*   **Ánh xạ:**
    *   `type`: Dùng để quyết định style cho `text` schema (ví dụ: `heading1` sẽ có `fontSize` lớn và `fontName` đậm).
    *   `content`: Điền trực tiếp vào `content` của `text` schema.

#### 2. Block Điền vào chỗ trống (Tương ứng `FillInTheBlank` - Top 1)

```json
{
  "type": "fill_in_the_blank",
  "template": "Nhà Trần được thành lập vào năm {nam_thanh_lap} và nổi tiếng với ba lần chiến thắng quân xâm lược {ten_quan_xam_luoc}.",
  "correctAnswers": {
    "nam_thanh_lap": "1225",
    "ten_quan_xam_luoc": "Nguyên - Mông"
  }
}
```
*   **Ánh xạ:**
    *   `template`: Điền trực tiếp vào `schema.text` của plugin `FillInTheBlank` (vốn là một MVT).
    *   `correctAnswers`: Điền vào `schema.content` (dưới dạng chuỗi JSON) để `propPanel` có thể hiển thị dữ liệu mẫu. Đây cũng là dữ liệu cho tính năng **"Tự động Chấm điểm" (Premium)**.

#### 3. Block Câu hỏi Trắc nghiệm (Tương ứng `MultipleChoiceQuestion` - Top 2)

```json
{
  "type": "multiple_choice",
  "question": "Vị vua nào dưới đây không thuộc triều đại nhà Lý?",
  "choices": [
    { "label": "A", "text": "Lý Thái Tổ" },
    { "label": "B", "text": "Lý Thái Tông" },
    { "label": "C", "text": "Lê Lợi" },
    { "label": "D", "text": "Lý Nhân Tông" }
  ],
  "correctAnswerLabel": "C",
  "points": 1.0
}
```
*   **Ánh xạ:**
    *   `question`: Điền vào `content` của `text` schema cho đề bài.
    *   `choices`: Lặp qua mảng này. Với mỗi `choice`, tạo một cặp `radioGroup` và `text` schema. `choice.text` điền vào `content` của `text` schema.
    *   `correctAnswerLabel`: Dùng cho tính năng **"Tự động Chấm điểm"**.
    *   `points`: Điền vào một `text` schema nhỏ bên cạnh đề bài.

#### 4. Block Tự luận (Tương ứng `LinedAnswerBox` - Top 3)

```json
{
  "type": "essay",
  "prompt": "Hãy trình bày những thành tựu nổi bật về kinh tế dưới thời vua Lê Thánh Tông.",
  "suggestedHeight": 80 // Chiều cao gợi ý (tính bằng mm)
}
```
*   **Ánh xạ:**
    *   `prompt`: Tạo một `text` schema cho đề bài với nội dung này.
    *   `suggestedHeight`: Tạo một `LinedAnswerBox` schema bên dưới đề bài với `height` được gợi ý. Điều này giúp tạo ra một không gian trả lời phù hợp với độ dài dự kiến của câu trả lời.

#### 5. Block Nối cột (Tương ứng `MatchingExercise` - Top 5)

```json
{
  "type": "matching",
  "instructions": "Hãy nối các sự kiện ở cột A với các mốc thời gian tương ứng ở cột B.",
  "columnA": [
    "1. Khởi nghĩa Hai Bà Trưng",
    "2. Chiến thắng Bạch Đằng",
    "3. Nhà Lý dời đô về Thăng Long"
  ],
  "columnB": [
    "A. Năm 938",
    "B. Năm 1010",
    "C. Năm 40"
  ],
  "correctMatches": {
    "1": "C",
    "2": "A",
    "3": "B"
  }
}
```
*   **Ánh xạ:**
    *   `instructions`: Tạo một `text` schema cho phần hướng dẫn.
    *   `columnA`, `columnB`: Dữ liệu này được dùng để điền vào `schema.content` của một `table` schema (Block Nối cột). Cột ở giữa sẽ được để trống cho học sinh điền.
    *   `correctMatches`: Dùng cho tính năng **"Tự động Chấm điểm"**.

#### 6. Block Chú thích Hình ảnh (Tương ứng `LabeledDiagram` - Top 4)

```json
{
  "type": "labeled_diagram",
  "instructions": "Điền tên các bộ phận của một bông hoa vào các ô trống.",
  "imageUrl": "https://example.com/flower_diagram.png",
  "labels": [
    {
      "id": "label_1",
      "template": "{dap_an_1}",
      "position": { "x": 10, "y": 15 }, // Tọa độ tương đối so với ảnh
      "linePoints": [ { "x": 12, "y": 18 }, { "x": 30, "y": 25 } ], // Tọa độ đường chỉ
      "correctAnswer": "Nhụy hoa"
    },
    {
      "id": "label_2",
      "template": "{dap_an_2}",
      "position": { "x": 80, "y": 50 },
      "linePoints": [ { "x": 82, "y": 52 }, { "x": 60, "y": 40 } ],
      "correctAnswer": "Cánh hoa"
    }
  ]
}
```
*   **Ánh xạ:**
    *   `imageUrl`: Điền vào `content` của một `image` schema.
    *   `labels`: Lặp qua mảng này. Với mỗi `label`:
        *   Tạo một `FillInTheBlank` schema tại `label.position` với `text` là `label.template`.
        *   Tạo một `line` schema với các điểm được cho trong `linePoints`.
    *   Toàn bộ các schema này (image, lines, fillInTheBlanks) sẽ có cùng một `groupId`.

---

### Cách sử dụng trong Prompt của Gemini

Khi bạn gửi PDF cho Gemini, prompt của bạn cần phải rất rõ ràng. Thay vì chỉ hỏi "Hãy phân tích tài liệu này", bạn nên đưa ra các chỉ dẫn cụ thể và cung cấp cấu trúc JSON mong muốn.

**Ví dụ Prompt:**

> "Bạn là một trợ lý chuyên phân tích tài liệu giáo dục. Hãy phân tích tệp PDF được cung cấp và trả về một đối tượng JSON duy nhất. Đối tượng này phải tuân thủ nghiêm ngặt schema sau:
>
> ```json
> {
>   "documentMetadata": {
>     "title": "string",
>     "subject": "string"
>   },
>   "contentBlocks": [
>     // Mỗi block phải có thuộc tính "type"
>     // Ví dụ về một block trắc nghiệm:
>     {
>       "type": "multiple_choice",
>       "question": "string",
>       "choices": [ { "label": "string", "text": "string" } ],
>       "correctAnswerLabel": "string"
>     },
>     // Ví dụ về một block điền từ:
>     {
>       "type": "fill_in_the_blank",
>       "template": "string (sử dụng cú pháp {variable_name})",
>       "correctAnswers": { "variable_name": "string" }
>     },
>     // ... (cung cấp thêm các ví dụ khác)
>   ]
> }
> ```
>
> Hãy đảm bảo rằng tất cả nội dung trong PDF đều được biểu diễn trong mảng `contentBlocks` theo đúng thứ tự xuất hiện. Với các câu hỏi điền từ, hãy tự đặt tên biến có ý nghĩa trong cú pháp `{}`."

### Kết luận

Bằng cách định nghĩa một "API contract" rõ ràng như trên, bạn đã chuyển phần lớn gánh nặng xử lý và phân tích ngữ nghĩa cho Gemini. Luồng công việc của Docubrand sẽ trở nên đơn giản hơn rất nhiều:

1.  **Nhận JSON từ Gemini.**
2.  **Lặp qua mảng `contentBlocks`.**
3.  **Sử dụng một `switch (block.type)` để gọi hàm mapper tương ứng.**
4.  **Mỗi hàm mapper sẽ tạo ra một nhóm schema `pdfme` đã được cấu hình sẵn.**
5.  **Ghép tất cả các nhóm schema lại để tạo thành template cuối cùng.**

Cách tiếp cận này không chỉ giúp code của bạn sạch sẽ, dễ bảo trì mà còn mở ra khả năng hỗ trợ các loại câu hỏi mới trong tương lai một cách dễ dàng: bạn chỉ cần định nghĩa một cấu trúc block mới trong prompt của Gemini và viết một hàm mapper mới cho nó.