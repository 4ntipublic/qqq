#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Registers the akpkyy admin user in Supabase Auth.
//
// Usage:
//   node scripts/create-admin-user.mjs
//
// Requires the following env vars (already present in .env.local):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   <-- server-only, never expose to the client
//
// If the user already exists, the script exits cleanly and prints the id.
// ---------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Minimal .env.local loader so you don't need dotenv as a dep.
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    let value = m[2]
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE) {
  console.error('[create-admin-user] Missing env vars:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const ADMIN_EMAIL = 'admin@akpkyy.com'
const ADMIN_PASSWORD = 'lospibledominaranelmundopibleee'
const ADMIN_USERNAME = 'pivbleantipuvlicpky'

const supabase = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // 1. Check whether the user already exists.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listError) {
    console.error('[create-admin-user] listUsers failed:', listError.message)
    process.exit(1)
  }

  const existing = list.users.find(
    (u) => (u.email || '').toLowerCase() === ADMIN_EMAIL
  )

  if (existing) {
    console.log(`[create-admin-user] User already exists: ${existing.id}`)
    // Optional: refresh the password in case it drifted.
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          username: ADMIN_USERNAME,
          display_name: 'pible antipuvlic',
          role: 'admin_supreme',
        },
      }
    )
    if (updateError) {
      console.error('[create-admin-user] updateUserById failed:', updateError.message)
      process.exit(1)
    }
    console.log('[create-admin-user] Password + metadata refreshed.')
    return
  }

  // 2. Create the user with auto-confirmed email.
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: ADMIN_USERNAME,
      display_name: 'pible antipuvlic',
      role: 'admin_supreme',
    },
  })
  if (error) {
    console.error('[create-admin-user] createUser failed:', error.message)
    process.exit(1)
  }
  console.log(`[create-admin-user] Admin created: ${data.user?.id}`)
  console.log(`  email: ${ADMIN_EMAIL}`)
  console.log(`  username: ${ADMIN_USERNAME}`)
}

main().catch((err) => {
  console.error('[create-admin-user] unexpected error:', err)
  process.exit(1)
})
