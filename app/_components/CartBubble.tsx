'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { BeatCartPayload } from './BeatCard'

type CartBubbleProps = {
  items: BeatCartPayload[]
}

const appleSpring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 32,
  mass: 1,
  bounce: 0,
}

export default function CartBubble({ items }: CartBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const itemCount = items.length
  const badgeLabel = itemCount > 99 ? '99+' : String(itemCount)
  const totalLabel = useMemo(() => {
    const total = items.reduce((sum, item) => {
      const parsed = Number(item.priceLabel.replace(/[^\d.]/g, ''))
      return Number.isFinite(parsed) ? sum + parsed : sum
    }, 0)

    return `$${total.toFixed(0)}`
  }, [items])

  return (
    <div className="fixed right-6 top-6 z-[80]">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            key="expanded"
            className="fixed inset-0 z-[90] flex items-start justify-end p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08, ease: [0.32, 0.72, 0, 1] }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/12"
              aria-label="Cerrar carrito"
              onClick={() => setIsExpanded(false)}
            />

            <motion.section
              layoutId="macos-cart-folder"
              transition={appleSpring}
              className="relative w-full max-w-[420px] overflow-hidden border border-white/55 bg-white/34 p-4 backdrop-blur-3xl"
              style={{
                borderRadius: 30,
                boxShadow: '0 24px 52px rgba(15, 23, 42, 0.18)',
              }}
              initial={{ scale: 0.95, borderRadius: 24 }}
              animate={{ scale: 1, borderRadius: 30 }}
              exit={{ scale: 0.96, borderRadius: 24 }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.18)_58%,rgba(255,255,255,0.08)_100%)]" />

              <motion.div
                className="relative"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
              >
                <header className="flex items-center justify-between gap-4 border-b border-white/45 pb-3">
                  <div>
                    <p className="text-[0.74rem] uppercase tracking-[0.16em] text-slate-700/80">Carrito</p>
                    <h3 className="mt-1 text-[1.2rem] font-light tracking-[0.02em] text-slate-900">Seleccion actual</h3>
                  </div>

                  <button
                    type="button"
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/55 bg-white/58 px-3 text-[0.7rem] uppercase tracking-[0.1em] text-slate-700"
                    onClick={() => setIsExpanded(false)}
                  >
                    cerrar
                  </button>
                </header>

                <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-white/50 bg-white/45 px-3 py-4 text-[0.84rem] font-light text-slate-700">
                      Tu carrito esta vacio.
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <article
                        key={`${item.beatId}-${item.licenseId}-${index}`}
                        className="rounded-xl border border-white/48 bg-white/42 px-3 py-3"
                      >
                        <p className="text-[0.9rem] font-light text-slate-900">{item.beatTitle}</p>
                        <p className="mt-0.5 text-[0.73rem] uppercase tracking-[0.1em] text-slate-700/90">{item.licenseName}</p>
                        <p className="mt-1 text-[0.76rem] font-light text-slate-800">{item.priceLabel}</p>
                      </article>
                    ))
                  )}
                </div>

                <footer className="mt-4 flex items-center justify-between border-t border-white/45 pt-3">
                  <p className="text-[0.74rem] uppercase tracking-[0.14em] text-slate-700/85">Total</p>
                  <p className="text-[1.03rem] font-light text-slate-900">{totalLabel}</p>
                </footer>
              </motion.div>
            </motion.section>
          </motion.div>
        ) : (
          <motion.button
            key="bubble"
            type="button"
            layoutId="macos-cart-folder"
            transition={appleSpring}
            className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-white/35 text-slate-800 shadow-[0_12px_36px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
            aria-label={`Carrito flotante, ${itemCount} items`}
            onClick={() => setIsExpanded(true)}
          >
            <span className="pointer-events-none absolute inset-[2px] rounded-full border border-white/55" />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>

            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-light text-white">
              {badgeLabel}
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
