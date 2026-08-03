import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { transporter, FROM } from '@/lib/mailer'
import { devotionalEmail } from '@/lib/email-templates'

// Runs daily at 6am UTC (7am Lagos, UTC+1)
// Generates a devotional in PG's voice, stores it, emails every member

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eden-life-academy-app.vercel.app'

interface Devotion {
  scripture_reference: string
  scripture_text: string
  body: string
}

async function generateDevotion(dateStr: string): Promise<Devotion> {
  const prompt = `You are Senior Pastor Gbenga Ajibola of Eden Life Experience Centre, Lagos, Nigeria.
Generate a daily devotional for Eden Life Academy members for ${dateStr}.

Return a JSON object with exactly these three fields:
- "scripture_reference": a specific Bible verse reference (e.g. "John 15:5" or "Isaiah 41:10")
- "scripture_text": the NIV text of that verse, accurate and complete
- "body": 3 sentences in PG's voice. Warm, direct, kingdom-focused. Open with "Beloved," or "You see," or "Do not miss this." End with a one-sentence prayer or declaration starting with "Father," or "I declare". No markdown. No symbols. Plain text only.

Return ONLY valid JSON. No explanation. No extra text.`

  const seed = dateStr.replace(/-/g, '')
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${seed}&json=true`

  const res = await fetch(url, { next: { revalidate: 0 } })
  const raw = (await res.text()).trim()
  const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw

  const match = text.match(/\{[\s\S]*?\}/)
  if (!match) throw new Error('No JSON in Pollinations response')

  const parsed = JSON.parse(match[0])
  if (!parsed.scripture_reference || !parsed.scripture_text || !parsed.body) {
    throw new Error('Missing fields in devotion JSON')
  }
  return parsed as Devotion
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Strip BOM (U+FEFF) that PowerShell pipe can prepend to env values
  const rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  const supabaseKey = rawKey.charCodeAt(0) === 0xFEFF ? rawKey.slice(1) : rawKey
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars', url: !!supabaseUrl, key: !!supabaseKey }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const today = new Date().toISOString().slice(0, 10)

  // Idempotent — if already generated today, just re-send
  let devotion: Devotion & { date?: string } | null = null
  const { data: existing } = await supabase
    .from('daily_devotions')
    .select('*')
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    devotion = existing as Devotion
  } else {
    const generated = await generateDevotion(today)
    const { data, error } = await supabase
      .from('daily_devotions')
      .insert({ date: today, ...generated })
      .select()
      .single()
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
    }
    devotion = data as Devotion
  }

  // Fetch all users via admin API
  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const users = userList?.users ?? []

  if (!users.length) return NextResponse.json({ sent: 0, date: today })

  // Batch fetch profiles
  const userIds = users.map(u => u.id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    if (p.full_name) profileMap[p.id] = p.full_name.split(' ')[0]
  }

  let sent = 0
  for (const user of users) {
    if (!user.email) continue
    const firstName = profileMap[user.id] ?? 'Beloved'
    const html = devotionalEmail(
      firstName,
      devotion.scripture_reference,
      devotion.scripture_text,
      devotion.body,
      APP_URL
    )
    try {
      await transporter.sendMail({
        from: FROM,
        to: user.email,
        subject: `Today's Word — ${devotion.scripture_reference}`,
        html,
      })
      sent++
    } catch {
      // continue on individual send failure
    }
  }

  // Send push notifications in the background (non-blocking)
  fetch(`${APP_URL}/api/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `Today's Word — ${devotion.scripture_reference}`,
      body: devotion.scripture_text.slice(0, 100),
      url: '/devotion',
    }),
  }).catch(() => {})

  return NextResponse.json({ sent, date: today, scripture: devotion.scripture_reference })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
