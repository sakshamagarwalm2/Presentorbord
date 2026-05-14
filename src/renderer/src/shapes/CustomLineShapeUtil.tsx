import { ShapeUtil, HTMLContainer, SVGContainer, T, Rectangle2d, Geometry2d, TLBaseShape, SvgExportContext, TLResizeInfo } from '@tldraw/tldraw'

export type TCustomLineShape = TLBaseShape<
  'custom-line',
  {
    points: { x: number; y: number; id: string; index: string }[]
    color: string
  }
>

export class CustomLineShapeUtil extends ShapeUtil<TCustomLineShape> {
  static override type = 'custom-line' as const
  static override props = {
    points: T.arrayOf(T.object({ x: T.number, y: T.number, id: T.string, index: T.string })),
    color: T.string,
  }

  override getDefaultProps(): TCustomLineShape['props'] {
    return {
      points: [],
      color: '#000000',
    }
  }

  override getGeometry(shape: TCustomLineShape): Geometry2d {
    const { points } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2
    
    if (points.length === 0) {
      return new Rectangle2d({ width: 0, height: 0, isFilled: false, x: -padding, y: -padding })
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    
    // Create geometry with proper position offset
    return new Rectangle2d({
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1, maxX - minX + padding * 2),
      height: Math.max(1, maxY - minY + padding * 2),
      isFilled: false,
    })
  }

  override canResize = (_shape: TCustomLineShape) => true

  override onResize = (shape: TCustomLineShape, info: TLResizeInfo<TCustomLineShape>) => {
    const { scaleX, scaleY } = info

    return {
      props: {
        points: shape.props.points.map((point) => ({
          ...point,
          x: point.x * scaleX,
          y: point.y * scaleY,
        })),
      },
    }
  }

  override component(shape: TCustomLineShape) {
    const { points, color } = shape.props
    const effectiveColor = color
    const thickness = (shape.meta?.thickness as number) || 4

    // Check if this is a guide shape
    const isGuide = shape.meta?.isGuide as boolean
    const guideOpacity = isGuide ? 0.3 : 1

    if (points.length < 2) return null

    // Check if guide has any length
    const p1 = points[0]
    const p2 = points[points.length - 1]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    // Hide guide if too short
    if (isGuide && length < 5) return null

    return (
      <HTMLContainer id={shape.id} style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <svg style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={effectiveColor}
            strokeWidth={isGuide ? 2 : thickness}
            strokeLinecap="round"
            opacity={guideOpacity}
            strokeDasharray={isGuide ? '5,5' : undefined}
          />
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: TCustomLineShape) {
    const { points } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2
    
    if (points.length < 2) return null
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    
    return (
      <rect
        x={minX - padding}
        y={minY - padding}
        width={maxX - minX + padding * 2}
        height={maxY - minY + padding * 2}
      />
    )
  }

  override toSvg(shape: TCustomLineShape, _ctx: SvgExportContext) {
    const { points, color } = shape.props
    const isGuide = shape.meta?.isGuide as boolean
    const thickness = isGuide ? 2 : (shape.meta?.thickness as number) || 4
    const guideOpacity = isGuide ? 0.3 : 1

    if (points.length < 2) {
      return <SVGContainer id={shape.id} />
    }

    const p1 = points[0]
    const p2 = points[points.length - 1]

    return (
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        opacity={guideOpacity}
        strokeDasharray={isGuide ? '5,5' : undefined}
      />
    )
  }
}
