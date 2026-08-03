CREATE TABLE IF NOT EXISTS instagram_auto_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id     TEXT NOT NULL UNIQUE,
  drive_file_name   TEXT NOT NULL,
  ig_media_id       TEXT,
  caption           TEXT,
  posted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE instagram_auto_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view instagram_auto_posts"
  ON instagram_auto_posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

INSERT INTO app_settings (key, value)
  VALUES ('instagram_drive_folder', '')
  ON CONFLICT (key) DO NOTHING;
