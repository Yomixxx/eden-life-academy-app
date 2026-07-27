// Thin wrapper over the Resend REST API. Deliberately plain `fetch` rather
// than the `resend` SDK — a single POST endpoint doesn't need a dependency,
// and this is the only place in the app that sends email.
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const from = process.env.DEVOTION_FROM_EMAIL;
  if (!from) throw new Error('DEVOTION_FROM_EMAIL is not set.');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}
