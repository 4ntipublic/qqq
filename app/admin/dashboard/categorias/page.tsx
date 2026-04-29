import type { Metadata } from 'next'
import { fetchCategories } from '@/lib/admin-queries'
import { CategoriesManager } from './_components/categories-manager'

export const metadata: Metadata = {
  title: 'Admin · Categorías',
}

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const categories = await fetchCategories()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Categorías
        </p>
        <h1 className="font-helvetica text-4xl font-light tracking-[-0.01em] text-foreground">
          Gestión de géneros
        </h1>
        <p className="text-sm font-light text-muted-foreground">
          Organizá los beats por género. Cada cambio persiste en Supabase.
        </p>
      </header>

      <CategoriesManager initialCategories={categories} />
    </div>
  )
}
