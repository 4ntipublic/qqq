'use client'

import { LayoutGroup } from 'framer-motion'
import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import BeatCard, { type BeatCardTheme, type BeatCartPayload } from './BeatCard'
import CartBubble from './CartBubble'
import { ThemeProvider, useThemeCustomizer } from './ThemeContext'
import ThemeCustomizer from './ThemeCustomizer'
import { rgbaFromHex } from './themeColor'

const beats = [
  {
    id: 'beat-001',
    title: 'sent type beat',
    bpm: '144bpm',
    genre: 'Trap / Jerk',
    tone: 'Ab Minor',
    videoSrc: '/assets/sentfck.mp4',
  },
  {
    id: 'beat-002',
    title: 'sent type beat',
    bpm: '142bpm',
    genre: 'Trap / Jerk',
    tone: 'F Minor',
    videoSrc: '/assets/sentfck.mp4',
  },
  {
    id: 'beat-003',
    title: 'sent type beat',
    bpm: '148bpm',
    genre: 'Trap / Jerk',
    tone: 'C Minor',
    videoSrc: '/assets/sentfck.mp4',
  },
]

function DashboardScene() {
  const [activeBeatId, setActiveBeatId] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<BeatCartPayload[]>([])
  const { theme } = useThemeCustomizer()
  const headingColor = rgbaFromHex(theme.textColor, 0.96)
  const isHelveticaTypography = theme.fontFamily.toLowerCase().includes('helvetica')

  const handleAddToCart = useCallback((item: BeatCartPayload) => {
    setCartItems((currentItems) => [...currentItems, item])
  }, [])

  const handleSelectBeat = useCallback((beatId: string) => {
    setActiveBeatId(beatId)
  }, [])

  const handleCloseBeatExpansion = useCallback(() => {
    setActiveBeatId(null)
  }, [])

  const beatCardTheme = useMemo<BeatCardTheme>(
    () => ({
      accentColor: theme.accentColor,
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      boxColor: theme.boxColor,
      boxBlur: theme.boxBlur,
      boxOpacity: theme.boxOpacity,
      boxShadowOpacity: theme.boxShadowOpacity,
      expandedOverlayColor: theme.expandedOverlayColor,
      overlayOpacity: theme.overlayOpacity,
    }),
    [
      theme.accentColor,
      theme.textColor,
      theme.fontFamily,
      theme.fontWeight,
      theme.boxColor,
      theme.boxBlur,
      theme.boxOpacity,
      theme.boxShadowOpacity,
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
      <CartBubble items={cartItems} />
      <ThemeCustomizer />

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
              akpkyy
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
        </div>
      </LayoutGroup>
    </>
  )
}

export default function DashboardClient() {
  return (
    <ThemeProvider>
      <DashboardScene />
    </ThemeProvider>
  )
}
