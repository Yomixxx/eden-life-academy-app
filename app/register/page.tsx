import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { registrationConfirmationEmail } from '@/lib/email-templates'
import { CURRENT_COHORT_COURSE_ID, CURRENT_COHORT_COURSE_TITLE, CURRENT_COHORT_LABEL } from '@/lib/academy'
import { cleanEnv } from '@/lib/env'

// This is the one central "register for Cohort 3" link — every new or
// returning visitor who signs up or logs in through it is enrolled here
// automatically, then dropped on the course page. No manual Enroll click.
const APP_URL = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || 'https://app.edenlifeng.org'

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
    .eq('course_id', CURRENT_COHORT_COURSE_ID)
    .maybeSingle()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .upsert(
      { user_id: user.id, course_id: CURRENT_COHORT_COURSE_ID, academy_level: academyLevel, cohort: CURRENT_COHORT_LABEL },
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
        subject: `You are registered — ${CURRENT_COHORT_COURSE_TITLE}`,
        html: registrationConfirmationEmail(firstName, CURRENT_COHORT_COURSE_TITLE, academyLevel, enrollment?.matric_number ?? null, APP_URL),
      })
    } catch {
      // Best-effort — never block registration on email delivery.
    }
  }

  redirect(`/catalog/${CURRENT_COHORT_COURSE_ID}`)
}
