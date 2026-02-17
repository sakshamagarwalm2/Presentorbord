import {
  ShapeUtil,
  HTMLContainer,
  T,
  Rectangle2d,
  Geometry2d,
  resizeBox,
  TLResizeInfo,
} from '@tldraw/tldraw'
import { IGraphAxes4Shape } from './graph-shape-types'

export class GraphAxes4ShapeUtil extends ShapeUtil<IGraphAxes4Shape> {
  static override type = 'graph-axes-4' as const
  static override props = {
    w: T.number,
    h: T.number,
    color: T.string,
  }

  override getDefaultProps(): IGraphAxes4Shape['props'] {
    return {
      w: 400,
      h: 400,
      color: 'black',
    }
  }

  override getGeometry(shape: IGraphAxes4Shape): Geometry2d {
    return new Rectangle2d({
        width: shape.props.w,
        height: shape.props.h,
        isFilled: false,
    })
  }

  override canResize = (_shape: IGraphAxes4Shape) => true

  override onResize = (shape: IGraphAxes4Shape, info: TLResizeInfo<IGraphAxes4Shape>) => {
    return resizeBox(shape, info)
  }

  override component(shape: IGraphAxes4Shape) {
    const { w, h, color } = shape.props
    const cx = w / 2
    const cy = h / 2
    const tickSpacing = 50
    const tickLength = 8
    const arrowSize = 10
    const strokeWidth = 2

    // Ticks: from center outwards
    const xTicksPositive = []
    for(let x = tickSpacing; x < (w/2) - arrowSize; x += tickSpacing) xTicksPositive.push(x)
    const xTicksNegative = []
    for(let x = tickSpacing; x < (w/2); x += tickSpacing) xTicksNegative.push(x)

    const yTicksPositive = [] // Upwards
    for(let y = tickSpacing; y < (h/2) - arrowSize; y += tickSpacing) yTicksPositive.push(y)
    const yTicksNegative = [] // Downwards
    for(let y = tickSpacing; y < (h/2); y += tickSpacing) yTicksNegative.push(y)

    return (
      <HTMLContainer
        id={shape.id}
         style={{
             pointerEvents: 'all',
             width: '100%',
             height: '100%',
             overflow: 'visible',
             color: `var(--color-${color})`
        }}
      >
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* X Axis: center horizontal */}
            <line x1="0" y1={cy} x2={w} y2={cy} stroke="currentColor" strokeWidth={strokeWidth} />
            {/* Arrow X Positive */}
            <path d={`M ${w - arrowSize},${cy - arrowSize/2} L ${w},${cy} L ${w - arrowSize},${cy + arrowSize/2}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
            
            {/* X Ticks Positive */}
            {xTicksPositive.map(dist => {
                const x = cx + dist;
                return <line key={`xp-${x}`} x1={x} y1={cy - tickLength/2} x2={x} y2={cy + tickLength/2} stroke="currentColor" strokeWidth={strokeWidth} />
            })}
             {/* X Ticks Negative */}
            {xTicksNegative.map(dist => {
                const x = cx - dist;
                return <line key={`xn-${x}`} x1={x} y1={cy - tickLength/2} x2={x} y2={cy + tickLength/2} stroke="currentColor" strokeWidth={strokeWidth} />
            })}

            {/* Y Axis: center vertical */}
            <line x1={cx} y1={h} x2={cx} y2={0} stroke="currentColor" strokeWidth={strokeWidth} />
            {/* Arrow Y Positive (Up) */}
            <path d={`M ${cx - arrowSize/2},${arrowSize} L ${cx},${0} L ${cx + arrowSize/2},${arrowSize}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />

            {/* Y Ticks Positive (Up) */}
             {yTicksPositive.map(dist => {
                const y = cy - dist;
                return <line key={`yp-${y}`} x1={cx - tickLength/2} y1={y} x2={cx + tickLength/2} y2={y} stroke="currentColor" strokeWidth={strokeWidth} />
            })}
             {/* Y Ticks Negative (Down) */}
             {yTicksNegative.map(dist => {
                const y = cy + dist;
                return <line key={`yn-${y}`} x1={cx - tickLength/2} y1={y} x2={cx + tickLength/2} y2={y} stroke="currentColor" strokeWidth={strokeWidth} />
            })}
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: IGraphAxes4Shape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
