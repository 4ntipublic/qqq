'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { resolveAdminEmail } from '@/lib/auth'

export type LoginState = {
  error: string | null
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawIdentifier = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const from = String(formData.get('from') ?? '/admin/dashboard')

  if (!rawIdentifier || !password) {
    return { error: 'Usuario y contraseña son requeridos.' }
  }

  const email = resolveAdminEmail(rawIdentifier)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('invalid') || msg.includes('credential')) {
      return { error: 'Credenciales inválidas.' }
    }
    if (msg.includes('email') && msg.includes('confirm')) {
      return { error: 'El usuario admin no está confirmado en Supabase Auth.' }
    }
    return { error: error.message }
  }

  const safeRedirect =
    from.startsWith('/admin') && !from.startsWith('/admin/login')
      ? from
      : '/admin/dashboard'

  revalidatePath('/admin', 'layout')
  redirect(safeRedirect)
}
