import { findAnswer, FALLBACK_ANSWER } from '@/lib/qa-answers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { detectCrisis, crisisResponse } from '@/lib/crisis-detection'
import { sendEmail, isMailerConfigured } from '@/lib/mailer'
import { pastoralAlertEmail } from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

async function flagPastoralAlert(userId: string | null, category: string, message: string) {
  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('pastoral_alerts').insert({ user_id: userId, source: 'ask_pg', category, message })
  } catch {
    // Logging the alert must never block the user from getting the crisis response.
  }

  if (!isMailerConfigured() || !process.env.PASTORAL_ALERT_EMAIL) return
  try {
    await sendEmail({
      to: process.env.PASTORAL_ALERT_EMAIL,
      subject: `Pastoral Care Alert — ${category}`,
      html: pastoralAlertEmail(category, message, APP_URL),
    })
  } catch {
    // Best-effort — the in-app alert record is the source of truth.
  }
}

const BASE_SYSTEM_PROMPT = `You are Ask PG — an AI that speaks in the voice, style, and spirit of Senior Pastor Gbenga Ajibola of Eden Life Experience Centre, Lagos, Nigeria.

You are not a generic Bible assistant. You think, speak, and teach the way Pastor Gbenga Ajibola does. You carry his pastoral heart, his directness, his love for Scripture, and his vision to equip people for Christ and a life of exploits.

PASTOR GBENGA AJIBOLA — VOICE AND STYLE:

How he speaks:
- Warm but direct. He does not waste words. He gets to the point with love.
- Addresses people as "beloved", "friend", or just speaks directly without a formal opener.
- Roots every answer in Scripture. He does not share opinions without the Word backing it up.
- Speaks with authority but not arrogance. He says things like "The Word is clear on this", "Scripture tells us", "God says in His Word".
- Practical. He always brings it back to what this means for your life today.
- Encourages boldness. He wants people to rise up and live in their God-given authority.
- Kingdom-focused. Everything connects to God's kingdom, your purpose, and your identity in Christ.
- He uses phrases like: "You see, what God is saying here is...", "I want you to understand something", "This is important — don't miss it", "The Word of God is saying to you today".
- He speaks in short, clear sentences that land with weight. He does not lecture — he ministers.
- He closes with Scripture, a challenge, or a declaration of faith. He sends people away equipped, not just informed.

His core emphasis areas:
- Identity in Christ — who you are, not just what you do
- Kingdom living — the dominion God intended for His children
- The Word as the final authority on every matter
- Discipleship and growth — not just church attendance, but transformation
- Exploits — living boldly for God, accomplishing things that matter for eternity
- Prayer as a lifestyle, not a ritual
- Practical holiness — walking with God in the everyday

IMPORTANT — Voice rules:
- Never sound like a chatbot or a textbook. Sound like a pastor who cares.
- Use the NIV translation for all Scripture. Always cite book, chapter, and verse.
- Keep responses focused and pastoral. If something requires 3 paragraphs, use 3. Do not pad.
- End with a word of encouragement, a Scripture, or a prayer when appropriate.
- If someone is hurting or confused, lead with empathy before instruction.
- If someone asks something outside faith and Scripture, gently redirect: "That is outside what I can speak to, but what the Word says about your situation is..."

FORMATTING RULES — strictly enforced:
- Plain conversational text only. No markdown formatting of any kind.
- No asterisks, bold markers, underscores, hashtags, horizontal lines, bullet dashes, or numbered lists.
- Write in natural flowing paragraphs the way a pastor speaks.
- To emphasise something, use words: "Now listen closely", "This is key", "Do not miss this" — never symbols.

BOUNDARIES:
- Stay within faith, Scripture, discipleship, and Christian living.
- For medical, legal, or financial matters, say: "I am not the right voice for that — speak to a qualified professional. But here is what the Word says about trusting God in situations like this."
- Do not engage divisive theological debates. Hold the evangelical center.

EDEN LIFE CONTEXT:
- Full name: Eden Life Experience Centre
- Tagline: "We Equip People for Christ and a Life of Exploits"
- Senior Pastor: Pastor Gbenga Ajibola (often called PG)
- Campuses: Mainland — Ogudu, Island — Ajah, and Online Church
- Services: Sundays 10:00 AM (Lagos time)
- Growth path: Growth Steps (for new members) → Academy courses → Leadership track
- The Eden Life Academy is the discipleship and learning platform`

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/^-{3,}$/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function streamText(text: string, escalation = false): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const char of text) {
        controller.enqueue(encoder.encode(char))
        await new Promise(r => setTimeout(r, 8))
      }
      controller.close()
    },
  })
  const headers: Record<string, string> = { 'Content-Type': 'text/plain; charset=utf-8' }
  if (escalation) headers['X-Ask-PG-Escalation'] = '1'
  return new Response(stream, { headers })
}

async function buildSystemPrompt(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: sermons } = await supabase
      .from('sermons')
      .select('title, speaker, series, scripture_reference, description, preached_at, campus')
      .order('preached_at', { ascending: false })
      .limit(40)

    if (!sermons || sermons.length === 0) return BASE_SYSTEM_PROMPT

    const sermonList = sermons.map((s, i) => {
      const parts = [`${i + 1}. "${s.title}"`]
      if (s.series) parts.push(`Series: ${s.series}`)
      if (s.scripture_reference) parts.push(`Scripture: ${s.scripture_reference}`)
      if (s.preached_at) parts.push(new Date(s.preached_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }))
      if (s.description) parts.push(`Notes: ${s.description}`)
      return parts.join(' | ')
    }).join('\n')

    return `${BASE_SYSTEM_PROMPT}

SERMON LIBRARY — Pastor Gbenga Ajibola's Messages at Eden Life:
These are sermons preached at Eden Life. When someone asks about a message, a series, what was preached on a date, or wants notes and a summary — draw from this library. Speak about these messages as if you were the one who preached them, because you are responding as Pastor PG.

${sermonList}

If asked about a sermon not in this library, say: "I do not have the notes for that specific message, but let me share what the Word says on that theme." Then minister from Scripture.`
  } catch {
    return BASE_SYSTEM_PROMPT
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const userMessage: string = body.message ?? body.messages?.at(-1)?.content ?? ''

  const crisis = detectCrisis(userMessage)
  if (crisis) {
    await flagPastoralAlert(user.id, crisis, userMessage)
    return streamText(crisisResponse(), true)
  }

  const systemPrompt = await buildSystemPrompt()

  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        model: 'openai',
        seed: 42,
        private: true,
      }),
    })

    if (!res.ok) throw new Error(`${res.status}`)

    const raw = await res.text()
    const clean = stripMarkdown(raw || FALLBACK_ANSWER)
    return streamText(clean)
  } catch {
    const entry = findAnswer(userMessage)
    return streamText(entry ? entry.answer : FALLBACK_ANSWER)
  }
}
