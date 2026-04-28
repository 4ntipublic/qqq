'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Category } from '@/lib/admin-data'
import { convertImageToWebp } from '@/lib/image-to-webp'
import { transcodeAudioToMp3 } from '@/lib/transcoder'
import { createBeatAction } from '../actions'
import { getR2UploadUrl, type R2UploadFolder } from '../r2-actions'

const MUSICAL_KEYS = [
  'C Major', 'C Minor',
  'C# Major', 'C# Minor',
  'D Major', 'D Minor',
  'D# Major', 'D# Minor',
  'E Major', 'E Minor',
  'F Major', 'F Minor',
  'F# Major', 'F# Minor',
  'G Major', 'G Minor',
  'G# Major', 'G# Minor',
  'A Major', 'A Minor',
  'A# Major', 'A# Minor',
  'B Major', 'B Minor',
] as const
const AUDIO_ACCEPT = 'audio/*'
const VISUALIZER_ACCEPT = 'video/*,image/*,image/gif'
const IMAGE_EXT = /\.(png|jpe?g|gif|bmp|webp|avif|tiff?)$/i
const VIDEO_EXT = /\.(mp4|mov|webm|mkv|avi|m4v|ogv)$/i
const GIF_EXT = /\.gif$/i

type Phase =
  | 'idle'
  | 'transcoding-audio'
  | 'converting-image'
  | 'uploading'
  | 'saving'

type VisualizerKind = 'image' | 'video'

interface BeatsUploadFormProps {
  categories: Category[]
}

function extractExtension(name: string): string {
  const match = name.match(/\.[a-z0-9]+$/i)
  return match ? match[0].slice(1).toLowerCase() : ''
}

function humanFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let value = bytes
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export function BeatsUploadForm({ categories }: BeatsUploadFormProps) {
  const [title, setTitle] = useState('')
  const [bpm, setBpm] = useState<number>(140)
  const [musicalKey, setMusicalKey] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [visualizerFile, setVisualizerFile] = useState<File | null>(null)
  const [visualizerKind, setVisualizerKind] = useState<VisualizerKind | null>(null)
  const [progress, setProgress] = useState(0)
  const [optimizedSizeMb, setOptimizedSizeMb] = useState<number | null>(null)
  const [releaseDate, setReleaseDate] = useState<Date | undefined>(undefined)
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successTitle, setSuccessTitle] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [isPending, startTransition] = useTransition()

  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const visualizerInputRef = useRef<HTMLInputElement | null>(null)

  const minDate = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const isBusy = phase !== 'idle' || isPending

  const canSubmit =
    title.trim().length > 0 &&
    categoryId.length > 0 &&
    bpm >= 50 &&
    bpm <= 250 &&
    !isBusy

  const resetForm = () => {
    setTitle('')
    setBpm(140)
    setMusicalKey('')
    setCategoryId('')
    setAudioFile(null)
    setVisualizerFile(null)
    setVisualizerKind(null)
    setProgress(0)
    setOptimizedSizeMb(null)
    setReleaseDate(undefined)
    setIsVisible(false)
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (visualizerInputRef.current) visualizerInputRef.current.value = ''
  }

  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (file && !file.type.startsWith('audio/')) {
      setError('Subí un archivo de audio (cualquier formato común).')
      setAudioFile(null)
      event.target.value = ''
      return
    }
    setError(null)
    setAudioFile(file)
  }

  const handleVisualizerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setVisualizerFile(null)
      setVisualizerKind(null)
      return
    }
    const isImage = file.type.startsWith('image/') || IMAGE_EXT.test(file.name)
    const isVideo = file.type.startsWith('video/') || VIDEO_EXT.test(file.name)
    if (!isImage && !isVideo) {
      setError('El visualizer debe ser un video o una imagen.')
      setVisualizerFile(null)
      setVisualizerKind(null)
      event.target.value = ''
      return
    }
    setError(null)
    setVisualizerFile(file)
    setVisualizerKind(isImage ? 'image' : 'video')
  }

  const putToR2 = (file: File, uploadUrl: string, contentType: string, onProgress: (ratio: number) => void): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl, true)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.max(0, Math.min(1, event.loaded / event.total)))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(1)
          resolve()
        } else {
          reject(new Error(`R2 PUT falló con status ${xhr.status}: ${xhr.responseText || xhr.statusText}`))
        }
      }
      xhr.onerror = () =>
        reject(
          new Error(
            'Error de red durante el upload a R2. Causa más común: la CORS policy del bucket no permite PUT desde este origen. Revisá Cloudflare Dashboard → R2 → tu bucket → Settings → CORS Policy.',
          ),
        )
      xhr.onabort = () => reject(new Error('Upload a R2 cancelado.'))
      xhr.send(file)
    })

  const uploadFile = async (
    file: File,
    folder: R2UploadFolder,
    onProgress: (ratio: number) => void,
  ): Promise<string> => {
    const ext = extractExtension(file.name)
    if (!ext) {
      throw new Error(`No se pudo determinar la extensión del archivo (${folder}).`)
    }
    const contentType = file.type || 'application/octet-stream'

    const presigned = await getR2UploadUrl({ folder, contentType, ext })
    if (!presigned.ok || !presigned.uploadUrl || !presigned.publicUrl) {
      throw new Error(`R2 (${folder}): ${presigned.error ?? 'no se pudo firmar el upload.'}`)
    }

    await putToR2(file, presigned.uploadUrl, contentType, onProgress)
    return presigned.publicUrl
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSuccessTitle(null)
    setProgress(0)
    setOptimizedSizeMb(null)

    try {
      let audioUrl: string | null = null
      let videoUrl: string | null = null

      let audioReady: File | null = null
      if (audioFile) {
        setPhase('transcoding-audio')
        setProgress(0)
        try {
          audioReady = await transcodeAudioToMp3(audioFile, (ratio) => {
            setProgress(Math.round(ratio * 100))
          })
        } catch (transcodeErr) {
          setError(
            `No se pudo convertir el audio a MP3, se subirá el archivo original. Detalle: ${
              transcodeErr instanceof Error ? transcodeErr.message : String(transcodeErr)
            }`
          )
          audioReady = audioFile
        }
      }

      let visualizerReady: File | null = null
      let visualizerFolder: 'image' | 'video' = 'video'
      if (visualizerFile) {
        if (visualizerKind === 'image') {
          visualizerFolder = 'image'
          const isGif = GIF_EXT.test(visualizerFile.name) || visualizerFile.type === 'image/gif'
          if (isGif) {
            visualizerReady = visualizerFile
          } else {
            setPhase('converting-image')
            setProgress(0)
            try {
              visualizerReady = await convertImageToWebp(visualizerFile)
            } catch (imgErr) {
              setError(
                `No se pudo convertir la imagen a WebP, se subirá el archivo original. Detalle: ${
                  imgErr instanceof Error ? imgErr.message : String(imgErr)
                }`
              )
              visualizerReady = visualizerFile
            }
            setProgress(100)
          }
        } else {
          visualizerReady = visualizerFile
          visualizerFolder = 'video'
        }
      }

      const totalBytes =
        (audioReady?.size ?? 0) + (visualizerReady?.size ?? 0)
      const totalMb = totalBytes / (1024 * 1024)
      const roundedMb =
        totalBytes > 0 ? Number(totalMb.toFixed(2)) : null
      setOptimizedSizeMb(roundedMb)

      if (audioReady || visualizerReady) {
        setPhase('uploading')
        setProgress(0)

        const totalSize =
          (audioReady?.size ?? 0) + (visualizerReady?.size ?? 0)
        let audioLoaded = 0
        let visualizerLoaded = 0
        const updateAggregateProgress = () => {
          if (totalSize <= 0) return
          const ratio = (audioLoaded + visualizerLoaded) / totalSize
          setProgress(Math.round(Math.max(0, Math.min(1, ratio)) * 100))
        }

        const jobs: Promise<void>[] = []
        if (audioReady) {
          const file = audioReady
          jobs.push(
            uploadFile(file, 'audio', (ratio) => {
              audioLoaded = ratio * file.size
              updateAggregateProgress()
            }).then((url) => {
              audioUrl = url
            }),
          )
        }
        if (visualizerReady) {
          const file = visualizerReady
          jobs.push(
            uploadFile(file, visualizerFolder, (ratio) => {
              visualizerLoaded = ratio * file.size
              updateAggregateProgress()
            }).then((url) => {
              videoUrl = url
            }),
          )
        }
        await Promise.all(jobs)
        setProgress(100)
      }

      setPhase('saving')
      startTransition(async () => {
        const result = await createBeatAction({
          title,
          bpm,
          key: musicalKey || null,
          categoryId: categoryId || null,
          videoUrl,
          audioUrl,
          releaseDate: releaseDate ? releaseDate.toISOString() : null,
          isVisible,
          sizeMb: roundedMb,
        })

        if (!result.ok) {
          setError(result.error ?? 'No se pudo guardar el beat.')
          setPhase('idle')
          return
        }

        setSuccessTitle(title.trim())
        resetForm()
        setPhase('idle')
        setProgress(0)
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? `Falló la subida: ${err.message}`
          : 'Falló la subida por un error desconocido.'
      setError(message)
      setPhase('idle')
    }
  }

  const buttonLabel = () => {
    switch (phase) {
      case 'transcoding-audio':
        return `Convirtiendo audio a MP3… ${progress}%`
      case 'converting-image':
        return 'Convirtiendo imagen a WebP…'
      case 'uploading':
        return `Subiendo a R2… ${progress}%`
      case 'saving':
        return 'Guardando en DB…'
      default:
        return isPending ? 'Guardando en DB…' : 'Publicar beat'
    }
  }

  const showProgress =
    phase === 'transcoding-audio' ||
    phase === 'converting-image' ||
    phase === 'uploading'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir beat</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="beat-title">Título</Label>
            <Input
              id="beat-title"
              placeholder="ej. sent type beat"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isBusy}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="beat-bpm">BPM</Label>
              <span className="font-helvetica text-2xl font-light text-foreground">
                {bpm}
              </span>
            </div>
            <Slider
              id="beat-bpm"
              min={50}
              max={250}
              step={1}
              value={[bpm]}
              onValueChange={(vals) => setBpm(vals[0] ?? 140)}
              disabled={isBusy}
            />
            <div className="flex items-center justify-between text-[11px] font-light text-muted-foreground">
              <span>50</span>
              <span>250</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="beat-key">Tono / Key</Label>
            <Select value={musicalKey} onValueChange={setMusicalKey} disabled={isBusy}>
              <SelectTrigger id="beat-key">
                <SelectValue placeholder="Sin tono (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {MUSICAL_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="beat-category">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={isBusy}>
              <SelectTrigger id="beat-category">
                <SelectValue placeholder="Elegí un género" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    Sin categorías · creá una primero
                  </SelectItem>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="beat-audio-file">Audio</Label>
              <input
                ref={audioInputRef}
                id="beat-audio-file"
                type="file"
                accept={AUDIO_ACCEPT}
                onChange={handleAudioChange}
                disabled={isBusy}
                className="block w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm font-light text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-xs file:font-light file:text-background hover:file:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-[11px] font-light text-muted-foreground">
                Cualquier formato · se convierte a MP3 128kbps en el navegador.
              </span>
              {audioFile ? (
                <span className="truncate text-[11px] font-light text-foreground">
                  {audioFile.name} · {humanFileSize(audioFile.size)}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="beat-visualizer-file">Visualizer (video o imagen)</Label>
              <input
                ref={visualizerInputRef}
                id="beat-visualizer-file"
                type="file"
                accept={VISUALIZER_ACCEPT}
                onChange={handleVisualizerChange}
                disabled={isBusy}
                className="block w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm font-light text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-xs file:font-light file:text-background hover:file:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-[11px] font-light text-muted-foreground">
                Video → WebM · Imagen → WebP. Conversión local antes de subir.
              </span>
              {visualizerFile ? (
                <span className="truncate text-[11px] font-light text-foreground">
                  {visualizerKind === 'image' ? 'Imagen' : 'Video'} ·{' '}
                  {visualizerFile.name} · {humanFileSize(visualizerFile.size)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="beat-release">Fecha de drop</Label>
            <DatePicker
              id="beat-release"
              value={releaseDate}
              onChange={setReleaseDate}
              placeholder="Sin programar"
              minDate={minDate}
              disabled={isBusy}
            />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm font-light text-foreground">
            <span>Publicar ya (is_visible)</span>
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(event) => setIsVisible(event.target.checked)}
              disabled={isBusy}
              className="h-4 w-4 accent-foreground"
            />
          </label>

          {showProgress ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col gap-2 rounded-xl border border-border bg-muted px-3 py-2"
            >
              <span className="text-xs font-light text-foreground">{buttonLabel()}</span>
              <Progress value={progress} />
            </div>
          ) : null}

          {optimizedSizeMb !== null && !showProgress ? (
            <p
              role="status"
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-light text-foreground"
            >
              Peso final optimizado:{' '}
              <span className="font-helvetica text-sm">{optimizedSizeMb.toFixed(2)} MB</span>
            </p>
          ) : null}

          {successTitle ? (
            <p
              role="status"
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-light text-foreground"
            >
              Beat &quot;{successTitle}&quot; publicado · audio + visualizer en R2, metadata en Supabase.
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-light text-foreground"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {isBusy ? (
              <>
                <Loader2 className="animate-spin" />
                {buttonLabel()}
              </>
            ) : (
              <>
                <UploadCloud />
                {buttonLabel()}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
