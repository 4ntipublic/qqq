
'use client'

const TARGET_MIME = 'image/webp'
const TARGET_QUALITY = 0.85

const IMAGE_PASSTHROUGH = /\.webp$/i

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

export async function convertImageToWebp(file: File): Promise<File> {
  if (IMAGE_PASSTHROUGH.test(file.name)) return file

  const dataUrl = await readAsDataURL(file)
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D no disponible en este navegador.')
  }
  ctx.drawImage(img, 0, 0)

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(resolve, TARGET_MIME, TARGET_QUALITY)
  })
  if (!blob) {
    throw new Error('Tu navegador no pudo encodear WebP. Probá otro formato.')
  }

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.webp`, { type: TARGET_MIME })
}
