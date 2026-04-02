import { useEffect, useRef, useCallback } from 'react'
import { Editor, Vec } from '@tldraw/tldraw'

/**
 * Robust distance from point P to line segment AB
 */
function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const l2 = Vec.Dist2(a, b)
  if (l2 === 0) return Vec.Dist(p, a)
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return Vec.Dist(p, new Vec(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y)))
}

/**
 * Custom hook that implements a "precision eraser" cursor overlay
 */
export function useStrokeEraser(
  editor: Editor | null,
  active: boolean,
  eraserSize: number,
  mode: 'shape' | 'precision' = 'precision',
) {
  const isPointerDownRef = useRef(false)
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
      const shapes = editor.getShapesAtPoint(pagePoint, {
        margin: eraserSize,
        hitInside: true,
      })

      if (shapes.length === 0) return

      const erasable = shapes.filter((s) => {
        const isLocked = editor.isShapeOrAncestorLocked(s)
        const isBackground = s.type === 'image' && s.parentId === editor.getCurrentPageId()
        return !isLocked && !isBackground
      })

      if (erasable.length === 0) return

      editor.deleteShapes(erasable.map((s) => s.id))
    },
    [editor, eraserSize, screenToPage],
  )

  useEffect(() => {
    if (!active || !editor) return

    console.log(`[Eraser] Activated: Mode=${mode}, Size=${eraserSize}`)

    const container = document.querySelector('.tl-container') as HTMLElement
    if (!container) return

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      isPointerDownRef.current = true
      // Note: we don't call eraseAtPoint here because PrecisionEraserTool handles erasing
      // This hook is now primarily for the cursor overlay in DrawingToolbar.tsx
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return
      if (e.pointerType === 'touch') return
      // Erasing handled by the tool
    }

    const onPointerUp = () => {
      isPointerDownRef.current = false
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
    }
  }, [active, editor, mode, eraserSize])
}
