'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

type TabId = 'login' | 'signup'

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'login', label: 'Iniciar sesión' },
  { id: 'signup', label: 'Crear cuenta' },
]

const appleSpring = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.9 }

export function AuthTabs({ from, initialTab = 'login' }: { from: string; initialTab?: TabId }) {
  const [active, setActive] = useState<TabId>(initialTab)

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Modo de autenticación"
        className="relative flex rounded-2xl bg-black/[0.04] p-1 backdrop-blur-xl"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className="relative flex-1 rounded-xl px-4 py-2 text-sm font-medium outline-none transition-colors"
            >
              {isActive ? (
                <motion.span
                  layoutId="auth-tabs-active-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
                  transition={appleSpring}
                />
              ) : null}
              <span
                className={`relative z-10 transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {active === 'login' ? <LoginForm from={from} /> : <SignupForm />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
