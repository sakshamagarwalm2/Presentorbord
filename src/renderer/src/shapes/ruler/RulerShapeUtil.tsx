
import {
  ShapeUtil,
  HTMLContainer,
  T,
  Rectangle2d,
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

  override component(shape: IRulerShape) {
    // Generate markings
    const markings = []
    const range = Math.floor(shape.props.w / 10) // Assuming 10px per marking/mm for visual simplicity

    for (let i = 0; i <= range; i++) {
        const x = i * 10
        const isMajor = i % 5 === 0
        const isLabel = i % 10 === 0
        
        markings.push(
            <div key={i} style={{
                position: 'absolute',
                left: `${x}px`,
                bottom: 0,
                width: '1px',
                height: isLabel ? '20px' : (isMajor ? '15px' : '8px'),
                background: '#333',
            }}>
                {isLabel && (
                    <span style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '-50%',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#333'
                    }}>{i/10}</span>
                )}
            </div>
        )
    }

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: 'all',
          background: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(0, 0, 0, 0.2)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '2px'
        }}
      >
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end'
        }}>
            {markings}
        </div>
      </HTMLContainer>
    )
  }

  override indicator(shape: IRulerShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
