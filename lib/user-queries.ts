import 'server-only'
import { createClient as createSsrClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  phone: string
  instagram: string
  soundcloud: string
  spotify: string
  avatarUrl: string | null
  isAdmin: boolean
}

const EMPTY_PROFILE = (id: string, email: string, isAdmin = false): UserProfile => ({
  id,
  email,
  displayName: email.split('@')[0] ?? '',
  phone: '',
  instagram: '',
  soundcloud: '',
  spotify: '',
  avatarUrl: null,
  isAdmin,
})

/**
 * Fetch the authenticated user's profile via the SSR client (RLS-protected).
 * Returns null if no session.
 */
export async function fetchOwnProfile(): Promise<UserProfile | null> {
  const supabase = await createSsrClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return null

  // Read is_admin from the JWT app_metadata (authoritative source enforced by middleware).
  const jwtIsAdmin = Boolean(
    (user.app_metadata as Record<string, unknown> | undefined)?.is_admin
  )

  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'id, email, display_name, phone, instagram, soundcloud, spotify, avatar_url, is_admin'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[fetchOwnProfile]', error.message)
    return EMPTY_PROFILE(user.id, user.email ?? '', jwtIsAdmin)
  }
  if (!data) return EMPTY_PROFILE(user.id, user.email ?? '', jwtIsAdmin)

  return {
    id: data.id as string,
    email: (data.email as string) ?? user.email ?? '',
    displayName: (data.display_name as string) ?? '',
    phone: (data.phone as string) ?? '',
    instagram: (data.instagram as string) ?? '',
    soundcloud: (data.soundcloud as string) ?? '',
    spotify: (data.spotify as string) ?? '',
    avatarUrl: (data.avatar_url as string) ?? null,
    isAdmin: jwtIsAdmin || Boolean(data.is_admin),
  }
}

export interface UserPurchase {
  id: string
  invoiceId: string
  beatId: string | null
  beatTitle: string
  status: string
  paymentMethod: string
  amountCents: number
  currency: string
  createdAt: string
  /** True when the beat has a contract attached and ready to download. */
  hasContract: boolean
}

/**
 * Fetch the authenticated user's purchase history.
 * Sales are matched by user_id (preferred) and falling back to buyer_email.
 */
export async function fetchOwnPurchases(): Promise<UserPurchase[]> {
  const supabase = await createSsrClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return []

  // Use the admin client for the join — sales has no RLS policies for users yet,
  // and we explicitly filter to this user's id/email so it's still safe.
  const admin = createAdminClient()
  const filter = user.email
    ? `user_id.eq.${user.id},buyer_email.eq.${user.email}`
    : `user_id.eq.${user.id}`

  const { data, error } = await admin
    .from('sales')
    .select(
      'id, invoice_id, beat_id, status, payment_method, amount_cents, currency, created_at, beats(title, contract_url)'
    )
    .or(filter)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchOwnPurchases]', error.message)
    return []
  }

  type BeatRel = { title: string; contract_url: string | null }
  type Row = {
    id: string
    invoice_id: string
    beat_id: string | null
    status: string
    payment_method: string
    amount_cents: number
    currency: string
    created_at: string
    beats: BeatRel | BeatRel[] | null
  }

  return (data as Row[] | null ?? []).map((row) => {
    const beat = Array.isArray(row.beats) ? row.beats[0] : row.beats
    return {
      id: row.id,
      invoiceId: row.invoice_id,
      beatId: row.beat_id,
      beatTitle: beat?.title ?? 'Beat eliminado',
      status: row.status,
      paymentMethod: row.payment_method,
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.created_at,
      hasContract: Boolean(beat?.contract_url),
    }
  })
}
