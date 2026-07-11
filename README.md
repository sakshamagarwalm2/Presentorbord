# Presentorbord

![Version](https://img.shields.io/badge/version-v6.2.24-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Presentorbord Banner](src/assets/presentorbanaer.jpg)

An educational whiteboard application built with Tauri 2, React, Vite, TypeScript, Rust, and [tldraw](https://tldraw.dev/). Designed for teaching and presentations, it features an infinite canvas, custom educational tools, and native support for importing presentation files.

## ✨ Features

- **Infinite Canvas Whiteboard**: A smooth, highly responsive whiteboard powered by tldraw.
- **Document Import**: Seamlessly import PDFs and PowerPoint (`.ppt`, `.pptx`) files. Slides are automatically converted into individual pages on the whiteboard.
- **Custom Educational Tools**: Includes specialized tools like a Protractor, Graph Axes, and a Custom Laser pointer for interactive teaching.
- **Subject Modes**: Specialized modes (e.g., "Math" mode) that automatically provide relevant tools to the user.
- **Advanced Locking Mechanism**: Lock the camera/viewport to prevent accidental panning, set specific elements as background, and easily manage locked shapes.
- **Cross-Platform**: Built on Tauri 2 (Rust) for a lightweight, native desktop experience. PPT-to-PDF conversion works natively on Windows via PowerPoint COM automation, with a LibreOffice fallback available for other platforms.

## 🛠️ Tech Stack

- **Desktop Shell**: [Tauri 2](https://tauri.app/) (Rust backend)
- **Language**: [TypeScript](https://www.typescriptlang.org/) + [Rust](https://www.rust-lang.org/)
- **UI Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Whiteboard Engine**: [tldraw 2.1](https://tldraw.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **PDF Parsing**: [pdfjs-dist](https://mozilla.github.io/pdf.js/)
- **PPT/ZIP Handling**: [JSZip](https://stuk.github.io/jszip/) + [jsPDF](https://parall.ax/products/jspdf)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Rust](https://www.rust-lang.org/tools/install) toolchain (for the Tauri backend)
- To use the **PowerPoint to PDF** import feature, you must run the application on **Windows** with **Microsoft PowerPoint** installed (the app uses PowerShell COM automation to silently convert slides). Alternatively, [LibreOffice](https://www.libreoffice.org/) can be used as a cross-platform fallback.

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   cd Presentorbord
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Development

To start the application in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

### Production Build

To build the application for production:

```bash
npm run build
```
This will compile the frontend via Vite and bundle the Tauri app into an NSIS installer (or other platform-specific format) in the `src-tauri/target/release/bundle/` directory.

## 📂 Project Structure

- `src-tauri/` - Tauri (Rust) backend.
  - `src/lib.rs` - Core backend logic: IPC commands, PPT-to-PDF conversion, file I/O, window management.
  - `tauri.conf.json` - Tauri app configuration (window settings, security, bundling).
  - `capabilities/` - Tauri v2 permission grants.
- `src/renderer/src/` - The React frontend application.
  - `components/` - UI components: sidebars, toolbars, navigation panel, dialogs, timer widget, style panels.
  - `shapes/` - 11 custom tldraw shape definitions: Protractor, Compass, Ruler, Graph Axes, Circle, Parallelogram, Right-Angled Triangle, Arrow, Dotted Line, Emoji Pen, Super Pen.
  - `tools/` - 14+ custom tldraw tools: Area Eraser, Precision Eraser, Lasso, Circle, Parallelogram, Triangle, Arrow, Line, Dotted Line, Emoji Pen, Super Pen, Graph Axes (1-axis & 4-axis), Custom Laser.
  - `store/` - Zustand stores and reactive signals for global UI state (subject modes, style settings).
  - `utils/` - Utility functions for PDF parsing, PPTX extraction, slide camera management, color utilities, and geometry snapping.

## 📄 License

This project is licensed under the MIT License.
