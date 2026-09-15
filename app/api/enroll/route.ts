import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { registrationConfirmationEmail } from '@/lib/email-templates'
import {
  CURRENT_COHORT_COURSE_ID,
  CURRENT_COHORT_COURSE_TITLE,
  CURRENT_COHORT_LABEL,
  ACADEMY_LEVELS,
  resolveAcademyLevel,
} from '@/lib/academy'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

// Enroll via the course catalog's Enroll button — used by anyone who chose
// "just explore" at signup and later changes their mind. For the current
// cohort course this is a full registration (cohort tag + level + matric
// number + confirmation email), same as the dedicated /register link, not
// just a bare enrollment row. Runs on the service-role client (after
// authenticating the caller's session first) since regular users don't have
// an UPDATE grant on enrollments — only their own INSERT/SELECT.
//
// Also used by PickAcademyLevel to finish incomplete cohort rows that were
// created without a level/matric (admin bulk imports, older code paths).
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const courseId = typeof body.courseId === 'string' ? body.courseId : null
  const academyLevel = body.academyLevel
  if (!courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
  }

  const isCohortCourse = courseId === CURRENT_COHORT_COURSE_ID
  const admin = createAdminClient()

  try {
    const { data: existing } = await admin
      .from('enrollments')
      .select('id, academy_level, cohort, matric_number')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    // Prefer the level the caller just chose; fall back to whatever is already
    // on the row so a re-submit never wipes a known level with null.
    const level = isCohortCourse
      ? resolveAcademyLevel(academyLevel, existing?.academy_level ?? null)
      : null

    if (isCohortCourse && !level) {
      return NextResponse.json({ error: 'Please select a level' }, { status: 400 })
    }

    const { data: enrollment, error } = await admin
      .from('enrollments')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          ...(isCohortCourse
            ? { academy_level: level, cohort: CURRENT_COHORT_LABEL }
            : {}),
        },
        { onConflict: 'user_id,course_id', ignoreDuplicates: false }
      )
      .select('matric_number, academy_level, cohort')
      .single()

    if (error || !enrollment) {
      return NextResponse.json({ error: error?.message ?? 'Enrollment failed' }, { status: 500 })
    }

    // Belt-and-suspenders: if the row still has no matric after upsert (e.g.
    // trigger only existed for INSERT when the row was first created), touch
    // it so the BEFORE UPDATE matric trigger assigns one now.
    let matricNumber = enrollment.matric_number ?? null
    if (isCohortCourse && !matricNumber) {
      const { data: touched } = await admin
        .from('enrollments')
        .update({ cohort: CURRENT_COHORT_LABEL, academy_level: level })
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .select('matric_number')
        .single()
      matricNumber = touched?.matric_number ?? null
    }

    const isNewRegistration = !existing
    if (isNewRegistration && isCohortCourse && isMailerConfigured() && user.email) {
      const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
      const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'
      try {
        await sendEmail({
          to: user.email,
          subject: `You are registered — ${CURRENT_COHORT_COURSE_TITLE}`,
          html: registrationConfirmationEmail(
            firstName,
            CURRENT_COHORT_COURSE_TITLE,
            level as (typeof ACADEMY_LEVELS)[number],
            matricNumber,
            APP_URL,
          ),
        })
      } catch {
        // Best-effort — never block enrollment on email delivery.
      }
    }

    return NextResponse.json({
      matricNumber,
      academyLevel: level,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Enrollment failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
