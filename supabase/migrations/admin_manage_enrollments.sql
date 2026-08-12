-- Lets admins view and remove any member's course enrollment from the new
-- "Enrolled Members" panel on /admin/courses. Idempotent: drops the policy
-- first so this is safe to re-run even if an equivalent one already exists.
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
CREATE POLICY "Admins can manage enrollments" ON enrollments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
