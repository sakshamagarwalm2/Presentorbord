
// @ts-ignore - The @types/pdfjs-dist package doesn't cover the modern build path
import * as pdfjsLib from "pdfjs-dist/build/pdf.min.mjs";
// @ts-ignore - The @types/pdfjs-dist package doesn't cover the modern build path
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-ignore - Vite-specific worker import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { SLIDE_WIDTH, SLIDE_HEIGHT, SLIDE_RENDER_QUALITY } from '../constants/slideConstants';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface LoadPdfOptions {
  timeout?: number;
  verbose?: boolean;
}

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
    logToTerminal(`[pdfUtils] PDF loaded in ${(endTime - startTime).toFixed(2)}ms (${result ? result.numPages : 0} pages)`);

    return result as PDFDocumentProxy;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logToTerminal(`[pdfUtils] ERROR: ${err.message}`);
    throw error;
  }
}

interface SlideRenderOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
}

export async function renderPageToSlideDataUrl(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: SlideRenderOptions = {},
): Promise<{ url: string; w: number; h: number }> {
  const startTime = performance.now();
  const {
    targetWidth = SLIDE_WIDTH,
    targetHeight = SLIDE_HEIGHT,
    quality = SLIDE_RENDER_QUALITY,
  } = options;

  const page = await pdf.getPage(pageNumber);
  const viewport1x = page.getViewport({ scale: 1 });

  const scale = Math.min(
    targetWidth / viewport1x.width,
    targetHeight / viewport1x.height,
  );

  const scaledW = viewport1x.width * scale;
  const scaledH = viewport1x.height * scale;
  const offsetX = (targetWidth - scaledW) / 2;
  const offsetY = (targetHeight - scaledH) / 2;

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  await page.render({
    canvasContext: ctx,
    viewport,
    transform: [1, 0, 0, 1, offsetX, offsetY],
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  logToTerminal(`[pdfUtils] Page ${pageNumber} rendered in ${(performance.now() - startTime).toFixed(2)}ms`);
  return { url: dataUrl, w: targetWidth, h: targetHeight };
}

interface LegacyRenderOptions {
  scale?: number;
  format?: "png" | "jpeg";
  quality?: number;
}

export async function renderPageToBlobUrl(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: LegacyRenderOptions = {},
): Promise<{ url: string; w: number; h: number }> {
  const { scale = 1.0, quality = 0.8 } = options;
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

  const url = canvas.toDataURL(`image/${options.format ?? "jpeg"}`, quality);

  return { url, w: viewport.width, h: viewport.height };
}

export async function renderPageToDataURL(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: LegacyRenderOptions = {},
): Promise<string> {
  const { url } = await renderPageToBlobUrl(pdf, pageNumber, options);
  return url;
}
