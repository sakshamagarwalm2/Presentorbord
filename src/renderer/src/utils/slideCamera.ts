import type { Editor } from 'tldraw';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '../constants/slideConstants';

/**
 * Gets the bounding box of the background slide image on a page.
 * Falls back to default SLIDE_WIDTH/HEIGHT if not found.
 */
function getSlideBounds(editor: Editor, pageId: string) {
  const shapeIds = editor.getSortedChildIdsForParent(pageId as any);
  
  // 1. Look for explicit background meta
  let backgroundShape = shapeIds
    .map((id) => editor.getShape(id))
    .find((s) => s && s.type === 'image' && s.meta?.isPageBackground);

  // 2. Fallback: find any image at 0,0
  if (!backgroundShape) {
    backgroundShape = shapeIds
      .map((id) => editor.getShape(id))
      .find((s) => s && s.type === 'image' && s.x === 0 && s.y === 0);
  }

  if (backgroundShape && backgroundShape.type === 'image') {
    const props = backgroundShape.props as any;
    return {
      x: backgroundShape.x,
      y: backgroundShape.y,
      w: props.w,
      h: props.h,
      found: true
    };
  }

  // 3. Fallback to default constants
  return { x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, found: false };
}

export function fitSlideToViewport(editor: Editor): void {
  if (!editor) return;
  
  const pageId = editor.getCurrentPageId();
  const slideBounds = getSlideBounds(editor, pageId);
  const viewport = editor.getViewportScreenBounds();

  if (!viewport || viewport.w === 0 || viewport.h === 0) return;

  try {
    editor.zoomToBounds(
      { x: slideBounds.x, y: slideBounds.y, w: slideBounds.w, h: slideBounds.h },
      { animation: { duration: 0 }, inset: 0 }
    );
  } catch (err) {
    console.error('[slideCamera] Error in fitSlideToViewport:', err);
  }
}

export function animateSlideToViewport(editor: Editor): void {
  if (!editor) return;
  
  const pageId = editor.getCurrentPageId();
  const slideBounds = getSlideBounds(editor, pageId);
  const viewport = editor.getViewportScreenBounds();

  if (!viewport || viewport.w === 0 || viewport.h === 0) return;

  try {
    editor.zoomToBounds(
      { x: slideBounds.x, y: slideBounds.y, w: slideBounds.w, h: slideBounds.h },
      { 
        animation: { duration: 250, easing: (t: number) => t * (2 - t) }, 
        inset: 0 
      }
    );
  } catch (err) {
    console.error('[slideCamera] Error in animateSlideToViewport:', err);
  }
}

/**
 * Resets the camera for all pages to fit the slide dimensions.
 */
export function fitAllSlidesToViewport(editor: Editor): void {
  if (!editor) return;
  
  const pages = editor.getPages();
  const originalPageId = editor.getCurrentPageId();
  
  try {
    editor.run(() => {
      for (const page of pages) {
        editor.setCurrentPage(page.id);
        fitSlideToViewport(editor);
      }
      editor.setCurrentPage(originalPageId);
    }, { history: 'ignore' });
  } catch (err) {
    console.error('[slideCamera] Error in fitAllSlidesToViewport:', err);
  }
}
