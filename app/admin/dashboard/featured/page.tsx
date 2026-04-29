import type { Metadata } from 'next'
import { fetchFeaturedAdminBeats } from '@/lib/admin-queries'
import { FeaturedManager } from './_components/featured-manager'

export const metadata: Metadata = {
  title: 'Admin · Destacados',
  description: 'Elegí qué beats aparecen en la home y en qué formato.',
}

export const dynamic = 'force-dynamic'

export default async function FeaturedAdminPage() {
  const beats = await fetchFeaturedAdminBeats()

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 sm:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-helvetica text-3xl font-light tracking-[-0.01em] text-foreground">
          Destacados
        </h1>
        <p className="text-sm font-light text-muted-foreground">
          Activá el toggle para mostrar un beat en la home, elegí su formato visual y arrastrá para
          reordenar.
        </p>
      </header>

      <FeaturedManager initialBeats={beats} />
    </div>
  )
}
