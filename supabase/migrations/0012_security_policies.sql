-- ============================================================
-- Migration 0012: Security Policies & RLS Hardening
-- ============================================================

-- 1. Helper function to check if current user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Secure profiles table
-- ============================================================
DROP POLICY IF EXISTS "Allow own update on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public update on profiles" ON profiles;
-- Allow user to update their own profile, or owner to update any profile
CREATE POLICY "Allow update on profiles"
  ON profiles FOR UPDATE USING (auth.uid() = id OR public.is_owner());

-- Trigger to prevent users from escalating their own privileges
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger AS $$
BEGIN
  -- If not an owner, revert role and is_banned changes
  IF NOT public.is_owner() THEN
    NEW.role = OLD.role;
    NEW.is_banned = OLD.is_banned;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON profiles;
CREATE TRIGGER tr_protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_fields();

-- ============================================================
-- 3. Secure ads table
-- ============================================================
DROP POLICY IF EXISTS "Allow public insert access on ads" ON ads;
DROP POLICY IF EXISTS "Allow public update access on ads" ON ads;
DROP POLICY IF EXISTS "Allow public delete access on ads" ON ads;

CREATE POLICY "Allow authenticated insert on ads"
  ON ads FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Allow update on ads"
  ON ads FOR UPDATE USING (auth.uid() = seller_id OR public.is_owner());

CREATE POLICY "Allow delete on ads"
  ON ads FOR DELETE USING (auth.uid() = seller_id OR public.is_owner());

-- ============================================================
-- 4. Secure products table
-- ============================================================
DROP POLICY IF EXISTS "Allow public insert on products" ON products;
DROP POLICY IF EXISTS "Allow public update on products" ON products;
DROP POLICY IF EXISTS "Allow public delete on products" ON products;

CREATE POLICY "Allow authenticated insert on products"
  ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Allow update on products"
  ON products FOR UPDATE USING (auth.uid() = seller_id OR public.is_owner());

CREATE POLICY "Allow delete on products"
  ON products FOR DELETE USING (auth.uid() = seller_id OR public.is_owner());

-- ============================================================
-- 5. Secure storage (If buckets exist, restrict to authenticated users)
-- Note: Requires pg_catalog and storage schema access
-- ============================================================
-- We'll create policies for 'ads', 'avatars' buckets if they exist.
-- To do this cleanly, we'll insert into storage.buckets if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ads', 'ads', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT USING (bucket_id IN ('ads', 'avatars'));

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');
