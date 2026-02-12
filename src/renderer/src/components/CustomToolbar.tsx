import { useSubjectMode, SubjectMode } from '../store/useSubjectMode'
import { Calculator, Atom, Zap, Pencil } from 'lucide-react'
import clsx from 'clsx'

const modes: { id: SubjectMode; icon: any; label: string }[] = [
  { id: 'standard', icon: Pencil, label: 'Standard' },
  { id: 'math', icon: Calculator, label: 'Math' },
  { id: 'physics', icon: Zap, label: 'Physics' },
  { id: 'chemistry', icon: Atom, label: 'Chemistry' },
]

export function CustomToolbar() {
  const { mode, setMode } = useSubjectMode()

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-xl p-2 flex gap-2 z-[99999] pointer-events-auto border border-gray-200">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={clsx(
            'p-3 rounded-lg flex flex-col items-center gap-1 transition-all min-w-[80px]',
            mode === m.id
              ? 'bg-blue-100 text-blue-600 shadow-sm'
              : 'hover:bg-gray-100 text-gray-600'
          )}
        >
          <m.icon className="w-6 h-6" />
          <span className="text-xs font-medium">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
