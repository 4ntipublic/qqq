
'use client'

const TARGET_MIME = 'image/webp'
const TARGET_QUALITY = 0.85

const IMAGE_PASSTHROUGH = /\.webp$/i

export type ConvertImageOptions = {
  /**
   * If set, the image is centre-cropped to a square and resized so the final
   * dimensions are exactly `squareSize` × `squareSize` pixels.
   * Useful for avatars where we need a normalised aspect ratio.
   */
  squareSize?: number
  /**
   * Encoder quality between 0 and 1. Defaults to 0.85.
   */
  quality?: number
  /**
   * If true, the IMAGE_PASSTHROUGH shortcut is bypassed so resizes always run
   * even for `.webp` inputs.
   */
  forceReencode?: boolean
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('Unexpected FileReader result type'))
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo decodificar la imagen.'))
    img.src = src
  })
}

export async function convertImageToWebp(
  file: File,
  options: ConvertImageOptions = {}
): Promise<File> {
  const { squareSize, quality = TARGET_QUALITY, forceReencode = false } = options

  // Fast-path for already-webp inputs (only when no resize was requested).
  if (!forceReencode && squareSize === undefined && IMAGE_PASSTHROUGH.test(file.name)) {
    return file
  }

  const dataUrl = await readAsDataURL(file)
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D no disponible en este navegador.')
  }

  if (squareSize && squareSize > 0) {
    // Centre-crop to a square, then scale to squareSize × squareSize.
    canvas.width = squareSize
    canvas.height = squareSize
    const sourceSize = Math.min(img.naturalWidth, img.naturalHeight)
    const sourceX = Math.max(0, Math.floor((img.naturalWidth - sourceSize) / 2))
    const sourceY = Math.max(0, Math.floor((img.naturalHeight - sourceSize) / 2))
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, squareSize, squareSize)
  } else {
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
  }

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(resolve, TARGET_MIME, quality)
  })
  if (!blob) {
    throw new Error('Tu navegador no pudo encodear WebP. Probá otro formato.')
  }

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.webp`, { type: TARGET_MIME })
}
