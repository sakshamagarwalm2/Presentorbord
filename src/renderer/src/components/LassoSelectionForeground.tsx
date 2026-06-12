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
	const rotateEvents = useSelectionEvents('mobile_rotate')

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

	const canRotate =
		!isLockedShape &&
		onlyShape &&
		!editor.getShapeUtil(onlyShape).hideRotateHandle(onlyShape) &&
		!isChangingStyle &&
		!editor.getInstanceState().isReadonly

	const shouldDisplayControls =
		canResize &&
		!isChangingStyle &&
		!editor.getInstanceState().isReadonly &&
		editor.isInAny(
			'lasso.idle',
			'lasso.pointing_selection',
			'lasso.pointing_shape',
			'lasso.pointing_resize_handle',
			'lasso.resizing',
			'lasso.pointing_rotate_handle',
			'lasso.rotating',
			'lasso.translating',
			'lasso.pointing_handle'
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
				{canRotate && (
					<g>
						<line
							x1={toDomPrecision(width / 2)}
							y1={toDomPrecision(0)}
							x2={toDomPrecision(width / 2)}
							y2={toDomPrecision(-28 / zoom)}
							stroke="var(--color-selection-stroke)"
							strokeWidth={toDomPrecision(1.5 / zoom)}
						/>
						<circle
							pointerEvents="all"
							className="tl-transparent"
							cx={toDomPrecision(width / 2)}
							cy={toDomPrecision(-28 / zoom)}
							r={toDomPrecision(18 / zoom)}
							style={{ cursor: getCursor('nwse-rotate', rotation) }}
							{...rotateEvents}
						/>
						<g
							transform={`translate(${toDomPrecision(width / 2 - 6 / zoom)}, ${toDomPrecision(-28 / zoom - 6 / zoom)}) scale(${toDomPrecision(0.5 / zoom)})`}
						>
							<path
								d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
								fill="var(--color-selection-stroke)"
							/>
						</g>
					</g>
				)}
			</g>
		</svg>
	)
}
