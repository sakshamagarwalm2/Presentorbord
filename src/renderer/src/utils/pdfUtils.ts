// @ts-ignore - The @types/pdfjs-dist package doesn't cover the modern build path
import * as pdfjsLib from "pdfjs-dist/build/pdf.min.mjs";
// @ts-ignore - The @types/pdfjs-dist package doesn't cover the modern build path
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-ignore - Vite-specific worker import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path using Vite's URL handling
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * PDF Utility with Robust Electron Worker Handling
 */

interface LoadPdfOptions {
  timeout?: number;
  verbose?: boolean;
}

// Helper for sending logs to Electron Main process terminal
function logToTerminal(msg: string) {
  if (window.api && window.api.log) {
    window.api.log(msg);
  } else {
    console.log(msg);
  }
}

export async function loadPdf(
  data: string | Uint8Array,
  options: LoadPdfOptions = {},
): Promise<PDFDocumentProxy> {
  const startTime = performance.now();
  const { timeout = 120000, verbose = false } = options; 

  if (verbose) {
    logToTerminal("[pdfUtils] Initializing PDF loader...");
  }

  try {
    logToTerminal("[pdfUtils] Starting getDocument...");
    
    // Ensure data is a proper Uint8Array for the worker
    const pdfData = data instanceof Uint8Array ? data : new Uint8Array(await (await fetch(data)).arrayBuffer());

    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      verbosity: verbose ? 5 : 0,
    });

    const result = await Promise.race([
      loadingTask.promise,
      new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new Error(`PDF loading timed out after ${timeout}ms`)),
          timeout,
        ),
      ),
    ]);

    const endTime = performance.now();
    logToTerminal(`[pdfUtils] ✓ PDF loaded in ${(endTime - startTime).toFixed(2)}ms (${result ? result.numPages : 0} pages)`);

    return result as PDFDocumentProxy;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logToTerminal(`[pdfUtils] ERROR: ${err.message}`);
    logToTerminal(`[pdfUtils] Stack: ${err.stack}`);
    throw error;
  }
}

interface RenderOptions {
  scale?: number;
  format?: "png" | "jpeg";
  quality?: number;
}

/**
 * Renders a page to a Data URL (base64).
 * Returns data: URL compatible with tldraw assets.
 */
export async function renderPageToBlobUrl(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {},
): Promise<{ url: string; w: number; h: number }> {
  const startTime = performance.now();
  const { scale = 1.0, format = "jpeg", quality = 0.8 } = options;

  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Could not get 2D canvas context");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const url = canvas.toDataURL(`image/${format}`, quality);

    const endTime = performance.now();
    logToTerminal(`[pdfUtils] Page ${pageNumber} rendered to DataURL in ${(endTime - startTime).toFixed(2)}ms`);

    return { url, w: viewport.width, h: viewport.height };
  } catch (error) {
    logToTerminal(`[pdfUtils] Failed to render page ${pageNumber}: ${error}`);
    throw error;
  }
}

// Keeping these for compatibility if needed elsewhere
export async function renderPageToDataURL(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {},
): Promise<string> {
  const { url } = await renderPageToBlobUrl(pdf, pageNumber, options);
  return url; // Now returns data: URL instead of blob: URL
}
