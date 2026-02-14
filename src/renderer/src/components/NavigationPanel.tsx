import { useEditor } from '@tldraw/tldraw'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export function NavigationPanel({ isVisible }: { isVisible: boolean }) {
    // Get editor safely
    let editor: any = null
    try {
        editor = useEditor()
    } catch {
        // Handle case where editor context is missing (though unlikely in this app structure)
    }

    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [zoomLevel, setZoomLevel] = useState(100)

    // Using a polling approach for simplicity as Tldraw context updates can be tricky to hook perfectly
    // for page count/index without complex listeners.
    useEffect(() => {
        if (!editor) return

        const updateInfo = () => {
             const pages = editor.getPages()
             const currentPageId = editor.getCurrentPageId()
             const index = pages.findIndex((p: any) => p.id === currentPageId)
             
             setCurrentPageIndex(index !== -1 ? index : 0)
             setTotalPages(pages.length)
             setZoomLevel(Math.round(editor.getZoomLevel() * 100))
        }

        updateInfo()
        const interval = setInterval(updateInfo, 500) // Poll every 500ms
        return () => clearInterval(interval)
    }, [editor])

    if (!isVisible || !editor) return null

    const handleZoomIn = () => {
        const currentZoom = editor.getZoomLevel()
        const newZoom = Math.min(currentZoom + 0.05, 8) // +5%, max 800%
        editor.setCamera({ ...editor.getCamera(), z: newZoom })
    }

    const handleZoomOut = () => {
        const currentZoom = editor.getZoomLevel()
        const newZoom = Math.max(currentZoom - 0.05, 0.1) // -5%, min 10%
        editor.setCamera({ ...editor.getCamera(), z: newZoom })
    }

    const handleNextPage = () => {
        const pages = editor.getPages()
        if (currentPageIndex < pages.length - 1) {
            editor.setCurrentPage(pages[currentPageIndex + 1].id)
        }
    }

    const handlePrevPage = () => {
        const pages = editor.getPages()
        if (currentPageIndex > 0) {
            editor.setCurrentPage(pages[currentPageIndex - 1].id)
        }
    }

    return (
        <div className="fixed bottom-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 border-b-0 border-r-0 rounded-tl-2xl p-2 flex gap-2 z-[99999] animate-in slide-in-from-bottom-4 fade-in duration-300">
            
            {/* Page Controls */}
            <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
                <button 
                    onClick={handlePrevPage}
                    disabled={currentPageIndex === 0}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center">
                    {currentPageIndex + 1} / {totalPages}
                </span>

                <button 
                    onClick={handleNextPage}
                    disabled={currentPageIndex >= totalPages - 1} // Safety check
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 pl-1">
                 <button 
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 transition-colors"
                    title="Zoom Out (-5%)"
                >
                    <ZoomOut size={20} />
                </button>

                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[4ch] text-center tabular-nums">
                    {zoomLevel}%
                </span>

                <button 
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 transition-colors"
                    title="Zoom In (+5%)"
                >
                    <ZoomIn size={20} />
                </button>
            </div>

            {/* Separator */}
            <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 my-1" />

            {/* Close/Exit Button */}
            <button
                onClick={() => {
                    // @ts-ignore
                    if (window.electron && window.electron.ipcRenderer) {
                        // @ts-ignore
                        window.electron.ipcRenderer.invoke('close-app')
                    }
                }}
                className="w-3.5 h-3.5 bg-red-500 hover:bg-red-600 rounded-full transition-all hover:scale-110 flex-shrink-0 self-center"
                title="Close App"
            />

        </div>
    )
}
