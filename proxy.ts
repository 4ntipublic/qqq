import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { isAdminUser } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const { response, user } = await updateSession(request)

  const isAuthenticated = Boolean(user)
  const isAdmin = isAdminUser(user)
  const isLoginRoute = pathname === '/admin/login'
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isUserRoute = pathname === '/user' || pathname.startsWith('/user/')

  // Unauthenticated user trying to access any gated route → send to login.
  if (!isAuthenticated && !isLoginRoute && (isAdminRoute || isUserRoute)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.search = ''
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('from', pathname + search)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated non-admin trying to enter the admin panel → bounce to user area.
  if (isAuthenticated && !isAdmin && isAdminRoute && !isLoginRoute) {
    const userUrl = request.nextUrl.clone()
    userUrl.pathname = '/user/settings'
    userUrl.search = ''
    return NextResponse.redirect(userUrl)
  }

  // Authenticated user already on the login page → forward to their landing area.
  if (isAuthenticated && (isLoginRoute || pathname === '/admin')) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = isAdmin ? '/admin/dashboard' : '/user/settings'
    dashUrl.search = ''
    return NextResponse.redirect(dashUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/user', '/user/:path*'],
}
