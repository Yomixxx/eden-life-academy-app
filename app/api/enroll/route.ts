import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { registrationConfirmationEmail } from '@/lib/email-templates'
import { CURRENT_COHORT_COURSE_ID, CURRENT_COHORT_COURSE_TITLE, CURRENT_COHORT_LABEL, ACADEMY_LEVELS } from '@/lib/academy'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

// Enroll via the course catalog's Enroll button — used by anyone who chose
// "just explore" at signup and later changes their mind. For the current
// cohort course this is a full registration (cohort tag + level + matric
// number + confirmation email), same as the dedicated /register link, not
// just a bare enrollment row. Runs on the service-role client (after
// authenticating the caller's session first) since regular users don't have
// an UPDATE grant on enrollments — only their own INSERT/SELECT.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, academyLevel } = await req.json()
  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
  }

  const isCohortCourse = courseId === CURRENT_COHORT_COURSE_ID
  const level = ACADEMY_LEVELS.includes(academyLevel) ? academyLevel : null
  if (isCohortCourse && !level) {
    return NextResponse.json({ error: 'Please select a level' }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existing } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  const { data: enrollment, error } = await admin
    .from('enrollments')
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        ...(isCohortCourse ? { academy_level: level, cohort: CURRENT_COHORT_LABEL } : {}),
      },
      { onConflict: 'user_id,course_id', ignoreDuplicates: false }
    )
    .select('matric_number')
    .single()

  if (error || !enrollment) {
    return NextResponse.json({ error: error?.message ?? 'Enrollment failed' }, { status: 500 })
  }

  if (!existing && isCohortCourse && isMailerConfigured() && user.email) {
    const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
    const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'
    try {
      await sendEmail({
        to: user.email,
        subject: `You are registered — ${CURRENT_COHORT_COURSE_TITLE}`,
        html: registrationConfirmationEmail(firstName, CURRENT_COHORT_COURSE_TITLE, level, enrollment.matric_number ?? null, APP_URL),
      })
    } catch {
      // Best-effort — never block enrollment on email delivery.
    }
  }

  return NextResponse.json({ matricNumber: enrollment.matric_number ?? null })
}
