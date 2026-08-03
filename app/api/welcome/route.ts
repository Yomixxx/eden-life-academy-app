// Welcome email is handled by Supabase's built-in auth confirmation email.
// Customize the template in: Supabase Dashboard → Authentication → Email Templates → Confirm signup
// No external service or API key required.

import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ ok: true })
}
