# If the app breaks on Sunday

One page. Read top to bottom, stop as soon as something fixes it.

## 1. Is it actually down, or just you?

Open **https://app.edenlifeng.org/api/health** on your phone (not wifi — use mobile data, to rule out a local network issue).

- Shows `{"ok":true, ...}` → the app and database are fine. The problem is probably one specific feature (see §4) or a phone/browser issue on the member's end.
- Shows `{"ok":false, ...}` or won't load at all → it's really down. Go to §2.

## 2. Check if it's a known/active issue

- **UptimeRobot dashboard** — https://uptimerobot.com/dashboard — tells you when it went down and whether it's back up already.
- **Supabase status** — https://status.supabase.com — rules out "Supabase itself is having an outage" (nothing you can do but wait).
- **Vercel status** — https://www.vercel-status.com — same, for hosting.

If either shows a live incident, it's out of our hands — post that in the announcement WhatsApp/Slack and wait.

## 3. Nothing shows up as a known outage — check our own dashboards

- **Vercel deployments**: https://vercel.com/communication-4645s-projects/eden-life-academy-app — look at the top deployment. If it says **Error** or **Blocked** instead of **Ready**, that's the problem.
  - **"Blocked"** specifically has happened before: Vercel refuses a deployment if the GitHub account that pushed/merged the commit isn't a member of the Vercel team. Fix: Team Settings → Members → add that GitHub account, or have someone who already has access manually trigger a redeploy of the latest commit from the dashboard ("..." menu → Redeploy).
  - **"Error"** → click into it → "Build Logs" to see why it failed to build. This usually needs a developer/AI session to fix the actual code issue.
- **Supabase project**: https://supabase.com/dashboard/project/rpkxyuohbmbbzoqkulgn — check it isn't **Paused**. Free-tier Supabase projects auto-pause after ~7 days of no activity. If paused, click **Restore** — takes a couple of minutes.

## 4. One feature is broken, not the whole app

| Symptom | Likely cause | What to check |
|---|---|---|
| Can't sign in / stuck in a redirect loop | Auth/session issue | Check Supabase → Authentication → Logs for errors |
| Signed up but never got the welcome email; announcements not arriving; "Ask PG" crisis alerts not reaching pastoral staff | Email relay (Google Apps Script) is down | Check the daily automated result: Vercel → Project → Logs → filter for `/api/cron/health-check`. If it's been failing, redeploy the Apps Script (see `google-apps-script/Code.gs` header comment for steps) or check quota limits in the Google account running the script |
| Lesson videos/PDFs won't load | Supabase Storage issue, or file was deleted | Supabase Dashboard → Storage → `lesson-files` bucket |
| Admin can't post an announcement / manage courses | Logged in as a non-admin account, or a permissions bug | Confirm the account's `role` is `admin` in Supabase → Table Editor → `profiles` |
| App is very slow when a lot of people join at once (e.g. right after a service announcement) | Hobby-tier resource limits under load | Nothing to do in the moment; if this keeps happening, it's a sign to upgrade the Vercel/Supabase plan |

## 5. If you get a phone alert (ntfy)

That means the automated daily health check found a real problem (database unreachable, or the email relay failed) — go straight to §3, you don't need to start at §1.

## 6. Who to call

_(Fill in before printing/pinning this)_

- Primary contact: **______________________** — phone: **______________________**
- Backup contact: **______________________** — phone: **______________________**
- GitHub repo (for anyone doing an AI-assisted fix session): `Yomixxx/eden-life-academy-app`

## Useful links, all in one place

- App: https://app.edenlifeng.org
- Health check: https://app.edenlifeng.org/api/health
- Vercel project: https://vercel.com/communication-4645s-projects/eden-life-academy-app
- Supabase project: https://supabase.com/dashboard/project/rpkxyuohbmbbzoqkulgn
- UptimeRobot: https://uptimerobot.com/dashboard
- GitHub repo: https://github.com/Yomixxx/eden-life-academy-app
