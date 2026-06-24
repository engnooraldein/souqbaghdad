import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type FeatureFlagKey =
  | 'reviews'
  | 'follows'
  | 'reports'
  | 'verification'
  | 'featured_ads'
  | 'games'
  | 'chat'
  | 'notifications'
  | 'push_notifications'
  | 'share'
  | 'search_history'
  | 'compare'
  | 'nearby'
  | 'similar_ads'
  | 'video_upload'
  | 'map_location'
  | 'qr_code'
  | 'points_rewards'
  | 'orders'
  | 'coupons'
  | 'subscriptions'
  | 'otp_login'
  | 'google_login'
  | 'facebook_login'
  | 'pwa'
  | 'analytics'
  | 'ai_assist'
  | 'duplicate_detection'
  | 'audit_log'
  | 'backup_restore'
  | '2fa';

type FeatureFlagRecord = {
  key: FeatureFlagKey;
  enabled: boolean;
  label: string;
  description?: string | null;
};

type FeatureFlagsState = Record<FeatureFlagKey, boolean>;

const STORAGE_KEY = 'souq_feature_flags';

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsState = {
  reviews: true,
  follows: true,
  reports: true,
  verification: true,
  featured_ads: true,
  games: true,
  chat: true,
  notifications: true,
  push_notifications: false,
  share: true,
  search_history: true,
  compare: true,
  nearby: true,
  similar_ads: true,
  video_upload: true,
  map_location: true,
  qr_code: true,
  points_rewards: false,
  orders: true,
  coupons: true,
  subscriptions: false,
  otp_login: true,
  google_login: true,
  facebook_login: true,
  pwa: true,
  analytics: true,
  ai_assist: true,
  duplicate_detection: true,
  audit_log: true,
  backup_restore: true,
  '2fa': false,
};

const FEATURE_LABELS: Record<FeatureFlagKey, string> = {
  reviews: 'التقييمات',
  follows: 'المتابعة',
  reports: 'البلاغات',
  verification: 'توثيق الحساب',
  featured_ads: 'الإعلانات المميزة',
  games: 'الألعاب',
  chat: 'الدردشة الداخلية',
  notifications: 'إشعارات داخلية',
  push_notifications: 'Push Notifications',
  share: 'مشاركة الإعلانات',
  search_history: 'حفظ البحث',
  compare: 'مقارنة المنتجات',
  nearby: 'الإعلانات القريبة',
  similar_ads: 'إعلانات مشابهة',
  video_upload: 'رفع الفيديو',
  map_location: 'الموقع على الخريطة',
  qr_code: 'QR Code',
  points_rewards: 'النقاط والمكافآت',
  orders: 'السلة والطلبات',
  coupons: 'الكوبونات',
  subscriptions: 'اشتراكات البائعين',
  otp_login: 'OTP للهاتف',
  google_login: 'تسجيل Google',
  facebook_login: 'تسجيل Facebook',
  pwa: 'PWA',
  analytics: 'التحليلات',
  ai_assist: 'مساعد الذكاء',
  duplicate_detection: 'كشف التكرار',
  audit_log: 'سجل النشاط',
  backup_restore: 'النسخ الاحتياطي',
  '2fa': 'التحقق الثنائي',
};

interface FeatureFlagsContextValue {
  flags: FeatureFlagsState;
  isLoading: boolean;
  isEnabled: (key: FeatureFlagKey) => boolean;
  updateFlag: (key: FeatureFlagKey, enabled: boolean) => Promise<void>;
  resetFlags: () => Promise<void>;
  labels: Record<FeatureFlagKey, string>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

function readLocalFlags(): Partial<FeatureFlagsState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Partial<FeatureFlagsState>) : {};
  } catch {
    return {};
  }
}

function writeLocalFlags(flags: FeatureFlagsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // ignore local storage errors
  }
}

async function loadFlagsFromSupabase(): Promise<Partial<FeatureFlagsState> | null> {
  try {
    const { data, error } = await supabase.from('feature_flags').select('key, enabled');
    if (error || !data) return null;
    return data.reduce((acc: Partial<FeatureFlagsState>, row: FeatureFlagRecord) => {
      acc[row.key] = row.enabled;
      return acc;
    }, {});
  } catch {
    return null;
  }
}

async function saveFlagToSupabase(key: FeatureFlagKey, enabled: boolean) {
  try {
    await supabase.from('feature_flags').upsert({
      key,
      enabled,
      label: FEATURE_LABELS[key],
      updated_at: new Date().toISOString(),
    });
  } catch {
    // storage fallback only
  }
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlagsState>(() => ({
    ...DEFAULT_FEATURE_FLAGS,
    ...readLocalFlags(),
  }) as FeatureFlagsState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadFlagsFromSupabase().then((remoteFlags) => {
      if (!active || !remoteFlags) {
        setIsLoading(false);
        return;
      }

      setFlags((current) => {
        const next = { ...DEFAULT_FEATURE_FLAGS, ...current, ...remoteFlags } as FeatureFlagsState;
        writeLocalFlags(next);
        return next;
      });
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const updateFlag = async (key: FeatureFlagKey, enabled: boolean) => {
    setFlags((current) => {
      const next = { ...current, [key]: enabled } as FeatureFlagsState;
      writeLocalFlags(next);
      return next;
    });
    await saveFlagToSupabase(key, enabled);
  };

  const resetFlags = async () => {
    setFlags(DEFAULT_FEATURE_FLAGS);
    writeLocalFlags(DEFAULT_FEATURE_FLAGS);
    await Promise.all(
      (Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[]).map((key) =>
        saveFlagToSupabase(key, DEFAULT_FEATURE_FLAGS[key]),
      ),
    );
  };

  const value = useMemo<FeatureFlagsContextValue>(
    () => ({
      flags,
      isLoading,
      isEnabled: (key) => flags[key] ?? DEFAULT_FEATURE_FLAGS[key],
      updateFlag,
      resetFlags,
      labels: FEATURE_LABELS,
    }),
    [flags, isLoading],
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
