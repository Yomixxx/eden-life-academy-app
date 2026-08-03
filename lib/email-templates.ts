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

// ── Welcome email (sent after campus is set) ──────────────────────────────────
export function welcomeEmail(firstName: string, campus: string, aiBody?: string): string {
  const body = aiBody ?? defaultWelcomeBody(firstName, campus)
  return wrapInLayout(`
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#e2e8f0;">${body.replace(/\n/g, '</p><p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#94a3b8;">')}</p>
    ${ctaButton('https://eden-life-academy-app.vercel.app/courses', 'Start Growth Steps')}
    ${signature()}
  `)
}

function defaultWelcomeBody(firstName: string, campus: string): string {
  return `Welcome to Eden Life Academy, ${firstName}.\n\nYou have taken a real step. Growth Steps, your first course, is already enrolled and waiting for you.\n\nYou are registered with our ${campus} campus. You will receive announcements, sermons, and updates that are relevant to your location and journey.\n\nWe are glad you are here.`
}

// ── Course reminder (inactive for 7+ days) ────────────────────────────────────
export function reminderEmail(firstName: string, courseName: string, lessonsCompleted: number, totalLessons: number, aiBody?: string): string {
  const body = aiBody ?? defaultReminderBody(firstName, courseName, lessonsCompleted, totalLessons)
  return wrapInLayout(`
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#e2e8f0;">${body.replace(/\n/g, '</p><p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#94a3b8;">')}</p>
    ${ctaButton('https://eden-life-academy-app.vercel.app/courses', 'Continue where I left off')}
    ${signature()}
  `)
}

function defaultReminderBody(firstName: string, courseName: string, done: number, total: number): string {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return `${firstName}, your course is still waiting.\n\nYou are ${pct}% through ${courseName} — ${done} of ${total} lessons done. That is real progress, and it would be a shame to lose momentum now.\n\nFive minutes today is enough to keep going.`
}

// ── Lesson milestone (50% through a course) ───────────────────────────────────
export function milestoneEmail(firstName: string, courseName: string, aiBody?: string): string {
  const body = aiBody ?? defaultMilestoneBody(firstName, courseName)
  return wrapInLayout(`
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#e2e8f0;">${body.replace(/\n/g, '</p><p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#94a3b8;">')}</p>
    ${ctaButton('https://eden-life-academy-app.vercel.app/courses', 'Keep going')}
    ${signature()}
  `)
}

function defaultMilestoneBody(firstName: string, courseName: string): string {
  return `${firstName}, you are halfway through ${courseName}.\n\nThat is worth acknowledging. A lot of people start. Fewer people get this far.\n\nFinish it. What is waiting on the other side of this course is worth it.`
}

// ── Certificate issued (course complete) ──────────────────────────────────────
export function certificateEmail(firstName: string, courseName: string, aiBody?: string): string {
  const body = aiBody ?? defaultCertBody(firstName, courseName)
  return wrapInLayout(`
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#e2e8f0;">${body.replace(/\n/g, '</p><p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#94a3b8;">')}</p>
    ${ctaButton('https://eden-life-academy-app.vercel.app/certificates', 'View my certificate')}
    ${signature()}
  `)
}

function defaultCertBody(firstName: string, courseName: string): string {
  return `${firstName}, you finished ${courseName}.\n\nYour certificate is ready. This is not just a document. It is a record of a decision you made and kept.\n\nWhat is next on your journey is up to you. The catalog is open.`
}

// ── Daily devotional ──────────────────────────────────────────────────────────
export function devotionalEmail(
  firstName: string,
  scriptureRef: string,
  scriptureText: string,
  body: string,
  appUrl: string
): string {
  const paragraphs = body
    .split('\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#94a3b8;">${p}</p>`)
    .join('')

  return wrapInLayout(`
    <p style="margin:0 0 16px;font-size:10px;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;color:#5ec957;">Today's Word</p>

    <div style="background:#0c2018;border-left:3px solid #5ec957;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 28px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;color:#5ec957;letter-spacing:0.1em;text-transform:uppercase;">${scriptureRef}</p>
      <p style="margin:0;font-size:15px;line-height:1.75;color:#e2e8f0;font-style:italic;">"${scriptureText}"</p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#e2e8f0;">Dear ${firstName},</p>
    ${paragraphs}

    ${ctaButton(`${appUrl}/devotion`, 'Read in the app')}
    ${signature()}
  `)
}
