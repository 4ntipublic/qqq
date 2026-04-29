'use client'

import { useMemo, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Banknote,
  Check,
  CreditCard,
  Loader2,
  Receipt,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import type { AdminSale } from '@/lib/admin-queries'
import { updateSaleStatusAction } from '../actions'

const appleSpring = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.9 }

const STATUS_FILTERS = ['all', 'Pendiente', 'Pagada', 'Cancelada', 'Devolucion'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_BADGE: Record<string, string> = {
  Pagada: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/20',
  Pendiente: 'bg-amber-500/15 text-amber-700 border border-amber-500/25',
  Cancelada: 'bg-rose-500/15 text-rose-700 border border-rose-500/20',
  Devolucion: 'bg-neutral-500/15 text-neutral-700 border border-neutral-500/20',
}

const METHOD_LABEL: Record<string, string> = {
  stripe: 'Stripe · Tarjeta',
  paypal: 'PayPal',
  transfer: 'Transferencia',
  crypto: 'Crypto',
}

const METHOD_ICON: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  transfer: Banknote,
  crypto: Wallet,
}

const formatAmount = (cents: number, currency: string): string => {
  const amount = (cents ?? 0) / 100
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

type Toast = { id: number; message: string; tone: 'ok' | 'error' }

export function AdminSalesClient({ initialSales }: { initialSales: AdminSale[] }) {
  const [sales, setSales] = useState<AdminSale[]>(initialSales)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [, startTransition] = useTransition()

  const pushToast = (message: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sales.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      if (!matchesStatus) return false
      if (!q) return true
      return (
        s.invoiceId.toLowerCase().includes(q) ||
        s.buyerEmail.toLowerCase().includes(q) ||
        (s.buyerName ?? '').toLowerCase().includes(q) ||
        (s.beatTitle ?? '').toLowerCase().includes(q)
      )
    })
  }, [sales, query, statusFilter])

  const summary = useMemo(() => {
    const paid = sales.filter((s) => s.status === 'Pagada')
    const pending = sales.filter((s) => s.status === 'Pendiente')
    const revenueCents = paid.reduce((sum, s) => sum + s.amountCents, 0)
    return {
      total: sales.length,
      paid: paid.length,
      pending: pending.length,
      revenueCents,
    }
  }, [sales])

  const handleAction = (sale: AdminSale, nextStatus: 'Pagada' | 'Cancelada') => {
    if (busyId) return
    setBusyId(sale.id)
    // Optimistic update
    const prevStatus = sale.status
    setSales((prev) =>
      prev.map((s) => (s.id === sale.id ? { ...s, status: nextStatus } : s))
    )
    startTransition(async () => {
      const res = await updateSaleStatusAction(sale.id, nextStatus)
      setBusyId(null)
      if (!res.ok) {
        // Revert
        setSales((prev) =>
          prev.map((s) => (s.id === sale.id ? { ...s, status: prevStatus } : s))
        )
        pushToast(res.error ?? 'No se pudo actualizar la venta.', 'error')
        return
      }
      pushToast(
        nextStatus === 'Pagada'
          ? `Aprobada · #${sale.invoiceId}`
          : `Cancelada · #${sale.invoiceId}`
      )
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryChip label="Invoices" value={summary.total.toString()} />
        <SummaryChip label="Pagadas" value={summary.paid.toString()} tone="emerald" />
        <SummaryChip label="Pendientes" value={summary.pending.toString()} tone="amber" />
        <SummaryChip
          label="Revenue"
          value={formatAmount(summary.revenueCents, 'USD')}
        />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-[0_8px_28px_-14px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por invoice, cliente o beat…"
            className="h-10 w-full rounded-full border border-transparent bg-white/80 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-300 focus:bg-white"
          />
        </div>
        <div className="relative flex shrink-0 items-center gap-1 rounded-full bg-black/[0.04] p-1">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`relative rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="sales-status-pill"
                    transition={appleSpring}
                    className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]"
                  />
                ) : null}
                <span className="relative">
                  {f === 'all' ? 'Todas' : f === 'Devolucion' ? 'Reembolsos' : f}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/60 p-12 text-center backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
            <Receipt className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium tracking-tight text-foreground">
            Sin ventas que mostrar
          </p>
          <p className="max-w-sm text-xs font-light text-muted-foreground">
            Probá ajustar la búsqueda o cambiar el filtro de estado.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {filtered.map((sale, idx) => (
              <SaleCard
                key={sale.id}
                sale={sale}
                index={idx}
                busy={busyId === sale.id}
                onApprove={() => handleAction(sale, 'Pagada')}
                onCancel={() => handleAction(sale, 'Cancelada')}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={appleSpring}
              className={`pointer-events-auto rounded-2xl px-4 py-2.5 text-[13px] font-medium shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl ${
                t.tone === 'error'
                  ? 'bg-rose-500/95 text-white'
                  : 'bg-neutral-900/95 text-white'
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SummaryChip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'emerald' | 'amber'
}) {
  const accent =
    tone === 'emerald'
      ? 'text-emerald-700'
      : tone === 'amber'
        ? 'text-amber-700'
        : 'text-foreground'
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/65 p-4 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className={`text-2xl font-light tracking-tight ${accent}`}>{value}</span>
    </div>
  )
}

function SaleCard({
  sale,
  index,
  busy,
  onApprove,
  onCancel,
}: {
  sale: AdminSale
  index: number
  busy: boolean
  onApprove: () => void
  onCancel: () => void
}) {
  const Icon = METHOD_ICON[sale.paymentMethod] ?? CreditCard
  const isManual = sale.paymentMethod === 'transfer' || sale.paymentMethod === 'paypal'
  const canApprove = isManual && sale.status === 'Pendiente'
  const canCancel = isManual && sale.status !== 'Cancelada'
  const buyerLabel = sale.buyerName?.trim() || sale.buyerEmail || 'Sin email'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ ...appleSpring, delay: Math.min(index * 0.025, 0.18) }}
      className="grid grid-cols-1 gap-3 rounded-3xl bg-white/70 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:p-5"
    >
      {/* Method icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-black/[0.05] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
        <Icon className="h-4.5 w-4.5 text-foreground" strokeWidth={1.6} />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] tracking-tight text-muted-foreground">
            #{sale.invoiceId}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
              STATUS_BADGE[sale.status] ?? 'bg-black/[0.06] text-muted-foreground'
            }`}
          >
            {sale.status}
          </span>
        </div>
        <p className="truncate text-[15px] font-medium text-foreground">
          {sale.beatTitle ?? 'Beat eliminado'}
        </p>
        <p className="truncate text-xs font-light text-muted-foreground">
          {buyerLabel} · {METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod} ·{' '}
          {formatDate(sale.createdAt)}
        </p>
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <span className="text-[15px] font-medium tabular-nums text-foreground">
          {formatAmount(sale.amountCents, sale.currency)}
        </span>
        {isManual ? (
          <div className="flex items-center gap-1.5">
            {canApprove ? (
              <motion.button
                type="button"
                onClick={onApprove}
                disabled={busy}
                whileTap={{ scale: 0.96 }}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-600 px-3 text-[12px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-70"
                title="Aprobar (marcar como Pagada)"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                )}
                <span className="hidden sm:inline">Aprobar</span>
              </motion.button>
            ) : null}
            {canCancel ? (
              <motion.button
                type="button"
                onClick={onCancel}
                disabled={busy}
                whileTap={{ scale: 0.96 }}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-black/[0.06] px-3 text-[12px] font-medium text-foreground transition hover:bg-black/[0.1] disabled:opacity-70"
                title="Cancelar venta"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Cancelar</span>
              </motion.button>
            ) : null}
          </div>
        ) : (
          <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
            Auto · webhook
          </span>
        )}
      </div>
    </motion.li>
  )
}
