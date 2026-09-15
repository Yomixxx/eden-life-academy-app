// The cohort currently open for registration. Every enrollment path — the
// dedicated /register link, the opt-in during traditional signup, and the
// course catalog's Enroll button — reads from here, so update this (and
// swap the course row it points at) when a new cohort opens.
export const CURRENT_COHORT_COURSE_ID = '4b69dd08-a1ce-4f50-8a91-e35aa1d755e0'
export const CURRENT_COHORT_COURSE_TITLE = 'EdenLife Academy (ELA) — Cohort 3'
export const CURRENT_COHORT_LABEL = 'Cohort 3 2026'
export const ACADEMY_LEVELS = ['100', '200', '300'] as const
export type AcademyLevel = (typeof ACADEMY_LEVELS)[number]

// Decides which level a cohort registration should be written with.
//
// Auth metadata is only set by the signup/setup flows, so it's routinely
// missing (Google sign-in, or someone who explored first and enrolled later
// from the catalog). Falling back to the level already on the enrollment row
// matters: writing null over a real level is what used to make a student's
// live class card and join button disappear with no explanation.
export function resolveAcademyLevel(
  metadataLevel: unknown,
  existingLevel: unknown,
): AcademyLevel | null {
  const levels = ACADEMY_LEVELS as readonly string[]
  if (typeof metadataLevel === 'string' && levels.includes(metadataLevel)) {
    return metadataLevel as AcademyLevel
  }
  if (typeof existingLevel === 'string' && levels.includes(existingLevel)) {
    return existingLevel as AcademyLevel
  }
  return null
}

/**
 * True when an Academy/cohort enrollment is missing a valid level and/or
 * matric number. Plain course enrollments (Growth Steps, etc.) are ignored
 * unless they sit on the current cohort course — those bare rows are exactly
 * the "registered with no level and no matric" cases we need to repair.
 */
export function isIncompleteAcademyEnrollment(row: {
  academy_level?: string | null
  matric_number?: string | null
  cohort?: string | null
  course_id?: string | null
} | null | undefined): boolean {
  if (!row) return false
  const onCurrentCohortCourse = row.course_id === CURRENT_COHORT_COURSE_ID
  const hasAcademySignal = onCurrentCohortCourse
    || row.cohort != null
    || row.academy_level != null
    || row.matric_number != null
  if (!hasAcademySignal) return false
  const levelOk = typeof row.academy_level === 'string'
    && (ACADEMY_LEVELS as readonly string[]).includes(row.academy_level)
  const matricOk = typeof row.matric_number === 'string' && row.matric_number.length > 0
  return !levelOk || !matricOk
}
