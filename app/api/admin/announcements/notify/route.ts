import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { announcementEmail } from '@/lib/email-templates'
import { cleanEnv } from '@/lib/env'

const APP_URL = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || 'https://app.edenlifeng.org'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!isMailerConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'Mailer not configured' })
  }

  const { title, body } = await req.json()
  if (!title || typeof title !== 'string') return NextResponse.json({ error: 'Missing "title"' }, { status: 400 })

  const admin = createAdminClient()

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
  for (const target of users) {
    if (!target.email) continue
    const firstName = profileMap[target.id] ?? 'Beloved'
    try {
      await sendEmail({
        to: target.email,
        subject: `New Announcement — ${title}`,
        html: announcementEmail(firstName, title, typeof body === 'string' ? body : '', APP_URL),
      })
      sent++
    } catch {
      // continue on individual send failure
    }
  }

  return NextResponse.json({ sent })
}
