'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, ShoppingBag } from 'lucide-react'

export type CatalogBeat = {
  id: string
  title: string
  bpm: number
  key: string
  genre: string
  videoUrl: string | null
  audioUrl: string
  releaseDate: string | null
  /** Per-beat display format used by the home featured section. */
  featuredFormat?: 'grid' | 'list'
}

type WaveformRowProps = {
  beat: CatalogBeat
  isPlaying: boolean
  onTogglePlay: (nextId: string | null, audio: HTMLAudioElement | null) => void
  onOpenPurchase: (beat: CatalogBeat, duration: number) => void
  pauseCurrentAudio: () => void
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const isBeatNew = (releaseDate: string | null): boolean => {
  if (!releaseDate) return false
  const ts = Date.parse(releaseDate)
  if (Number.isNaN(ts)) return false
  return Date.now() - ts <= 7 * 24 * 60 * 60 * 1000
}

export function WaveformRow({
  beat,
  isPlaying,
  onTogglePlay,
  onOpenPurchase,
  pauseCurrentAudio,
}: WaveformRowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const onTogglePlayRef = useRef(onTogglePlay)
  const smoothedEnergyRef = useRef(0.24)
  const lastFrameAtRef = useRef(0)
  const isPlayingRef = useRef(isPlaying)

  const [playError, setPlayError] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const newTag = isBeatNew(beat.releaseDate)

  useEffect(() => {
    onTogglePlayRef.current = onTogglePlay
  }, [onTogglePlay])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const audio = new Audio(beat.audioUrl)
    audio.crossOrigin = ''
    audio.preload = 'metadata'
    audioRef.current = audio

    const handleEnded = () => onTogglePlayRef.current(null, null)
    const handleLoadedMetadata = () => setDuration(audio.duration || 0)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0)

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      audio.pause()
      audioRef.current = null
      audioCtxRef.current?.close()
      audioCtxRef.current = null
    }
  }, [beat.audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!isPlaying && audio && !audio.paused) {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const now = performance.now()
      if (now - lastFrameAtRef.current < 34) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      lastFrameAtRef.current = now

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      const pixelRatio = window.devicePixelRatio || 1
      const displayWidth = canvas.clientWidth || 720
      const displayHeight = canvas.clientHeight || 54
      const nextWidth = Math.floor(displayWidth * pixelRatio)
      const nextHeight = Math.floor(displayHeight * pixelRatio)
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth
        canvas.height = nextHeight
      }
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const width = displayWidth
      const height = displayHeight
      ctx.clearRect(0, 0, width, height)

      const analyser = analyserRef.current
      const centerY = height / 2
      let energy = smoothedEnergyRef.current
      let sharedSignal: Float32Array | null = null

      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const total = data.reduce((sum, v) => sum + v, 0)
        const rawEnergy = total / (data.length * 255)
        const nextEnergy = Math.max(0.16, Math.min(1.0, rawEnergy * 1.75))
        energy = smoothedEnergyRef.current * 0.88 + nextEnergy * 0.12
        smoothedEnergyRef.current = energy

        const waveformData = new Uint8Array(analyser.fftSize)
        analyser.getByteTimeDomainData(waveformData)

        const points = 180
        sharedSignal = new Float32Array(points)
        const step = (waveformData.length - 1) / (points - 1)
        for (let i = 0; i < points; i += 1) {
          const idx = Math.floor(i * step)
          const raw = (waveformData[idx] - 128) / 128
          const prev = i > 0 ? sharedSignal[i - 1] : raw
          sharedSignal[i] = prev * 0.78 + raw * 0.22
        }
      }

      const time = performance.now() * 0.0017
      const layers = [
        { opacity: 0.9, width: 2, amp: 1.0, phase: 0.0, delay: 0.0, drift: 0.0, yOffset: 0, sampleShift: 0 },
        { opacity: 0.42, width: 1.7, amp: 1.06, phase: 0.7, delay: 0.8, drift: 0.24, yOffset: -0.11, sampleShift: -4 },
        { opacity: 0.3, width: 1.45, amp: 1.18, phase: 1.2, delay: 1.4, drift: -0.22, yOffset: 0.09, sampleShift: 3 },
        { opacity: 0.22, width: 1.25, amp: 1.3, phase: 1.8, delay: 2.1, drift: 0.28, yOffset: 0.14, sampleShift: 7 },
      ]

      const playing = isPlayingRef.current
      layers.forEach((layer) => {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(17, 24, 39, ${layer.opacity})`
        ctx.lineWidth = layer.width
        const dynamicAmp = Math.max(7, height * 0.43 * energy * layer.amp)
        const animatedAmp = playing
          ? dynamicAmp * (1 + Math.sin(time + layer.delay) * layer.drift)
          : dynamicAmp
        const animatedCenter = playing
          ? centerY +
            height * layer.yOffset +
            Math.sin(time * 0.8 + layer.phase) * (height * 0.055 * Math.abs(layer.drift))
          : centerY

        for (let x = 0; x <= width; x += 2) {
          const normalizedX = (x - width / 2) / (width / 2)
          const envelope = Math.exp(-Math.pow(normalizedX * 1.45, 2))

          let sharedOffset = 0
          if (sharedSignal) {
            const sigIdx = Math.floor((x / width) * (sharedSignal.length - 1))
            const shiftedIdx = Math.max(
              0,
              Math.min(sharedSignal.length - 1, sigIdx + (playing ? layer.sampleShift : 0))
            )
            sharedOffset = sharedSignal[shiftedIdx] * animatedAmp * 0.95 * envelope
          }

          const subtleMotion =
            Math.sin(x * 0.0105 + time + layer.phase + layer.delay) * (animatedAmp * 0.08) * envelope
          const y = animatedCenter + sharedOffset + subtleMotion

          const safePadding = 2
          const clampedY = Math.min(height - safePadding, Math.max(safePadding, y))
          if (x === 0) {
            ctx.moveTo(x, clampedY)
          } else {
            ctx.lineTo(x, clampedY)
          }
        }
        ctx.stroke()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const setupAudioGraph = async () => {
    if (!audioRef.current) return
    if (!audioCtxRef.current) {
      const Ctx =
        (window as typeof window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as typeof window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctx) return
      audioCtxRef.current = new Ctx()
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current)
      const analyser = audioCtxRef.current.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.9
      sourceRef.current.connect(analyser)
      analyser.connect(audioCtxRef.current.destination)
      analyserRef.current = analyser
    }
  }

  const seekFromClientX = (clientX: number, target: HTMLElement) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = target.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const nextTime = ratio * duration
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const handleProgressPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    const move = (moveEvent: PointerEvent) => seekFromClientX(moveEvent.clientX, target)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    seekFromClientX(event.clientX, target)
  }

  const handlePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    setPlayError('')

    if (isPlaying) {
      audio.pause()
      pauseCurrentAudio()
      return
    }

    try {
      await setupAudioGraph()
      await audio.play()
      onTogglePlay(beat.id, audio)
    } catch {
      audio.pause()
      setPlayError(`No se pudo cargar ${beat.title}`)
    }
  }

  const progress = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0

  return (
    <article className="group rounded-2xl border border-black/[0.07] bg-white/85 backdrop-blur p-4 shadow-[0_2px_14px_rgba(17,24,39,0.04)] transition-shadow hover:shadow-[0_4px_22px_rgba(17,24,39,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenPurchase(beat, duration)}
            className="text-left text-[15px] font-medium tracking-tight text-neutral-900 hover:underline"
          >
            {beat.title}
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {beat.key ? (
              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10.5px] font-medium text-neutral-700">
                {beat.key}
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] font-medium text-neutral-700">
              {beat.bpm} BPM
            </span>
            {beat.genre ? (
              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-transparent px-2 py-0.5 text-[10.5px] font-medium text-neutral-700">
                {beat.genre}
              </span>
            ) : null}
            {newTag ? (
              <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[10.5px] font-medium text-white">
                Nuevo
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-mono text-[11px] tabular-nums text-neutral-500 sm:inline">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button
            type="button"
            onClick={() => onOpenPurchase(beat, duration)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-800 transition hover:bg-neutral-50"
            aria-label={`Comprar ${beat.title}`}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
            Comprar
          </button>
        </div>
      </div>

      <div
        className="mt-3 flex h-[80px] w-full cursor-pointer select-none items-center justify-center"
        role="button"
        tabIndex={0}
        aria-label={`Toggle preview for ${beat.title}`}
        onClick={handlePlay}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handlePlay()
          }
        }}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 transition hover:bg-neutral-50"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" strokeWidth={2} fill="currentColor" />
          ) : (
            <Play className="h-3 w-3 translate-x-[1px]" strokeWidth={2} fill="currentColor" />
          )}
        </button>
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration || 0)}
          aria-valuenow={Math.round(currentTime)}
          className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-neutral-200"
          onPointerDown={handleProgressPointerDown}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            const audio = audioRef.current
            if (!duration || !audio) return
            const step = Math.max(1, duration * 0.02)
            if (event.key === 'ArrowRight') {
              const next = Math.min(duration, audio.currentTime + step)
              audio.currentTime = next
              setCurrentTime(next)
            }
            if (event.key === 'ArrowLeft') {
              const next = Math.max(0, audio.currentTime - step)
              audio.currentTime = next
              setCurrentTime(next)
            }
          }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-neutral-900"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono text-[11px] tabular-nums text-neutral-500 sm:hidden">
          {formatTime(currentTime)}
        </span>
      </div>

      {playError ? (
        <p className="mt-2 text-[11px] text-red-500">{playError}</p>
      ) : null}
    </article>
  )
}
