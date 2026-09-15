import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { registrationConfirmationEmail } from '@/lib/email-templates'
import {
  CURRENT_COHORT_COURSE_ID,
  CURRENT_COHORT_COURSE_TITLE,
  CURRENT_COHORT_LABEL,
  resolveAcademyLevel,
} from '@/lib/academy'
import PickAcademyLevel from '@/components/PickAcademyLevel'

// This is the one central "register for Cohort 3" link — every new or
// returning visitor who signs up or logs in through it is enrolled here
// automatically, then dropped on the course page. No manual Enroll click.
//
// Incomplete rows (no level and/or no matric) are finished here too: missing
// level → PickAcademyLevel; missing matric with a known level → admin upsert
// so the matric trigger can assign one even when the student lacks UPDATE.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?next=/register')

  const metaLevel = user.user_metadata?.academy_level

  // Service role: regular members often only have INSERT/SELECT on enrollments,
  // so completing an existing incomplete row (UPDATE + matric trigger) must
  // go through admin. Auth is still gated on the caller's session above.
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('enrollments')
    .select('id, academy_level, matric_number, cohort')
    .eq('user_id', user.id)
    .eq('course_id', CURRENT_COHORT_COURSE_ID)
    .maybeSingle()

  // Auth metadata is only populated by the signup/setup flows. Someone who
  // explored first and later enrolled through the catalog has their level on
  // the enrollment row but not in metadata — falling back to it here stops
  // this link from overwriting a known level with NULL, which silently took
  // away their live class card and join button.
  const existingLevel = existing?.academy_level ?? null
  const academyLevel = resolveAcademyLevel(metaLevel, existingLevel)

  if (!academyLevel) {
    // Never create a cohort enrollment without a level: the level is the key
    // the whole live-class feature (dashboard banner, course card, attendance)
    // looks up class_links by, so a null level means no join button at all.
    return <PickAcademyLevel />
  }

  const wasNew = !existing

  const { data: enrollment, error } = await admin
    .from('enrollments')
    .upsert(
      {
        user_id: user.id,
        course_id: CURRENT_COHORT_COURSE_ID,
        academy_level: academyLevel,
        cohort: CURRENT_COHORT_LABEL,
      },
      { onConflict: 'user_id,course_id', ignoreDuplicates: false }
    )
    .select('matric_number')
    .single()

  // If upsert left matric null (legacy INSERT-only trigger window), touch the
  // row so the UPDATE trigger assigns one without changing the level/cohort.
  let matricNumber = enrollment?.matric_number ?? null
  if (!error && !matricNumber) {
    const { data: touched } = await admin
      .from('enrollments')
      .update({ cohort: CURRENT_COHORT_LABEL, academy_level: academyLevel })
      .eq('user_id', user.id)
      .eq('course_id', CURRENT_COHORT_COURSE_ID)
      .select('matric_number')
      .single()
    matricNumber = touched?.matric_number ?? null
  }

  if (wasNew && isMailerConfigured() && user.email) {
    const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
    const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'
    try {
      await sendEmail({
        to: user.email,
        subject: `You are registered — ${CURRENT_COHORT_COURSE_TITLE}`,
        html: registrationConfirmationEmail(
          firstName,
          CURRENT_COHORT_COURSE_TITLE,
          academyLevel,
          matricNumber,
          APP_URL,
        ),
      })
    } catch {
      // Best-effort — never block registration on email delivery.
    }
  }

  redirect(`/catalog/${CURRENT_COHORT_COURSE_ID}`)
}
