import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isMailerConfigured } from '@/lib/mailer'
import { cleanEnv } from '@/lib/supabase/admin'

// Public, unauthenticated health check for external uptime monitors
// (e.g. UptimeRobot / Better Stack) to poll. Deliberately cheap — just
// confirms the deployment is up and can reach the database. It does NOT
// send a real email; that's covered separately by the /api/cron/health-check
// job, since sending mail on every uptime-monitor ping (often every few
// minutes) would flood the pastoral alert inbox.

export async function GET() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'Missing Supabase env vars' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 })
  }

  return NextResponse.json({
    ok: true,
    database: 'reachable',
    mailer: isMailerConfigured() ? 'configured' : 'not configured',
    time: new Date().toISOString(),
  })
}
