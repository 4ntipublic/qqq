import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Proxy (formerly middleware in Next 15) guards /admin using the real
// Supabase session. Unauthenticated visitors are bounced to /admin/login with
// a `from` hint; authenticated visitors hitting /admin/login are pushed into
// the dashboard.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const { response, user } = await updateSession(request)
  const isAuthenticated = Boolean(user)
  const isLoginRoute = pathname === '/admin/login'

  if (!isAuthenticated && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.search = ''
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('from', pathname + search)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && (isLoginRoute || pathname === '/admin')) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/admin/dashboard'
    dashUrl.search = ''
    return NextResponse.redirect(dashUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
