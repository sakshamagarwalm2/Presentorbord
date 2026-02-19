
import {
  ShapeUtil,
  HTMLContainer,
  T,
  Rectangle2d,
  TLBaseShape,
  resizeBox,
} from '@tldraw/tldraw'
import { IRulerShape } from './ruler-shape-types'

export class RulerShapeUtil extends ShapeUtil<IRulerShape> {
  static override type = 'ruler' as const
  static override props = {
    w: T.number,
    h: T.number,
  }

  override getDefaultProps(): IRulerShape['props'] {
    return {
      w: 300,
      h: 50,
    }
  }

  override getGeometry(shape: IRulerShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }
  
  override canResize = () => true
  override canScroll = () => false

  override onResize = (shape: IRulerShape, info: any) => {
    return resizeBox(shape, info)
  }

  override component(shape: IRulerShape) {
    const { w, h } = shape.props
    
    // We'll simulate millimeters. Let's say 10px = 1cm for screen simplicity, 
    // or maybe strict pixels. Let's do 100px = 1 logical unit (like "10")
    // A standard screen ruler often uses 96dpi, so ~37.8px is 1cm. 
    // Let's stick to a simple visual scale where 10px = 1 small tick, 50px = medium, 100px = big.
    
    const ticks = []
    // Generate ticks based on width
    for (let x = 0; x <= w; x += 10) {
      if (x % 100 === 0) {
        // Large tick + Label
        ticks.push(
          <g key={x}>
            <line x1={x} y1={h} x2={x} y2={h - 20} stroke="black" strokeWidth={2} />
            <text x={x + 2} y={h - 25} fontSize={10} fontFamily="sans-serif" fill="black">{x / 10}</text>
          </g>
        )
      } else if (x % 50 === 0) {
        // Medium tick
        ticks.push(<line key={x} x1={x} y1={h} x2={x} y2={h - 15} stroke="black" strokeWidth={1.5} />)
      } else {
        // Small tick
        ticks.push(<line key={x} x1={x} y1={h} x2={x} y2={h - 8} stroke="black" strokeWidth={1} />)
      }
    }

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: 'all',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={w} height={h} style={{ overflow: 'visible', background: 'rgba(255, 255, 255, 0.85)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', border: '1px solid #ccc', borderRadius: 4 }}>
          {ticks}
        </svg>
      </HTMLContainer>
    )
  }

  override indicator(shape: IRulerShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
