import { COLOR_MAP } from '../constants/colorConstants'

/**
 * Finds the nearest named Tldraw color key for a given hex string.
 * Uses Euclidean distance in RGB space.
 */
export function getNearestNamedColor(hex: string): string {
  if (!hex || typeof hex !== 'string') return 'black'
  
  // Normalized hex
  const h = hex.startsWith('#') ? hex : '#000000'
  
  const hexToRgb = (hStr: string) => {
    // Handle short hex #rgb
    if (hStr.length === 4) {
      const r = parseInt(hStr[1] + hStr[1], 16)
      const g = parseInt(hStr[2] + hStr[2], 16)
      const b = parseInt(hStr[3] + hStr[3], 16)
      return { r, g, b }
    }
    const r = parseInt(hStr.slice(1, 3), 16)
    const g = parseInt(hStr.slice(3, 5), 16)
    const b = parseInt(hStr.slice(5, 7), 16)
    return { r, g, b }
  }

  const target = hexToRgb(h)
  let minDistance = Infinity
  let bestKey = 'black'

  for (const [key, value] of Object.entries(COLOR_MAP)) {
    const current = hexToRgb(value)
    const distance = Math.sqrt(
      Math.pow(target.r - current.r, 2) +
      Math.pow(target.g - current.g, 2) +
      Math.pow(target.b - current.b, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      bestKey = key
    }
  }
  return bestKey
}
