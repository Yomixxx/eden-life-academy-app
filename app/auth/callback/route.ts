import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enrollInGrowthSteps } from '@/lib/onboarding'
import { sendWelcomeEmail } from '@/lib/send-welcome-email'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('campus, full_name')
        .eq('id', data.user.id)
        .single()

      // A brand-new account (Google OAuth, or an email/password signup
      // confirming for the first time) has no campus yet. Email signups
      // already collected one at signup, so finish setup automatically;
      // Google sign-ins never supply it, so send them to pick one.
      if (!profile?.campus) {
        const metaCampus = data.user.user_metadata?.campus
        const fullName = profile?.full_name ?? data.user.user_metadata?.full_name ?? null
        const firstName = fullName?.split(' ')[0] ?? 'Friend'

        if (metaCampus) {
          await supabase.from('profiles').update({ campus: metaCampus }).eq('id', data.user.id)
          await enrollInGrowthSteps(supabase, data.user.id)
          if (data.user.email) await sendWelcomeEmail(data.user.email, firstName)
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}/setup-campus`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Could not sign you in. Please try again.')}`
  )
}
