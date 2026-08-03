-- Add phone number to member profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;
