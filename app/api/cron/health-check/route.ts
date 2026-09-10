import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { sendPhoneAlert, isPhoneAlertConfigured } from '@/lib/health-alert'
import { cleanEnv } from '@/lib/supabase/admin'

// Runs every few hours. Unlike /api/health (a cheap uptime ping), this
// exercises the EXACT same relay call the crisis-escalation path in
// /api/ai-chat uses to email pastoral staff — because "the page loads" and
// "a crisis alert actually sends" are different failure modes, and this
// project's email relay has already broken silently once before (the prior
// Google Apps Script relay it replaced). Failures alert a phone via ntfy,
// a channel independent of the mailer itself, since alerting through the
// thing that's broken doesn't work.

const ALERT_EMAIL = process.env.HEALTH_CHECK_EMAIL || process.env.PASTORAL_ALERT_EMAIL

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const failures: string[] = []

  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!supabaseUrl || !supabaseKey) {
    failures.push('Missing Supabase env vars')
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) failures.push(`Database unreachable: ${error.message}`)
  }

  if (!isMailerConfigured()) {
    failures.push('Email relay not configured (RESEND_API_KEY missing)')
  } else if (!ALERT_EMAIL) {
    failures.push('No HEALTH_CHECK_EMAIL or PASTORAL_ALERT_EMAIL set to test delivery against')
  } else {
    try {
      await sendEmail({
        to: ALERT_EMAIL,
        subject: '[Automated] Eden Life Academy health check',
        html: `<p>This is a scheduled automated test of the email relay used for pastoral crisis alerts. No action needed — it confirms the relay is working.</p><p>${new Date().toISOString()}</p>`,
      })
    } catch (err) {
      failures.push(`Email relay call failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (failures.length > 0) {
    await sendPhoneAlert(
      '🚨 Eden Life Academy health check failed',
      failures.join('\n')
    )
    return NextResponse.json({ ok: false, failures, phoneAlertSent: isPhoneAlertConfigured() }, { status: 503 })
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() })
}
