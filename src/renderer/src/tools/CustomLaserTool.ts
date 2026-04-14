import { StateNode, TLEventHandlers, TLStateNodeConstructor } from '@tldraw/editor'
import { currentThicknessSignal } from '../store/styleSignals'

/**
 * Custom Lasering state with:
 *  - laser line thickness from selected template
 *  - 5 second delay before fade-out
 */
class CustomLasering extends StateNode {
  static override id = 'lasering'

  scribbleId = 'id'
  isPointerDown = false

  override onEnter = () => {
    console.log('[Drawing] Laser Pointer active (Scribble Mode)')
    this.isPointerDown = true
    const size = currentThicknessSignal.get()
    const scribble = this.editor.scribbles.addScribble({
      color: 'laser',
      opacity: 0.7,
      size: size,
      delay: 5000,
      shrink: 0.05,
      taper: true,
    })
    this.scribbleId = scribble.id
    this.pushPointToScribble()
  }

  override onExit = () => {
    const item = (this.editor.scribbles as any).stop(this.scribbleId)
    if (item) {
      item.delayRemaining = 2000
    }
  }

  override onPointerMove = () => {
    this.pushPointToScribble()
  }

  override onPointerUp = () => {
    this.isPointerDown = false
    this.complete()
  }

  private pushPointToScribble = () => {
    const { x, y } = this.editor.inputs.currentPagePoint
    this.editor.scribbles.addPoint(this.scribbleId, x, y)
  }

  override onCancel: TLEventHandlers['onCancel'] = () => {
    this.cancel()
  }

  override onComplete: TLEventHandlers['onComplete'] = () => {
    if (!this.isPointerDown) {
      this.complete()
    }
  }

  private complete() {
    this.parent.transition('idle')
  }

  private cancel() {
    this.parent.transition('idle')
  }
}

class CustomLaserIdle extends StateNode {
  static override id = 'idle'

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    this.parent.transition('lasering', info)
  }
}

/** @public */
export class CustomLaserTool extends StateNode {
  static override id = 'custom-laser'
  static override initial = 'idle'
  static override children = (): TLStateNodeConstructor[] => [CustomLaserIdle, CustomLasering]
  static override isLockable = false

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }
}
