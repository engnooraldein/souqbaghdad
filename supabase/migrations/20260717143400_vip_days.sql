-- Add vip_days to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS vip_days integer DEFAULT 30;

-- Add vip_days to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vip_days integer DEFAULT 30;
