
// @ts-ignore - The @types/pdfjs-dist package doesn't cover the legacy build path
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.min.mjs';
// @ts-ignore - The @types/pdfjs-dist package doesn't cover the legacy build path
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Get worker constructor via Vite using the legacy build
// @ts-ignore - Vite ?worker suffix doesn't have a default type declaration in this project
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker';

/**
 * PDF Utility with Robust Electron Worker Handling
 */

interface LoadPdfOptions {
  timeout?: number;
  verbose?: boolean;
}

// Helper for sending logs to Electron Main process terminal
function logToTerminal(msg: string) {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
    // @ts-ignore
    window.electron.ipcRenderer.send('console-log', msg);
  }
}

export async function loadPdf(
  data: string | Uint8Array,
  options: LoadPdfOptions = {}
): Promise<PDFDocumentProxy> {
  const { timeout = 30000, verbose = false } = options;

  if (verbose) {
    console.log('[pdfUtils] Initializing PDF loader...');
    logToTerminal('[pdfUtils] Initializing PDF loader...');
  }

  if (verbose) {
    console.log('[pdfUtils] Using Vite ?worker for PDF.js');
    logToTerminal(`[pdfUtils] Using Vite ?worker for PDF.js`);
  }

  // PDF.js strictly requires workerSrc to be truthy, else it aggressively throws before
  // even checking for a provided Worker object.
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

  try {
    logToTerminal('[pdfUtils] Stage 1: Spawning Vite ?worker...');
    const worker = new PdfWorker();
    
    worker.onerror = (err: any) => {
        console.error('[pdfUtils] Worker encountered an error:', err);
        logToTerminal(`[pdfUtils] Worker onerror fired: ${err.message || String(err)}`);
    };

    // Inform PDF.js to globally use this exact Worker instance port
    pdfjsLib.GlobalWorkerOptions.workerPort = worker;

    logToTerminal('[pdfUtils] Stage 1: Starting getDocument via injected Vite worker...');
    const loadingTask = data instanceof Uint8Array
      ? pdfjsLib.getDocument({
          data: new Uint8Array(data),
          useWorkerFetch: false,
          isEvalSupported: false,
          verbosity: verbose ? 5 : 0
        })
      : pdfjsLib.getDocument({
          url: data as string,
          useWorkerFetch: false,
          isEvalSupported: false,
          verbosity: verbose ? 5 : 0
        });

    logToTerminal(`[pdfUtils] Stage 1: Awaiting promise with ${timeout}ms timeout...`);
    // Add timeout protection
    const result = await Promise.race([
      loadingTask.promise,
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error(`PDF loading timed out after ${timeout}ms`)), timeout)
      )
    ]);

    if (verbose) {
      console.log(`[pdfUtils] ✓ PDF loaded successfully (${result ? result.numPages : 0} pages)`);
      logToTerminal(`[pdfUtils] ✓ PDF loaded successfully (${result ? result.numPages : 0} pages)`);
    }

    return result as PDFDocumentProxy;
  } catch (error) {
    logToTerminal(`[pdfUtils] Error in Stage 1: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(
      `Failed to load PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

interface RenderOptions {
  scale?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export async function renderPageToDataURL(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {}
): Promise<string> {
  const { scale = 1.5, format = 'png', quality = 0.9 } = options;

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(
      `Invalid page number: ${pageNumber}. Document has ${pdf.numPages} pages.`
    );
  }

  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: context.canvas
    }).promise;

    if (format === 'jpeg') {
      return canvas.toDataURL('image/jpeg', quality);
    } else {
      return canvas.toDataURL('image/png');
    }
  } catch (error) {
    console.error(`[pdfUtils] Failed to render page ${pageNumber}:`, error);
    throw new Error(
      `Failed to render page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
