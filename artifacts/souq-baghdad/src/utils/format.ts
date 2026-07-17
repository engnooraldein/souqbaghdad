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
  if (!p) return '0';
  let pStr = typeof p === 'string' ? p : String(p);
  
  // Convert Arabic/Persian numbers to English numbers
  const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  for (let i = 0; i < 10; i++) {
    pStr = pStr.replace(arabicNumbers[i], i.toString()).replace(persianNumbers[i], i.toString());
  }

  // Remove everything except digits and minus sign
  const n = parseInt(pStr.replace(/[^\d-]/g, ''));
  
  return isNaN(n) ? String(p) : n.toLocaleString('en-US');
};
