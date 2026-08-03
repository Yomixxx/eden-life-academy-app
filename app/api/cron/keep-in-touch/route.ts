import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  fetchSheetEmails,
  fetchSupabaseMembers,
  mergeRecipients,
  sendEmailBroadcast,
} from '@/lib/broadcast-helpers'

// Runs Mon/Wed/Fri at 7am UTC (8am Lagos)
// Sends an AI-generated "we care" encouragement email to all members

const DAYS: Record<number, string> = { 1: 'Monday', 3: 'Wednesday', 5: 'Friday' }

async function generateWeCareEmail(dayLabel: string): Promise<{ subject: string; body: string }> {
  const prompt = `You are writing on behalf of Senior Pastor Gbenga Ajibola of Eden Life Experience Centre, Lagos, Nigeria — a Spirit-filled, faith-driven church family.

Write a warm "we care" pastoral encouragement email for ${dayLabel} going to all church members.

Requirements:
1. Open with "Dear Family,"
2. Acknowledge the week's busyness and challenges — speak with empathy
3. Remind them that Christ has already secured their victory — they are not fighting FOR victory, they are fighting FROM it
4. Speak about God's provision — He is Jehovah Jireh who supplies all their needs (reference Philippians 4:19 naturally)
5. Include a 2-sentence prophetic prayer declaration beginning with "I declare over you today:"
6. Close with warmth — "We love you. Eden Life is your family."
7. Exactly 4 short paragraphs, each 2-3 sentences

The subject line should feel personal, warm, and encouraging — not salesy.

Return ONLY valid JSON: {"subject":"...","body":"..."}
No markdown. No bullet points. Plain text body only.`

  const seed = Date.now()
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${seed}&json=true`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const raw = (await res.text()).trim()
    const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw
    const match = text.match(/\{[\s\S]*?\}/)
    if (!match) throw new Error('No JSON')
    const parsed = JSON.parse(match[0])
    if (!parsed.subject || !parsed.body) throw new Error('Missing fields')
    return parsed
  } catch {
    // Fallback content if AI fails
    return {
      subject: `You Are Covered — Eden Life Is Praying For You This ${dayLabel}`,
      body: `Dear Family,\n\nWe want you to know that you are not forgotten. Whatever this week has brought your way — pressure at work, challenges at home, questions in your heart — Eden Life is praying for you today.\n\nChrist has already secured your victory. You are not fighting for victory; you are fighting from a place of victory that was won at Calvary. Every challenge you face this week is already under His feet.\n\nGod is your Provider. He who did not spare His own Son will freely give you all things. He knows what you need before you ask, and His supply never runs dry.\n\nI declare over you today: every need in your life is met according to His riches in glory. Provision, peace, and breakthrough are yours in Jesus name.\n\nWe love you. Eden Life is your family.`,
    }
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if today is Mon/Wed/Fri in Lagos (UTC+1)
  const lagosNow = new Date(Date.now() + 60 * 60 * 1000) // UTC+1
  const dayOfWeek = lagosNow.getUTCDay()
  const dayLabel = DAYS[dayOfWeek]
  if (!dayLabel) {
    return NextResponse.json({ skipped: true, reason: `Not a keep-in-touch day (day ${dayOfWeek})` })
  }

  // Get Google Sheet CSV URL from settings
  const { data: setting } = await admin.from('app_settings').select('value').eq('key', 'sheet_csv_url').single()
  const sheetCsvUrl: string | null = setting?.value || null

  // Fetch all recipients
  const sheetMembers = sheetCsvUrl ? await fetchSheetEmails(sheetCsvUrl) : []
  const dbMembers = await fetchSupabaseMembers('all')
  const recipients = mergeRecipients(sheetMembers, dbMembers)

  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'No recipients found' })
  }

  // Generate email content
  const { subject, body } = await generateWeCareEmail(dayLabel)

  // Send
  const sentEmail = await sendEmailBroadcast(recipients, subject, body, null)

  // Log campaign
  await admin.from('campaigns').insert({
    subject,
    message: body,
    channels: ['email'],
    recipient_filter: 'all',
    status: 'sent',
    total_recipients: recipients.length,
    sent_email: sentEmail,
    sent_whatsapp: 0,
  })

  return NextResponse.json({ sent: sentEmail, total: recipients.length, day: dayLabel })
}
