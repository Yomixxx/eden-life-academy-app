-- Track when a "continue your course" reminder email was last sent for an
-- enrollment, so the reminder cron does not re-email the same in-progress
-- course every day.
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
