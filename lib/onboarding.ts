import type { SupabaseClient } from '@supabase/supabase-js'

// Auto-enrolls a brand-new member in Growth Steps (the first course every
// Eden Life member builds on). Shared between the server-side auth callback
// (Google OAuth / email confirmation) and the client-side setup-campus and
// signup flows so all three paths finish a new account the same way.
export async function enrollInGrowthSteps(supabase: SupabaseClient, userId: string) {
  const { data: growthSteps } = await supabase
    .from('courses')
    .select('id')
    .ilike('title', '%growth steps%')
    .eq('is_published', true)
    .limit(1)
    .single()

  if (growthSteps) {
    await supabase
      .from('enrollments')
      .upsert({ user_id: userId, course_id: growthSteps.id }, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
  }
}
