import {
	StateNode,
	TLEventHandlers,
	TLPointerEventInfo,
	TLShapeId,
	TLStateNodeConstructor,
	SelectTool,
	Vec,
	pointInPolygon,
} from '@tldraw/tldraw'

class LassoDragging extends StateNode {
	static override id = 'dragging'

	private points: { x: number; y: number }[] = []
	private scribbleId: string = ''

	override onEnter = () => {
		console.log('LassoDragging: onEnter')
        this.editor.setHintingShapes([])

		this.points = []
		const { x, y } = this.editor.inputs.currentPagePoint
		this.points.push({ x, y })

		const scribble = this.editor.scribbles.addScribble({
			color: 'accent', 
			opacity: 1,
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
		console.log('LassoDragging: onPointerUp, points:', this.points.length)
		this.complete()
	}

	override onCancel = () => {
		this.cancel()
	}

	private complete() {
		// Stop the scribble
		if (this.scribbleId) {
			(this.editor.scribbles as any).stop(this.scribbleId)
			this.scribbleId = ''
		}
		
		let selectedIds: TLShapeId[] = []
		if (this.points.length > 2) {
			selectedIds = this.selectShapesInPolygon()
		} else {
			console.log('Lasso selection cancelled: Not enough points')
            if (!this.editor.inputs.shiftKey) {
                this.editor.setSelectedShapes([])
                this.editor.setHintingShapes([])
            }
		}

		if (selectedIds.length > 0) {
			this.editor.setHintingShapes(selectedIds)
			this.editor.setHintingShapes([])
			this.parent.transition('idle')
		} else {
			this.parent.transition('idle')
		}
	}

	private cancel() {
		if (this.scribbleId) {
			(this.editor.scribbles as any).stop(this.scribbleId)
			this.scribbleId = ''
		}
		this.parent.transition('idle')
	}

	private selectShapesInPolygon(): TLShapeId[] {
		console.log('selectShapesInPolygon: checking shapes...')
		const currentPageId = this.editor.getCurrentPageId()
		const shapes = this.editor.getSortedChildIdsForParent(currentPageId)
			.map(id => this.editor.getShape(id))
			.filter(shape => shape && shape.type !== 'image') // Optional: filter out background images if desired

		const shapesToSelect: TLShapeId[] = []

		for (const shape of shapes) {
			if (!shape) continue
			
			const bounds = this.editor.getShapePageBounds(shape)
            if (!bounds) continue

            // Check if any corner or the center is inside the polygon
            const pointsToCheck = [
                { x: bounds.minX, y: bounds.minY },
                { x: bounds.maxX, y: bounds.minY },
                { x: bounds.minX, y: bounds.maxY },
                { x: bounds.maxX, y: bounds.maxY },
                { x: bounds.midX, y: bounds.midY },
            ]
			
			if (pointsToCheck.some(p => this.isPointInPolygon(p, this.points))) {
				console.log('Selected shape:', shape.id, shape.type)
				shapesToSelect.push(shape.id)
			}
		}

		if (shapesToSelect.length > 0) {
            // Check if shift is held to add to selection
            if (this.editor.inputs.shiftKey) {
                const currentSelection = this.editor.getSelectedShapeIds()
                const newSelection = [...new Set([...currentSelection, ...shapesToSelect])]
                this.editor.setSelectedShapes(newSelection)
            } else {
			    this.editor.setSelectedShapes(shapesToSelect)
            }
		} else {
			 console.log('No shapes selected by lasso')
             if (!this.editor.inputs.shiftKey) {
                this.editor.setSelectedShapes([])
                this.editor.setHintingShapes([]) // Also clear hints
             }
        }
		return shapesToSelect
	}

    // Ray-casting algorithm for point in polygon
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

class LassoIdle extends StateNode {
	static override id = 'idle'

	override onEnter = () => {
		console.log('LassoIdle: onEnter')
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
		console.log('LassoIdle: onPointerDown')

		if (this.editor.getIsMenuOpen()) return

		if (info.target === 'selection') {
			this.handleSelectionPointerDown(info)
			return
		}

		if (info.target === 'handle') {
			this.parent.transition(this.editor.inputs.altKey ? 'pointing_shape' : 'pointing_handle', info)
			return
		}

		if (info.target === 'shape') {
			if (this.editor.isShapeOrAncestorLocked(info.shape)) {
				this.parent.transition('dragging', info)
			} else {
				this.parent.transition('pointing_shape', info)
			}
			return
		}

		const { currentPagePoint } = this.editor.inputs
		const shapeAtPoint = this.editor.getShapeAtPoint(currentPagePoint, {
			margin: this.editor.options.hitTestMargin / this.editor.getZoomLevel(),
			hitInside: true,
			hitLocked: false,
			renderingOnly: true,
		})

		if (shapeAtPoint && !this.editor.isShapeOrAncestorLocked(shapeAtPoint)) {
			this.parent.transition('pointing_shape', {
				...info,
				target: 'shape',
				shape: shapeAtPoint,
			})
			return
		}

		if (this.isPointInSelection(currentPagePoint)) {
			this.parent.transition('pointing_selection', {
				...info,
				target: 'selection',
			})
			return
		}

		this.parent.transition('dragging', info)
	}

	override onKeyDown: TLEventHandlers['onKeyDown'] = (info) => {
		const selectedIds = this.editor.getSelectedShapeIds()
		if (selectedIds.length === 0) return

		switch (info.code) {
			case 'Delete':
			case 'Backspace':
				this.editor.deleteShapes(selectedIds)
				break
			case 'Escape':
				this.editor.selectNone()
				break
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'ArrowUp':
			case 'ArrowDown':
				this.nudgeSelectedShapes(info.code, info.shiftKey ? 10 : 1)
				break
		}
	}

	private handleSelectionPointerDown(info: TLPointerEventInfo & { target: 'selection' }) {
		switch (info.handle) {
			case 'top':
			case 'right':
			case 'bottom':
			case 'left':
			case 'top_left':
			case 'top_right':
			case 'bottom_left':
			case 'bottom_right':
				this.parent.transition('pointing_resize_handle', info)
				break
			case 'mobile_rotate':
			case 'top_left_rotate':
			case 'top_right_rotate':
			case 'bottom_left_rotate':
			case 'bottom_right_rotate':
				this.parent.transition('pointing_rotate_handle', info)
				break
			default:
				this.parent.transition('pointing_selection', info)
		}
	}

	private isPointInSelection(point: Vec) {
		const selectedShapeIds = this.editor.getSelectedShapeIds()
		const onlySelectedShape = this.editor.getOnlySelectedShape()
		const selectionBounds = this.editor.getSelectionRotatedPageBounds()

		if (!selectionBounds) return false
		if (
			selectedShapeIds.length <= 1 &&
			onlySelectedShape &&
			this.editor.getShapeUtil(onlySelectedShape).hideSelectionBoundsBg(onlySelectedShape)
		) {
			return false
		}

		const selectionRotation = this.editor.getSelectionRotation()
		if (!selectionRotation) return selectionBounds.containsPoint(point)

		return pointInPolygon(
			point,
			selectionBounds.corners.map((corner) =>
				Vec.RotWith(corner, selectionBounds.point, selectionRotation)
			)
		)
	}

	private nudgeSelectedShapes(code: string, step: number) {
		const delta = new Vec(0, 0)
		switch (code) {
			case 'ArrowLeft':
				delta.x -= step
				break
			case 'ArrowRight':
				delta.x += step
				break
			case 'ArrowUp':
				delta.y -= step
				break
			case 'ArrowDown':
				delta.y += step
				break
		}
		if (delta.x === 0 && delta.y === 0) return
		this.editor.mark('nudge lasso selection')
		this.editor.nudgeShapes(this.editor.getSelectedShapeIds(), delta)
	}
}

export class LassoTool extends SelectTool {
	static override id = 'lasso'
	static override initial = 'idle'
	static override children = (): TLStateNodeConstructor[] => [
		LassoIdle,
		LassoDragging,
		...SelectTool.children().filter((Child) => Child.id !== 'idle'),
	]
    static override isLockable = true // Allow tool lock

	override onEnter = () => {
		console.log('LassoTool: onEnter')
		this.editor.setCursor({ type: 'cross', rotation: 0 })
		super.onEnter?.()
	}

    override onExit = () => {
        // Clear any hints when leaving the tool
        this.editor.setHintingShapes([])
		super.onExit?.()
    }
}



