import { useEditor, useValue, GeoShapeGeoStyle } from '@tldraw/tldraw'
import { useState, useRef, useEffect, useCallback } from 'react'
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
  { id: 'laser', label: 'Laser', icon: Pointer },
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
}: {
  tool: ToolDef
  isActive: boolean
  onClick: () => void
}) {
  const Icon = tool.icon
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-10 h-10 rounded-xl transition-all duration-150
        ${isActive
          ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
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
}: {
  activeTool: string
  onSelect: (toolId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolDef>(PEN_GROUP[0])
  const flyoutRef = useRef<HTMLDivElement>(null)

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
              ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
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
              ? 'bg-blue-500 text-white border-blue-400'
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
}: {
  activeTool: string
  eraserMode: 'shape' | 'stroke'
  eraserSize: number
  onSelectTool: () => void
  onSelectMode: (mode: 'shape' | 'stroke') => void
  onSelectSize: (size: number) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const flyoutRef = useRef<HTMLDivElement>(null)

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
              ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
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
              ? 'bg-blue-500 text-white border-blue-400'
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
}: {
  activeTool: string
  editor: ReturnType<typeof useEditor>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedShape, setSelectedShape] = useState<ShapeDef>(SHAPE_GROUP[1]) // default: Rectangle
  const flyoutRef = useRef<HTMLDivElement>(null)

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
              ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
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
              ? 'bg-blue-500 text-white border-blue-400'
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
}: {
  activeTool: string
  onSelect: (toolId: string) => void
  onAction: (action: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const flyoutRef = useRef<HTMLDivElement>(null)

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
            ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
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
}: {
  isVisible: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative flex flex-col items-center justify-center
        w-10 h-10 rounded-xl transition-all duration-150
        ${isVisible
          ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
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

export function DrawingToolbar() {
  const editor = useEditor()
  const activeTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])
  const [stylePanelVisible, setStylePanelVisible] = useState(false)

  // Eraser state
  const [eraserMode, setEraserMode] = useState<'shape' | 'stroke'>('shape')
  const [eraserSize, setEraserSize] = useState(12)

  // Determine if stroke eraser is currently active
  const isStrokeEraserActive = eraserMode === 'stroke' && activeTool === 'eraser'

  // Activate stroke eraser hook
  useStrokeEraser(editor, isStrokeEraserActive, eraserSize)

  // Activate palm eraser hook (always enabled)
  usePalmEraser(editor, true, eraserSize)

  // Manage style panel visibility via injected CSS
  const updateStylePanel = useCallback((visible: boolean) => {
    let styleEl = document.getElementById('style-panel-toggle-css')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'style-panel-toggle-css'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = `
      .tlui-layout__top__right {
        ${visible ? '' : 'display: none !important;'}
        opacity: ${visible ? '1' : '0'} !important;
        transform: translateX(50%) ${visible ? 'translateY(0)' : 'translateY(16px)'} !important;
      }
    `
  }, [])

  useEffect(() => {
    updateStylePanel(stylePanelVisible)
  }, [stylePanelVisible, updateStylePanel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.getElementById('style-panel-toggle-css')?.remove()
    }
  }, [])

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

  return (
    <>
      {/* Eraser cursor overlay for stroke eraser */}
      <EraserCursorOverlay size={eraserSize} active={isStrokeEraserActive} />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto pb-2">
        <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg rounded-2xl px-2 py-1.5 border border-gray-200/50 dark:border-gray-700/50">
          {/* Select & Hand */}
          {SIMPLE_TOOLS.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => selectTool(tool.id)}
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
          <PaletteButton
            isVisible={stylePanelVisible}
            onToggle={() => setStylePanelVisible((v) => !v)}
          />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Pen group (pen / highlighter / laser) */}
          <PenGroupButton activeTool={activeTool} onSelect={selectTool} />

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
          />

          {/* Shapes group (arrow, rectangle, ellipse, triangle, etc.) */}
          <ShapeGroupButton activeTool={activeTool} editor={editor} />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* More options */}
          <MoreOptionsButton activeTool={activeTool} onSelect={selectTool} onAction={handleAction} />
        </div>
      </div>
    </>
  )
}
