import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isMailerConfigured } from '@/lib/mailer'
import { cleanEnv } from '@/lib/supabase/admin'
import { CURRENT_COHORT_COURSE_ID } from '@/lib/academy'

// Public, unauthenticated health and diagnostic check for external uptime
// monitors and deployment verification. Reports both Supabase reachability
// and schema integrity, as well as the active Vercel build version.

export async function GET() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

  const buildInfo = {
    commit: process.env.NEXT_PUBLIC_BUILD_SHA || 'unknown',
    shortCommit: (process.env.NEXT_PUBLIC_BUILD_SHA || '').slice(0, 7) || 'unknown',
    ref: process.env.NEXT_PUBLIC_BUILD_REF || 'unknown',
    deploymentId: process.env.BUILD_DEPLOYMENT_ID || 'unknown',
    environment: process.env.VERCEL_ENV || 'local',
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      ok: false,
      error: 'Missing Supabase env vars',
      build: buildInfo,
    }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Probe profiles, class_links, enrollments, and cohort course
  const [
    { error: profilesError },
    { data: classLinksData, error: classLinksError },
    { error: enrollmentsError },
    { data: cohortCourse },
  ] = await Promise.all([
    supabase.from('profiles').select('id').limit(1),
    supabase.from('class_links').select('level, is_live, meet_url'),
    supabase.from('enrollments').select('id, academy_level, cohort, matric_number').limit(1),
    supabase.from('courses').select('id, title, is_published, is_locked').eq('id', CURRENT_COHORT_COURSE_ID).maybeSingle(),
  ])

  if (profilesError) {
    return NextResponse.json({
      ok: false,
      database: 'unreachable',
      error: profilesError.message,
      build: buildInfo,
      time: new Date().toISOString(),
    }, { status: 503 })
  }

  const seededLevels = (classLinksData ?? []).map(r => r.level)
  const allLevelsSeeded = ['100', '200', '300'].every(l => seededLevels.includes(l))

  return NextResponse.json({
    ok: true,
    database: 'reachable',
    liveClasses: classLinksError ? `error: ${classLinksError.message}` : allLevelsSeeded ? 'ok' : 'missing_seed_rows',
    schema: {
      enrollmentsColumns: enrollmentsError ? `error: ${enrollmentsError.message}` : 'ok',
      classLinksSeeded: allLevelsSeeded,
      seededLevels,
      cohortCourseFound: !!cohortCourse,
      cohortCourseTitle: cohortCourse?.title ?? null,
      cohortCoursePublished: cohortCourse?.is_published ?? null,
    },
    mailer: isMailerConfigured() ? 'configured' : 'not configured',
    build: buildInfo,
    time: new Date().toISOString(),
  }, {
    headers: {
      'cache-control': 'no-store, max-age=0',
    },
  })
}

