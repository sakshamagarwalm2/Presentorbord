import { atom } from '@tldraw/tldraw'

export const currentThicknessSignal = atom('currentThickness', 7)
export const currentOpacitySignal = atom('currentOpacity', 1)
export const currentIsBrushSignal = atom('currentIsBrush', false)
export const currentBrushTypeSignal = atom('brushType', 'normal')
export const currentEraserSizeSignal = atom('currentEraserSize', 12)
export const currentCustomColorSignal = atom('currentCustomColor', '#000000')
