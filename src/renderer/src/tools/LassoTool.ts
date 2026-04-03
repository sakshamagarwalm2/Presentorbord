import { StateNode, TLEventHandlers, TLStateNodeConstructor, TLShapeId } from '@tldraw/editor'

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
            if (!this.editor.inputs.shiftKey) {
			    this.editor.setCurrentTool('select')
            } else {
                this.parent.transition('idle')
            }
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
	}

	override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
		console.log('LassoIdle: onPointerDown')
        
        // If clicking on a selected shape, switch to select tool so it can be moved
        const { currentPagePoint } = this.editor.inputs
        const shapeAtPoint = this.editor.getShapeAtPoint(currentPagePoint)
        if (shapeAtPoint && this.editor.getSelectedShapeIds().includes(shapeAtPoint.id)) {
            this.editor.setCurrentTool('select')
            // Transition immediately to the pointer down state of the select tool if possible
            // but usually just switching tool is enough for the next move
            return
        }

		this.parent.transition('dragging', info)
	}
}

export class LassoTool extends StateNode {
	static override id = 'lasso'
	static override initial = 'idle'
	static override children = (): TLStateNodeConstructor[] => [LassoIdle, LassoDragging]
    static override isLockable = true // Allow tool lock

	override onEnter = () => {
		console.log('LassoTool: onEnter')
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

    override onExit = () => {
        // Clear any hints when leaving the tool
        this.editor.setHintingShapes([])
    }
}



