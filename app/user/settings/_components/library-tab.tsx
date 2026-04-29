'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Disc3, FileText, Loader2, Music2, ShoppingBag } from 'lucide-react'
import type { UserPurchase } from '@/lib/user-queries'
import { getBeatDownloadUrlAction, type DownloadAssetType } from '../actions'
import { useToast } from './toast'

const STATUS_BADGE: Record<string, string> = {
  Pagada: 'bg-emerald-500/10 text-emerald-700',
  Pendiente: 'bg-amber-500/10 text-amber-700',
  Cancelada: 'bg-rose-500/10 text-rose-700',
  Devolucion: 'bg-neutral-500/10 text-neutral-700',
}

const STATUS_LABEL: Record<string, string> = {
  Devolucion: 'Reembolsada',
}

const formatDate = (iso: string): string => {
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

function triggerBrowserDownload(url: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  // Some browsers strip the download attribute on cross-origin URLs;
  // ResponseContentDisposition on the presigned URL handles this server-side.
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function LibraryTab({ purchases }: { purchases: UserPurchase[] }) {
  const toast = useToast()
  // Track which (saleId, assetType) pair is currently signing so we can disable
  // just that one button instead of the whole row.
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const makeKey = (id: string, type: DownloadAssetType) => `${id}:${type}`

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/60 p-10 text-center backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
          <Disc3 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium tracking-tight text-foreground">
            Tu biblioteca está vacía
          </p>
          <p className="max-w-sm text-xs font-light text-muted-foreground">
            Cuando compres un beat va a aparecer acá listo para descargar.
          </p>
        </div>
      </div>
    )
  }

  const handleDownload = (purchase: UserPurchase, type: DownloadAssetType) => {
    const key = makeKey(purchase.id, type)
    if (busyKey) return
    setBusyKey(key)
    startTransition(async () => {
      const res = await getBeatDownloadUrlAction(purchase.id, type)
      setBusyKey(null)
      if (!res.ok || !res.url) {
        toast.push(res.error ?? 'No se pudo iniciar la descarga.', 'error')
        return
      }
      const fallbackExt = type === 'contract' ? 'pdf' : 'mp3'
      const fallbackName =
        type === 'contract'
          ? `Contrato - ${purchase.beatTitle}.${fallbackExt}`
          : `${purchase.beatTitle}.${fallbackExt}`
      triggerBrowserDownload(res.url, res.filename ?? fallbackName)
      toast.push(
        type === 'contract' ? 'Descargando contrato.' : 'Descargando audio HQ.'
      )
    })
  }

  return (
    <ul className="flex flex-col gap-2">
      {purchases.map((purchase, idx) => {
        const isPaid = purchase.status === 'Pagada'
        const audioBusy = busyKey === makeKey(purchase.id, 'audio')
        const contractBusy = busyKey === makeKey(purchase.id, 'contract')
        const anyBusy = audioBusy || contractBusy
        return (
          <motion.li
            key={purchase.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.04, 0.2), duration: 0.22 }}
            className="flex flex-col gap-3 rounded-2xl bg-white/70 p-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-4"
          >
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04]">
                <ShoppingBag className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {purchase.beatTitle}
                </p>
                <p className="truncate text-xs font-light text-muted-foreground">
                  {formatDate(purchase.createdAt)} · {purchase.paymentMethod} · #{purchase.invoiceId}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                    STATUS_BADGE[purchase.status] ?? 'bg-black/[0.06] text-muted-foreground'
                  }`}
                >
                  {STATUS_LABEL[purchase.status] ?? purchase.status}
                </span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {formatAmount(purchase.amountCents, purchase.currency)}
                </span>
              </div>

              {isPaid ? (
                <div className="flex items-center gap-1.5">
                  <motion.button
                    type="button"
                    onClick={() => handleDownload(purchase, 'audio')}
                    disabled={anyBusy}
                    whileTap={{ scale: 0.97 }}
                    title="Descargar audio HQ"
                    aria-label="Descargar audio HQ"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-neutral-900 px-3 text-[12px] font-medium text-white transition hover:bg-neutral-800 disabled:opacity-70"
                  >
                    {audioBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Music2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                    <span className="hidden sm:inline">
                      {audioBusy ? 'Generando…' : 'Audio HQ'}
                    </span>
                  </motion.button>
                  {purchase.hasContract ? (
                    <motion.button
                      type="button"
                      onClick={() => handleDownload(purchase, 'contract')}
                      disabled={anyBusy}
                      whileTap={{ scale: 0.97 }}
                      title="Descargar contrato"
                      aria-label="Descargar contrato"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 px-3 text-[12px] font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] transition hover:bg-white disabled:opacity-70"
                    >
                      {contractBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                      )}
                      <span className="hidden sm:inline">
                        {contractBusy ? 'Generando…' : 'Contrato'}
                      </span>
                    </motion.button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}
