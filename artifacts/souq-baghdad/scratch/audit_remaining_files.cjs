const fs = require('fs');
const path = require('path');

const fileDocs = {
  // src/lib
  'src/lib/supabase.ts': `// ===========================================
// مسؤولية هذا الملف:
// يُهيّئ ويُصدِّر عميل Supabase الموحّد للتطبيق.
//
// كل الاستعلامات في التطبيق تمر عبر هذا العميل.
//
// انتبه:
// لا تُعدِّل هذا الملف إلا لتغيير URL أو ANON KEY.
// المفاتيح موجودة في ملف .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
//
// آمن للتعديل:
// نعم، لكن بحذر شديد.
// ===========================================
`,
  'src/lib/auth.ts': `// ===========================================
// مسؤولية هذا الملف:
// دوال مساعدة لعمليات المصادقة (Authentication Helpers).
//
// يتعامل مع Supabase Auth مباشرة.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  // src/utils
  'src/utils/format.ts': `// ===========================================
// مسؤولية هذا الملف:
// دوال تنسيق البيانات (Format Utilities).
// مثل: formatPrice لتنسيق الأسعار بالدينار العراقي.
//
// لا يتصل بـ Supabase. دوال Utility بحتة.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/utils/logs.ts': `// ===========================================
// مسؤولية هذا الملف:
// دوال تسجيل إجراءات النظام (System Logs Utilities).
// تُسجّل الأحداث المهمة في جدول Supabase (system_logs).
//
// استعلام Supabase:
// INSERT في جدول system_logs عند كل استدعاء.
//
// انتبه:
// لا تستدعِ هذه الدالة بشكل متكرر حتى لا تملأ الجدول.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/utils/time.ts': `// ===========================================
// مسؤولية هذا الملف:
// دوال حساب الوقت النسبي (Relative Time Utilities).
// مثل: "منذ 5 دقائق"، "منذ يوم".
//
// لا يتصل بـ Supabase. دوال Utility بحتة.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/utils/slugUtils.ts': `// ===========================================
// مسؤولية هذا الملف:
// دوال تحويل النص إلى URL-safe Slug.
//
// ⚠️ ملاحظة مهمة:
// تحقق إذا كانت هذه الدالة مكررة مع slugify في src/utils/helpers.ts.
// إذا كانت مكررة، يُنصح بدمجهما في ملف واحد.
//
// لا يتصل بـ Supabase.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/utils/utils.ts': `// ===========================================
// مسؤولية هذا الملف:
// دوال مساعدة عامة (General Utilities).
//
// لا يتصل بـ Supabase.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/utils/mockData.ts': `// ===========================================
// مسؤولية هذا الملف:
// بيانات تجريبية وهمية (Mock Data) للاختبار.
//
// لا يتصل بـ Supabase.
//
// انتبه:
// تأكد أن هذه البيانات لا تُستخدم في بيئة الإنتاج (Production).
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/lib/errorLogger.ts': `// ===========================================
// مسؤولية هذا الملف:
// يُسجّل الأخطاء الحرجة (Critical Errors) في Supabase.
//
// استعلام Supabase:
// INSERT في جدول error_logs.
//
// يُستخدم في main.tsx لالتقاط Unhandled Promise Rejections.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  // src/hooks
  'src/hooks/use-mobile.tsx': `// ===========================================
// مسؤولية هذا الملف:
// Hook يكتشف إذا كان الجهاز موبايل (use-mobile).
//
// لا يتصل بـ Supabase.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/hooks/use-toast.ts': `// ===========================================
// مسؤولية هذا الملف:
// Hook لإدارة رسائل التنبيه (Toast Notifications) من shadcn/ui.
//
// لا يتصل بـ Supabase.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
  'src/hooks/useNotifications.ts': `// ===========================================
// مسؤولية هذا الملف:
// Hook لجلب إشعارات المستخدم من Supabase.
//
// استعلام Supabase:
// يجلب من جداول 'ads' و 'user_notifications'.
//
// 🔥 استهلاك Supabase:
// تحقق من مدة Polling إذا كان هذا الـ Hook مفعّلاً.
// يُفضَّل Polling كل 45+ ثانية.
//
// آمن للتعديل:
// نعم.
// ===========================================
`,
};

// SVG asset files (minimal docs)
const svgAssetHeader = (name) => `// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (${name}).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
`;

let count = 0;

// Document named files
for (const [filePath, header] of Object.entries(fileDocs)) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Not found: ${filePath}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  if (content.includes('// ===========================================')) {
    continue;
  }
  content = header + content;
  fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf-8');
  console.log(`✅ ${filePath}`);
  count++;
}

// Document SVG assets
const assetDirs = ['src/assets'];
const assetExts = ['.tsx', '.ts'];
function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (assetExts.some(ext => entry.name.endsWith(ext))) {
      let content = fs.readFileSync(fullPath, 'utf-8').replace(/\r\n/g, '\n');
      if (content.includes('// ===========================================')) continue;
      const name = entry.name.replace(/\.(tsx|ts)$/, '');
      content = svgAssetHeader(name) + content;
      fs.writeFileSync(fullPath, content.replace(/\n/g, '\r\n'), 'utf-8');
      console.log(`✅ ${fullPath}`);
      count++;
    }
  }
}
assetDirs.forEach(walkDir);

// Document contexts
const ctxDocs = {
  'src/contexts/AuthContext.tsx': `// ===========================================
// مسؤولية هذا الملف:
// Context لإدارة حالة المصادقة (Auth Context) عبر التطبيق.
//
// يُتيح الوصول لبيانات المستخدم من أي مكوّن دون تمرير Props.
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم كسر المكوّنات التي تستخدمه.
// ===========================================
`,
  'src/contexts/ThemeContext.tsx': `// ===========================================
// مسؤولية هذا الملف:
// Context لإدارة الثيم (Light/Dark Mode).
//
// لا يتصل بـ Supabase.
//
// آمن للتعديل:
// نعم.
// ===========================================
`
};
for (const [filePath, header] of Object.entries(ctxDocs)) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  if (content.includes('// ===========================================')) continue;
  content = header + content;
  fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf-8');
  console.log(`✅ ${filePath}`);
  count++;
}

console.log(`\n✅ Done! ${count} files documented.`);
