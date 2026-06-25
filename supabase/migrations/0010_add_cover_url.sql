-- Migration 0010: Add cover_url to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url text;
