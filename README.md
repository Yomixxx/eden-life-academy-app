# Eden Life Academy

Discipleship LMS for Eden Life Experience Centre. Next.js (App Router) + Supabase (Postgres, Auth, Storage).

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **Supabase** — project `eden-life-academy` (`rpkxyuohbmbbzoqkulgn`): Postgres + RLS, Auth (email/password + Google), Storage (`lesson-files` bucket)
- Deployed on Vercel as `eden-life-academy-app`, served at `app.edenlifeng.org`

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

Required env vars (also needed as Vercel project env vars for production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

For the daily devotion email (see below), also set:

- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings, used only by the cron route to bypass RLS
- `GOOGLE_SERVICE_ACCOUNT_KEY` — the full JSON key (as a single-line string) for a Google Cloud service
  account with domain-wide delegation for the `gmail.send` scope — see below
- `DEVOTION_FROM_EMAIL` — the Workspace mailbox being impersonated, e.g. `communication@edenlifeng.org`
- `CRON_SECRET` — any random string; Vercel sends it as a bearer token when triggering the cron job

## How courses work

Admins (`profiles.role = 'admin'`) manage courses at `/admin`. Adding a lesson is upload-only —
no manual URL entry: pick a PDF, PPTX, DOCX, or video file in the admin panel and it uploads
directly to the `lesson-files` Supabase Storage bucket (client-side, so large video files don't
pass through a serverless function). The resulting public URL is saved to `lessons.pdf_url` or
`lessons.video_url` automatically.

Row Level Security enforces that only admins can write to `courses`/`lessons`/storage; everyone
else gets read-only access to published content they're enrolled in.

## Daily devotions

A Vercel Cron job (`vercel.json`, `12 6 * * *`) hits `/api/cron/devotions` every morning. It picks
the next entry from a free, curated verse-and-reflection bank (`lib/devotion-bank.ts` — no external
AI API call), inserts it into `daily_devotions` for the day if missing, and emails every subscribed
row in `devotion_subscribers` through the Gmail API (`lib/gmail.ts`). Students can opt in/out from
the dashboard; the job is idempotent per day via `daily_devotions.sent_at`, so a re-run or a second
cron trigger on the same day won't double-send.

Email delivery uses a Google Cloud **service account with domain-wide delegation**, not per-user
OAuth — this avoids the "Testing mode" 7-day refresh-token expiry that silently killed the previous
Gmail-based integration. To set it up:

1. **Google Cloud Console** (console.cloud.google.com), in a project for this app:
   - Enable the **Gmail API** (APIs & Services → Library).
   - Create a **Service Account** (IAM & Admin → Service Accounts), then create and download a
     JSON key for it.
   - Note the service account's numeric **Client ID** (Details tab).
2. **Google Workspace Admin Console** (admin.google.com), as a super admin:
   - Security → Access and data control → API controls → **Domain-wide Delegation** → Add new.
   - Client ID: the service account's numeric client ID from step 1.
   - OAuth scope: `https://www.googleapis.com/auth/gmail.send`
3. Set the downloaded JSON key as the `GOOGLE_SERVICE_ACCOUNT_KEY` env var (paste the whole file
   contents as one line) and `DEVOTION_FROM_EMAIL` to the Workspace mailbox it should send as
   (e.g. `communication@edenlifeng.org`) — the service account impersonates this mailbox, it does
   not need its own inbox.
