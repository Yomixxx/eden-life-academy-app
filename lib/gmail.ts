import { JWT } from 'google-auth-library';

// Sends via the Gmail API, authenticated as a service account with domain-wide
// delegation impersonating a Workspace mailbox (DEVOTION_FROM_EMAIL). This is
// a JWT signed with the service account's private key, re-minted on every
// call — unlike a per-user OAuth refresh token, it has no "Testing mode"
// 7-day expiry and never needs re-consent.
let cachedClient: JWT | null = null;

function getClient() {
  if (cachedClient) return cachedClient;

  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  cachedClient = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: process.env.DEVOTION_FROM_EMAIL,
  });
  return cachedClient;
}

function encodeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
}

function base64url(input: string) {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildRawMessage(params: { from: string; to: string; subject: string; html: string; text: string }) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const message = [
    `From: ${encodeHeader(params.from)}`,
    `To: ${params.to}`,
    `Subject: ${encodeHeader(params.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.html,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return base64url(message);
}

export async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  const from = process.env.DEVOTION_FROM_EMAIL;
  if (!from) throw new Error('DEVOTION_FROM_EMAIL is not set.');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set.');

  const client = getClient();
  const raw = buildRawMessage({ ...params, from });

  await client.request({
    url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    method: 'POST',
    data: { raw },
  });
}
