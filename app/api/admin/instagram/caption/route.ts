import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { description } = await req.json()

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are the social media manager for Eden Life Experience Centre, a church in Lagos, Nigeria led by Senior Pastor Gbenga Ajibola.

Write an Instagram caption for a church photo.
${description ? `Photo context: ${description}` : 'This is a general church/community photo.'}

Rules:
- 2-3 warm, faith-filled sentences
- End with 3-4 relevant hashtags, always include #EdenLife #Lagos
- No em dashes. No filler. Feels real and personal.

Return ONLY the caption. No quotes. No explanation.`,
    }],
  })

  const caption = (response.content[0] as { text: string }).text.trim()
  return NextResponse.json({ caption })
}
