import {
	createShapeId,
	Editor,
	StateNode,
	TLEventHandlers,
	TLPointerEventInfo,
	TLStateNodeConstructor,
	Vec2d,
	TLShapePartial,
	TLShapeId,
} from '@tldraw/tldraw'
import { currentEraserSizeSignal } from '../store/styleSignals'

/** @public */
export class PrecisionEraserTool extends StateNode {
	static override id = 'precision-eraser'
	static override initial = 'idle'
	static override children = (): TLStateNodeConstructor[] => [Idle, Pointing]

	override onEnter = () => {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}
}

class Idle extends StateNode {
	static override id = 'idle'

	override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
		this.parent.transition('pointing', info)
	}
}

class Pointing extends StateNode {
	static override id = 'pointing'

	private _isErasing = false
	private _rafId: number | null = null
	private _lastPoint: { x: number; y: number } | null = null
	private _smoothedPoint: { x: number; y: number } | null = null
	private readonly SMOOTH = 0.6 // 0 = no smoothing, 1 = frozen

	override onEnter = (info: TLPointerEventInfo) => {
		this._isErasing = true
		this.editor.mark('precision-erase-start')
		const { x, y } = this.editor.inputs.currentPagePoint
		this._lastPoint = { x, y }
		this._smoothedPoint = { x, y }
		this._scheduleErase()
	}

	override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
		if (!this._isErasing) return
		const { x, y } = this.editor.inputs.currentPagePoint
		this._lastPoint = { x, y }
	}

	override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
		this.complete()
	}

	override onCancel: TLEventHandlers['onCancel'] = () => {
		this.cancel()
	}

	override onComplete: TLEventHandlers['onComplete'] = () => {
		this.complete()
	}

	private _scheduleErase(): void {
		if (this._rafId !== null) return
		this._rafId = requestAnimationFrame(() => {
			this._rafId = null
			if (!this._isErasing) return

			if (this._lastPoint) {
				if (!this._smoothedPoint) {
					this._smoothedPoint = { ...this._lastPoint }
				} else {
					this._smoothedPoint.x += (this._lastPoint.x - this._smoothedPoint.x) * (1 - this.SMOOTH)
					this._smoothedPoint.y += (this._lastPoint.y - this._smoothedPoint.y) * (1 - this.SMOOTH)
				}
				
				const radius = currentEraserSizeSignal.get()
				erasePointsNearCursor(this.editor, this._smoothedPoint as Vec2d, radius)
			}
			
			if (this._isErasing) this._scheduleErase()
		})
	}

	private complete() {
		this._cleanup()
		this.editor.history.squashToMark('precision-erase-start')
		this.parent.transition('idle')
	}

	private cancel() {
		this._cleanup()
		this.editor.bailToMark('precision-erase-start')
		this.parent.transition('idle')
	}

	private _cleanup() {
		this._isErasing = false
		if (this._rafId !== null) {
			cancelAnimationFrame(this._rafId)
			this._rafId = null
		}
		this._lastPoint = null
		this._smoothedPoint = null
	}
}

function erasePointsNearCursor(editor: Editor, cursorPoint: Vec2d, radius: number) {
	const shapes = editor.getCurrentPageShapes().filter((s) => 
		(s.type === 'draw' || s.type === 'custom-draw' || s.type === 'super-pen') && !s.isLocked
	)

	const shapesToUpdate: TLShapePartial[] = []
	const shapeIdsToDelete: TLShapeId[] = []
	const shapesToCreate: any[] = []

	for (const shape of shapes) {
		const bounds = editor.getShapePageBounds(shape)
		if (!bounds) continue

		// Fast pre-filter
		const pad = radius + 4
		if (
			cursorPoint.x < bounds.minX - pad ||
			cursorPoint.x > bounds.maxX + pad ||
			cursorPoint.y < bounds.minY - pad ||
			cursorPoint.y > bounds.maxY + pad
		) continue

		const localCursor = editor.getPointInShapeSpace(shape, cursorPoint)
		
		let segments: any[] = []
		if (shape.type === 'super-pen') {
			segments = [{ type: 'free', points: (shape as any).props.points || [] }]
		} else {
			segments = (shape as any).props.segments || []
		}

		const newSegments: any[] = []
		let modified = false

		for (const segment of segments) {
			let currentRun: any[] = []
			for (const point of segment.points) {
				const dist = Math.hypot(point.x - localCursor.x, point.y - localCursor.y)
				if (dist > radius) {
					currentRun.push(point)
				} else {
					modified = true
					if (currentRun.length >= 2) {
						newSegments.push({ type: segment.type || 'free', points: [...currentRun] })
					}
					currentRun = []
				}
			}
			if (currentRun.length >= 2) {
				newSegments.push({ type: segment.type || 'free', points: [...currentRun] })
			}
		}

		if (!modified) continue

		if (newSegments.length === 0) {
			shapeIdsToDelete.push(shape.id)
			continue
		}

		if (shape.type === 'super-pen') {
			shapesToUpdate.push({
				id: shape.id,
				type: shape.type,
				props: {
					...shape.props,
					points: newSegments[0].points,
				},
			} as TLShapePartial)

			if (newSegments.length > 1) {
				for (let i = 1; i < newSegments.length; i++) {
					shapesToCreate.push({
						...shape,
						id: createShapeId(),
						props: {
							...shape.props,
							points: newSegments[i].points,
						},
					})
				}
			}
		} else {
			shapesToUpdate.push({
				id: shape.id,
				type: shape.type,
				props: {
					...shape.props,
					segments: newSegments,
					isClosed: false,
				},
			} as TLShapePartial)
		}
	}

	if (shapesToUpdate.length > 0 || shapeIdsToDelete.length > 0 || shapesToCreate.length > 0) {
		editor.batch(() => {
			if (shapesToUpdate.length > 0) editor.updateShapes(shapesToUpdate)
			if (shapeIdsToDelete.length > 0) editor.deleteShapes(shapeIdsToDelete)
			if (shapesToCreate.length > 0) editor.createShapes(shapesToCreate)
		})
	}
}
