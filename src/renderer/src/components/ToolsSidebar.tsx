
import { useState } from 'react'
import { Calculator as CalcIcon, LineChart, Globe, ChevronRight, ChevronLeft, Sigma } from 'lucide-react'

export function ToolsSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showMathTools, setShowMathTools] = useState(false)

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
            onClick={() => setIsOpen(true)}
            className="absolute right-3 top-2 z-[99999] p-2 bg-white/60 backdrop-blur-md rounded-lg hover:bg-white/90 transition-all shadow-sm border border-gray-200/50"
            title="Expand Tools"
        >
            <ChevronLeft size={16} className="text-gray-600" />
        </button>
      )}

      {/* Main Sidebar - Right Side */}
      <div className={`absolute top-2 right-3 z-[99998] transform transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-64 opacity-0 pointer-events-none'}`}>
        <div className="w-16 bg-white/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 flex flex-col items-center py-4 gap-4">
            
            {/* Header / Collapse */}
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors mb-2">
                <ChevronRight size={16} />
            </button>

            {/* Tools */}
            <div className="flex flex-col gap-3 w-full px-2">
                
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
                        <div className="absolute right-full top-0 mr-3 bg-white/90 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 p-2 flex flex-col gap-2">
                             <ToolButton icon={CalcIcon} label="Calculator" onClick={() => { openSystemCalculator(); setShowMathTools(false); }} />
                             <ToolButton icon={LineChart} label="Graph" onClick={() => { openGraph(); setShowMathTools(false); }} />
                        </div>
                    )}
                </div>

                <ToolButton icon={Globe} label="Browser" onClick={openBrowser} />
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
            className={`group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'hover:bg-gray-100 text-gray-600'}`}
            title={label}
        >
            <Icon size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bg-gray-800 text-white px-2 py-1 rounded-md right-full mr-2 whitespace-nowrap pointer-events-none">
                {label}
            </span>
        </button>
    )
}
