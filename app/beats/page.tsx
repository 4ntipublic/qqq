import type { Metadata } from 'next'
import { fetchPublicBeats, fetchCategories } from '@/lib/admin-queries'
import BeatsCatalogClient from './_components/BeatsCatalogClient'
import type { CatalogBeat } from './_components/WaveformRow'

export const metadata: Metadata = {
  title: 'Catálogo de Beats | akpkyy',
  description: 'Catálogo completo de beats instrumentales akpkyy.',
}

export const dynamic = 'force-dynamic'

export default async function BeatsCatalogPage() {
  const [beats, categories] = await Promise.all([
    fetchPublicBeats(),
    fetchCategories(),
  ])

  const initialBeats: CatalogBeat[] = beats
    .filter((b) => Boolean(b.audioUrl))
    .map((b) => ({
      id: b.id,
      title: b.title,
      bpm: b.bpm,
      key: b.key,
      genre: b.genre,
      videoUrl: b.videoUrl,
      audioUrl: b.audioUrl as string,
      releaseDate: b.releaseDate,
    }))

  const usedGenres = new Set(initialBeats.map((b) => b.genre).filter(Boolean))
  const visibleCategories = categories
    .map((c) => c.name)
    .filter((name) => usedGenres.has(name))

  return <BeatsCatalogClient beats={initialBeats} categories={visibleCategories} />
}
