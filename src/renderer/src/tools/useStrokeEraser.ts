import { useEffect, useRef, useCallback } from 'react'
import { Editor } from '@tldraw/tldraw'

/**
 * Custom hook that implements a "stroke eraser" – an eraser that only deletes
 * shapes whose bounds are directly hit by the pointer, rather than tldraw's
 * default behaviour of queueing everything for bulk deletion.
 *
 * When active, this hook intercepts pointer events on the tldraw canvas and
 * calls `editor.getShapesAtPoint()` + `editor.deleteShapes()` in real-time
 * as the pointer moves.
 */
export function useStrokeEraser(
  editor: Editor | null,
  active: boolean,
  eraserSize: number,
) {
  const isPointerDownRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  // Convert screen coordinates to page coordinates using the editor camera
  const screenToPage = useCallback(
    (screenX: number, screenY: number) => {
      if (!editor) return { x: 0, y: 0 }
      return editor.screenToPage({ x: screenX, y: screenY })
    },
    [editor],
  )

  const eraseAtPoint = useCallback(
    (screenX: number, screenY: number) => {
      if (!editor) return
      const pagePoint = screenToPage(screenX, screenY)
      const shapes = editor.getShapesAtPoint(pagePoint, {
        margin: eraserSize,
        hitInside: true,
      })

      if (shapes.length === 0) {
          // Log occasionally to avoid spam, but enough to see it's working
          if (Math.random() < 0.1) {
              console.log(`[StrokeEraser] Searching at point`, pagePoint, `(Margin: ${eraserSize}) - No shapes found.`)
          }
          return;
      }

      if (shapes.length > 0) {
        // Detailed info about what was found
        const foundDetails = shapes.map(s => {
            const isCustom = s.type === 'custom-draw';
            const isSuper = s.type === 'super-pen';
            let details = `[${s.type}]`;
            if (isCustom) details += ` pen:${s.meta?.brushType || 'standard'}`;
            if (isSuper) details += ` mode:${(s as any).props?.mode}`;
            return details;
        });
        
        console.log(`[StrokeEraser] Found ${shapes.length} shapes:`, foundDetails.join(', '), pagePoint)
        
        // Filter out locked shapes and non-erasable shapes (like images used as slide backgrounds)
        const erasable = shapes.filter((s) => {
          const isLocked = editor.isShapeOrAncestorLocked(s)
          const isBackground = s.type === 'image' && s.parentId === editor.getCurrentPageId()
          
          if (isLocked) console.log(`[StrokeEraser] SKIPPING: Shape ${s.id} is LOCKED.`)
          if (isBackground) console.log(`[StrokeEraser] SKIPPING: Shape ${s.id} is SLIDE BACKGROUND.`)
          
          return !isLocked && !isBackground
        })

        if (erasable.length > 0) {
          const deleteDetails = erasable.map(s => {
             if (s.type === 'custom-draw') return `CustomDraw(${s.meta?.brushType || 'pen'})`;
             if (s.type === 'super-pen') return `SuperPen(${(s as any).props?.mode})`;
             return s.type;
          });
          
          console.log(`[StrokeEraser] ERASING:`, deleteDetails.join(', '))
          editor.deleteShapes(erasable.map((s) => s.id))
        } else {
          console.log(`[StrokeEraser] RESULT: No erasable shapes at this point after filtering.`)
        }
      }
    },
    [editor, eraserSize, screenToPage],
  )

  useEffect(() => {
    if (!active || !editor) return

    console.log(`[StrokeEraser] Activated with size ${eraserSize}`)

    const container = document.querySelector('.tl-container') as HTMLElement
    if (!container) return

    const onPointerDown = (e: PointerEvent) => {
      // Only respond to pen and mouse, not touch (touch is handled by palm eraser)
      if (e.pointerType === 'touch') return
      console.log(`[StrokeEraser] Pointer Down: ${e.pointerType} at (${e.clientX}, ${e.clientY})`)
      isPointerDownRef.current = true
      eraseAtPoint(e.clientX, e.clientY)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return
      if (e.pointerType === 'touch') return

      // Throttle with rAF
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        eraseAtPoint(e.clientX, e.clientY)
        rafRef.current = null
      })
    }

    const onPointerUp = () => {
      isPointerDownRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    container.addEventListener('pointerdown', onPointerDown, { capture: true })
    container.addEventListener('pointermove', onPointerMove, { capture: true })
    container.addEventListener('pointerup', onPointerUp, { capture: true })
    container.addEventListener('pointerleave', onPointerUp, { capture: true })

    return () => {
      container.removeEventListener('pointerdown', onPointerDown, { capture: true } as any)
      container.removeEventListener('pointermove', onPointerMove, { capture: true } as any)
      container.removeEventListener('pointerup', onPointerUp, { capture: true } as any)
      container.removeEventListener('pointerleave', onPointerUp, { capture: true } as any)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [active, editor, eraseAtPoint])
}
