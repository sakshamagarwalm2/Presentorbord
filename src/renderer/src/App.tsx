import { Tldraw, useEditor, AssetRecordType, createShapeId, PageRecordType } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { ProtractorShapeUtil } from './shapes/protractor/ProtractorShapeUtil'
import { useSubjectMode } from './store/useSubjectMode'
import { useEffect, useRef, useState } from 'react'
import { loadPdf, renderPageToDataURL } from './utils/pdfUtils'
import { convertPptToPdf } from './utils/pptUtils'
import { Sidebar } from './components/Sidebar'
import { DrawingToolbar } from './components/DrawingToolbar'

const customShapeUtils = [ProtractorShapeUtil]

function AppContent() {
    const editor = useEditor()
    const { mode } = useSubjectMode()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)

    useEffect(() => {
        // Here we could customize tools based on mode if needed
        // For now, toolbar handles interaction
    }, [mode, editor])

    const addProtractor = () => {
        editor.createShape({
            id: createShapeId(),
            type: 'protractor',
            x: editor.getViewportScreenCenter().x - 150,
            y: editor.getViewportScreenCenter().y - 75,
        })
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        try {
            let pdfData: string | Uint8Array = ''
            
            // Cast file to any to access Electron's 'path' property
            const electronFile = file as any
            
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                // Check if in Electron
                // @ts-ignore
                if (window.electron && window.electron.ipcRenderer) {
                    // @ts-ignore
                    pdfData = await window.electron.ipcRenderer.invoke('read-pdf-file', electronFile.path)
                } else {
                    // Web fallback
                    pdfData = URL.createObjectURL(file)
                }
            } else if (
                file.name.endsWith('.ppt') || 
                file.name.endsWith('.pptx')
            ) {
                 // @ts-ignore
                 if (window.electron && window.electron.ipcRenderer) {
                    // @ts-ignore
                    const pdfPath = await convertPptToPdf(electronFile.path)
                    // Read the file content from main process to avoid local resource restrictions
                    // @ts-ignore
                    pdfData = await window.electron.ipcRenderer.invoke('read-pdf-file', pdfPath)
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

            const pdf = await loadPdf(pdfData)
            
            // Current page for first slide
            let currentPageId = editor.getCurrentPageId()
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const dataUrl = await renderPageToDataURL(pdf, i)
                
                // Create Asset
                const assetId = AssetRecordType.createId()
                // We need dimensions. 
                // renderPageToDataURL returns base64. 
                // We can get dimensions from standard A4 or viewport.
                // Re-getting viewport to get dimensions
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
                    props: {
                        assetId: assetId,
                        w: viewport.width,
                        h: viewport.height
                    }
                })
            }

        } catch (error) {
            console.error('Import failed', error)
            alert('Import failed: ' + error)
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }



    return (
        <>
            <Sidebar />
            <DrawingToolbar />
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileChange}
            />
            {isImporting && (
                <div className="absolute inset-0 bg-black/50 z-[100000] flex items-center justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                        <p className="font-bold text-lg animate-pulse">Importing... Please wait</p>
                    </div>
                </div>
            )}
            {mode === 'math' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-xl p-2 z-[99999]">
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

function App(): JSX.Element {
  return (
    <div className="tldraw__editor" style={{ position: 'fixed', inset: 0 }}>
      <Tldraw persistenceKey="tldraw-persistence" shapeUtils={customShapeUtils}>
          <AppContent />
      </Tldraw>
    </div>
  )
}

export default App
