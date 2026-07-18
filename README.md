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

## How courses work

Admins (`profiles.role = 'admin'`) manage courses at `/admin`. Adding a lesson is upload-only —
no manual URL entry: pick a PDF, PPTX, DOCX, or video file in the admin panel and it uploads
directly to the `lesson-files` Supabase Storage bucket (client-side, so large video files don't
pass through a serverless function). The resulting public URL is saved to `lessons.pdf_url` or
`lessons.video_url` automatically.

Row Level Security enforces that only admins can write to `courses`/`lessons`/storage; everyone
else gets read-only access to published content they're enrolled in.
