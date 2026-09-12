// Phone-reaching alert channel for the health-check cron. Deliberately
// independent of lib/mailer.ts — if the Google Apps Script email relay is
// the thing that's broken, alerting through that same relay would never
// arrive. ntfy.sh needs no account/API key: anyone who installs the free
// ntfy app and subscribes to NTFY_ALERT_TOPIC gets an instant push.
import { cleanEnv } from '@/lib/env'

const NTFY_TOPIC = cleanEnv(process.env.NTFY_ALERT_TOPIC)

export function isPhoneAlertConfigured(): boolean {
  return !!NTFY_TOPIC
}

export async function sendPhoneAlert(title: string, message: string): Promise<void> {
  if (!NTFY_TOPIC) return

  await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: 'POST',
    headers: {
      Title: title,
      Priority: 'urgent',
      Tags: 'rotating_light',
    },
    body: message,
  }).catch(() => {
    // Best-effort — there's no further fallback channel to alert through.
  })
}
