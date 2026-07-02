-- تنظيف قاعدة البيانات من البيانات الوهمية (Demo)

-- 1. حذف المنتجات الوهمية
DELETE FROM public.products WHERE is_demo = true;

-- 2. حذف الإعلانات الوهمية
DELETE FROM public.ads WHERE is_demo = true;

-- 3. حذف الحسابات الوهمية (تأكد من تحديدها بشكل صحيح، مثلاً عبر رقم هاتف يحتوي على كلمة demo)
-- DELETE FROM public.profiles WHERE phone ILIKE '%demo%';

-- تنبيه: لا تقم بتشغيل هذا الكود إلا بعد أخذ نسخة احتياطية (Backup) لقاعدة البيانات.
