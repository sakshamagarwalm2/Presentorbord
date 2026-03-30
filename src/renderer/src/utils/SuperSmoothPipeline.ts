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

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  reset(): void {
    this.points = []
  }

  process(raw: RawPoint): SmoothPoint | null {
    const point: SmoothPoint = {
      x: raw.x,
      y: raw.y,
      pressure: raw.pressure > 0 ? raw.pressure : 0.5,
    }
    this.points.push(point)
    return point
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
