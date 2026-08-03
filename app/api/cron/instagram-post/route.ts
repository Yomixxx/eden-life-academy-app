import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const IG_BASE = 'https://graph.instagram.com/v19.0'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function igPost(path: string, body: Record<string, string | null>) {
  const res = await fetch(`${IG_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: process.env.INSTAGRAM_ACCESS_TOKEN }),
  })
  if (!res.ok) throw new Error(`Instagram error: ${await res.text()}`)
  return res.json()
}

async function generateCaption(fileName: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are the social media manager for Eden Life Experience Centre, a church in Lagos, Nigeria led by Senior Pastor Gbenga Ajibola.

Write an Instagram caption for a church photo. File name hint: "${fileName}"

Rules:
- 2-3 warm, faith-filled sentences
- End with 3-4 hashtags, always include #EdenLife #Lagos
- No em dashes. No filler. Feels real and personal.

Return ONLY the caption. No quotes.`,
      }],
    })
    return (response.content[0] as { text: string }).text.trim()
  } catch {
    return `Every gathering is a reminder — God is with us. Eden Life is your family, your home.\n\n#EdenLife #Lagos #Church #Faith`
  }
}

async function getDrivePhotos(folderId: string, apiKey: string) {
  const url = new URL(`${DRIVE_API}/files`)
  url.searchParams.set('q', `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`)
  url.searchParams.set('fields', 'files(id,name,createdTime)')
  url.searchParams.set('orderBy', 'createdTime asc')
  url.searchParams.set('key', apiKey)
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Drive error: ${await res.text()}`)
  const data = await res.json()
  return (data.files ?? []) as { id: string; name: string }[]
}

function extractFolderId(linkOrId: string): string {
  const match = linkOrId.match(/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : linkOrId.trim()
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const igAccount = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  const driveApiKey = process.env.GOOGLE_API_KEY

  if (!igToken || !igAccount || !driveApiKey) {
    return NextResponse.json({ skipped: true, reason: 'Missing env vars: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID, or GOOGLE_API_KEY' })
  }

  // Only run Mon/Wed/Fri (Lagos = UTC+1)
  const lagosNow = new Date(Date.now() + 60 * 60 * 1000)
  const day = lagosNow.getUTCDay()
  if (day !== 1 && day !== 3 && day !== 5) {
    return NextResponse.json({ skipped: true, reason: 'Not a posting day' })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Load Drive folder link from settings
  const { data: setting } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'instagram_drive_folder')
    .single()

  if (!setting?.value) {
    return NextResponse.json({ skipped: true, reason: 'No Drive folder set. Paste the link in the Instagram admin page.' })
  }

  const folderId = extractFolderId(setting.value)

  // Get already-posted file IDs
  const { data: posted } = await admin
    .from('instagram_auto_posts')
    .select('drive_file_id')
  const postedIds = new Set((posted ?? []).map((r: { drive_file_id: string }) => r.drive_file_id))

  const photos = await getDrivePhotos(folderId, driveApiKey)
  const unposted = photos.filter(f => !postedIds.has(f.id))

  if (unposted.length === 0) {
    return NextResponse.json({ skipped: true, reason: 'All photos posted. Add new photos to Drive folder.' })
  }

  const photo = unposted[0]
  const imageUrl = `https://drive.google.com/uc?export=download&id=${photo.id}`
  const caption = await generateCaption(photo.name)

  // Create container
  const container = await igPost(`${igAccount}/media`, {
    image_url: imageUrl,
    caption,
    media_type: null,
  })
  if (!container.id) throw new Error('No container ID from Instagram')

  await new Promise(r => setTimeout(r, 8000))

  // Publish
  const published = await igPost(`${igAccount}/media_publish`, {
    creation_id: container.id,
    access_token: null,
  })

  await admin.from('instagram_auto_posts').insert({
    drive_file_id: photo.id,
    drive_file_name: photo.name,
    ig_media_id: published.id ?? container.id,
    caption,
    posted_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    photo: photo.name,
    caption,
    remaining: unposted.length - 1,
  })
}
