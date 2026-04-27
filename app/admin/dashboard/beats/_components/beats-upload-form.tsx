'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Category } from '@/lib/admin-data'
import { createClient } from '@/utils/supabase/client'
import { createBeatAction } from '../actions'

const STORAGE_BUCKET = 'beats-media'
const AUDIO_ACCEPT = '.wav,.mp3,audio/wav,audio/mpeg,audio/mp3,audio/x-wav'
const VIDEO_ACCEPT = '.webm,.mp4,video/webm,video/mp4'
const AUDIO_EXT = /\.(wav|mp3)$/i
const VIDEO_EXT = /\.(webm|mp4)$/i

type Phase = 'idle' | 'uploading' | 'saving'

interface BeatsUploadFormProps {
  categories: Category[]
}

function sanitizeFileName(name: string): string {
  // Keep alphanumerics, dots, dashes and underscores; replace the rest.
  return name.replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(0, 100)
}

function buildStoragePath(folder: 'audio' | 'video', file: File): string {
  const clean = sanitizeFileName(file.name)
  return `${folder}/${Date.now()}-${clean}`
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
  const [categoryId, setCategoryId] = useState<string>('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [releaseDate, setReleaseDate] = useState<Date | undefined>(undefined)
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successTitle, setSuccessTitle] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [isPending, startTransition] = useTransition()

  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

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
    setCategoryId('')
    setAudioFile(null)
    setVideoFile(null)
    setReleaseDate(undefined)
    setIsVisible(false)
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (file && !AUDIO_EXT.test(file.name)) {
      setError('El audio debe ser .wav o .mp3.')
      setAudioFile(null)
      event.target.value = ''
      return
    }
    setError(null)
    setAudioFile(file)
  }

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (file && !VIDEO_EXT.test(file.name)) {
      setError('El video debe ser .webm o .mp4.')
      setVideoFile(null)
      event.target.value = ''
      return
    }
    setError(null)
    setVideoFile(file)
  }

  const uploadFile = async (
    file: File,
    folder: 'audio' | 'video'
  ): Promise<string> => {
    const supabase = createClient()
    const path = buildStoragePath(folder, file)
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: false,
      })
    if (uploadError) {
      throw new Error(`Storage (${folder}): ${uploadError.message}`)
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    if (!data?.publicUrl) {
      throw new Error(`No se pudo obtener URL pública del ${folder}.`)
    }
    return data.publicUrl
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSuccessTitle(null)

    try {
      let audioUrl: string | null = null
      let videoUrl: string | null = null

      if (audioFile || videoFile) {
        setPhase('uploading')
        const jobs: Promise<void>[] = []
        if (audioFile) {
          jobs.push(
            uploadFile(audioFile, 'audio').then((url) => {
              audioUrl = url
            })
          )
        }
        if (videoFile) {
          jobs.push(
            uploadFile(videoFile, 'video').then((url) => {
              videoUrl = url
            })
          )
        }
        await Promise.all(jobs)
      }

      setPhase('saving')
      startTransition(async () => {
        const result = await createBeatAction({
          title,
          bpm,
          categoryId: categoryId || null,
          videoUrl,
          audioUrl,
          releaseDate: releaseDate ? releaseDate.toISOString() : null,
          isVisible,
        })

        if (!result.ok) {
          setError(result.error ?? 'No se pudo guardar el beat.')
          setPhase('idle')
          return
        }

        setSuccessTitle(title.trim())
        resetForm()
        setPhase('idle')
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al subir.'
      setError(message)
      setPhase('idle')
    }
  }

  const buttonLabel = () => {
    if (phase === 'uploading') return 'Subiendo archivos…'
    if (phase === 'saving' || isPending) return 'Guardando en DB…'
    return 'Publicar beat'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir beat</CardTitle>
        <CardDescription>
          Archivos de audio (.wav / .mp3) y video (.webm / .mp4) suben directo al bucket
          <span className="font-mono"> beats-media</span>. Las URLs públicas se guardan en la
          tabla <span className="font-mono">beats</span>.
        </CardDescription>
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
              <Label htmlFor="beat-audio-file">Audio (.wav / .mp3)</Label>
              <input
                ref={audioInputRef}
                id="beat-audio-file"
                type="file"
                accept={AUDIO_ACCEPT}
                onChange={handleAudioChange}
                disabled={isBusy}
                className="block w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm font-light text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-xs file:font-light file:text-background hover:file:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {audioFile ? (
                <span className="truncate text-[11px] font-light text-muted-foreground">
                  {audioFile.name} · {humanFileSize(audioFile.size)}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="beat-video-file">Video (.webm / .mp4)</Label>
              <input
                ref={videoInputRef}
                id="beat-video-file"
                type="file"
                accept={VIDEO_ACCEPT}
                onChange={handleVideoChange}
                disabled={isBusy}
                className="block w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm font-light text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-xs file:font-light file:text-background hover:file:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {videoFile ? (
                <span className="truncate text-[11px] font-light text-muted-foreground">
                  {videoFile.name} · {humanFileSize(videoFile.size)}
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

          {phase === 'uploading' ? (
            <p
              role="status"
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-light text-foreground"
            >
              Subiendo archivos al bucket beats-media… esto puede tardar con .wav / .webm
              pesados.
            </p>
          ) : null}

          {successTitle ? (
            <p
              role="status"
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-light text-foreground"
            >
              Beat &quot;{successTitle}&quot; creado en Supabase.
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
