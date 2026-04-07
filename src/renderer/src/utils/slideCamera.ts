
import type { Editor } from 'tldraw';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '../constants/slideConstants';

export function fitSlideToViewport(editor: Editor): void {
  if (!editor) return;
  const bounds = editor.getViewportScreenBounds();
  if (!bounds || bounds.w === 0 || bounds.h === 0) return;

  editor.zoomToBounds(
    { x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT },
    {
      animation: { duration: 0 },
      inset: 0,
    }
  );
}

export function animateSlideToViewport(editor: Editor): void {
  if (!editor) return;
  const bounds = editor.getViewportScreenBounds();
  if (!bounds || bounds.w === 0 || bounds.h === 0) return;

  editor.zoomToBounds(
    { x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT },
    {
      animation: { duration: 200, easing: (t: number) => t * (2 - t) },
      inset: 0,
    }
  );
}

/**
 * Resets the camera for all pages to fit the slide dimensions.
 */
export function fitAllSlidesToViewport(editor: Editor): void {
  if (!editor) return;
  
  const pages = editor.getPages();
  const originalPageId = editor.getCurrentPageId();
  
  // We use a batch to update everything at once
  editor.run(() => {
    for (const page of pages) {
      editor.setCurrentPage(page.id);
      fitSlideToViewport(editor);
    }
    // Switch back to the original page
    editor.setCurrentPage(originalPageId);
  }, { history: 'ignore' });
}
