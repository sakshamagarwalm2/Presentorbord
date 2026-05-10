import { useEditor, useValue, DefaultColorStyle, DefaultDashStyle, DefaultFillStyle } from '@tldraw/tldraw'
import { Check, SlidersHorizontal, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import {
  currentThicknessSignal,
  currentOpacitySignal,
  currentIsBrushSignal,
  currentCustomColorSignal
} from '../store/styleSignals'
import { COLOR_MAP } from '../constants/colorConstants'
import { getNearestNamedColor } from '../utils/colorUtils'

/* ------------------------------------------------------------------ */
/*  Color Definitions & Themes                                         */
/* ------------------------------------------------------------------ */

interface ColorTheme {
  bg: string
  shadow: string
  border?: string
}

const COLOR_THEMES: Record<string, ColorTheme> = {
  black: { bg: 'bg-neutral-600 text-white', shadow: 'shadow-zinc-200 dark:shadow-zinc-700/50', border: 'border-neutral-500' },
  grey: { bg: 'bg-neutral-400 text-white', shadow: 'shadow-zinc-200 dark:shadow-zinc-700/50', border: 'border-neutral-400' },
  'light-violet': { bg: 'bg-violet-400 text-white', shadow: 'shadow-violet-200 dark:shadow-violet-700/50', border: 'border-violet-400' },
  violet: { bg: 'bg-violet-500 text-white', shadow: 'shadow-violet-200 dark:shadow-violet-700/50', border: 'border-violet-500' },
  blue: { bg: 'bg-blue-400 text-white', shadow: 'shadow-blue-200 dark:shadow-blue-700/50', border: 'border-blue-400' },
  'light-blue': { bg: 'bg-sky-400 text-white', shadow: 'shadow-sky-200 dark:shadow-sky-700/50', border: 'border-sky-400' },
  yellow: { bg: 'bg-yellow-400 text-black', shadow: 'shadow-yellow-200 dark:shadow-yellow-600/50', border: 'border-yellow-400' },
  orange: { bg: 'bg-orange-400 text-white', shadow: 'shadow-orange-200 dark:shadow-orange-700/50', border: 'border-orange-400' },
  green: { bg: 'bg-green-400 text-white', shadow: 'shadow-green-200 dark:shadow-green-700/50', border: 'border-green-400' },
  'light-green': { bg: 'bg-emerald-400 text-black', shadow: 'shadow-emerald-200 dark:shadow-emerald-700/50', border: 'border-emerald-400' },
  red: { bg: 'bg-red-400 text-white', shadow: 'shadow-red-200 dark:shadow-red-700/50', border: 'border-red-400' },
  'light-red': { bg: 'bg-rose-400 text-black', shadow: 'shadow-rose-200 dark:shadow-rose-700/50', border: 'border-rose-400' },
  white: { bg: 'bg-white text-black border border-gray-300', shadow: 'shadow-gray-200 dark:shadow-gray-700/50', border: 'border-gray-300' },
}

const FILL_ICONS: Record<string, React.FC<any>> = {
  none: () => <div className="w-4 h-4 border-2 border-current rounded-sm" />,
  semi: () => <div className="w-4 h-4 border-2 border-current rounded-sm bg-current/30" />,
  solid: () => <div className="w-4 h-4 border-2 border-current rounded-sm bg-current" />,
  pattern: () => (
    <div className="w-4 h-4 border-2 border-current rounded-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-current/20 flex flex-wrap gap-0.5 p-0.5">
        <div className="w-0.5 h-0.5 bg-current rounded-full" />
        <div className="w-0.5 h-0.5 bg-current rounded-full" />
        <div className="w-0.5 h-0.5 bg-current rounded-full" />
        <div className="w-0.5 h-0.5 bg-current rounded-full" />
      </div>
    </div>
  ),
}

const DASH_ICONS: Record<string, React.FC<any>> = {
  draw: () => <div className="w-4 h-0.5 bg-current rounded-full" />,
  solid: () => <div className="w-4 h-0.5 bg-current rounded-full" />,
  dashed: () => <div className="w-4 h-0.5 border-t-2 border-dashed border-current" />,
  dotted: () => <div className="w-4 h-0.5 border-t-2 border-dotted border-current" />,
  brush: () => (
    <div className="relative w-4 h-2">
      <div className="absolute inset-0 bg-current rounded-full opacity-20" />
      <div className="absolute inset-y-0.5 inset-x-0 bg-current rounded-full" />
    </div>
  ),
}

const OPACITIES = [0.1, 0.25, 0.5, 0.75, 1]

export function StylePanel({ isVisible }: { isVisible: boolean }) {
  const editor = useEditor()
  const [showCustomThickness, setShowCustomThickness] = useState(false)

  // Use the custom signal if active, otherwise fallback to tldraw's style
  const currentColor = useValue('color', () => {
    const customHex = currentCustomColorSignal.get()
    
    // CASE-INSENSITIVE reverse lookup: if the hex matches a built-in color, use its name
    const colorName = Object.keys(COLOR_MAP).find(
      k => COLOR_MAP[k].toLowerCase() === customHex.toLowerCase()
    )
    
    if (colorName) return colorName

    // If customHex exists and is NOT in COLOR_MAP (a true custom color), use it directly
    if (customHex) {
      return customHex
    }

    const shared = editor.getSharedStyles().get(DefaultColorStyle)
    if (shared && shared.type === 'shared') return shared.value
    return editor.getStyleForNextShape(DefaultColorStyle)
  }, [editor])

  const [customColor, setCustomColor] = useState('#3b82f6')
  const colorInputRef = useRef<HTMLInputElement>(null)

  const isCustomColorActive = !DefaultColorStyle.values.includes(currentColor as any)

  // Debug logging
  useEffect(() => {
    if (isVisible) {
      console.log('[StylePanel] Visible. State:', {
        currentColor,
        isCustomColorActive,
        customColor,
      })
    }
  }, [currentColor, isCustomColorActive, customColor, isVisible])

  const currentFill = useValue('fill', () => {
    const shared = editor.getSharedStyles().get(DefaultFillStyle)
    if (shared && shared.type === 'shared') return shared.value
    return editor.getStyleForNextShape(DefaultFillStyle)
  }, [editor])

  const currentDash = useValue('dash', () => {
    const shared = editor.getSharedStyles().get(DefaultDashStyle)
    if (shared && shared.type === 'shared') return shared.value
    return editor.getStyleForNextShape(DefaultDashStyle)
  }, [editor])

  const currentThickness = useValue('thickness', () => {
    const selected = editor.getSelectedShapes()
    if (selected.length > 0) {
      return selected[0].meta?.thickness ?? 16
    }
    return currentThicknessSignal.get()
  }, [editor])

  const currentIsBrush = useValue('isBrush', () => {
    const selected = editor.getSelectedShapes()
    if (selected.length > 0) {
      return !!selected[0].meta?.isBrush
    }
    return currentIsBrushSignal.get()
  }, [editor])

  // Opacity handling
  const currentOpacity = useValue('opacity', () => {
    const selected = editor.getSelectedShapes() as any[]
    if (selected.length > 0) {
      const firstOpacity = selected[0].opacity ?? 1
      const isMixed = selected.some(s => Math.abs((s.opacity ?? 1) - firstOpacity) > 0.05)
      return isMixed ? 1 : firstOpacity
    }
    return currentOpacitySignal.get()
  }, [editor])

  if (!isVisible) return null

  const handleColorChange = (color: string) => {
    console.log('[StylePanel] handleColorChange (Direct):', color)
    const selected = editor.getSelectedShapes()
    const convertedColor = COLOR_MAP[color] || color
    
    currentCustomColorSignal.set(convertedColor)
    localStorage.setItem('last-used-color', convertedColor)

    // Match best named color for native shapes
    const bestNamedKey = getNearestNamedColor(convertedColor)

    const superPenShapes = selected.filter(s => s.type === 'super-pen')
    if (superPenShapes.length > 0) {
      editor.updateShapes(superPenShapes.map(s => ({
        id: s.id,
        type: 'super-pen',
        props: { ...s.props, color: convertedColor }
      })))
    }

    if (selected.length > 0) {
      // @ts-ignore
      editor.setStyleForSelectedShapes(DefaultColorStyle, bestNamedKey)
    }

    // @ts-ignore
    editor.setStyleForNextShapes(DefaultColorStyle, bestNamedKey)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    
    // Debounce the actual application of the color to prevent excessive traffic
    const timeoutId = setTimeout(() => {
      console.log('[StylePanel] Applying debounced custom color:', newColor)
      handleColorChange(newColor)
    }, 200)
    
    return () => clearTimeout(timeoutId)
  }

  const handleFillChange = (fill: string) => {
    editor.setStyleForSelectedShapes(DefaultFillStyle, fill as any)
    editor.setStyleForNextShapes(DefaultFillStyle, fill as any)
  }

  const handleDashChange = (dash: string) => {
    if (dash === 'brush') {
      // Toggle brush mode via meta instead of dash style to avoid validation errors
      const nextBrush = !currentIsBrush
      editor.updateShapes(editor.getSelectedShapes().map(s => ({
        id: s.id,
        type: s.type,
        meta: { ...s.meta, isBrush: nextBrush }
      })))
      currentIsBrushSignal.set(nextBrush)
      return
    }

    // Normal dash styles
    editor.setStyleForSelectedShapes(DefaultDashStyle, dash as any)
    editor.setStyleForNextShapes(DefaultDashStyle, dash as any)

    // Disable brush if a normal dash is picked
    editor.updateShapes(editor.getSelectedShapes().map(s => ({
      id: s.id,
      type: s.type,
      meta: { ...s.meta, isBrush: false }
    })))
    currentIsBrushSignal.set(false)
  }

  const handleThicknessChange = (thickness: number) => {
    const selected = editor.getSelectedShapes()
    if (selected.length > 0) {
      editor.updateShapes(selected.map(s => ({
        id: s.id,
        type: s.type,
        meta: { ...s.meta, thickness }
      })))
    }
    currentThicknessSignal.set(thickness)
  }

  const handleOpacityChange = (opacity: number) => {
    const selected = editor.getSelectedShapes()
    if (selected.length > 0) {
      editor.updateShapes(selected.map(s => ({
        id: s.id,
        type: s.type,
        opacity
      })))
    }
    currentOpacitySignal.set(opacity)
  }

  const theme = COLOR_THEMES[currentColor] || { bg: 'bg-blue-500 text-white', shadow: 'shadow-blue-200' }

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-3 w-[260px] flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200 relative">
      
      {/* Colors Grid */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Color</p>
        <div className="grid grid-cols-7 gap-1.5">
          {DefaultColorStyle.values.map(color => {
            const cTheme = COLOR_THEMES[color]
            const isActive = currentColor === color
            return (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                    ${cTheme.bg}
                    ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'}
                 `}
                title={color}
              >
                {isActive && <Check size={12} className={color === 'white' || color === 'yellow' || color.startsWith('light') ? 'text-black' : 'text-white'} />}
              </button>
            )
          })}
          
          {/* Last Used Custom Color Slot */}
          <button
            onClick={() => handleColorChange(customColor)}
            className={`
              w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border border-gray-200 dark:border-gray-700
              ${isCustomColorActive ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'}
            `}
            style={{ backgroundColor: customColor }}
            title={`Custom Color: ${customColor}`}
          >
            {isCustomColorActive && <Check size={12} className="text-white drop-shadow-md" />}
          </button>

          {/* Color Picker Opener Button */}
          <button
            onClick={() => colorInputRef.current?.click()}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 border border-dashed border-gray-300 dark:border-gray-600"
            title="Choose New Color"
          >
            <Plus size={12} />
          </button>

          <input
            ref={colorInputRef}
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Fill */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Fill</p>
          <div className="grid grid-cols-4 gap-1">
            {DefaultFillStyle.values.map(fill => {
              const Icon = FILL_ICONS[fill] || FILL_ICONS['none']
              const isActive = currentFill === fill
              return (
                <button
                  key={fill}
                  onClick={() => handleFillChange(fill)}
                  className={`
                                aspect-square rounded-lg flex items-center justify-center transition-all
                                ${isActive
                      ? `${theme.bg} shadow-sm`
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }
                            `}
                  title={fill}
                >
                  <Icon />
                </button>
              )
            })}
          </div>
        </div>

        {/* Dash */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Dash</p>
          <div className="grid grid-cols-4 gap-1">
            {/* We map the normal dash styles plus our custom brush toggle */}
            {[...DefaultDashStyle.values, 'brush'].map(dash => {
              const Icon = DASH_ICONS[dash] || DASH_ICONS['draw']
              const isActive = dash === 'brush' ? currentIsBrush : (currentDash === dash && !currentIsBrush)
              return (
                <button
                  key={dash}
                  onClick={() => handleDashChange(dash)}
                  className={`
                                aspect-square rounded-lg flex items-center justify-center transition-all
                                ${isActive
                      ? `${theme.bg} shadow-sm`
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }
                            `}
                  title={dash}
                >
                  <Icon />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Thickness Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Thickness</p>
            <div
              className="w-4 h-4 rounded-lg flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 shadow-inner"
              title="Thickness Preview"
            >
              <div
                className="rounded-full bg-white dark:bg-black"
                style={{
                  width: Math.max(1.5, currentThickness / 2.5),
                  height: Math.max(1.5, currentThickness / 2.5),
                  opacity: currentOpacity
                }}
              />
            </div>
          </div>
          <p className="text-[10px] font-medium text-gray-500">{Math.round(currentThickness)}px</p>
        </div>

        <div className="flex items-center gap-1 mb-2">
          {[3, 4, 5, 6, 8, 12].map(t => (
            <button
              key={t}
              onClick={() => handleThicknessChange(t)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${currentThickness === t ? `${theme.bg} shadow-sm` : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setShowCustomThickness(!showCustomThickness)}
            className={`p-1.5 rounded-lg transition-all ${showCustomThickness ? `${theme.bg} shadow-sm` : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            title="Custom Thickness"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {showCustomThickness && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={currentThickness}
              onChange={(e) => handleThicknessChange(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between mt-1 text-[8px] text-gray-400 px-1">
              <span>1px</span>
              <span>15px</span>
              <span>30px</span>
            </div>
          </div>
        )}
      </div>

      {/* Opacity Buttons */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Opacity</p>
        <div className="flex gap-1">
          {OPACITIES.map(op => {
            const isActive = Math.abs(currentOpacity - op) < 0.05
            return (
              <button
                key={op}
                onClick={() => handleOpacityChange(op)}
                className={`
                            flex-1 py-1.5 rounded-lg text-xs font-medium transition-all
                            ${isActive
                    ? `${theme.bg} shadow-sm`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }
                        `}
              >
                {Math.round(op * 100)}%
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
