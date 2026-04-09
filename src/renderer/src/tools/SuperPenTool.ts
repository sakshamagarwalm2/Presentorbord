import { StateNode, TLEventHandlers, createShapeId, DefaultColorStyle, DefaultDashStyle } from 'tldraw'
import { SuperSmoothPipeline, PipelineConfig, DEFAULT_CONFIG } from '../utils/SuperSmoothPipeline'
import { SuperPenPoint, TSuperPenShape } from '../shapes/SuperPenShapeUtil'
import { currentThicknessSignal, currentOpacitySignal } from '../store/styleSignals'

export interface SuperPenSettings {
  color: string
  size: number
  opacity: number
  mode: 'pen' | 'marker' | 'brush' | 'highlighter' | 'laser'
  pipeline: PipelineConfig
}

export const DEFAULT_SETTINGS: SuperPenSettings = {
  color: '#1a1a1a',
  size: 3,
  opacity: 1,
  mode: 'pen',
  pipeline: DEFAULT_CONFIG,
}

const COLOR_MAP: Record<string, string> = {
  'black': '#1a1a1a',
  'grey': '#71717a',
  'light-violet': '#a78bfa',
  'violet': '#7c3aed',
  'blue': '#3b82f6',
  'light-blue': '#38bdf8',
  'yellow': '#facc15',
  'orange': '#f97316',
  'green': '#22c55e',
  'light-green': '#4ade80',
  'red': '#ef4444',
  'light-red': '#fb7185',
  'white': '#ffffff',
}

export class SuperPenTool extends StateNode {
  static override id = 'super-pen'
  static override initial = 'idle'
  static override children = () => [Idle, Drawing]

  settings: SuperPenSettings = { ...DEFAULT_SETTINGS }

  updateSettings(partial: Partial<SuperPenSettings>): void {
    this.settings = { ...this.settings, ...partial }
  }
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
  private pipeline = new SuperSmoothPipeline()
  private livePoints: SuperPenPoint[] = []
  private rawUpdateHandler: ((e: PointerEvent) => void) | null = null
  private isDrawing = false
  private historyMarkId: string | null = null

  private getCurrentColor(): string {
    const colorValue = this.editor.getStyleForNextShape(DefaultColorStyle)
    return COLOR_MAP[colorValue as string] || colorValue as string || '#1a1a1a'
  }

  private getCurrentThickness(): number {
    return currentThicknessSignal.get()
  }

  private getCurrentOpacity(): number {
    return currentOpacitySignal.get()
  }

  private getCurrentDash(): 'solid' | 'dashed' | 'dotted' {
    const dashValue = this.editor.getStyleForNextShape(DefaultDashStyle)
    if (dashValue === 'dashed' || dashValue === 'dotted') {
      return dashValue
    }
    return 'solid'
  }

  override onEnter = () => {
    const tool = this.parent as SuperPenTool
    const { mode, pipeline } = tool.settings

    this.pipeline = new SuperSmoothPipeline(pipeline)
    this.livePoints = []
    this.shapeId = createShapeId()
    this.isDrawing = true

    // Mark history stopping point so the stroke is a single undo unit
    this.historyMarkId = 'super-pen-stroke-' + createShapeId()
    this.editor.mark(this.historyMarkId)

    const pagePoint = this.editor.inputs.currentPagePoint
    
    // Process the initial point through the pipeline immediately
    const smoothed = this.pipeline.process({
      x: pagePoint.x,
      y: pagePoint.y,
      pressure: 0.5,
      timeStamp: Date.now(),
    })

    if (smoothed) {
      const initPoint: SuperPenPoint = {
        x: smoothed.x,
        y: smoothed.y,
        z: smoothed.pressure,
      }
      this.livePoints.push(initPoint)
    }

    const color = this.getCurrentColor()
    const size = this.getCurrentThickness()
    const opacity = this.getCurrentOpacity()
    const dash = this.getCurrentDash()

    console.log(`[Drawing] Super Pen Stroke Started: Mode=${mode}, Size=${size}, Opacity=${opacity}`)

    this.editor.createShape<TSuperPenShape>({
      id: this.shapeId,
      type: 'super-pen',
      x: 0,
      y: 0,
      props: {
        points: [...this.livePoints],
        color,
        size,
        opacity,
        mode,
        dash,
        isComplete: false,
      },
    })

    const canvasEl = this.editor.getContainer()
    if (canvasEl) {
      this.rawUpdateHandler = (e: PointerEvent) => {
        if (!this.isDrawing) return
        this.handleRawPointerEvent(e)
      }
      canvasEl.addEventListener('pointerrawupdate', this.rawUpdateHandler as EventListener, {
        passive: true,
        capture: false,
      })
    }
  }

  private handleRawPointerEvent(e: PointerEvent): void {
    const coalescedEvents = e.getCoalescedEvents?.() ?? [e]

    let didAddPoint = false

    for (const ce of coalescedEvents) {
      const screenPt = { x: ce.clientX, y: ce.clientY }
      const pagePt = this.editor.screenToPage(screenPt)

      const smoothed = this.pipeline.process({
        x: pagePt.x,
        y: pagePt.y,
        pressure: ce.pressure > 0 ? ce.pressure : 0.5,
        timeStamp: ce.timeStamp,
      })

      if (!smoothed) continue

      this.livePoints.push({ x: smoothed.x, y: smoothed.y, z: smoothed.pressure })
      didAddPoint = true
    }

    if (!didAddPoint) return
    this.updateShapeLive()
  }

  override onPointerMove: TLEventHandlers['onPointerMove'] = (info) => {
    if (this.rawUpdateHandler) return

    const pagePt = this.editor.inputs.currentPagePoint

    const smoothed = this.pipeline.process({
      x: pagePt.x,
      y: pagePt.y,
      pressure: (info as any).event?.pressure ?? info.point.z ?? 0.5,
      timeStamp: Date.now(),
    })

    if (!smoothed) return

    this.livePoints.push({ x: smoothed.x, y: smoothed.y, z: smoothed.pressure })
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

    const finalPoints = this.pipeline.finish()

    if (finalPoints.length < 2) {
      this.editor.updateShape<TSuperPenShape>({
        id: this.shapeId,
        type: 'super-pen',
        props: { isComplete: true },
      })
    } else {
      // Normalize coordinates: set x,y to top-left and make points relative
      let minX = Infinity
      let minY = Infinity
      for (const p of finalPoints) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
      }

      this.editor.updateShape<TSuperPenShape>({
        id: this.shapeId,
        type: 'super-pen',
        x: minX,
        y: minY,
        props: {
          points: finalPoints.map(p => ({ 
            x: p.x - minX, 
            y: p.y - minY, 
            z: p.pressure 
          })),
          isComplete: true,
        },
      })
    }

    // Squash all stroke updates into a single undo unit
    if (this.historyMarkId) {
      this.editor.history.squashToMark(this.historyMarkId)
    }

    this.parent.transition('idle')
  }

  private cleanup(): void {
    this.isDrawing = false
    if (this.rawUpdateHandler) {
      const canvasEl = this.editor.getContainer()
      canvasEl?.removeEventListener('pointerrawupdate', this.rawUpdateHandler as EventListener)
      this.rawUpdateHandler = null
    }
  }

  private updateShapeLive(): void {
    if (!this.editor.getShape(this.shapeId)) return
    this.editor.updateShape<TSuperPenShape>({
      id: this.shapeId,
      type: 'super-pen',
      props: {
        points: [...this.livePoints],
        isComplete: false,
      },
    }, { history: 'ignore' })
  }
}
