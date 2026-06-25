-- ============================================================
-- Migration 0015: Ad Viewers and Notifications Update
-- ============================================================

-- 1. Create ad_viewers table to track who viewed what
CREATE TABLE IF NOT EXISTS ad_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL, -- Can be ad, product, or transport ID
  item_type text NOT NULL DEFAULT 'ad',
  viewer_id text NOT NULL, -- UUID or guest ID
  viewer_name text,
  viewer_avatar text,
  viewer_location text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by item
CREATE INDEX IF NOT EXISTS ad_viewers_item_idx ON ad_viewers(item_id, item_type);

-- Enable RLS
ALTER TABLE ad_viewers ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anyone can log their view)
DROP POLICY IF EXISTS "Allow public insert on ad_viewers" ON ad_viewers;
CREATE POLICY "Allow public insert on ad_viewers"
  ON ad_viewers FOR INSERT WITH CHECK (true);

-- Allow public read (we will let the frontend filter, or anyone can see viewers)
DROP POLICY IF EXISTS "Allow public read on ad_viewers" ON ad_viewers;
CREATE POLICY "Allow public read on ad_viewers"
  ON ad_viewers FOR SELECT USING (true);

-- 2. Ensure user_notifications is ready (it was created in 0002_marketplace_features)
-- But we need to make sure anyone can insert a notification if they view an ad?
-- Wait, if a guest views an ad, they send a notification to the owner.
-- So user_notifications needs an INSERT policy for public.
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on user_notifications" ON user_notifications;
CREATE POLICY "Allow public insert on user_notifications"
  ON user_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user to read own notifications" ON user_notifications;
CREATE POLICY "Allow user to read own notifications"
  ON user_notifications FOR SELECT USING (auth.uid() = user_id OR public.is_owner());

DROP POLICY IF EXISTS "Allow user to update own notifications" ON user_notifications;
CREATE POLICY "Allow user to update own notifications"
  ON user_notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_owner());
