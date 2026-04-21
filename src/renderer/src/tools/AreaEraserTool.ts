import { StateNode, TLEventHandlers, TLStateNodeConstructor, TLShapeId } from '@tldraw/editor'

class AreaEraserDragging extends StateNode {
	static override id = 'dragging'

	private points: { x: number; y: number }[] = []
	private scribbleId: string = ''

	override onEnter = () => {
		this.points = []
		const { x, y } = this.editor.inputs.currentPagePoint
		this.points.push({ x, y })

		const scribble = this.editor.scribbles.addScribble({
			color: 'accent', 
			opacity: 0.8,
			size: 2,
			delay: 0,
			shrink: 0,
			taper: false,
		})
		this.scribbleId = scribble.id as string
		this.editor.scribbles.addPoint(this.scribbleId, x, y)
	}

	override onPointerMove = () => {
		const { x, y } = this.editor.inputs.currentPagePoint
		this.points.push({ x, y })
		this.editor.scribbles.addPoint(this.scribbleId, x, y)
	}

	override onPointerUp = () => {
		this.complete()
	}

	override onCancel = () => {
		this.cancel()
	}

	private complete() {
		if (this.scribbleId) {
			try {
                (this.editor.scribbles as any).stop(this.scribbleId)
            } catch (e) {
                // Ignore if stop fails
            }
			this.scribbleId = ''
		}
		
		if (this.points.length > 2) {
			const idsToErase = this.getShapesInPolygon()
            if (idsToErase.length > 0) {
                this.editor.deleteShapes(idsToErase)
            }
		}
		this.parent.transition('idle')
	}

	private cancel() {
		if (this.scribbleId) {
			try {
                (this.editor.scribbles as any).stop(this.scribbleId)
            } catch (e) {
                // ignore
            }
			this.scribbleId = ''
		}
		this.parent.transition('idle')
	}

	private getShapesInPolygon(): TLShapeId[] {
		const currentPageId = this.editor.getCurrentPageId()
		const shapes = this.editor.getSortedChildIdsForParent(currentPageId)
			.map(id => this.editor.getShape(id))
			.filter(shape => shape && shape.type !== 'image' && shape.type !== 'video' && !shape.meta?.isPageBackground)

		const shapesToErase: TLShapeId[] = []

		for (const shape of shapes) {
			if (!shape) continue
			
			const bounds = this.editor.getShapePageBounds(shape)
            if (!bounds) continue

            const pointsToCheck: { x: number; y: number }[] = []

            if (shape.type === 'super-pen' || shape.type === 'draw' || shape.type === 'custom-draw') {
                const props = shape.props as any
                let localPoints: { x: number; y: number }[] = []
                
                if (props.points) {
                    localPoints = props.points
                } else if (props.segments) {
                    localPoints = props.segments.flatMap((s: any) => s.points)
                }

                if (localPoints.length > 0) {
                    const transform = this.editor.getShapePageTransform(shape)
                    // Sample points if there are too many for performance
                    const step = Math.max(1, Math.floor(localPoints.length / 50))
                    for (let i = 0; i < localPoints.length; i += step) {
                        pointsToCheck.push(transform.applyToPoint(localPoints[i]))
                    }
                }
            }

            // Always include bounds points as fallback or for non-stroke shapes
            pointsToCheck.push(
                { x: bounds.minX, y: bounds.minY },
                { x: bounds.maxX, y: bounds.minY },
                { x: bounds.minX, y: bounds.maxY },
                { x: bounds.maxX, y: bounds.maxY },
                { x: bounds.midX, y: bounds.midY },
                { x: (bounds.minX + bounds.midX) / 2, y: (bounds.minY + bounds.midY) / 2 },
                { x: (bounds.maxX + bounds.midX) / 2, y: (bounds.minY + bounds.midY) / 2 },
                { x: (bounds.minX + bounds.midX) / 2, y: (bounds.maxY + bounds.midY) / 2 },
                { x: (bounds.maxX + bounds.midX) / 2, y: (bounds.maxY + bounds.midY) / 2 },
            )
			
			if (pointsToCheck.some(p => this.isPointInPolygon(p, this.points))) {
				shapesToErase.push(shape.id)
			}
		}

		return shapesToErase
	}

    private isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
        let inside = false
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y
            const xj = polygon[j].x, yj = polygon[j].y

            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
            if (intersect) inside = !inside
        }
        return inside
    }
}

class AreaEraserIdle extends StateNode {
	static override id = 'idle'

	override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
		this.parent.transition('dragging', info)
	}
}

export class AreaEraserTool extends StateNode {
	static override id = 'area-eraser'
	static override initial = 'idle'
	static override children = (): TLStateNodeConstructor[] => [AreaEraserIdle, AreaEraserDragging]
    static override isLockable = true

	override onEnter = () => {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}
}
