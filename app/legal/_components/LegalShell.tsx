'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface LegalShellProps {
  title: string
  updatedAt: string
  children: ReactNode
}

/**
 * Reading shell for legal pages: generous margins, restrained typography,
 * and a single Apple-style "Back" affordance that prefers history.back()
 * (so users return to the page they came from).
 */
export default function LegalShell({ title, updatedAt, children }: LegalShellProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-24 pt-28 sm:pt-32">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-medium text-foreground shadow-[0_4px_14px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:bg-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Volver
      </button>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="text-[12px] font-light tracking-tight text-muted-foreground">
          Última actualización · {updatedAt}
        </p>
      </header>

      <article className="legal-prose flex flex-col gap-5 text-[15px] font-light leading-relaxed text-foreground/90">
        {children}
      </article>
    </main>
  )
}
