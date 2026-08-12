import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// This is the one central "register for Cohort 3" link — every new or
// returning visitor who signs up or logs in through it is enrolled here
// automatically, then dropped on the course page. No manual Enroll click.
const COHORT_3_COURSE_ID = '4b69dd08-a1ce-4f50-8a91-e35aa1d755e0'
const COHORT_LABEL = 'Cohort 3 2026'

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?next=/register')

  const academyLevel = typeof user.user_metadata?.academy_level === 'string' ? user.user_metadata.academy_level : null

  await supabase
    .from('enrollments')
    .upsert(
      { user_id: user.id, course_id: COHORT_3_COURSE_ID, academy_level: academyLevel, cohort: COHORT_LABEL },
      { onConflict: 'user_id,course_id', ignoreDuplicates: false }
    )

  redirect(`/catalog/${COHORT_3_COURSE_ID}`)
}
