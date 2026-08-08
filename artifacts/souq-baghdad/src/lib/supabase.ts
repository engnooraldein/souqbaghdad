// ===========================================
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
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://dummy.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'dummy';

// ─── Cross-Platform Storage Adapter ───────────────────────────────────────────
// يعمل على: متصفح عادي / PWA / تطبيق Capacitor (Android & iOS)
// window.localStorage مباشرةً قد يرمي خطأ في بيئات معينة (SSR, Capacitor)
// هذا الـ adapter يحل المشكلة بشكل آمن
const crossPlatformStorage = {
  getItem: (key: string): string | null => {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    try { window.localStorage.setItem(key, value); } catch {}
  },
  removeItem: (key: string): void => {
    try { window.localStorage.removeItem(key); } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ────────────────────────────────────────────────────────────────────────
    // إعدادات حفظ الجلسة — تمنع تسجيل الخروج عند كل تحديث
    // تعمل على: متصفح عادي / PWA / تطبيق Capacitor
    // ────────────────────────────────────────────────────────────────────────
    persistSession: true,               // احفظ الجلسة دائماً
    autoRefreshToken: true,             // جدد التوكن تلقائياً قبل انتهائه
    detectSessionInUrl: true,           // مهم لـ OAuth (Google, etc.)
    storageKey: 'sb-souqbaghdad-auth',  // مفتاح ثابت لا يتغير عند التحديث
    storage: crossPlatformStorage,      // يعمل على كل المنصات بأمان
    flowType: 'pkce',                   // أمان أعلى للـ OAuth
    experimental: {
      passkey: true
    }
  },
  realtime: {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    params: {
      apikey: supabaseAnonKey,
    },
  },
  global: {
    headers: {
      'x-client-info': 'souq-baghdad',
    },
  },
  db: {
    schema: 'public',
  },
});

// ─── Types for database rows ───────────────────────────────────────
export type DbAd = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: string;
  category: string;
  location: string | null;
  city: string | null;
  images: string[] | null;
  created_at: string;
  views: number;
  likes: number;
  status: string;
  type: string | null;
  condition?: string | null;
  // from migration 0002
  seller_name: string | null;
  seller_avatar: string | null;
  seller_rating: number | null;
  is_demo: boolean;
  is_featured: boolean;
};

export type DbProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  ads_count: number;
  favorites_count: number;
  views_count: number;
  points?: number;
};
