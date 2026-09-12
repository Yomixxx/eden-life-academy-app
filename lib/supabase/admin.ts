import { createClient } from '@supabase/supabase-js'
import { cleanEnv } from '@/lib/env'

// Re-exported so existing `from '@/lib/supabase/admin'` imports keep working.
export { cleanEnv }

export function createAdminClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://rpkxyuohbmbbzoqkulgn.supabase.co'
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  return createClient(url, key)
}
