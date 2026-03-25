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

// Simulate browser canvas rendering using node-canvas
let canvasModule;
try {
  canvasModule = await import("canvas");
} catch (e) {
  console.log("Note: canvas module not available, will skip rendering test");
}

async function simulateFullImport(filePath) {
  const fileName = path.basename(filePath);
  const overallStart = performance.now();
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`FULL IMPORT SIMULATION: ${fileName}`);
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
  const renderTimes = [];
  
  // Stage 2: Render all pages sequentially (like current implementation)
  const renderStart = performance.now();
  console.log(`\n[2] Rendering all ${pdf.numPages} pages at scale ${scale}...`);
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const pageStart = performance.now();
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    if (canvasModule) {
      const canvas = canvasModule.createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;
    } else {
      // Simulate canvas render time (rough estimate)
      await new Promise(r => setTimeout(r, viewport.width * viewport.height / 100000));
    }
    
    const pageTime = performance.now() - pageStart;
    renderTimes.push(pageTime);
    
    if (i === 1 || i === pdf.numPages || i % 10 === 0) {
      console.log(`  Page ${i}/${pdf.numPages}: ${pageTime.toFixed(2)}ms`);
    }
  }
  
  const totalRenderTime = performance.now() - renderStart;
  const avgRenderTime = renderTimes.reduce((a,b) => a+b, 0) / renderTimes.length;
  console.log(`\n[2] Render total: ${totalRenderTime.toFixed(2)}ms`);
  console.log(`    Avg per page: ${avgRenderTime.toFixed(2)}ms`);
  
  // Stage 3: Simulate IPC save (each page saves to disk)
  const ipcStart = performance.now();
  console.log(`\n[3] Simulating IPC saves (${pdf.numPages} files)...`);
  // Estimate ~2ms per IPC roundtrip
  const estimatedIpcTime = pdf.numPages * 2;
  console.log(`    Estimated IPC overhead: ~${estimatedIpcTime}ms`);
  
  // Stage 4: Simulate tldraw object creation
  const tldrawStart = performance.now();
  console.log(`\n[4] Creating tldraw shapes/assets...`);
  // Estimate ~1-2ms per shape + asset
  const estimatedTldrawTime = pdf.numPages * 3;
  console.log(`    Estimated tldraw overhead: ~${estimatedTldrawTime}ms`);
  
  const overallTime = performance.now() - overallStart;
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL IMPORT TIME: ${overallTime.toFixed(2)}ms (${(overallTime/1000).toFixed(2)}s)`);
  console.log("=".repeat(60));
  
  if (overallTime > 4000) {
    console.log(`⚠️  EXCEEDS 4s target by ${(overallTime-4000).toFixed(0)}ms`);
  } else if (overallTime > 2000) {
    console.log(`✓ Within 2-4s range`);
  } else {
    console.log(`✓ UNDER 2s target!`);
  }
  
  return {
    fileName,
    numPages: pdf.numPages,
    parseTime,
    renderTime: totalRenderTime,
    ipcTime: estimatedIpcTime,
    tldrawTime: estimatedTldrawTime,
    totalTime: overallTime
  };
}

async function main() {
  console.log("FULL PDF IMPORT TIMING ANALYSIS");
  console.log("================================\n");
  console.log("Target: 2-4 seconds per PDF\n");
  
  for (const filePath of PDF_FILES) {
    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  File not found: ${filePath}`);
      continue;
    }
    await simulateFullImport(filePath);
  }
}

main().catch(console.error);
