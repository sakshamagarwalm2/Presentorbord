import { useEffect, useRef, useCallback } from 'react'
import { Editor } from '@tldraw/tldraw'

/**
 * Detects palm touch while a stylus (pen) is active and auto-erases shapes
 * under the palm contact point.
 *
 * How it works:
 * - Tracks whether a `pen` pointer is currently active
 * - When a `touch` event fires while pen is active, treats it as palm input
 * - Erases shapes at the touch point using editor.getShapesAtPoint()
 * - Restores the previous tool when the palm lifts
 */
export function usePalmEraser(
  editor: Editor | null,
  enabled: boolean,
  eraserSize: number,
) {
  const penActiveRef = useRef(false)
  const previousToolRef = useRef<string | null>(null)
  const palmPointersRef = useRef<Set<number>>(new Set())
  const rafRef = useRef<number | null>(null)

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
      // Palm contacts are usually large, so use a bigger margin
      const palmRadius = Math.max(eraserSize, 20)
      const shapes = editor.getShapesAtPoint(pagePoint, {
        margin: palmRadius,
        hitInside: true,
      })
      if (shapes.length > 0) {
        const erasable = shapes.filter((s) => {
          if (editor.isShapeOrAncestorLocked(s)) return false
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
    if (!enabled || !editor) return

    const container = document.querySelector('.tl-container') as HTMLElement
    if (!container) return

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'pen') {
        penActiveRef.current = true
      }

      // If pen is active and a touch happens, treat as palm
      if (e.pointerType === 'touch' && penActiveRef.current) {
        e.preventDefault()
        e.stopPropagation()
        palmPointersRef.current.add(e.pointerId)

        // Save previous tool on first palm contact
        if (palmPointersRef.current.size === 1 && !previousToolRef.current) {
          previousToolRef.current = editor.getCurrentToolId()
        }

        eraseAtPoint(e.clientX, e.clientY)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && palmPointersRef.current.has(e.pointerId)) {
        e.preventDefault()
        e.stopPropagation()

        if (rafRef.current !== null) return
        rafRef.current = requestAnimationFrame(() => {
          eraseAtPoint(e.clientX, e.clientY)
          rafRef.current = null
        })
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'pen') {
        // Keep penActive for a short delay to handle palm that lifts after stylus
        setTimeout(() => {
          penActiveRef.current = false
        }, 500)
      }

      if (e.pointerType === 'touch') {
        palmPointersRef.current.delete(e.pointerId)

        // Restore tool when all palm contacts are lifted
        if (palmPointersRef.current.size === 0 && previousToolRef.current) {
          editor.setCurrentTool(previousToolRef.current)
          previousToolRef.current = null
        }
      }
    }

    container.addEventListener('pointerdown', onPointerDown, { capture: true })
    container.addEventListener('pointermove', onPointerMove, { capture: true })
    container.addEventListener('pointerup', onPointerUp, { capture: true })
    container.addEventListener('pointercancel', onPointerUp, { capture: true })

    return () => {
      container.removeEventListener('pointerdown', onPointerDown, { capture: true } as any)
      container.removeEventListener('pointermove', onPointerMove, { capture: true } as any)
      container.removeEventListener('pointerup', onPointerUp, { capture: true } as any)
      container.removeEventListener('pointercancel', onPointerUp, { capture: true } as any)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [enabled, editor, eraseAtPoint])
}
