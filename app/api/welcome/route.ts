import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transporter, FROM } from '@/lib/mailer'
import { welcomeEmail } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eden-life-academy-app.vercel.app'

export async function POST() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ ok: true, skipped: 'Gmail not configured' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const firstName = (profile?.full_name ?? user.user_metadata?.full_name ?? '').split(' ')[0] || 'Friend'

  try {
    await transporter.sendMail({
      from: FROM,
      to: user.email,
      subject: 'Welcome to Eden Life Academy',
      html: welcomeEmail(firstName, APP_URL),
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
