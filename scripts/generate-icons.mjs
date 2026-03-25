import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'src', 'assets');
const buildDir = path.join(__dirname, '..', 'build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

async function createRoundedIcon() {
  const inputPath = path.join(assetsDir, 'presentor.jpg');
  const outputPath = path.join(buildDir, 'icon.png');
  
  const size = 256;
  const radius = 45;
  
  // First resize the image
  const resizedBuffer = await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  
  // Apply rounded corners manually
  const output = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcIdx = (y * size + x) * 4;
      const dstIdx = (y * size + x) * 4;
      
      // Check corners
      let inside = true;
      if (x < radius && y < radius) {
        const dx = radius - x;
        const dy = radius - y;
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (x >= size - radius && y < radius) {
        const dx = x - (size - radius - 1);
        const dy = radius - y;
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (x < radius && y >= size - radius) {
        const dx = radius - x;
        const dy = y - (size - radius - 1);
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (x >= size - radius && y >= size - radius) {
        const dx = x - (size - radius - 1);
        const dy = y - (size - radius - 1);
        if (dx * dx + dy * dy > radius * radius) inside = false;
      }
      
      if (inside) {
        output[dstIdx] = resizedBuffer[srcIdx];
        output[dstIdx + 1] = resizedBuffer[srcIdx + 1];
        output[dstIdx + 2] = resizedBuffer[srcIdx + 2];
        output[dstIdx + 3] = 255;
      } else {
        output[dstIdx] = 0;
        output[dstIdx + 1] = 0;
        output[dstIdx + 2] = 0;
        output[dstIdx + 3] = 0;
      }
    }
  }
  
  await sharp(output, {
    raw: { width: size, height: size, channels: 4 }
  })
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Created rounded icon: ${outputPath}`);
  return outputPath;
}

async function main() {
  console.log('Generating icons...\n');
  
  await createRoundedIcon();
  
  console.log('\n✓ Icon generation complete!');
  console.log(`   Output: ${buildDir}/icon.png`);
}

main().catch(console.error);
