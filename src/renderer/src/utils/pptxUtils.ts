
import JSZip from 'jszip';
import { SLIDE_WIDTH, SLIDE_HEIGHT, SLIDE_RENDER_QUALITY } from '../constants/slideConstants';

export interface SlideImage {
  url: string;
  w: number;
  h: number;
}

const PPTX_WIDTH_EMU = 12192000;
const PPTX_HEIGHT_EMU = 6858000;

function drawImage(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number, y: number, w: number, h: number
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => { ctx.drawImage(img, x, y, w, h); resolve(); };
    img.onerror = () => resolve();
    img.src     = url;
  });
}

async function renderSlideToImage(
  zip: JSZip,
  slidePath: string
): Promise<SlideImage> {
  const canvas = document.createElement('canvas');
  canvas.width  = SLIDE_WIDTH;
  canvas.height = SLIDE_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);

  const xmlText = await zip.files[slidePath].async('text');
  const parser  = new DOMParser();
  const xmlDoc  = parser.parseFromString(xmlText, 'application/xml');

  const relPath = slidePath
    .replace('slides/slide', 'slides/_rels/slide')
    .replace('.xml', '.xml.rels');

  const relFile = zip.files[relPath];
  const imageMap: Record<string, string> = {};

  if (relFile) {
    const relXml = await relFile.async('text');
    const relDoc = parser.parseFromString(relXml, 'application/xml');
    const relationships = relDoc.querySelectorAll('Relationship');

    for (const rel of Array.from(relationships)) {
      const type   = rel.getAttribute('Type') || '';
      const rId    = rel.getAttribute('Id')   || '';
      const target = rel.getAttribute('Target') || '';

      if (type.includes('image')) {
        let mediaPath: string;
        if (target.startsWith('../')) {
          mediaPath = 'ppt/' + target.slice(3);
        } else if (target.startsWith('media/')) {
          mediaPath = 'ppt/' + target;
        } else {
          mediaPath = 'ppt/slides/' + target;
        }

        const mediaFile = zip.files[mediaPath];
        if (mediaFile) {
          const blob    = await mediaFile.async('blob');
          imageMap[rId] = URL.createObjectURL(blob);
        }
      }
    }
  }

  const blips = xmlDoc.querySelectorAll('blipFill blip');
  for (const blip of Array.from(blips)) {
    const rId    = blip.getAttribute('r:embed') || blip.getAttribute('embed') || '';
    const imgUrl = imageMap[rId];
    if (!imgUrl) continue;

    const pic    = blip.closest('pic') as Element;
    const spPr   = pic?.querySelector('spPr');
    const xfrm   = spPr?.querySelector('xfrm');
    const off    = xfrm?.querySelector('off');
    const ext    = xfrm?.querySelector('ext');

    if (off && ext) {
      const x = (parseInt(off.getAttribute('x') || '0') / PPTX_WIDTH_EMU) * SLIDE_WIDTH;
      const y = (parseInt(off.getAttribute('y') || '0') / PPTX_HEIGHT_EMU) * SLIDE_HEIGHT;
      const w = (parseInt(ext.getAttribute('cx') || '0') / PPTX_WIDTH_EMU) * SLIDE_WIDTH;
      const h = (parseInt(ext.getAttribute('cy') || '0') / PPTX_HEIGHT_EMU) * SLIDE_HEIGHT;
      await drawImage(ctx, imgUrl, x, y, w, h);
    } else {
      await drawImage(ctx, imgUrl, 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    }
  }

  Object.values(imageMap).forEach(url => URL.revokeObjectURL(url));

  const url = canvas.toDataURL('image/jpeg', SLIDE_RENDER_QUALITY);

  return { url, w: SLIDE_WIDTH, h: SLIDE_HEIGHT };
}

export async function extractPptxSlides(
  fileBuffer: ArrayBuffer
): Promise<SlideImage[]> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const slides: SlideImage[] = [];

  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)![0]);
      const numB = parseInt(b.match(/\d+/)![0]);
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    try {
      const slideImage = await renderSlideToImage(zip, slidePath);
      slides.push(slideImage);
    } catch (err) {
      console.error(`Failed to render slide: ${slidePath}`, err);
      slides.push({
        url: '',
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
      });
    }
  }

  return slides;
}
