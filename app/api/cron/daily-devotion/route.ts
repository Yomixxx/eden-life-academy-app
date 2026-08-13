import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { devotionEmail } from '@/lib/email-templates'

// Runs daily at 6am UTC (7am Lagos, UTC+1)
// Generates a devotional in PG's voice, stores it for in-app display on
// /devotion, and emails it to every member with an address on file. The
// emailed_at column makes the email step idempotent, same as the existing
// generation check above it — a re-invocation on a day already emailed
// won't send a second round.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

interface Devotion {
  scripture_reference: string
  scripture_text: string
  body: string
}

// Pollinations.ai's free legacy text API (previously used here) started
// returning 402 Payment Required for the model this route relied on —
// an upstream change, not something this app broke. Groq's free tier is
// the replacement; GROQ_API_KEY was already provisioned in this project
// but unused anywhere until now.
async function generateDevotion(dateStr: string): Promise<Devotion> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) throw new Error('GROQ_API_KEY is not configured')

  const prompt = `You are Senior Pastor Gbenga Ajibola of Eden Life Experience Centre, Lagos, Nigeria.
Generate a daily devotional for Eden Life Academy members for ${dateStr}.

Return a JSON object with exactly these three fields:
- "scripture_reference": a specific Bible verse reference (e.g. "John 15:5" or "Isaiah 41:10")
- "scripture_text": the NIV text of that verse, accurate and complete
- "body": 3 sentences in PG's voice. Warm, direct, kingdom-focused. Open with "Beloved," or "You see," or "Do not miss this." End with a one-sentence prayer or declaration starting with "Father," or "I declare". No markdown. No symbols. Plain text only.

Return ONLY valid JSON. No explanation. No extra text.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      seed: Number(dateStr.replace(/-/g, '')),
    }),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Groq API error ${res.status}: ${errText.slice(0, 300)}`)
  }

  const data = await res.json()
  const text: string = data.choices?.[0]?.message?.content ?? ''

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Groq response')

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

    let devotion = existing
    let created = false

    if (!devotion) {
      const generated = await generateDevotion(today)
      const { data, error } = await supabase
        .from('daily_devotions')
        .insert({ date: today, ...generated })
        .select()
        .single()
      if (error || !data) {
        return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
      }
      devotion = data
      created = true
    }

    let emailed = 0
    if (!devotion.emailed_at && isMailerConfigured()) {
      const { data: recipients } = await supabase
        .from('profiles')
        .select('full_name, email')
        .not('email', 'is', null)

      for (const recipient of recipients ?? []) {
        if (!recipient.email) continue
        const firstName = recipient.full_name?.split(' ')[0] ?? 'Friend'
        try {
          await sendEmail({
            to: recipient.email,
            subject: `Today's Devotion — ${devotion.scripture_reference}`,
            html: devotionEmail(firstName, devotion.scripture_reference, devotion.scripture_text, devotion.body, APP_URL),
          })
          emailed++
        } catch {
          // continue on individual send failure — one bad address shouldn't block the rest
        }
      }

      await supabase.from('daily_devotions').update({ emailed_at: new Date().toISOString() }).eq('id', devotion.id)
    }

    return NextResponse.json({ date: today, scripture: devotion.scripture_reference, created, emailed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
