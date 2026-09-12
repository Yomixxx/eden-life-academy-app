import { createBrowserClient } from '@supabase/ssr'
import { cleanEnv } from '@/lib/env'

export function createClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://rpkxyuohbmbbzoqkulgn.supabase.co'
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
  return createBrowserClient(
    url,
    key,
    { cookieEncoding: 'base64url' }
  )
}
