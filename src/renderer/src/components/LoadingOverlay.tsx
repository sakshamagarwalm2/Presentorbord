import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
    isVisible: boolean
    message?: string
    subMessage?: string
}

export function LoadingOverlay({ isVisible, message = 'Loading...', subMessage }: LoadingOverlayProps) {
    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-gray-100 dark:border-gray-700">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin relative z-10" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 text-center">{message}</h3>
                {subMessage && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center animate-pulse">{subMessage}</p>
                )}
            </div>
        </div>
    )
}
