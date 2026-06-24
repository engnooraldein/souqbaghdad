-- ============================================================
-- Migration 0004: Supabase Auth Integration
-- قم بتشغيل هذا الكود في Supabase > SQL Editor
-- ============================================================

-- إضافة أعمدة مفقودة لجدول profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;

-- تفعيل RLS على profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Allow public read on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow own update on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow own insert on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON profiles;

-- سياسات جديدة لـ profiles
CREATE POLICY "Allow public read on profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Allow own insert on profiles"
  ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow own update on profiles"
  ON profiles FOR UPDATE USING (true);

-- دالة تنشئ profile تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role, city, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'city', 'بغداد'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء الـ trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
