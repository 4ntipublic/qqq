import type { Metadata } from 'next'
import { fetchBeats, fetchCategories } from '@/lib/admin-queries'
import { BeatsSection } from './_components/beats-section'

export const metadata: Metadata = {
  title: 'Admin · Beats',
}

export const dynamic = 'force-dynamic'

export default async function BeatsPage() {
  const [beats, categories] = await Promise.all([fetchBeats(), fetchCategories()])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Beats
        </p>
        <h1 className="font-helvetica text-4xl font-light tracking-[-0.01em] text-foreground">
          Subida y catálogo
        </h1>
        <p className="text-sm font-light text-muted-foreground">
          Subí beats con BPM, categoría y fecha de drop. Cada cambio persiste en Supabase.
        </p>
      </header>

      <BeatsSection initialBeats={beats} categories={categories} />
    </div>
  )
}
