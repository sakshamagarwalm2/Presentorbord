import { useEditor, useValue, DefaultColorStyle, DefaultDashStyle, DefaultFillStyle, DefaultSizeStyle } from '@tldraw/tldraw'
import { Check } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Color Definitions & Themes                                         */
/* ------------------------------------------------------------------ */

interface ColorTheme {
  bg: string
  shadow: string
  border?: string
}

const COLOR_THEMES: Record<string, ColorTheme> = {
  black: { bg: 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900', shadow: 'shadow-zinc-200 dark:shadow-zinc-900/40', border: 'border-zinc-400' },
  grey: { bg: 'bg-zinc-500 text-white', shadow: 'shadow-zinc-200 dark:shadow-zinc-900/40', border: 'border-zinc-400' },
  'light-violet': { bg: 'bg-violet-400 text-white', shadow: 'shadow-violet-200 dark:shadow-violet-900/40', border: 'border-violet-300' },
  violet: { bg: 'bg-violet-600 text-white', shadow: 'shadow-violet-200 dark:shadow-violet-900/40', border: 'border-violet-500' },
  blue: { bg: 'bg-blue-500 text-white', shadow: 'shadow-blue-200 dark:shadow-blue-900/40', border: 'border-blue-400' },
  'light-blue': { bg: 'bg-sky-400 text-white', shadow: 'shadow-sky-200 dark:shadow-sky-900/40', border: 'border-sky-300' },
  yellow: { bg: 'bg-yellow-400 text-black', shadow: 'shadow-yellow-200 dark:shadow-yellow-900/40', border: 'border-yellow-300' },
  orange: { bg: 'bg-orange-500 text-white', shadow: 'shadow-orange-200 dark:shadow-orange-900/40', border: 'border-orange-400' },
  green: { bg: 'bg-green-500 text-white', shadow: 'shadow-green-200 dark:shadow-green-900/40', border: 'border-green-400' },
  'light-green': { bg: 'bg-emerald-400 text-black', shadow: 'shadow-emerald-200 dark:shadow-emerald-900/40', border: 'border-emerald-300' },
  red: { bg: 'bg-red-500 text-white', shadow: 'shadow-red-200 dark:shadow-red-900/40', border: 'border-red-400' },
  'light-red': { bg: 'bg-rose-400 text-black', shadow: 'shadow-rose-200 dark:shadow-rose-900/40', border: 'border-rose-300' },
  white: { bg: 'bg-white text-black border border-gray-200', shadow: 'shadow-gray-200 dark:shadow-gray-900/40', border: 'border-gray-300' },
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
  draw: () => <div className="w-4 h-0.5 bg-current rounded-full" />, // Scribble placeholder
  solid: () => <div className="w-4 h-0.5 bg-current rounded-full" />,
  dashed: () => <div className="w-4 h-0.5 border-t-2 border-dashed border-current" />,
  dotted: () => <div className="w-4 h-0.5 border-t-2 border-dotted border-current" />,
}

const SIZES = ['s', 'm', 'l', 'xl']

const OPACITIES = [0.1, 0.25, 0.5, 0.75, 1]

export function StylePanel({ isVisible }: { isVisible: boolean }) {
  const editor = useEditor()
  
  const currentColor = useValue('color', () => {
    const shared = editor.getSharedStyles().get(DefaultColorStyle)
    if (shared && shared.type === 'shared') return shared.value
    return editor.getStyleForNextShape(DefaultColorStyle)
  }, [editor])

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

  const currentSize = useValue('size', () => {
    const shared = editor.getSharedStyles().get(DefaultSizeStyle)
    if (shared && shared.type === 'shared') return shared.value
    return editor.getStyleForNextShape(DefaultSizeStyle)
  }, [editor])
  
  // Opacity handling
  const currentOpacity = useValue('opacity', () => {
    const selected = editor.getSelectedShapes() as any[]
    if (selected.length > 0) {
      // Return common opacity
      const firstOpacity = selected[0].opacity ?? 1
      // Check if all vary
      const isMixed = selected.some(s => Math.abs((s.opacity ?? 1) - firstOpacity) > 0.05)
      return isMixed ? 1 : firstOpacity
    }
    
    // @ts-ignore
    return editor.getOpacityForNextShape ? editor.getOpacityForNextShape() : 1
  }, [editor])

  if (!isVisible) return null

  const handleColorChange = (color: string) => {
    editor.setStyleForSelectedShapes(DefaultColorStyle, color as any)
    editor.setStyleForNextShapes(DefaultColorStyle, color as any)
  }

  const handleFillChange = (fill: string) => {
    editor.setStyleForSelectedShapes(DefaultFillStyle, fill as any)
    editor.setStyleForNextShapes(DefaultFillStyle, fill as any)
  }

  const handleDashChange = (dash: string) => {
    editor.setStyleForSelectedShapes(DefaultDashStyle, dash as any)
    editor.setStyleForNextShapes(DefaultDashStyle, dash as any)
  }

  const handleSizeChange = (idx: number) => {
    const size = SIZES[idx]
    editor.setStyleForSelectedShapes(DefaultSizeStyle, size as any)
    editor.setStyleForNextShapes(DefaultSizeStyle, size as any)
  }

  const handleOpacityChange = (opacity: number) => {
    // @ts-ignore
    if (editor.setOpacityForSelectedShapes) {
         // @ts-ignore
        editor.setOpacityForSelectedShapes(opacity)
         // @ts-ignore
        editor.setOpacityForNextShapes(opacity)
    } else {
        // Fallback for older Tldraw versions if needed
        const selected = editor.getSelectedShapes()
        if (selected.length > 0) {
          editor.updateShapes(selected.map(s => ({ id: s.id, type: s.type, opacity })))
        }
        
        // Also try to set for next shapes if possible
        // @ts-ignore
        if (editor.setOpacityForNextShapes) {
            // @ts-ignore
            editor.setOpacityForNextShapes(opacity)
        }
    }
  }

  const theme = COLOR_THEMES[currentColor] || COLOR_THEMES['blue']

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-3 w-[260px] flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
      
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
                {DefaultDashStyle.values.map(dash => {
                    const Icon = DASH_ICONS[dash] || DASH_ICONS['draw']
                    const isActive = currentDash === dash
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

      {/* Size Slider */}
      <div>
         <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Size</p>
            <p className="text-[10px] font-medium text-gray-500">{currentSize.toUpperCase()}</p>
         </div>
         <input 
            type="range"
            min="0"
            max="3"
            step="1"
            value={SIZES.indexOf(currentSize)}
            onChange={(e) => handleSizeChange(parseInt(e.target.value))}
            className="w-full accent-blue-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
         />
         <div className="flex justify-between mt-1 text-[8px] text-gray-400 px-1">
             <span>S</span>
             <span>M</span>
             <span>L</span>
             <span>XL</span>
         </div>
      </div>

      {/* Opacity Buttons */}
      <div>
         <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Opacity</p>
         <div className="flex gap-1">
             {OPACITIES.map(op => {
                 // Fuzzy match for float opacity
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
                         {op * 100}%
                     </button>
                 )
             })}
         </div>
      </div>

    </div>
  )
}
