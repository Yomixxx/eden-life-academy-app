import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CURRENT_COHORT_COURSE_ID,
  CURRENT_COHORT_LABEL,
  isIncompleteAcademyEnrollment,
  resolveAcademyLevel,
} from '@/lib/academy'

/**
 * Scans the signed-in member's Cohort 3 enrollment and reports whether
 * registration is incomplete (missing level and/or matric).
 *
 * If they already have a valid level but no matric, this endpoint also
 * silently re-touches the row so the matric trigger assigns one immediately —
 * no prompt needed for that case.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const metaLevel = user.user_metadata?.academy_level

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id, course_id, academy_level, cohort, matric_number')
    .eq('user_id', user.id)
    .eq('course_id', CURRENT_COHORT_COURSE_ID)
    .maybeSingle()

  // No cohort enrollment at all — nothing to complete (they're just exploring).
  if (!enrollment) {
    return NextResponse.json({
      incomplete: false,
      needsLevel: false,
      enrollment: null,
    })
  }

  const resolvedLevel = resolveAcademyLevel(metaLevel, enrollment.academy_level)
  let row = {
    ...enrollment,
    academy_level: resolvedLevel ?? enrollment.academy_level,
  }

  // Has a level (from row or auth metadata) but no matric → assign now, no UI.
  if (resolvedLevel && !enrollment.matric_number) {
    const { data: touched } = await admin
      .from('enrollments')
      .update({
        academy_level: resolvedLevel,
        cohort: enrollment.cohort || CURRENT_COHORT_LABEL,
      })
      .eq('id', enrollment.id)
      .select('id, course_id, academy_level, cohort, matric_number')
      .single()

    if (touched) {
      row = touched
      // If still null (trigger missed), force another touch.
      if (!touched.matric_number) {
        const { data: again } = await admin
          .from('enrollments')
          .update({ cohort: CURRENT_COHORT_LABEL, academy_level: resolvedLevel })
          .eq('id', enrollment.id)
          .select('id, course_id, academy_level, cohort, matric_number')
          .single()
        if (again) row = again
      }
    }
  }

  const incomplete = isIncompleteAcademyEnrollment(row)
  const needsLevel = incomplete && !resolveAcademyLevel(null, row.academy_level)

  return NextResponse.json({
    incomplete,
    needsLevel,
    justAssignedMatric: !!(resolvedLevel && row.matric_number && !enrollment.matric_number),
    enrollment: {
      id: row.id,
      academyLevel: row.academy_level,
      cohort: row.cohort,
      matricNumber: row.matric_number,
    },
  })
}
