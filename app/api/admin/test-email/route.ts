import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildBroadcastHtml } from '@/lib/broadcast-helpers'
import { transporter, FROM_GLOBAL } from '@/lib/mailer'

const DAY_LABELS: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
}

async function generateWeCareEmail(dayLabel: string): Promise<{ subject: string; body: string }> {
  const prompt = `You are writing on behalf of Senior Pastor Gbenga Ajibola of Eden Life Experience Centre, Lagos, Nigeria.

Write a warm "we care" pastoral encouragement email for ${dayLabel} going to all church members.

Requirements:
1. Open with "Dear Family,"
2. Acknowledge daily challenges with empathy
3. Remind them Christ has secured their victory — not fighting FOR victory, fighting FROM it
4. God's provision — He is Jehovah Jireh (reference Philippians 4:19 naturally)
5. A 2-sentence prophetic prayer declaration beginning with "I declare over you today:"
6. Close: "We love you. Eden Life is your family."
7. Exactly 4 short paragraphs, 2-3 sentences each

Subject: personal, warm, encouraging.

Return ONLY valid JSON: {"subject":"...","body":"..."}
No markdown. Plain text body only.`

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now()}&json=true`
    const res = await fetch(url, { cache: 'no-store' })
    const raw = (await res.text()).trim()
    const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw
    const match = text.match(/\{[\s\S]*?\}/)
    if (!match) throw new Error('No JSON')
    const parsed = JSON.parse(match[0])
    if (!parsed.subject || !parsed.body) throw new Error('Missing fields')
    return parsed
  } catch {
    const lagosDay = DAY_LABELS[new Date().getDay()] ?? dayLabel
    return {
      subject: `You Are Covered — Eden Life Is Praying For You This ${lagosDay}`,
      body: `Dear Family,\n\nWe want you to know that you are not forgotten. Whatever this week has brought your way — pressure at work, challenges at home, questions in your heart — Eden Life is praying for you today.\n\nChrist has already secured your victory. You are not fighting for victory; you are fighting from a place of victory that was won at Calvary. Every challenge you face this week is already under His feet.\n\nGod is your Provider. He who did not spare His own Son will freely give you all things. He knows what you need before you ask, and His supply never runs dry.\n\nI declare over you today: every need in your life is met according to His riches in glory. Provision, peace, and breakthrough are yours in Jesus name.\n\nWe love you. Eden Life is your family.`,
    }
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { toEmail, type } = await req.json()
  if (!toEmail) return NextResponse.json({ error: 'toEmail required' }, { status: 400 })

  const lagosNow = new Date(Date.now() + 60 * 60 * 1000)
  const dayLabel = DAY_LABELS[lagosNow.getUTCDay()] ?? 'Today'

  let subject: string
  let body: string

  if (type === 'keep-in-touch') {
    const generated = await generateWeCareEmail(dayLabel)
    subject = `[TEST] ${generated.subject}`
    body = generated.body
  } else {
    subject = '[TEST] Edenlife Global — Email Preview'
    body = `Dear Family,\n\nThis is a test email from the Edenlife Global Communications platform.\n\nYour email system is working correctly. You will receive broadcasts from this address every Monday, Wednesday, and Friday as part of the keep-in-touch series.\n\nGod bless you.`
  }

  await transporter.sendMail({
    from: FROM_GLOBAL,
    to: toEmail,
    subject,
    html: buildBroadcastHtml('Family', subject.replace('[TEST] ', ''), body, null),
  })

  return NextResponse.json({ success: true, message: `Test email sent to ${toEmail}` })
}
