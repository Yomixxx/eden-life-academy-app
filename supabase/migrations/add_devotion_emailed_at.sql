-- Tracks whether a given day's devotion has already been emailed out, so
-- the daily-devotion cron's new email step stays idempotent the same way
-- its generation step already is.
ALTER TABLE public.daily_devotions ADD COLUMN IF NOT EXISTS emailed_at timestamptz;
