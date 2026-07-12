// ===========================================
// مسؤولية هذا الملف:
// دوال تنسيق البيانات (Format Utilities).
// مثل: formatPrice لتنسيق الأسعار بالدينار العراقي.
//
// لا يتصل بـ Supabase. دوال Utility بحتة.
//
// آمن للتعديل:
// نعم.
// ===========================================
export const formatPrice = (p: string | number) => {
  const n = typeof p === 'string' ? parseInt(p.replace(/,/g,'')) : p;
  return isNaN(n) ? String(p) : n.toLocaleString('en-US');
};
