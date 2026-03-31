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
  oneEuroMinCutoff: number
  oneEuroBeta: number
  stringRadius: number
  gaussianKernelSize: number
}

export const DEFAULT_CONFIG: PipelineConfig = {
  noiseMinDistance: 0,
  oneEuroMinCutoff: 0,
  oneEuroBeta: 0,
  stringRadius: 0,
  gaussianKernelSize: 0,
}

export class SuperSmoothPipeline {
  private config: PipelineConfig
  private points: SmoothPoint[] = []
  private lastSmoothed: SmoothPoint | null = null

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  reset(): void {
    this.points = []
    this.lastSmoothed = null
  }

  process(raw: RawPoint): SmoothPoint | null {
    if (!this.lastSmoothed) {
      const first: SmoothPoint = {
        x: raw.x,
        y: raw.y,
        pressure: raw.pressure > 0 ? raw.pressure : 0.5,
      }
      this.lastSmoothed = first
      this.points.push(first)
      return first
    }

    // Simple exponential smoothing
    // alpha = 0.3 means 30% new data, 70% old data. 
    // This provides a "smooth" feel without too much lag.
    const alpha = 0.35 
    
    const smoothed: SmoothPoint = {
      x: this.lastSmoothed.x + alpha * (raw.x - this.lastSmoothed.x),
      y: this.lastSmoothed.y + alpha * (raw.y - this.lastSmoothed.y),
      pressure: this.lastSmoothed.pressure + alpha * (raw.pressure - this.lastSmoothed.pressure),
    }

    this.lastSmoothed = smoothed
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
