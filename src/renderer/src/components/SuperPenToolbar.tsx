import { useState, useCallback, useEffect } from 'react'
import { useEditor, useValue } from 'tldraw'
import { SuperPenTool, SuperPenSettings, DEFAULT_SETTINGS } from '../tools/SuperPenTool'
import { PenIcon, MarkerIcon, BrushIcon, HighlighterIcon, LaserIcon } from './ToolIcons'
import { currentThicknessSignal, currentOpacitySignal, currentCustomColorSignal } from '../store/styleSignals'

const PEN_MODES = [
  { id: 'pen', label: 'Pen', desc: 'Ballpoint pen', Icon: PenIcon },
  { id: 'marker', label: 'Marker', desc: 'Chisel tip marker', Icon: MarkerIcon },
  { id: 'brush', label: 'Brush', desc: 'Calligraphy brush', Icon: BrushIcon },
  { id: 'highlighter', label: 'Highlight', desc: 'Highlighter pen', Icon: HighlighterIcon },
  { id: 'laser', label: 'Laser', desc: 'Laser pointer', Icon: LaserIcon },
] as const

const COLORS = [
  '#525252', '#f87171', '#60a5fa', '#4ade80',
  '#fb923c', '#c084fc', '#f472b6', '#ffffff',
]

export function SuperPenToolbar() {
  const editor = useEditor()
  const [settings, setSettings] = useState<SuperPenSettings>({ ...DEFAULT_SETTINGS })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const signalColor = useValue('signalColor', () => currentCustomColorSignal.get(), [])
  const signalThickness = useValue('signalThickness', () => currentThicknessSignal.get(), [])
  const signalOpacity = useValue('signalOpacity', () => currentOpacitySignal.get(), [])

  useEffect(() => {
    currentThicknessSignal.set(settings.size)
    currentOpacitySignal.set(settings.opacity)
    currentCustomColorSignal.set(settings.color)
  }, [])

  useEffect(() => {
    currentThicknessSignal.set(settings.size)
  }, [settings.size])

  useEffect(() => {
    currentOpacitySignal.set(settings.opacity)
  }, [settings.opacity])

  const getTool = useCallback((): SuperPenTool | null => {
    try {
      return (editor as any).root?.children?.['super-pen'] as SuperPenTool ?? null
    } catch {
      return null
    }
  }, [editor])

  const activate = useCallback(() => {
    editor.setCurrentTool('super-pen')
    editor.updateInstanceState({ isToolLocked: true })
  }, [editor])

  const updateSetting = useCallback(<K extends keyof SuperPenSettings>(
    key: K,
    value: SuperPenSettings[K]
  ) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    getTool()?.updateSettings({ [key]: value })
  }, [settings, getTool])

  const updatePipeline = useCallback((key: string, value: number) => {
    const next = {
      ...settings,
      pipeline: { ...settings.pipeline, [key]: value },
    }
    setSettings(next)
    getTool()?.updateSettings({ pipeline: next.pipeline })
  }, [settings, getTool])

  return (
    <div className="flex flex-col gap-2 p-2 select-none">
      <button
        onClick={activate}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
        title="Super Smooth Pen"
      >
        <span>✒️</span>
        <span>Super Pen</span>
      </button>

      <div className="flex gap-1">
        {PEN_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => updateSetting('mode', m.id)}
            title={m.desc}
            className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded transition-colors ${
              settings.mode === m.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            <m.Icon size={14} />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => {
              currentCustomColorSignal.set(c)
              updateSetting('color', c)
            }}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              signalColor === c ? 'border-blue-400 scale-110' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ backgroundColor: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #999' : undefined }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={signalColor}
          onChange={e => {
            currentCustomColorSignal.set(e.target.value)
            updateSetting('color', e.target.value)
          }}
          className="w-6 h-6 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent"
          title="Custom color"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Size</span>
          <span>{signalThickness}px</span>
        </div>
        <input
          type="range" min={1} max={20} step={0.5}
          value={signalThickness}
          onChange={e => {
            const v = Number(e.target.value)
            currentThicknessSignal.set(v)
            updateSetting('size', v)
          }}
          className="w-full h-1 accent-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Opacity</span>
          <span>{Math.round(signalOpacity * 100)}%</span>
        </div>
        <input
          type="range" min={0.05} max={1} step={0.05}
          value={signalOpacity}
          onChange={e => {
            const v = Number(e.target.value)
            currentOpacitySignal.set(v)
            updateSetting('opacity', v)
          }}
          className="w-full h-1 accent-blue-500"
        />
      </div>

      <button
        onClick={() => setShowAdvanced(v => !v)}
        className="text-xs text-gray-400 hover:text-gray-600 text-left"
      >
        {showAdvanced ? '▲ Hide' : '▼ Advanced smoothing'}
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Smoothing Pipeline
          </p>

          <SliderRow
            label="Stabilization"
            hint="String leash — kills hand tremor"
            min={0} max={20} step={1}
            value={settings.pipeline.stringRadius}
            onChange={v => updatePipeline('stringRadius', v)}
            format={v => `${v}px`}
          />

          <SliderRow
            label="Jitter reduction"
            hint="One Euro filter — smooths slow-speed wobble"
            min={0.1} max={3.0} step={0.1}
            value={settings.pipeline.oneEuroMinCutoff}
            onChange={v => updatePipeline('oneEuroMinCutoff', v)}
            format={v => v.toFixed(1)}
          />

          <SliderRow
            label="Speed response"
            hint="How quickly the filter adapts to fast movement"
            min={0.001} max={0.02} step={0.001}
            value={settings.pipeline.oneEuroBeta}
            onChange={v => updatePipeline('oneEuroBeta', v)}
            format={v => v.toFixed(3)}
          />

          <SliderRow
            label="Final smoothing"
            hint="Post-stroke Gaussian pass (applied on pen up)"
            min={3} max={15} step={2}
            value={settings.pipeline.gaussianKernelSize}
            onChange={v => updatePipeline('gaussianKernelSize', v)}
            format={v => `k=${v}`}
          />

          <SliderRow
            label="Noise gate"
            hint="Minimum movement before recording a point"
            min={0} max={5} step={0.5}
            value={settings.pipeline.noiseMinDistance}
            onChange={v => updatePipeline('noiseMinDistance', v)}
            format={v => `${v}px`}
          />
        </div>
      )}
    </div>
  )
}

function SliderRow({
  label, hint, min, max, step, value, onChange, format
}: {
  label: string
  hint: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <div className="flex flex-col gap-0.5" title={hint}>
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400 font-mono">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 accent-blue-500"
      />
    </div>
  )
}
