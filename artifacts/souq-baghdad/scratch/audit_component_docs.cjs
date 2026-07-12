const fs = require('fs');

const docs = [
  {
    file: 'src/components/TransportView.tsx',
    searchLine: 'import InfiniteScrollTrigger from',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض صفحة الخطوط والنقل (Transport View).
//
// لا يقوم بجلب البيانات مباشرة.
// البيانات تأتيه عبر Props من App.tsx (allTransportAds, fetchTransportAds).
//
// الميزات المدمجة:
// - عرض إعلانات النقل (TransportAdCard)
// - فلتر نوع الجمهور (طلاب / موظفون / مختلط)
// - نافذة نشر خط جديد (TransportFormModal)
// - نافذة تفاصيل الخط (TransportDetailModal)
// - تتبع الاهتمام بالخط (InterestTimer)
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم تغيير Props المستقبَلة من App.tsx.
// ===========================================
`
  },
  {
    file: 'src/components/ProfileView.tsx',
    searchLine: 'import { DEFAULT_AVATAR } from',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض صفحة الملف الشخصي للمستخدم الحالي (Profile View).
//
// يجلب البيانات من Supabase مباشرة:
// - إعلانات المستخدم.
// - منتجات المستخدم.
// - إحصاءات الملف.
//
// استعلام Supabase:
// يُنفَّذ عند تحميل المكوّن وعند التغيير في user.
// إذا رأيت جلباً متكرراً، تحقق من useEffect هنا.
//
// الميزات المدمجة:
// - تعديل الملف الشخصي (EditProfileModal)
// - عرض إعلاناتي / منتجاتي / خطوطي (MyLinesTab)
// - معلومات التقييم والإحصاءات
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم إضافة useEffect بدون dependency صحيحة.
// ===========================================
`
  },
  {
    file: 'src/components/AdminPanel.tsx',
    searchLine: 'import React',
    header: `// ===========================================
// مسؤولية هذا الملف:
// لوحة تحكم المشرف (Admin Panel).
//
// يجلب البيانات من Supabase:
// - قائمة الإعلانات للمراجعة.
// - إجراءات الحذف والحظر.
//
// 🔒 وصول مقيّد:
// يجب أن يكون user.role === 'admin' أو 'owner' للوصول.
// تحقق من الـ guard في App.tsx قبل عرض هذا المكوّن.
//
// آمن للتعديل:
// نعم، لكن انتبه للصلاحيات وتأثير الحذف على البيانات.
// ===========================================
`
  },
  {
    file: 'src/components/AuthModal.tsx',
    searchLine: 'import React',
    header: `// ===========================================
// مسؤولية هذا الملف:
// نافذة تسجيل الدخول / إنشاء حساب (Auth Modal).
//
// يتعامل مع Supabase Auth مباشرة:
// - supabase.auth.signInWithPassword()
// - supabase.auth.signUp()
// - supabase.auth.signInWithOAuth()
//
// استعلام Supabase:
// يُنفَّذ فقط عند الضغط على زر تسجيل الدخول.
// لا توجد Background Queries.
//
// آمن للتعديل:
// نعم، لكن تأكد من اختبار جميع حالات الخطأ (Wrong Password, Email not found, etc.).
// ===========================================
`
  },
  {
    file: 'src/components/SellerPublicPage.tsx',
    searchLine: 'import { DEFAULT_AVATAR }',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض الصفحة العامة للبائع (Seller Public Profile).
//
// يجلب البيانات من Supabase:
// - ملف البائع (profiles).
// - إعلانات البائع.
// - منتجات البائع.
//
// استعلام Supabase:
// يُنفَّذ عند تحميل المكوّن أو تغيير sellerId.
// إذا رأيت جلباً متكرراً، تحقق من useEffect.
//
// ملاحظة مهمة:
// هذه الصفحة تدعم مشاركة رابط البائع (Deep Link).
// تأكد من اختبار الـ URL عند الوصول المباشر.
//
// آمن للتعديل:
// نعم.
// ===========================================
`
  },
  {
    file: 'src/components/NotifPanel.tsx',
    searchLine: 'import React',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض لوحة الإشعارات (Notifications Panel).
//
// لا يجلب البيانات مباشرة.
// الإشعارات تأتيه عبر Props من App.tsx (notifications).
// الجلب يتم في App.tsx عبر fetchNotifications() (Polling كل 45 ثانية).
//
// آمن للتعديل:
// نعم، يمكن تحسين التصميم دون التأثير على منطق الجلب.
// ===========================================
`
  },
  {
    file: 'src/components/Toast.tsx',
    searchLine: 'import React',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض رسالة تنبيه مؤقتة (Toast Notification).
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
// يختفي تلقائياً بعد 4 ثوانٍ (مُضبوط في App.tsx).
//
// آمن للتعديل:
// نعم.
// ===========================================
`
  },
  {
    file: 'src/components/TimeAgo.tsx',
    searchLine: 'import',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يحسب ويعرض الوقت النسبي (منذ 5 دقائق، منذ يوم، إلخ).
//
// لا يتصل بـ Supabase. مكوّن Utility بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
`
  },
  {
    file: 'src/components/SkeletonCard.tsx',
    searchLine: 'import',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض بطاقة وهمية (Skeleton Loader) أثناء تحميل البيانات.
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
`
  },
  {
    file: 'src/components/Logo.tsx',
    searchLine: 'import',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض شعار التطبيق (Logo).
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
`
  },
  {
    file: 'src/components/HeroSection.tsx',
    searchLine: 'import',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يعرض القسم العلوي من الصفحة الرئيسية (Hero Section).
// يشمل: شريط البحث، فلاتر الأقسام، العنوان.
//
// لا يجلب البيانات من Supabase.
// الفلاتر تُرسل كـ Props إلى App.tsx وتُطبَّق هناك.
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم تغيير أسماء Props الخاصة بالبحث.
// ===========================================
`
  },
  {
    file: 'src/components/ErrorBoundary.tsx',
    searchLine: 'import',
    header: `// ===========================================
// مسؤولية هذا الملف:
// يلتقط أخطاء React (Error Boundary) ويعرض رسالة خطأ بدلاً من تحطم التطبيق.
//
// لا يتصل بـ Supabase مباشرة.
//
// انتبه:
// يجب أن يكون هذا المكوّن مغلّفاً لـ App بالكامل في main.tsx.
// أي خطأ غير محسوب سيُوقف التطبيق إذا لم يكن هنا.
//
// آمن للتعديل:
// نعم، لكن لا تحذفه.
// ===========================================
`
  },
];

let count = 0;
for (const doc of docs) {
  let content = fs.readFileSync(doc.file, 'utf-8');
  const normalized = content.replace(/\r\n/g, '\n');
  const lineIdx = normalized.split('\n').findIndex(l => l.startsWith(doc.searchLine));
  
  if (lineIdx === -1) {
    console.warn(`⚠️  Could not find "${doc.searchLine}" in ${doc.file}`);
    continue;
  }
  
  // Check if header already exists
  if (normalized.includes('// مسؤولية هذا الملف:') || normalized.includes('// ===========================================')) {
    console.log(`⏭️  Already documented: ${doc.file}`);
    continue;
  }
  
  const lines = normalized.split('\n');
  lines.splice(lineIdx, 0, doc.header);
  const result = lines.join('\n').replace(/\n/g, '\r\n');
  fs.writeFileSync(doc.file, result, 'utf-8');
  console.log(`✅ Documented: ${doc.file}`);
  count++;
}
console.log(`\nDone! ${count}/${docs.length} files documented.`);
