
import { useEditor, useValue, PageRecordType } from '@tldraw/tldraw'
import { Plus, Trash2, ArrowUp, ArrowDown, Download, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
    const editor = useEditor()
    const pages = useValue('pages', () => editor.getPages(), [editor])
    const currentPageId = useValue('currentPageId', () => editor.getCurrentPageId(), [editor])
    const [isOpen, setIsOpen] = useState(false)

    const sortedPages = pages.sort((a, b) => (a.index > b.index ? 1 : -1))

    const addPage = () => {
        const newPageId = PageRecordType.createId()
        editor.createPage({ 
            id: newPageId,
            name: `Page ${pages.length + 1}` 
        })
        editor.setCurrentPage(newPageId)
        requestAnimationFrame(() => editor.zoomToFit())
    }

    const deletePage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (pages.length <= 1) return
        const pageId = id as any
        editor.deletePage(pageId)
    }

    const selectPage = (id: string) => {
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

    const movePage = (id: string, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation()
        const index = sortedPages.findIndex(p => p.id === id)
        if (index === -1) return
        
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= sortedPages.length) return
        
        const targetPage = sortedPages[newIndex]
        const pageA = sortedPages[index]
        const pageB = targetPage
        
        editor.updatePage({ id: pageA.id, index: pageB.index })
        editor.updatePage({ id: pageB.id, index: pageA.index })
    }

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
            
            <div className={`absolute top-3 left-3 z-[99998] transform transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-64 opacity-0 pointer-events-none'}`}>
                <div className="w-56 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col max-h-[70vh]">
                    <div className="px-3 py-2.5 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Pages</h2>
                        <div className="flex gap-1 items-center">
                             <button onClick={exportAllPages} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors" title="Export"><Download size={14} /></button>
                             <button onClick={addPage} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Add Page"><Plus size={14} /></button>
                             <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Collapse">
                                <ChevronLeft size={14} />
                             </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                        {sortedPages.map((page, i) => (
                            <PageItem 
                                key={page.id}
                                page={page}
                                isSelected={currentPageId === page.id}
                                onClick={() => selectPage(page.id)}
                                onMove={movePage}
                                onDelete={deletePage}
                                index={i}
                                total={sortedPages.length}
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
    onMove, 
    onDelete, 
    index, 
    total 
}: { 
    page: any, 
    isSelected: boolean, 
    onClick: () => void, 
    onMove: (id: string, dir: 'up' | 'down', e: React.MouseEvent) => void, 
    onDelete: (id: string, e: React.MouseEvent) => void, 
    index: number, 
    total: number 
}) {
    const editor = useEditor()
    
    // Find a thumbnail image (first image shape on the page)
    const thumbnailObj = useValue(`thumbnail-${page.id}`, () => {
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

    return (
        <div 
            onClick={onClick}
            className={`group px-2 py-2 rounded-xl flex items-center cursor-pointer transition-all text-sm ${isSelected ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        >
            {thumbnailObj ? (
               <div className="w-10 h-7 bg-white dark:bg-gray-700 rounded overflow-hidden flex-shrink-0 mr-2 border border-gray-300 dark:border-gray-600">
                   <img src={thumbnailObj} className="w-full h-full object-cover" />
               </div>
            ) : (
               <div className={`w-10 h-7 rounded flex-shrink-0 mr-2 flex items-center justify-center text-xs border ${isSelected ? 'bg-blue-400/50 border-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                   <span className="scale-75">📄</span>
               </div>
            )}

            <span className="font-medium truncate flex-1">{page.name}</span>
            
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => onMove(page.id, 'up', e)} className={`p-0.5 rounded ${isSelected ? 'hover:bg-blue-400' : 'hover:text-blue-600'} disabled:opacity-30`} disabled={index === 0}>
                    <ArrowUp size={12} />
                </button>
                <button onClick={(e) => onMove(page.id, 'down', e)} className={`p-0.5 rounded ${isSelected ? 'hover:bg-blue-400' : 'hover:text-blue-600'} disabled:opacity-30`} disabled={index === total - 1}>
                    <ArrowDown size={12} />
                </button>
                <button onClick={(e) => onDelete(page.id, e)} className={`p-0.5 rounded ${isSelected ? 'hover:bg-red-400' : 'hover:text-red-500 hover:bg-red-50'}`}>
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    )
}
