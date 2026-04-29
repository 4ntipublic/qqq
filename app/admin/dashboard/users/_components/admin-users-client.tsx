'use client'

import * as React from 'react'
import { useMemo, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Disc3,
  Loader2,
  Music2,
  Phone,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'

// Inline Instagram glyph — the lucide-react@1.8 we have shipped doesn't expose
// it. Same prop surface as a lucide icon so it can be used interchangeably.
function Instagram({ className, strokeWidth = 1.75 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
import type { AdminUser, AdminUserSale } from '@/lib/admin-queries'
import { loadUserSalesAction } from '../actions'

const appleSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
}

const STATUS_COLOR: Record<string, string> = {
  Pagada: 'bg-emerald-500/10 text-emerald-700',
  Pendiente: 'bg-amber-500/10 text-amber-700',
  Cancelada: 'bg-rose-500/10 text-rose-700',
}

type SalesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; sales: AdminUserSale[] }
  | { status: 'error'; error: string }

const formatUsd = (cents: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

const initialsOf = (user: AdminUser): string => {
  const source = (user.displayName || user.email || '').trim()
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

export function AdminUsersClient({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [salesByUser, setSalesByUser] = useState<Record<string, SalesState>>({})
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      [u.displayName, u.email, u.instagram, u.soundcloud, u.spotify, u.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    )
  }, [query, users])

  const handleToggle = (user: AdminUser) => {
    setExpandedId((prev) => {
      const next = prev === user.id ? null : user.id
      if (next && !salesByUser[user.id]) {
        setSalesByUser((map) => ({ ...map, [user.id]: { status: 'loading' } }))
        startTransition(async () => {
          const res = await loadUserSalesAction(user.id, user.email || null)
          setSalesByUser((map) => ({
            ...map,
            [user.id]: res.ok
              ? { status: 'ready', sales: res.sales ?? [] }
              : { status: 'error', error: res.error ?? 'No se pudo cargar.' },
          }))
        })
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, email, IG, SoundCloud…"
          className="h-10 w-full rounded-2xl border border-border bg-white/65 pl-9 pr-3 text-sm font-light outline-none backdrop-blur transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/55 p-12 text-center backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
            <Sparkles className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium tracking-tight text-foreground">
            {users.length === 0 ? 'Sin usuarios todavía' : 'Sin coincidencias'}
          </p>
          <p className="max-w-sm text-xs font-light text-muted-foreground">
            {users.length === 0
              ? 'Cuando alguien se registre en akpkyy va a aparecer acá.'
              : 'Probá con otro término de búsqueda.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((user, idx) => {
            const isOpen = expandedId === user.id
            const sales = salesByUser[user.id]
            return (
              <motion.li
                key={user.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.025, 0.2), duration: 0.22 }}
                layout
                className="overflow-hidden rounded-2xl bg-white/65 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(user)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/40 sm:px-5 sm:py-4"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-black/[0.06] text-[13px] font-semibold uppercase text-foreground">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName || user.email}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {initialsOf(user)}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium tracking-tight text-foreground">
                        {user.displayName || user.email}
                      </p>
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground">
                          <Shield className="h-2.5 w-2.5" strokeWidth={2} />
                          admin
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs font-light text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatUsd(user.totalSpentCents)}
                    </span>
                    <span className="text-[11px] font-light text-muted-foreground">
                      {user.totalSales}{' '}
                      {user.totalSales === 1 ? 'compra' : 'compras'}
                    </span>
                  </div>

                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.section
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={appleSpring}
                      className="overflow-hidden border-t border-black/[0.06]"
                    >
                      <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6">
                        {/* Public profile */}
                        <div className="flex flex-col gap-3">
                          <h4 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Información pública
                          </h4>
                          <DetailRow icon={Instagram} label="Instagram" value={user.instagram ? `@${user.instagram}` : null} />
                          <DetailRow
                            icon={Music2}
                            label="SoundCloud"
                            value={user.soundcloud ? `soundcloud.com/${user.soundcloud}` : null}
                          />
                          <DetailRow icon={Disc3} label="Spotify" value={user.spotify || null} mono />
                          <h4 className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Privado
                          </h4>
                          <DetailRow icon={Phone} label="Teléfono" value={user.phone || null} mono />
                          <p className="text-[11px] font-light text-muted-foreground">
                            Registrado el {formatDate(user.createdAt)} · última edición {formatDate(user.updatedAt)}
                          </p>
                        </div>

                        {/* Sales history */}
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              Historial de compras
                            </h4>
                            <span className="text-[11px] font-light text-muted-foreground">
                              {user.totalSales} pagas · {formatUsd(user.totalSpentCents)}
                            </span>
                          </div>
                          <SalesPanel state={sales ?? { status: 'idle' }} />
                        </div>
                      </div>
                    </motion.section>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string | null
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span
          className={`truncate text-sm font-light text-foreground ${
            mono ? 'tabular-nums' : ''
          }`}
        >
          {value ?? <span className="text-muted-foreground/70">—</span>}
        </span>
      </div>
    </div>
  )
}

function SalesPanel({ state }: { state: SalesState }) {
  if (state.status === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white/55 px-3 py-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Cargando historial…
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <p className="rounded-xl bg-rose-500/10 px-3 py-3 text-xs text-rose-700">{state.error}</p>
    )
  }
  if (state.status !== 'ready') return null

  if (state.sales.length === 0) {
    return (
      <p className="rounded-xl bg-white/55 px-3 py-3 text-xs font-light text-muted-foreground">
        Este usuario aún no tiene compras registradas.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {state.sales.map((sale) => (
        <li
          key={sale.id}
          className="flex items-center gap-3 rounded-xl bg-white/55 p-2.5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-foreground">
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-[13px] font-medium text-foreground">
              {sale.beatTitle}
            </p>
            <p className="truncate text-[11px] font-light text-muted-foreground">
              {formatDate(sale.createdAt)} · {sale.paymentMethod} · #{sale.invoiceId}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              STATUS_COLOR[sale.status] ?? 'bg-black/[0.06] text-muted-foreground'
            }`}
          >
            {sale.status}
          </span>
          <span className="ml-1 shrink-0 text-[13px] font-medium tabular-nums text-foreground">
            {formatUsd(sale.amountCents, sale.currency)}
          </span>
        </li>
      ))}
    </ul>
  )
}
