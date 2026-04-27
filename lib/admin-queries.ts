import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import type { Beat, Category, Sale } from '@/lib/admin-data'

// ---------- Mappers (Supabase Row → domain type) ----------

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
  category_id: string | null
  video_url: string | null
  audio_url: string | null
  is_visible: boolean
  release_date: string | null
  created_at: string
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
  categoryId: row.category_id,
  videoUrl: row.video_url,
  audioUrl: row.audio_url,
  isVisible: row.is_visible,
  releaseDate: row.release_date,
  createdAt: row.created_at,
})

const toSale = (row: SaleRow): Sale => ({
  id: row.id,
  invoiceId: row.invoice_id,
  status: row.status,
  method: row.method,
  amount: typeof row.amount === 'string' ? Number(row.amount) : row.amount,
  createdAt: row.created_at,
})

// ---------- Queries ----------

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

export async function fetchBeats(): Promise<Beat[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beats')
    .select(
      'id, title, bpm, category_id, video_url, audio_url, is_visible, release_date, created_at'
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
    .select('id, invoice_id, status, method, amount, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[fetchSales]', error.message)
    return []
  }
  return (data ?? []).map(toSale)
}

// ---------- Aggregates for the dashboard home ----------

export interface MonthlyPoint {
  month: string // short label e.g. 'Ene'
  key: string // YYYY-MM
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

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient()

  const [beatsCountRes, categoriesCountRes, salesRes] = await Promise.all([
    supabase.from('beats').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase
      .from('sales')
      .select('amount, status, created_at')
      .order('created_at', { ascending: true }),
  ])

  const sales = (salesRes.data ?? []) as Array<{
    amount: number | string
    status: string
    created_at: string
  }>

  // Build a rolling 12-month window ending in the current month.
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
    const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount
    // Count only paid revenue; orders counts every invoice.
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
