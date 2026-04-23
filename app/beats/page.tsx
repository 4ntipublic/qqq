import type { Metadata } from 'next'
import DashboardClient from '../_components/DashboardClient'

export const metadata: Metadata = {
  title: 'Catálogo de Beats | akpkyy',
  description: 'Catálogo completo de beats instrumentales akpkyy.',
}

export default function BeatsCatalogPage() {
  return <DashboardClient title="Catálogo de Beats" showCatalogLink={false} />
}
