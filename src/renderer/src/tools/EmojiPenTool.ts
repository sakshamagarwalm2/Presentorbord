import { StateNode, TLEventHandlers, createShapeId } from 'tldraw'
import { TEmojiPenShape, EmojiPenPoint } from '../shapes/EmojiPenShapeUtil'
import { currentThicknessSignal, currentOpacitySignal } from '../store/styleSignals'

const MIN_DISTANCE = 40

export class EmojiPenTool extends StateNode {
  static override id = 'emoji-pen'
  static override initial = 'idle'
  static override children = () => [Idle, Drawing]
}

class Idle extends StateNode {
  static override id = 'idle'

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    this.parent.transition('drawing', info)
  }

  override onKeyDown: TLEventHandlers['onKeyDown'] = (info) => {
    if (info.key === 'Escape') {
      this.editor.setCurrentTool('select')
    }
  }
}

class Drawing extends StateNode {
  static override id = 'drawing'

  private shapeId = createShapeId()
  private livePoints: EmojiPenPoint[] = []
  private firstPoint: { x: number; y: number } = { x: 0, y: 0 }
  private lastStampPage: { x: number; y: number } | null = null
  private isDrawing = false
  private historyMarkId: string | null = null

  private getEmojiSize(): number {
    const thickness = currentThicknessSignal.get()
    return thickness * 4 + 8
  }

  private getCurrentOpacity(): number {
    return currentOpacitySignal.get()
  }

  private shouldStamp(pageX: number, pageY: number): boolean {
    if (!this.lastStampPage) return true
    const dx = pageX - this.lastStampPage.x
    const dy = pageY - this.lastStampPage.y
    return (dx * dx + dy * dy) >= MIN_DISTANCE * MIN_DISTANCE
  }

  override onEnter = () => {
    this.livePoints = []
    this.shapeId = createShapeId()
    this.isDrawing = true
    this.lastStampPage = null

    this.historyMarkId = 'emoji-pen-stroke-' + createShapeId()
    this.editor.mark(this.historyMarkId)

    this.editor.selectNone()

    const pt = this.editor.inputs.currentPagePoint
    this.firstPoint = { x: pt.x, y: pt.y }
    this.livePoints.push({ x: 0, y: 0 })
    this.lastStampPage = { x: pt.x, y: pt.y }

    const size = this.getEmojiSize()
    const opacity = this.getCurrentOpacity()

    this.editor.createShape<TEmojiPenShape>({
      id: this.shapeId,
      type: 'emoji-pen',
      x: pt.x,
      y: pt.y,
      props: {
        points: [...this.livePoints],
        emoji: '⭐',
        size,
        opacity,
        isComplete: false,
      },
    })
  }

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    const pt = this.editor.inputs.currentPagePoint

    if (!this.shouldStamp(pt.x, pt.y)) return

    this.livePoints.push({
      x: pt.x - this.firstPoint.x,
      y: pt.y - this.firstPoint.y,
    })
    this.lastStampPage = { x: pt.x, y: pt.y }
    this.updateShapeLive()
  }

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    this.finishStroke()
  }

  override onCancel = () => {
    this.cleanup()
    this.editor.deleteShape(this.shapeId)
    this.parent.transition('idle')
  }

  override onKeyDown: TLEventHandlers['onKeyDown'] = (info) => {
    if (info.key === 'Escape') this.onCancel()
  }

  override onExit = () => {
    this.cleanup()
  }

  private finishStroke(): void {
    this.isDrawing = false
    this.cleanup()

    if (this.livePoints.length === 0) {
      this.editor.deleteShape(this.shapeId)
    } else {
      this.editor.updateShape<TEmojiPenShape>({
        id: this.shapeId,
        type: 'emoji-pen',
        props: {
          points: [...this.livePoints],
          isComplete: true,
        },
      })
    }

    if (this.historyMarkId) {
      this.editor.history.squashToMark(this.historyMarkId)
    }

    this.parent.transition('idle')
  }

  private cleanup(): void {
    this.isDrawing = false
  }

  private updateShapeLive(): void {
    if (!this.editor.getShape(this.shapeId)) return
    this.editor.updateShape<TEmojiPenShape>({
      id: this.shapeId,
      type: 'emoji-pen',
      props: {
        points: [...this.livePoints],
        isComplete: false,
      },
    }, { history: 'ignore' })
  }
}
