import { ShapeUtil, TLBaseShape, SvgExportContext, Rectangle2d } from 'tldraw'

export type EmojiPenPoint = { x: number; y: number }

export type TEmojiPenShape = TLBaseShape<
  'emoji-pen',
  {
    points: EmojiPenPoint[]
    emoji: string
    size: number
    opacity: number
    isComplete: boolean
  }
>

function getLocalBounds(points: EmojiPenPoint[], size: number) {
  if (!points || points.length === 0) {
    return { x: -size / 2, y: -size / 2, w: size, h: size }
  }

  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  for (const p of points) {
    const l = p.x - size / 2
    const t = p.y - size / 2
    const r = p.x + size / 2
    const b = p.y + size / 2
    if (l < minX) minX = l
    if (t < minY) minY = t
    if (r > maxX) maxX = r
    if (b > maxY) maxY = b
  }

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export class EmojiPenShapeUtil extends ShapeUtil<TEmojiPenShape> {
  static override type = 'emoji-pen' as const

  override isAspectRatioLocked = () => false
  override canResize = () => true
  override canBind = () => false

  override getDefaultProps(): TEmojiPenShape['props'] {
    return {
      points: [],
      emoji: '⭐',
      size: 32,
      opacity: 1,
      isComplete: false,
    }
  }

  override getGeometry(shape: TEmojiPenShape) {
    const { points, size } = shape.props
    const b = getLocalBounds(points, size)
    return new Rectangle2d({
      x: b.x,
      y: b.y,
      width: b.w,
      height: b.h,
      isFilled: true,
    })
  }

  override component(shape: TEmojiPenShape) {
    const { points, emoji, size, opacity } = shape.props
    if (!points || points.length === 0) return null

    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {points.map((p, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: p.x - size / 2,
              top: p.y - size / 2,
              width: size,
              height: size,
              fontSize: size,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity,
              userSelect: 'none',
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
    )
  }

  override indicator(shape: TEmojiPenShape) {
    const { points, size } = shape.props
    const b = getLocalBounds(points, size)
    return (
      <rect
        x={b.x}
        y={b.y}
        width={b.w}
        height={b.h}
        fill="none"
        stroke="dodgerblue"
        strokeWidth={1.5}
        rx={4}
        opacity={0.4}
      />
    )
  }

  override toSvg(shape: TEmojiPenShape, _ctx: SvgExportContext) {
    const { points, emoji, size, opacity } = shape.props
    if (!points || points.length === 0) return null

    return (
      <g>
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y}
            fontSize={size}
            opacity={opacity}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {emoji}
          </text>
        ))}
      </g>
    )
  }
}
