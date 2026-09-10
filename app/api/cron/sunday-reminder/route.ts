import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { sundayReminderEmail } from '@/lib/email-templates'
import { cleanEnv } from '@/lib/supabase/admin'

// Runs Saturdays. Reminds every member with an address on file about
// tomorrow's 10:00 AM Sunday service.

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

  const { data: recipients } = await supabase
    .from('profiles')
    .select('full_name, email, campus')
    .not('email', 'is', null)

  let sent = 0
  for (const recipient of recipients ?? []) {
    if (!recipient.email) continue
    const firstName = recipient.full_name?.split(' ')[0] ?? 'Friend'
    try {
      await sendEmail({
        to: recipient.email,
        subject: 'See You Tomorrow — Sunday Service, 10:00 AM',
        html: sundayReminderEmail(firstName, recipient.campus, APP_URL),
      })
      sent++
    } catch {
      // continue on individual send failure
    }
  }

  return NextResponse.json({ sent })
}
