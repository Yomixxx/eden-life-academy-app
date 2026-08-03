import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Runs daily at 6am UTC (7am Lagos, UTC+1)
// Generates a devotional in PG's voice and stores it for in-app display on /devotion

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

    // Idempotent — if already generated today, just return it
    const { data: existing } = await supabase
      .from('daily_devotions')
      .select('*')
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ date: today, scripture: existing.scripture_reference, created: false })
    }

    const generated = await generateDevotion(today)
    const { data, error } = await supabase
      .from('daily_devotions')
      .insert({ date: today, ...generated })
      .select()
      .single()
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json({ date: today, scripture: data.scripture_reference, created: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
