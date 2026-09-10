import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cleanEnv } from './admin'

export async function createClient() {
  const cookieStore = await cookies()

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      } catch {
        // The `setAll` method was called from a Server Component.
        // This can be ignored if you have middleware refreshing
        // user sessions.
      }
    },
  }

  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://rpkxyuohbmbbzoqkulgn.supabase.co'
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  return createServerClient(
    url,
    key,
    { cookieEncoding: 'base64url', cookies: cookieMethods }
  )
}
