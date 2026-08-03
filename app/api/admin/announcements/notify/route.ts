import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { transporter, FROM } from '@/lib/mailer'
import { announcementEmail } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eden-life-academy-app.vercel.app'

export async function POST(req: Request) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ ok: true, skipped: 'Gmail not configured' })
  }

  const { title, body } = await req.json()
  if (!title) return NextResponse.json({ error: 'Missing "title"' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const users = userList?.users ?? []
  if (!users.length) return NextResponse.json({ sent: 0 })

  const userIds = users.map(u => u.id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    if (p.full_name) profileMap[p.id] = p.full_name.split(' ')[0]
  }

  let sent = 0
  for (const user of users) {
    if (!user.email) continue
    const firstName = profileMap[user.id] ?? 'Beloved'
    try {
      await transporter.sendMail({
        from: FROM,
        to: user.email,
        subject: `New Announcement — ${title}`,
        html: announcementEmail(firstName, title, body ?? '', APP_URL),
      })
      sent++
    } catch {
      // continue on individual send failure
    }
  }

  return NextResponse.json({ sent })
}
