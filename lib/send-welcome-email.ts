import { sendEmail, isMailerConfigured } from './mailer'
import { welcomeEmail } from './email-templates'
import { cleanEnv } from '@/lib/env'

const APP_URL = cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || 'https://app.edenlifeng.org'

// Server-side welcome email sender, for callers that already have the
// recipient's address and name in hand (e.g. the auth callback route) and
// so have no need to round-trip through the /api/welcome HTTP endpoint.
export async function sendWelcomeEmail(email: string, firstName: string) {
  if (!isMailerConfigured()) return
  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to Eden Life Academy',
      html: welcomeEmail(firstName, APP_URL),
    })
  } catch {
    // Best-effort — never block onboarding on email delivery.
  }
}
