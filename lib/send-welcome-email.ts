import { transporter, FROM } from './mailer'
import { welcomeEmail } from './email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.edenlifeng.org'

// Server-side welcome email sender, for callers that already have the
// recipient's address and name in hand (e.g. the auth callback route) and
// so have no need to round-trip through the /api/welcome HTTP endpoint.
export async function sendWelcomeEmail(email: string, firstName: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Welcome to Eden Life Academy',
      html: welcomeEmail(firstName, APP_URL),
    })
  } catch {
    // Best-effort — never block onboarding on email delivery.
  }
}
