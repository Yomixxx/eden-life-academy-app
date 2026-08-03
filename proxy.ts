import { NextResponse, type NextRequest } from 'next/server'

const PROJECT_REF = 'rpkxyuohbmbbzoqkulgn'

const PROTECTED = [
  '/dashboard', '/courses', '/catalog', '/certificates',
  '/bible', '/sermons', '/media', '/announcements', '/community', '/settings',
  '/admin',
]

const AUTH_PAGES = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuth = AUTH_PAGES.some(r => pathname === r || pathname.startsWith(r + '/'))

  const hasSession =
    request.cookies.has(`sb-${PROJECT_REF}-auth-token`) ||
    request.cookies.has(`sb-${PROJECT_REF}-auth-token.0`)

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuth && hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
