import 'server-only'
import { createClient as createSsrClient } from '@/utils/supabase/server'
import { isAdminUser } from '@/lib/auth'

export type GuardResult = { ok: boolean; error?: string }

/**
 * Server-action guard: confirms the caller is authenticated AND has the admin role.
 * Use at the top of every admin server action.
 */
export async function assertAdmin(): Promise<GuardResult> {
  const supabase = await createSsrClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false, error: 'No autorizado.' }
  }
  if (!isAdminUser(data.user)) {
    return { ok: false, error: 'Acceso restringido al panel de administración.' }
  }
  return { ok: true }
}
