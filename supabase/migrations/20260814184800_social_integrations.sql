-- Create table to store social media integrations (like TikTok tokens)
CREATE TABLE IF NOT EXISTS social_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  open_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (only service role should access this for security)
ALTER TABLE social_integrations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service Role full access on social_integrations" ON social_integrations FOR ALL USING (true);
