import { transporter } from '@/lib/mailer'
import { FROM_GLOBAL } from '@/lib/mailer'
import { createClient } from '@supabase/supabase-js'

export interface Recipient {
  email: string
  phone: string | null
  firstName: string
}

export async function fetchSheetEmails(csvUrl: string): Promise<Recipient[]> {
  try {
    const res = await fetch(csvUrl, { cache: 'no-store' })
    const text = await res.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    const headerCols = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const emailIdx = headerCols.findIndex(c => c.includes('email') || c.includes('mail'))
    const nameIdx = headerCols.findIndex(c => c.includes('name') || c.includes('first'))

    const eIdx = emailIdx >= 0 ? emailIdx : 0
    const nIdx = nameIdx >= 0 ? nameIdx : -1

    return lines.slice(1).flatMap(line => {
      const parts = line.split(',').map(p => p.replace(/"/g, '').trim())
      const email = parts[eIdx]?.trim()
      if (!email || !email.includes('@')) return []
      const firstName = nIdx >= 0 ? (parts[nIdx]?.split(' ')[0] || 'Beloved') : 'Beloved'
      return [{ email, phone: null, firstName }]
    })
  } catch {
    return []
  }
}

export async function fetchSupabaseMembers(recipientFilter: string): Promise<Recipient[]> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  let query = admin.from('profiles').select('full_name, email, phone, campus')
  if (recipientFilter !== 'all') query = query.eq('campus', recipientFilter)
  const { data } = await query
  return (data ?? []).flatMap(p => {
    if (!p.email) return []
    return [{ email: p.email as string, phone: p.phone ?? null, firstName: p.full_name?.split(' ')[0] || 'Beloved' }]
  })
}

export function mergeRecipients(a: Recipient[], b: Recipient[]): Recipient[] {
  const seen = new Set<string>()
  return [...a, ...b].filter(r => {
    const key = r.email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function sendEmailBroadcast(
  recipients: Recipient[],
  subject: string,
  body: string,
  imageUrl?: string | null
): Promise<number> {
  let sent = 0
  await Promise.allSettled(
    recipients.map(async r => {
      try {
        await transporter.sendMail({
          from: FROM_GLOBAL,
          to: r.email,
          subject,
          html: buildBroadcastHtml(r.firstName, subject, body, imageUrl),
        })
        sent++
      } catch { /* continue */ }
    })
  )
  return sent
}

export function buildBroadcastHtml(
  firstName: string,
  subject: string,
  body: string,
  imageUrl?: string | null
): string {
  const paragraphs = body
    .split('\n')
    .filter(Boolean)
    .map(l => `<p style="margin:0 0 1.1em;line-height:1.75;color:#374151;font-size:15px;font-family:Georgia,'Times New Roman',serif">${l}</p>`)
    .join('')

  const bannerHtml = imageUrl
    ? `<tr><td style="padding:0;line-height:0;font-size:0"><img src="${imageUrl}" alt="${subject}" style="width:100%;max-width:600px;display:block;border:0" /></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Georgia,'Times New Roman',serif">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.12)">

  <tr><td style="background:#0f2044;padding:28px 40px;text-align:center">
    <img src="https://eden-life-academy-app.vercel.app/logo-white.png" alt="Eden Life" height="52" style="display:inline-block" />
    <p style="margin:8px 0 0;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.5);font-family:Arial,sans-serif">Edenlife Global</p>
  </td></tr>

  ${bannerHtml}

  <tr><td style="background:#ffffff;padding:44px 44px 36px">
    <p style="margin:0 0 20px;font-size:16px;color:#374151;font-family:Georgia,'Times New Roman',serif">Dear ${firstName},</p>
    ${paragraphs}
    <div style="margin-top:32px;padding-top:24px;border-top:2px solid #f3f4f6">
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;font-family:Arial,sans-serif">
        With love,<br/>
        <strong style="color:#0f2044;font-size:15px">Pastor Gbenga Ajibola</strong><br/>
        <span style="font-size:12px;color:#9ca3af">Senior Pastor, Eden Life Experience Centre · Lagos, Nigeria</span>
      </p>
    </div>
  </td></tr>

  <tr><td style="background:#0f2044;padding:32px 40px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px">
      <tr>
        <td style="padding:0 5px">
          <a href="https://facebook.com/edenlifeglobal" style="display:inline-block;background:rgba(255,255,255,.12);color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:7px 16px;border-radius:20px;text-decoration:none;letter-spacing:.03em">Facebook</a>
        </td>
        <td style="padding:0 5px">
          <a href="https://instagram.com/edenlifeglobal" style="display:inline-block;background:rgba(255,255,255,.12);color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:7px 16px;border-radius:20px;text-decoration:none;letter-spacing:.03em">Instagram</a>
        </td>
        <td style="padding:0 5px">
          <a href="https://youtube.com/@edenlifeglobal" style="display:inline-block;background:rgba(255,255,255,.12);color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:7px 16px;border-radius:20px;text-decoration:none;letter-spacing:.03em">YouTube</a>
        </td>
      </tr>
    </table>
    <img src="https://eden-life-academy-app.vercel.app/logo-white.png" alt="Eden Life" height="36" style="display:block;margin:0 auto 12px" />
    <a href="https://edenlifeng.org" style="display:block;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,.55);text-decoration:none;margin-bottom:6px">edenlifeng.org</a>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,.3)">Eden Life Experience Centre &middot; Lagos, Nigeria</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}
