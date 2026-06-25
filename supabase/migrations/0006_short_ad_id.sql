-- ============================================================
-- Migration 0006: Short Ad ID 
-- ============================================================

-- 1. إنشاء دالة لتوليد كود عشوائي قصير (مزيج من الأرقام والحروف، طوله 5)
CREATE OR REPLACE FUNCTION public.generate_short_id()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. إضافة عمود `short_id` إلى جدول الإعلانات والمنتجات
ALTER TABLE ads ADD COLUMN IF NOT EXISTS short_id text UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- 3. دالة التشغيل التلقائي (Trigger Function) لإضافة الرمز قبل الحفظ
CREATE OR REPLACE FUNCTION public.set_short_id()
RETURNS trigger AS $$
BEGIN
  -- التحقق لضمان عدم وجود تكرار 
  -- (نادراً ما يحدث تكرار مع طول 5، لكن هذه ممارسة جيدة)
  WHILE NEW.short_id IS NULL OR EXISTS (SELECT 1 FROM ads WHERE short_id = NEW.short_id) OR EXISTS (SELECT 1 FROM products WHERE short_id = NEW.short_id) LOOP
    NEW.short_id := public.generate_short_id();
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. ربط الدالة بجدول الإعلانات
DROP TRIGGER IF EXISTS set_ads_short_id ON ads;
CREATE TRIGGER set_ads_short_id
  BEFORE INSERT ON ads
  FOR EACH ROW EXECUTE PROCEDURE public.set_short_id();

-- ربط الدالة بجدول المنتجات
DROP TRIGGER IF EXISTS set_products_short_id ON products;
CREATE TRIGGER set_products_short_id
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE PROCEDURE public.set_short_id();

-- 5. تحديث الإعلانات والمنتجات القديمة لإعطائها رموزاً قصيرة (إذا وجدت)
UPDATE ads SET short_id = public.generate_short_id() WHERE short_id IS NULL;
UPDATE products SET short_id = public.generate_short_id() WHERE short_id IS NULL;
