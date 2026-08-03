import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as supabaseAdmin } from '@supabase/supabase-js'
import {
  fetchSheetEmails,
  fetchSupabaseMembers,
  mergeRecipients,
  sendEmailBroadcast,
} from '@/lib/broadcast-helpers'
import { sendWhatsApp } from '@/lib/whatsapp'

interface BroadcastBody {
  subject: string
  message: string
  channels: string[]
  recipientFilter: string
  imageUrl?: string | null
  scheduledAt?: string | null
  sheetCsvUrl?: string | null
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = supabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body: BroadcastBody = await req.json()
  const { subject, message, channels, recipientFilter, imageUrl, scheduledAt, sheetCsvUrl } = body

  if (!subject || !message || !channels?.length) {
    return NextResponse.json({ error: 'subject, message, and channels are required' }, { status: 400 })
  }

  // If scheduled for future, save campaign and return
  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    const sheetMembers = sheetCsvUrl ? await fetchSheetEmails(sheetCsvUrl) : []
    const dbMembers = await fetchSupabaseMembers(recipientFilter)
    const recipients = mergeRecipients(sheetMembers, dbMembers)

    await admin.from('campaigns').insert({
      subject, message, channels,
      recipient_filter: recipientFilter,
      image_url: imageUrl ?? null,
      sheet_csv_url: sheetCsvUrl ?? null,
      scheduled_at: scheduledAt,
      status: 'scheduled',
      total_recipients: recipients.length,
      sent_email: 0, sent_whatsapp: 0,
      created_by: user.id,
    })
    return NextResponse.json({ message: `Scheduled for ${new Date(scheduledAt).toLocaleString()}. ${recipients.length} recipients queued.` })
  }

  // Send immediately
  const sheetMembers = sheetCsvUrl ? await fetchSheetEmails(sheetCsvUrl) : []
  const dbMembers = await fetchSupabaseMembers(recipientFilter)
  const recipients = mergeRecipients(sheetMembers, dbMembers)

  const { data: campaign } = await admin.from('campaigns').insert({
    subject, message, channels,
    recipient_filter: recipientFilter,
    image_url: imageUrl ?? null,
    sheet_csv_url: sheetCsvUrl ?? null,
    status: 'sending',
    total_recipients: recipients.length,
    sent_email: 0, sent_whatsapp: 0,
    created_by: user.id,
  }).select().single()

  let sentEmail = 0
  let sentWhatsapp = 0

  if (channels.includes('email')) {
    sentEmail = await sendEmailBroadcast(recipients, subject, message, imageUrl)
  }

  if (channels.includes('whatsapp')) {
    await Promise.allSettled(
      recipients.map(async r => {
        if (!r.phone) return
        const ok = await sendWhatsApp(r.phone, r.firstName, message)
        if (ok) sentWhatsapp++
      })
    )
  }

  if (campaign?.id) {
    await admin.from('campaigns').update({
      status: 'sent', sent_email: sentEmail, sent_whatsapp: sentWhatsapp,
    }).eq('id', campaign.id)
  }

  return NextResponse.json({
    message: `Broadcast sent to ${recipients.length} recipients. Email: ${sentEmail}, WhatsApp: ${sentWhatsapp}`,
    sent: { email: sentEmail, whatsapp: sentWhatsapp },
    total: recipients.length,
  })
}
