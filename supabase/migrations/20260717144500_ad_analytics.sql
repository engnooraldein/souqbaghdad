-- Migration: 0019_ad_analytics.sql

-- Add analytics fields to ads table
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS whatsapp_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS call_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_watch_time integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_interaction_at timestamp with time zone;

-- Add analytics fields to products table (optional if products have similar features)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS whatsapp_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS call_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_watch_time integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_interaction_at timestamp with time zone;

-- Create an RPC to safely increment analytics without needing complex RLS policies for partial updates
CREATE OR REPLACE FUNCTION increment_ad_analytics(
  p_ad_id uuid,
  p_whatsapp integer DEFAULT 0,
  p_call integer DEFAULT 0,
  p_share integer DEFAULT 0,
  p_watch_time integer DEFAULT 0
) RETURNS void AS $$
BEGIN
  UPDATE public.ads
  SET 
    whatsapp_clicks = whatsapp_clicks + p_whatsapp,
    call_clicks = call_clicks + p_call,
    share_count = share_count + p_share,
    total_watch_time = total_watch_time + p_watch_time,
    last_interaction_at = NOW()
  WHERE id = p_ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC for products
CREATE OR REPLACE FUNCTION increment_product_analytics(
  p_product_id uuid,
  p_whatsapp integer DEFAULT 0,
  p_call integer DEFAULT 0,
  p_share integer DEFAULT 0,
  p_watch_time integer DEFAULT 0
) RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET 
    whatsapp_clicks = whatsapp_clicks + p_whatsapp,
    call_clicks = call_clicks + p_call,
    share_count = share_count + p_share,
    total_watch_time = total_watch_time + p_watch_time,
    last_interaction_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
