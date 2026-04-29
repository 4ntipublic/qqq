import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import type { Beat, Category, Sale } from '@/lib/admin-data'

type CategoryRow = {
  id: string
  name: string
  slug: string
  created_at?: string | null
}

type BeatRow = {
  id: string
  title: string
  bpm: number
  key: string | null
  category_id: string | null
  video_url: string | null
  audio_url: string | null
  is_visible: boolean
  release_date: string | null
  created_at: string
  size_mb: number | string | null
}

type SaleRow = {
  id: string
  invoice_id: string
  status: string
  method: string
  amount: number | string
  created_at: string
}

const toCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  createdAt: row.created_at ?? null,
})

const toBeat = (row: BeatRow): Beat => ({
  id: row.id,
  title: row.title,
  bpm: row.bpm,
  key: row.key ?? null,
  categoryId: row.category_id,
  videoUrl: row.video_url,
  audioUrl: row.audio_url,
  isVisible: row.is_visible,
  releaseDate: row.release_date,
  createdAt: row.created_at,
  sizeMb:
    row.size_mb === null || row.size_mb === undefined
      ? null
      : typeof row.size_mb === 'string'
        ? Number(row.size_mb)
        : row.size_mb,
})

const toSale = (row: SaleRow): Sale => ({
  id: row.id,
  invoiceId: row.invoice_id,
  status: row.status,
  method: row.method,
  amount: typeof row.amount === 'string' ? Number(row.amount) : row.amount,
  createdAt: row.created_at,
})

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, created_at')
    .order('name', { ascending: true })
  if (error) {
    console.error('[fetchCategories]', error.message)
    return []
  }
  return (data ?? []).map(toCategory)
}

export interface PublicBeat {
  id: string
  title: string
  bpm: number
  key: string
  genre: string
  videoUrl: string | null
  audioUrl: string | null
  releaseDate: string | null
}

export async function fetchPublicBeats(): Promise<PublicBeat[]> {
  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  const [beatsRes, catsRes] = await Promise.all([
    supabase
      .from('beats')
      .select('id, title, bpm, key, category_id, video_url, audio_url, release_date, created_at')
      .eq('is_visible', true)
      .or(`release_date.is.null,release_date.lte.${nowIso}`)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name'),
  ])

  if (beatsRes.error) {
    console.error('[fetchPublicBeats]', beatsRes.error.message)
    return []
  }

  const catMap = new Map<string, string>()
  for (const row of (catsRes.data ?? []) as Array<{ id: string; name: string }>) {
    catMap.set(row.id, row.name)
  }

  type RowShape = {
    id: string
    title: string
    bpm: number
    key: string | null
    category_id: string | null
    video_url: string | null
    audio_url: string | null
    release_date: string | null
  }

  return ((beatsRes.data ?? []) as RowShape[]).map((row) => ({
    id: row.id,
    title: row.title,
    bpm: row.bpm,
    key: row.key ?? '',
    genre: row.category_id ? catMap.get(row.category_id) ?? 'Sin género' : 'Sin género',
    videoUrl: row.video_url,
    audioUrl: row.audio_url,
    releaseDate: row.release_date,
  }))
}

export interface PublicFeaturedBeat extends PublicBeat {
  featuredFormat: 'grid' | 'list'
  featuredOrder: number
}

export async function fetchPublicFeaturedBeats(): Promise<PublicFeaturedBeat[]> {
  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  const [beatsRes, catsRes] = await Promise.all([
    supabase
      .from('beats')
      .select(
        'id, title, bpm, key, category_id, video_url, audio_url, release_date, featured_format, featured_order'
      )
      .eq('is_visible', true)
      .eq('is_featured', true)
      .or(`release_date.is.null,release_date.lte.${nowIso}`)
      .order('featured_order', { ascending: true, nullsFirst: false }),
    supabase.from('categories').select('id, name'),
  ])

  if (beatsRes.error) {
    console.error('[fetchPublicFeaturedBeats]', beatsRes.error.message)
    return []
  }

  const catMap = new Map<string, string>()
  for (const row of (catsRes.data ?? []) as Array<{ id: string; name: string }>) {
    catMap.set(row.id, row.name)
  }

  type RowShape = {
    id: string
    title: string
    bpm: number
    key: string | null
    category_id: string | null
    video_url: string | null
    audio_url: string | null
    release_date: string | null
    featured_format: string | null
    featured_order: number | null
  }

  return ((beatsRes.data ?? []) as RowShape[]).map((row, idx) => ({
    id: row.id,
    title: row.title,
    bpm: row.bpm,
    key: row.key ?? '',
    genre: row.category_id ? catMap.get(row.category_id) ?? 'Sin género' : 'Sin género',
    videoUrl: row.video_url,
    audioUrl: row.audio_url,
    releaseDate: row.release_date,
    featuredFormat: row.featured_format === 'list' ? 'list' : 'grid',
    featuredOrder: typeof row.featured_order === 'number' ? row.featured_order : idx,
  }))
}

export interface FeaturedAdminBeat {
  id: string
  title: string
  bpm: number
  key: string
  genre: string
  videoUrl: string | null
  audioUrl: string | null
  isFeatured: boolean
  featuredFormat: 'grid' | 'list'
  featuredOrder: number | null
}

export async function fetchFeaturedAdminBeats(): Promise<FeaturedAdminBeat[]> {
  const supabase = createAdminClient()

  const [beatsRes, catsRes] = await Promise.all([
    supabase
      .from('beats')
      .select(
        'id, title, bpm, key, category_id, video_url, audio_url, is_featured, featured_format, featured_order, created_at'
      )
      .eq('is_visible', true)
      .order('is_featured', { ascending: false })
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name'),
  ])

  if (beatsRes.error) {
    console.error('[fetchFeaturedAdminBeats]', beatsRes.error.message)
    return []
  }

  const catMap = new Map<string, string>()
  for (const row of (catsRes.data ?? []) as Array<{ id: string; name: string }>) {
    catMap.set(row.id, row.name)
  }

  type RowShape = {
    id: string
    title: string
    bpm: number
    key: string | null
    category_id: string | null
    video_url: string | null
    audio_url: string | null
    is_featured: boolean | null
    featured_format: string | null
    featured_order: number | null
  }

  return ((beatsRes.data ?? []) as RowShape[]).map((row) => ({
    id: row.id,
    title: row.title,
    bpm: row.bpm,
    key: row.key ?? '',
    genre: row.category_id ? catMap.get(row.category_id) ?? 'Sin género' : 'Sin género',
    videoUrl: row.video_url,
    audioUrl: row.audio_url,
    isFeatured: Boolean(row.is_featured),
    featuredFormat: row.featured_format === 'list' ? 'list' : 'grid',
    featuredOrder: row.featured_order,
  }))
}

export async function fetchBeats(): Promise<Beat[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beats')
    .select(
      'id, title, bpm, key, category_id, video_url, audio_url, is_visible, release_date, created_at, size_mb'
    )
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[fetchBeats]', error.message)
    return []
  }
  return (data ?? []).map(toBeat)
}

export async function fetchSales(): Promise<Sale[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sales')
    .select('id, invoice_id, status, payment_method, amount_cents, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[fetchSales]', error.message)
    return []
  }
  type Row = {
    id: string
    invoice_id: string
    status: string
    payment_method: string
    amount_cents: number | null
    created_at: string
  }
  return ((data as Row[] | null) ?? []).map((row) => ({
    id: row.id,
    invoiceId: row.invoice_id,
    status: row.status,
    method: row.payment_method,
    amount: (row.amount_cents ?? 0) / 100,
    createdAt: row.created_at,
  }))
}

// Richer query for the admin sales panel — includes beat title, buyer info,
// and amount in cents so the UI can render currency precisely.
export interface AdminSale {
  id: string
  invoiceId: string
  status: string
  paymentMethod: string
  amountCents: number
  currency: string
  buyerEmail: string
  buyerName: string | null
  beatTitle: string | null
  createdAt: string
}

export async function fetchAdminSales(): Promise<AdminSale[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, invoice_id, status, payment_method, amount_cents, currency, buyer_email, user_id, created_at, beats(title)'
    )
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) {
    console.error('[fetchAdminSales]', error.message)
    return []
  }

  type Row = {
    id: string
    invoice_id: string
    status: string
    payment_method: string
    amount_cents: number | null
    currency: string | null
    buyer_email: string | null
    user_id: string | null
    created_at: string
    beats: { title: string } | { title: string }[] | null
  }
  const rows = (data as Row[] | null) ?? []

  // Resolve buyer display names in one batch.
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((v): v is string => Boolean(v)))
  )
  const nameByUser = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)
    type Profile = { id: string; display_name: string | null; email: string | null }
    ;((profiles as Profile[] | null) ?? []).forEach((p) => {
      nameByUser.set(p.id, p.display_name ?? p.email ?? null)
    })
  }

  return rows.map((row) => {
    const beat = Array.isArray(row.beats) ? row.beats[0] : row.beats
    return {
      id: row.id,
      invoiceId: row.invoice_id,
      status: row.status,
      paymentMethod: row.payment_method,
      amountCents: row.amount_cents ?? 0,
      currency: row.currency ?? 'USD',
      buyerEmail: row.buyer_email ?? '',
      buyerName: row.user_id ? (nameByUser.get(row.user_id) ?? null) : null,
      beatTitle: beat?.title ?? null,
      createdAt: row.created_at,
    }
  })
}

export interface MonthlyPoint {
  month: string
  key: string
  revenue: number
  orders: number
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export interface DashboardStats {
  totalBeats: number
  totalCategories: number
  salesMonth: number
  salesMonthAmount: number
  monthly: MonthlyPoint[]
}

// ============================================================================
// USERS (admin-only)
// ============================================================================

export interface AdminUser {
  id: string
  email: string
  displayName: string
  phone: string
  instagram: string
  soundcloud: string
  spotify: string
  avatarUrl: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  totalSales: number
  totalSpentCents: number
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const supabase = createAdminClient()

  const [profilesRes, salesRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select(
        'id, email, display_name, phone, instagram, soundcloud, spotify, avatar_url, is_admin, created_at, updated_at'
      )
      .order('created_at', { ascending: false }),
    supabase.from('sales').select('user_id, buyer_email, amount_cents, status'),
  ])

  if (profilesRes.error) throw profilesRes.error

  type SaleRow = {
    user_id: string | null
    buyer_email: string | null
    amount_cents: number | null
    status: string | null
  }
  const sales: SaleRow[] = (salesRes.data as SaleRow[] | null) ?? []
  const paidSales = sales.filter((s) => s.status === 'Pagada')

  type ProfileRow = {
    id: string
    email: string
    display_name: string | null
    phone: string | null
    instagram: string | null
    soundcloud: string | null
    spotify: string | null
    avatar_url: string | null
    is_admin: boolean | null
    created_at: string
    updated_at: string
  }

  return ((profilesRes.data as ProfileRow[] | null) ?? []).map((row) => {
    const matched = paidSales.filter(
      (s) => s.user_id === row.id || (s.buyer_email && s.buyer_email === row.email)
    )
    const totalSpentCents = matched.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0)
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name ?? '',
      phone: row.phone ?? '',
      instagram: row.instagram ?? '',
      soundcloud: row.soundcloud ?? '',
      spotify: row.spotify ?? '',
      avatarUrl: row.avatar_url,
      isAdmin: Boolean(row.is_admin),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalSales: matched.length,
      totalSpentCents,
    }
  })
}

export interface AdminUserSale {
  id: string
  invoiceId: string
  beatId: string | null
  beatTitle: string
  status: string
  paymentMethod: string
  amountCents: number
  currency: string
  createdAt: string
}

export async function fetchAdminUserSales(
  userId: string,
  email: string | null
): Promise<AdminUserSale[]> {
  const supabase = createAdminClient()

  const orFilter = email
    ? `user_id.eq.${userId},buyer_email.eq.${email}`
    : `user_id.eq.${userId}`

  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, invoice_id, beat_id, status, payment_method, amount_cents, currency, created_at, beats(title)'
    )
    .or(orFilter)
    .order('created_at', { ascending: false })

  if (error) throw error

  type Row = {
    id: string
    invoice_id: string
    beat_id: string | null
    status: string
    payment_method: string
    amount_cents: number
    currency: string
    created_at: string
    beats: { title: string } | { title: string }[] | null
  }

  return ((data as Row[] | null) ?? []).map((row) => {
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
    }
  })
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient()

  const [beatsCountRes, categoriesCountRes, salesRes] = await Promise.all([
    supabase.from('beats').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase
      .from('sales')
      .select('amount_cents, status, created_at')
      .order('created_at', { ascending: true }),
  ])

  const sales = (salesRes.data ?? []) as Array<{
    amount_cents: number | null
    status: string
    created_at: string
  }>

  const now = new Date()
  const buckets = new Map<string, MonthlyPoint>()
  for (let offset = 11; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, {
      month: MONTH_LABELS[d.getMonth()],
      key,
      revenue: 0,
      orders: 0,
    })
  }

  for (const row of sales) {
    const d = new Date(row.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.get(key)
    if (!bucket) continue
    const amount = (row.amount_cents ?? 0) / 100
    if (row.status?.toLowerCase() === 'pagada') {
      bucket.revenue += Number.isFinite(amount) ? amount : 0
    }
    bucket.orders += 1
  }

  const monthly = Array.from(buckets.values())
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonth = monthly.find((m) => m.key === currentKey)

  return {
    totalBeats: beatsCountRes.count ?? 0,
    totalCategories: categoriesCountRes.count ?? 0,
    salesMonth: currentMonth?.orders ?? 0,
    salesMonthAmount: currentMonth?.revenue ?? 0,
    monthly,
  }
}
