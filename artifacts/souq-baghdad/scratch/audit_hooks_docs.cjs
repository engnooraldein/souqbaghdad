const fs = require('fs');

const hookDocs = [
  {
    file: 'src/hooks/useOnlineStatuses.ts',
    insertBefore: 'import { useState, useEffect }',
    header: `// ===========================================
// مسؤولية هذا الـ Hook:
// يجلب حالة الاتصال (Online/Offline) لجميع المستخدمين.
//
// آلية العمل:
// يستخدم نمط Singleton — استعلام Supabase واحد يُشارَك بين كل المكوّنات.
// Cache مدتها 3 دقائق عبر LocalStorage لتقليل استهلاك الباقة.
//
// 🔥 استهلاك Supabase:
// استعلام واحد فقط كل 3 دقائق بغض النظر عن عدد المكوّنات التي تستخدم الـ Hook.
// هذا التصميم ممتاز ويمنع استهلاك الباقة.
//
// ✅ آمن للتعديل:
// نعم. يمكن تعديل فترة الـ Cache من 180000ms (3 دقائق).
// ===========================================
`
  },
  {
    file: 'src/hooks/useAds.ts',
    insertBefore: 'import { useState, useCallback, useRef }',
    header: `// ===========================================
// مسؤولية هذا الـ Hook:
// يجلب الإعلانات العادية وإعلانات النقل من Supabase مع دعم Pagination.
//
// الدوال المُصدَّرة:
// - fetchAds(filters, reset): يجلب الإعلانات بناءً على فلاتر البحث.
// - fetchTransportAds(reset): يجلب إعلانات النقل.
//
// 🔥 استهلاك Supabase:
// يُنفَّذ استعلام عند كل تغيير في الفلاتر (مع Debounce في App.tsx).
// يدعم Infinite Scroll — يجلب صفحات إضافية عند الطلب فقط.
//
// ✅ آمن للتعديل:
// نعم. يمكن تغيير pageSize لتقليل أو زيادة حجم كل صفحة.
//
// انتبه:
// adsPage و transportPage تُستخدمان كـ Dependencies في useCallback.
// تغيير هيكل الـ State قد يسبب جلباً غير صحيح للصفحات.
// ===========================================
`
  },
  {
    file: 'src/hooks/useSound.ts',
    insertBefore: 'import { useRef, useEffect, useState }',
    header: `// ===========================================
// مسؤولية هذا الـ Hook:
// يُشغّل أصوات النظام (نجاح، خطأ، نقر، معلومات) باستخدام Web Audio API.
//
// لا يتصل بـ Supabase. مكوّن Utility بحت.
//
// الأصوات المتاحة:
// - 'success': صوت ارتفاع (نشر إعلان، تسجيل دخول)
// - 'error': صوت انخفاض (خطأ)
// - 'click': صوت نقر
// - 'info': صوت معلومات (إشعار)
//
// ✅ آمن للتعديل:
// نعم. يمكن تغيير التردد في مصفوفة 'f'.
// ===========================================
`
  },
];

let count = 0;
for (const doc of hookDocs) {
  let content = fs.readFileSync(doc.file, 'utf-8').replace(/\r\n/g, '\n');
  
  if (content.includes('// ===========================================')) {
    console.log(`⏭️  Already documented: ${doc.file}`);
    continue;
  }
  
  if (content.includes(doc.insertBefore)) {
    content = content.replace(doc.insertBefore, doc.header + doc.insertBefore);
    fs.writeFileSync(doc.file, content.replace(/\n/g, '\r\n'), 'utf-8');
    console.log(`✅ Documented: ${doc.file}`);
    count++;
  } else {
    console.warn(`⚠️  Could not find insert point in: ${doc.file}`);
  }
}

// Document helpers.ts
let helpers = fs.readFileSync('src/utils/helpers.ts', 'utf-8').replace(/\r\n/g, '\n');
if (!helpers.includes('// ===========================================')) {
  const helperHeader = `// ===========================================
// مسؤولية هذا الملف:
// مجموعة دوال مساعدة (Utility Functions) مشتركة عبر التطبيق.
//
// الدوال المُصدَّرة:
// - getGlowClass(role): تُرجع class تأثير توهج حسب صلاحية المستخدم.
// - getWhatsAppResetLink(phone): يولّد رابط WhatsApp لإعادة كلمة السر.
// - isNewItem(iso): يتحقق إذا كان الإعلان منشوراً خلال الـ 48 ساعة الأخيرة.
// - getWhatsAppLink(phone, type, details): يولّد رابط تواصل للبائع.
// - detectDevice(): يكتشف نوع الجهاز (موبايل، تابلت، ديسكتوب).
// - slugify(text): يحوّل النص إلى URL-safe string.
//
// لا يتصل بـ Supabase. ملف Utility بحت.
//
// ✅ آمن للتعديل:
// نعم.
// ===========================================
`;
  helpers = helperHeader + helpers;
  fs.writeFileSync('src/utils/helpers.ts', helpers.replace(/\n/g, '\r\n'), 'utf-8');
  console.log('✅ Documented: src/utils/helpers.ts');
  count++;
}

console.log(`\nDone! ${count} files documented.`);
