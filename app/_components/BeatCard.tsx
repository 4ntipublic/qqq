'use client'

import { AnimatePresence, motion } from 'framer-motion'
import VanillaTilt from 'vanilla-tilt'
import { memo, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
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
  accentColor: string
  textColor: string
  fontFamily: string
  fontWeight: number
  boxColor: string
  boxBlur: number
  boxOpacity: number
  boxShadowOpacity: number
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
  const tiltRef = useRef<(HTMLDivElement & { vanillaTilt?: { destroy: () => void } }) | null>(null)
  const visualizerRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const uniqueId = useId().replace(/:/g, '-')
  const cardLayoutId = `beat-card-${beatId}`
  const visualizerLayoutId = `beat-visualizer-${beatId}`
  const visualizerMediaLayoutId = `beat-visualizer-media-${beatId}`
  const gradientId = `wave-gradient-${uniqueId}`
  const blurId = `wave-blur-${uniqueId}`
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
    const tiltElement = tiltRef.current

    if (!tiltElement) {
      return
    }

    tiltElement.vanillaTilt?.destroy()

    VanillaTilt.init(tiltElement, {
      max: 10,
      speed: 400,
      glare: true,
      'max-glare': 0.15,
    })

    const tiltInstance = tiltElement.vanillaTilt

    return () => {
      tiltInstance?.destroy()
    }
  }, [])

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

    audioRef.current?.pause()
  }, [isActive])

  const {
    accentStrong,
    accentMedium,
    textPrimary,
    textMuted,
    titleTypographyStyle,
    specLabelTypographyStyle,
    licenseNameTypographyStyle,
    licenseDescriptionTypographyStyle,
    overlayOpacityNormalized,
    cardInteractiveStyle,
    licensePanelStyle,
    licenseCardStyle,
    visualizerFallbackBlur,
    visualizerStyle,
    metadataPanelStyle,
    editableInputStyle,
  } = useMemo(() => {
    const nextAccentStrong = rgbaFromHex(theme.accentColor, 0.88)
    const nextAccentMedium = rgbaFromHex(theme.accentColor, 0.62)
    const nextAccentSoft = rgbaFromHex(theme.accentColor, 0.5)
    const nextTextPrimary = rgbaFromHex(theme.textColor, 0.96)
    const nextTextSecondary = rgbaFromHex(theme.textColor, 0.78)
    const nextTextMuted = rgbaFromHex(theme.textColor, 0.66)
    const useHelveticaTracking = theme.fontFamily.toLowerCase().includes('helvetica')
    const overlayOpacityPercent = theme.overlayOpacity <= 1 ? theme.overlayOpacity * 100 : theme.overlayOpacity
    const nextOverlayOpacityNormalized = Math.min(1, Math.max(0, overlayOpacityPercent / 100))
    const baseBackground = `${theme.boxColor}${Math.round((theme.boxOpacity / 100) * 255)
      .toString(16)
      .padStart(2, '0')}`

    // Keep the glass recipe in one place so card and modal feel like the same physical surface.
    const cardMaterial: CSSProperties = {
      background: baseBackground,
      backdropFilter: `blur(${theme.boxBlur}px) saturate(180%)`,
      WebkitBackdropFilter: `blur(${theme.boxBlur}px) saturate(180%)`,
      boxShadow: `0 8px 32px 0 rgba(0,0,0,${theme.boxShadowOpacity / 100})`,
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }

    const cardInteractive: CSSProperties = {
      ...cardMaterial,
      ['--card-hover-border' as string]: rgbaFromHex(theme.accentColor, 0.56),
      ...(isActive
        ? {
            boxShadow: `0 8px 32px 0 rgba(0,0,0,${theme.boxShadowOpacity / 100}), 0 0 0 1px ${rgbaFromHex(theme.accentColor, 0.35)}`,
          }
        : null),
    }

    const panelTintOpacity = Math.max(0.14, Math.min(0.34, (theme.boxOpacity / 100) * 0.48))

    const nextLicensePanelStyle: CSSProperties = {
      background: `linear-gradient(140deg, ${rgbaFromHex(theme.boxColor, panelTintOpacity + 0.05)} 0%, ${rgbaFromHex(theme.boxColor, panelTintOpacity)} 55%, rgba(255,255,255,0.06) 100%)`,
      backdropFilter: `blur(${theme.boxBlur + 14}px) saturate(185%)`,
      WebkitBackdropFilter: `blur(${theme.boxBlur + 14}px) saturate(185%)`,
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow: `0 18px 44px rgba(0,0,0,${Math.max(0.24, theme.boxShadowOpacity / 100 - 0.08)})`,
    }

    const nextLicenseCardStyle: CSSProperties = {
      background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 24px rgba(0,0,0,${Math.max(0.16, theme.boxShadowOpacity / 100 - 0.12)})`,
      backdropFilter: 'blur(16px) saturate(175%)',
      WebkitBackdropFilter: 'blur(16px) saturate(175%)',
    }

    const nextVisualizerFallbackBlur = `blur(${Math.max(0, theme.boxBlur * 0.4).toFixed(1)}px) saturate(180%)`

    const nextVisualizerStyle: CSSProperties = {
      backgroundColor: rgbaFromHex(theme.boxColor, Math.min(1, theme.boxOpacity / 100 + 0.06)),
      backdropFilter: hasVideo ? 'saturate(180%)' : `blur(${theme.boxBlur}px) saturate(180%)`,
      WebkitBackdropFilter: hasVideo ? 'saturate(180%)' : `blur(${theme.boxBlur}px) saturate(180%)`,
    }

    const nextMetadataPanelStyle: CSSProperties = {
      backgroundColor: rgbaFromHex(theme.boxColor, Math.min(1, theme.boxOpacity / 100 + 0.1)),
      backdropFilter: `blur(${theme.boxBlur}px) saturate(180%)`,
      WebkitBackdropFilter: `blur(${theme.boxBlur}px) saturate(180%)`,
    }

    const nextEditableInputStyle: CSSProperties = {
      color: nextTextSecondary,
      caretColor: theme.accentColor,
      ['--editable-focus' as string]: nextAccentSoft,
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
      letterSpacing: useHelveticaTracking ? '0.09em' : '0.12em',
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
      accentStrong: nextAccentStrong,
      accentMedium: nextAccentMedium,
      textPrimary: nextTextPrimary,
      textMuted: nextTextMuted,
      titleTypographyStyle: nextTitleTypographyStyle,
      specLabelTypographyStyle: nextSpecLabelTypographyStyle,
      licenseNameTypographyStyle: nextLicenseNameTypographyStyle,
      licenseDescriptionTypographyStyle: nextLicenseDescriptionTypographyStyle,
      overlayOpacityNormalized: nextOverlayOpacityNormalized,
      cardInteractiveStyle: cardInteractive,
      licensePanelStyle: nextLicensePanelStyle,
      licenseCardStyle: nextLicenseCardStyle,
      visualizerFallbackBlur: nextVisualizerFallbackBlur,
      visualizerStyle: nextVisualizerStyle,
      metadataPanelStyle: nextMetadataPanelStyle,
      editableInputStyle: nextEditableInputStyle,
    }
  }, [
    hasVideo,
    isActive,
    theme.accentColor,
    theme.boxBlur,
    theme.boxColor,
    theme.boxOpacity,
    theme.boxShadowOpacity,
    theme.fontFamily,
    theme.fontWeight,
    theme.overlayOpacity,
    theme.textColor,
  ])

  const editableFieldClassName =
    'mt-1 w-full rounded-xl border border-transparent bg-transparent px-1 py-0.5 text-[0.98rem] outline-none transition focus:border-[var(--editable-focus)] focus:bg-[rgba(255,255,255,0.04)]'

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  // This easing mimics a quick macOS-like expand/minimize snap without extra spring oscillation.
  const motionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
  const quickLayoutTransition = { layout: { duration: 0.3, ease: motionEase } }
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
        className="rounded-[24px] border border-[rgba(255,255,255,0.16)] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
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
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 px-3 [font-family:var(--font-body)] text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-white/90 transition hover:bg-white/20"
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
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
              aria-label="Posicion del audio"
            />
          </div>

          <p className="[font-family:var(--font-body)] text-[0.72rem] font-semibold text-white/85">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
      </div>
    </>
  )

  const renderMetadataPanel = () => (
    <div
      className="rounded-[30px] border border-[rgba(255,255,255,0.1)] px-5 py-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
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

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:divide-x sm:divide-[rgba(255,255,255,0.08)]">
        <div className="rounded-2xl bg-[rgba(255,255,255,0.02)] px-3 py-2 sm:rounded-none sm:bg-transparent sm:px-0 sm:pr-3 sm:py-0">
          <p
            className="flex items-center gap-2 [font-family:var(--font-body)] text-[0.64rem] font-semibold uppercase tracking-[0.12em]"
            style={{
              ...specLabelTypographyStyle,
              color: textMuted,
            }}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: accentStrong }} />
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

        <div className="rounded-2xl bg-[rgba(255,255,255,0.02)] px-3 py-2 sm:rounded-none sm:bg-transparent sm:px-3 sm:py-0">
          <p
            className="flex items-center gap-2 [font-family:var(--font-body)] text-[0.64rem] font-semibold uppercase tracking-[0.12em]"
            style={{
              ...specLabelTypographyStyle,
              color: textMuted,
            }}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: accentStrong }} />
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

        <div className="rounded-2xl bg-[rgba(255,255,255,0.02)] px-3 py-2 sm:rounded-none sm:bg-transparent sm:px-3 sm:py-0">
          <p
            className="flex items-center gap-2 [font-family:var(--font-body)] text-[0.64rem] font-semibold uppercase tracking-[0.12em]"
            style={{
              ...specLabelTypographyStyle,
              color: textMuted,
            }}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: accentStrong }} />
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
        className="relative min-h-[190px] overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
        style={{
          ...visualizerStyle,
          borderRadius: 32,
        }}
        transition={quickLayoutTransition}
      >
        {hasVideo && shouldLoadVideo ? (
          <motion.video
            layout
            layoutId={visualizerMediaLayoutId}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              borderRadius: 32,
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
            autoPlay
            loop
            muted
            playsInline
            preload={showPlayer || isActive ? 'metadata' : 'none'}
          >
            <source src={videoSrc} type="video/mp4" />
          </motion.video>
        ) : hasVideo ? (
          <motion.div
            layout
            layoutId={visualizerMediaLayoutId}
            className="absolute inset-0 rounded-[32px] bg-[radial-gradient(80%_80%_at_50%_40%,rgba(255,255,255,0.08),rgba(0,0,0,0.18))]"
            style={{ borderRadius: 32 }}
          />
        ) : (
          <motion.div
            layout
            layoutId={visualizerMediaLayoutId}
            className="absolute inset-0 overflow-hidden rounded-[32px]"
            style={{ borderRadius: 32 }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 36%, rgba(0,0,0,0.26) 100%)',
                backdropFilter: visualizerFallbackBlur,
                WebkitBackdropFilter: visualizerFallbackBlur,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(120% 90% at 50% 10%, ${rgbaFromHex(theme.accentColor, 0.14)}, ${rgbaFromHex(theme.accentColor, 0.02)} 48%, rgba(0,0,0,0) 80%)`,
              }}
            />

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 600 220"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={rgbaFromHex(theme.accentColor, 0.05)} />
                  <stop offset="18%" stopColor={accentMedium} />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
                  <stop offset="82%" stopColor={accentMedium} />
                  <stop offset="100%" stopColor={rgbaFromHex(theme.accentColor, 0.05)} />
                </linearGradient>
                <filter id={blurId} x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="1.6" />
                </filter>
              </defs>

              <path
                className="beat-wave-path"
                d="M0 112 C 40 86, 90 142, 140 112 C 190 82, 240 142, 290 112 C 340 84, 390 140, 440 112 C 490 88, 540 138, 600 112"
                stroke={`url(#${gradientId})`}
                filter={`url(#${blurId})`}
              />
              <path
                className="beat-wave-path beat-wave-path--alt"
                d="M0 118 C 55 96, 105 146, 155 118 C 205 90, 255 146, 305 118 C 355 92, 405 146, 455 118 C 505 96, 555 146, 600 118"
                stroke={`url(#${gradientId})`}
              />
            </svg>

            <div
              className="pointer-events-none beat-wave-glow"
              style={{
                background: `radial-gradient(circle, ${rgbaFromHex(theme.accentColor, 0.44)} 0%, ${rgbaFromHex(theme.accentColor, 0.2)} 34%, ${rgbaFromHex(theme.accentColor, 0)} 75%)`,
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {showPlayer ? (
        <AnimatePresence mode="wait">
          {showExpandedDetails ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
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
          ref={tiltRef}
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
          className="group relative w-full cursor-pointer overflow-hidden rounded-[42px] border p-4 text-left transition-all duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-[2px] hover:border-[var(--card-hover-border)]"
          style={{
            ...cardInteractiveStyle,
            ...gpuTransformStyle,
          }}
          aria-pressed={isActive}
          transition={quickLayoutTransition}
        >
          {renderCardVisual(false)}
        </motion.div>
      ) : null}

      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            className="fixed inset-0 z-40"
            onClick={handleCloseExpansion}
            role="presentation"
          >
            <motion.div
              className="absolute inset-0 backdrop-blur-2xl"
              style={{
                ...gpuOpacityStyle,
                backgroundColor: theme.expandedOverlayColor,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: overlayOpacityNormalized }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: motionEase }}
            />

            <div className="relative z-50 flex h-full w-full items-center justify-center p-4">
              <motion.div
                className="relative w-full"
                style={gpuTransformStyle}
                onClick={(event) => event.stopPropagation()}
                initial={{ scale: 0.992, y: 6 }}
                animate={{ scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.24, ease: motionEase }}
              >
                <button
                  type="button"
                  className="absolute right-2 top-2 z-[2] inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/90 transition hover:bg-black/55"
                  onClick={handleCloseExpansion}
                  aria-label="Cerrar vista expandida"
                >
                  <span className="text-lg leading-none">x</span>
                </button>

                <motion.div
                  layout
                  className={`mx-auto flex w-full flex-row items-center justify-center gap-4 ${showExpandedDetails ? 'max-w-[1120px]' : 'max-w-[560px]'}`}
                  style={gpuTransformStyle}
                  transition={quickLayoutTransition}
                >
                  <motion.div
                    layoutId={cardLayoutId}
                    className={`relative w-full overflow-hidden rounded-[42px] border p-4 sm:p-4 ${showExpandedDetails ? 'md:w-[52%]' : ''}`}
                    style={{
                      ...cardInteractiveStyle,
                      ...gpuTransformStyle,
                    }}
                    transition={quickLayoutTransition}
                  >
                    {renderCardVisual(true)}
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {showExpandedDetails ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.2 } }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="w-full md:w-[48%]"
                      >
                        <motion.aside
                          className="relative w-full overflow-hidden rounded-[30px] border p-4"
                          style={{
                            ...licensePanelStyle,
                            ...gpuTransformStyle,
                          }}
                        >
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background: `radial-gradient(120% 110% at 0% 0%, ${rgbaFromHex(theme.accentColor, 0.22)} 0%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0) 74%)`,
                          }}
                        />

                        <div className="relative">
                          <h4 className="[font-family:var(--font-title)] text-[clamp(1.5rem,4vw,2.2rem)] font-extrabold leading-[1] text-white/95">
                            Licencias
                          </h4>
                          <p className="mt-1 [font-family:var(--font-body)] text-[0.74rem] uppercase tracking-[0.12em] text-white/70">
                            Elige una licencia
                          </p>

                          <div className="mt-4 grid grid-cols-1 gap-3">
                            {LICENSE_OPTIONS.map((license) => (
                              <article
                                key={license.id}
                                className="rounded-2xl p-4 transition-colors hover:bg-white/[0.12]"
                                style={licenseCardStyle}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <h5
                                    className="[font-family:var(--font-title)] text-[1.25rem] font-extrabold leading-[1.05] text-white/95"
                                    style={licenseNameTypographyStyle}
                                  >
                                    {license.name}
                                  </h5>
                                  <p className="[font-family:var(--font-body)] text-[0.88rem] font-bold" style={{ color: rgbaFromHex(theme.accentColor, 0.95) }}>
                                    {license.priceLabel}
                                  </p>
                                </div>

                                <p
                                  className="mt-2 [font-family:var(--font-body)] text-[0.74rem] leading-relaxed text-white/80"
                                  style={licenseDescriptionTypographyStyle}
                                >
                                  {license.description}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => handleAddLicenseToCart(license)}
                                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/25 bg-white/[0.08] px-3 py-2 [font-family:var(--font-body)] text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-white/92 transition hover:bg-white/20"
                                >
                                  Anadir al carrito
                                </button>
                              </article>
                            ))}
                          </div>
                        </div>
                        </motion.aside>
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