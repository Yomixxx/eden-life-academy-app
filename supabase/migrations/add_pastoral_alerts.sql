-- Pastoral care alerts: flags crisis-level messages from Ask PG so a real
-- staff member is notified and can follow up, instead of the AI being the
-- only response a congregant in crisis ever gets.
CREATE TABLE IF NOT EXISTS pastoral_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'ask_pg',
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pastoral_alerts ENABLE ROW LEVEL SECURITY;

-- Rows are written by the server using the service role key (bypasses RLS),
-- never directly by a client, so only a read/update policy for admins is needed.
CREATE POLICY "Admins can view pastoral alerts" ON pastoral_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update pastoral alerts" ON pastoral_alerts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
