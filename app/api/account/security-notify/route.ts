import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { securityAlertEmail } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

// Kept to a fixed set of known actions rather than accepting arbitrary
// text, so this can't be used to send an attacker-chosen message from an
// authenticated session.
const ACTIONS: Record<string, string> = {
  password_changed: 'your password was changed',
  two_factor_disabled: 'two-factor authentication was disabled',
}

export async function POST(req: Request) {
  if (!isMailerConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'Mailer not configured' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json()
  const description = ACTIONS[action]
  if (!description) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'

  try {
    await sendEmail({
      to: user.email,
      subject: 'Security Alert — Eden Life Academy',
      html: securityAlertEmail(firstName, description, APP_URL),
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
