// Outbound app email (welcome, announcements, course reminders, pastoral
// alerts) is relayed through a Google Apps Script Web App instead of raw
// SMTP. Raw SMTP connections from this host were hanging for minutes before
// failing; Apps Script only needs a normal HTTPS POST, which isn't subject
// to the same port-level blocking/timeouts.
const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL
const SCRIPT_SECRET = process.env.GOOGLE_SCRIPT_SECRET

export function isMailerConfigured(): boolean {
  return !!SCRIPT_URL && !!SCRIPT_SECRET
}

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!SCRIPT_URL || !SCRIPT_SECRET) throw new Error('Google Script mailer is not configured')

  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SCRIPT_SECRET, to, subject, html, fromName: 'Eden Life Academy' }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `Google Script relay responded with ${res.status}`)
  }
}
