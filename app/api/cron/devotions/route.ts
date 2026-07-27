import { createAdminClient } from '@/lib/supabase/admin';
import { DEVOTION_BANK } from '@/lib/devotion-bank';
import { sendEmail } from '@/lib/resend';
import type { DailyDevotion, DevotionSubscriber } from '@/lib/types';

const EPOCH = new Date('2026-01-01T00:00:00Z').getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

function todaysDate() {
  return new Date().toISOString().slice(0, 10);
}

function renderEmail(devotion: DailyDevotion, name: string) {
  const greeting = name ? `Dear ${name},` : 'Beloved,';
  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a19">
      <p style="font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#898781">
        Eden Life Experience Centre &middot; Eden Life Academy
      </p>
      <h1 style="font-size:1.1rem;margin:.5rem 0 1.25rem">Today's Word &mdash; ${devotion.scripture_reference}</h1>
      <blockquote style="margin:0 0 1.25rem;padding-left:1rem;border-left:3px solid #2a78d6;font-style:italic">
        ${devotion.scripture_text}
      </blockquote>
      <p style="margin:0 0 .75rem">${greeting}</p>
      <p style="line-height:1.6">${devotion.body}</p>
      <p style="margin-top:2rem;font-size:.75rem;color:#898781">
        You're receiving this because you're subscribed to daily devotions from Eden Life Academy.
        Manage your subscription anytime from your dashboard at app.edenlifeng.org.
      </p>
    </div>
  `;
  const text = `${greeting}\n\nToday's Word — ${devotion.scripture_reference}\n"${devotion.scripture_text}"\n\n${devotion.body}\n\n— Eden Life Academy`;
  return { html, text };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const date = todaysDate();

  let { data: devotion } = await supabase
    .from('daily_devotions')
    .select('*')
    .eq('date', date)
    .maybeSingle<DailyDevotion>();

  if (!devotion) {
    const dayIndex = Math.floor((Date.now() - EPOCH) / DAY_MS);
    const entry = DEVOTION_BANK[dayIndex % DEVOTION_BANK.length];

    const { data: inserted, error } = await supabase
      .from('daily_devotions')
      .insert({ date, ...entry })
      .select('*')
      .single<DailyDevotion>();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    devotion = inserted;
  }

  if (devotion.sent_at) {
    return Response.json({ date, skipped: 'already sent today' });
  }

  const { data: subscribers } = await supabase
    .from('devotion_subscribers')
    .select('*')
    .eq('subscribed', true)
    .returns<DevotionSubscriber[]>();

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers ?? []) {
    const { html, text } = renderEmail(devotion, subscriber.full_name ?? '');
    try {
      await sendEmail({
        to: subscriber.email,
        subject: `Today's Word — ${devotion.scripture_reference}`,
        html,
        text,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  await supabase.from('daily_devotions').update({ sent_at: new Date().toISOString() }).eq('id', devotion.id);

  return Response.json({ date, sent, failed });
}
