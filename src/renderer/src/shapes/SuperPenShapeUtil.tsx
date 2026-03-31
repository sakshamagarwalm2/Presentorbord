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
    mode: 'pen' | 'marker' | 'brush' | 'highlighter' | 'laser'
    dash: 'solid' | 'dashed' | 'dotted'
  }
>

function getFreehandOptions(
  mode: string,
  size: number,
  isComplete: boolean,
  _dash: string,
  hasPressure = false
) {
  const simulatePressure = !hasPressure

  switch (mode) {
    case 'pen':
    default:
      return {
        size,
        last: true,
        simulatePressure,
        thinning: 0.3,
        smoothing: 0.5,
        streamline: 0.0,
        easing: (t: number) => t,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      }

    case 'marker':
      return {
        size,
        last: true,
        simulatePressure,
        thinning: 0.0,
        smoothing: 0.4,
        streamline: 0.1,
        easing: (t: number) => t,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      }

    case 'brush':
      return {
        size,
        last: isComplete,
        simulatePressure,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.2,
        easing: (t: number) => Math.sin((t * Math.PI) / 2),
        start: { taper: size * 1.5, cap: true, easing: (t: number) => t * t },
        end: { taper: size * 2.0, cap: true, easing: (t: number) => 1 - (1 - t) * (1 - t) },
      }

    case 'highlighter':
      return {
        size,
        last: true,
        simulatePressure,
        thinning: 0.0,
        smoothing: 0.3,
        streamline: 0.0,
        easing: (t: number) => t,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      }

    case 'laser':
      return {
        size,
        last: true,
        simulatePressure,
        thinning: 0.0,
        smoothing: 0.5,
        streamline: 0.0,
        easing: (t: number) => t,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true },
      }
  }
}

function getDashArray(dash: string, size: number): string | undefined {
  switch (dash) {
    case 'dashed':
      return `${size * 3} ${size * 2}`
    case 'dotted':
      return `${size * 0.5} ${size * 1.5}`
    default:
      return undefined
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

function detectRealPressure(points: SuperPenPoint[]): boolean {
  return points.some(p => p.z !== 0.5 && p.z !== 0)
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
      dash: 'solid',
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
    const { points, color, size, opacity, isComplete, mode, dash } = shape.props
    if (!points || points.length === 0) return null

    const hasPressure = detectRealPressure(points)
    const inputPoints = points.map(p => [p.x, p.y, p.z])
    const options = getFreehandOptions(mode, size, isComplete, dash, hasPressure)
    const outlinePoints = getStroke(inputPoints, options)

    const pathData = toSvgPath(outlinePoints)
    const dashArray = getDashArray(dash, size)

    if (!pathData) return null

    return (
      <SVGContainer id={shape.id}>
        <path
          d={pathData}
          fill={color}
          opacity={opacity}
          stroke={dashArray ? color : 'none'}
          strokeWidth={dashArray ? size * 0.8 : 0}
          strokeDasharray={dashArray}
          strokeLinecap={dash === 'dotted' ? 'round' : 'butt'}
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      </SVGContainer>
    )
  }

  override indicator(shape: TSuperPenShape) {
    const { points, size, isComplete, mode, opacity } = shape.props
    if (!points || points.length === 0) return null

    const hasPressure = detectRealPressure(points)
    const inputPoints = points.map(p => [p.x, p.y, p.z])
    const options = getFreehandOptions(mode, size, isComplete, 'solid', hasPressure)
    const outlinePoints = getStroke(inputPoints, options)
    const pathData = toSvgPath(outlinePoints)

    return <path d={pathData} opacity={opacity} />
  }

  override toSvg(shape: TSuperPenShape, _ctx: SvgExportContext) {
    const { points, color, size, opacity, mode, dash } = shape.props
    if (!points || points.length === 0) return null

    const hasPressure = detectRealPressure(points)
    const inputPoints = points.map(p => [p.x, p.y, p.z])
    const options = getFreehandOptions(mode, size, true, dash, hasPressure)
    const outlinePoints = getStroke(inputPoints, options)

    const pathData = toSvgPath(outlinePoints)
    const dashArray = getDashArray(dash, size)

    return (
      <path
        d={pathData}
        fill={color}
        opacity={opacity}
        stroke={dashArray ? color : 'none'}
        strokeWidth={dashArray ? size * 0.8 : 0}
        strokeDasharray={dashArray}
        strokeLinecap={dash === 'dotted' ? 'round' : 'butt'}
        strokeLinejoin="round"
      />
    )
  }
}
