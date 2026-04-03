import { StateNode, TLEventHandlers, TLShapeId, createShapeId, getIndices } from '@tldraw/editor'

class LineDrawing extends StateNode {
	static override id = 'drawing'

	private shapeId: TLShapeId | null = null
	private startPoint = { x: 0, y: 0 }

	override onEnter = () => {
		const indices = getIndices(2)
		this.startPoint = { x: this.editor.inputs.currentPagePoint.x, y: this.editor.inputs.currentPagePoint.y }
		this.shapeId = createShapeId()
		this.editor.createShapes([
			{
				id: this.shapeId,
				type: 'line',
				x: this.startPoint.x,
				y: this.startPoint.y,
				props: {
					points: [
						{ x: 0, y: 0, id: createShapeId(), index: indices[0] },
						{ x: 0, y: 0, id: createShapeId(), index: indices[1] },
					],
				},
			},
		])
		this.editor.setSelectedShapes([this.shapeId])
	}

	override onPointerMove = () => {
		if (!this.shapeId) return

		const indices = getIndices(2)
		const { x, y } = this.editor.inputs.currentPagePoint
		const dx = x - this.startPoint.x
		const dy = y - this.startPoint.y

		this.editor.updateShapes([
			{
				id: this.shapeId,
				type: 'line',
				props: {
					points: [
						{ x: 0, y: 0, id: createShapeId(), index: indices[0] },
						{ x: dx, y: dy, id: createShapeId(), index: indices[1] },
					],
				},
			},
		])
	}

	override onPointerUp = () => {
		this.complete()
	}

	override onCancel: TLEventHandlers['onCancel'] = () => {
		this.cancel()
	}

	private complete() {
		if (this.shapeId) {
			const shape = this.editor.getShape(this.shapeId)
			if (shape) {
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
