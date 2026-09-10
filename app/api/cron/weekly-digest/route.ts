import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { weeklyDigestEmail } from '@/lib/email-templates'
import { cleanEnv } from '@/lib/supabase/admin'

// Runs weekly on Fridays. Emails every member with an address on file a
// roundup of sermons and announcements published in the last 7 days.
// Skipped entirely (no emails sent) if there's nothing new that week.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isMailerConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'Mailer not configured' })
  }

  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const weekAgo = new Date()
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7)
  const sinceIso = weekAgo.toISOString()

  const [{ data: sermons }, { data: announcements }] = await Promise.all([
    supabase
      .from('sermons')
      .select('title, speaker, scripture_reference')
      .eq('is_published', true)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
    supabase
      .from('announcements')
      .select('title, body')
      .eq('is_published', true)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
  ])

  if (!sermons?.length && !announcements?.length) {
    return NextResponse.json({ sent: 0, skipped: 'Nothing new this week' })
  }

  const { data: recipients } = await supabase
    .from('profiles')
    .select('full_name, email')
    .not('email', 'is', null)

  let sent = 0
  for (const recipient of recipients ?? []) {
    if (!recipient.email) continue
    const firstName = recipient.full_name?.split(' ')[0] ?? 'Friend'
    try {
      await sendEmail({
        to: recipient.email,
        subject: 'This Week at Eden Life',
        html: weeklyDigestEmail(firstName, sermons ?? [], announcements ?? [], APP_URL),
      })
      sent++
    } catch {
      // continue on individual send failure
    }
  }

  return NextResponse.json({ sent, sermons: sermons?.length ?? 0, announcements: announcements?.length ?? 0 })
}
