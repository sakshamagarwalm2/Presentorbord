import { create } from 'zustand'

export type SubjectMode = 'standard' | 'math' | 'physics' | 'chemistry'

interface SubjectModeState {
  mode: SubjectMode
  setMode: (mode: SubjectMode) => void
}

export const useSubjectMode = create<SubjectModeState>((set) => ({
  mode: 'standard',
  setMode: (mode) => set({ mode }),
}))
