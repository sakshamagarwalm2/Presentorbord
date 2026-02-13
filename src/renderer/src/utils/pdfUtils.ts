
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import '@tldraw/tldraw/tldraw.css' 

// Import worker as a URL using Vite's ?url suffix
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function loadPdf(data: string | Uint8Array) {
  const loadingTask = pdfjsLib.getDocument(data);
  return loadingTask.promise;
}

export async function renderPageToDataURL(pdf: PDFDocumentProxy, pageNumber: number, scale = 1.5): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (!context) throw new Error('Could not get canvas context');

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: context.canvas
  }).promise;

  return canvas.toDataURL('image/png');
}
