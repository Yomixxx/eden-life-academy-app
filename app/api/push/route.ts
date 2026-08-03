import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export async function POST(req: Request) {
  webpush.setVapidDetails(
    'mailto:communication@edenlifeng.org',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  const { title, body, url, userId } = await req.json()

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const query = supabase.from('push_subscriptions').select('*')
  if (userId) query.eq('user_id', userId)

  const { data: subs } = await query

  let sent = 0
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url: url ?? '/' })
      )
      sent++
    } catch (err: unknown) {
      // Remove stale subscriptions (410 Gone)
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }

  return NextResponse.json({ sent })
}
