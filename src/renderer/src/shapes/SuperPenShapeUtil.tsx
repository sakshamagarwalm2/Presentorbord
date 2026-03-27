import {
  ShapeUtil,
  SVGContainer,
  TLBaseShape,
  SvgExportContext,
  Circle2d,
} from 'tldraw'
import { getStroke } from 'perfect-freehand'

export type SuperPenPoint = { x: number; y: number; z: number }

export type TSuperPenShape = TLBaseShape<
  'super-pen',
  {
    points: SuperPenPoint[]
    color: string
    size: number
    opacity: number
    isComplete: boolean
    mode: 'pen' | 'brush' | 'marker'
  }
>

function getFreehandOptions(mode: string, size: number, isComplete: boolean) {
  const base = {
    size,
    last: isComplete,
    simulatePressure: true,
  }

  switch (mode) {
    case 'brush':
      return {
        ...base,
        thinning: 0.7,
        smoothing: 0.8,
        streamline: 0.6,
        easing: (t: number) => Math.sin((t * Math.PI) / 2),
        start: { taper: size * 6, cap: true, easing: (t: number) => t * t },
        end: { taper: size * 8, cap: true, easing: (t: number) => 1 - (1 - t) * (1 - t) },
      }

    case 'marker':
      return {
        ...base,
        thinning: 0.1,
        smoothing: 0.7,
        streamline: 0.7,
        easing: (t: number) => t,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      }

    case 'pen':
    default:
      return {
        ...base,
        thinning: 0.45,
        smoothing: 0.82,
        streamline: 0.72,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        start: { taper: size * 4, cap: true, easing: (t: number) => t * t * t },
        end: { taper: size * 5, cap: true, easing: (t: number) => 1 - Math.pow(1 - t, 3) },
      }
  }
}

function toSvgPath(outlinePoints: number[][]): string {
  if (!outlinePoints.length) return ''
  const d = outlinePoints.reduce(
    (acc: (string | number)[], [x0, y0]: number[], i: number, arr: number[][]) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...outlinePoints[0], 'Q'] as (string | number)[]
  )
  d.push('Z')
  return d.join(' ')
}

export class SuperPenShapeUtil extends ShapeUtil<TSuperPenShape> {
  static override type = 'super-pen' as const

  override isAspectRatioLocked = () => false
  override canResize = () => false
  override canBind = () => false
  override hideResizeHandles = () => true
  override hideRotateHandle = () => true
  override hideSelectionBoundsFg = () => true
  override hideSelectionBoundsBg = () => true

  override getDefaultProps(): TSuperPenShape['props'] {
    return {
      points: [],
      color: '#1a1a1a',
      size: 3,
      opacity: 1,
      isComplete: false,
      mode: 'pen',
    }
  }

  override getGeometry(shape: TSuperPenShape) {
    const pts = shape.props.points
    if (!pts || pts.length < 2) {
      const p = pts?.[0] ?? { x: 0, y: 0 }
      return new Circle2d({ x: p.x - 2, y: p.y - 2, radius: 2, isFilled: true })
    }
    return new Circle2d({ x: 0, y: 0, radius: 1, isFilled: false })
  }

  override component(shape: TSuperPenShape) {
    const { points, color, size, opacity, isComplete, mode } = shape.props
    if (!points || points.length === 0) return null

    const inputPoints = points.map(p => [p.x, p.y, p.z])
    const options = getFreehandOptions(mode, size, isComplete)
    const outlinePoints = getStroke(inputPoints, options)
    const pathData = toSvgPath(outlinePoints)

    if (!pathData) return null

    return (
      <SVGContainer id={shape.id}>
        <path
          d={pathData}
          fill={color}
          opacity={opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      </SVGContainer>
    )
  }

  override indicator(shape: TSuperPenShape) {
    const { points, size, isComplete, mode } = shape.props
    if (!points || points.length === 0) return null

    const inputPoints = points.map(p => [p.x, p.y, p.z])
    const options = getFreehandOptions(mode, size, isComplete)
    const outlinePoints = getStroke(inputPoints, options)
    const pathData = toSvgPath(outlinePoints)

    return <path d={pathData} />
  }

  override toSvg(shape: TSuperPenShape, _ctx: SvgExportContext) {
    const { points, color, size, opacity, mode } = shape.props
    if (!points || points.length === 0) return null

    const inputPoints = points.map(p => [p.x, p.y, p.z])
    const options = getFreehandOptions(mode, size, true)
    const outlinePoints = getStroke(inputPoints, options)
    const pathData = toSvgPath(outlinePoints)

    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    el.setAttribute('d', pathData)
    el.setAttribute('fill', color)
    el.setAttribute('opacity', String(opacity))
    el.setAttribute('stroke-linecap', 'round')

    return el as unknown as JSX.Element
  }
}
