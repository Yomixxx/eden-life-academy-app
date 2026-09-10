import { createClient } from '@supabase/supabase-js'

export function cleanEnv(val?: string | null): string {
  if (!val) return ''
  // Strip UTF-8 Byte Order Mark (0xFEFF / char code 65279) and invisible/zero-width chars
  return val
    .replace(/^[\uFEFF\xA0\u200B\u200C\u200D]+|[\uFEFF\xA0\u200B\u200C\u200D]+$/g, '')
    .trim()
}

export function createAdminClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://rpkxyuohbmbbzoqkulgn.supabase.co'
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  return createClient(url, key)
}
