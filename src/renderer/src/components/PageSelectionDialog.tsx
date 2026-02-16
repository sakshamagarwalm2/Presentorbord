import { X, Copy } from 'lucide-react'
import { TLPage } from '@tldraw/tldraw'

interface PageSelectionDialogProps {
    isVisible: boolean
    onClose: () => void
    onConfirm: (pageId: string) => void
    pages: TLPage[]
    currentPageId: string
}

export function PageSelectionDialog({
    isVisible,
    onClose,
    onConfirm,
    pages,
    currentPageId
}: PageSelectionDialogProps) {
    if (!isVisible) return null

    // Sort pages by index to match Sidebar order
    const sortedPages = [...pages].sort((a, b) => (a.index > b.index ? 1 : -1))

    return (
        <div className="fixed inset-0 z-[100002] flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm m-4 overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Copy size={16} className="text-blue-500" />
                        Copy to Slide
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {sortedPages.map((page, index) => {
                        const isCurrent = page.id === currentPageId
                        return (
                            <button
                                key={page.id}
                                onClick={() => !isCurrent && onConfirm(page.id)}
                                disabled={isCurrent}
                                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between group transition-colors
                                    ${isCurrent 
                                        ? 'opacity-50 cursor-default bg-gray-100 dark:bg-gray-900/50' 
                                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/40 cursor-pointer'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`
                                        flex items-center justify-center w-6 h-6 rounded text-xs font-bold
                                        ${isCurrent 
                                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors'
                                        }
                                    `}>
                                        {index + 1}
                                    </span>
                                    <span className={`text-sm ${isCurrent ? 'text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {page.name || `Page ${index + 1}`}
                                    </span>
                                </div>
                                {isCurrent && (
                                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                        Current
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
