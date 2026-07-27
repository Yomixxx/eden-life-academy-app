import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Bypasses RLS with the service role key — only for trusted server contexts
// (the devotions cron route), never exposed to the browser or a user session.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
