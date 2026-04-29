'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { isAdminUser, resolveAdminEmail } from '@/lib/auth'

export type LoginState = {
  error: string | null
}

export type SignupState = {
  error: string | null
  pendingEmail: string | null
}

async function getOrigin(): Promise<string> {
  const h = await headers()
  const origin = h.get('origin')
  if (origin) return origin
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawIdentifier = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const from = String(formData.get('from') ?? '')

  if (!rawIdentifier || !password) {
    return { error: 'Usuario y contraseña son requeridos.' }
  }

  const email = resolveAdminEmail(rawIdentifier)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('invalid') || msg.includes('credential')) {
      return { error: 'Credenciales inválidas.' }
    }
    if (msg.includes('email') && msg.includes('confirm')) {
      return { error: 'Tu email aún no fue confirmado. Revisá tu correo.' }
    }
    return { error: error.message }
  }

  // Role-based redirect: read fresh user from JWT.
  const { data: userData } = await supabase.auth.getUser()
  const isAdmin = isAdminUser(userData.user)

  let target: string
  if (isAdmin) {
    target =
      from.startsWith('/admin') && !from.startsWith('/admin/login')
        ? from
        : '/admin/dashboard'
  } else {
    const allowedNonAdminFrom =
      from.startsWith('/user') || from.startsWith('/checkout')
    target = allowedNonAdminFrom ? from : '/user/settings'
  }

  revalidatePath('/', 'layout')
  redirect(target)
}

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const displayName = String(formData.get('display_name') ?? '').trim()

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos.', pendingEmail: null }
  }

  if (!email.includes('@') || email.length < 5) {
    return { error: 'Email inválido.', pendingEmail: null }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.', pendingEmail: null }
  }

  const origin = await getOrigin()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/user/settings`,
      data: displayName ? { display_name: displayName } : undefined,
    },
  })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('already') || msg.includes('registered')) {
      return { error: 'Ya existe una cuenta con ese email.', pendingEmail: null }
    }
    return { error: error.message, pendingEmail: null }
  }

  // If email confirmation is required, session is null and user must confirm via email.
  if (!data.session) {
    return { error: null, pendingEmail: email }
  }

  // Confirmation disabled in Supabase → session granted immediately, redirect.
  revalidatePath('/', 'layout')
  redirect('/user/settings')
}
