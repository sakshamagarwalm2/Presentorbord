import { ShapeUtil, HTMLContainer, T, Rectangle2d, Geometry2d, TLBaseShape, Vec } from '@tldraw/tldraw'

export type TCustomArrowShape = TLBaseShape<
  'custom-arrow',
  {
    points: { x: number; y: number; id: string; index: string }[]
    color: string
    arrowStart: boolean
    arrowEnd: boolean
  }
>

export class CustomArrowShapeUtil extends ShapeUtil<TCustomArrowShape> {
  static override type = 'custom-arrow' as const
  static override props = {
    points: T.arrayOf(T.object({ x: T.number, y: T.number, id: T.string, index: T.string })),
    color: T.string,
    arrowStart: T.boolean,
    arrowEnd: T.boolean,
  }

  override getDefaultProps(): TCustomArrowShape['props'] {
    return {
      points: [],
      color: '#000000',
      arrowStart: false,
      arrowEnd: true,
    }
  }

  override getGeometry(shape: TCustomArrowShape): Geometry2d {
    const { points, arrowStart, arrowEnd } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2
    
    if (points.length === 0) {
      return new Rectangle2d({ width: 0, height: 0, isFilled: false, x: -padding, y: -padding })
    }
    
    const arrowSize = 15 // Include arrow head in bounding box
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    
    // Expand bounding box to include arrowheads
    minX -= arrowSize
    minY -= arrowSize
    maxX += arrowSize
    maxY += arrowSize
    
    // Add padding and set proper position
    return new Rectangle2d({
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1, maxX - minX + padding * 2),
      height: Math.max(1, maxY - minY + padding * 2),
      isFilled: false,
    })
  }

  override canResize = (_shape: TCustomArrowShape) => false

  override component(shape: TCustomArrowShape) {
    const { points, color, arrowStart, arrowEnd } = shape.props
    const effectiveColor = color
    
    const thickness = (shape.meta?.thickness as number) || 4

    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[points.length - 1]
    
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return null

    // Unit vector from p1 to p2
    const ux = dx / len
    const uy = dy / len

    // Perpendicular vector
    const perpX = -uy
    const perpY = ux

    const arrowSize = 15
    const arrowAngle = 0.5 // radians (~28 degrees)

    // Create arrowhead pointing FROM p1 TO p2 (at the end)
    const createEndArrowHead = () => {
      const tipX = p2.x
      const tipY = p2.y
      
      // Calculate the two wing points
      const angle1 = Math.atan2(dy, dx) - arrowAngle
      const angle2 = Math.atan2(dy, dx) + arrowAngle
      
      const wing1X = tipX - Math.cos(angle1) * arrowSize
      const wing1Y = tipY - Math.sin(angle1) * arrowSize
      const wing2X = tipX - Math.cos(angle2) * arrowSize
      const wing2Y = tipY - Math.sin(angle2) * arrowSize
      
      return `M ${wing1X} ${wing1Y} L ${tipX} ${tipY} L ${wing2X} ${wing2Y}`
    }

    // Create arrowhead pointing TO p1 (at the start - reversed direction)
    const createStartArrowHead = () => {
      const tipX = p1.x
      const tipY = p1.y
      
      // Calculate the two wing points (pointing back towards p1)
      const angle1 = Math.atan2(-dy, -dx) - arrowAngle
      const angle2 = Math.atan2(-dy, -dx) + arrowAngle
      
      const wing1X = tipX - Math.cos(angle1) * arrowSize
      const wing1Y = tipY - Math.sin(angle1) * arrowSize
      const wing2X = tipX - Math.cos(angle2) * arrowSize
      const wing2Y = tipY - Math.sin(angle2) * arrowSize
      
      return `M ${wing1X} ${wing1Y} L ${tipX} ${tipY} L ${wing2X} ${wing2Y}`
    }

    return (
      <HTMLContainer id={shape.id} style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <svg style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={effectiveColor}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {arrowStart && (
            <path
              d={createStartArrowHead()}
              stroke={effectiveColor}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
          {arrowEnd && (
            <path
              d={createEndArrowHead()}
              stroke={effectiveColor}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: TCustomArrowShape) {
    const { points, arrowStart, arrowEnd } = shape.props
    const thickness = (shape.meta?.thickness as number) || 4
    const padding = thickness / 2 + 2
    const arrowSize = 15
    
    if (points.length < 2) return null
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    
    // Expand for arrowheads
    minX -= arrowSize
    minY -= arrowSize
    maxX += arrowSize
    maxY += arrowSize
    
    return (
      <rect
        x={minX - padding}
        y={minY - padding}
        width={maxX - minX + padding * 2}
        height={maxY - minY + padding * 2}
      />
    )
  }
}