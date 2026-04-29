import type { Metadata } from 'next'
import { fetchOwnProfile } from '@/lib/user-queries'
import { CheckoutClient } from './_components/checkout-client'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Finalizá tu compra.',
}

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const profile = await fetchOwnProfile()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      <CheckoutClient
        userEmail={profile?.email ?? null}
        displayName={profile?.displayName ?? ''}
      />
    </div>
  )
}
