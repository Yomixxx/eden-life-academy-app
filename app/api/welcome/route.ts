import { NextResponse } from 'next/server'
import { transporter, FROM } from '@/lib/mailer'
import { welcomeEmail } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eden-life-academy-app.vercel.app'

export async function POST(req: Request) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ ok: true, skipped: 'Gmail not configured' })
  }

  const { to, firstName } = await req.json()
  if (!to) return NextResponse.json({ error: 'Missing "to"' }, { status: 400 })

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Welcome to Eden Life Academy',
      html: welcomeEmail(firstName || 'Friend', APP_URL),
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
