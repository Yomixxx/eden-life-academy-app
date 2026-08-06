import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
  '/dashboard', '/courses', '/catalog', '/certificates',
  '/bible', '/sermons', '/media', '/announcements', '/community', '/settings',
  '/admin',
]

const AUTH_PAGES = ['/login', '/signup']
const MFA_CHALLENGE_PAGE = '/mfa-challenge'

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
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isMfaChallenge = pathname === MFA_CHALLENGE_PAGE

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isMfaChallenge && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // A user with a verified TOTP factor holds only an aal1 session right
  // after password/Google sign-in — aal2 requires completing the code
  // challenge. Compute this once and reuse it below.
  let mfaPending = false
  if (user && (isProtected || isAuth || isMfaChallenge)) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    mfaPending = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2'
  }

  if (isAuth && user) {
    const url = request.nextUrl.clone()
    url.pathname = mfaPending ? MFA_CHALLENGE_PAGE : '/dashboard'
    return NextResponse.redirect(url)
  }

  if (isMfaChallenge && user && !mfaPending) {
    // Nothing to challenge (no factor enrolled, or already completed) —
    // don't leave the challenge page reachable once it's satisfied.
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (isProtected && user && mfaPending) {
    const url = request.nextUrl.clone()
    url.pathname = MFA_CHALLENGE_PAGE
    return NextResponse.redirect(url)
  }

  // Admin pages were previously gated only by a client-side role check
  // (bypassable — it's just JS in the browser). RLS already protects the
  // underlying data via is_admin(), but the route itself needs its own
  // server-side gate too, checked the same way RLS does.
  if (isAdminRoute && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
