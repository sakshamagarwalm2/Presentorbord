import { useEditor, useValue, createShapeId, DefaultColorStyle, DefaultSizeStyle, DefaultFillStyle } from '@tldraw/tldraw'
import { Copy, Layers, Trash2, Check, Scissors, Maximize2, PaintBucket } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { currentCustomColorSignal } from '../store/styleSignals'
import { COLOR_MAP } from '../constants/colorConstants'
import { getNearestNamedColor } from '../utils/colorUtils'

const SIZES = [
  { label: 'XS', value: 2, tldrawSize: 's' },
  { label: 'S', value: 4, tldrawSize: 's' },
  { label: 'M', value: 8, tldrawSize: 'm' },
  { label: 'L', value: 16, tldrawSize: 'l' },
  { label: 'XL', value: 32, tldrawSize: 'xl' },
]

const FILL_MODES = [
  { id: 'none', label: 'None' },
  { id: 'semi', label: 'Translucent' },
  { id: 'solid', label: 'Solid' },
  { id: 'pattern', label: 'Dotted' },
]

export function SelectionBoxIcons() {
  const editor = useEditor()
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)
  const [showSizeOptions, setShowSizeOptions] = useState(false)
  const [showFillOptions, setShowFillOptions] = useState(false)
  const [recentColors, setRecentColors] = useState<Array<{ key: string; hex: string }>>([])
  const sizeMenuRef = useRef<HTMLDivElement>(null)
  const fillMenuRef = useRef<HTMLDivElement>(null)
  
  // Track selection bounds and rotation
  const selectionBounds = useValue('selection bounds', () => editor.getSelectionRotatedPageBounds(), [editor])
  
  // Hide while dragging, resizing, or if nothing is selected
  const isChanging = useValue('is changing', () => 
    editor.getInstanceState().isChangingIncremental || 
    editor.getInstanceState().isDragging ||
    editor.getInstanceState().isEditingPath ||
    editor.getInstanceState().isPointing
  , [editor])

  const currentToolId = useValue('current tool', () => editor.getCurrentToolId(), [editor])
  const selectedIds = useValue('selected ids', () => editor.getSelectedShapeIds(), [editor])
  
  // Check if any selected shape supports fill (mostly 'geo' shapes)
  const supportsFill = useValue('supports fill', () => {
    return editor.getSelectedShapes().some(s => s.type === 'geo' || s.type === 'arrow')
  }, [editor])

  // Close options on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) {
        setShowSizeOptions(false)
      }
      if (fillMenuRef.current && !fillMenuRef.current.contains(e.target as Node)) {
        setShowFillOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load recent colors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-colors')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setRecentColors(parsed.slice(0, 3))
        }
      } catch (e) {
        console.error('Failed to parse recent colors', e)
      }
    }
  }, [selectedIds])

  // Reset feedback when selection changes or starts moving
  useEffect(() => {
    if (isChanging) {
      setShowCopyFeedback(false)
      setShowSizeOptions(false)
      setShowFillOptions(false)
    }
  }, [isChanging, selectedIds])

  if (!selectionBounds || selectedIds.length === 0 || isChanging || !['select', 'lasso'].includes(currentToolId)) {
    return null
  }

  // Convert page bounds to screen bounds
  const topLeft = editor.pageToViewport({ x: selectionBounds.minX, y: selectionBounds.minY })
  const bottomRight = editor.pageToViewport({ x: selectionBounds.maxX, y: selectionBounds.maxY })
  
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const padding = 12
  const menuWidth = 42
  const menuHeight = recentColors.length > 0 ? 350 : 280

  // Calculate position with viewport clamping
  let top = Math.max(padding, Math.min(topLeft.y, viewportHeight - menuHeight - padding))
  let left = bottomRight.x + 8
  if (left + menuWidth > viewportWidth - padding) {
    left = viewportWidth - menuWidth - padding
  }
  left = Math.max(padding, left)

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return
    
    const annotations = selectedShapes.filter((s: any) => s.type !== "image")
    localStorage.setItem("annotation-clipboard", JSON.stringify(annotations))
    window.dispatchEvent(new Event('storage'))
    
    setShowCopyFeedback(true)
    setTimeout(() => setShowCopyFeedback(false), 2000)
  }

  const handleCut = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleCopy()
    editor.deleteShapes(editor.getSelectedShapeIds())
  }
  
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return

    const offset = 10
    const newShapes = selectedShapes.map((s: any) => {
      const { id: _id, parentId: _parentId, ...rest } = s
      return {
        ...rest,
        id: createShapeId(),
        parentId: editor.getCurrentPageId(),
        x: s.x + offset,
        y: s.y + offset,
      }
    })

    editor.createShapes(newShapes)
    editor.setSelectedShapes(newShapes.map((s: any) => s.id))
  }
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    editor.deleteShapes(editor.getSelectedShapeIds())
  }

  const handleColorClick = (colorKey: string, hex: string) => {
    console.log(`[SelectionBoxIcons] Color Selected: Key=${colorKey}, Hex=${hex}`)
    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return

    const bestNamedKey = getNearestNamedColor(hex)

    editor.run(() => {
      // 1. Update Standard Styles
      editor.setStyleForSelectedShapes(DefaultColorStyle, bestNamedKey as any)
      editor.setStyleForNextShapes(DefaultColorStyle, bestNamedKey as any)

      // 2. Update props.color for custom shapes or hex-compatible shapes
      const updates = selectedShapes.map(s => {
        const shapeUpdates: any = { id: s.id, type: s.type, props: { ...s.props } }
        let hasPropsUpdate = false

        const supportsHex = [
          'super-pen', 'custom-draw', 'custom-line', 'custom-arrow', 'graph-axes-1', 'graph-axes-4'
        ].includes(s.type)

        if (supportsHex) {
          shapeUpdates.props.color = hex
          hasPropsUpdate = true
        } else if ('color' in s.props) {
          shapeUpdates.props.color = bestNamedKey
          hasPropsUpdate = true
        }

        return hasPropsUpdate ? shapeUpdates : null
      }).filter(Boolean)

      if (updates.length > 0) {
        editor.updateShapes(updates as any)
      }

      currentCustomColorSignal.set(hex)
    })
  }

  const handleSizeChange = (size: typeof SIZES[0]) => {
    const selected = editor.getSelectedShapes()
    if (selected.length === 0) return

    editor.run(() => {
      // 1. Update the style for FUTURE shapes
      editor.setStyleForNextShapes(DefaultSizeStyle, size.tldrawSize as any)

      // 2. Build targeted updates for SELECTED shapes
      const updates = selected.map(s => {
        const shapeUpdates: any = { 
          id: s.id, 
          type: s.type, 
          meta: { ...s.meta, thickness: size.value } 
        }

        const supportsTldrawSize = [
          'draw', 'geo', 'line', 'arrow', 'text', 'note', 'frame', 'highlight', 'video', 'custom-draw'
        ].includes(s.type)
        
        const isSuperPen = s.type === 'super-pen'
        const shouldNotHaveSize = ['custom-arrow', 'custom-line', 'graph-axes-1', 'graph-axes-4', 'protractor', 'ruler'].includes(s.type)

        if (supportsTldrawSize && 'size' in s.props) {
          shapeUpdates.props = { ...s.props, size: size.tldrawSize }
        } else if (isSuperPen) {
          shapeUpdates.props = { ...s.props, size: size.value }
        } else if (shouldNotHaveSize && 'size' in s.props) {
          // CLEANUP: Strip illegal size property if it exists from previous bugs
          const { size: _, ...cleanProps } = s.props as any
          shapeUpdates.props = cleanProps
        }

        return shapeUpdates
      })

      if (updates.length > 0) {
        editor.updateShapes(updates as any)
      }
    })
    setShowSizeOptions(false)
  }

  const handleFillChange = (fill: string) => {
    const customHex = currentCustomColorSignal.get()
    const bestNamedKey = getNearestNamedColor(customHex || '#000000')

    console.log(`[SelectionBoxIcons] Fill Mode Selection:`, {
      selectedMode: fill,
      activeCustomHex: customHex,
      mappedNamedKey: bestNamedKey
    })

    editor.run(() => {
      // We use 'solid' for the user's 'semi' to get the same color feel but with shape opacity
      const tldrawFillStyle = (fill === 'semi' || fill === 'solid') ? 'solid' : fill

      editor.setStyleForSelectedShapes(DefaultFillStyle, tldrawFillStyle as any)
      editor.setStyleForNextShapes(DefaultFillStyle, tldrawFillStyle as any)

      const selected = editor.getSelectedShapes()
      const updates = selected.map(s => {
        if (!['geo', 'arrow'].includes(s.type)) return null
        
        const shapeUpdates: any = { 
          id: s.id, 
          type: s.type, 
          props: { ...s.props, fill: tldrawFillStyle } 
        }

        const isNative = ['geo', 'arrow'].includes(s.type)
        const finalColor = isNative ? bestNamedKey : (customHex || bestNamedKey)
        shapeUpdates.props.color = finalColor

        // Apply 80% opacity for semi mode, 100% for others
        const finalOpacity = fill === 'semi' ? 0.8 : 1.0
        shapeUpdates.opacity = finalOpacity

        console.log(`[SelectionBoxIcons] Updating Shape Fill:`, {
          shapeId: s.id,
          shapeType: s.type,
          fillMode: fill,
          tldrawFillStyle,
          appliedColor: finalColor,
          appliedOpacity: finalOpacity
        })

        return shapeUpdates
      }).filter(Boolean)

      if (updates.length > 0) {
        editor.updateShapes(updates as any)
      }
    })
    setShowFillOptions(false)
  }

  return (
    <div 
      className="fixed z-[100000] flex flex-col gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
      style={{
        top: top,
        left: left,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button 
        onClick={handleCopy} 
        className={`p-2 rounded-lg transition-all duration-200 w-full flex items-center justify-center ${
          showCopyFeedback 
            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
        }`}
        title="Copy"
      >
        {showCopyFeedback ? <Check size={18} className="animate-in zoom-in duration-200" /> : <Copy size={18} />}
      </button>

      <button 
        onClick={handleCut} 
        className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg text-gray-500 dark:text-gray-400 transition-all duration-200" 
        title="Cut"
      >
        <Scissors size={18} />
      </button>

      <button 
        onClick={handleDuplicate} 
        className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg text-gray-500 dark:text-gray-400 transition-all duration-200" 
        title="Duplicate"
      >
        <Layers size={18} />
      </button>

      <div className="relative" ref={sizeMenuRef}>
        <button 
          onClick={() => setShowSizeOptions(!showSizeOptions)} 
          className={`p-2 rounded-lg transition-all duration-200 w-full flex items-center justify-center ${
            showSizeOptions
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
          }`}
          title="Change Size"
        >
          <Maximize2 size={18} />
        </button>

        {showSizeOptions && (
          <div className="absolute left-full ml-2 top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-1 min-w-[40px] animate-in fade-in slide-in-from-left-2 duration-200">
            {SIZES.map((size) => (
              <button
                key={size.label}
                onClick={() => handleSizeChange(size)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all"
              >
                {size.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {supportsFill && (
        <div className="relative" ref={fillMenuRef}>
          <button 
            onClick={() => setShowFillOptions(!showFillOptions)} 
            className={`p-2 rounded-lg transition-all duration-200 w-full flex items-center justify-center ${
              showFillOptions
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
            }`}
            title="Change Fill"
          >
            <PaintBucket size={18} />
          </button>

          {showFillOptions && (
            <div className="absolute left-full ml-2 top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-1 min-w-[100px] animate-in fade-in slide-in-from-left-2 duration-200">
              {FILL_MODES.map((fill) => (
                <button
                  key={fill.id}
                  onClick={() => handleFillChange(fill.id)}
                  className="px-3 py-2 flex items-center gap-2 rounded-lg text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all text-left"
                >
                  <div className={`w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600 ${
                    fill.id === 'solid' ? 'bg-current opacity-100' :
                    fill.id === 'semi' ? 'bg-current opacity-50' :
                    fill.id === 'pattern' ? 'bg-current opacity-20' : 'bg-transparent'
                  }`} />
                  {fill.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mx-1 h-px bg-gray-200 dark:bg-gray-800 my-0.5" />
      
      <button 
        onClick={handleDelete} 
        className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg text-gray-500 dark:text-gray-400 transition-all duration-200" 
        title="Delete"
      >
        <Trash2 size={18} />
      </button>

      {recentColors.length > 0 && (
        <>
          <div className="mx-1 h-px bg-gray-200 dark:bg-gray-800 my-0.5" />
          <div className="flex flex-col gap-1.5 p-1 items-center">
            {recentColors.map((color, i) => (
              <button
                key={`${color.hex}-${i}`}
                onClick={() => handleColorClick(color.key, color.hex)}
                className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm hover:scale-125 transition-transform duration-200"
                style={{ backgroundColor: color.hex }}
                title={`Apply ${color.hex}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
