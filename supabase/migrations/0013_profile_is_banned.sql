-- Add is_banned to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
