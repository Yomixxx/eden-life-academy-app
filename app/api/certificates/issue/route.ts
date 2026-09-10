import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { certificateEmail } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

// Called after a member marks a lesson complete. Idempotent and safe to
// call repeatedly — only issues a certificate the first time every
// published lesson in the course is complete, and only ever for the
// caller's own progress (verified server-side via their session before
// the privileged service-role insert below).
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await req.json()
  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
  }

  const admin = createAdminClient()

  const [{ count: totalLessons }, { count: completedLessons }, { data: existing }] = await Promise.all([
    admin.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', courseId).eq('is_published', true),
    admin.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('course_id', courseId).eq('completed', true),
    admin.from('certificates').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
  ])

  if (existing) return NextResponse.json({ issued: false, alreadyIssued: true })
  if (!totalLessons || (completedLessons ?? 0) < totalLessons) {
    return NextResponse.json({ issued: false, incomplete: true })
  }

  const certificateNumber = `ELA-CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const { data: cert, error } = await admin
    .from('certificates')
    .insert({ user_id: user.id, course_id: courseId, certificate_number: certificateNumber })
    .select()
    .single()

  if (error || !cert) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  if (isMailerConfigured() && user.email) {
    const [{ data: profile }, { data: course }] = await Promise.all([
      admin.from('profiles').select('full_name').eq('id', user.id).single(),
      admin.from('courses').select('title').eq('id', courseId).single(),
    ])
    const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'
    try {
      await sendEmail({
        to: user.email,
        subject: `Certificate Earned — ${course?.title ?? 'Your Course'}`,
        html: certificateEmail(firstName, course?.title ?? 'Your Course', certificateNumber, APP_URL),
      })
    } catch {
      // Best-effort — the certificate record is the source of truth.
    }
  }

  return NextResponse.json({ issued: true, certificateNumber })
}
