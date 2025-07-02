# DocuBrand - Rebrand your documents. Keep your content.

![DocuBrand](https://img.shields.io/badge/DocuBrand-v0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![pdf-lib](https://img.shields.io/badge/pdf--lib-1.17.1-red)

**DocuBrand** is a micro-SaaS web application designed for educators to quickly apply personal branding (logo, colors, fonts) to teaching documents while preserving content accuracy 100%.

## 🎯 MVP Features

- **📁 PDF Upload**: Drag & drop interface with validation
- **🎨 Brand Kit**: Logo upload, color picker, font selection  
- **⚡ Client-side Processing**: Privacy-first PDF manipulation
- **📥 Download**: Branded PDF with preserved content
- **💾 Local Storage**: Brand kit persistence

## 🚀 Quick Start

### Prerequisites

- Node.js 18.18+ 
- pnpm (recommended package manager)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd docubrand

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser
open http://localhost:3000
```

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   ├── BrandKit.tsx        # Brand kit sidebar
│   ├── FileUpload.tsx      # PDF upload component
│   └── PDFPreview.tsx      # Preview component
├── lib/
│   ├── pdf-processor.ts    # PDF manipulation engine
│   ├── brand-kit.ts        # Brand kit management
│   ├── storage.ts          # localStorage utilities
│   └── download.ts         # Download utilities
└── types/
    └── index.ts            # TypeScript definitions
```

## 🔧 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-lib (client-side)
- **Color Picker**: react-colorful
- **Fonts**: Google Fonts (next/font)
- **Deployment**: Vercel-ready

## 📖 Usage

1. **Set up Brand Kit**:
   - Upload your logo (PNG/JPG, max 5MB)
   - Choose your brand color
   - Select font family

2. **Upload PDF**:
   - Drag & drop or click to select
   - Supports PDF files up to 10MB
   - MVP: Focus on simple document structures

3. **Download Branded PDF**:
   - Processing applies branding automatically
   - Original content preserved 100%
   - Download with timestamped filename

## 🎨 Brand Kit Options

### Fonts Available
- Inter (default UI font)
- Roboto  
- Open Sans
- Lato
- Poppins

### Logo Requirements
- Formats: PNG, JPG
- Max size: 5MB
- Automatically resized maintaining aspect ratio

### Color System
- Hex color picker
- Applied to headers and accent elements
- Maintains readability and contrast

## 🧪 Testing

Test with the provided sample documents or create simple PDF files with:
- Clear title structure
- Numbered questions/sections
- Text-based content (MVP scope)

## 🚧 MVP Limitations

- **Document Types**: Simple text-based PDFs only
- **No User Accounts**: Brand kit stored locally
- **Basic Branding**: Logo, color, font only
- **Single Processing**: One document at a time

## 🔮 Future Enhancements

- Multiple document templates
- Cloud storage and user accounts  
- Batch processing capabilities
- Advanced typography controls
- Collaboration features

## 🛠 Development

### Key Dependencies

```json
{
  "next": "^15.3.4",
  "react": "^19.0.0", 
  "pdf-lib": "^1.17.1",
  "react-colorful": "^5.6.1"
}
```

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server  
- `pnpm lint` - Run ESLint
- `pnpm type-check` - TypeScript check

## 📄 License

Created by **RuthlessCode** for Sprint #1 (July 15-28, 2025)

---

**DocuBrand v0.1.0** - Built with ❤️ for educators worldwide