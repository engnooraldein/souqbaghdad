-- ============================================================
-- Migration 0009: Account Types, Username, and Password Recovery
-- ============================================================

-- 1. Add username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create an index on username for faster lookups since we will route via username/phone
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);

-- Note: The `role` column in `profiles` already exists (defaults to 'user').
-- We will use 'user', 'merchant', 'pro', and 'owner' as valid roles.

-- 2. Create password recovery requests table
CREATE TABLE IF NOT EXISTS password_recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE password_recovery_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a recovery request
DROP POLICY IF EXISTS "Anyone can insert a password recovery request" ON password_recovery_requests;
CREATE POLICY "Anyone can insert a password recovery request"
  ON password_recovery_requests FOR INSERT WITH CHECK (true);

-- Only owner can read/update password recovery requests
DROP POLICY IF EXISTS "Owner can read all password recovery requests" ON password_recovery_requests;
CREATE POLICY "Owner can read all password recovery requests"
  ON password_recovery_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Owner can update password recovery requests" ON password_recovery_requests;
CREATE POLICY "Owner can update password recovery requests"
  ON password_recovery_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );
