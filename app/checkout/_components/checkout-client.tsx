'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react'
import { useCart } from '@/app/_components/CartContext'
import {
  PUBLIC_LICENSE_LABEL,
  PUBLIC_LICENSE_PRICE_CENTS,
  processCheckoutAction,
  type PaymentMethod,
} from '../actions'

const appleSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
}

const formatUsd = (cents: number) => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

type Method = {
  id: PaymentMethod
  label: string
  description: string
  icon: typeof CreditCard
}

const METHODS: Method[] = [
  { id: 'stripe', label: 'Tarjeta', description: 'Visa, Mastercard, Amex · vía Stripe', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', description: 'Pagás con tu cuenta PayPal', icon: Wallet },
  { id: 'transfer', label: 'Transferencia', description: 'CBU/USDT — confirmación manual', icon: Banknote },
]

export function CheckoutClient({
  userEmail,
  displayName,
}: {
  userEmail: string | null
  displayName: string
}) {
  const cart = useCart()
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>('stripe')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const enriched = useMemo(
    () =>
      cart.items.map((item) => ({
        ...item,
        priceCents: PUBLIC_LICENSE_PRICE_CENTS[item.licenseId] ?? 0,
        licenseLabel: PUBLIC_LICENSE_LABEL[item.licenseId] ?? item.licenseName,
      })),
    [cart.items]
  )

  const totalCents = useMemo(
    () => enriched.reduce((sum, item) => sum + item.priceCents, 0),
    [enriched]
  )

  // If cart hydrates empty, redirect home (no items to check out).
  useEffect(() => {
    // Allow a tick for cart to hydrate from localStorage before redirecting.
    const timer = window.setTimeout(() => {
      if (cart.items.length === 0 && !isPending) {
        // No-op: we render an empty state below instead of force-navigating.
      }
    }, 50)
    return () => window.clearTimeout(timer)
  }, [cart.items.length, isPending])

  const handleConfirm = () => {
    if (!userEmail) {
      router.push('/admin/login?from=/checkout')
      return
    }
    if (cart.items.length === 0 || isPending) return
    setError(null)

    startTransition(async () => {
      const payload = cart.items.map((item) => ({
        beatId: item.beatId,
        licenseId: item.licenseId,
      }))
      const res = await processCheckoutAction(payload, method)
      if (!res.ok || !res.invoiceId) {
        if (res.needsLogin) {
          router.push('/admin/login?from=/checkout')
          return
        }
        setError(res.error ?? 'No se pudo procesar la orden.')
        return
      }
      cart.clear()
      if (res.redirectUrl) {
        // Stripe Checkout — leave the SPA, let Stripe host the payment.
        window.location.href = res.redirectUrl
        return
      }
      router.push(`/checkout/success?invoice=${encodeURIComponent(res.invoiceId)}`)
    })
  }

  // Not logged in → ask user to authenticate, but keep the cart visible.
  if (!userEmail) {
    return (
      <div className="flex flex-col gap-6">
        <Hero />
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/65 p-10 text-center backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
            <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium tracking-tight text-foreground">
            Iniciá sesión para finalizar tu compra
          </p>
          <p className="max-w-sm text-xs font-light text-muted-foreground">
            Tu carrito sigue intacto. Vamos a vincular esta orden a tu cuenta para que tengas
            acceso permanente a tus beats.
          </p>
          <Link
            href="/admin/login?from=/checkout"
            className="mt-2 inline-flex h-9 items-center rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800"
          >
            Continuar
          </Link>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Hero />
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/65 p-10 text-center backdrop-blur-xl">
          <p className="text-sm font-medium tracking-tight text-foreground">Tu carrito está vacío</p>
          <p className="max-w-sm text-xs font-light text-muted-foreground">
            Volvé al catálogo y elegí los beats que querés comprar.
          </p>
          <Link
            href="/beats"
            className="mt-2 inline-flex h-9 items-center rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Explorar beats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Hero displayName={displayName} email={userEmail} />

      {/* Items */}
      <section className="flex flex-col gap-2 rounded-3xl bg-white/65 p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-5">
        <header className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Tu pedido</h2>
          <span className="text-[11px] font-light text-muted-foreground">
            {cart.items.length} {cart.items.length === 1 ? 'beat' : 'beats'}
          </span>
        </header>
        <ul className="flex flex-col gap-1.5">
          {enriched.map((item, index) => (
            <li
              key={`${item.beatId}-${item.licenseId}-${index}`}
              className="flex items-center gap-3 rounded-2xl bg-white/55 p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium text-foreground">{item.beatTitle}</p>
                <p className="text-[11px] font-light text-muted-foreground">{item.licenseLabel}</p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                {formatUsd(item.priceCents)}
              </span>
              <button
                type="button"
                onClick={() => cart.removeItem(index)}
                aria-label="Quitar del carrito"
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/[0.05] hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Method selector */}
      <section className="flex flex-col gap-2 rounded-3xl bg-white/65 p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-5">
        <header className="flex items-center gap-2 px-1 pb-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Método de pago</h2>
        </header>
        <div role="radiogroup" aria-label="Método de pago" className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((m) => {
            const active = method === m.id
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(m.id)}
                className="relative flex flex-col items-start gap-1.5 rounded-2xl bg-white/55 p-4 text-left outline-none transition focus:ring-2 focus:ring-foreground/15"
              >
                {active ? (
                  <motion.span
                    layoutId="checkout-method-active"
                    className="absolute inset-0 rounded-2xl bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.14),0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-foreground/10"
                    transition={appleSpring}
                  />
                ) : null}
                <div className="relative z-10 flex items-center gap-2">
                  <m.icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
                  <span className="text-sm font-medium tracking-tight text-foreground">
                    {m.label}
                  </span>
                </div>
                <p className="relative z-10 text-[11px] font-light text-muted-foreground">
                  {m.description}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Total + confirm */}
      <section className="flex flex-col gap-3 rounded-3xl bg-white/65 p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-light text-muted-foreground">Total</span>
          <span className="font-helvetica text-2xl font-light tracking-[-0.01em] text-foreground tabular-nums">
            {formatUsd(totalCents)}
          </span>
        </div>

        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-light text-rose-700"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          whileTap={{ scale: 0.985 }}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              Confirmar compra
            </>
          )}
        </motion.button>

        <p className="flex items-center justify-center gap-1.5 text-[11px] font-light text-muted-foreground">
          <Lock className="h-3 w-3" strokeWidth={1.75} />
          Pago procesado de forma segura. Recibirás los archivos al confirmar el pago.
        </p>
      </section>
    </div>
  )
}

function Hero({ displayName, email }: { displayName?: string; email?: string } = {}) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Checkout</p>
      <h1 className="font-helvetica text-3xl font-light tracking-[-0.01em] text-foreground sm:text-4xl">
        {displayName ? `Listo, ${displayName.split(/\s+/)[0]}` : 'Estás a un click'}
      </h1>
      {email ? (
        <p className="text-sm font-light text-muted-foreground">
          Compra a nombre de <span className="text-foreground">{email}</span>
        </p>
      ) : (
        <p className="text-sm font-light text-muted-foreground">
          Necesitamos vincular esta compra a tu cuenta antes de continuar.
        </p>
      )}
    </header>
  )
}

// Re-export so the page only needs one import path.
export { CheckCircle2 }
