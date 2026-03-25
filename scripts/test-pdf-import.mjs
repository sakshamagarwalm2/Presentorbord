import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.min.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_FILES = [
  "C:\\Users\\SAKSHAM\\Downloads\\Pt.1, Ch-4 सारणिक [CUET 2026].pdf",
  "C:\\Users\\SAKSHAM\\Downloads\\NDA-II, Maths Paper (SET-A) [2025].pdf"
];

// Use file:// URL for worker in node_modules
const workerPath = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs");
pdfjsLib.GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, "/")}`;

async function loadPdf(filePath) {
  const startTime = performance.now();
  const fileName = path.basename(filePath);
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${fileName}`);
  console.log("=".repeat(60));
  
  const fileBuffer = fs.readFileSync(filePath);
  const data = new Uint8Array(fileBuffer);
  
  console.log(`File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
  
  // Stage 1: Parse PDF (what happens in browser)
  const parseStart = performance.now();
  const pdf = await pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0
  }).promise;
  const parseTime = performance.now() - parseStart;
  
  console.log(`\n--- PARSE STAGE ---`);
  console.log(`Pages: ${pdf.numPages}`);
  console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
  
  // Stage 2: Get all pages (metadata)
  const pageMetaStart = performance.now();
  const pageInfos = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    pageInfos.push({
      pageNum: i,
      width: viewport.width,
      height: viewport.height
    });
  }
  const pageMetaTime = performance.now() - pageMetaStart;
  
  console.log(`\n--- PAGE METADATA ---`);
  console.log(`Total pages: ${pdf.numPages}`);
  console.log(`Page metadata time: ${pageMetaTime.toFixed(2)}ms`);
  console.log(`Avg per page: ${(pageMetaTime / pdf.numPages).toFixed(2)}ms`);
  
  const totalTime = performance.now() - startTime;
  
  console.log(`\n--- SUMMARY ---`);
  console.log(`TOTAL LOAD TIME: ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(2)}s)`);
  
  if (totalTime > 4000) {
    console.log(`\n⚠️  WARNING: ${(totalTime/1000).toFixed(2)}s exceeds 4s target!`);
  } else if (totalTime > 2000) {
    console.log(`\n✓ OK: ${(totalTime/1000).toFixed(2)}s is within 2-4s range`);
  } else {
    console.log(`\n✓ GREAT: ${(totalTime/1000).toFixed(2)}s is under 2s target!`);
  }
  
  return {
    fileName,
    fileSize: fileBuffer.length,
    numPages: pdf.numPages,
    parseTime,
    pageMetaTime,
    totalTime,
    pageInfos
  };
}

async function main() {
  console.log("PDF Import Performance Test");
  console.log("============================\n");
  console.log("Target: < 2-4 seconds per PDF");
  console.log(`Worker: ${path.basename(pdfjsLib.GlobalWorkerOptions.workerSrc)}`);
  
  const results = [];
  
  for (const filePath of PDF_FILES) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`\n⚠️  File not found: ${filePath}`);
        continue;
      }
      const result = await loadPdf(filePath);
      results.push(result);
    } catch (error) {
      console.error(`\n❌ ERROR loading ${filePath}:`, error.message);
      if (error.stack) console.error(error.stack);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("OVERALL COMPARISON");
  console.log("=".repeat(60));
  
  for (const r of results) {
    console.log(`\n${r.fileName}:`);
    console.log(`  Size: ${(r.fileSize/1024).toFixed(2)}KB, Pages: ${r.numPages}`);
    console.log(`  Parse: ${r.parseTime.toFixed(2)}ms, Meta: ${r.pageMetaTime.toFixed(2)}ms`);
    console.log(`  TOTAL: ${r.totalTime.toFixed(2)}ms (${(r.totalTime/1000).toFixed(2)}s)`);
  }
  
  if (results.length > 0) {
    const avgTotal = results.reduce((a, b) => a + b.totalTime, 0) / results.length;
    console.log(`\nAverage total time: ${avgTotal.toFixed(2)}ms (${(avgTotal/1000).toFixed(2)}s)`);
  }
}

main().catch(console.error);
