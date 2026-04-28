'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { rgbaFromHex } from './themeColor'

type LicenseOption = {
  id: string
  name: string
  priceLabel: string
  description: string
}

const LICENSE_OPTIONS: LicenseOption[] = [
  {
    id: 'mp3-lease',
    name: 'MP3 Lease',
    priceLabel: '$20',
    description: 'Incluye MP3 a 320kbps.',
  },
  {
    id: 'wav-lease',
    name: 'WAV Lease',
    priceLabel: '$25',
    description: 'Incluye WAV + MP3.',
  },
  {
    id: 'trackouts',
    name: 'Trackouts (Stems)',
    priceLabel: '$40',
    description: 'Incluye Stems + WAV + MP3.',
  },
  {
    id: 'exclusive-rights',
    name: 'Exclusive Rights',
    priceLabel: 'Oferta / Contactar',
    description: 'Derechos totales.',
  },
]

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export type BeatCartPayload = {
  beatId: string
  beatTitle: string
  licenseId: string
  licenseName: string
  priceLabel: string
}

export type BeatCardTheme = {
  textColor: string
  fontFamily: string
  fontWeight: number
  boxBlur: number
  expandedOverlayColor: string
  overlayOpacity: number
}

type BeatCardProps = {
  beatId: string
  title: string
  bpm: string
  genre: string
  tone: string
  videoSrc?: string
  audioSrc?: string
  theme: BeatCardTheme
  isActive: boolean
  onSelect: (beatId: string) => void
  onCloseExpansion: () => void
  onAddToCart: (item: BeatCartPayload) => void
}

const quickEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
const appleSpring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 32,
  mass: 1,
  bounce: 0,
}

const syncedVideoRegistry = new Map<string, Set<HTMLVideoElement>>()
const VIDEO_SYNC_TOLERANCE_SECONDS = 0.08
const VIDEO_LOOP_WRAP_GUARD_SECONDS = 1.5

let syncRafHandle: number | null = null

const runSyncPass = () => {
  syncedVideoRegistry.forEach((videos) => {
    if (videos.size < 2) {
      return
    }

    let leaderTime = -Infinity
    videos.forEach((video) => {
      if (
        video.readyState >= 2 &&
        !video.paused &&
        Number.isFinite(video.currentTime) &&
        video.currentTime > leaderTime
      ) {
        leaderTime = video.currentTime
      }
    })

    if (leaderTime === -Infinity) {
      return
    }

    videos.forEach((video) => {
      if (
        video.readyState < 2 ||
        video.paused ||
        !Number.isFinite(video.currentTime)
      ) {
        return
      }
      const drift = leaderTime - video.currentTime
      if (drift > VIDEO_SYNC_TOLERANCE_SECONDS && drift < VIDEO_LOOP_WRAP_GUARD_SECONDS) {
        try {
          video.currentTime = leaderTime
        } catch {}
      }
    })
  })
  syncRafHandle = requestAnimationFrame(runSyncPass)
}

const ensureSyncLoop = () => {
  if (syncRafHandle !== null || syncedVideoRegistry.size === 0) {
    return
  }
  syncRafHandle = requestAnimationFrame(runSyncPass)
}

const maybeStopSyncLoop = () => {
  if (syncRafHandle !== null && syncedVideoRegistry.size === 0) {
    cancelAnimationFrame(syncRafHandle)
    syncRafHandle = null
  }
}

const registerSyncedVideo = (src: string, video: HTMLVideoElement): (() => void) => {
  let set = syncedVideoRegistry.get(src)
  if (!set) {
    set = new Set()
    syncedVideoRegistry.set(src, set)
  }
  set.add(video)
  ensureSyncLoop()

  return () => {
    const current = syncedVideoRegistry.get(src)
    if (current) {
      current.delete(video)
      if (current.size === 0) {
        syncedVideoRegistry.delete(src)
      }
    }
    maybeStopSyncLoop()
  }
}

const readSyncSeedTime = (src: string | undefined, fallback: number): number => {
  if (!src) {
    return fallback
  }
  const peers = syncedVideoRegistry.get(src)
  if (!peers) {
    return fallback
  }
  let peerLeaderTime = -Infinity
  peers.forEach((video) => {
    if (
      video.readyState >= 2 &&
      Number.isFinite(video.currentTime) &&
      video.currentTime > peerLeaderTime
    ) {
      peerLeaderTime = video.currentTime
    }
  })
  return peerLeaderTime > 0 ? peerLeaderTime : fallback
}

function BeatCardComponent({
  beatId,
  title,
  bpm,
  genre,
  tone,
  videoSrc,
  audioSrc,
  theme,
  isActive,
  onSelect,
  onCloseExpansion,
  onAddToCart,
}: BeatCardProps) {
  const visualizerRef = useRef<HTMLDivElement | null>(null)
  const visualVideoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const persistedVideoTimeRef = useRef(0)
  const persistedVideoWasPlayingRef = useRef(false)
  const cardLayoutId = `beat-card-${beatId}`
  const visualizerLayoutId = `beat-visualizer-${beatId}`
  const visualizerMediaLayoutId = `beat-visualizer-media-${beatId}`
  const isImageVisualizer = Boolean(videoSrc) && /\.(webp|png|jpe?g|gif|avif|bmp)(\?.*)?$/i.test(videoSrc ?? '')
  const hasVideo = Boolean(videoSrc) && !isImageVisualizer
  const hasMedia = Boolean(videoSrc)

  const [showExpandedDetails, setShowExpandedDetails] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(!hasVideo)

  const seekTrackRef = useRef<HTMLDivElement | null>(null)
  const isSeekingRef = useRef(false)

  useEffect(() => {
    if (!hasVideo || shouldLoadVideo) {
      return
    }

    const target = visualizerRef.current

    if (!target) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadVideo(true)
          observer.disconnect()
        }
      },
      {
        root: null,
        rootMargin: '220px 0px',
        threshold: 0.01,
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasVideo, shouldLoadVideo])

  useEffect(() => {
    if (!isActive) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowExpandedDetails(false)
        onCloseExpansion()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isActive, onCloseExpansion])

  useEffect(() => {
    const audio = audioRef.current
    const video = visualVideoRef.current

    if (isActive) {
      let cancelled = false
      const timeouts: ReturnType<typeof setTimeout>[] = []

      const tryPlayAudio = (attempt = 0) => {
        if (cancelled) return
        if (!audioSrc) return
        const a = audioRef.current
        if (!a) {
          if (attempt < 15) {
            timeouts.push(setTimeout(() => tryPlayAudio(attempt + 1), 40))
          }
          return
        }
        try {
          a.currentTime = 0
        } catch {}
        a.volume = 1
        a.muted = false
        a.play().catch(() => {})
      }

      const tryPlayVideo = (attempt = 0) => {
        if (cancelled) return
        const v = visualVideoRef.current
        if (!v) {
          if (attempt < 15) {
            timeouts.push(setTimeout(() => tryPlayVideo(attempt + 1), 40))
          }
          return
        }
        v.play().catch(() => {})
      }

      timeouts.push(setTimeout(() => tryPlayVideo(), 16))
      timeouts.push(setTimeout(() => tryPlayAudio(), 16))

      return () => {
        cancelled = true
        timeouts.forEach(clearTimeout)
      }
    }

    if (audio) {
      audio.pause()
      try {
        audio.currentTime = 0
      } catch {}
    }
    setCurrentTime(0)

    if (video) {
      try {
        video.currentTime = 0
      } catch {}
      persistedVideoTimeRef.current = 0
      void video.play().catch(() => {})
    }
  }, [isActive, audioSrc])

  useLayoutEffect(() => {
    const visualizerVideo = visualVideoRef.current

    if (!visualizerVideo) {
      return
    }

    const seed = readSyncSeedTime(videoSrc, persistedVideoTimeRef.current)
    if (seed <= 0) {
      return
    }

    try {
      visualizerVideo.currentTime = seed
    } catch {}
  }, [isActive, shouldLoadVideo, videoSrc])

  useEffect(() => {
    const visualizerVideo = visualVideoRef.current

    if (!visualizerVideo) {
      return
    }

    if (persistedVideoWasPlayingRef.current && visualizerVideo.paused) {
      void visualizerVideo.play().catch(() => {
        persistedVideoWasPlayingRef.current = false
      })
    }
  }, [isActive, shouldLoadVideo, videoSrc])

  const {
    textPrimary,
    textMuted,
    specDotColor,
    titleTypographyStyle,
    specLabelTypographyStyle,
    specValueTypographyStyle,
    licenseNameTypographyStyle,
    licenseDescriptionTypographyStyle,
    overlayOpacityNormalized,
    cardMaterialStyle,
    licensePanelStyle,
    licenseCardStyle,
    visualizerFallbackBlur,
    visualizerStyle,
    metadataPanelStyle,
  } = useMemo(() => {
    const nextTextPrimary = rgbaFromHex(theme.textColor, 0.94)
    const nextTextSecondary = rgbaFromHex(theme.textColor, 0.82)
    const nextTextMuted = rgbaFromHex(theme.textColor, 0.58)
    const useHelveticaTracking = theme.fontFamily.toLowerCase().includes('helvetica')
    const overlayOpacityPercent = theme.overlayOpacity <= 1 ? theme.overlayOpacity * 100 : theme.overlayOpacity
    const nextOverlayOpacityNormalized = Math.min(1, Math.max(0, overlayOpacityPercent / 100))

    const heavyBlurPx = Math.max(28, theme.boxBlur * 1.4)
    const mediumBlurPx = Math.max(20, theme.boxBlur * 1.0)

    const cardMaterial: CSSProperties = {
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: `blur(${heavyBlurPx}px) saturate(160%)`,
      WebkitBackdropFilter: `blur(${heavyBlurPx}px) saturate(160%)`,
    }

    const nextLicensePanelStyle: CSSProperties = {
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: `blur(${heavyBlurPx}px) saturate(160%)`,
      WebkitBackdropFilter: `blur(${heavyBlurPx}px) saturate(160%)`,
    }

    const nextLicenseCardStyle: CSSProperties = {
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: `blur(${mediumBlurPx}px) saturate(150%)`,
      WebkitBackdropFilter: `blur(${mediumBlurPx}px) saturate(150%)`,
    }

    const nextVisualizerFallbackBlur = `blur(${Math.max(6, theme.boxBlur * 0.35).toFixed(1)}px)`

    const nextVisualizerStyle: CSSProperties = {
      backgroundColor: 'rgba(255,255,255,0.06)',
      backdropFilter: hasMedia ? 'saturate(110%)' : `blur(${mediumBlurPx}px)`,
      WebkitBackdropFilter: hasMedia ? 'saturate(110%)' : `blur(${mediumBlurPx}px)`,
    }

    const nextMetadataPanelStyle: CSSProperties = {
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: `blur(${heavyBlurPx}px) saturate(160%)`,
      WebkitBackdropFilter: `blur(${heavyBlurPx}px) saturate(160%)`,
    }

    const nextTitleTypographyStyle: CSSProperties = {
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      letterSpacing: useHelveticaTracking ? '0.012em' : '0.02em',
    }

    const nextSpecLabelTypographyStyle: CSSProperties = {
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      letterSpacing: useHelveticaTracking ? '0.08em' : '0.1em',
    }

    const nextSpecValueTypographyStyle: CSSProperties = {
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      letterSpacing: useHelveticaTracking ? '0.005em' : '0.01em',
      color: nextTextSecondary,
    }

    const nextLicenseNameTypographyStyle: CSSProperties = {
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      letterSpacing: useHelveticaTracking ? '0.008em' : '0.01em',
    }

    const nextLicenseDescriptionTypographyStyle: CSSProperties = {
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
    }

    return {
      textPrimary: nextTextPrimary,
      textMuted: nextTextMuted,
      specDotColor: 'rgba(31,41,55,0.46)',
      titleTypographyStyle: nextTitleTypographyStyle,
      specLabelTypographyStyle: nextSpecLabelTypographyStyle,
      specValueTypographyStyle: nextSpecValueTypographyStyle,
      licenseNameTypographyStyle: nextLicenseNameTypographyStyle,
      licenseDescriptionTypographyStyle: nextLicenseDescriptionTypographyStyle,
      overlayOpacityNormalized: nextOverlayOpacityNormalized,
      cardMaterialStyle: cardMaterial,
      licensePanelStyle: nextLicensePanelStyle,
      licenseCardStyle: nextLicenseCardStyle,
      visualizerFallbackBlur: nextVisualizerFallbackBlur,
      visualizerStyle: nextVisualizerStyle,
      metadataPanelStyle: nextMetadataPanelStyle,
    }
  }, [
    hasMedia,
    theme.boxBlur,
    theme.fontFamily,
    theme.fontWeight,
    theme.overlayOpacity,
    theme.textColor,
  ])

  const cardElevationShadow = isActive
    ? '0 24px 60px -12px rgba(0,0,0,0.25), 0 8px 24px -8px rgba(0,0,0,0.12)'
    : '0 12px 36px -10px rgba(0,0,0,0.18), 0 4px 14px -4px rgba(0,0,0,0.08)'

  const [portalReady, setPortalReady] = useState(false)
  useEffect(() => {
    setPortalReady(true)
  }, [])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const gpuTransformStyle = useMemo<CSSProperties>(
    () => ({ transform: 'translateZ(0)', willChange: 'transform' }),
    []
  )
  const gpuOpacityStyle = useMemo<CSSProperties>(
    () => ({ transform: 'translateZ(0)', willChange: 'opacity' }),
    []
  )

  const handleOpenExpansion = () => {
    if (hasVideo) {
      setShouldLoadVideo(true)
    }

    setShowExpandedDetails(true)
    onSelect(beatId)
  }

  const handleCloseExpansion = () => {
    setShowExpandedDetails(false)
    onCloseExpansion()
  }

  const seekToClientX = (clientX: number) => {
    const track = seekTrackRef.current
    const audio = audioRef.current
    if (!track || !audio || duration <= 0) return
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const nextTime = ratio * duration
    try {
      audio.currentTime = nextTime
    } catch {}
    setCurrentTime(nextTime)
  }

  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    isSeekingRef.current = true
    seekToClientX(event.clientX)
  }

  const handleTrackPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeekingRef.current) return
    event.stopPropagation()
    seekToClientX(event.clientX)
  }

  const handleTrackPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeekingRef.current) return
    isSeekingRef.current = false
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {}
  }

  const handleAddLicenseToCart = (license: LicenseOption) => {
    onAddToCart({
      beatId,
      beatTitle: title,
      licenseId: license.id,
      licenseName: license.name,
      priceLabel: license.priceLabel,
    })
  }

  const renderPlayerPanel = () => (
    <>
      {audioSrc ? (
        <audio
          ref={audioRef}
          src={audioSrc}
          crossOrigin="anonymous"
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        />
      ) : null}

      <div
        className="rounded-xl px-5 py-4"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="group"
        style={metadataPanelStyle}
      >
        <div
          ref={seekTrackRef}
          role="slider"
          aria-label="Posición del audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          tabIndex={0}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
          className="group relative flex h-7 w-full cursor-pointer touch-none select-none items-center"
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black/15" />
          <div
            className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black/75 transition-[height] group-hover:h-[5px]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between [font-family:var(--font-body)] text-[0.7rem] font-medium tabular-nums text-slate-700/80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </>
  )

  const renderSpec = (label: string, value: string) => (
    <div className="flex flex-col gap-1 px-3 py-2 sm:px-0 sm:py-0">
      <p
        className="flex items-center gap-2 [font-family:var(--font-body)] text-[0.64rem] font-semibold uppercase tracking-[0.12em]"
        style={{ ...specLabelTypographyStyle, color: textMuted }}
      >
        <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: specDotColor }} />
        {label}
      </p>
      <p className="[font-family:var(--font-body)] text-[0.98rem]" style={specValueTypographyStyle}>
        {value || '—'}
      </p>
    </div>
  )

  const renderMetadataPanel = () => (
    <div
      className="rounded-xl px-5 py-4"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="group"
      style={metadataPanelStyle}
    >
      <h2
        className="[font-family:var(--font-title)] text-[clamp(1.55rem,2.8vw,2rem)] font-extrabold leading-[1.1] tracking-[0.02em]"
        style={{ ...titleTypographyStyle, color: textPrimary }}
      >
        {title}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-black/[0.08]">
        {renderSpec('BPM', bpm)}
        {renderSpec('Genero', genre)}
        {renderSpec('Tono', tone)}
      </div>
    </div>
  )

  const renderCardVisual = (showPlayer: boolean) => (
    <div className="relative flex flex-col gap-4 overflow-hidden">
      <motion.div
        layout
        layoutId={visualizerLayoutId}
        ref={visualizerRef}
        className={`relative overflow-hidden rounded-xl shadow-[0_12px_36px_-10px_rgba(0,0,0,0.18)] ${
          showPlayer ? 'min-h-[300px] sm:min-h-[340px]' : 'min-h-[190px]'
        }`}
        style={{
          ...visualizerStyle,
          borderRadius: 16,
        }}
        transition={appleSpring}
      >
        {isImageVisualizer ? (
          <motion.img
            layout
            layoutId={visualizerMediaLayoutId}
            src={videoSrc}
            alt={`${title} cover art`}
            decoding="async"
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ borderRadius: 16, objectFit: 'cover', width: '100%', height: '100%' }}
            transition={appleSpring}
          />
        ) : hasVideo && shouldLoadVideo ? (
          <motion.video
            layout
            layoutId={visualizerMediaLayoutId}
            ref={(el) => {
              visualVideoRef.current = el

              if (!el) {
                return
              }

              const seed = readSyncSeedTime(videoSrc, persistedVideoTimeRef.current)
              if (seed > 0) {
                try {
                  el.currentTime = seed
                } catch {}
              }

              if (!videoSrc) {
                return
              }
              return registerSyncedVideo(videoSrc, el)
            }}
            src={videoSrc ?? undefined}
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              borderRadius: 16,
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onTimeUpdate={(event) => {
              persistedVideoTimeRef.current = event.currentTarget.currentTime
            }}
            onPlay={() => {
              persistedVideoWasPlayingRef.current = true
            }}
            onPause={() => {
              persistedVideoWasPlayingRef.current = false
            }}
            transition={appleSpring}
          />
        ) : hasVideo ? (
          <motion.div
            layout
            layoutId={visualizerMediaLayoutId}
            className="absolute inset-0 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(0,0,0,0.08)_100%)]"
            style={{ borderRadius: 16 }}
            transition={appleSpring}
          />
        ) : (
          <motion.div
            layout
            layoutId={visualizerMediaLayoutId}
            className="absolute inset-0 overflow-hidden rounded-xl"
            style={{ borderRadius: 16 }}
            transition={appleSpring}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.06) 36%, rgba(0,0,0,0.18) 100%)',
                backdropFilter: visualizerFallbackBlur,
                WebkitBackdropFilter: visualizerFallbackBlur,
              }}
            />

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 600 220"
              preserveAspectRatio="none"
            >
              <path
                className="beat-wave-path"
                d="M0 112 C 40 86, 90 142, 140 112 C 190 82, 240 142, 290 112 C 340 84, 390 140, 440 112 C 490 88, 540 138, 600 112"
                stroke="rgba(31,41,55,0.38)"
              />
              <path
                className="beat-wave-path beat-wave-path--alt"
                d="M0 118 C 55 96, 105 146, 155 118 C 205 90, 255 146, 305 118 C 355 92, 405 146, 455 118 C 505 96, 555 146, 600 118"
                stroke="rgba(31,41,55,0.26)"
              />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {showPlayer ? (
        <AnimatePresence>
          {showExpandedDetails ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex flex-col gap-4"
            >
              {renderPlayerPanel()}
              {renderMetadataPanel()}
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : (
        renderMetadataPanel()
      )}
    </div>
  )

  const expandedOverlay = (
    <AnimatePresence>
        {isActive ? (
          <motion.div className="fixed inset-0 z-40" onClick={handleCloseExpansion} role="presentation">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              style={gpuOpacityStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08, ease: quickEase }}
            />

            <div className="relative z-50 flex h-full w-full items-center justify-center p-4">
              <motion.div
                className="relative w-full"
                style={gpuTransformStyle}
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
              >
                <button
                  type="button"
                  className="absolute right-3 top-3 z-[2] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-md transition hover:bg-black/60"
                  onClick={handleCloseExpansion}
                  aria-label="Cerrar vista expandida"
                >
                  <span className="text-base leading-none">×</span>
                </button>

                <motion.div
                  layout
                  className={`mx-auto flex w-full flex-row items-center justify-center gap-4 ${showExpandedDetails ? 'max-w-[1120px]' : 'max-w-[560px]'}`}
                  style={gpuTransformStyle}
                  transition={appleSpring}
                >
                  <motion.div
                    layoutId={cardLayoutId}
                    className={`relative w-full overflow-hidden rounded-3xl border-none p-4 sm:p-4 ${showExpandedDetails ? 'md:w-[52%]' : ''}`}
                    style={{
                      ...cardMaterialStyle,
                      boxShadow: cardElevationShadow,
                      ...gpuTransformStyle,
                    }}
                    transition={appleSpring}
                  >
                    {renderCardVisual(true)}
                  </motion.div>

                  <AnimatePresence>
                    {showExpandedDetails ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.2 } }}
                        exit={{ opacity: 0, transition: { duration: 0.05 } }}
                        className="w-full md:w-[48%]"
                      >
                        <motion.div
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.05 } }}
                        >
                          <motion.aside
                            className="relative w-full overflow-hidden rounded-3xl border-none p-4"
                            style={{
                              ...licensePanelStyle,
                              boxShadow: cardElevationShadow,
                              ...gpuTransformStyle,
                            }}
                          >
                            <div
                              className="pointer-events-none absolute inset-0"
                              style={{
                                background:
                                  'linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0) 100%)',
                              }}
                            />

                            <div className="relative">
                              <h4 className="[font-family:var(--font-title)] text-[clamp(1.5rem,4vw,2.2rem)] font-extrabold leading-[1] text-slate-900/95">
                                Licencias
                              </h4>
                              <p className="mt-1 [font-family:var(--font-body)] text-[0.74rem] uppercase tracking-[0.12em] text-slate-700/80">
                                Elige una licencia
                              </p>

                              <div className="mt-4 grid grid-cols-1 gap-3">
                                {LICENSE_OPTIONS.map((license) => (
                                  <article key={license.id} className="rounded-xl border-none p-4" style={licenseCardStyle}>
                                    <div className="flex items-start justify-between gap-3">
                                      <h5
                                        className="[font-family:var(--font-title)] text-[1.25rem] font-extrabold leading-[1.05] text-slate-900/95"
                                        style={licenseNameTypographyStyle}
                                      >
                                        {license.name}
                                      </h5>
                                      <p className="[font-family:var(--font-body)] text-[0.88rem] font-bold text-slate-900">
                                        {license.priceLabel}
                                      </p>
                                    </div>

                                    <p
                                      className="mt-2 [font-family:var(--font-body)] text-[0.74rem] leading-relaxed text-slate-700/85"
                                      style={licenseDescriptionTypographyStyle}
                                    >
                                      {license.description}
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() => handleAddLicenseToCart(license)}
                                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl border-none bg-black/10 px-3 py-2 [font-family:var(--font-body)] text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-800 transition hover:bg-black/15"
                                    >
                                      Anadir al carrito
                                    </button>
                                  </article>
                                ))}
                              </div>
                            </div>
                          </motion.aside>
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
  )

  return (
    <>
      {!isActive ? (
        <motion.div
          layoutId={cardLayoutId}
          role="button"
          tabIndex={0}
          onClick={handleOpenExpansion}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) {
              return
            }

            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleOpenExpansion()
            }
          }}
          className="relative w-full cursor-pointer overflow-hidden rounded-2xl border-none p-4 text-left"
          style={{
            ...cardMaterialStyle,
            boxShadow: cardElevationShadow,
            ...gpuTransformStyle,
          }}
          aria-pressed={isActive}
          transition={appleSpring}
        >
          {renderCardVisual(false)}
        </motion.div>
      ) : null}

      {portalReady ? createPortal(expandedOverlay, document.body) : null}
    </>
  )
}

function areBeatCardPropsEqual(previousProps: BeatCardProps, nextProps: BeatCardProps) {
  return (
    previousProps.beatId === nextProps.beatId &&
    previousProps.title === nextProps.title &&
    previousProps.bpm === nextProps.bpm &&
    previousProps.genre === nextProps.genre &&
    previousProps.tone === nextProps.tone &&
    previousProps.videoSrc === nextProps.videoSrc &&
    previousProps.audioSrc === nextProps.audioSrc &&
    previousProps.theme === nextProps.theme &&
    previousProps.isActive === nextProps.isActive &&
    previousProps.onSelect === nextProps.onSelect &&
    previousProps.onCloseExpansion === nextProps.onCloseExpansion &&    
    previousProps.onAddToCart === nextProps.onAddToCart
  )
}

const BeatCard = memo(BeatCardComponent, areBeatCardPropsEqual)

export default BeatCard
