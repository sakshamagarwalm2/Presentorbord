
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Get worker code as string
// @ts-ignore
import pdfWorkerRaw from 'pdfjs-dist/build/pdf.worker.min.mjs?raw';

/**
 * PDF Utility with Robust Electron Worker Handling
 */

interface LoadPdfOptions {
  timeout?: number;
  verbose?: boolean;
}

export async function loadPdf(
  data: string | Uint8Array,
  options: LoadPdfOptions = {}
): Promise<PDFDocumentProxy> {
  const { timeout = 30000, verbose = false } = options;

  if (verbose) {
    console.log('[pdfUtils] Initializing PDF loader...');
  }

  // Create a Blob URL for the worker
  // This bypasses file resolution issues in Electron
  const blob = new Blob([pdfWorkerRaw], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  if (verbose) {
    console.log('[pdfUtils] Created worker Blob URL:', workerUrl);
  }

  // Explicitly set the worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  try {
    const loadingTask = data instanceof Uint8Array
      ? pdfjsLib.getDocument({
          data: new Uint8Array(data),
          useWorkerFetch: false,
          isEvalSupported: false,
          verbosity: verbose ? 5 : 0,
        })
      : pdfjsLib.getDocument({
          url: data as string,
          useWorkerFetch: false,
          isEvalSupported: false,
          verbosity: verbose ? 5 : 0,
        });

    // Add timeout protection
    const result = await Promise.race([
      loadingTask.promise,
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error(`PDF loading timed out after ${timeout}ms`)), timeout)
      )
    ]);

    // Clean up the Blob URL
    URL.revokeObjectURL(workerUrl);

    if (verbose) {
      console.log(`[pdfUtils] ✓ PDF loaded successfully (${result.numPages} pages)`);
    }

    return result as PDFDocumentProxy;
  } catch (error) {
    // If standard load fails, try manual worker injection
    console.warn('[pdfUtils] Standard load failed, trying manual worker injection...', error);
    
    try {
        const worker = new Worker(workerUrl);
        
        const loadingTask = data instanceof Uint8Array
        ? pdfjsLib.getDocument({
            data: new Uint8Array(data),
            useWorkerFetch: false,
            isEvalSupported: false,
            verbosity: verbose ? 5 : 0,
            worker // Inject manually created worker
            })
        : pdfjsLib.getDocument({
            url: data as string,
            useWorkerFetch: false,
            isEvalSupported: false,
            verbosity: verbose ? 5 : 0,
            worker
            });

        const result = await loadingTask.promise;
        URL.revokeObjectURL(workerUrl);
        return result;
    } catch (manualError) {
        URL.revokeObjectURL(workerUrl);
        console.error('[pdfUtils] Failed to load PDF even with manual worker:', manualError);
        throw new Error(
            `Failed to load PDF: ${manualError instanceof Error ? manualError.message : String(manualError)}`
        );
    }
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
