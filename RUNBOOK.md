# If the app breaks on Sunday

One page. Read top to bottom, stop as soon as something fixes it.

## 1. Is it actually down, or just you?

Open **https://app.edenlifeng.org/api/health** on your phone (not wifi — use mobile data, to rule out a local network issue).

- Shows `{"ok":true, ...}` → the app and database are reachable. That does **not** mean the newest code is being served — check §2 first. Otherwise the problem is probably one specific feature (see §5) or a phone/browser issue on the member's end.
- Shows `{"ok":false, ...}` or won't load at all → it's really down. Go to §3.

## 2. Code was merged but the site looks the same? Check the build, not Supabase

This is the single most common "our work isn't showing up" report — it has now
happened three times (14–15 Sep 2026) — and it is almost never a database
problem. The site is served from a build that is older than `main`, so code
that is correctly merged, correctly reviewed and correctly deployed once is
simply not what visitors receive. Blaming Supabase for it wastes a whole
session, because nothing you change in the database or the code will show up
until the right build is being served.

Takes about 30 seconds:

1. **Open <https://app.edenlifeng.org/api/build-version>** (phone data, not wifi).
   It reports the exact commit the *currently served* site was built from, e.g.
   `{"commit":"e8241267...","shortCommit":"e824126","ref":"arena/01a0a1cc-eden-life-academy-app","environment":"production"}`.
2. **Compare it with the newest Production commit**: GitHub repo →
   [Environments](https://github.com/Yomixxx/eden-life-academy-app/deployments/production)
   → top entry, or the Vercel dashboard → **Production** tab.
3. **They differ (or `ref` is an `arena/…` branch instead of `main`) → stale
   build.** Fix in Vercel: find the deployment whose commit matches the top of
   `main` → "…" → **Redeploy**. Merging any new PR to `main` also forces a
   correct production deploy. **Never click Promote** on an older deployment —
   that is what caused this every time. Re-check `/api/build-version` after a
   minute and hard-refresh (Ctrl+Shift+R) before deciding anything.
4. **They match → the code really is live**, so what's left is data or schema.
   Go to §4 (paused Supabase project, etc.), then run the schema drift check — see the two new rows in the §5 table.

Signed in as an admin, the app also shows a yellow **"Stale deployment is
live"** banner across the top of every page whenever it detects this mismatch,
naming both commits — so from the next release onwards you don't have to
remember to check by hand. (The banner itself is code, so it can only appear
once a *correct* build is live: if production is serving an old build today,
the old build has no banner. Use `/api/build-version` until then.)

## 3. Check if it's a known/active issue

- **UptimeRobot dashboard** — https://uptimerobot.com/dashboard — tells you when it went down and whether it's back up already.
- **Supabase status** — https://status.supabase.com — rules out "Supabase itself is having an outage" (nothing you can do but wait).
- **Vercel status** — https://www.vercel-status.com — same, for hosting.

If either shows a live incident, it's out of our hands — post that in the announcement WhatsApp/Slack and wait.

## 4. Nothing shows up as a known outage — check our own dashboards

- **Vercel deployments**: https://vercel.com/communication-4645s-projects/eden-life-academy-app — look at the top deployment. Fastest cross-check: <https://app.edenlifeng.org/api/build-version> tells you the commit the live site is *actually* serving (§2). If it says **Error** or **Blocked** instead of **Ready**, that's the problem.
  - **"Blocked"** specifically has happened before: Vercel refuses a deployment if the GitHub account that pushed/merged the commit isn't a member of the Vercel team. Fix: Team Settings → Members → add that GitHub account, or have someone who already has access manually trigger a redeploy of the latest commit from the dashboard ("..." menu → Redeploy).
  - **"Error"** → click into it → "Build Logs" to see why it failed to build. This usually needs a developer/AI session to fix the actual code issue.
  - **"The site shows the old UI even though the merge said Ready"** (full procedure in §2) — this happened on **15 Sep 2026**: about 10 minutes after a correct production deploy, a branch (preview) deployment one commit older was promoted to production, and the live site silently went back to old code. Merges to `main` deploy to production automatically — nobody ever needs to click **Promote**. To see what the site is *actually* serving, check the newest **production** deployment on the repo's GitHub → Environments page, or the Vercel dashboard's Production tab. Fix: merge any new (even tiny) PR to `main`, or Redeploy the latest `main` commit from the Vercel dashboard — a fresh production deploy always supersedes a promoted one.
- **Supabase project**: https://supabase.com/dashboard/project/rpkxyuohbmbbzoqkulgn — check it isn't **Paused**. Free-tier Supabase projects auto-pause after ~7 days of no activity. If paused, click **Restore** — takes a couple of minutes.
  - Being un-paused only proves the database is *reachable*. It says nothing about whether the schema matches the code: migrations in `supabase/migrations/` are **not** applied automatically (no CI, no `supabase/config.toml`) — each one only exists in production once a human pasted it into the SQL Editor. To settle that question in one go, run `supabase/migrations/00_verify_schema_drift.sql` (read-only) and read the `fix_hint` column of anything it returns.

## 5. One feature is broken, not the whole app

| Symptom | Likely cause | What to check |
|---|---|---|
| Merged PR is "Ready" but the new UI/behaviour isn't there (admin banner may say *Stale deployment is live*) | An older build is being served — a preview deployment was promoted, or an old commit was redeployed | §2. Compare `/api/build-version` with the newest Production commit, then Redeploy the newest `main` commit from Vercel |
| A whole screen is empty / saves silently do nothing, but the build is current | Database schema drift — a migration in `supabase/migrations/` was never run against production, so a select fails on a missing column and the page renders its empty state | Run `supabase/migrations/00_verify_schema_drift.sql` in Supabase → SQL Editor (read-only). Every problem row comes with the exact migration file to run. Migrations are **never** applied automatically — a human must run each one |
| Can't sign in / stuck in a redirect loop | Auth/session issue | Check Supabase → Authentication → Logs for errors |
| Signed up but never got the welcome email; announcements not arriving; "Ask PG" crisis alerts not reaching pastoral staff | Resend (email relay) is down or misconfigured | Check the daily automated result: Vercel → Project → Logs → filter for `/api/cron/health-check`. Then check the [Resend dashboard](https://resend.com/emails) for delivery failures, confirm `RESEND_API_KEY` is still valid in Vercel env vars, and confirm the sending domain (`RESEND_FROM_EMAIL`) is still verified |
| Lesson videos/PDFs won't load | Supabase Storage issue, or file was deleted | Supabase Dashboard → Storage → `lesson-files` bucket |
| Admin can't post an announcement / manage courses | Logged in as a non-admin account, or a permissions bug | Confirm the account's `role` is `admin` in Supabase → Table Editor → `profiles` |
| Members say they can't find the button to join the live class | The level's Google Meet link was never saved, or "Go Live" was never flipped | Open **Admin → Live Classes** (https://app.edenlifeng.org/admin/live-classes). For the affected level: the Google Meet link must be filled in and saved (the page now refuses to go live without one), and the toggle must read "Live now". Students' dashboards pick it up within ~20 seconds. If the member has no level (100/200/300) on their registration, their dashboard shows a "Choose my level" card instead — point them at https://app.edenlifeng.org/register |
| Some people registered but have no level and/or no matric number | Incomplete cohort enrollment (skipped level, older path, or matric trigger didn't fire) | **Automatic:** the app scans every logged-in page. Missing level → blocking prompt to pick 100/200/300; matric is assigned immediately and shown. Missing matric only → assigned silently with a toast. **Admin fallback:** Admin → Registrations → **Incomplete only** → Set level. Or send them to `/register`. After deploy, run `supabase/migrations/backfill_cohort_matric.sql` once in Supabase SQL for bulk repair. |
| App is very slow when a lot of people join at once (e.g. right after a service announcement) | Hobby-tier resource limits under load | Nothing to do in the moment; if this keeps happening, it's a sign to upgrade the Vercel/Supabase plan |

## 6. If you get a phone alert (ntfy)

That means the automated daily health check found a real problem (database unreachable, or the email relay failed) — go straight to §4, you don't need to start at §1.

## 7. Who to call

_(Fill in before printing/pinning this)_

- Primary contact: **______________________** — phone: **______________________**
- Backup contact: **______________________** — phone: **______________________**
- GitHub repo (for anyone doing an AI-assisted fix session): `Yomixxx/eden-life-academy-app`

## Useful links, all in one place

- App: https://app.edenlifeng.org
- Health check: https://app.edenlifeng.org/api/health
- Which build is live: https://app.edenlifeng.org/api/build-version
- Production deployment history: https://github.com/Yomixxx/eden-life-academy-app/deployments/production
- Vercel project: https://vercel.com/communication-4645s-projects/eden-life-academy-app
- Supabase project: https://supabase.com/dashboard/project/rpkxyuohbmbbzoqkulgn
- UptimeRobot: https://uptimerobot.com/dashboard
- GitHub repo: https://github.com/Yomixxx/eden-life-academy-app
