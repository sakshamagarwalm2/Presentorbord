import { useEffect, useRef, useCallback } from 'react'
import { Editor, createShapeId, Vec } from '@tldraw/tldraw'

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
 * Custom hook that implements a "stroke eraser" or "precision eraser"
 */
export function useStrokeEraser(
  editor: Editor | null,
  active: boolean,
  eraserSize: number,
  mode: 'shape' | 'stroke' | 'precision' = 'stroke',
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

      if (mode === 'precision') {
        const toDelete: string[] = []
        const toCreate: any[] = []

        erasable.forEach((shape) => {
          let points: any[] = []
          let isSuper = false
          let isCustom = false

          if (shape.type === 'super-pen') {
            points = (shape as any).props.points || []
            isSuper = true
          } else if (shape.type === 'custom-draw') {
            // Flatten segments into a single points array for splitting
            const segments = (shape as any).props.segments || []
            segments.forEach((seg: any) => {
                seg.points.forEach((p: any) => points.push(p))
            })
            isCustom = true
          }

          if (points.length === 0) {
            console.log(`[PrecisionEraser] DELETE: Non-splittable or empty shape ${shape.id} (${shape.type})`)
            toDelete.push(shape.id)
            return
          }

          // Use local coordinates for distance check
          const localPoint = new Vec(pagePoint.x - shape.x, pagePoint.y - shape.y)
          
          // Step 1: Identify which segments are hit by the eraser
          // A segment (i, i+1) is hit if either point is inside OR the segment passes through
          const keepIndices: number[] = []
          const removedIndices: Set<number> = new Set()

          for (let i = 0; i < points.length; i++) {
            const p = points[i]
            const d = Vec.Dist(new Vec(p.x, p.y), localPoint)
            
            // If the point itself is in the eraser, remove it
            if (d <= eraserSize) {
              removedIndices.add(i)
              continue
            }

            // Also check the segment leading to the next point
            if (i < points.length - 1) {
              const nextP = points[i+1]
              const dSeg = distToSegment(localPoint, new Vec(p.x, p.y), new Vec(nextP.x, nextP.y))
              if (dSeg <= eraserSize) {
                // If the segment is hit, we mark BOTH points for potential removal 
                // OR we just ensure a split happens here. 
                // To be safe and precise, if a segment is hit, we split the stroke.
                removedIndices.add(i)
                removedIndices.add(i+1)
              }
            }
          }

          // Step 2: Build kept points
          for (let i = 0; i < points.length; i++) {
            if (!removedIndices.has(i)) {
              keepIndices.push(i)
            }
          }

          if (keepIndices.length === 0) {
            toDelete.push(shape.id)
            console.log(`[PrecisionEraser] DELETE: Entire stroke ${shape.id} erased.`)
          } else if (keepIndices.length < points.length) {
            toDelete.push(shape.id)
            
            const segments: any[][] = []
            let currentSegment: any[] = []
            
            for (let i = 0; i < keepIndices.length; i++) {
              const currentIndex = keepIndices[i]
              currentSegment.push(points[currentIndex])
              
              const nextIndex = keepIndices[i+1]
              if (nextIndex === undefined || nextIndex !== currentIndex + 1) {
                if (currentSegment.length > 0) {
                  segments.push(currentSegment)
                }
                currentSegment = []
              }
            }

            console.log(`[PrecisionEraser] SPLIT: ${shape.id} (${shape.type}) -> ${segments.length} parts.`)
            
            segments.forEach((seg) => {
              if (isSuper) {
                toCreate.push({
                  ...shape,
                  id: createShapeId(),
                  x: shape.x,
                  y: shape.y,
                  props: { ...shape.props, points: seg }
                })
              } else if (isCustom) {
                toCreate.push({
                  ...shape,
                  id: createShapeId(),
                  x: shape.x,
                  y: shape.y,
                  props: { 
                    ...shape.props, 
                    segments: [{ type: 'free', points: seg.map(p => ({ x: p.x, y: p.y, z: p.z || 0.5 })) }] 
                  }
                })
              }
            })
          }
        })

        if (toDelete.length > 0) editor.deleteShapes(toDelete)
        if (toCreate.length > 0) editor.createShapes(toCreate)
      } else {
        editor.deleteShapes(erasable.map((s) => s.id))
      }
    },
    [editor, eraserSize, screenToPage, mode],
  )

  useEffect(() => {
    if (!active || !editor) return

    console.log(`[Eraser] Activated: Mode=${mode}, Size=${eraserSize}`)

    const container = document.querySelector('.tl-container') as HTMLElement
    if (!container) return

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      isPointerDownRef.current = true
      eraseAtPoint(e.clientX, e.clientY)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return
      if (e.pointerType === 'touch') return

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
  }, [active, editor, eraseAtPoint, mode, eraserSize])
}


