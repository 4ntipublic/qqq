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

  return 'fef08a'
}

export const hexToRgb = (hex: string): RGBChannels => {
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

export const shadeHex = (hex: string, intensity: number): string => {
  const { r, g, b } = hexToRgb(hex)
  const safeIntensity = Math.max(0, Math.min(1, intensity))

  return `rgb(${Math.round(r * safeIntensity)}, ${Math.round(g * safeIntensity)}, ${Math.round(b * safeIntensity)})`
}
