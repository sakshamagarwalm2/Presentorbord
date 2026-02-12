import {
  ShapeUtil,
  HTMLContainer,
  T,
  TLBaseShape,
  Geometry2d,
  Rectangle2d,
  Vec
} from '@tldraw/tldraw'
import { IProtractorShape } from './protractor-shape-types'

export class ProtractorShapeUtil extends ShapeUtil<IProtractorShape> {
  static override type = 'protractor' as const
  static override props = {
    w: T.number,
    h: T.number,
  }

  override getDefaultProps(): IProtractorShape['props'] {
    return {
      w: 300,
      h: 150,
    }
  }

  override getGeometry(shape: IProtractorShape) {
    return new Rectangle2d({
        width: shape.props.w,
        height: shape.props.h, // Approximation for now
        isFilled: true,
    })
  }

  override component(shape: IProtractorShape) {
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: 'all',
          background: 'rgba(255, 255, 255, 0.4)',
          border: '2px solid rgba(0, 0, 0, 0.8)',
          borderRadius: '150px 150px 0 0', // Semicircle top
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        <div style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '1px',
            background: 'black'
        }} />
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: '2px',
            height: '10px',
            background: 'black',
            transform: 'translateX(-50%)'
        }} />
        
        {/* Degree markings (simple) */}
        {[0, 45, 90, 135, 180].map(deg => (
            <div key={deg} style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                height: '100%',
                width: '1px',
                transformOrigin: 'bottom center',
                transform: `rotate(${deg - 90}deg)`
            }}>
                <div style={{
                    width: '1px',
                    height: '10px',
                    background: 'black',
                    position: 'absolute',
                    top: 0
                }} />
                 <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '-10px',
                    fontSize: '10px',
                    transform: `rotate(${-(deg - 90)}deg)` // Cancel rotation for text
                }}>{deg}°</span>
            </div>
        ))}

      </HTMLContainer>
    )
  }

  override indicator(shape: IProtractorShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
