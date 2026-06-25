-- ============================================================
-- Migration 0016: Fix Admin Reset Password Function
-- ============================================================

-- Redefine function to use extensions.crypt and extensions.gen_salt
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Check if the caller is an owner
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Access denied. Only owners can reset passwords.';
  END IF;

  -- 2. Update the password in auth.users directly
  -- using pgcrypto's crypt() function with bcrypt salt from the extensions schema
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf'))
  WHERE id = target_user_id;

  -- 3. Delete any recovery requests for this user if they exist
  DELETE FROM public.recovery_requests WHERE user_id = target_user_id;

END;
$$;
