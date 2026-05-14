import {
	TLSelectionForegroundProps,
	TldrawSelectionForeground,
	getCursor,
	toDomPrecision,
	track,
	useEditor,
	useSelectionEvents,
	useTransform,
} from '@tldraw/tldraw'
import { useRef } from 'react'

export const LassoSelectionForeground = track(function LassoSelectionForeground(
	props: TLSelectionForegroundProps
) {
	const editor = useEditor()

	if (!editor.isIn('lasso')) {
		return <TldrawSelectionForeground {...props} />
	}

	return <LassoSelectionForegroundInner {...props} />
})

function LassoSelectionForegroundInner({
	bounds,
	rotation,
}: TLSelectionForegroundProps) {
	const editor = useEditor()
	const rSvg = useRef<SVGGElement>(null)
	const topLeftEvents = useSelectionEvents('top_left')
	const bottomLeftEvents = useSelectionEvents('bottom_left')
	const bottomRightEvents = useSelectionEvents('bottom_right')

	useTransform(rSvg, bounds?.x, bounds?.y, 1, editor.getSelectionRotation())

	if (!bounds) return null

	const onlyShape = editor.getOnlySelectedShape()
	const isLockedShape = onlyShape && editor.isShapeOrAncestorLocked(onlyShape)
	const isChangingStyle = editor.getInstanceState().isChangingStyle
	const canResize =
		!isLockedShape &&
		(onlyShape
			? editor.getShapeUtil(onlyShape).canResize(onlyShape) &&
				!editor.getShapeUtil(onlyShape).hideResizeHandles(onlyShape)
			: editor.getSelectedShapeIds().length > 1)

	const shouldDisplayControls =
		canResize &&
		!isChangingStyle &&
		!editor.getInstanceState().isReadonly &&
		editor.isInAny(
			'lasso.idle',
			'lasso.pointing_selection',
			'lasso.pointing_shape',
			'lasso.pointing_resize_handle'
		)

	if (!shouldDisplayControls) return null

	const width = bounds.width
	const height = bounds.height
	const zoom = editor.getZoomLevel()
	const visualSize = 10 / zoom
	const hitSize = 36 / zoom

	return (
		<svg className="tl-overlays__item tl-selection__fg" data-testid="selection-foreground">
			<g ref={rSvg}>
				<rect
					className="tl-selection__fg__outline"
					width={toDomPrecision(width)}
					height={toDomPrecision(height)}
				/>
				<rect
					className="tl-transparent"
					data-testid="selection.target.top-left"
					aria-label="top-left target"
					pointerEvents="all"
					x={toDomPrecision(-hitSize / 2)}
					y={toDomPrecision(-hitSize / 2)}
					width={toDomPrecision(hitSize)}
					height={toDomPrecision(hitSize)}
					style={{ cursor: getCursor('nwse-resize', rotation) }}
					{...topLeftEvents}
				/>
				<rect
					className="tl-transparent"
					data-testid="selection.target.bottom-left"
					aria-label="bottom-left target"
					pointerEvents="all"
					x={toDomPrecision(-hitSize / 2)}
					y={toDomPrecision(height - hitSize / 2)}
					width={toDomPrecision(hitSize)}
					height={toDomPrecision(hitSize)}
					style={{ cursor: getCursor('nesw-resize', rotation) }}
					{...bottomLeftEvents}
				/>
				<rect
					className="tl-transparent"
					data-testid="selection.target.bottom-right"
					aria-label="bottom-right target"
					pointerEvents="all"
					x={toDomPrecision(width - hitSize / 2)}
					y={toDomPrecision(height - hitSize / 2)}
					width={toDomPrecision(hitSize)}
					height={toDomPrecision(hitSize)}
					style={{ cursor: getCursor('nwse-resize', rotation) }}
					{...bottomRightEvents}
				/>
				<rect
					data-testid="selection.resize.top-left"
					className="tl-corner-handle"
					aria-label="top_left handle"
					x={toDomPrecision(-visualSize / 2)}
					y={toDomPrecision(-visualSize / 2)}
					rx={toDomPrecision(visualSize / 2)}
					ry={toDomPrecision(visualSize / 2)}
					width={toDomPrecision(visualSize)}
					height={toDomPrecision(visualSize)}
				/>
				<rect
					data-testid="selection.resize.bottom-left"
					className="tl-corner-handle"
					aria-label="bottom_left handle"
					x={toDomPrecision(-visualSize / 2)}
					y={toDomPrecision(height - visualSize / 2)}
					rx={toDomPrecision(visualSize / 2)}
					ry={toDomPrecision(visualSize / 2)}
					width={toDomPrecision(visualSize)}
					height={toDomPrecision(visualSize)}
				/>
				<rect
					data-testid="selection.resize.bottom-right"
					className="tl-corner-handle"
					aria-label="bottom_right handle"
					x={toDomPrecision(width - visualSize / 2)}
					y={toDomPrecision(height - visualSize / 2)}
					rx={toDomPrecision(visualSize / 2)}
					ry={toDomPrecision(visualSize / 2)}
					width={toDomPrecision(visualSize)}
					height={toDomPrecision(visualSize)}
				/>
			</g>
		</svg>
	)
}
