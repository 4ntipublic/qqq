import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isAdminUser } from '@/lib/auth'

/**
 * OAuth / email-confirmation callback.
 * Exchanges the `code` query param for a session cookie, then redirects.
 *
 * Default behavior:
 * - Honors `?next=/path` if it's a safe relative URL.
 * - Otherwise routes to `/admin/dashboard` for admins or `/user/settings` for regular users.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? ''
  const safeNext = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : ''

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent(error.message)}`)
  }

  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  const { data: userData } = await supabase.auth.getUser()
  const target = isAdminUser(userData.user) ? '/admin/dashboard' : '/user/settings'
  return NextResponse.redirect(`${origin}${target}`)
}
