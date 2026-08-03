import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Runs daily at 9am Lagos time (UTC+1 = 8am UTC)
// Finds users inactive 7+ days on any enrolled course and sends a reminder

type EnrollmentRow = {
  user_id: string
  course_id: string
  courses: { title: string; total_lessons: number | null } | null
  profiles: { full_name: string | null } | null
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch enrollments with joined course and profile data (no auth.users join — use separate query)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id, course_id, courses ( title, total_lessons ), profiles ( full_name )')
    .lt('created_at', sevenDaysAgo)

  if (!enrollments?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eden-life-academy-app.vercel.app'

  for (const row of (enrollments as unknown as EnrollmentRow[])) {
    const { user_id: userId, course_id: courseId } = row

    // Skip if active within the last 7 days
    const { data: lastActivity } = await supabase
      .from('lesson_progress')
      .select('updated_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastActivity?.updated_at && lastActivity.updated_at > sevenDaysAgo) continue

    // Get user email via admin auth API
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email
    if (!userEmail) continue

    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true)

    const firstName = row.profiles?.full_name?.split(' ')[0] ?? 'Friend'

    await fetch(`${base}/api/email-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reminder',
        to: userEmail,
        firstName,
        courseName: row.courses?.title ?? 'your course',
        lessonsCompleted: completedCount ?? 0,
        totalLessons: row.courses?.total_lessons ?? 0,
      }),
    })

    sent++
  }

  return NextResponse.json({ sent })
}
