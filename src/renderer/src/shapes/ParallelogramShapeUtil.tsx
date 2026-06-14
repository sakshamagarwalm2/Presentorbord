import { ShapeUtil, HTMLContainer, T, Rectangle2d, Geometry2d, TLBaseShape, SvgExportContext, TLResizeInfo } from '@tldraw/tldraw'

export type TParallelogramShape = TLBaseShape<
  'custom-parallelogram',
  {
    points: { x: number; y: number; id: string; index: string }[]
    color: string
  }
>

export class ParallelogramShapeUtil extends ShapeUtil<TParallelogramShape> {
  static override type = 'custom-parallelogram' as const
  static override props = {
    points: T.arrayOf(T.object({ x: T.number, y: T.number, id: T.string, index: T.string })),
    color: T.string,
  }

  override getDefaultProps(): TParallelogramShape['props'] {
    return {
      points: [],
      color: '#000000',
    }
  }

  override getGeometry(shape: TParallelogramShape): Geometry2d {
    const { points } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2

    if (points.length < 2) {
      return new Rectangle2d({ width: 0, height: 0, isFilled: false, x: -padding, y: -padding })
    }

    const p1 = points[0]
    const p2 = points[1]
    const minX = Math.min(p1.x, p2.x)
    const minY = Math.min(p1.y, p2.y)
    const maxX = Math.max(p1.x, p2.x)
    const maxY = Math.max(p1.y, p2.y)

    return new Rectangle2d({
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1, maxX - minX + padding * 2),
      height: Math.max(1, maxY - minY + padding * 2),
      isFilled: false,
    })
  }

  override canResize = (_shape: TParallelogramShape) => true

  override onResize = (shape: TParallelogramShape, info: TLResizeInfo<TParallelogramShape>) => {
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

  private getSkew(points: { x: number; y: number }[]) {
    if (points.length < 2) return 0
    const p1 = points[0]
    const p2 = points[1]
    const width = Math.abs(p2.x - p1.x)
    return width * 0.3
  }

  override component(shape: TParallelogramShape) {
    const { points, color } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4

    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[1]
    const skew = this.getSkew(points)

    const x1 = Math.min(p1.x, p2.x)
    const x2 = Math.max(p1.x, p2.x)
    const y1 = Math.min(p1.y, p2.y)
    const y2 = Math.max(p1.y, p2.y)

    return (
      <HTMLContainer id={shape.id} style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <svg style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <polygon
            points={`${x1 + skew},${y1} ${x2},${y1} ${x2 - skew},${y2} ${x1},${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: TParallelogramShape) {
    const { points } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2

    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[1]
    const minX = Math.min(p1.x, p2.x)
    const minY = Math.min(p1.y, p2.y)
    const maxX = Math.max(p1.x, p2.x)
    const maxY = Math.max(p1.y, p2.y)

    return (
      <rect
        x={minX - padding}
        y={minY - padding}
        width={maxX - minX + padding * 2}
        height={maxY - minY + padding * 2}
      />
    )
  }

  override toSvg(shape: TParallelogramShape, _ctx: SvgExportContext) {
    const { points, color } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4

    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[1]
    const skew = this.getSkew(points)
    const x1 = Math.min(p1.x, p2.x)
    const x2 = Math.max(p1.x, p2.x)
    const y1 = Math.min(p1.y, p2.y)
    const y2 = Math.max(p1.y, p2.y)

    return (
      <polygon
        points={`${x1 + skew},${y1} ${x2},${y1} ${x2 - skew},${y2} ${x1},${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }
}
