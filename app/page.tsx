import type { Metadata } from 'next'
import { fetchPublicFeaturedBeats } from '@/lib/admin-queries'
import BeatsCatalogClient from './beats/_components/BeatsCatalogClient'
import type { CatalogBeat } from './beats/_components/WaveformRow'

export const metadata: Metadata = {
  // Use the absolute default from the root layout to avoid the "%s · akpkyy"
  // template doubling the brand on the home page.
  title: { absolute: 'akpkyy | Premium Beats' },
  description: 'Beats instrumentales premium, seleccionados a mano.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const featured = await fetchPublicFeaturedBeats()

  const beats: CatalogBeat[] = featured
    .filter((b) => Boolean(b.audioUrl))
    .map((b) => ({
      id: b.id,
      title: b.title,
      bpm: b.bpm,
      key: b.key,
      genre: b.genre,
      videoUrl: b.videoUrl,
      // Proxy through our server so the canonical R2 URL is never exposed.
      audioUrl: `/api/beats/${b.id}/stream`,
      releaseDate: b.releaseDate,
      featuredFormat: b.featuredFormat,
    }))

  return <BeatsCatalogClient beats={beats} categories={[]} featuredOnly />
}
