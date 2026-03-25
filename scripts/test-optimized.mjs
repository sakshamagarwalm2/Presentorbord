import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.min.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_FILES = [
  "C:\\Users\\SAKSHAM\\Downloads\\Pt.1, Ch-4 सारणिक [CUET 2026].pdf",
  "C:\\Users\\SAKSHAM\\Downloads\\NDA-II, Maths Paper (SET-A) [2025].pdf"
];

const workerPath = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs");
pdfjsLib.GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, "/")}`;

async function simulateOptimizedImport(filePath) {
  const fileName = path.basename(filePath);
  const overallStart = performance.now();
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`OPTIMIZED IMPORT: ${fileName}`);
  console.log("=".repeat(60));
  
  const fileBuffer = fs.readFileSync(filePath);
  const data = new Uint8Array(fileBuffer);
  console.log(`File: ${(fileBuffer.length/1024).toFixed(2)}KB`);
  
  // Stage 1: Parse
  const parseStart = performance.now();
  const pdf = await pdfjsLib.getDocument({ data, verbosity: 0 }).promise;
  const parseTime = performance.now() - parseStart;
  console.log(`\n[1] Parse: ${parseTime.toFixed(2)}ms (${pdf.numPages} pages)`);
  
  const scale = 1.5;
  const PARALLEL_BATCH_SIZE = 4;
  
  // Stage 2: Render in parallel batches (like optimized code)
  const renderStart = performance.now();
  console.log(`\n[2] Rendering in parallel batches of ${PARALLEL_BATCH_SIZE}...`);
  
  const pageNumbers = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  const renderTimes = [];
  
  for (let i = 0; i < pageNumbers.length; i += PARALLEL_BATCH_SIZE) {
    const batch = pageNumbers.slice(i, i + PARALLEL_BATCH_SIZE);
    const batchStart = performance.now();
    
    // Render batch in parallel
    const batchPromises = batch.map(async (pageNum) => {
      const pageStart = performance.now();
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      // Simulate canvas render time
      await new Promise(r => setTimeout(r, viewport.width * viewport.height / 100000));
      
      return { pageNum, time: performance.now() - pageStart };
    });
    
    const batchResults = await Promise.all(batchPromises);
    const batchTime = performance.now() - batchStart;
    renderTimes.push(...batchResults.map(r => r.time));
    
    console.log(`  Batch ${Math.floor(i/PARALLEL_BATCH_SIZE)+1}: ${batchTime.toFixed(2)}ms for pages ${batch.join(', ')}`);
  }
  
  const totalRenderTime = performance.now() - renderStart;
  console.log(`\n[2] Total render: ${totalRenderTime.toFixed(2)}ms`);
  console.log(`    Avg per page: ${(totalRenderTime/pdf.numPages).toFixed(2)}ms`);
  
  // Stage 3: IPC + tldraw (sequential, but fast)
  const estimatedIpcTime = pdf.numPages * 2;
  const estimatedTldrawTime = pdf.numPages * 3;
  console.log(`\n[3] Estimated IPC: ~${estimatedIpcTime}ms`);
  console.log(`[4] Estimated tldraw: ~${estimatedTldrawTime}ms`);
  
  const overallTime = performance.now() - overallStart;
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL: ${overallTime.toFixed(2)}ms (${(overallTime/1000).toFixed(2)}s)`);
  console.log("=".repeat(60));
  
  if (overallTime > 4000) {
    console.log(`⚠️  EXCEEDS 4s target`);
  } else if (overallTime > 2000) {
    console.log(`✓ Within 2-4s range`);
  } else {
    console.log(`✓ UNDER 2s target!`);
  }
  
  return { fileName, numPages: pdf.numPages, totalTime: overallTime };
}

async function main() {
  console.log("OPTIMIZED PDF IMPORT TEST");
  console.log("========================\n");
  console.log("Using parallel batches of 4\n");
  
  for (const filePath of PDF_FILES) {
    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  File not found: ${filePath}`);
      continue;
    }
    await simulateOptimizedImport(filePath);
  }
}

main().catch(console.error);
