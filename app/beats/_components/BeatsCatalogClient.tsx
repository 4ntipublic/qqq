'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { LayoutGrid, List, Search, ShoppingBag, X } from 'lucide-react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import BeatCard, {
  type BeatCardTheme,
  type BeatCartPayload,
} from '@/app/_components/BeatCard'
import { useCart } from '@/app/_components/CartContext'
import { useThemeCustomizer } from '@/app/_components/ThemeContext'
import { WaveformRow, type CatalogBeat } from './WaveformRow'

interface BeatsCatalogClientProps {
  beats: CatalogBeat[]
  categories: string[]
}

type LicenseDef = {
  id: string
  name: string
  priceLabel: string
  price: number
  description: string
}

const LICENSES: LicenseDef[] = [
  { id: 'mp3-lease', name: 'MP3 Lease', priceLabel: '$20', price: 20, description: 'Incluye MP3 a 320kbps.' },
  { id: 'wav-lease', name: 'WAV Lease', priceLabel: '$25', price: 25, description: 'Incluye WAV + MP3.' },
  { id: 'trackouts', name: 'Trackouts (Stems)', priceLabel: '$40', price: 40, description: 'Incluye stems + WAV + MP3.' },
]

export default function BeatsCatalogClient({ beats, categories }: BeatsCatalogClientProps) {
  const cart = useCart()
  const { theme } = useThemeCustomizer()

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [query, setQuery] = useState('')
  const bpmBounds = useMemo<[number, number]>(() => {
    if (beats.length === 0) return [50, 250]
    const all = beats.map((b) => b.bpm).filter((n) => Number.isFinite(n))
    if (all.length === 0) return [50, 250]
    return [Math.min(50, ...all), Math.max(250, ...all)]
  }, [beats])
  const [bpmRange, setBpmRange] = useState<[number, number]>(bpmBounds)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setBpmRange(([lo, hi]) => [
      Math.max(bpmBounds[0], Math.min(bpmBounds[1], lo)),
      Math.max(bpmBounds[0], Math.min(bpmBounds[1], hi)),
    ])
  }, [bpmBounds[0], bpmBounds[1]])

  const filteredBeats = useMemo(() => {
    const q = query.trim().toLowerCase()
    return beats.filter((beat) => {
      if (q && !beat.title.toLowerCase().includes(q)) return false
      if (beat.bpm < bpmRange[0] || beat.bpm > bpmRange[1]) return false
      if (selectedGenres.length > 0 && !selectedGenres.includes(beat.genre)) return false
      return true
    })
  }, [beats, query, bpmRange[0], bpmRange[1], selectedGenres])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, bpmRange[0], bpmRange[1], selectedGenres.length, viewMode])

  const beatsPerPage = viewMode === 'grid' ? 9 : 6
  const totalPages = Math.max(1, Math.ceil(filteredBeats.length / beatsPerPage))
  const startIndex = (currentPage - 1) * beatsPerPage
  const visibleBeats = filteredBeats.slice(startIndex, startIndex + beatsPerPage)

  const [playingId, setPlayingId] = useState<string | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleTogglePlay = (nextId: string | null, audio: HTMLAudioElement | null) => {
    if (currentAudioRef.current && currentAudioRef.current !== audio) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
    currentAudioRef.current = audio
    setPlayingId(nextId)
  }

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
      setPlayingId(null)
    }
  }

  const pauseCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      setPlayingId(null)
    }
  }

  const [purchaseBeat, setPurchaseBeat] = useState<CatalogBeat | null>(null)
  const [purchaseDuration, setPurchaseDuration] = useState(0)

  const handleOpenPurchase = (beat: CatalogBeat, duration: number) => {
    stopCurrentAudio()
    setPurchaseBeat(beat)
    setPurchaseDuration(duration)
  }

  const selectedLicenseIdForPurchase = useMemo(() => {
    if (!purchaseBeat) return null
    const found = cart.items.find((item) => item.beatId === purchaseBeat.id)
    return found ? found.licenseId : null
  }, [cart.items, purchaseBeat])

  const handleToggleLicense = (license: LicenseDef) => {
    if (!purchaseBeat) return
    const existingIndex = cart.items.findIndex(
      (i) => i.beatId === purchaseBeat.id && i.licenseId === license.id
    )
    if (existingIndex >= 0) {
      cart.removeItem(existingIndex)
    } else {
      cart.addItem({
        beatId: purchaseBeat.id,
        beatTitle: purchaseBeat.title,
        licenseId: license.id,
        licenseName: license.name,
        priceLabel: license.priceLabel,
      })
    }
  }

  const appleSpring = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 32,
    mass: 1,
    bounce: 0,
  }
  const viewVariants = {
    initial: { opacity: 0, scale: 0.98 },
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  }

  const [activeBeatId, setActiveBeatId] = useState<string | null>(null)
  const beatCardTheme = useMemo<BeatCardTheme>(
    () => ({
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
      boxBlur: theme.boxBlur,
      expandedOverlayColor: theme.expandedOverlayColor,
      overlayOpacity: theme.overlayOpacity,
    }),
    [theme]
  )

  const handleGridAddToCart = (item: BeatCartPayload) => {
    cart.addItem(item)
  }

  const cartTotal = useMemo(
    () =>
      cart.items.reduce((sum, item) => {
        const lic = LICENSES.find((l) => l.id === item.licenseId)
        if (lic) return sum + lic.price
        const fromLabel = Number((item.priceLabel || '').replace(/\D/g, ''))
        return sum + (Number.isFinite(fromLabel) ? fromLabel : 0)
      }, 0),
    [cart.items]
  )

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-neutral-900">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-[24px] font-semibold tracking-tight text-neutral-900 transition hover:opacity-70"
          >
            pky.
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 text-[12.5px] font-medium text-neutral-800 transition hover:bg-neutral-50"
                aria-label="Abrir carrito"
              >
                <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
                Carrito
                {cart.items.length > 0 ? (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                    {cart.items.length}
                  </span>
                ) : null}
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col gap-0 sm:max-w-md"
            >
              <div className="flex flex-col gap-1 border-b border-neutral-200 pb-4">
                <SheetTitle>Carrito</SheetTitle>
                <SheetDescription>
                  {cart.items.length === 0
                    ? 'Tu carrito está vacío'
                    : `${cart.items.length} artículo${cart.items.length === 1 ? '' : 's'}`}
                </SheetDescription>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                {cart.items.length === 0 ? (
                  <p className="px-1 text-[13px] text-neutral-500">
                    Aún no agregaste nada.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {cart.items.map((item, index) => {
                      const lic = LICENSES.find((l) => l.id === item.licenseId)
                      const price =
                        lic?.price ?? (Number((item.priceLabel || '').replace(/\D/g, '')) || 0)
                      return (
                        <li
                          key={`${item.beatId}-${item.licenseId}-${index}`}
                          className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-neutral-900">
                              {item.beatTitle}
                            </p>
                            <p className="text-[11.5px] text-neutral-500">
                              {item.licenseName} · ${price}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => cart.removeItem(index)}
                            aria-label="Quitar del carrito"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              {cart.items.length > 0 ? (
                <div className="border-t border-neutral-200 pt-4">
                  <div className="mb-3 flex items-center justify-between text-[14px]">
                    <span className="text-neutral-600">Total</span>
                    <span className="font-semibold tabular-nums">${cartTotal}</span>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-neutral-800"
                  >
                    Ir a pagar
                  </button>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </header>

        {/* Toolbar */}
        <div className="mb-5 rounded-2xl border border-black/[0.06] bg-white/85 p-4 shadow-[0_2px_14px_rgba(17,24,39,0.04)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search — thin, minimal */}
            <div className="relative flex-1 basis-[260px]">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                strokeWidth={1.75}
              />
              <input
                type="text"
                placeholder="Buscar beats…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Buscar beats por nombre"
                className="h-8 w-full rounded-full border border-neutral-200 bg-white pl-7 pr-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            {/* View toggle */}
            <div
              role="radiogroup"
              aria-label="Modo de visualización"
              className="inline-flex h-8 items-center gap-0.5 rounded-full bg-neutral-100 p-0.5"
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'list'}
                onClick={() => {
                  stopCurrentAudio()
                  setActiveBeatId(null)
                  setViewMode('list')
                }}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <List className="h-3.5 w-3.5" strokeWidth={1.75} />
                Lista
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'grid'}
                onClick={() => {
                  stopCurrentAudio()
                  setActiveBeatId(null)
                  setViewMode('grid')
                }}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
                Grid
              </button>
            </div>
          </div>

          {/* BPM slider */}
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                BPM
              </span>
              <span className="font-mono text-[12px] tabular-nums text-neutral-700">
                {bpmRange[0]} – {bpmRange[1]}
              </span>
            </div>
            <SliderPrimitive.Root
              className="relative flex h-5 w-full touch-none select-none items-center"
              value={bpmRange}
              min={bpmBounds[0]}
              max={bpmBounds[1]}
              step={1}
              minStepsBetweenThumbs={1}
              onValueChange={(values) =>
                setBpmRange([values[0], values[1]] as [number, number])
              }
              aria-label="Rango de BPM"
            >
              <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-neutral-200">
                <SliderPrimitive.Range className="absolute h-full bg-neutral-900" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                className="block h-3.5 w-3.5 rounded-full border-[1.5px] border-neutral-900 bg-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-neutral-300 focus-visible:ring-2"
                aria-label="BPM mínimo"
              />
              <SliderPrimitive.Thumb
                className="block h-3.5 w-3.5 rounded-full border-[1.5px] border-neutral-900 bg-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-neutral-300 focus-visible:ring-2"
                aria-label="BPM máximo"
              />
            </SliderPrimitive.Root>
          </div>

          {/* Genre chips */}
          {categories.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Género
              </span>
              <button
                type="button"
                onClick={() => setSelectedGenres([])}
                className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-medium transition ${
                  selectedGenres.length === 0
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Todos
              </button>
              {categories.map((genre) => {
                const active = selectedGenres.includes(genre)
                return (
                  <button
                    key={genre}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setSelectedGenres((prev) =>
                        prev.includes(genre)
                          ? prev.filter((g) => g !== genre)
                          : [...prev, genre]
                      )
                    }
                    className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-medium transition ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {genre}
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="mt-3 text-[11px] tabular-nums text-neutral-500">
            {filteredBeats.length} de {beats.length} beats
          </div>
        </div>

        {/* Body — wrapped in AnimatePresence so list↔grid swaps glide with
            the same appleSpring physics used by BeatCard. mode="wait"
            keeps a single section in flight to avoid double-mount cost
            of WaveformRow (which owns an AudioContext + rAF loop). */}
        {filteredBeats.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-black/[0.06] bg-white/60 px-6 py-16 text-[13px] text-neutral-500">
            No hay beats que coincidan con los filtros.
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === 'list' ? (
              <motion.section
                key="list"
                variants={viewVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={appleSpring}
                className="flex flex-col gap-3"
                style={{ willChange: 'transform, opacity' }}
              >
                {visibleBeats.map((beat) => (
                  <WaveformRow
                    key={beat.id}
                    beat={beat}
                    isPlaying={playingId === beat.id}
                    onTogglePlay={handleTogglePlay}
                    onOpenPurchase={handleOpenPurchase}
                    pauseCurrentAudio={pauseCurrentAudio}
                  />
                ))}
              </motion.section>
            ) : (
              <motion.section
                key="grid"
                variants={viewVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={appleSpring}
                className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
                style={{ willChange: 'transform, opacity' }}
              >
                {visibleBeats.map((beat) => {
                  const hideCard = activeBeatId !== null && activeBeatId !== beat.id
                  return (
                    <div
                      key={beat.id}
                      className={`min-w-0 transition-opacity duration-300 ${
                        hideCard
                          ? 'pointer-events-none invisible opacity-0'
                          : 'visible opacity-100'
                      }`}
                    >
                      <BeatCard
                        beatId={beat.id}
                        title={beat.title}
                        bpm={String(beat.bpm)}
                        genre={beat.genre}
                        tone={beat.key || '—'}
                        videoSrc={beat.videoUrl ?? undefined}
                        audioSrc={beat.audioUrl ?? undefined}
                        theme={beatCardTheme}
                        isActive={activeBeatId === beat.id}
                        onSelect={(id) => setActiveBeatId(id)}
                        onCloseExpansion={() => setActiveBeatId(null)}
                        onAddToCart={handleGridAddToCart}
                      />
                    </div>
                  )
                })}
              </motion.section>
            )}
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <nav
            aria-label="Paginación"
            className="mt-6 flex items-center justify-center gap-1"
          >
            <button
              type="button"
              onClick={() => {
                stopCurrentAudio()
                setCurrentPage((p) => Math.max(1, p - 1))
              }}
              disabled={currentPage === 1}
              className="inline-flex h-8 items-center rounded-full border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <div className="mx-2 flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const active = page === currentPage
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      stopCurrentAudio()
                      setCurrentPage(page)
                    }}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[12px] font-medium transition ${
                      active
                        ? 'bg-neutral-900 text-white'
                        : 'border border-transparent text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                stopCurrentAudio()
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }}
              disabled={currentPage === totalPages}
              className="inline-flex h-8 items-center rounded-full border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente →
            </button>
          </nav>
        ) : null}
      </div>

      {/* License sheet (list-mode purchase) */}
      <Sheet
        open={purchaseBeat !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPurchaseBeat(null)
            setPurchaseDuration(0)
          }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl">
          {purchaseBeat ? (
            <>
              <div className="flex flex-col gap-1">
                <SheetTitle>{purchaseBeat.title}</SheetTitle>
                <SheetDescription>
                  Elegí tu licencia · {purchaseBeat.bpm} BPM
                  {purchaseBeat.key ? ` · ${purchaseBeat.key}` : ''}
                  {purchaseBeat.genre ? ` · ${purchaseBeat.genre}` : ''}
                  {purchaseDuration > 0
                    ? ` · ${Math.floor(purchaseDuration / 60)}:${String(
                        Math.floor(purchaseDuration % 60)
                      ).padStart(2, '0')}`
                    : ''}
                </SheetDescription>
              </div>
              <div className="mx-auto mt-4 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {LICENSES.map((license) => {
                  const isSelected = selectedLicenseIdForPurchase === license.id
                  const isDisabled = Boolean(
                    selectedLicenseIdForPurchase && !isSelected
                  )
                  return (
                    <article
                      key={license.id}
                      className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
                    >
                      <header className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[14px] font-semibold text-neutral-900">
                          {license.name}
                        </h3>
                        <span className="font-mono text-[13px] tabular-nums text-neutral-700">
                          {license.priceLabel}
                        </span>
                      </header>
                      <p className="text-[12px] text-neutral-500">
                        {license.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleToggleLicense(license)}
                        disabled={isDisabled}
                        className={`mt-1 inline-flex h-9 items-center justify-center rounded-full px-3 text-[12.5px] font-medium transition ${
                          isSelected
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                            : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {isSelected ? 'Quitar del carrito' : 'Añadir al carrito'}
                      </button>
                    </article>
                  )
                })}
                <article className="flex flex-col gap-2 rounded-2xl border border-dashed border-neutral-300 bg-transparent p-4 sm:col-span-2">
                  <header className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[14px] font-semibold text-neutral-900">
                      Exclusive Rights
                    </h3>
                    <span className="font-mono text-[13px] text-neutral-700">Oferta</span>
                  </header>
                  <p className="text-[12px] text-neutral-500">
                    Derechos totales. Hablemos.
                  </p>
                  <button
                    type="button"
                    className="mt-1 inline-flex h-9 items-center justify-center rounded-full border border-neutral-300 bg-transparent px-3 text-[12.5px] font-medium text-neutral-800 transition hover:bg-neutral-50"
                  >
                    Contactar
                  </button>
                </article>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  )
}
