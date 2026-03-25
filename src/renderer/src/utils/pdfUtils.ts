// @ts-ignore - The @types/pdfjs-dist package doesn't cover the legacy build path
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.min.mjs";
// @ts-ignore - The @types/pdfjs-dist package doesn't cover the legacy build path
import type { PDFDocumentProxy } from "pdfjs-dist";

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
  const { timeout = 30000, verbose = false } = options;

  if (verbose) {
    logToTerminal("[pdfUtils] Initializing PDF loader...");
  }

  try {
    // Use the legacy worker that's bundled with pdfjs-dist
    // This is more reliable than custom worker imports in Electron
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    logToTerminal("[pdfUtils] Worker configured, starting getDocument...");
    const loadingTask =
      data instanceof Uint8Array
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
    if ((error as any)?.cause) {
      logToTerminal(`[pdfUtils] Cause: ${(error as any).cause}`);
    }
    throw error;
  }
}

interface RenderOptions {
  scale?: number;
  format?: "png" | "jpeg";
  quality?: number;
}

export async function renderPageToDataURL(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {},
): Promise<string> {
  const startTime = performance.now();
  const { scale = 1.5, format = "png", quality = 0.9 } = options;

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
      canvas: context.canvas,
    }).promise;

    const dataUrl = format === "jpeg" ? canvas.toDataURL("image/jpeg", quality) : canvas.toDataURL("image/png");
    
    const endTime = performance.now();
    logToTerminal(`[pdfUtils] Page ${pageNumber} rendered to DataURL in ${(endTime - startTime).toFixed(2)}ms`);
    
    return dataUrl;
  } catch (error) {
    logToTerminal(`[pdfUtils] Failed to render page ${pageNumber}: ${error}`);
    throw error;
  }
}

export async function renderPageToArrayBuffer(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {},
): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
  const startTime = performance.now();
  const { scale = 1.5, format = "png", quality = 0.9 } = options;

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
      canvas: context.canvas,
    }).promise;

    const result = await new Promise<{ buffer: ArrayBuffer; width: number; height: number }>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas to Blob failed"));
            return;
          }
          blob.arrayBuffer().then((buffer) => {
            resolve({
              buffer,
              width: viewport.width,
              height: viewport.height,
            });
          }).catch(reject);
        },
        format === "jpeg" ? "image/jpeg" : "image/png",
        quality,
      );
    });

    const endTime = performance.now();
    logToTerminal(`[pdfUtils] Page ${pageNumber} rendered to ArrayBuffer in ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    logToTerminal(`[pdfUtils] Failed to render page ${pageNumber} to buffer: ${error}`);
    throw error;
  }
}

export async function renderPageToBlobUrl(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {},
): Promise<{ url: string; width: number; height: number }> {
  const startTime = performance.now();
  const { scale = 1.5, format = "png", quality = 0.9 } = options;

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
      canvas: context.canvas,
    }).promise;

    const result = await new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas to Blob failed"));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({
            url,
            width: viewport.width,
            height: viewport.height,
          });
        },
        format === "jpeg" ? "image/jpeg" : "image/png",
        quality,
      );
    });

    const endTime = performance.now();
    logToTerminal(`[pdfUtils] Page ${pageNumber} rendered to BlobURL in ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    logToTerminal(`[pdfUtils] Failed to render page ${pageNumber} to blob URL: ${error}`);
    throw error;
  }
}
