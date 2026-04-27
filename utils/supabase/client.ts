'use client'

import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client. Uses the anon key and reads/writes the session
// cookie via @supabase/ssr so SSR and client share the same auth context.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }
  return createBrowserClient(url, anonKey)
}
