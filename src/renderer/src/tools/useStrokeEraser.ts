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
      if (shapes.length > 0) {
        // Filter out locked shapes and non-erasable shapes (like images used as slide backgrounds)
        const erasable = shapes.filter((s) => {
          if (editor.isShapeOrAncestorLocked(s)) return false
          // Don't erase page-level images (slide backgrounds)
          if (s.type === 'image' && s.parentId === editor.getCurrentPageId()) return false
          return true
        })
        if (erasable.length > 0) {
          editor.deleteShapes(erasable.map((s) => s.id))
        }
      }
    },
    [editor, eraserSize, screenToPage],
  )

  useEffect(() => {
    if (!active || !editor) return

    const container = document.querySelector('.tl-container') as HTMLElement
    if (!container) return

    const onPointerDown = (e: PointerEvent) => {
      // Only respond to pen and mouse, not touch (touch is handled by palm eraser)
      if (e.pointerType === 'touch') return
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
