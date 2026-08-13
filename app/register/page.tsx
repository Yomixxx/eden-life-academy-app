import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { registrationConfirmationEmail } from '@/lib/email-templates'

// This is the one central "register for Cohort 3" link — every new or
// returning visitor who signs up or logs in through it is enrolled here
// automatically, then dropped on the course page. No manual Enroll click.
const COHORT_3_COURSE_ID = '4b69dd08-a1ce-4f50-8a91-e35aa1d755e0'
const COHORT_3_TITLE = 'EdenLife Academy (ELA) — Cohort 3'
const COHORT_LABEL = 'Cohort 3 2026'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?next=/register')

  const academyLevel = typeof user.user_metadata?.academy_level === 'string' ? user.user_metadata.academy_level : null

  // Checked before the upsert so the confirmation email only fires on a
  // genuinely new registration, not every time this link is revisited.
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', COHORT_3_COURSE_ID)
    .maybeSingle()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .upsert(
      { user_id: user.id, course_id: COHORT_3_COURSE_ID, academy_level: academyLevel, cohort: COHORT_LABEL },
      { onConflict: 'user_id,course_id', ignoreDuplicates: false }
    )
    .select('matric_number')
    .single()

  if (!existing && isMailerConfigured() && user.email) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'
    try {
      await sendEmail({
        to: user.email,
        subject: 'You are registered — EdenLife Academy Cohort 3',
        html: registrationConfirmationEmail(firstName, COHORT_3_TITLE, academyLevel, enrollment?.matric_number ?? null, APP_URL),
      })
    } catch {
      // Best-effort — never block registration on email delivery.
    }
  }

  redirect(`/catalog/${COHORT_3_COURSE_ID}`)
}
