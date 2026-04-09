import { useEditor, useValue, GeoShapeGeoStyle, DefaultColorStyle, createShapeId } from '@tldraw/tldraw'
import { useState, useRef, useEffect } from 'react'
import {
  MousePointer2,
  Hand,
  Palette,
  Eraser,
  ArrowUpRight,
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
  Cloud,
  Heart,
  Hexagon,
  Pentagon,
  Octagon,
  ChevronDown,
  ChevronUp,
  Type,
  StickyNote,
  Frame,
  ImageIcon,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  BarChart2,
  Crosshair,
  Clipboard,
  Lasso,
  Lock,
  Unlock,
  Layers,
  Plus,
  Minus,
  Scissors,
  Target,
} from 'lucide-react'
import { useStrokeEraser } from '../tools/useStrokeEraser'
import { StylePanel } from './StylePanel'
import { PenIcon, MarkerIcon, BrushIcon, HighlighterIcon, LaserIcon, DrawIcon } from './ToolIcons'
import { currentEraserSizeSignal } from '../store/styleSignals'

/* ------------------------------------------------------------------ */
/*  Color Themes                                                       */
/* ------------------------------------------------------------------ */

interface ColorTheme {
  bg: string
  shadow: string
  border?: string
}

const COLOR_THEMES: Record<string, ColorTheme> = {
  black: { bg: 'bg-black text-white', shadow: 'shadow-zinc-200 dark:shadow-zinc-900/40', border: 'border-zinc-400' },
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
  white: { bg: 'bg-white text-black border border-gray-300', shadow: 'shadow-gray-200 dark:shadow-gray-900/40', border: 'border-gray-300' },
}

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

interface ToolDef {
  id: string
  label: string
  icon: React.FC<any>
  type?: string
  brushType?: string
}

const PEN_GROUP: ToolDef[] = [
  { id: 'super-pen', label: 'Pen', icon: PenIcon, type: 'super-pen' },
  { id: 'super-marker', label: 'Marker', icon: MarkerIcon, type: 'super-pen', brushType: 'marker' },
  { id: 'super-brush', label: 'Brush', icon: BrushIcon, type: 'super-pen', brushType: 'brush' },
  { id: 'draw', label: 'Pencil', icon: DrawIcon },
  { id: 'highlight', label: 'Highlighter', icon: HighlighterIcon, type: 'highlighter' },
  { id: 'custom-laser', label: 'Laser', icon: LaserIcon, type: 'laser' },
]

const MORE_TOOLS: ToolDef[] = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'note', label: 'Sticky Note', icon: StickyNote },
  { id: 'frame', label: 'Frame', icon: Frame },
  { id: 'asset', label: 'Image', icon: ImageIcon },
]

/* ------------------------------------------------------------------ */
/*  Eraser size presets                                                 */
/* ------------------------------------------------------------------ */

const ERASER_SIZES = [
  { label: 'S', value: 5 },
  { label: 'M', value: 12 },
  { label: 'L', value: 24 },
  { label: 'XL', value: 40 },
]

/* ------------------------------------------------------------------ */
/*  Shape group definitions                                            */
/* ------------------------------------------------------------------ */

interface ShapeDef {
  id: string          // 'arrow' or 'geo'
  geoType?: string    // e.g. 'rectangle', 'ellipse' – only for geo
  label: string
  icon: React.FC<any>
}

const SHAPE_GROUP: ShapeDef[] = [
  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight },
  { id: 'custom-line', label: 'Line', icon: Minus },
  { id: 'graph-axes-1', label: '1st Quad', icon: BarChart2 },
  { id: 'graph-axes-4', label: '4 Quad', icon: Crosshair },
  { id: 'geo', geoType: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'geo', geoType: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'geo', geoType: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'geo', geoType: 'diamond', label: 'Diamond', icon: Diamond },
  { id: 'geo', geoType: 'star', label: 'Star', icon: Star },
  { id: 'geo', geoType: 'cloud', label: 'Cloud', icon: Cloud },
  { id: 'geo', geoType: 'heart', label: 'Heart', icon: Heart },
  { id: 'geo', geoType: 'hexagon', label: 'Hexagon', icon: Hexagon },
  { id: 'geo', geoType: 'pentagon', label: 'Pentagon', icon: Pentagon },
  { id: 'geo', geoType: 'octagon', label: 'Octagon', icon: Octagon },
]


/* ------------------------------------------------------------------ */
/*  Pen group button with flyout                                       */
/* ------------------------------------------------------------------ */

function PenGroupButton({
  activeTool,
  onSelect,
  activeTheme,
  editor,
}: {
  activeTool: string
  onSelect: (toolId: string) => void
  activeTheme?: ColorTheme
  editor: any
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolDef>(PEN_GROUP[0])
  const flyoutRef = useRef<HTMLDivElement>(null)

  const theme = activeTheme || COLOR_THEMES['blue']

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update selected when tool changes externally
  useEffect(() => {
    // @ts-ignore
    const isBrush = !!(window.currentIsBrushSignal?.get())
    // @ts-ignore
    const brushType = window.currentBrushTypeSignal?.get() || 'normal'

    const match = PEN_GROUP.find((t) => {
      if (t.type === 'super-pen') {
        return activeTool === 'super-pen' && (t.brushType || 'pen') === brushType
      }
      if (t.type === 'brush') {
        return activeTool === 'draw' && isBrush && brushType === t.brushType
      }
      if (t.id === 'draw') {
        return activeTool === 'draw' && !isBrush
      }
      return t.id === activeTool
    })
    if (match) setSelectedTool(match)
  }, [activeTool])

  const isGroupActive = PEN_GROUP.some((t) => t.id === activeTool) || activeTool === 'draw' || activeTool === 'super-pen'
  const Icon = selectedTool.icon

  const handleSelect = (tool: ToolDef) => {
    setSelectedTool(tool)

    if (tool.type === 'super-pen') {
      // Update super-pen mode on the tool instance
      const superPenTool = (editor as any).root?.children?.['super-pen']
      if (superPenTool) {
        superPenTool.updateSettings({
          mode: tool.brushType || 'pen'
        })
      }
      editor.setCurrentTool('super-pen')
      editor.updateInstanceState({ isToolLocked: true })
    } else if (tool.type === 'brush') {
      // @ts-ignore
      window.currentIsBrushSignal?.set(true)
      // @ts-ignore
      window.currentBrushTypeSignal?.set(tool.brushType || 'normal')
      editor.setCurrentTool('draw')
      editor.updateInstanceState({ isToolLocked: true })
    } else {
      // @ts-ignore
      window.currentIsBrushSignal?.set(false)
      // @ts-ignore
      window.currentBrushTypeSignal?.set('normal')
      onSelect(tool.id)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={flyoutRef}>
      {/* Main button */}
      <div className="flex items-center">
        <button
          onClick={() => handleSelect(selectedTool)}
          className={`
            relative flex items-center justify-center
            w-10 h-10 rounded-l-xl transition-all duration-150
            ${isGroupActive
              ? `${theme.bg} shadow-md ${theme.shadow}`
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            }
          `}
          title={selectedTool.label}
        >
          <Icon size={20} />
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-center
            w-5 h-10 rounded-r-xl border-l transition-all duration-150
            ${isGroupActive
              ? `${theme.bg} ${theme.border || 'border-blue-400'}`
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 border-gray-200 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:border-gray-600'
            }
          `}
          title="More drawing tools"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Flyout */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 flex flex-col gap-1 min-w-[140px] z-[99999]">
          {PEN_GROUP.map((tool) => {
            const TIcon = tool.icon
            // @ts-ignore
            const isBrush = !!(window.currentIsBrushSignal?.get())
            // @ts-ignore
            const brushType = window.currentBrushTypeSignal?.get() || 'normal'

            let isActive = false
            if (tool.type === 'super-pen') {
              isActive = activeTool === 'super-pen' && (tool.brushType || 'pen') === brushType
            } else if (tool.type === 'brush') {
              // @ts-ignore
              isActive = activeTool === 'draw' && isBrush && brushType === tool.brushType
            } else {
              isActive = activeTool === tool.id
            }

            return (
              <button
                key={tool.id}
                onClick={() => handleSelect(tool)}
                className={`
                  flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px]
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                `}
              >
                <TIcon size={16} />
                {tool.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Eraser group button with flyout                                    */
/* ------------------------------------------------------------------ */

function EraserGroupButton({
  activeTool,
  eraserMode,
  eraserSize,
  onSelectTool,
  onSelectMode,
  onSelectSize,
  onClearPage,
  activeTheme,
}: {
  activeTool: string
  eraserMode: 'shape' | 'precision' | 'area'
  eraserSize: number
  onSelectTool: () => void
  onSelectMode: (mode: 'shape' | 'precision' | 'area') => void
  onSelectSize: (size: number) => void
  onClearPage: () => void
  activeTheme?: ColorTheme
}) {
  const [isOpen, setIsOpen] = useState(false)
  const flyoutRef = useRef<HTMLDivElement>(null)

  const theme = activeTheme || COLOR_THEMES['blue']

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = activeTool === 'eraser' || activeTool === 'precision-eraser' || activeTool === 'area-eraser'
  
  const getActiveIcon = () => {
    switch (eraserMode) {
      case 'precision': return Target
      case 'area': return Scissors
      default: return Eraser
    }
  }
  const ActiveIcon = getActiveIcon()

  return (
    <div className="relative" ref={flyoutRef}>
      {/* Split button */}
      <div className="flex items-center">
        <button
          onClick={onSelectTool}
          className={`
            relative flex items-center justify-center
            w-10 h-10 rounded-l-xl transition-all duration-150
            ${isActive
              ? `${theme.bg} shadow-md ${theme.shadow}`
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            }
          `}
          title={eraserMode === 'shape' ? 'Shape Eraser' : eraserMode === 'precision' ? 'Precision Eraser' : 'Area Eraser'}
        >
          <ActiveIcon size={20} />
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-center
            w-5 h-10 rounded-r-xl border-l transition-all duration-150
            ${isActive
              ? `${theme.bg} ${theme.border || 'border-blue-400'}`
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 border-gray-200 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:border-gray-600'
            }
          `}
          title="Eraser options"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Flyout */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 flex flex-col gap-1 min-w-[180px] z-[99999]">
          {/* Mode selection */}
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 pt-1">
            Eraser Mode
          </p>

          <button
            onClick={() => {
              onSelectMode('shape')
              setIsOpen(false)
            }}
            className={`
              flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px]
              ${eraserMode === 'shape'
                ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
          >
            <Eraser size={16} />
            Shape Eraser
          </button>

          <button
            onClick={() => {
              onSelectMode('precision')
              setIsOpen(false)
            }}
            className={`
              flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px]
              ${eraserMode === 'precision'
                ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
          >
            <Target size={16} />
            Precision Eraser
          </button>

          <button
            onClick={() => {
              onSelectMode('area')
              setIsOpen(false)
            }}
            className={`
              flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px]
              ${eraserMode === 'area'
                ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
          >
            <Scissors size={16} />
            Area Eraser
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />

          {/* Size selector */}
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2">
            Eraser Size
          </p>
          <div className="flex items-center gap-1 px-2 pb-1">
            {ERASER_SIZES.map((s) => (
              <button
                key={s.label}
                onClick={() => onSelectSize(s.value)}
                className={`
                  flex items-center justify-center rounded-lg transition-all text-xs font-bold
                  w-9 h-8
                  ${eraserSize === s.value
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }
                `}
                title={`Size ${s.label} (${s.value}px)`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />

          {/* Clear Page Action */}
          <button
            onClick={() => {
              onClearPage()
              setIsOpen(false)
            }}
            className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={16} />
            Clear Annotations
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shape group button with flyout                                     */
/* ------------------------------------------------------------------ */

function ShapeGroupButton({
  activeTool,
  editor,
  activeTheme,
}: {
  activeTool: string
  editor: ReturnType<typeof useEditor>
  activeTheme?: ColorTheme
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedShape, setSelectedShape] = useState<ShapeDef>(SHAPE_GROUP[0]) // default: Arrow
  const flyoutRef = useRef<HTMLDivElement>(null)

  const theme = activeTheme || COLOR_THEMES['blue']

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update selected shape when tool changes externally
  useEffect(() => {
    if (activeTool === 'geo') return
    const match = SHAPE_GROUP.find((s) => s.id === activeTool)
    if (match) setSelectedShape(match)
  }, [activeTool])

  const isGroupActive = SHAPE_GROUP.some((s) => s.id === activeTool)
  const Icon = selectedShape.icon

  const handleSelect = (shape: ShapeDef) => {
    setSelectedShape(shape)
    if (shape.id === 'geo' && shape.geoType) {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, shape.geoType as any)
      editor.setCurrentTool('geo')
    } else {
      editor.setCurrentTool(shape.id)
    }
    // DO NOT LOCK for shapes/geo - let it auto-switch back to select
    setIsOpen(false)
  }

  const handleMainClick = () => {
    if (selectedShape.id === 'geo' && selectedShape.geoType) {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, selectedShape.geoType as any)
      editor.setCurrentTool('geo')
    } else {
      editor.setCurrentTool(selectedShape.id)
    }
    // DO NOT LOCK for shapes/geo - let it auto-switch back to select
  }

  return (
    <div className="relative" ref={flyoutRef}>
      {/* Split button */}
      <div className="flex items-center">
        <button
          onClick={handleMainClick}
          className={`
            relative flex items-center justify-center
            w-10 h-10 rounded-l-xl transition-all duration-150
            ${isGroupActive
              ? `${theme.bg} shadow-md ${theme.shadow}`
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            }
          `}
          title={selectedShape.label}
        >
          <Icon size={20} />
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-center
            w-5 h-10 rounded-r-xl border-l transition-all duration-150
            ${isGroupActive
              ? `${theme.bg} ${theme.border || 'border-blue-400'}`
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 border-gray-200 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:border-gray-600'
            }
          `}
          title="More shapes"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Flyout – grid layout for shapes */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 z-[99999] min-w-[200px]">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 pb-1.5">
            Shapes
          </p>
          <div className="grid grid-cols-4 gap-1">
            {SHAPE_GROUP.map((shape, idx) => {
              const SIcon = shape.icon
              const isActive =
                shape.id === activeTool && (shape.id !== 'geo' || selectedShape.geoType === shape.geoType)
              return (
                <button
                  key={`${shape.id}-${shape.geoType ?? idx}`}
                  onClick={() => handleSelect(shape)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                    }
                  `}
                  title={shape.label}
                >
                  <SIcon size={18} />
                  <span className="text-[9px] font-medium leading-tight">{shape.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  More options button with flyout                                    */
/* ------------------------------------------------------------------ */

function MoreOptionsButton({
  activeTool,
  onSelect,
  onAction,
  activeTheme,
  onImageClick,
}: {
  activeTool: string
  onSelect: (toolId: string) => void
  onAction: (action: string) => void
  activeTheme?: ColorTheme
  onImageClick?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const flyoutRef = useRef<HTMLDivElement>(null)

  const theme = activeTheme || COLOR_THEMES['blue']

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isGroupActive = MORE_TOOLS.some((t) => t.id === activeTool)

  return (
    <div className="relative" ref={flyoutRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-xl transition-all duration-150
          ${isGroupActive
            ? `${theme.bg} shadow-md ${theme.shadow}`
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
          }
        `}
        title="More tools"
      >
        <ChevronUp size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 flex flex-col gap-1 min-w-[150px] z-[99999]">
          {MORE_TOOLS.map((tool) => {
            const TIcon = tool.icon
            const isActive = activeTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.id === 'asset' && onImageClick) {
                    onImageClick()
                  } else {
                    onSelect(tool.id)
                  }
                  setIsOpen(false)
                }}
                className={`
                  flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px]
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                `}
              >
                <TIcon size={16} />
                {tool.label}
              </button>
            )
          })}

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-600 my-0.5" />

          {/* Action items */}
          <button
            onClick={() => { onAction('delete'); setIsOpen(false) }}
            className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => { onAction('duplicate'); setIsOpen(false) }}
            className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Copy size={16} />
            Duplicate
          </button>
          <button
            onClick={() => { onAction('lock'); setIsOpen(false) }}
            className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Lock size={16} />
            Lock Selected
          </button>
          <button
            onClick={() => { onAction('unlock-all'); setIsOpen(false) }}
            className="flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px] text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Unlock size={16} />
            Unlock All
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Palette toggle (style panel show/hide)                             */
/* ------------------------------------------------------------------ */

function PaletteButton({
  isVisible,
  onToggle,
  activeTheme,
}: {
  isVisible: boolean
  onToggle: () => void
  activeTheme?: ColorTheme
}) {
  const theme = activeTheme || COLOR_THEMES['blue']
  return (
    <button
      onClick={onToggle}
      className={`
        relative flex flex-col items-center justify-center
        w-10 h-10 rounded-xl transition-all duration-150
        ${isVisible
          ? `${theme.bg} shadow-md ${theme.shadow}`
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
        }
      `}
      title={isVisible ? 'Hide Styles' : 'Show Styles'}
    >
      <Palette size={20} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Eraser cursor overlay                                              */
/* ------------------------------------------------------------------ */

function EraserCursorOverlay({ size, active }: { size: number; active: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      setPos({ x: e.clientX, y: e.clientY })
      setVisible(true)
    }

    const onLeave = () => setVisible(false)

    const container = document.querySelector('.tl-container') as HTMLElement
    if (!container) return

    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerleave', onLeave)
    return () => {
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerleave', onLeave)
    }
  }, [active])

  if (!active || !visible) return null

  const diameter = size * 2
  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x - diameter / 2,
        top: pos.y - diameter / 2,
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        border: '2px solid rgba(239, 68, 68, 0.7)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        pointerEvents: 'none',
        zIndex: 999999,
        transition: 'width 0.15s, height 0.15s, left 0.02s, top 0.02s',
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Main DrawingToolbar                                                */
/* ------------------------------------------------------------------ */

const SELECT_GROUP: ToolDef[] = [
  { id: 'lasso', label: 'Lasso Select', icon: Lasso },
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'hand', label: 'Hand', icon: Hand },
]

/* ------------------------------------------------------------------ */
/*  Select group button with flyout                                    */
/* ------------------------------------------------------------------ */

function SelectGroupButton({
  activeTool,
  onSelect,
  activeTheme,
  isCameraLocked,
  onToggleLock,
}: {
  activeTool: string
  onSelect: (toolId: string) => void
  activeTheme?: ColorTheme
  isCameraLocked: boolean
  onToggleLock: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolDef>(SELECT_GROUP[0])
  const flyoutRef = useRef<HTMLDivElement>(null)

  const theme = activeTheme || COLOR_THEMES['blue']

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update selected when tool changes externally
  useEffect(() => {
    const match = SELECT_GROUP.find((t) => t.id === activeTool)
    if (match) setSelectedTool(match)
  }, [activeTool])

  const isGroupActive = SELECT_GROUP.some((t) => t.id === activeTool)
  const Icon = selectedTool.icon

  return (
    <div className="relative" ref={flyoutRef}>
      {/* Main button */}
      <div className="flex items-center">
        <button
          onClick={() => onSelect(selectedTool.id)}
          className={`
            relative flex items-center justify-center
            w-10 h-10 rounded-l-xl transition-all duration-150
            ${isGroupActive
              ? `${theme.bg} shadow-md ${theme.shadow}`
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            }
          `}
          title={selectedTool.label}
        >
          <Icon size={20} />
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-center
            w-5 h-10 rounded-r-xl border-l transition-all duration-150
            ${isGroupActive
              ? `${theme.bg} ${theme.border || 'border-blue-400'}`
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 border-gray-200 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:border-gray-600'
            }
          `}
          title="More select tools"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Flyout */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 flex flex-col gap-1 min-w-[140px] z-[99999]">
          {SELECT_GROUP.map((tool) => {
            const TIcon = tool.icon
            const isActive = activeTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool)
                  onSelect(tool.id)
                  setIsOpen(false)
                }}
                className={`
                  flex items-center gap-3 px-3 py-1 rounded-lg transition-all text-[10px]
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                `}
              >
                <TIcon size={16} />
                {tool.label}
              </button>
            )
          })}

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-600 my-0.5" />

          {/* Action items */}
          <button
            onClick={() => { onToggleLock(); setIsOpen(false) }}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
              ${isCameraLocked
                ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
          >
            {isCameraLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isCameraLocked ? "Unlock Page" : "Lock Page"}
          </button>
        </div>
      )}
    </div>
  )
}

export function DrawingToolbar({ showRecentColors = true, onImageClick, onAddPage }: { showRecentColors?: boolean; onImageClick?: () => void; onAddPage?: () => void }) {
  const editor = useEditor()
  const activeTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])
  const currentColor = useValue('current color', () => {
    const shared = editor.getSharedStyles().get(DefaultColorStyle)
    if (shared && shared.type === 'shared') return shared.value
    return editor.getStyleForNextShape(DefaultColorStyle)
  }, [editor])
  const activeColorTheme = COLOR_THEMES[currentColor] || COLOR_THEMES['blue']

  // Track camera lock state for the toolbar button
  const isCameraLocked = useValue('camera lock', () => editor.getCameraOptions().isLocked, [editor])

  const [stylePanelVisible, setStylePanelVisible] = useState(false)
  const stylePanelRef = useRef<HTMLDivElement>(null)
  const paletteButtonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleGlobalPointerDown = (e: PointerEvent) => {
      if (!stylePanelVisible) return

      // Check if click is inside panel
      if (stylePanelRef.current && stylePanelRef.current.contains(e.target as Node)) {
        return
      }
      // Check if click is inside toggle button wrapper
      if (paletteButtonRef.current && paletteButtonRef.current.contains(e.target as Node)) {
        return
      }

      // Otherwise close
      setStylePanelVisible(false)
    }

    window.addEventListener('pointerdown', handleGlobalPointerDown, { capture: true })
    return () => window.removeEventListener('pointerdown', handleGlobalPointerDown, { capture: true })
  }, [stylePanelVisible])

  // Eraser state
  const [eraserMode, setEraserMode] = useState<'shape' | 'precision' | 'area'>('shape')
  const [eraserSize, setEraserSize] = useState(12)

  // Determine if precision eraser is currently active
  const isCustomEraserActive = eraserMode === 'precision' && activeTool === 'precision-eraser'



  // Activate stroke eraser hook (mainly for precision eraser cursor overlay)
  useStrokeEraser(editor, isCustomEraserActive, eraserSize, eraserMode)

  const selectTool = (toolId: string) => {
    editor.setCurrentTool(toolId)
    editor.updateInstanceState({ isToolLocked: true })
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'delete':
        editor.deleteShapes(editor.getSelectedShapeIds())
        break
      case 'duplicate':
        editor.duplicateShapes(editor.getSelectedShapeIds())
        break
      case 'lock':
        editor.updateShapes(editor.getSelectedShapes().map(shape => ({ ...shape, isLocked: true })))
        break
      case 'unlock-all':
        const currentPageId = editor.getCurrentPageId()
        const shapeIds = editor.getSortedChildIdsForParent(currentPageId)
        const shapesToUnlock = shapeIds
          .map(id => editor.getShape(id))
          .filter(s => s && s.isLocked) as any[] // type assertion to strict Shape

        if (shapesToUnlock.length > 0) {
          editor.updateShapes(shapesToUnlock.map(shape => ({
            id: shape.id,
            type: shape.type,
            isLocked: false
          })))
        }
        break
    }
  }

  const handleClearPage = () => {
    const currentPageId = editor.getCurrentPageId()
    const shapeIds = editor.getSortedChildIdsForParent(currentPageId)
    const shapesToDelete = shapeIds.filter(id => {
      const shape = editor.getShape(id)
      return shape && shape.type !== 'image'
    })

    if (shapesToDelete.length > 0) {
      editor.deleteShapes(shapesToDelete)
    }
  }

  const handleEraserSelect = () => {
    if (eraserMode === 'precision') {
      editor.setCurrentTool('precision-eraser')
    } else if (eraserMode === 'area') {
      editor.setCurrentTool('area-eraser')
    } else {
      editor.setCurrentTool('eraser')
    }
    editor.updateInstanceState({ isToolLocked: true })
  }

  const handleEraserModeChange = (mode: 'shape' | 'precision' | 'area') => {
    setEraserMode(mode)
    if (mode === 'precision') {
      editor.setCurrentTool('precision-eraser')
    } else if (mode === 'area') {
      editor.setCurrentTool('area-eraser')
    } else {
      editor.setCurrentTool('eraser')
    }
    editor.updateInstanceState({ isToolLocked: true })
  }

  const canUndo = useValue('canUndo', () => editor.getCanUndo(), [editor])
  const canRedo = useValue('canRedo', () => editor.getCanRedo(), [editor])

  // Recent Colors State
  const [recentColors, setRecentColors] = useState<string[]>(['white', 'yellow', 'blue'])

  // Update recent colors when current color changes
  useEffect(() => {
    // We only want to track if it's a valid color in our themes
    if (!COLOR_THEMES[currentColor]) return

    setRecentColors(prev => {
      // Remove if exists
      const next = prev.filter(c => c !== currentColor)
      // Add to front
      next.unshift(currentColor)
      // Keep max 3
      return next.slice(0, 3)
    })
  }, [currentColor])

  const handleRecentColorClick = (color: string) => {
    // @ts-ignore - color string is valid but type definition is strict union
    editor.setStyleForNextShapes(DefaultColorStyle, color)
    
    // If we are not in a drawing tool, switch to the default Pen
    const drawingTools = ['super-pen', 'draw', 'highlight', 'custom-laser']
    if (!drawingTools.includes(activeTool)) {
      editor.setCurrentTool('super-pen')
      editor.updateInstanceState({ isToolLocked: true })
    }

    // If we have selected shapes, update them too
    const selectedShapeIds = editor.getSelectedShapeIds()
    if (selectedShapeIds.length > 0) {
      // @ts-ignore
      editor.setStyleForSelectedShapes(DefaultColorStyle, color)
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Custom Copy/Paste Logic (Annotation Only)                          */
  /* ------------------------------------------------------------------ */

  const selectedShapeIds = useValue('selected shapes', () => editor.getSelectedShapeIds(), [editor])
  const [hasClipboardContent, setHasClipboardContent] = useState(false)
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)
  const [showCopyPasteDropdown, setShowCopyPasteDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check clipboard on mount and focus
  useEffect(() => {
    const checkClipboard = () => {
      const content = localStorage.getItem('annotation-clipboard')
      setHasClipboardContent(!!content)
    }
    checkClipboard()

    // Listen for storage events (cross-tab) and window focus
    window.addEventListener('storage', checkClipboard)
    window.addEventListener('focus', checkClipboard)
    return () => {
      window.removeEventListener('storage', checkClipboard)
      window.removeEventListener('focus', checkClipboard)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCopyPasteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyAnnotations = () => {
    const shapes = editor.getSelectedShapes()
    // Filter out images (and potential PDF backgrounds)
    const annotations = shapes.filter(s => s.type !== 'image' && s.type !== 'video')

    if (annotations.length === 0) return

    // Calculate offset from current viewport center to preserve "position in window"
    const viewportCenter = editor.getViewportScreenCenter()

    const clipboardData = annotations.map((s: any) => ({
      ...s,
      meta: {
        ...s.meta,
        // Store the offset from center at the time of copy
        clipOffsetX: s.x - viewportCenter.x,
        clipOffsetY: s.y - viewportCenter.y
      }
    }))

    localStorage.setItem('annotation-clipboard', JSON.stringify(clipboardData))
    setHasClipboardContent(true)

    // Show feedback
    setShowCopyFeedback(true)
    setTimeout(() => setShowCopyFeedback(false), 2000)
  }

  const handlePasteAnnotations = () => {
    const content = localStorage.getItem('annotation-clipboard')
    if (!content) return

    try {
      const shapes = JSON.parse(content)
      if (!Array.isArray(shapes)) return
      if (shapes.length === 0) return

      const viewportCenter = editor.getViewportScreenCenter()

      const newShapes = shapes.map((s: any) => {
        // Use stored offset if available, otherwise default to original logic (or keep as is)
        let x = s.x
        let y = s.y

        if (typeof s.meta?.clipOffsetX === 'number' && typeof s.meta?.clipOffsetY === 'number') {
          x = viewportCenter.x + s.meta.clipOffsetX
          y = viewportCenter.y + s.meta.clipOffsetY
        }

        // Remove the meta offsets before creating
        const { clipOffsetX, clipOffsetY, ...meta } = s.meta || {}

        return {
          ...s,
          id: createShapeId(),
          parentId: editor.getCurrentPageId(),
          x,
          y,
          meta
        }
      })

      editor.createShapes(newShapes)
      editor.setSelectedShapes(newShapes.map((s: any) => s.id))

    } catch (e) {
      console.error('Failed to paste annotations', e)
    }
  }

  const [duplicateCount, setDuplicateCount] = useState(0)

  const handleDuplicateAnnotations = () => {
    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return

    // Calculate common bounding box
    const selectionBounds = editor.getSelectionRotatedPageBounds()
    if (!selectionBounds) return

    const viewportCenter = editor.getViewportScreenCenter()
    
    // Offset each duplicate slightly to avoid perfect overlap if clicked multiple times
    const stackOffset = duplicateCount * 10
    setDuplicateCount(prev => prev + 1)

    const offsetX = viewportCenter.x - selectionBounds.center.x + stackOffset
    const offsetY = viewportCenter.y - selectionBounds.center.y + stackOffset

    const newShapes = selectedShapes.map((s: any) => {
      const { id: _id, parentId: _parentId, ...rest } = s
      return {
        ...rest,
        id: createShapeId(),
        parentId: editor.getCurrentPageId(),
        x: s.x + offsetX,
        y: s.y + offsetY,
      }
    })

    editor.createShapes(newShapes)
    editor.setSelectedShapes(newShapes.map((s: any) => s.id))
  }

  return (
    <>
      {/* Eraser cursor overlay for stroke/precision eraser */}
      <EraserCursorOverlay size={eraserSize} active={isCustomEraserActive} />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto">

        {/* Recent Colors Dots (Only visible if StylePanel is NOT visible AND enabled) */}
        {showRecentColors && !stylePanelVisible && recentColors.length > 0 && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1.5 p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {recentColors.map(color => {
              const theme = COLOR_THEMES[color]
              const isActive = currentColor === color
              return (
                <button
                  key={color}
                  onClick={() => handleRecentColorClick(color)}
                  className={`
                                w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm
                                ${theme?.bg.split(' ')[0]} 
                                ${isActive ? 'scale-125' : 'hover:scale-125'}
                                transition-all duration-200
                            `}
                  title={`Use ${color}`}
                />
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg rounded-t-2xl px-2 py-1.5 border border-gray-200/50 dark:border-gray-700/50 border-b-0">

          {/* Custom Annotation Copy/Paste - Exclusive Logic */}
          <div className="flex items-center gap-1 mr-1 relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowCopyPasteDropdown(!showCopyPasteDropdown)
                setDuplicateCount(0) // reset offset when opening
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              title="Copy / Paste"
            >
              <div className="flex items-center gap-1">
                <Layers size={18} />
                <ChevronDown size={12} />
              </div>
            </button>
            
            {showCopyPasteDropdown && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 flex flex-col gap-1 min-w-[140px] z-[99999]">
                {selectedShapeIds.length > 0 ? (
                  <>
                    <button
                      onClick={() => {
                        handleCopyAnnotations()
                        // No auto-close
                      }}
                      disabled={showCopyFeedback}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm text-gray-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      title="Copy Annotations"
                    >
                      <Copy size={16} />
                      {showCopyFeedback ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicateAnnotations()
                        // No auto-close
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm text-gray-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      title="Duplicate Selection"
                    >
                      <Layers size={16} />
                      Duplicate
                    </button>
                  </>
                ) : null}
                <button
                  onClick={() => {
                    handlePasteAnnotations()
                    // No auto-close
                  }}
                  disabled={!hasClipboardContent}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${hasClipboardContent ? 'text-gray-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-700' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
                  title={hasClipboardContent ? "Paste Annotations" : "Clipboard Empty"}
                >
                  <Clipboard size={16} />
                  Paste
                </button>
                <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <button
                  onClick={() => {
                    if (onAddPage) onAddPage()
                    setShowCopyPasteDropdown(false) // Still close on major action like Add Page
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm text-gray-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Add New Page"
                >
                  <Plus size={16} />
                  Add Page
                </button>
              </div>
            )}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          </div>

          {/* Select Group Button (Select / Lasso / Hand / Lock) */}
          <SelectGroupButton
            activeTool={activeTool}
            onSelect={selectTool}
            activeTheme={activeColorTheme}
            isCameraLocked={isCameraLocked}
            onToggleLock={() => window.dispatchEvent(new CustomEvent('request-toggle-page-lock'))}
          />

          {/* Undo & Redo */}
          <button
            onClick={() => editor.undo()}
            disabled={!canUndo}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ${canUndo ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200' : 'text-gray-300 cursor-not-allowed dark:text-gray-600'}`}
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={() => editor.redo()}
            disabled={!canRedo}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ${canRedo ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200' : 'text-gray-300 cursor-not-allowed dark:text-gray-600'}`}
            title="Redo"
          >
            <Redo2 size={18} />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Palette toggle */}
          <div ref={paletteButtonRef} className="flex">
            <PaletteButton
              isVisible={stylePanelVisible}
              onToggle={() => setStylePanelVisible((v) => !v)}
              activeTheme={activeColorTheme}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Pen group (pen / highlighter / laser) */}
          <PenGroupButton activeTool={activeTool} onSelect={selectTool} activeTheme={activeColorTheme} editor={editor} />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Eraser group (shape eraser + size) */}
          <EraserGroupButton
            activeTool={activeTool}
            eraserMode={eraserMode}
            eraserSize={eraserSize}
            onSelectTool={handleEraserSelect}
            onSelectMode={handleEraserModeChange}
            onSelectSize={(s) => {
              setEraserSize(s)
              currentEraserSizeSignal.set(s)
            }}
            onClearPage={handleClearPage}
            activeTheme={activeColorTheme}
          />

          {/* Shapes group (arrow, rectangle, ellipse, triangle, etc.) */}
          <ShapeGroupButton activeTool={activeTool} editor={editor} activeTheme={activeColorTheme} />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* More options */}
          <MoreOptionsButton activeTool={activeTool} onSelect={selectTool} onAction={handleAction} activeTheme={activeColorTheme} onImageClick={onImageClick} />
        </div>

        {/* Custom Style Panel */}
        <div ref={stylePanelRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2">
          <StylePanel isVisible={stylePanelVisible} />
        </div>
      </div>
    </>
  )
}
