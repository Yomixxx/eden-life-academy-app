import { describe, it, expect } from 'vitest'
import {
  isIncompleteAcademyEnrollment,
  resolveAcademyLevel,
  CURRENT_COHORT_COURSE_ID,
} from '@/lib/academy'

/**
 * Mirrors the decision tree in /api/registration/status + CompleteRegistrationGate:
 * scan enrollment → needs level prompt OR silent matric assign OR done.
 */
function decideRegistrationAction(input: {
  enrollment: {
    course_id: string
    academy_level: string | null
    cohort: string | null
    matric_number: string | null
  } | null
  metaLevel?: string | null
}): 'none' | 'prompt-level' | 'silent-matric' | 'complete' {
  if (!input.enrollment) return 'none'
  const resolved = resolveAcademyLevel(input.metaLevel, input.enrollment.academy_level)
  const row = {
    ...input.enrollment,
    academy_level: resolved ?? input.enrollment.academy_level,
  }
  if (resolved && !input.enrollment.matric_number) return 'silent-matric'
  if (!isIncompleteAcademyEnrollment(row)) return 'complete'
  if (!resolved) return 'prompt-level'
  return 'complete'
}

describe('registration scan → immediate prompt / matric', () => {
  it('does nothing when the member has no cohort enrollment', () => {
    expect(decideRegistrationAction({ enrollment: null })).toBe('none')
  })

  it('prompts for level when cohort row has no level', () => {
    expect(decideRegistrationAction({
      enrollment: {
        course_id: CURRENT_COHORT_COURSE_ID,
        academy_level: null,
        cohort: 'Cohort 3 2026',
        matric_number: null,
      },
    })).toBe('prompt-level')
  })

  it('silently assigns matric when level exists but matric does not', () => {
    expect(decideRegistrationAction({
      enrollment: {
        course_id: CURRENT_COHORT_COURSE_ID,
        academy_level: '200',
        cohort: 'Cohort 3 2026',
        matric_number: null,
      },
    })).toBe('silent-matric')
  })

  it('uses auth metadata level to skip the prompt and assign matric', () => {
    expect(decideRegistrationAction({
      metaLevel: '100',
      enrollment: {
        course_id: CURRENT_COHORT_COURSE_ID,
        academy_level: null,
        cohort: null,
        matric_number: null,
      },
    })).toBe('silent-matric')
  })

  it('is complete when level and matric are both present', () => {
    expect(decideRegistrationAction({
      enrollment: {
        course_id: CURRENT_COHORT_COURSE_ID,
        academy_level: '300',
        cohort: 'Cohort 3 2026',
        matric_number: 'ELA/Cohort32026/0042',
      },
    })).toBe('complete')
  })
})
