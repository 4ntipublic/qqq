'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LogOut,
  Settings,
  Shield,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from './CartContext'

export type GlobalHeaderUser = {
  displayName: string
  email: string
  avatarUrl: string | null
  isAdmin: boolean
} | null

const HIDDEN_PREFIXES = ['/admin', '/auth']

const LICENSE_PRICES: Record<string, number> = {
  'mp3-lease': 20,
  'wav-lease': 25,
  trackouts: 40,
}

const appleSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
}

export default function GlobalHeader({ user }: { user: GlobalHeaderUser }) {
  const pathname = usePathname() ?? ''
  const cart = useCart()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cartTotal = useMemo(
    () =>
      cart.items.reduce((sum, item) => {
        const direct = LICENSE_PRICES[item.licenseId]
        if (direct !== undefined) return sum + direct
        const fromLabel = Number((item.priceLabel || '').replace(/\D/g, ''))
        return sum + (Number.isFinite(fromLabel) ? fromLabel : 0)
      }, 0),
    [cart.items]
  )

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-300 ${
        scrolled
          ? 'border-b border-black/[0.06] bg-white/65 backdrop-blur-xl supports-[backdrop-filter]:bg-white/55'
          : 'border-b border-transparent bg-transparent backdrop-blur-0'
      }`}
    >
      <div className="relative mx-auto flex h-14 w-full max-w-[1200px] items-center px-4 sm:px-6">
        {/* Centered brand */}
        <Link
          href="/"
          aria-label="Ir a la home"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-helvetica text-[18px] font-light tracking-[-0.02em] text-neutral-900 transition hover:opacity-70"
        >
          akpkyy
        </Link>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir carrito"
                className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/80 px-3 text-[12px] font-medium text-neutral-800 shadow-[0_1px_2px_rgba(17,24,39,0.04)] backdrop-blur transition hover:bg-white"
              >
                <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
                Carrito
                {cart.items.length > 0 ? (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                    {cart.items.length}
                  </span>
                ) : null}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
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
                  <p className="px-1 text-[13px] text-neutral-500">Aún no agregaste nada.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {cart.items.map((item, index) => {
                      const fallbackPrice = Number(
                        (item.priceLabel || '').replace(/\D/g, '')
                      )
                      const price =
                        LICENSE_PRICES[item.licenseId] ??
                        (Number.isFinite(fallbackPrice) ? fallbackPrice : 0)
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
                  <Link
                    href="/checkout"
                    className="inline-flex h-10 w-full items-center justify-center rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800"
                  >
                    Ir a pagar
                  </Link>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>

          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}

function UserMenu({ user }: { user: GlobalHeaderUser }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click + ESC
  useEffect(() => {
    if (!open) return
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      if (event.target instanceof Node && containerRef.current.contains(event.target)) return
      setOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('touchstart', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('touchstart', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const initials = useMemo(() => {
    if (!user) return ''
    const source = (user.displayName || user.email || '').trim()
    if (!source) return ''
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return ''
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }, [user])

  const greetingName = useMemo(() => {
    if (!user) return ''
    const fromName = (user.displayName || '').trim()
    if (fromName) return fromName.split(/\s+/)[0]!
    const local = (user.email || '').split('@')[0] ?? ''
    return local
  }, [user])

  if (!user) {
    return (
      <Link
        href="/admin/login"
        aria-label="Iniciar sesión"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200/80 bg-white/80 text-neutral-800 shadow-[0_1px_2px_rgba(17,24,39,0.04)] backdrop-blur transition hover:bg-white"
      >
        <UserIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </Link>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Tu cuenta"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-neutral-200/80 bg-white/80 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-neutral-800 shadow-[0_1px_2px_rgba(17,24,39,0.04)] backdrop-blur transition hover:bg-white"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <UserIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={appleSpring}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-[calc(100%+8px)] z-[60] w-64 rounded-2xl border border-white/40 bg-white/55 p-2 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.22),0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-3xl supports-[backdrop-filter]:bg-white/45"
          >
            <div className="px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                Hola
              </p>
              <p className="mt-0.5 truncate text-sm font-medium tracking-tight text-neutral-900">
                {greetingName}
              </p>
              <p className="mt-0.5 truncate text-[11.5px] font-light text-neutral-500">
                {user.email}
              </p>
            </div>

            <div className="my-1 h-px bg-black/[0.06]" />

            <MenuLink
              href="/user/settings"
              icon={Settings}
              label="Configuración"
              onSelect={() => setOpen(false)}
            />
            {user.isAdmin ? (
              <MenuLink
                href="/admin/dashboard"
                icon={Shield}
                label="Panel de control"
                onSelect={() => setOpen(false)}
              />
            ) : null}

            <div className="my-1 h-px bg-black/[0.06]" />

            <form
              action="/admin/logout"
              method="post"
              onSubmit={() => {
                setOpen(false)
                // After signOut redirects to /admin/login, force a soft refresh
                // so the header user state is cleared on the way back.
                setTimeout(() => router.refresh(), 800)
              }}
            >
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-neutral-800 transition hover:bg-black/[0.05]"
              >
                <LogOut className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
                Cerrar sesión
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onSelect,
}: {
  href: string
  icon: typeof Settings
  label: string
  onSelect: () => void
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-neutral-800 transition hover:bg-black/[0.05]"
    >
      <Icon className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
      {label}
    </Link>
  )
}
