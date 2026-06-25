-- ============================================================
-- Migration 0008: Verification Requests
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  id_image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own verification requests" ON verification_requests;
CREATE POLICY "Users can insert their own verification requests"
  ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own verification requests" ON verification_requests;
CREATE POLICY "Users can view their own verification requests"
  ON verification_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner can read all verification requests" ON verification_requests;
CREATE POLICY "Owner can read all verification requests"
  ON verification_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Owner can update verification requests" ON verification_requests;
CREATE POLICY "Owner can update verification requests"
  ON verification_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Update profiles role check constraint if it exists (Optional, Supabase just stores text)
-- Adding 'pro' role is just a string assignment in application logic.
