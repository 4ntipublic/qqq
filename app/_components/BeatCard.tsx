'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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

// ============================================================================
// Cross-instance video sync (frame-accurate)
// ============================================================================
// Every <motion.video> that shares the same src registers itself here. A single
// requestAnimationFrame loop runs at refresh-rate (~60Hz) and snaps any laggard
// video whose currentTime is behind the leader by more than
// VIDEO_SYNC_TOLERANCE_SECONDS. This replaces the previous onTimeUpdate-based
// master clock which was both throttled (~250ms) and prone to leader oscillation,
// leaving up to 0.2s residual offsets visible after a FLIP remount.

const syncedVideoRegistry = new Map<string, Set<HTMLVideoElement>>()
const VIDEO_SYNC_TOLERANCE_SECONDS = 0.08
const VIDEO_LOOP_WRAP_GUARD_SECONDS = 1.5

let syncRafHandle: number | null = null

const runSyncPass = () => {
  syncedVideoRegistry.forEach((videos) => {
    if (videos.size < 2) {
      return
    }

    // Elect the leader: the furthest-advanced video that is actually playing
    // and has decoded metadata. Ignore elements that just (re)mounted.
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

    // Snap any laggard forward. Skip gaps larger than LOOP_WRAP_GUARD to avoid
    // fighting a natural loop wraparound (near-end leader vs near-start laggard).
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
        } catch {
          // Ignore seek races while media is still hydrating.
        }
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

// Read the best seed time for a freshly mounted video: prefer any living peer
// that has already decoded metadata, fall back to the per-card persisted time,
// otherwise return 0 (natural start).
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
  const hasVideo = Boolean(videoSrc)

  const [editableBpm, setEditableBpm] = useState(bpm)
  const [editableGenre, setEditableGenre] = useState(genre)
  const [editableTone, setEditableTone] = useState(tone)
  const [showExpandedDetails, setShowExpandedDetails] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(!hasVideo)

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
        setIsPlaying(false)
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
    if (isActive) {
      return
    }

    // On close: pause the audio player only. Do NOT reset video time or
    // persistedVideoTimeRef: the remounted grid video must re-join the sibling
    // pool at the current master frame, not at 0, to avoid a visible desync.
    audioRef.current?.pause()
  }, [isActive])

  useLayoutEffect(() => {
    const visualizerVideo = visualVideoRef.current

    if (!visualizerVideo) {
      return
    }

    // Synchronous-after-commit safety seek. rAF will continue snapping the
    // video to the leader every frame once it is playing.
    const seed = readSyncSeedTime(videoSrc, persistedVideoTimeRef.current)
    if (seed <= 0) {
      return
    }

    try {
      visualizerVideo.currentTime = seed
    } catch {
      // Ignore seek races if the browser has not prepared enough data yet.
    }
  }, [isActive, shouldLoadVideo, videoSrc])

  useEffect(() => {
    const visualizerVideo = visualVideoRef.current

    if (!visualizerVideo) {
      return
    }

    // Resume playback if the browser paused the element (e.g. visibility change)
    // or if autoplay was blocked momentarily. The rAF loop owns frame-accurate
    // time alignment; we only handle the play-state recovery here.
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
    licenseNameTypographyStyle,
    licenseDescriptionTypographyStyle,
    overlayOpacityNormalized,
    cardMaterialStyle,
    licensePanelStyle,
    licenseCardStyle,
    visualizerFallbackBlur,
    visualizerStyle,
    metadataPanelStyle,
    editableInputStyle,
  } = useMemo(() => {
    const nextTextPrimary = rgbaFromHex(theme.textColor, 0.94)
    const nextTextSecondary = rgbaFromHex(theme.textColor, 0.78)
    const nextTextMuted = rgbaFromHex(theme.textColor, 0.62)
    const useHelveticaTracking = theme.fontFamily.toLowerCase().includes('helvetica')
    const overlayOpacityPercent = theme.overlayOpacity <= 1 ? theme.overlayOpacity * 100 : theme.overlayOpacity
    const nextOverlayOpacityNormalized = Math.min(1, Math.max(0, overlayOpacityPercent / 100))

    // Base card material: stable across the isActive toggle so Framer Motion's
    // FLIP animation and sibling cards never recompute this block on open/close.
    // The dynamic boxShadow is applied at the JSX call site via a ternary.
    const cardMaterial: CSSProperties = {
      background: 'rgba(255,255,255,0.40)',
      backdropFilter: `blur(${Math.max(12, theme.boxBlur * 0.7)}px)`,
      WebkitBackdropFilter: `blur(${Math.max(12, theme.boxBlur * 0.7)}px)`,
      border: '1px solid rgba(255,255,255,0.58)',
    }

    const nextLicensePanelStyle: CSSProperties = {
      background: 'rgba(255,255,255,0.42)',
      backdropFilter: `blur(${Math.max(16, theme.boxBlur)}px)`,
      WebkitBackdropFilter: `blur(${Math.max(16, theme.boxBlur)}px)`,
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    }

    const nextLicenseCardStyle: CSSProperties = {
      background: 'rgba(255,255,255,0.4)',
      border: '1px solid rgba(255,255,255,0.58)',
      boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }

    const nextVisualizerFallbackBlur = `blur(${Math.max(6, theme.boxBlur * 0.35).toFixed(1)}px)`

    const nextVisualizerStyle: CSSProperties = {
      backgroundColor: 'rgba(255,255,255,0.38)',
      backdropFilter: hasVideo ? 'saturate(108%)' : `blur(${Math.max(12, theme.boxBlur * 0.7)}px)`,
      WebkitBackdropFilter: hasVideo ? 'saturate(108%)' : `blur(${Math.max(12, theme.boxBlur * 0.7)}px)`,
    }

    const nextMetadataPanelStyle: CSSProperties = {
      backgroundColor: 'rgba(255,255,255,0.40)',
      backdropFilter: `blur(${Math.max(12, theme.boxBlur * 0.7)}px)`,
      WebkitBackdropFilter: `blur(${Math.max(12, theme.boxBlur * 0.7)}px)`,
    }

    const nextEditableInputStyle: CSSProperties = {
      color: nextTextSecondary,
      caretColor: 'rgba(17,24,39,0.84)',
      ['--editable-focus' as string]: 'rgba(17,24,39,0.24)',
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      letterSpacing: useHelveticaTracking ? '0.005em' : '0.01em',
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
      licenseNameTypographyStyle: nextLicenseNameTypographyStyle,
      licenseDescriptionTypographyStyle: nextLicenseDescriptionTypographyStyle,
      overlayOpacityNormalized: nextOverlayOpacityNormalized,
      cardMaterialStyle: cardMaterial,
      licensePanelStyle: nextLicensePanelStyle,
      licenseCardStyle: nextLicenseCardStyle,
      visualizerFallbackBlur: nextVisualizerFallbackBlur,
      visualizerStyle: nextVisualizerStyle,
      metadataPanelStyle: nextMetadataPanelStyle,
      editableInputStyle: nextEditableInputStyle,
    }
  }, [
    hasVideo,
    theme.boxBlur,
    theme.fontFamily,
    theme.fontWeight,
    theme.overlayOpacity,
    theme.textColor,
  ])

  // Dynamic elevation applied per render-branch; kept out of the memo so the
  // isActive flip never invalidates the expensive style block above.
  const cardElevationShadow = isActive
    ? '0 10px 34px rgba(0,0,0,0.1)'
    : '0 8px 30px rgba(0,0,0,0.08)'

  const editableFieldClassName =
    'mt-1 w-full rounded-xl border border-transparent bg-transparent px-1 py-0.5 text-[0.98rem] outline-none transition focus:border-[var(--editable-focus)] focus:bg-black/[0.04]'

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
    setIsPlaying(false)
    setShowExpandedDetails(false)
    onCloseExpansion()
  }

  const handleTogglePlayback = async () => {
    if (!audioRef.current) {
      return
    }

    if (audioRef.current.paused) {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
      return
    }

    audioRef.current.pause()
    setIsPlaying(false)
  }

  const handleSeek = (nextPercent: number) => {
    if (!audioRef.current || duration <= 0) {
      return
    }

    const nextTime = (nextPercent / 100) * duration
    audioRef.current.currentTime = nextTime
    setCurrentTime(nextTime)
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
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={videoSrc ?? '/assets/sentfck.mp4'} type="audio/mp4" />
      </audio>

      <div
        className="rounded-xl border border-white/60 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="group"
        style={metadataPanelStyle}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              void handleTogglePlayback()
            }}
            onKeyDown={(event) => event.stopPropagation()}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-slate-700/20 bg-black/5 px-3 [font-family:var(--font-body)] text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-slate-700"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={(event) => {
                event.stopPropagation()
                handleSeek(Number(event.target.value))
              }}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-slate-700"
              aria-label="Posicion del audio"
            />
          </div>

          <p className="[font-family:var(--font-body)] text-[0.72rem] font-semibold text-slate-700/90">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
      </div>
    </>
  )

  const renderMetadataPanel = () => (
    <div
      className="rounded-xl border border-white/60 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="group"
      style={metadataPanelStyle}
    >
      <h2
        className="[font-family:var(--font-title)] text-[clamp(1.55rem,2.8vw,2rem)] font-extrabold leading-[1.1] tracking-[0.02em]"
        style={{
          ...titleTypographyStyle,
          color: textPrimary,
        }}
      >
        {title}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:divide-x sm:divide-black/[0.08]">
        <div className="rounded-xl bg-black/[0.02] px-3 py-2 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:pr-3">
          <p
            className="flex items-center gap-2 [font-family:var(--font-body)] text-[0.64rem] font-semibold uppercase tracking-[0.12em]"
            style={{
              ...specLabelTypographyStyle,
              color: textMuted,
            }}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: specDotColor }} />
            BPM
          </p>
          <input
            value={editableBpm}
            onChange={(event) => setEditableBpm(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            className={editableFieldClassName}
            style={editableInputStyle}
            aria-label="Editar BPM"
          />
        </div>

        <div className="rounded-xl bg-black/[0.02] px-3 py-2 sm:rounded-none sm:bg-transparent sm:px-3 sm:py-0">
          <p
            className="flex items-center gap-2 [font-family:var(--font-body)] text-[0.64rem] font-semibold uppercase tracking-[0.12em]"
            style={{
              ...specLabelTypographyStyle,
              color: textMuted,
            }}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: specDotColor }} />
            Genero
          </p>
          <input
            value={editableGenre}
            onChange={(event) => setEditableGenre(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            className={editableFieldClassName}
            style={editableInputStyle}
            aria-label="Editar genero"
          />
        </div>

        <div className="rounded-xl bg-black/[0.02] px-3 py-2 sm:rounded-none sm:bg-transparent sm:px-3 sm:py-0">
          <p
            className="flex items-center gap-2 [font-family:var(--font-body)] text-[0.64rem] font-semibold uppercase tracking-[0.12em]"
            style={{
              ...specLabelTypographyStyle,
              color: textMuted,
            }}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: specDotColor }} />
            Tono
          </p>
          <input
            value={editableTone}
            onChange={(event) => setEditableTone(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            className={editableFieldClassName}
            style={editableInputStyle}
            aria-label="Editar tono"
          />
        </div>
      </div>
    </div>
  )

  const renderCardVisual = (showPlayer: boolean) => (
    <div className="relative flex flex-col gap-4">
      <motion.div
        layout
        layoutId={visualizerLayoutId}
        ref={visualizerRef}
        className="relative min-h-[190px] overflow-hidden rounded-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        style={{
          ...visualizerStyle,
          borderRadius: 16,
        }}
        transition={appleSpring}
      >
        {hasVideo && shouldLoadVideo ? (
          <motion.video
            layout
            layoutId={visualizerMediaLayoutId}
            ref={(el) => {
              visualVideoRef.current = el

              if (!el) {
                return
              }

              // On fresh mount (FLIP remount when the modal opens/closes), seed
              // the new video from the furthest-advanced living peer so it joins
              // the pool at the current frame, not at 0. rAF will hold the line
              // every frame thereafter.
              const seed = readSyncSeedTime(videoSrc, persistedVideoTimeRef.current)
              if (seed > 0) {
                try {
                  el.currentTime = seed
                } catch {
                  // Ignore callback ref races during node hydration.
                }
              }

              // React 19 callback-ref cleanup: unregister from the sync registry
              // when this element unmounts (so peers only correct against live
              // decoders).
              if (!videoSrc) {
                return
              }
              return registerSyncedVideo(videoSrc, el)
            }}
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
              // Persist time per-card so that a remounted instance has a valid
              // fallback if no peers are currently registered (e.g. navigating
              // to a page where only this card exists).
              persistedVideoTimeRef.current = event.currentTarget.currentTime
            }}
            onPlay={() => {
              persistedVideoWasPlayingRef.current = true
            }}
            onPause={() => {
              persistedVideoWasPlayingRef.current = false
            }}
            transition={appleSpring}
          >
            <source src={videoSrc} type="video/mp4" />
          </motion.video>
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
          className="relative w-full cursor-pointer overflow-hidden rounded-2xl border p-4 text-left"
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

      <AnimatePresence>
        {isActive ? (
          <motion.div className="fixed inset-0 z-40" onClick={handleCloseExpansion} role="presentation">
            <motion.div
              className="absolute inset-0 backdrop-blur-xl"
              style={{
                ...gpuOpacityStyle,
                backgroundColor: theme.expandedOverlayColor,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: overlayOpacityNormalized }}
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
                  className="absolute right-2 top-2 z-[2] inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/15 text-slate-700"
                  onClick={handleCloseExpansion}
                  aria-label="Cerrar vista expandida"
                >
                  <span className="text-lg leading-none">x</span>
                </button>

                <motion.div
                  layout
                  className={`mx-auto flex w-full flex-row items-center justify-center gap-4 ${showExpandedDetails ? 'max-w-[1120px]' : 'max-w-[560px]'}`}
                  style={gpuTransformStyle}
                  transition={appleSpring}
                >
                  <motion.div
                    layoutId={cardLayoutId}
                    className={`relative w-full overflow-hidden rounded-2xl border p-4 sm:p-4 ${showExpandedDetails ? 'md:w-[52%]' : ''}`}
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
                            className="relative w-full overflow-hidden rounded-xl border p-4"
                            style={{
                              ...licensePanelStyle,
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
                                  <article key={license.id} className="rounded-xl p-4" style={licenseCardStyle}>
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
                                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-700/20 bg-black/5 px-3 py-2 [font-family:var(--font-body)] text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-800"
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
    previousProps.theme === nextProps.theme &&
    previousProps.isActive === nextProps.isActive &&
    previousProps.onSelect === nextProps.onSelect &&
    previousProps.onCloseExpansion === nextProps.onCloseExpansion &&    
    previousProps.onAddToCart === nextProps.onAddToCart
  )
}

const BeatCard = memo(BeatCardComponent, areBeatCardPropsEqual)

export default BeatCard
