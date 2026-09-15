import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CURRENT_COHORT_COURSE_ID,
  CURRENT_COHORT_LABEL,
  ACADEMY_LEVELS,
  resolveAcademyLevel,
  type AcademyLevel,
} from '@/lib/academy'

// Admin-only: finish an incomplete cohort enrollment by setting level (and
// cohort tag) so the matric trigger can assign a number. Used from the
// Registrations table when someone registered without choosing a level.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const enrollmentId = typeof body.enrollmentId === 'string' ? body.enrollmentId : null
  const level = resolveAcademyLevel(body.academyLevel, null)

  if (!enrollmentId) {
    return NextResponse.json({ error: 'Missing enrollmentId' }, { status: 400 })
  }
  if (!level) {
    return NextResponse.json(
      { error: `Please choose a level (${ACADEMY_LEVELS.join(', ')})` },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  const { data: row, error: readError } = await admin
    .from('enrollments')
    .select('id, course_id, academy_level, cohort, matric_number')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (readError || !row) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  // Only mutate the current cohort course (or rows already tagged as cohort)
  // so we never invent academy fields on unrelated courses.
  const isCohort =
    row.course_id === CURRENT_COHORT_COURSE_ID
    || (typeof row.cohort === 'string' && row.cohort.length > 0)

  if (!isCohort) {
    return NextResponse.json(
      { error: 'This enrollment is not a cohort Academy registration.' },
      { status: 400 },
    )
  }

  const payload: {
    academy_level: AcademyLevel
    cohort: string
  } = {
    academy_level: level,
    cohort: row.cohort || CURRENT_COHORT_LABEL,
  }

  const { data: updated, error: updateError } = await admin
    .from('enrollments')
    .update(payload)
    .eq('id', enrollmentId)
    .select('id, academy_level, cohort, matric_number')
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Could not update enrollment' },
      { status: 500 },
    )
  }

  // If matric is still null, re-touch so the UPDATE trigger runs (defensive
  // against older trigger definitions that only fired on INSERT).
  let matricNumber = updated.matric_number ?? null
  if (!matricNumber) {
    const { data: touched } = await admin
      .from('enrollments')
      .update({ cohort: payload.cohort, academy_level: level })
      .eq('id', enrollmentId)
      .select('matric_number, academy_level, cohort')
      .single()
    matricNumber = touched?.matric_number ?? null
    return NextResponse.json({
      id: enrollmentId,
      academyLevel: touched?.academy_level ?? level,
      cohort: touched?.cohort ?? payload.cohort,
      matricNumber,
    })
  }

  return NextResponse.json({
    id: enrollmentId,
    academyLevel: updated.academy_level,
    cohort: updated.cohort,
    matricNumber,
  })
}
