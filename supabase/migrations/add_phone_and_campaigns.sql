-- Add phone number to member profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Campaigns table for broadcast history
CREATE TABLE IF NOT EXISTS campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          TEXT NOT NULL,
  message          TEXT NOT NULL,
  channels         TEXT[] NOT NULL DEFAULT '{}',
  recipient_filter TEXT NOT NULL DEFAULT 'all',
  image_url        TEXT,
  sheet_csv_url    TEXT,
  scheduled_at     TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'pending',
  sent_email       INTEGER NOT NULL DEFAULT 0,
  sent_whatsapp    INTEGER NOT NULL DEFAULT 0,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns"
  ON campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- App-wide settings (e.g. Google Sheet CSV URL)
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Seed default setting key
INSERT INTO app_settings (key, value) VALUES ('sheet_csv_url', '')
  ON CONFLICT (key) DO NOTHING;
