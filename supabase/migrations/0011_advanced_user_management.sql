-- ============================================================
-- Migration 0011: Advanced User Management & Guests
-- ============================================================

-- 1. Add last_seen to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- 2. Create guests table to track unregistered visitors using a generated UUID
CREATE TABLE IF NOT EXISTS guests (
  id text PRIMARY KEY,
  last_seen timestamptz DEFAULT now(),
  is_banned boolean DEFAULT false,
  user_agent text,
  city text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert/update on guests
-- Anyone can register their own device id or update their last_seen
DROP POLICY IF EXISTS "Allow public read on guests" ON guests;
CREATE POLICY "Allow public read on guests" ON guests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on guests" ON guests;
CREATE POLICY "Allow public insert on guests" ON guests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on guests" ON guests;
CREATE POLICY "Allow public update on guests" ON guests FOR UPDATE USING (true);
