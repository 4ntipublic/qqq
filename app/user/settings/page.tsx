import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { fetchOwnProfile, fetchOwnPurchases } from '@/lib/user-queries'
import { UserSettingsClient } from './_components/user-settings-client'

export const metadata: Metadata = {
  title: 'Mi cuenta',
  description: 'Tu perfil, seguridad y biblioteca de beats.',
}

export const dynamic = 'force-dynamic'

export default async function UserSettingsPage() {
  const profile = await fetchOwnProfile()
  if (!profile) {
    redirect('/admin/login?from=/user/settings')
  }

  const purchases = await fetchOwnPurchases()

  return <UserSettingsClient profile={profile} purchases={purchases} />
}
