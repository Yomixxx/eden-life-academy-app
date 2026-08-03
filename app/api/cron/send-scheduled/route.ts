import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  fetchSheetEmails,
  fetchSupabaseMembers,
  mergeRecipients,
  sendEmailBroadcast,
} from '@/lib/broadcast-helpers'
import { sendWhatsApp } from '@/lib/whatsapp'

// Runs every hour — processes campaigns with scheduled_at <= NOW() and status = 'scheduled'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: dueCampaigns } = await admin
    .from('campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(10)

  if (!dueCampaigns || dueCampaigns.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const campaign of dueCampaigns) {
    // Mark as sending to prevent double-send
    await admin.from('campaigns').update({ status: 'sending' }).eq('id', campaign.id)

    const sheetMembers = campaign.sheet_csv_url ? await fetchSheetEmails(campaign.sheet_csv_url) : []
    const dbMembers = await fetchSupabaseMembers(campaign.recipient_filter ?? 'all')
    const recipients = mergeRecipients(sheetMembers, dbMembers)

    let sentEmail = 0
    let sentWhatsapp = 0

    if ((campaign.channels as string[]).includes('email')) {
      sentEmail = await sendEmailBroadcast(recipients, campaign.subject, campaign.message, campaign.image_url)
    }

    if ((campaign.channels as string[]).includes('whatsapp')) {
      await Promise.allSettled(
        recipients.map(async r => {
          if (!r.phone) return
          const ok = await sendWhatsApp(r.phone, r.firstName, campaign.message)
          if (ok) sentWhatsapp++
        })
      )
    }

    await admin.from('campaigns').update({
      status: 'sent',
      sent_email: sentEmail,
      sent_whatsapp: sentWhatsapp,
      total_recipients: recipients.length,
    }).eq('id', campaign.id)

    processed++
  }

  return NextResponse.json({ processed })
}
