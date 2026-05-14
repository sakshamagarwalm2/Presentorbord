import {
  ShapeUtil,
  HTMLContainer,
  SVGContainer,
  T,
  Rectangle2d,
  Geometry2d,
  resizeBox,
  TLResizeInfo,
  SvgExportContext,
} from '@tldraw/tldraw'
import { IGraphAxes1Shape } from './graph-shape-types'

export class GraphAxes1ShapeUtil extends ShapeUtil<IGraphAxes1Shape> {
  static override type = 'graph-axes-1' as const
  static override props = {
    w: T.number,
    h: T.number,
    color: T.string,
  }

  override getDefaultProps(): IGraphAxes1Shape['props'] {
    return {
      w: 300,
      h: 300,
      color: 'black',
    }
  }

  override getGeometry(shape: IGraphAxes1Shape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  override canResize = (_shape: IGraphAxes1Shape) => true

  override onResize = (shape: IGraphAxes1Shape, info: TLResizeInfo<IGraphAxes1Shape>) => {
    return resizeBox(shape, info)
  }

  override component(shape: IGraphAxes1Shape) {
    const { w, h, color } = shape.props
    const strokeWidth = (shape.meta?.thickness as number) || 2
    const tickLength = 6
    const arrowSize = 10
    
    // Ticks every 50px
    const tickSpacing = 50
    
    const xTicks = []
    for(let x = tickSpacing; x < w - arrowSize; x += tickSpacing) {
        xTicks.push(x)
    }
    
    const yTicks = []
    for(let y = tickSpacing; y < h - arrowSize; y += tickSpacing) {
        yTicks.push(y)
    }

    return (
      <HTMLContainer
        id={shape.id}
        style={{
             pointerEvents: 'all',
             width: '100%',
             height: '100%',
             overflow: 'visible',
        }}
      >
<svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* X Axis: bottom */}
            <line x1="0" y1={h} x2={w} y2={h} stroke={color} strokeWidth={strokeWidth} />
            {/* Arrow X */}
            <path d={`M ${w - arrowSize},${h - arrowSize/2} L ${w},${h} L ${w - arrowSize},${h + arrowSize/2}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
            
            {/* X Ticks */}
            {xTicks.map(x => (
                <line key={`x-${x}`} x1={x} y1={h - tickLength} x2={x} y2={h} stroke={color} strokeWidth={strokeWidth} />
            ))}

            {/* Y Axis: left */}
            <line x1="0" y1={h} x2="0" y2={0} stroke={color} strokeWidth={strokeWidth} />
            {/* Arrow Y */}
            <path d={`M ${-arrowSize/2},${arrowSize} L ${0},${0} L ${arrowSize/2},${arrowSize}`} fill="none" stroke={color} strokeWidth={strokeWidth} />

            {/* Y Ticks */}
            {yTicks.map(dist => {
                const y = h - dist;
                return (
                    <line key={`y-${y}`} x1={0} y1={y} x2={tickLength} y2={y} stroke={color} strokeWidth={strokeWidth} />
                )
            })}
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: IGraphAxes1Shape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override toSvg(shape: IGraphAxes1Shape, _ctx: SvgExportContext) {
    const { w, h, color } = shape.props
    const strokeWidth = (shape.meta?.thickness as number) || 2
    const tickSpacing = 50
    const tickLength = 6
    const arrowSize = 10

    const xTicks: any[] = []
    for (let x = tickSpacing; x < w - arrowSize; x += tickSpacing) {
      xTicks.push(<line key={`x-${x}`} x1={x} y1={h - tickLength} x2={x} y2={h} stroke={color} strokeWidth={strokeWidth} />)
    }

    const yTicks: any[] = []
    for (let dist = tickSpacing; dist < h - arrowSize; dist += tickSpacing) {
      const y = h - dist
      yTicks.push(<line key={`y-${y}`} x1={0} y1={y} x2={tickLength} y2={y} stroke={color} strokeWidth={strokeWidth} />)
    }

    return (
      <SVGContainer id={shape.id}>
        <line x1={0} y1={h} x2={w} y2={h} stroke={color} strokeWidth={strokeWidth} />
        <path d={`M ${w - arrowSize},${h - arrowSize / 2} L ${w},${h} L ${w - arrowSize},${h + arrowSize / 2}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
        {xTicks}
        <line x1={0} y1={h} x2={0} y2={0} stroke={color} strokeWidth={strokeWidth} />
        <path d={`M ${-arrowSize / 2},${arrowSize} L ${0},${0} L ${arrowSize / 2},${arrowSize}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
        {yTicks}
      </SVGContainer>
    )
  }
}