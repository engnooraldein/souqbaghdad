-- Assign 'owner' role to nooraldeinsbah@gmail.com

-- 1. Update existing profile if it exists
UPDATE profiles SET role = 'owner' WHERE email = 'nooraldeinsbah@gmail.com';

-- 2. Update the trigger to handle future registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role, city, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    CASE WHEN new.email = 'nooraldeinsbah@gmail.com' THEN 'owner' ELSE COALESCE(new.raw_user_meta_data->>'role', 'user') END,
    COALESCE(new.raw_user_meta_data->>'city', 'بغداد'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN new.email = 'nooraldeinsbah@gmail.com' THEN 'owner' ELSE EXCLUDED.role END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
