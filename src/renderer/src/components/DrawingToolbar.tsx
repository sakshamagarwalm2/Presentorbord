import { useEditor, useValue } from '@tldraw/tldraw'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MousePointer2,
  Hand,
  Palette,
  Pen,
  Eraser,
  ArrowUpRight,
  Square,
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
} from 'lucide-react'

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
          ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
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
              ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
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
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 border-gray-200'
            }
          `}
          title="More drawing tools"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Flyout */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex flex-col gap-1 min-w-[140px] z-[99999]">
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
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
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
            ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }
        `}
        title="More tools"
      >
        <ChevronUp size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex flex-col gap-1 min-w-[150px] z-[99999]">
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
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <TIcon size={16} />
                {tool.label}
              </button>
            )
          })}

          {/* Divider */}
          <div className="h-px bg-gray-200 my-0.5" />

          {/* Action items */}
          <button
            onClick={() => { onAction('delete'); setIsOpen(false) }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => { onAction('duplicate'); setIsOpen(false) }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm text-gray-600 hover:bg-gray-50"
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
          ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }
      `}
      title={isVisible ? 'Hide Styles' : 'Show Styles'}
    >
      <Palette size={20} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main DrawingToolbar                                                */
/* ------------------------------------------------------------------ */

export function DrawingToolbar() {
  const editor = useEditor()
  const activeTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])
  const [stylePanelVisible, setStylePanelVisible] = useState(false)

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

  const canUndo = useValue('canUndo', () => editor.getCanUndo(), [editor])
  const canRedo = useValue('canRedo', () => editor.getCanRedo(), [editor])

  const SIMPLE_TOOLS: ToolDef[] = [
    { id: 'select', label: 'Select', icon: MousePointer2 },
    { id: 'hand', label: 'Hand', icon: Hand },
  ]

  const RIGHT_TOOLS: ToolDef[] = [
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'arrow', label: 'Arrow', icon: ArrowUpRight },
    { id: 'geo', label: 'Rectangle', icon: Square },
  ]

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto pb-2">
      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xl shadow-lg rounded-2xl px-2 py-1.5 border border-gray-200/50">
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
        <div className="w-px h-6 bg-gray-200 mx-0.5" />

        {/* Undo & Redo */}
        <button
          onClick={() => editor.undo()}
          disabled={!canUndo}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ${canUndo ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={() => editor.redo()}
          disabled={!canRedo}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ${canRedo ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
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

        {/* Eraser, Arrow, Rectangle */}
        {RIGHT_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => selectTool(tool.id)}
          />
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-0.5" />

        {/* More options */}
        <MoreOptionsButton activeTool={activeTool} onSelect={selectTool} onAction={handleAction} />
      </div>
    </div>
  )
}
