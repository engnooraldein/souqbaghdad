const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Normalize to \n for matching, then we'll write back as-is
const normalized = content.replace(/\r\n/g, '\n');

const patches = [
  // useEffect: fetch system_settings
  {
    search: `  useEffect(() => {\n    supabase.from('system_settings').select('*').then(({ data, error }) => {`,
    replace: `  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.\n  // يجلب إعدادات النظام (تكلفة الإعلانات) من Supabase.\n  // استعلام Supabase — عدد مرات التنفيذ المتوقع: مرة واحدة فقط.\n  // إذا تكرر فهناك مشكلة في تغيير State خارج هذا الـ Effect.\n  useEffect(() => {\n    supabase.from('system_settings').select('*').then(({ data, error }) => {`,
  },
  // useEffect: resolve seller phone to id
  {
    search: `  useEffect(() => {\n    if (view === 'profile' && selectedSellerPhone) {`,
    replace: `  // هذا useEffect يعمل عندما يتغير view أو selectedSellerPhone.\n  // يحول رقم الهاتف إلى معرّف UUID للبائع من Supabase.\n  // استعلام Supabase — يعمل فقط عند عرض ملف البائع.\n  useEffect(() => {\n    if (view === 'profile' && selectedSellerPhone) {`,
  },
  // useEffect: deep link URL parser
  {
    search: `  useEffect(() => {\n    const handleUrlRefresh = async () => {`,
    replace: `  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.\n  // يحلل عنوان URL لفتح الإعلان أو المنتج أو النقل مباشرة (Deep Linking).\n  // استعلام Supabase — يُنفَّذ فقط إذا كان الرابط يحتوي على معرّف.\n  // انتبه: قد يسبب جلبين (fetch هنا + fetch في useEffect آخر). تأكد من عدم التكرار.\n  useEffect(() => {\n    const handleUrlRefresh = async () => {`,
  },
  // useEffect: load all profiles globally
  {
    search: `  useEffect(() => {\n    let isMounted = true;\n    async function loadAllProfilesGlobal() {`,
    replace: `  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.\n  // يجلب بيانات جميع البائعين من Supabase (حتى 200 ملف).\n  // استعلام Supabase — عدد مرات التنفيذ المتوقع: مرة واحدة فقط.\n  // اقتراح تحسين: يمكن تطبيق Caching لتقليل استهلاك الباقة.\n  // ✅ آمن: يستخدم isMounted لمنع Memory Leak بعد إلغاء التحميل.\n  useEffect(() => {\n    let isMounted = true;\n    async function loadAllProfilesGlobal() {`,
  },
  // useEffect: open-share-modal event listener
  {
    search: `  useEffect(() => {\n    const handleOpenShare = (e: any) => {`,
    replace: `  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.\n  // يستمع لحدث (open-share-modal) لفتح نافذة المشاركة من أي مكوّن.\n  // ✅ آمن: يتم تنظيف الـ Event Listener في الـ cleanup function.\n  useEffect(() => {\n    const handleOpenShare = (e: any) => {`,
  },
  // useEffect: Supabase Auth session + listener
  {
    search: `  useEffect(() => {\n    supabase.auth.getSession().then(({ data: { session } }) => {`,
    replace: `  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.\n  // يستعيد جلسة المستخدم الحالية ويراقب تغييرات حالة المصادقة.\n  // ✅ آمن: يتم إلغاء اشتراك Auth listener في الـ cleanup.\n  // استعلام Supabase — مرة واحدة فقط + listener دائم.\n  // انتبه: لا تضف State هنا حتى لا يتحول إلى Infinite Loop.\n  useEffect(() => {\n    supabase.auth.getSession().then(({ data: { session } }) => {`,
  },
  // useEffect: PWA & Redirection normalization
  {
    search: `  // PWA & Redirection normalization\n  useEffect(() => {\n    if (typeof window === 'undefined') return () => {};`,
    replace: `  // PWA & Redirection normalization\n  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.\n  // يتعامل مع أحداث تثبيت التطبيق كـ PWA وتنظيم مسارات URL.\n  // ✅ آمن: يتم تنظيف جميع Event Listeners في الـ cleanup.\n  useEffect(() => {\n    if (typeof window === 'undefined') return () => {};`,
  },
  // useEffect: initial route parsing + deep link retry
  {
    search: `  // Initial route parsing — runs once on mount, then retries pending deep links when data arrives\n  useEffect(() => {`,
    replace: `  // هذا useEffect يعمل عند أول تحميل وعند تغيير allAds أو allProducts.\n  // يحلل مسار URL عند التحميل الأول، ثم يعيد المحاولة إذا لم تصل البيانات بعد.\n  // انتبه: يعتمد على allAds وallProducts كـ Dependencies، أي يُعاد تنفيذه عند كل تحديث للإعلانات.\n  // Initial route parsing — runs once on mount, then retries pending deep links when data arrives\n  useEffect(() => {`,
  },
  // useEffect: popstate handler
  {
    search: `  useEffect(() => {\n    const handlePopState = () => syncStateFromPath();\n    window.addEventListener('popstate', handlePopState);\n    return () => window.removeEventListener('popstate', handlePopState);\n  }, [allAds, allProducts]);`,
    replace: `  // هذا useEffect يستمع لحدث "popstate" (زر الرجوع في المتصفح).\n  // ✅ آمن: يتم تنظيف Event Listener في الـ cleanup.\n  useEffect(() => {\n    const handlePopState = () => syncStateFromPath();\n    window.addEventListener('popstate', handlePopState);\n    return () => window.removeEventListener('popstate', handlePopState);\n  }, [allAds, allProducts]);`,
  },
  // useEffect: URL push state sync
  {
    search: `  useEffect(() => {\n    if (!initialHashParsed || loadingRoute || pendingDeepLinkRef.current) return; // Don't push state before initial parse, while routing/fetching, or while deep link is pending`,
    replace: `  // هذا useEffect يعمل عند تغيير أي حالة تتعلق بالتنقل.\n  // يقوم بتحديث عنوان URL في المتصفح ليعكس الصفحة الحالية (History Management).\n  // انتبه: لا تضف States جديدة في dependencies بدون تفكير.\n  useEffect(() => {\n    if (!initialHashParsed || loadingRoute || pendingDeepLinkRef.current) return; // Don't push state before initial parse, while routing/fetching, or while deep link is pending`,
  },
  // useEffect: notification polling
  {
    search: `  useEffect(() => {\n    if (!user) {\n      setNotifications([]);\n      return;\n    }\n\n    fetchNotifications();\n\n    // Use polling instead of Realtime to avoid hitting Supabase free tier connection limits`,
    replace: `  // هذا useEffect يعمل عند تسجيل الدخول أو الخروج.\n  // يجلب الإشعارات ويفعّل Polling كل 45 ثانية بدلاً من Realtime (لتوفير الباقة).\n  // ✅ آمن: يتم إيقاف الـ Interval في الـ cleanup.\n  // 🔥 استهلاك Supabase: استعلام كل 45 ثانية ما دام المستخدم مسجلاً.\n  useEffect(() => {\n    if (!user) {\n      setNotifications([]);\n      return;\n    }\n\n    fetchNotifications();\n\n    // Use polling instead of Realtime to avoid hitting Supabase free tier connection limits`,
  },
  // useEffect: notification sound
  {
    search: `  useEffect(() => {\n    if (notifications.length > prevNotifsLength.current) {\n      if (prevNotifsLength.current > 0) {`,
    replace: `  // هذا useEffect يعمل عند تغيير قائمة الإشعارات.\n  // يُشغّل صوت تنبيه عند وصول إشعار جديد.\n  // آمن للتعديل: نعم، يمكن تغيير الصوت أو تعطيله.\n  useEffect(() => {\n    if (notifications.length > prevNotifsLength.current) {\n      if (prevNotifsLength.current > 0) {`,
  },
  // useEffect: save favorites to localStorage
  {
    search: `  useEffect(()=>{localStorage.setItem('souqFavs',JSON.stringify(favorites));},[favorites]);`,
    replace: `  // هذا useEffect يعمل عند كل تغيير في قائمة المفضلة.\n  // يحفظ المفضلة في LocalStorage. لا يستهلك Supabase.\n  useEffect(()=>{localStorage.setItem('souqFavs',JSON.stringify(favorites));},[favorites]);`,
  },
  // useEffect: fetch transport when view changes
  {
    search: `  useEffect(() => {\n    if (view === 'transport' || view === 'profile') {\n      fetchTransportAds();\n    }\n  }, [view, fetchTransportAds]);`,
    replace: `  // هذا useEffect يعمل عند الانتقال لصفحة النقل أو الملف الشخصي.\n  // استعلام Supabase — يُنفَّذ فقط عند تغيير view.\n  useEffect(() => {\n    if (view === 'transport' || view === 'profile') {\n      fetchTransportAds();\n    }\n  }, [view, fetchTransportAds]);`,
  },
  // useEffect: sync bottom nav
  {
    search: `  useEffect(() => {\n    if (['home', 'profile', 'transport'].includes(view)) {\n      setBottomNavActive(view);\n    }\n  }, [view]);`,
    replace: `  // هذا useEffect يعمل عند تغيير view.\n  // يحدث الشريط السفلي للتنقل. لا يستهلك Supabase. آمن للتعديل.\n  useEffect(() => {\n    if (['home', 'profile', 'transport'].includes(view)) {\n      setBottomNavActive(view);\n    }\n  }, [view]);`,
  },
  // useEffect: debounced search/filter
  {
    search: `  useEffect(() => {\n    const delayDebounceFn = setTimeout(() => {\n      if (view === 'home' || view === 'products' || view === 'transport' || view === 'profile') {\n        fetchAds(true);\n        fetchProducts(true);\n      }\n    }, 450);\n\n    return () => clearTimeout(delayDebounceFn);\n  }, [search, cat, gov, sort, priceMin, priceMax, view]);`,
    replace: `  // هذا useEffect يعمل عند تغيير أي فلتر بحث.\n  // يطبّق Debounce بمقدار 450ms لمنع إرسال طلبات Supabase عند كل حرف.\n  // ✅ آمن: يتم إلغاء الـ Timeout في الـ cleanup.\n  // 🔥 استعلام Supabase — يُجلب كل مرة تتغير فيها الفلاتر.\n  useEffect(() => {\n    const delayDebounceFn = setTimeout(() => {\n      if (view === 'home' || view === 'products' || view === 'transport' || view === 'profile') {\n        fetchAds(true);\n        fetchProducts(true);\n      }\n    }, 450);\n\n    return () => clearTimeout(delayDebounceFn);\n  }, [search, cat, gov, sort, priceMin, priceMax, view]);`,
  },
  // useEffect: save user on change
  {
    search: `  useEffect(()=>{\n    if(user){const mc=allAds.filter(a=>a.postedBy===user.id).length+allProducts.filter(p=>p.postedBy===user.id).length;saveStoredUser(user,mc);}\n  },[user]);`,
    replace: `  // هذا useEffect يعمل عند تغيير بيانات المستخدم.\n  // يحفظ بيانات المستخدم مع عدد إعلاناته في LocalStorage. لا يستهلك Supabase.\n  useEffect(()=>{\n    if(user){const mc=allAds.filter(a=>a.postedBy===user.id).length+allProducts.filter(p=>p.postedBy===user.id).length;saveStoredUser(user,mc);}\n  },[user]);`,
  },
  // useEffect: track online/ban status
  {
    search: `  // Track online status and guests\n  useEffect(() => {`,
    replace: `  // هذا useEffect يعمل مرة واحدة عند تغيير user.\n  // يتحقق من حالة الحظر (Ban) للمستخدم أو الجهاز، ويحدث last_seen.\n  // 🔥 استعلام Supabase — مرة واحدة عند تغيير user.\n  // ملاحظة: الـ Interval كان يعمل كل دقيقتين لكن تم تعطيله لتوفير الباقة.\n  // Track online status and guests\n  useEffect(() => {`,
  },
];

let patchCount = 0;
for (const patch of patches) {
  if (normalized.includes(patch.search)) {
    // Apply on normalized then we're done
    patchCount++;
  } else {
    console.warn(`⚠️ NOT FOUND: ${patch.search.substring(0, 60).replace(/\n/g, '\\n')}`);
  }
}

// Apply all patches on normalized content
let result = normalized;
for (const patch of patches) {
  result = result.replace(patch.search, patch.replace);
}

// Write back preserving \r\n
fs.writeFileSync('src/App.tsx', result.replace(/\n/g, '\r\n'), 'utf-8');
console.log(`✅ Done. ${patchCount}/${patches.length} patches confirmed and applied.`);
