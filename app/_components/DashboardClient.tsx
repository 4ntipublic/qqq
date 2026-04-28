'use client'

import { LayoutGroup } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import BeatCard, { type BeatCardTheme } from './BeatCard'
import { useCart } from './CartContext'
import { useThemeCustomizer } from './ThemeContext'
import { rgbaFromHex } from './themeColor'

type DashboardSceneProps = {
  title: string
  showCatalogLink: boolean
}

type DashboardClientProps = {
  title?: string
  showCatalogLink?: boolean
}

const beats = [
  {
    id: 'beat-001',
    title: 'sent type beat',
    bpm: '144bpm',
    genre: 'Trap / Jerk',
    tone: 'Ab Minor',
    videoSrc: '/assets/sentfck.mp4',
    audioSrc: '/assets/sentfck.mp4',
  },
  {
    id: 'beat-002',
    title: 'sent type beat',
    bpm: '142bpm',
    genre: 'Trap / Jerk',
    tone: 'F Minor',
    videoSrc: '/assets/sentfck.mp4',
    audioSrc: '/assets/sentfck.mp4',
  },
  {
    id: 'beat-003',
    title: 'sent type beat',
    bpm: '148bpm',
    genre: 'Trap / Jerk',
    tone: 'C Minor',
    videoSrc: '/assets/sentfck.mp4',
    audioSrc: '/assets/sentfck.mp4',
  },
]

function DashboardScene({ title, showCatalogLink }: DashboardSceneProps) {
  const [activeBeatId, setActiveBeatId] = useState<string | null>(null)
  const { addItem } = useCart()
  const { theme } = useThemeCustomizer()
  const headingColor = rgbaFromHex(theme.textColor, 0.96)
  const isHelveticaTypography = theme.fontFamily.toLowerCase().includes('helvetica')

  const handleAddToCart = addItem

  const handleSelectBeat = useCallback((beatId: string) => {
    setActiveBeatId(beatId)
  }, [])

  const handleCloseBeatExpansion = useCallback(() => {
    setActiveBeatId(null)
  }, [])

  const beatCardTheme = useMemo<BeatCardTheme>(
    () => ({
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      boxBlur: theme.boxBlur,
      expandedOverlayColor: theme.expandedOverlayColor,
      overlayOpacity: theme.overlayOpacity,
    }),
    [
      theme.textColor,
      theme.fontFamily,
      theme.fontWeight,
      theme.boxBlur,
      theme.expandedOverlayColor,
      theme.overlayOpacity,
    ]
  )

  const globalTypographyStyle = useMemo<CSSProperties>(
    () =>
      ({
        ['--global-font' as string]: theme.fontFamily,
        ['--global-weight' as string]: String(theme.fontWeight),
        ['--global-heading-tracking' as string]: isHelveticaTypography ? '0.048em' : '0.08em',
      }) as CSSProperties,
    [isHelveticaTypography, theme.fontFamily, theme.fontWeight]
  )

  return (
    <>
      <LayoutGroup id="beat-catalog-layout">
        <div
          className="relative z-[1] flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#f3f4f6] to-[#e5e7eb] px-4 py-7 sm:px-8 sm:py-10"
          style={globalTypographyStyle}
        >
          <header
            className={`mb-8 w-full text-center transition-opacity duration-300 sm:mb-10 ${activeBeatId ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          >
            <h1
              className="mx-auto [font-family:var(--global-font)] text-[clamp(3.2rem,8vw,5.8rem)] font-[var(--global-weight)] leading-[0.9] tracking-[var(--global-heading-tracking)]"
              style={{ color: headingColor }}
            >
              {title}
            </h1>
          </header>

          <section className="grid w-full max-w-[1200px] grid-cols-1 gap-5 lg:grid-cols-3">
            {beats.map((beat) => {
              const hideCard = activeBeatId !== null && activeBeatId !== beat.id

              return (
                <div
                  key={beat.id}
                  className={`transition-opacity duration-300 ${hideCard ? 'pointer-events-none invisible opacity-0' : 'visible opacity-100'}`}
                >
                  <BeatCard
                    beatId={beat.id}
                    title={beat.title}
                    bpm={beat.bpm}
                    genre={beat.genre}
                    tone={beat.tone}
                    videoSrc={beat.videoSrc}
                    audioSrc={beat.audioSrc}
                    theme={beatCardTheme}
                    isActive={activeBeatId === beat.id}
                    onSelect={handleSelectBeat}
                    onCloseExpansion={handleCloseBeatExpansion}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              )
            })}
          </section>

          {showCatalogLink ? (
            <div className="mt-6 flex w-full max-w-[1200px] justify-center">
              <Link
                href="/beats"
                className="rounded-xl border border-black/15 bg-white/10 px-5 py-2 text-[0.84rem] font-light tracking-[0.02em] text-slate-800"
              >
                Ver catálogo completo
              </Link>
            </div>
          ) : null}
        </div>
      </LayoutGroup>
    </>
  )
}

export default function DashboardClient({
  title = 'akpkyy',
  showCatalogLink = true,
}: DashboardClientProps = {}) {
  return <DashboardScene title={title} showCatalogLink={showCatalogLink} />
}
