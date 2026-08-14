-- Add sync_status JSONB column to track publishing status
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS sync_status JSONB DEFAULT '{"facebook": "pending", "instagram": "pending", "telegram": "pending"}'::jsonb;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sync_status JSONB DEFAULT '{"facebook": "pending", "instagram": "pending", "telegram": "pending"}'::jsonb;

-- (Note: transport_ads uses the `ads` table so it's already covered above)
