import {
  ShapeUtil,
  SVGContainer,
  TLBaseShape,
  SvgExportContext,
  Circle2d,
  Polyline2d,
  Polygon2d,
  Vec,
  TLResizeInfo,
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
        streamline: 0.4, // Increased from 0.0 for buttery flow
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
        streamline: 0.5, // Increased from 0.1
        easing: (t: number) => t,
        start: { taper: 0, cap: true },
        end: { taper: size * 0.2, cap: true, easing: (t: number) => 1 - (1 - t) * (1 - t) },
      }

    case 'brush':
      return {
        size,
        last: isComplete,
        simulatePressure,
        thinning: 0.4,
        smoothing: 0.5,
        streamline: 0.6, // Increased from 0.2
        easing: (t: number) => Math.sin((t * Math.PI) / 2),
        start: { taper: size * 0.2, cap: true, easing: (t: number) => t * t },
        end: { taper: size * 0.2, cap: true, easing: (t: number) => 1 - (1 - t) * (1 - t) },
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

function getMarkerOutlinePoints(points: SuperPenPoint[], size: number, options: any) {
  const angle = Math.PI / 4 // +45 degrees (opposite direction)
  const s = Math.sin(angle)
  const c = Math.cos(angle)
  
  // 1. Rotate and squash input points
  const transformedPoints = points.map(p => {
    const nx = p.x * c - p.y * s
    const ny = p.x * s + p.y * c
    return [nx, ny * 0.35, p.z] as [number, number, number]
  })

  // 2. Generate stroke in the "squashed" space
  const outline = getStroke(transformedPoints, options)

  // 3. Un-squash and rotate back
  const sB = Math.sin(-angle)
  const cB = Math.cos(-angle)

  return outline.map(p => {
    const ux = p[0]
    const uy = p[1] / 0.35
    const rx = ux * cB - uy * sB
    const ry = ux * sB + uy * cB
    return [rx, ry] as [number, number]
  })
}

export class SuperPenShapeUtil extends ShapeUtil<TSuperPenShape> {
  static override type = 'super-pen' as const

  override isAspectRatioLocked = () => false
  override canResize = () => true
  override canBind = () => false

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

  override onResize = (shape: TSuperPenShape, info: TLResizeInfo<TSuperPenShape>) => {
    const { scaleX, scaleY } = info
    
    // Points are now local to shape.x/y, so we just scale them
    const newPoints = shape.props.points.map(p => {
      return {
        x: p.x * scaleX,
        y: p.y * scaleY,
        z: p.z 
      }
    })

    return {
      props: {
        points: newPoints,
        size: shape.props.size * Math.abs((scaleX + scaleY) / 2)
      }
    }
  }

  override getGeometry(shape: TSuperPenShape) {
    const { points, size, mode, isComplete, dash } = shape.props
    if (!points || points.length === 0) {
      return new Circle2d({ x: 0, y: 0, radius: size / 2, isFilled: true })
    }

    if (points.length < 2) {
      return new Circle2d({
        x: points[0].x,
        y: points[0].y,
        radius: size / 2,
        isFilled: true,
      })
    }

    // For multiple points, we want a geometry that matches the visible stroke.
    // Polyline2d is okay for thin lines, but for thick strokes it's better to use the outline.
    const hasPressure = detectRealPressure(points)
    const options = getFreehandOptions(mode, size, isComplete, dash, hasPressure)
    
    let outlinePoints: number[][]
    if (mode === 'marker') {
      outlinePoints = getMarkerOutlinePoints(points, size, options)
    } else {
      const inputPoints = points.map(p => [p.x, p.y, p.z])
      outlinePoints = getStroke(inputPoints, options)
    }

    if (outlinePoints.length < 3) {
        return new Polyline2d({
            points: points.map((p) => new Vec(p.x, p.y)),
        })
    }

    return new Polygon2d({
        points: outlinePoints.map(([x, y]) => new Vec(x, y)),
        isFilled: true
    })
  }

  override component(shape: TSuperPenShape) {
    const { points, color, size, opacity, isComplete, mode, dash } = shape.props
    if (!points || points.length === 0) return null

    const hasPressure = detectRealPressure(points)
    const options = getFreehandOptions(mode, size, isComplete, dash, hasPressure)
    
    let outlinePoints: number[][]
    if (mode === 'marker') {
      outlinePoints = getMarkerOutlinePoints(points, size, options)
    } else {
      const inputPoints = points.map(p => [p.x, p.y, p.z])
      outlinePoints = getStroke(inputPoints, options)
    }

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
    const options = getFreehandOptions(mode, size, isComplete, 'solid', hasPressure)
    
    let outlinePoints: number[][]
    if (mode === 'marker') {
      outlinePoints = getMarkerOutlinePoints(points, size, options)
    } else {
      const inputPoints = points.map(p => [p.x, p.y, p.z])
      outlinePoints = getStroke(inputPoints, options)
    }

    const pathData = toSvgPath(outlinePoints)

    return <path d={pathData} opacity={opacity} />
  }

  override toSvg(shape: TSuperPenShape, _ctx: SvgExportContext) {
    const { points, color, size, opacity, mode, dash } = shape.props
    if (!points || points.length === 0) return null

    const hasPressure = detectRealPressure(points)
    const options = getFreehandOptions(mode, size, true, dash, hasPressure)
    
    let outlinePoints: number[][]
    if (mode === 'marker') {
      outlinePoints = getMarkerOutlinePoints(points, size, options)
    } else {
      const inputPoints = points.map(p => [p.x, p.y, p.z])
      outlinePoints = getStroke(inputPoints, options)
    }

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
