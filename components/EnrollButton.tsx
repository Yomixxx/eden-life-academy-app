'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EnrollButton({ courseId }: { courseId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [enrolling, setEnrolling] = useState(false)

  async function handleEnroll() {
    setEnrolling(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setEnrolling(false); return }
    const { error } = await supabase
      .from('enrollments')
      .upsert({ user_id: user.id, course_id: courseId }, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
    setEnrolling(false)
    if (!error) router.refresh()
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={enrolling}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
        border: 'none', cursor: enrolling ? 'not-allowed' : 'pointer',
        background: enrolling ? 'var(--bg-3)' : 'var(--eden)',
        color: enrolling ? 'var(--text-lo)' : 'var(--bg-0)',
        fontWeight: 600, fontSize: '.9rem', padding: '.85rem 1.75rem', borderRadius: 10,
        transition: 'background .2s', boxShadow: '0 8px 26px rgba(94,201,87,.28)',
        fontFamily: 'var(--font-poppins), Poppins, sans-serif',
      }}
    >
      {enrolling ? 'Enrolling…' : 'Enroll Now'}
    </button>
  )
}
