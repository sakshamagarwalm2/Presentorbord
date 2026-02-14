
import { useEditor, useValue, PageRecordType, createShapeId } from '@tldraw/tldraw'
import { Plus, Trash2, Download, ChevronRight, ChevronLeft, GripVertical, Copy } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'

// Global thumbnail cache so it persists across re-renders
const thumbnailCache: Record<string, string> = {}

export function Sidebar() {
    const editor = useEditor()
    const pages = useValue('pages', () => editor.getPages(), [editor])
    const currentPageId = useValue('currentPageId', () => editor.getCurrentPageId(), [editor])
    const [isOpen, setIsOpen] = useState(false)
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
    const [, forceUpdate] = useState(0)

    const sortedPages = pages.sort((a, b) => (a.index > b.index ? 1 : -1))

    // Capture thumbnail of current page's content
    const captureThumbnail = useCallback(async () => {
        try {
            const pageId = editor.getCurrentPageId()
            const shapeIds = Array.from(editor.getCurrentPageShapeIds())
            if (shapeIds.length === 0) {
                delete thumbnailCache[pageId]
                forceUpdate(n => n + 1)
                return
            }
            const svg = await editor.getSvg(shapeIds)
            if (!svg) return

            const svgString = new XMLSerializer().serializeToString(svg)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                const maxW = 400
                const scale = Math.min(maxW / img.width, 1)
                canvas.width = img.width * scale
                canvas.height = img.height * scale
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
                thumbnailCache[pageId] = canvas.toDataURL('image/png')
                forceUpdate(n => n + 1)
            }
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
        } catch (_e) {
            // Silently fail
        }
    }, [editor])

    // Capture thumbnail periodically for current page
    useEffect(() => {
        captureThumbnail()
        const interval = setInterval(captureThumbnail, 3000)
        return () => clearInterval(interval)
    }, [captureThumbnail, currentPageId])

    const addPage = () => {
        captureThumbnail()
        const newPageId = PageRecordType.createId()

        // Calculate index to insert after current page
        const currentIndex = sortedPages.findIndex(p => p.id === currentPageId)
        let newIndex: string
        if (currentIndex >= 0 && currentIndex < sortedPages.length - 1) {
            // Insert between current and next page
            const curr = sortedPages[currentIndex].index
            const next = sortedPages[currentIndex + 1].index
            newIndex = curr.slice(0, -1) + String.fromCharCode(curr.charCodeAt(curr.length - 1) + 1)
            // Use a midpoint string if possible
            if (newIndex >= next) {
                newIndex = curr + 'V'
            }
        } else {
            // Append at end
            const last = sortedPages[sortedPages.length - 1]?.index || 'a0'
            newIndex = last + 'V'
        }

        editor.createPage({
            id: newPageId,
            name: `Page ${pages.length + 1}`,
            index: newIndex as any
        })
        editor.setCurrentPage(newPageId)
        requestAnimationFrame(() => editor.zoomToFit())
    }

    const deletePage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (pages.length <= 1) return
        const pageId = id as any
        editor.deletePage(pageId)
        delete thumbnailCache[id]
    }

    const deleteCurrentPage = () => {
        if (pages.length <= 1) return
        editor.deletePage(currentPageId)
        delete thumbnailCache[currentPageId]
    }

    const duplicatePage = async () => {
        captureThumbnail()

        // Gather shapes and their data before switching pages
        const shapeIds = Array.from(editor.getCurrentPageShapeIds())
        const shapeData = shapeIds.map(id => editor.getShape(id)).filter(Boolean)

        const newPageId = PageRecordType.createId()

        // Calculate index to insert right after current page
        const currentIdx = sortedPages.findIndex(p => p.id === currentPageId)
        let newIndex: string
        if (currentIdx >= 0 && currentIdx < sortedPages.length - 1) {
            // Append 'V' to current index to place between current and next
            newIndex = sortedPages[currentIdx].index + 'V'
        } else {
            const last = sortedPages[sortedPages.length - 1]?.index || 'a0'
            newIndex = last + 'V'
        }

        editor.createPage({
            id: newPageId,
            name: `Page ${pages.length + 1}`,
            index: newIndex as any,
        })

        editor.setCurrentPage(newPageId)

        // Recreate each shape on the new page with a fresh ID
        for (const shape of shapeData) {
            if (!shape) continue
            const { id: _oldId, parentId: _oldParent, ...rest } = shape as any
            editor.createShape({
                ...rest,
                id: createShapeId(),
                parentId: newPageId as any,
            })
        }

        requestAnimationFrame(() => {
            const bounds = editor.getCurrentPageBounds()
            if (bounds) {
                editor.zoomToBounds(bounds, { inset: 0 })
            } else {
                editor.zoomToFit()
            }
        })
    }

    const selectPage = (id: string) => {
        captureThumbnail() // capture current before switching
        const pageId = id as any
        editor.setCurrentPage(pageId)
        requestAnimationFrame(() => {
            const bounds = editor.getCurrentPageBounds()
            if (bounds) {
                editor.zoomToBounds(bounds, { inset: 0 })
            } else {
                editor.zoomToFit()
            }
        })
    }

    const handleDrop = useCallback((fromId: string, toIndex: number) => {
        const fromIndex = sortedPages.findIndex(p => p.id === fromId)
        if (fromIndex === -1 || fromIndex === toIndex) return

        const movingPage = sortedPages[fromIndex]
        const reordered = [...sortedPages]
        reordered.splice(fromIndex, 1)
        reordered.splice(toIndex, 0, movingPage)

        for (let i = 0; i < reordered.length; i++) {
            const original = sortedPages[i]
            const moved = reordered[i]
            if (original.id !== moved.id) {
                editor.updatePage({ id: moved.id, index: original.index })
            }
        }
    }, [sortedPages, editor])

    const exportAllPages = async () => {
        if (!pages.length) return
        alert("Exporting all pages as PDF is a heavy operation. Implementing 'Export Current Page' for now.")

        const shapeIds = Array.from(editor.getCurrentPageShapeIds())
        if (shapeIds.length === 0) return

        try {
            const svg = await editor.getSvg(shapeIds)
            if (!svg) return

            const imageString = await new Promise<string>((resolve) => {
                const svgString = new XMLSerializer().serializeToString(svg)
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                const img = new Image()
                img.onload = () => {
                    canvas.width = img.width
                    canvas.height = img.height
                    ctx?.drawImage(img, 0, 0)
                    resolve(canvas.toDataURL('image/png'))
                }
                img.src = 'data:image/svg+xml;base64,' + btoa(svgString)
            })

            const downloadLink = document.createElement('a')
            downloadLink.href = imageString
            downloadLink.download = `page-${currentPageId}.png`
            downloadLink.click()

        } catch (e) {
            console.error(e)
            alert('Export failed')
        }
    }

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="absolute left-3 top-3 z-[99999] p-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all"
                    title="Expand Sidebar"
                >
                    <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
            )}

            <div className={`absolute top-0 left-0 bottom-0 z-[99998] transform transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-96 opacity-0 pointer-events-none'}`}>
                <div className="w-96 h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col">
                    <div className="px-3 py-2.5 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Pages</h2>
                        <div className="flex gap-1 items-center">
                             <button onClick={exportAllPages} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors" title="Export"><Download size={14} /></button>
                             <button onClick={addPage} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Add Page"><Plus size={14} /></button>
                             <button onClick={duplicatePage} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Duplicate Page"><Copy size={14} /></button>
                             <button onClick={deleteCurrentPage} disabled={pages.length <= 1} className={`p-1.5 rounded-lg transition-colors ${pages.length <= 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-red-50 text-red-500 dark:hover:bg-red-900/30'}`} title="Delete Page"><Trash2 size={14} /></button>
                             <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Collapse">
                                <ChevronLeft size={14} />
                             </button>
                        </div>
                    </div>

                    <div className="sidebar-pages flex-1 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {sortedPages.map((page, i) => (
                            <PageItem
                                key={page.id}
                                page={page}
                                isSelected={currentPageId === page.id}
                                onClick={() => selectPage(page.id)}
                                onDelete={deletePage}
                                index={i}
                                isDragging={draggedId === page.id}
                                isDropTarget={dropTargetIndex === i}
                                onDragStart={() => setDraggedId(page.id)}
                                onDragEnd={() => { setDraggedId(null); setDropTargetIndex(null) }}
                                onDragOver={(idx: number) => setDropTargetIndex(idx)}
                                onDrop={() => {
                                    if (draggedId && dropTargetIndex !== null) {
                                        handleDrop(draggedId, dropTargetIndex)
                                    }
                                    setDraggedId(null)
                                    setDropTargetIndex(null)
                                }}
                                cachedThumbnail={thumbnailCache[page.id] || null}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

function PageItem({
    page,
    isSelected,
    onClick,
    onDelete,
    index,
    isDragging,
    isDropTarget,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    cachedThumbnail,
}: {
    page: any,
    isSelected: boolean,
    onClick: () => void,
    onDelete: (id: string, e: React.MouseEvent) => void,
    index: number,
    isDragging: boolean,
    isDropTarget: boolean,
    onDragStart: () => void,
    onDragEnd: () => void,
    onDragOver: (index: number) => void,
    onDrop: () => void,
    cachedThumbnail: string | null,
}) {
    const editor = useEditor()
    const itemRef = useRef<HTMLDivElement>(null)

    // Find an image asset thumbnail (for PDF pages)
    const imageAssetSrc = useValue(`thumbnail-${page.id}`, () => {
        const shapeIds = editor.getSortedChildIdsForParent(page.id)
        for (const id of shapeIds) {
            const shape = editor.getShape(id)
            if (shape && shape.type === 'image' && 'assetId' in shape.props) {
                const props = shape.props as any
                const asset = editor.getAsset(props.assetId) as any
                if (asset && asset.props.src) return asset.props.src
            }
        }
        return null
    }, [editor, page.id])

    // Use image asset (PDF) first, then cached SVG thumbnail (drawings), then placeholder
    // Prefer cached thumbnail (shows drawings on top of PDF) over raw image asset
    const thumbnail = cachedThumbnail || imageAssetSrc

    const slideNumber = index + 1

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', page.id)
        onDragStart()
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver(index)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        onDrop()
    }

    return (
        <div
            ref={itemRef}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={onClick}
            className={`group relative cursor-grab active:cursor-grabbing transition-all overflow-hidden
                ${isDragging ? 'opacity-40 scale-95' : ''}
                ${isDropTarget && !isDragging ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''}
                ${isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-200 dark:shadow-blue-900/40' : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'}
            `}
        >
            {/* Drop indicator line */}
            {isDropTarget && !isDragging && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
            )}

            {/* Thumbnail */}
            {thumbnail ? (
               <div className="w-full aspect-video bg-white dark:bg-gray-700">
                   <img src={thumbnail} className="w-full h-full object-contain" draggable={false} />
               </div>
            ) : (
               <div className={`w-full aspect-video flex items-center justify-center ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                   <span className="text-2xl">📄</span>
               </div>
            )}

            {/* Slide number badge */}
            <div className={`absolute top-1 left-1 min-w-[20px] h-5 flex items-center justify-center rounded text-[10px] font-bold px-1 ${isSelected ? 'bg-blue-500 text-white' : 'bg-black/50 text-white'}`}>
                {slideNumber}
            </div>

            {/* Drag handle + delete on hover */}
            <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-0.5 rounded bg-black/40 text-white cursor-grab">
                    <GripVertical size={10} />
                </div>
                <button onClick={(e) => onDelete(page.id, e)} className="p-0.5 rounded bg-red-500/70 text-white hover:bg-red-500">
                    <Trash2 size={10} />
                </button>
            </div>
        </div>
    )
}
