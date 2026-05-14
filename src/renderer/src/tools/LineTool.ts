import { StateNode, TLEventHandlers, TLShapeId, createShapeId, getIndices } from '@tldraw/editor'
import { currentThicknessSignal, currentCustomColorSignal } from '../store/styleSignals'

const SNAP_ANGLE_RADIANS = 0.0873 // ~5 degrees
const SHOW_SUGGESTION_ANGLE = 0.300 // ~17 degrees - show suggestions within this range
const SNAP_DISTANCE_MIN = 15 // minimum distance to snap

class LineDrawing extends StateNode {
	static override id = 'drawing'

	private shapeId: TLShapeId | null = null
	private hGuideShapeId: TLShapeId | null = null
	private vGuideShapeId: TLShapeId | null = null
	private startPoint = { x: 0, y: 0 }

	override onEnter = () => {
		const indices = getIndices(2)
		this.startPoint = { x: this.editor.inputs.currentPagePoint.x, y: this.editor.inputs.currentPagePoint.y }
		this.shapeId = createShapeId()
		const customColor = currentCustomColorSignal.get()
		const guideColor = customColor || '#000000'
		this.editor.createShapes([
			{
				id: this.shapeId,
				type: 'custom-line',
				x: this.startPoint.x,
				y: this.startPoint.y,
				meta: {
					thickness: currentThicknessSignal.get(),
					color: customColor,
				},
				props: {
					color: customColor || '#000000',
					points: [
						{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
						{ x: 0, y: 0, id: createShapeId().toString(), index: indices[1] },
					],
				},
			},
		])

		// Create horizontal guide shape
		this.hGuideShapeId = createShapeId()
		this.editor.createShapes([{
			id: this.hGuideShapeId,
			type: 'custom-line',
			x: this.startPoint.x,
			y: this.startPoint.y,
			meta: { isGuide: true, guideType: 'horizontal' },
			props: {
				color: guideColor,
				points: [
					{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
					{ x: 0, y: 0, id: createShapeId().toString(), index: indices[1] },
				],
			},
		}])

		// Create vertical guide shape
		this.vGuideShapeId = createShapeId()
		this.editor.createShapes([{
			id: this.vGuideShapeId,
			type: 'custom-line',
			x: this.startPoint.x,
			y: this.startPoint.y,
			meta: { isGuide: true, guideType: 'vertical' },
			props: {
				color: guideColor,
				points: [
					{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
					{ x: 0, y: 0, id: createShapeId().toString(), index: indices[1] },
				],
			},
		}])

		this.editor.setSelectedShapes([this.shapeId])
	}

	override onPointerMove = () => {
		if (!this.shapeId || !this.hGuideShapeId || !this.vGuideShapeId) return

		const indices = getIndices(2)
		const { x, y } = this.editor.inputs.currentPagePoint
		const dx = x - this.startPoint.x
		const dy = y - this.startPoint.y
		const distance = Math.sqrt(dx * dx + dy * dy)

		// Calculate angle
		const angle = Math.atan2(dy, dx)
		const absAngle = Math.abs(angle)
		// Check if near horizontal (within suggestion range, snap within 5 degrees)
		const isNearHorizontalSuggestion = absAngle < SHOW_SUGGESTION_ANGLE || absAngle > (Math.PI - SHOW_SUGGESTION_ANGLE)
		const isNearHorizontalSnap = (absAngle < SNAP_ANGLE_RADIANS || absAngle > (Math.PI - SNAP_ANGLE_RADIANS)) && distance > SNAP_DISTANCE_MIN

		// Check if near vertical
		const isNearVerticalSuggestion = Math.abs(absAngle - Math.PI / 2) < SHOW_SUGGESTION_ANGLE
		const isNearVerticalSnap = Math.abs(absAngle - Math.PI / 2) < SNAP_ANGLE_RADIANS && distance > SNAP_DISTANCE_MIN

		// Determine actual line position (snapped or not)
		let lineDx = dx
		let lineDy = dy

		if (isNearHorizontalSnap) {
			lineDy = 0
		} else if (isNearVerticalSnap) {
			lineDx = 0
		}

		// Update the main line
		this.editor.updateShapes([
			{
				id: this.shapeId,
				type: 'custom-line',
				props: {
					points: [
						{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
						{ x: lineDx, y: lineDy, id: createShapeId().toString(), index: indices[1] },
					],
				},
			},
		])

		// Update horizontal guide
		const hGuidePoints = isNearHorizontalSuggestion ? [
			{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
			{ x: dx, y: 0, id: createShapeId().toString(), index: indices[1] },
		] : [
			{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
			{ x: 0, y: 0, id: createShapeId().toString(), index: indices[1] },
		]

		this.editor.updateShapes([{
			id: this.hGuideShapeId,
			type: 'custom-line',
			props: { points: hGuidePoints },
			meta: { isGuide: true, guideType: 'horizontal', visible: isNearHorizontalSuggestion && distance > 15 }
		}])

		// Update vertical guide
		const vGuidePoints = isNearVerticalSuggestion ? [
			{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
			{ x: 0, y: dy, id: createShapeId().toString(), index: indices[1] },
		] : [
			{ x: 0, y: 0, id: createShapeId().toString(), index: indices[0] },
			{ x: 0, y: 0, id: createShapeId().toString(), index: indices[1] },
		]

		this.editor.updateShapes([{
			id: this.vGuideShapeId,
			type: 'custom-line',
			props: { points: vGuidePoints },
			meta: { isGuide: true, guideType: 'vertical', visible: isNearVerticalSuggestion && distance > 15 }
		}])
	}

	override onPointerUp = () => {
		this.complete()
	}

	override onCancel: TLEventHandlers['onCancel'] = () => {
		this.cancel()
	}

	private complete() {
		if (this.hGuideShapeId) {
			this.editor.deleteShapes([this.hGuideShapeId])
			this.hGuideShapeId = null
		}
		if (this.vGuideShapeId) {
			this.editor.deleteShapes([this.vGuideShapeId])
			this.vGuideShapeId = null
		}

		if (this.shapeId) {
			const shape = this.editor.getShape(this.shapeId)
			if (shape && shape.type === 'custom-line') {
				const points = (shape.props as any).points
				if (points && points.length >= 2) {
					const p1 = points[0]
					const p2 = points[1]
					const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
					if (length < 5) {
						this.editor.deleteShapes([this.shapeId])
					}
				}
			}
		}
		this.parent.transition('idle')
	}

	private cancel() {
		if (this.hGuideShapeId) {
			this.editor.deleteShapes([this.hGuideShapeId])
			this.hGuideShapeId = null
		}
		if (this.vGuideShapeId) {
			this.editor.deleteShapes([this.vGuideShapeId])
			this.vGuideShapeId = null
		}

		if (this.shapeId) {
			this.editor.deleteShapes([this.shapeId])
		}
		this.parent.transition('idle')
	}
}

class LineIdle extends StateNode {
	static override id = 'idle'

	override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
		this.parent.transition('drawing', info)
	}
}

export class LineTool extends StateNode {
	static override id = 'custom-line'
	static override initial = 'idle'
	static override children = () => [LineIdle, LineDrawing]
	static override isLockable = true

	override onEnter = () => {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onExit = () => {
		this.editor.setCursor({ type: 'default', rotation: 0 })
	}
}
