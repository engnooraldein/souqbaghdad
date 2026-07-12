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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Disable realtime to prevent WebSocket connection errors (not used in this app)
  realtime: {
    params: {
      eventsPerSecond: -1,
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
