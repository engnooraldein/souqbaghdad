-- Create auto_publish_settings table
CREATE TABLE IF NOT EXISTS auto_publish_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE, -- 'cars', 'transport', 'products'
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE auto_publish_settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service Role full access on auto_publish_settings" ON auto_publish_settings FOR ALL USING (true);

-- Insert default rows
INSERT INTO auto_publish_settings (category, settings) VALUES 
('cars', '{
  "telegram_main": {"active": true, "channel_id": "-1002302360589"},
  "telegram_rafdain": {"active": false, "channel_id": "-1002361660601"},
  "facebook_souq": {"active": true},
  "facebook_rafdain": {"active": false},
  "instagram_souq": {"active": true}
}'::jsonb),
('transport', '{
  "telegram_main": {"active": false, "channel_id": "-1002302360589"},
  "telegram_rafdain": {"active": true, "channel_id": "-1002361660601"},
  "facebook_souq": {"active": false},
  "facebook_rafdain": {"active": true},
  "instagram_souq": {"active": false}
}'::jsonb),
('products', '{
  "telegram_main": {"active": true, "channel_id": "-1002241648937"},
  "telegram_rafdain": {"active": false, "channel_id": "-1002361660601"},
  "facebook_souq": {"active": true},
  "facebook_rafdain": {"active": false},
  "instagram_souq": {"active": true}
}'::jsonb)
ON CONFLICT (category) DO NOTHING;
