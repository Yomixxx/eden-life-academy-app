// Outbound app email (welcome, announcements, course reminders, pastoral
// alerts) is sent via Resend. Requires RESEND_API_KEY, and a verified
// sending domain set via RESEND_FROM_EMAIL once one's configured in the
// Resend dashboard — until then this falls back to Resend's shared
// onboarding@resend.dev sender, which only delivers to the account's own
// verified email address.
import { Resend } from 'resend'

const API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Eden Life Academy <onboarding@resend.dev>'

const resend = API_KEY ? new Resend(API_KEY) : null

export function isMailerConfigured(): boolean {
  return !!resend
}

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!resend) throw new Error('Resend mailer is not configured')

  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(error.message)
}
