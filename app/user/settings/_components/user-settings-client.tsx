'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Library, Shield, User as UserIcon } from 'lucide-react'
import type { UserProfile, UserPurchase } from '@/lib/user-queries'
import { ToastProvider } from './toast'
import { ProfileTab } from './profile-tab'
import { SecurityTab } from './security-tab'
import { LibraryTab } from './library-tab'

type TabId = 'profile' | 'security' | 'library'

const TABS: ReadonlyArray<{
  id: TabId
  label: string
  Icon: typeof UserIcon
  description: string
}> = [
  { id: 'profile', label: 'Perfil', Icon: UserIcon, description: 'Tu identidad pública' },
  { id: 'security', label: 'Seguridad', Icon: Shield, description: 'Email y contraseña' },
  { id: 'library', label: 'Biblioteca', Icon: Library, description: 'Beats que compraste' },
]

const appleSpring = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.9 }

export function UserSettingsClient({
  profile,
  purchases,
}: {
  profile: UserProfile
  purchases: UserPurchase[]
}) {
  const searchParams = useSearchParams()
  const initialTab: TabId =
    searchParams?.get('tab') === 'library'
      ? 'library'
      : searchParams?.get('tab') === 'security'
        ? 'security'
        : 'profile'
  const [active, setActive] = useState<TabId>(initialTab)
  const activeTab = TABS.find((t) => t.id === active)!

  // Sync tab when the user comes back via a different ?tab= param.
  useEffect(() => {
    const next = searchParams?.get('tab')
    if (next === 'library' || next === 'security' || next === 'profile') {
      setActive(next)
    }
  }, [searchParams])

  return (
    <ToastProvider>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24">
        <div className="flex flex-col gap-1">
          <h1 className="font-helvetica text-3xl font-light tracking-[-0.01em] text-foreground sm:text-4xl">
            Mi cuenta
          </h1>
          <p className="text-sm font-light text-muted-foreground">
            {profile.email}
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar / tabs */}
          <nav
            role="tablist"
            aria-label="Secciones de la cuenta"
            className="flex flex-row gap-1.5 overflow-x-auto rounded-2xl bg-white/60 p-1.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.10)] backdrop-blur-xl lg:w-64 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-2"
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
                  className="relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors lg:gap-3 lg:px-3 lg:py-2.5"
                >
                  {isActive ? (
                    <motion.span
                      layoutId="settings-tab-active-pill"
                      className="absolute inset-0 rounded-xl bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
                      transition={appleSpring}
                    />
                  ) : null}
                  <tab.Icon
                    className={`relative z-10 h-4 w-4 shrink-0 ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className="relative z-10 flex flex-col">
                    <span
                      className={`font-medium tracking-tight ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span className="hidden text-[11px] font-light text-muted-foreground lg:inline">
                      {tab.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Panel */}
          <section className="flex-1">
            <div className="rounded-3xl bg-white/65 p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.16),0_8px_24px_-12px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:p-7">
              <div className="mb-5 flex flex-col gap-1">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {activeTab.label}
                </h2>
                <p className="text-xs font-light text-muted-foreground">
                  {activeTab.description}
                </p>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  {active === 'profile' ? (
                    <ProfileTab profile={profile} />
                  ) : active === 'security' ? (
                    <SecurityTab currentEmail={profile.email} currentPhone={profile.phone} />
                  ) : (
                    <LibraryTab purchases={purchases} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </ToastProvider>
  )
}
