import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { transporter, FROM } from '@/lib/mailer'
import { continueCourseEmail } from '@/lib/email-templates'

// Runs daily. Emails members who started a course but have gone quiet for a
// few days, nudging them to finish it. Mirrors the in-app Continue Course
// popup's "started but not finished" logic, computed from actual published
// lessons and completed lesson_progress rows rather than the possibly-stale
// courses.total_lessons column.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'
const INACTIVE_DAYS = 3
const REMINDER_COOLDOWN_DAYS = 7

function daysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ ok: true, skipped: 'Gmail not configured' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  const supabaseKey = rawKey.charCodeAt(0) === 0xFEFF ? rawKey.slice(1) : rawKey
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: candidates, error } = await supabase
    .from('enrollments')
    .select('user_id, course_id, last_activity_date, last_reminder_sent_at, courses(id, title)')
    .lte('last_activity_date', daysAgo(INACTIVE_DAYS))
    .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lte.${daysAgo(REMINDER_COOLDOWN_DAYS)}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!candidates?.length) return NextResponse.json({ sent: 0 })

  const courseIds = [...new Set(candidates.map(c => c.course_id))]
  const { data: lessons } = await supabase
    .from('lessons')
    .select('course_id')
    .eq('is_published', true)
    .in('course_id', courseIds)

  const totalByCourse: Record<string, number> = {}
  for (const l of lessons ?? []) totalByCourse[l.course_id] = (totalByCourse[l.course_id] ?? 0) + 1

  let sent = 0
  for (const c of candidates) {
    const course = Array.isArray(c.courses) ? c.courses[0] : c.courses
    if (!course) continue

    const total = totalByCourse[c.course_id] ?? 0
    if (total === 0) continue

    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', c.user_id)
      .eq('course_id', c.course_id)
      .eq('completed', true)

    const completed = completedCount ?? 0
    if (completed === 0 || completed >= total) continue

    const { data: authUser } = await supabase.auth.admin.getUserById(c.user_id)
    const email = authUser?.user?.email
    if (!email) continue

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', c.user_id).single()
    const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'

    try {
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: `Finish ${course.title} — you're almost there`,
        html: continueCourseEmail(firstName, course.title, completed, total, `${APP_URL}/catalog/${course.id}`),
      })
      await supabase
        .from('enrollments')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('user_id', c.user_id)
        .eq('course_id', c.course_id)
      sent++
    } catch {
      // continue on individual send failure
    }
  }

  return NextResponse.json({ sent, candidates: candidates.length })
}
