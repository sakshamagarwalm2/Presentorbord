
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
