'use client'

import { useMemo, useState, useTransition } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion'
import { GripVertical, LayoutGrid, List, Search, Sparkles } from 'lucide-react'
import type { FeaturedAdminBeat } from '@/lib/admin-queries'
import {
  reorderFeaturedAction,
  setFeaturedFormatAction,
  toggleFeaturedAction,
  type FeaturedFormat,
} from '../actions'

const appleSpring = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.9 }

export function FeaturedManager({
  initialBeats,
}: {
  initialBeats: FeaturedAdminBeat[]
}) {
  const [beats, setBeats] = useState<FeaturedAdminBeat[]>(initialBeats)
  const [query, setQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const featured = useMemo(
    () =>
      beats
        .filter((b) => b.isFeatured)
        .sort(
          (a, b) =>
            (a.featuredOrder ?? Number.POSITIVE_INFINITY) -
            (b.featuredOrder ?? Number.POSITIVE_INFINITY)
        ),
    [beats]
  )

  const available = useMemo(() => {
    const filter = query.trim().toLowerCase()
    return beats
      .filter((b) => !b.isFeatured)
      .filter((b) =>
        filter ? b.title.toLowerCase().includes(filter) || b.genre.toLowerCase().includes(filter) : true
      )
  }, [beats, query])

  const reportError = (message: string | undefined) => {
    if (message) setErrorMessage(message)
    else setErrorMessage(null)
  }

  const updateBeat = (beatId: string, patch: Partial<FeaturedAdminBeat>) => {
    setBeats((prev) => prev.map((b) => (b.id === beatId ? { ...b, ...patch } : b)))
  }

  const handleToggle = (beat: FeaturedAdminBeat, next: boolean) => {
    const previous = beats
    if (next) {
      const nextOrder =
        featured.length > 0
          ? Math.max(...featured.map((b) => b.featuredOrder ?? 0)) + 1
          : 0
      updateBeat(beat.id, { isFeatured: true, featuredOrder: nextOrder })
    } else {
      updateBeat(beat.id, { isFeatured: false, featuredOrder: null })
    }

    startTransition(async () => {
      const res = await toggleFeaturedAction(beat.id, next)
      if (!res.ok) {
        setBeats(previous)
        reportError(res.error)
      } else {
        reportError(undefined)
      }
    })
  }

  const handleFormatChange = (beat: FeaturedAdminBeat, format: FeaturedFormat) => {
    const previous = beats
    updateBeat(beat.id, { featuredFormat: format })
    startTransition(async () => {
      const res = await setFeaturedFormatAction(beat.id, format)
      if (!res.ok) {
        setBeats(previous)
        reportError(res.error)
      } else {
        reportError(undefined)
      }
    })
  }

  const handleReorder = (next: FeaturedAdminBeat[]) => {
    // Optimistic local reorder.
    const reorderedIds = next.map((b) => b.id)
    setBeats((prev) => {
      const featuredMap = new Map(next.map((b, idx) => [b.id, idx]))
      return prev.map((b) =>
        featuredMap.has(b.id) ? { ...b, featuredOrder: featuredMap.get(b.id)! } : b
      )
    })

    startTransition(async () => {
      const res = await reorderFeaturedAction(reorderedIds)
      if (!res.ok) reportError(res.error)
      else reportError(undefined)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-2xl border-none bg-rose-500/10 px-4 py-2.5 text-sm font-light text-rose-700"
        >
          {errorMessage}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Destacados
          </h2>
          <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[0.7rem] font-medium tabular-nums text-muted-foreground">
            {featured.length}
          </span>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-2xl bg-white/60 p-6 text-center text-sm font-light text-muted-foreground shadow-[0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-xl">
            Todavía no hay beats destacados. Activá el toggle de cualquier beat de abajo.
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={featured}
            onReorder={handleReorder}
            className="flex flex-col gap-2"
          >
            {featured.map((beat) => (
              <FeaturedRow
                key={beat.id}
                beat={beat}
                draggable
                onToggle={(checked) => handleToggle(beat, checked)}
                onFormatChange={(fmt) => handleFormatChange(beat, fmt)}
              />
            ))}
          </Reorder.Group>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Disponibles</h2>
          <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[0.7rem] font-medium tabular-nums text-muted-foreground">
            {available.length}
          </span>
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar beat o género…"
              className="w-full rounded-xl border-none bg-white/70 py-2 pl-9 pr-3 text-sm font-light text-foreground shadow-[0_4px_14px_-4px_rgba(0,0,0,0.08)] outline-none backdrop-blur-xl transition focus:bg-white/90"
            />
          </div>
        </div>

        {available.length === 0 ? (
          <div className="rounded-2xl bg-white/60 p-6 text-center text-sm font-light text-muted-foreground shadow-[0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-xl">
            {query ? 'Ningún beat coincide con tu búsqueda.' : 'No hay beats disponibles.'}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {available.map((beat) => (
                <motion.li
                  key={beat.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  <FeaturedRow
                    beat={beat}
                    onToggle={(checked) => handleToggle(beat, checked)}
                    onFormatChange={(fmt) => handleFormatChange(beat, fmt)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}

interface FeaturedRowProps {
  beat: FeaturedAdminBeat
  draggable?: boolean
  onToggle: (checked: boolean) => void
  onFormatChange: (format: FeaturedFormat) => void
}

function FeaturedRow({ beat, draggable, onToggle, onFormatChange }: FeaturedRowProps) {
  const dragControls = useDragControls()

  const inner = (
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-xl transition-shadow hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.14)] sm:p-4">
      {draggable ? (
        <button
          type="button"
          aria-label="Arrastrar para reordenar"
          onPointerDown={(event) => dragControls.start(event)}
          className="flex h-9 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.75} />
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium text-foreground">{beat.title}</p>
        <p className="truncate text-xs font-light text-muted-foreground">
          {beat.genre} · {beat.bpm} BPM{beat.key ? ` · ${beat.key}` : ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {beat.isFeatured ? (
          <FormatSegmented
            beatId={beat.id}
            value={beat.featuredFormat}
            onChange={onFormatChange}
          />
        ) : null}
        <IOSwitch checked={beat.isFeatured} onChange={onToggle} />
      </div>
    </div>
  )

  if (!draggable) return inner

  return (
    <Reorder.Item
      value={beat}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.02,
        boxShadow:
          '0 24px 60px -12px rgba(0,0,0,0.25), 0 8px 24px -8px rgba(0,0,0,0.12)',
        cursor: 'grabbing',
      }}
      transition={appleSpring}
      className="touch-none select-none"
    >
      {inner}
    </Reorder.Item>
  )
}

function IOSwitch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-emerald-500' : 'bg-black/[0.14]'
      }`}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.7 }}
        className="inline-block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.20)]"
      />
    </button>
  )
}

interface FormatSegmentedProps {
  beatId: string
  value: FeaturedFormat
  onChange: (format: FeaturedFormat) => void
}

function FormatSegmented({ beatId, value, onChange }: FormatSegmentedProps) {
  const options: ReadonlyArray<{ id: FeaturedFormat; label: string; Icon: typeof LayoutGrid }> = [
    { id: 'grid', label: 'Grid', Icon: LayoutGrid },
    { id: 'list', label: 'Lista', Icon: List },
  ]

  return (
    <div role="radiogroup" className="relative inline-flex rounded-xl bg-black/[0.05] p-0.5">
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className="relative z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium outline-none"
          >
            {active ? (
              <motion.span
                layoutId={`format-pill-${beatId}`}
                className="absolute inset-0 -z-[1] rounded-lg bg-white shadow-[0_2px_6px_rgba(0,0,0,0.10)]"
                transition={appleSpring}
              />
            ) : null}
            <opt.Icon
              className={`h-3.5 w-3.5 transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
              strokeWidth={1.75}
            />
            <span
              className={`transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
