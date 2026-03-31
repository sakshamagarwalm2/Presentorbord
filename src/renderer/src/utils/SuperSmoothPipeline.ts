export interface RawPoint {
  x: number
  y: number
  pressure: number
  timeStamp: number
}

export interface SmoothPoint {
  x: number
  y: number
  pressure: number
}

export interface PipelineConfig {
  noiseMinDistance: number
  smoothingWeight: number // 0 to 1, higher = more smooth
}

export const DEFAULT_CONFIG: PipelineConfig = {
  noiseMinDistance: 0.2,
  smoothingWeight: 0.4,
}

export class SuperSmoothPipeline {
  private config: PipelineConfig
  private points: SmoothPoint[] = []
  private lastPoint: SmoothPoint | null = null

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  reset(): void {
    this.points = []
    this.lastPoint = null
  }

  process(raw: RawPoint): SmoothPoint | null {
    if (!this.lastPoint) {
      const first: SmoothPoint = {
        x: raw.x,
        y: raw.y,
        pressure: raw.pressure > 0 ? raw.pressure : 0.5,
      }
      this.lastPoint = first
      this.points.push(first)
      return first
    }

    const dx = raw.x - this.lastPoint.x
    const dy = raw.y - this.lastPoint.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < this.config.noiseMinDistance) return null

    // Adaptive alpha: 
    // - Very high alpha (0.95) for the first few points to prevent clipping.
    // - Speed-based alpha for the rest: starting at 0.5 (very responsive) 
    //   and scaling up to 0.9 (instant) based on speed.
    let alpha = 0.5
    if (this.points.length < 4) {
      alpha = 0.98 // Near-instant follow at start
    } else {
      // Base alpha of 0.5 ensures NO resistance, dist/15 makes it stay locked at speed.
      alpha = Math.min(0.92, 0.5 + dist / 15)
    }

    const smoothed: SmoothPoint = {
      x: this.lastPoint.x + dx * alpha,
      y: this.lastPoint.y + dy * alpha,
      pressure: this.lastPoint.pressure + (raw.pressure - this.lastPoint.pressure) * alpha,
    }

    this.lastPoint = smoothed
    this.points.push(smoothed)
    return smoothed
  }

  finish(): SmoothPoint[] {
    return [...this.points]
  }

  updateConfig(partial: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...partial }
  }

  getConfig(): PipelineConfig {
    return { ...this.config }
  }
}
