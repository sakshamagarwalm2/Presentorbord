import { Tldraw, useEditor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { CustomToolbar } from './components/CustomToolbar'
import { ProtractorShapeUtil } from './shapes/protractor/ProtractorShapeUtil'
import { useSubjectMode } from './store/useSubjectMode'
import { useEffect } from 'react'

const customShapeUtils = [ProtractorShapeUtil]

function AppContent() {
    const editor = useEditor()
    const { mode } = useSubjectMode()

    useEffect(() => {
        // Here we could customize tools based on mode if needed
        // For now, toolbar handles interaction
    }, [mode, editor])

    const addProtractor = () => {
        const id = Date.now().toString()
        editor.createShape({
            id: `shape:${id}`,
            type: 'protractor',
            x: editor.getViewportScreenCenter().x - 150,
            y: editor.getViewportScreenCenter().y - 75,
        })
    }

    return (
        <>
            <CustomToolbar />
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
