// Shared types + utilities for the admin panel.
// Supabase rows are mapped to these domain types at the data-access boundary
// (see lib/admin-queries.ts).

export interface Category {
  id: string
  name: string
  slug: string
  createdAt: string | null
}

export interface Beat {
  id: string
  title: string
  bpm: number
  categoryId: string | null
  videoUrl: string | null
  audioUrl: string | null
  isVisible: boolean
  releaseDate: string | null
  createdAt: string
}

export interface Sale {
  id: string
  invoiceId: string
  status: string
  method: string
  amount: number
  createdAt: string
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48)
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}
