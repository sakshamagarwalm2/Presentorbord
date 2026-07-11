import { atom } from '@tldraw/tldraw'

const getSavedColor = () => {
  const saved = localStorage.getItem('last-used-color')
  if (saved) return saved
  return '#3b82f6' // Default to a nice blue instead of black
}

export const currentThicknessSignal = atom('currentThickness', 5)
export const currentOpacitySignal = atom('currentOpacity', 1)
export const currentIsBrushSignal = atom('currentIsBrush', false)
export const currentBrushTypeSignal = atom('brushType', 'normal')
export const currentEraserSizeSignal = atom('currentEraserSize', 12)
export const currentCustomColorSignal = atom('currentCustomColor', getSavedColor())

const getSavedHandMode = () => {
  const saved = localStorage.getItem('hand-mode-enabled')
  if (saved) return saved === 'true'
  return false
}

export const handModeEnabledSignal = atom('handModeEnabled', getSavedHandMode())
