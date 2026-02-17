import { useEditor, useValue, GeoShapeGeoStyle, DefaultColorStyle } from '@tldraw/tldraw'
import { useState, useRef, useEffect } from 'react'
import {
  MousePointer2,
  Hand,
  Palette,
  Pen,
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
  Highlighter,
  Pointer,
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
  Scissors,
} from 'lucide-react'
import { useStrokeEraser } from '../tools/useStrokeEraser'
import { usePalmEraser } from '../tools/usePalmEraser'
import { StylePanel } from './StylePanel'

/* ------------------------------------------------------------------ */
/*  Color Themes                                                       */
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

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

interface ToolDef {
  id: string
  label: string
  icon: React.FC<any>
}

const PEN_GROUP: ToolDef[] = [
  { id: 'draw', label: 'Pen', icon: Pen },
  { id: 'highlight', label: 'Highlighter', icon: Highlighter },
  { id: 'custom-laser', label: 'Laser', icon: Pointer },
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
/*  Single toolbar button                                              */
/* ------------------------------------------------------------------ */

function ToolButton({
  tool,
  isActive,
  onClick,
  activeTheme,
}: {
  tool: ToolDef
  isActive: boolean
  onClick: () => void
  activeTheme?: ColorTheme
}) {
  const Icon = tool.icon
  const theme = activeTheme || COLOR_THEMES['blue']
  
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-10 h-10 rounded-xl transition-all duration-150
        ${isActive
          ? `${theme.bg} shadow-md ${theme.shadow}`
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
        }
      `}
      title={tool.label}
    >
      <Icon size={20} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Pen group button with flyout                                       */
/* ------------------------------------------------------------------ */

function PenGroupButton({
  activeTool,
  onSelect,
  activeTheme,
}: {
  activeTool: string
  onSelect: (toolId: string) => void
  activeTheme?: ColorTheme
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
    const match = PEN_GROUP.find((t) => t.id === activeTool)
    if (match) setSelectedTool(match)
  }, [activeTool])

  const isGroupActive = PEN_GROUP.some((t) => t.id === activeTool)
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
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
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
  eraserMode: 'shape' | 'stroke'
  eraserSize: number
  onSelectTool: () => void
  onSelectMode: (mode: 'shape' | 'stroke') => void
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

  const isActive = activeTool === 'eraser' || activeTool === 'stroke-eraser'
  const ActiveIcon = eraserMode === 'shape' ? Eraser : Scissors

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
          title={eraserMode === 'shape' ? 'Shape Eraser' : 'Stroke Eraser'}
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
              flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
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
              onSelectMode('stroke')
              setIsOpen(false)
            }}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
              ${eraserMode === 'stroke'
                ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
          >
            <Scissors size={16} />
            Stroke Eraser
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
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
  const [selectedShape, setSelectedShape] = useState<ShapeDef>(SHAPE_GROUP[1]) // default: Rectangle
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
    if (activeTool === 'arrow') {
      const arrow = SHAPE_GROUP.find((s) => s.id === 'arrow')
      if (arrow) setSelectedShape(arrow)
    }
    // For geo, we keep the last selected geo shape
  }, [activeTool])

  const isGroupActive = activeTool === 'arrow' || activeTool === 'geo'
  const Icon = selectedShape.icon

  const handleSelect = (shape: ShapeDef) => {
    setSelectedShape(shape)
    if (shape.id === 'geo' && shape.geoType) {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, shape.geoType as any)
      editor.setCurrentTool('geo')
    } else {
      editor.setCurrentTool(shape.id)
    }
    setIsOpen(false)
  }

  const handleMainClick = () => {
    if (selectedShape.id === 'geo' && selectedShape.geoType) {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, selectedShape.geoType as any)
      editor.setCurrentTool('geo')
    } else {
      editor.setCurrentTool(selectedShape.id)
    }
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
                (shape.id === 'arrow' && activeTool === 'arrow') ||
                (shape.id === 'geo' && activeTool === 'geo' && selectedShape.geoType === shape.geoType)
              return (
                <button
                  key={`${shape.id}-${shape.geoType ?? idx}`}
                  onClick={() => handleSelect(shape)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
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
}: {
  activeTool: string
  onSelect: (toolId: string) => void
  onAction: (action: string) => void
  activeTheme?: ColorTheme
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
                  onSelect(tool.id)
                  setIsOpen(false)
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => { onAction('duplicate'); setIsOpen(false) }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Copy size={16} />
            Duplicate
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

export function DrawingToolbar({ showRecentColors = true }: { showRecentColors?: boolean }) {
  const editor = useEditor()
  const activeTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])
  const currentColor = useValue('current color', () => {
    const shared = editor.getSharedStyles().get(DefaultColorStyle)
    if (shared && shared.type === 'shared') return shared.value
    return editor.getStyleForNextShape(DefaultColorStyle)
  }, [editor])
  const activeColorTheme = COLOR_THEMES[currentColor] || COLOR_THEMES['blue']

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
  const [eraserMode, setEraserMode] = useState<'shape' | 'stroke'>('shape')
  const [eraserSize, setEraserSize] = useState(12)

  // Determine if stroke eraser is currently active
  const isStrokeEraserActive = eraserMode === 'stroke' && activeTool === 'eraser'

  // Activate stroke eraser hook
  useStrokeEraser(editor, isStrokeEraserActive, eraserSize)

  // Activate palm eraser hook (always enabled)
  usePalmEraser(editor, true, eraserSize)

  const selectTools = (toolId: string) => {
    editor.setCurrentTool(toolId)
  }

  const selectTool = (toolId: string) => {
    editor.setCurrentTool(toolId)
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'delete':
        editor.deleteShapes(editor.getSelectedShapeIds())
        break
      case 'duplicate':
        editor.duplicateShapes(editor.getSelectedShapeIds())
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
    // Always use tldraw's eraser tool; the stroke eraser hooks into it
    editor.setCurrentTool('eraser')
  }

  const handleEraserModeChange = (mode: 'shape' | 'stroke') => {
    setEraserMode(mode)
    editor.setCurrentTool('eraser')
  }

  const canUndo = useValue('canUndo', () => editor.getCanUndo(), [editor])
  const canRedo = useValue('canRedo', () => editor.getCanRedo(), [editor])

  const SIMPLE_TOOLS: ToolDef[] = [
    { id: 'select', label: 'Select', icon: MousePointer2 },
    { id: 'hand', label: 'Hand', icon: Hand },
  ]

  // Recent Colors State
  const [recentColors, setRecentColors] = useState<string[]>(['black', 'red', 'blue'])

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
      // If we have selected shapes, update them too
      const selectedShapeIds = editor.getSelectedShapeIds()
      if (selectedShapeIds.length > 0) {
          // @ts-ignore
          editor.setStyleForSelectedShapes(DefaultColorStyle, color)
      }
  }

  return (
    <>
      {/* Eraser cursor overlay for stroke eraser */}
      <EraserCursorOverlay size={eraserSize} active={isStrokeEraserActive} />

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
          {/* Select & Hand */}
          {SIMPLE_TOOLS.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => selectTool(tool.id)}
              activeTheme={activeColorTheme}
            />
          ))}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5" />

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
          <PenGroupButton activeTool={activeTool} onSelect={selectTool} activeTheme={activeColorTheme} />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Eraser group (shape eraser / stroke eraser + size) */}
          <EraserGroupButton
            activeTool={activeTool}
            eraserMode={eraserMode}
            eraserSize={eraserSize}
            onSelectTool={handleEraserSelect}
            onSelectMode={handleEraserModeChange}
            onSelectSize={setEraserSize}
            onClearPage={handleClearPage}
            activeTheme={activeColorTheme}
          />

          {/* Shapes group (arrow, rectangle, ellipse, triangle, etc.) */}
          <ShapeGroupButton activeTool={activeTool} editor={editor} activeTheme={activeColorTheme} />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* More options */}
          <MoreOptionsButton activeTool={activeTool} onSelect={selectTool} onAction={handleAction} activeTheme={activeColorTheme} />
        </div>

        {/* Custom Style Panel */}
        <div ref={stylePanelRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2">
            <StylePanel isVisible={stylePanelVisible} />
        </div>
      </div>
    </>
  )
}
