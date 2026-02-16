import { Tldraw, useEditor, AssetRecordType, createShapeId, PageRecordType, TLComponents } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

import { useSubjectMode } from './store/useSubjectMode'
import { useCallback, useEffect, useRef, useState } from 'react'
import { loadPdf, renderPageToDataURL } from './utils/pdfUtils'

import { Sidebar } from './components/Sidebar'
import { ToolsSidebar } from './components/ToolsSidebar'
import { DrawingToolbar } from './components/DrawingToolbar'
import { LoadingOverlay } from './components/LoadingOverlay'
import { NavigationPanel } from './components/NavigationPanel'
import { ConfirmDialog } from './components/ConfirmDialog'

import { ProtractorShapeUtil } from './shapes/protractor/ProtractorShapeUtil'
import { RulerShapeUtil } from './shapes/ruler/RulerShapeUtil'

const customShapeUtils = [ProtractorShapeUtil, RulerShapeUtil]

function AppContent() {
    const editor = useEditor()
    const { mode } = useSubjectMode()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState('')

    // Custom confirm dialog state
    const [confirmDialogVisible, setConfirmDialogVisible] = useState(false)
    const confirmResolverRef = useRef<((value: boolean) => void) | null>(null)

    const showConfirmDialog = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            confirmResolverRef.current = resolve
            setConfirmDialogVisible(true)
        })
    }, [])

    const handleConfirm = useCallback(() => {
        setConfirmDialogVisible(false)
        confirmResolverRef.current?.(true)
        confirmResolverRef.current = null
    }, [])

    const handleCancel = useCallback(() => {
        setConfirmDialogVisible(false)
        confirmResolverRef.current?.(false)
        confirmResolverRef.current = null
    }, [])

    useEffect(() => {
        // Guard: prevent deletion of page-level image shapes (PDF slide backgrounds)
        const cleanup = editor.sideEffects.registerBeforeDeleteHandler('shape', (shape) => {
            // If a shape is a page-level image, prevent its deletion
            const pages = editor.getPages()
            const isPageLevelImage = shape.type === 'image' && pages.some(p => p.id === shape.parentId)
            if (isPageLevelImage) {
                return false // Prevent deletion
            }
            return // Allow deletion
        })

        // Retroactively lock any existing unlocked page-level images
        const pages = editor.getPages()
        for (const page of pages) {
            const shapeIds = editor.getSortedChildIdsForParent(page.id)
            for (const id of shapeIds) {
                const shape = editor.getShape(id)
                if (shape && shape.type === 'image' && !shape.isLocked) {
                    editor.updateShape({ id: shape.id, type: shape.type, isLocked: true })
                }
            }
        }

        return cleanup
    }, [editor])

    const addProtractor = () => {
        editor.createShape({
            id: createShapeId(),
            type: 'protractor',
            x: editor.getViewportScreenCenter().x - 150,
            y: editor.getViewportScreenCenter().y - 75,
        })
    }

    const projectInputRef = useRef<HTMLInputElement>(null)

    // Check if there is any existing content in the editor
    const hasExistingContent = (): boolean => {
        const pages = editor.getPages()
        // If there's more than one page, there's content
        if (pages.length > 1) return true
        // Check if the single page has any shapes
        const shapeIds = editor.getSortedChildIdsForParent(pages[0].id)
        return shapeIds.length > 0
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleSaveProject = async () => {
        const snapshot = editor.store.getSnapshot()
        const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'project.tldr'
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleOpenProject = () => {
        projectInputRef.current?.click()
    }

    const handleProjectFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Confirm before replacing existing project
        if (hasExistingContent()) {
            const confirmed = await showConfirmDialog()
            if (!confirmed) {
                if (projectInputRef.current) projectInputRef.current.value = ''
                return
            }
        }

        const text = await file.text()
        try {
            const snapshot = JSON.parse(text)
            editor.loadSnapshot(snapshot)
        } catch (e) {
            console.error('Failed to load project', e)
            alert('Failed to load project file')
        }
        
        // Reset input
        if (projectInputRef.current) projectInputRef.current.value = ''
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Confirm before replacing existing project
        if (hasExistingContent()) {
            const confirmed = await showConfirmDialog()
            if (!confirmed) {
                if (fileInputRef.current) fileInputRef.current.value = ''
                return
            }
        }

        setIsImporting(true)
        setImportProgress('Reading file...')
        try {
            let pdfData: string | Uint8Array = ''
            
            setImportProgress(`Reading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`)
            
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                setImportProgress('Converting file to buffer...')
                const arrayBuffer = await file.arrayBuffer()
                pdfData = new Uint8Array(arrayBuffer)
                
                // Save to library
                // @ts-ignore
                if (window.electron && window.electron.ipcRenderer) {
                    setImportProgress('Saving to library...')
                    try {
                        // @ts-ignore
                        await window.electron.ipcRenderer.invoke('save-imported-file', pdfData, file.name)
                    } catch (err) {
                        console.error('Failed to save file:', err)
                    }
                }
                
                setImportProgress(`File loaded (${pdfData.length} bytes). Parsing PDF...`)
            } else if (
                file.name.endsWith('.ppt') || 
                file.name.endsWith('.pptx')
            ) {
                 // @ts-ignore
                 if (window.electron && window.electron.ipcRenderer) {
                    setImportProgress('Converting PPT to PDF (this may take a moment)...')
                    
                    const fileArrayBuffer = await file.arrayBuffer()
                    const fileBytes = new Uint8Array(fileArrayBuffer)
                    // @ts-ignore
                    const pdfPath = await window.electron.ipcRenderer.invoke('convert-ppt-buffer-to-pdf', Array.from(fileBytes), file.name)
                    
                    setImportProgress('Reading converted PDF...')
                    // @ts-ignore
                    const pdfBuffer = await window.electron.ipcRenderer.invoke('read-pdf-file', pdfPath)
                    pdfData = new Uint8Array(pdfBuffer)
                    setImportProgress(`PDF ready (${pdfData.length} bytes). Parsing...`)
                 } else {
                     alert('PPT conversion only supported in Electron app')
                     setIsImporting(false)
                     return
                 }
            } else {
                alert('Unsupported file type')
                setIsImporting(false)
                return
            }

            setImportProgress('Loading PDF engine...')
            
            const pdf = await loadPdf(pdfData, { verbose: true, timeout: 60000 })
            
            setImportProgress(`PDF parsed! Found ${pdf.numPages} pages. Rendering...`)
            
            // --- Clear existing project before importing new one ---
            setImportProgress('Clearing existing project...')

            // Get all existing pages
            const existingPages = editor.getPages()
            const firstExistingPageId = existingPages[0]?.id

            // Switch to the first page so we can safely delete others
            if (firstExistingPageId) {
                editor.setCurrentPage(firstExistingPageId)
            }

            // Delete all pages except the first one (tldraw requires at least one page)
            for (const page of existingPages) {
                if (page.id !== firstExistingPageId) {
                    editor.deletePage(page.id)
                }
            }

            // Clear all shapes from the first page
            if (firstExistingPageId) {
                const shapeIds = editor.getSortedChildIdsForParent(firstExistingPageId)
                if (shapeIds.length > 0) {
                    // Temporarily unlock shapes so they can be deleted
                    for (const id of shapeIds) {
                        const shape = editor.getShape(id)
                        if (shape && shape.isLocked) {
                            editor.updateShape({ id: shape.id, type: shape.type, isLocked: false })
                        }
                    }
                    editor.deleteShapes(shapeIds)
                }
            }

            // Delete all existing assets
            const existingAssets = editor.getAssets()
            if (existingAssets.length > 0) {
                editor.deleteAssets(existingAssets.map(a => a.id))
            }

            // Rename first page to "Slide 1"
            if (firstExistingPageId) {
                editor.renamePage(firstExistingPageId, 'Slide 1')
            }

            // --- Now import the new slides ---
            let currentPageId = firstExistingPageId || editor.getCurrentPageId()
            
            for (let i = 1; i <= pdf.numPages; i++) {
                setImportProgress(`Rendering slide ${i} of ${pdf.numPages}...`)
                const dataUrl = await renderPageToDataURL(pdf, i)
                
                // Create Asset
                const assetId = AssetRecordType.createId()
                const page = await pdf.getPage(i)
                const viewport = page.getViewport({ scale: 1.5 })
                
                editor.createAssets([{
                    id: assetId,
                    typeName: 'asset',
                    type: 'image',
                    meta: {},
                    props: {
                        name: `page-${i}.png`,
                        src: dataUrl,
                        w: viewport.width,
                        h: viewport.height,
                        mimeType: 'image/png',
                        isAnimated: false
                    }
                }])

                // Create Page if not first
                if (i > 1) {
                    currentPageId = PageRecordType.createId()
                    editor.createPage({
                        id: currentPageId,
                        name: `Slide ${i}`,
                    })
                }

                // Create Image Shape
                editor.createShape({
                    type: 'image',
                    parentId: currentPageId,
                    x: 0,
                    y: 0,
                    isLocked: true,
                    props: {
                        assetId: assetId,
                        w: viewport.width,
                        h: viewport.height
                    }
                })
            }

            // Navigate to first page and zoom to fit
            const newFirstPageId = editor.getPages()[0]?.id
            if (newFirstPageId) {
                editor.setCurrentPage(newFirstPageId)
                requestAnimationFrame(() => {
                    const bounds = editor.getCurrentPageBounds()
                    if (bounds) {
                        editor.zoomToBounds(bounds, { inset: 0 })
                    } else {
                        editor.zoomToFit()
                    }
                })
            }

        } catch (error: any) {
            console.error('[Import] Import failed:', error)
            alert('Import failed: ' + (error?.message || error))
        } finally {
            setIsImporting(false)
            setImportProgress('')
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const [isDesktopMode, setIsDesktopMode] = useState(false)
    const [showNavPanel, setShowNavPanel] = useState(true)
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false)

    const toggleDesktopMode = () => {
        setIsDesktopMode(!isDesktopMode)
    }

    // Collapse both sidebars when clicking outside of them (on the workspace)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            // If the click is inside a sidebar, do nothing
            if (target.closest('[data-sidebar]')) return
            // If the click is on any UI overlay (toolbar, nav panel, etc.), do nothing
            if (target.closest('[data-no-collapse]')) return
            // Otherwise, collapse both sidebars
            setLeftSidebarOpen(false)
            setRightSidebarOpen(false)
        }
        // Use capture phase so we get the event before tldraw stops propagation
        document.addEventListener('mousedown', handleClickOutside, true)
        return () => document.removeEventListener('mousedown', handleClickOutside, true)
    }, [])

    return (
        <>
            {/* Transparent background override style */}
            {isDesktopMode && (
                <style>{`
                    .tldraw__editor { background: transparent !important; }
                    .tl-background { background: transparent !important; }
                    .tl-canvas { background: transparent !important; }
                    html, body { background: transparent !important; }
                    #root { background: transparent !important; }
                `}</style>
            )}

            <Sidebar onImport={handleImportClick} isOpen={leftSidebarOpen} onToggle={setLeftSidebarOpen} />
            <ToolsSidebar 
                onImportClick={handleImportClick} 
                onOpenProject={handleOpenProject}
                onSaveProject={handleSaveProject}
                onDesktopModeToggle={toggleDesktopMode}
                showNavPanel={showNavPanel}
                onToggleNavPanel={() => setShowNavPanel(!showNavPanel)}
                isOpen={rightSidebarOpen}
                onToggle={setRightSidebarOpen}
            />
            <DrawingToolbar />
            <NavigationPanel isVisible={showNavPanel} />
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileChange}
            />
            <input 
                type="file" 
                ref={projectInputRef} 
                className="hidden" 
                accept=".tldr,.json"
                onChange={handleProjectFileChange}
            />
            <LoadingOverlay 
                isVisible={isImporting} 
                message="Importing File" 
                subMessage={importProgress || "Please wait..."} 
            />
            <ConfirmDialog
                isVisible={confirmDialogVisible}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
            {mode === 'math' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg rounded-xl p-2 z-[99999]">
                    <button 
                        onClick={addProtractor}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-bold"
                    >
                        Add Protractor
                    </button>
                </div>
            )}
        </>
    )
}

const components: TLComponents = {
	DebugPanel: null
}



function App(): JSX.Element {
  return (
    <div className="tldraw__editor" style={{ position: 'fixed', inset: 0 }}>
      {/* Custom Close Button Removed - Moved to NavigationPanel */}
      <Tldraw persistenceKey="tldraw-persistence" shapeUtils={customShapeUtils} components={components}>
          <AppContent />
      </Tldraw>
    </div>
  )
}

export default App
