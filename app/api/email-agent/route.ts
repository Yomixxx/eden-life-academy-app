import { NextResponse } from 'next/server'
import { transporter, FROM } from '@/lib/mailer'
import {
  welcomeEmail,
  reminderEmail,
  milestoneEmail,
  certificateEmail,
} from '@/lib/email-templates'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Optionally enhance email bodies with Gemini when GEMINI_API_KEY is set
async function aiPersonalise(prompt: string): Promise<string | undefined> {
  if (!process.env.GEMINI_API_KEY) return undefined
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You write emails for Eden Life Academy, signed by Senior Pastor Gbenga Ajibola of Eden Life Experience Centre, Lagos.
Voice: warm, direct, pastoral. Short sentences. No corporate language. No em dashes. No phrases like "thrilled" or "honored".
Write 2-3 short paragraphs of plain text only. No HTML. No subject line. No greeting or sign-off (those are handled separately).`,
    })
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return undefined
  }
}

export async function POST(req: Request) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ ok: true, skipped: 'Gmail not configured' })
  }

  const body = await req.json()
  const { type, to, firstName, campus, courseName, lessonsCompleted, totalLessons } = body

  let subject = ''
  let html = ''

  if (type === 'welcome') {
    const aiBody = await aiPersonalise(
      `Write a welcome email body for ${firstName}, a new Eden Life Academy member at the ${campus} campus. They are about to start Growth Steps, their first course.`
    )
    subject = `Welcome to Eden Life Academy, ${firstName}`
    html = welcomeEmail(firstName, campus, aiBody)

  } else if (type === 'reminder') {
    const aiBody = await aiPersonalise(
      `Write a course reminder email for ${firstName}. They enrolled in "${courseName}" but have not opened the app in 7 days. They have completed ${lessonsCompleted} of ${totalLessons} lessons. Encourage them to continue without being pushy.`
    )
    subject = `${firstName}, your course is still here`
    html = reminderEmail(firstName, courseName, lessonsCompleted ?? 0, totalLessons ?? 0, aiBody)

  } else if (type === 'milestone') {
    const aiBody = await aiPersonalise(
      `Write a milestone celebration email for ${firstName}. They have just completed 50% of "${courseName}". Acknowledge the achievement and encourage them to finish.`
    )
    subject = `Halfway there, ${firstName}`
    html = milestoneEmail(firstName, courseName, aiBody)

  } else if (type === 'certificate') {
    const aiBody = await aiPersonalise(
      `Write a certificate email for ${firstName}. They just completed "${courseName}" and earned their certificate. Celebrate genuinely and invite them to the next course.`
    )
    subject = `You finished ${courseName}, ${firstName}`
    html = certificateEmail(firstName, courseName, aiBody)

  } else {
    return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
  }

  await transporter.sendMail({ from: FROM, to, subject, html })
  return NextResponse.json({ ok: true })
}
