import {
  createStabilizedPointer,
  noiseFilter,
  oneEuroFilter,
  stringFilter,
  gaussianKernel,
} from '@stroke-stabilizer/core'

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
  noiseMinDistance: 1.5,
  oneEuroMinCutoff: 0.8,
  oneEuroBeta: 0.005,
  stringRadius: 10,
  gaussianKernelSize: 7,
}

export class SuperSmoothPipeline {
  private pointer: ReturnType<typeof createStabilizedPointer>
  private config: PipelineConfig
  private pressures: number[] = []

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.pointer = this.buildPointer()
  }

  private buildPointer() {
    const { noiseMinDistance, oneEuroMinCutoff, oneEuroBeta, stringRadius, gaussianKernelSize } = this.config

    const pointer = createStabilizedPointer(50)
    pointer.addFilter(noiseFilter({ minDistance: noiseMinDistance }))
    pointer.addFilter(oneEuroFilter({ minCutoff: oneEuroMinCutoff, beta: oneEuroBeta }))
    pointer.addFilter(stringFilter({ stringLength: stringRadius }))
    pointer.addPostProcess(gaussianKernel({ size: gaussianKernelSize }))

    return pointer
  }

  reset(): void {
    this.pointer = this.buildPointer()
    this.pressures = []
  }

  process(raw: RawPoint) {
    const result = this.pointer.process({
      x: raw.x,
      y: raw.y,
      timestamp: raw.timeStamp,
    })

    if (result === null) return null

    this.pressures.push(raw.pressure > 0 ? raw.pressure : 0.5)

    return {
      x: result.x,
      y: result.y,
      pressure: this.pressures[this.pressures.length - 1],
    }
  }

  finish() {
    const finalPoints = this.pointer.finish()

    return finalPoints.map((pt: { x: number; y: number }, i: number) => ({
      x: pt.x,
      y: pt.y,
      pressure: this.pressures[Math.min(i, this.pressures.length - 1)] ?? 0.5,
    }))
  }

  updateConfig(partial: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...partial }
    this.pointer = this.buildPointer()
  }

  getConfig(): PipelineConfig {
    return { ...this.config }
  }
}
