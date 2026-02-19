import { Calculator as CalcIcon, LineChart, Globe, ChevronRight, ChevronLeft, Sigma, Ruler, Circle, FileUp, Settings, Palette, Grid, Moon, Plus, Trash2, Download, Upload, Youtube, Map, Figma, Box, Code, Code2, AppWindow, Monitor, Navigation2, MoreHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useEditor, createShapeId } from '@tldraw/tldraw'
import { getEmbedDef } from '../utils/embedUtils'

interface ToolsSidebarProps {
  onImportClick: () => void
  onOpenProject: () => void
  onSaveProject: () => void
  onDesktopModeToggle: () => void
  showNavPanel: boolean
  onToggleNavPanel: () => void
  showRecentColors: boolean
  onToggleRecentColors: () => void
  isOpen: boolean
  onToggle: (open: boolean) => void
}

interface Bookmark {
  name: string
  url: string
}

export function ToolsSidebar({ onImportClick, onOpenProject, onSaveProject, onDesktopModeToggle, showNavPanel, onToggleNavPanel, showRecentColors, onToggleRecentColors, isOpen, onToggle }: ToolsSidebarProps) {
  const [showMathTools, setShowMathTools] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<'root' | 'embeds'>('root')
  const [showCustomize, setShowCustomize] = useState(false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('')
  const editor = useEditor()

  useEffect(() => {
    const saved = localStorage.getItem('tools-sidebar-bookmarks')
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse bookmarks', e)
      }
    }
  }, [])

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks)
    localStorage.setItem('tools-sidebar-bookmarks', JSON.stringify(newBookmarks))
  }

  const addBookmark = () => {
    if (!newBookmarkUrl) return
    let url = newBookmarkUrl
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }
    
    // Simple naming strategy: domain name or full URL
    let name = url.replace(/https?:\/\//, '')
    if (name.includes('/')) name = name.split('/')[0]
    
    const newBookmarks = [...bookmarks, { name, url }]
    saveBookmarks(newBookmarks)
    setNewBookmarkUrl('')
  }

  const removeBookmark = (index: number) => {
    const newBookmarks = bookmarks.filter((_, i) => i !== index)
    saveBookmarks(newBookmarks)
  }

  const openBookmark = (url: string) => {
    window.open(url, '_blank')
  }

  const toggleGrid = () => {
    editor.updateInstanceState({ isGridMode: !editor.getInstanceState().isGridMode })
  }

  const toggleDarkMode = () => {
    const currentTheme = editor.user.getUserPreferences().colorScheme
    editor.user.updateUserPreferences({ colorScheme: currentTheme === 'dark' ? 'light' : 'dark' })
  }



  const addEmbed = (type: string, name: string) => {
    const url = prompt(`Enter ${name} URL:`)
    if (!url) return

    const def = getEmbedDef(type)
    const embedUrl = def.toEmbedUrl(url)
    const center = editor.getViewportScreenCenter()

    editor.createShape({
        id: createShapeId(),
        type: 'embed',
        x: center.x - (def.width / 2),
        y: center.y - (def.height / 2),
        props: {
            w: def.width,
            h: def.height,
            url: embedUrl
        }
    })
    
    setShowSettings(false)
    setSettingsView('root')
  }


  const openSystemCalculator = async () => {
    // @ts-ignore
    if (window.electron && window.electron.ipcRenderer) {
       // @ts-ignore
       await window.electron.ipcRenderer.invoke('open-system-calculator')
    } else {
       alert('System Calculator only available in Electron mode')
    }
  }

  const openBrowser = () => {
    window.open('https://google.com', '_blank')
  }

  const openGraph = () => {
    window.open('https://www.desmos.com/calculator', '_blank')
  }

  return (
    <>
      {/* Collapse toggle when sidebar is closed - Right Side */}
      {!isOpen && (
        <button 
            data-sidebar
            onClick={() => onToggle(true)}
            className="absolute right-3 top-2 z-[99999] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all shadow-sm border border-gray-200/50 dark:border-gray-700/50"
            title="Expand Tools"
        >
            <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Main Sidebar - Right Side */}
      <div data-sidebar className={`absolute top-2 right-3 z-[99998] transform transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-64 opacity-0 pointer-events-none'}`}>
        <div className="w-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center py-4 gap-4">
            
            {/* Header / Collapse */}
            <button onClick={() => onToggle(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors mb-2">
                <ChevronRight size={16} />
            </button>

            {/* Tools */}
            <div className="flex flex-col gap-3 w-full px-2">
                 
                <ToolButton icon={FileUp} label="Import" onClick={onImportClick} />
                <ToolButton icon={Monitor} label="Desktop" onClick={onDesktopModeToggle} />
                
                {/* Math Group */}
                <div className="relative">
                    <ToolButton 
                        icon={Sigma} 
                        label="Math" 
                        isActive={showMathTools} 
                        onClick={() => setShowMathTools(!showMathTools)} 
                    />
                    
                    {/* Math Sub-menu */}
                    {showMathTools && (
                        <div className="absolute right-full top-0 mr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 flex flex-col gap-2">
                             <ToolButton icon={CalcIcon} label="Calculator" onClick={() => { openSystemCalculator(); setShowMathTools(false); }} />
                             <ToolButton icon={LineChart} label="Graph" onClick={() => { openGraph(); setShowMathTools(false); }} />
                        </div>
                    )}
                </div>

                <ToolButton icon={Globe} label="Browser" onClick={openBrowser} />
            </div>

            {/* Bottom Tools */}
            <div className="mt-auto flex flex-col gap-3 w-full px-2 pb-2 border-t border-gray-200/50 dark:border-gray-700/50 pt-2">
                {/* Settings Group */}
                 <div className="relative">
                    <ToolButton 
                        icon={Settings} 
                        label="Settings" 
                        isActive={showSettings} 
                        onClick={() => { setShowSettings(!showSettings); setSettingsView('root'); setShowCustomize(false); setShowMathTools(false); }} 
                    />
                    
                    {/* Settings Sub-menu */}
                    {showSettings && (
                        <div className="absolute right-full bottom-0 mr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 flex flex-col gap-2 min-w-[140px]">
                             {settingsView === 'root' ? (
                                <>
                                    <ToolButton icon={Grid} label="Grid" onClick={toggleGrid} />
                                    <ToolButton icon={Moon} label="Dark Mode" onClick={toggleDarkMode} />
                                    <ToolButton icon={AppWindow} label="Add Embed..." onClick={() => setSettingsView('embeds')} />
                                    <ToolButton 
                                        icon={Navigation2}
                                        label={showNavPanel ? "Hide Navigation" : "Show Navigation"} 
                                        isActive={showNavPanel}
                                        onClick={onToggleNavPanel} 
                                    />
                                    <ToolButton
                                        icon={MoreHorizontal}
                                        label={showRecentColors ? "Hide Colors" : "Show Colors"}
                                        isActive={showRecentColors}
                                        onClick={onToggleRecentColors}
                                    />
                                    <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                                    <ToolButton icon={Download} label="Save Project" onClick={onSaveProject} />
                                    <ToolButton icon={Upload} label="Open Project" onClick={onOpenProject} />
                                </>
                             ) : (
                                <>
                                    <ToolButton icon={ChevronRight} label="Back" onClick={() => setSettingsView('root')} />
                                    <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
                                    <ToolButton icon={Youtube} label="YouTube" onClick={() => addEmbed('youtube', 'YouTube')} />
                                    <ToolButton icon={Map} label="Google Maps" onClick={() => addEmbed('google_maps', 'Google Maps')} />
                                    <ToolButton icon={Figma} label="Figma" onClick={() => addEmbed('figma', 'Figma')} />
                                    <ToolButton icon={Box} label="CodeSandbox" onClick={() => addEmbed('codesandbox', 'CodeSandbox')} />
                                    <ToolButton icon={Code} label="CodePen" onClick={() => addEmbed('codepen', 'CodePen')} />
                                    <ToolButton icon={Code2} label="Scratch" onClick={() => addEmbed('scratch', 'Scratch')} />
                                    <ToolButton icon={Globe} label="Generic" onClick={() => addEmbed('generic', 'Website')} />
                                </>
                             )}
                        </div>
                    )}
                </div>

                {/* Customize / Bookmarks Group */}
                <div className="relative">
                    <ToolButton 
                        icon={Palette} 
                        label="Customize" 
                        isActive={showCustomize}
                        onClick={() => { setShowCustomize(!showCustomize); setShowSettings(false); setShowMathTools(false); }} 
                    />

                    {/* Customize Sub-menu */}
                    {showCustomize && (
                        <div className="absolute right-full bottom-0 mr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-3 flex flex-col gap-2 w-64">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Bookmarks</h3>
                            
                            {/* List */}
                            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                                {bookmarks.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">No bookmarks yet</p>}
                                {bookmarks.map((bm: Bookmark, i: number) => (
                                    <div key={i} className="flex items-center gap-2 group/item p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                        <button 
                                            onClick={() => openBookmark(bm.url)}
                                            className="flex-1 flex items-center gap-2 text-left overflow-hidden"
                                            title={bm.url}
                                        >
                                            <Globe size={14} className="text-blue-500 flex-shrink-0" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{bm.name}</span>
                                        </button>
                                        <button 
                                            onClick={() => removeBookmark(i)}
                                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <input 
                                    type="text" 
                                    value={newBookmarkUrl}
                                    onChange={(e) => setNewBookmarkUrl(e.target.value)}
                                    placeholder="google.com"
                                    className="flex-1 text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                                    onKeyDown={(e) => e.key === 'Enter' && addBookmark()}
                                />
                                <button 
                                    onClick={addBookmark}
                                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                    disabled={!newBookmarkUrl}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>

    </>
  )
}

function ToolButton({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive?: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
            title={label}
        >
            <Icon size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bg-gray-800 text-white px-2 py-1 rounded-md right-full mr-2 whitespace-nowrap pointer-events-none">
                {label}
            </span>
        </button>
    )
}
