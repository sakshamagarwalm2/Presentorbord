import { useEditor, useValue, createShapeId, DefaultColorStyle } from '@tldraw/tldraw'
import { Copy, Layers, Trash2, Check, Scissors } from 'lucide-react'
import { useState, useEffect } from 'react'

export function SelectionBoxIcons() {
  const editor = useEditor()
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)
  const [recentColors, setRecentColors] = useState<Array<{ key: string; hex: string }>>([])
  
  // Track selection bounds and rotation
  const selectionBounds = useValue('selection bounds', () => editor.getSelectionRotatedPageBounds(), [editor])
  
  // Hide while dragging, resizing, or if nothing is selected
  const isChanging = useValue('is changing', () => 
    editor.getInstanceState().isChangingIncremental || 
    editor.getInstanceState().isDragging ||
    editor.getInstanceState().isEditingPath
  , [editor])

  const selectedIds = useValue('selected ids', () => editor.getSelectedShapeIds(), [editor])

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
  }, [selectedIds]) // Re-load when selection changes

  // Reset feedback when selection changes or starts moving
  useEffect(() => {
    if (isChanging) setShowCopyFeedback(false)
  }, [isChanging, selectedIds])

  if (!selectionBounds || selectedIds.length === 0 || isChanging) {
    return null
  }

  // Convert page bounds to screen bounds
  const topRight = editor.pageToViewport({ x: selectionBounds.maxX, y: selectionBounds.minY })
  
  // Calculate position: Top-right corner edge
  const top = topRight.y
  const left = topRight.x + 8

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return
    
    const annotations = selectedShapes.filter((s: any) => s.type !== "image")
    localStorage.setItem("annotation-clipboard", JSON.stringify(annotations))
    
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
    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return

    editor.run(() => {
      // 1. Update Standard Shapes
      // @ts-ignore
      editor.setStyleForSelectedShapes(DefaultColorStyle, colorKey)

      // 2. Update Custom Shapes (Super Pen, etc)
      const shapesToUpdate = selectedShapes.filter(s => s.type === 'super-pen' || s.type === 'custom-draw')
      if (shapesToUpdate.length > 0) {
        editor.updateShapes(shapesToUpdate.map(s => {
          if (s.type === 'super-pen') {
            return {
              id: s.id,
              type: 'super-pen',
              props: { ...(s as any).props, color: hex }
            }
          }
          return {
            id: s.id,
            type: 'custom-draw',
            props: { ...(s as any).props, color: hex } // CustomDraw uses color hex usually
          }
        }))
      }
    })
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
                className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: color.hex }}
                title={`Apply ${color.key} color`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
