import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

export const ADMIN_USERNAME = 'pivbleantipuvlicpky'
export const ADMIN_EMAIL = 'admin@akpkyy.com'

export function resolveAdminEmail(identifier: string): string {
  const value = identifier.trim()
  if (!value) return value
  if (value.includes('@')) return value.toLowerCase()
  if (value.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return ADMIN_EMAIL
  return value.toLowerCase()
}

export interface AdminProfile {
  displayName: string
  username: string
  email: string
  role: string
  initial: string
}

export function buildAdminProfile(user: User | null): AdminProfile {
  const email = user?.email ?? ADMIN_EMAIL
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    'pible antipuvlic'
  const username =
    (typeof meta.username === 'string' && meta.username) || ADMIN_USERNAME
  return {
    displayName,
    username,
    email,
    role: 'Admin Supreme',
    initial: (displayName[0] ?? 'P').toUpperCase(),
  }
}

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function getAdminProfile(): Promise<AdminProfile> {
  const user = await getAdminUser()
  return buildAdminProfile(user)
}
