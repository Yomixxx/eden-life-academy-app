import { describe, it, expect } from 'vitest'
import {
  resolveAcademyLevel,
  isIncompleteAcademyEnrollment,
  CURRENT_COHORT_COURSE_ID,
} from '@/lib/academy'

describe('resolveAcademyLevel', () => {
  it('prefers the level chosen in auth metadata', () => {
    expect(resolveAcademyLevel('300', '100')).toBe('300')
  })

  it('falls back to the level already on the enrollment row', () => {
    // Regression: /register upserted `academy_level: null` over a real level
    // for anyone whose auth metadata had none (Google sign-in, or explored
    // first and enrolled from the catalog). A null level means the dashboard
    // banner, the course card and attendance all key off nothing — the live
    // class join button simply stops existing for that student.
    expect(resolveAcademyLevel(undefined, '200')).toBe('200')
    expect(resolveAcademyLevel(null, '200')).toBe('200')
  })

  it('ignores a level that is not one of 100/200/300', () => {
    expect(resolveAcademyLevel('999', '100')).toBe('100')
    expect(resolveAcademyLevel('999', 'nope')).toBeNull()
  })

  it('returns null only when there is genuinely no level anywhere', () => {
    expect(resolveAcademyLevel(undefined, undefined)).toBeNull()
    expect(resolveAcademyLevel(null, null)).toBeNull()
  })
})

describe('isIncompleteAcademyEnrollment', () => {
  it('flags academy rows missing level or matric', () => {
    // People sometimes land on a cohort enrollment without picking a level
    // (or without the matric trigger firing). Both block a clean roll call
    // and a working live-class join button.
    expect(isIncompleteAcademyEnrollment({
      cohort: 'Cohort 3 2026', academy_level: null, matric_number: null,
    })).toBe(true)
    expect(isIncompleteAcademyEnrollment({
      cohort: 'Cohort 3 2026', academy_level: '200', matric_number: null,
    })).toBe(true)
    expect(isIncompleteAcademyEnrollment({
      academy_level: null, matric_number: 'ELA/Cohort32026/0001',
    })).toBe(true)
    expect(isIncompleteAcademyEnrollment({
      academy_level: '100', matric_number: 'ELA/Cohort32026/0001', cohort: 'Cohort 3 2026',
    })).toBe(false)
  })

  it('ignores plain course enrollments with no academy fields', () => {
    // Growth Steps etc. never get level/matric — don't treat them as broken.
    expect(isIncompleteAcademyEnrollment({
      academy_level: null, matric_number: null, cohort: null,
    })).toBe(false)
  })

  it('flags bare enrollments on the current cohort course', () => {
    // The worst case: enrolled in Cohort 3 with no level, no cohort tag, no
    // matric — looks like a normal course row unless we key off course_id.
    expect(isIncompleteAcademyEnrollment({
      course_id: CURRENT_COHORT_COURSE_ID,
      academy_level: null,
      matric_number: null,
      cohort: null,
    })).toBe(true)
  })

  it('treats invalid levels as incomplete', () => {
    expect(isIncompleteAcademyEnrollment({ academy_level: '999', matric_number: 'ELA/x/1' })).toBe(true)
  })

  it('is false for null/undefined rows', () => {
    expect(isIncompleteAcademyEnrollment(null)).toBe(false)
    expect(isIncompleteAcademyEnrollment(undefined)).toBe(false)
  })
})
