# Presentorbord

An educational whiteboard application built with Electron, React, Vite, and [tldraw](https://tldraw.dev/). Designed for teaching and presentations, it features an infinite canvas, custom educational tools, and native support for importing presentation files.

## ✨ Features

- **Infinite Canvas Whiteboard**: A smooth, highly responsive whiteboard powered by tldraw.
- **Document Import**: Seamlessly import PDFs and PowerPoint (`.ppt`, `.pptx`) files. Slides are automatically converted into individual pages on the whiteboard.
- **Custom Educational Tools**: Includes specialized tools like a Protractor, Graph Axes, and a Custom Laser pointer for interactive teaching.
- **Subject Modes**: Specialized modes (e.g., "Math" mode) that automatically provide relevant tools to the user.
- **Advanced Locking Mechanism**: Lock the camera/viewport to prevent accidental panning, set specific elements as background, and easily manage locked shapes.
- **Desktop Mode**: A transparent background overlay mode for dynamic screen sharing and desktop integration.
- **Cross-Platform**: Built on Electron for compatibility across platforms (Note: PPTX conversion depends on Windows PowerPoint APIs).

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/)
- **Desktop Environment**: [Electron](https://www.electronjs.org/) using [electron-vite](https://electron-vite.org/)
- **Whiteboard Engine**: [tldraw 2.1](https://tldraw.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- To use the **PowerPoint to PDF** import feature, you must run the application on **Windows** with **Microsoft PowerPoint** installed (the app uses PowerShell COM automation to silently convert slides).

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
This will compile the TypeScript code and package the Electron app into the `dist` or respective output directory.

## 📂 Project Structure

- `src/main/` - The main Electron process. Handles system-level bindings, dialogs, and file manipulation (e.g., PowerShell scripts for PPT conversion).
- `src/renderer/` - The React frontend application.
  - `components/` - UI components like sidebars, toolbars, and dialogs.
  - `shapes/` - Custom tldraw shape definitions (Graph Axes, Protractor, etc.).
  - `tools/` - Custom tldraw tools interacting with the shapes.
  - `store/` - Zustand stores for global UI state (Subject modes, etc.).
  - `utils/` - Utility functions, including PDF.js integration for parsing imported files.
- `src/preload/` - Electron preload scripts securely exposing IPC methods to the renderer.

## 📄 License

This project is licensed under the MIT License.
