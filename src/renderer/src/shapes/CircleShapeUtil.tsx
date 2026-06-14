import { ShapeUtil, HTMLContainer, T, Rectangle2d, Geometry2d, TLBaseShape, SvgExportContext, TLResizeInfo } from '@tldraw/tldraw'

export type TCircleShape = TLBaseShape<
  'custom-circle',
  {
    points: { x: number; y: number; id: string; index: string }[]
    color: string
  }
>

export class CircleShapeUtil extends ShapeUtil<TCircleShape> {
  static override type = 'custom-circle' as const
  static override props = {
    points: T.arrayOf(T.object({ x: T.number, y: T.number, id: T.string, index: T.string })),
    color: T.string,
  }

  override getDefaultProps(): TCircleShape['props'] {
    return {
      points: [],
      color: '#000000',
    }
  }

  override getGeometry(shape: TCircleShape): Geometry2d {
    const { points } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2

    if (points.length < 2) {
      return new Rectangle2d({ width: 0, height: 0, isFilled: false, x: -padding, y: -padding })
    }

    const p1 = points[0]
    const p2 = points[1]
    const size = Math.min(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
    const cx = (p1.x + p2.x) / 2
    const cy = (p1.y + p2.y) / 2

    return new Rectangle2d({
      x: cx - size / 2 - padding,
      y: cy - size / 2 - padding,
      width: size + padding * 2,
      height: size + padding * 2,
      isFilled: false,
    })
  }

  override canResize = (_shape: TCircleShape) => true

  override onResize = (shape: TCircleShape, info: TLResizeInfo<TCircleShape>) => {
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

  override component(shape: TCircleShape) {
    const { points, color } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4

    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[1]

    const width = Math.abs(p2.x - p1.x)
    const height = Math.abs(p2.y - p1.y)
    const size = Math.min(width, height)
    const cx = (p1.x + p2.x) / 2
    const cy = (p1.y + p2.y) / 2

    return (
      <HTMLContainer id={shape.id} style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <svg style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(1, size / 2)}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: TCircleShape) {
    const { points } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2

    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[1]
    const size = Math.min(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
    const cx = (p1.x + p2.x) / 2
    const cy = (p1.y + p2.y) / 2

    return (
      <rect
        x={cx - size / 2 - padding}
        y={cy - size / 2 - padding}
        width={size + padding * 2}
        height={size + padding * 2}
      />
    )
  }

  override toSvg(shape: TCircleShape, _ctx: SvgExportContext) {
    const { points, color } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4

    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[1]
    const size = Math.min(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
    const cx = (p1.x + p2.x) / 2
    const cy = (p1.y + p2.y) / 2

    return (
      <circle
        cx={cx}
        cy={cy}
        r={Math.max(1, size / 2)}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    )
  }
}
