import { describe, it, expect } from 'vitest'
import { resolveAcademyLevel } from '@/lib/academy'

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
