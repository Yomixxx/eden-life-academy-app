// All email templates follow the Eden Life church-letter voice:
// Senior Pastor Gbenga Ajibola, Eden Life Experience Centre, Lagos
// Warm, direct, pastoral. No corporate language. No em dashes.

export function wrapInLayout(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f0d;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f0d;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111a15;border:1px solid #1e2d22;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0c2018;padding:28px 40px 24px;border-bottom:2px solid #5ec957;">
  <p style="margin:0 0 2px;font-size:10px;font-weight:bold;letter-spacing:0.28em;text-transform:uppercase;color:#5ec957;">Eden Life Experience Centre</p>
  <p style="margin:0;font-size:18px;font-weight:bold;color:#f1f5f2;">Eden Life Academy</p>
</td></tr>
<tr><td style="padding:36px 40px 32px;">${body}</td></tr>
<tr><td style="padding:20px 40px;background:#0a0f0d;border-top:1px solid #1e2d22;">
  <p style="margin:0;font-size:11px;color:#334155;line-height:1.6;">
    Eden Life Experience Centre · Mainland: Ogudu · Island: Ajah · Online, Lagos<br>
    <a href="https://eden-life-academy-app.vercel.app" style="color:#5ec957;text-decoration:none;">eden-life-academy-app.vercel.app</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`
}

function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="background:#5ec957;border-radius:8px;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#0a0f0d;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`
}

function signature(): string {
  return `<p style="margin:24px 0 4px;font-size:14px;color:#e2e8f0;font-weight:bold;">Senior Pastor Gbenga Ajibola</p>
<p style="margin:0;font-size:13px;color:#64748b;">Eden Life Experience Centre, Lagos</p>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function paragraphs(body: string): string {
  return body
    .split('\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#e2e8f0;">${escapeHtml(p)}</p>`)
    .join('')
}

// ── Welcome email (sent right after signup / campus setup) ──────────────────
export function welcomeEmail(firstName: string, appUrl: string): string {
  const body = `Beloved ${firstName},

Welcome to the Eden Life family. I am glad you are here.

You have taken a real step today, not just signing up for an app, but choosing to grow. Eden Life Academy exists to equip you for Christ and a life of exploits, and I want to walk that road with you.

Your first course, Growth Steps, is already waiting for you. It will not take long, but it will lay a foundation that lasts.

We love you. You are not a visitor here. You are family.`

  return wrapInLayout(`
    <p style="margin:0 0 16px;font-size:10px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;color:#5ec957;">A Word From Pastor Gbenga Ajibola</p>
    ${paragraphs(body)}
    ${ctaButton(`${appUrl}/courses`, 'Start Growth Steps')}
    ${signature()}
  `)
}

// ── Announcement broadcast (sent when an announcement goes live) ────────────
export function announcementEmail(firstName: string, title: string, body: string, appUrl: string): string {
  return wrapInLayout(`
    <p style="margin:0 0 16px;font-size:10px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;color:#5ec957;">New Announcement</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#e2e8f0;">Dear ${escapeHtml(firstName)},</p>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#f1f5f2;">${escapeHtml(title)}</h2>
    ${paragraphs(body)}
    ${ctaButton(`${appUrl}/announcements`, 'View in the app')}
    ${signature()}
  `)
}
