type RGBChannels = {
  r: number
  g: number
  b: number
}

const normalizeHex = (hex: string): string => {
  const cleaned = hex.replace('#', '').trim()

  if (cleaned.length === 3) {
    return cleaned
      .split('')
      .map((channel) => `${channel}${channel}`)
      .join('')
  }

  if (cleaned.length === 6) {
    return cleaned
  }

  return '6b7280'
}

const hexToRgb = (hex: string): RGBChannels => {
  const normalized = normalizeHex(hex)

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

export const rgbaFromHex = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex)
  const safeAlpha = Math.max(0, Math.min(1, alpha))

  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
}
