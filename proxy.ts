import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
  '/dashboard', '/courses', '/catalog', '/certificates',
  '/bible', '/sermons', '/media', '/announcements', '/community', '/settings',
  '/admin',
]

const AUTH_PAGES = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies.getAll()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      response = NextResponse.next({ request })
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    },
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieEncoding: 'base64url', cookies: cookieMethods }
  )

  // Unlike checking for cookie presence, getUser() actually verifies the
  // session with Supabase and — critically — writes back cleared cookies
  // via setAll above when a refresh token is invalid. That's what breaks
  // the login <-> dashboard redirect loop a stale cookie used to cause.
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuth = AUTH_PAGES.some(r => pathname === r || pathname.startsWith(r + '/'))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuth && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
