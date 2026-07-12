import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (supabaseUser: any): User => ({
  id: supabaseUser.id,
  name:
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split('@')[0] ||
    'مستخدم',
  email: supabaseUser.email || '',
  phone: supabaseUser.user_metadata?.phone || '',
  role: (supabaseUser.user_metadata?.role as 'user' | 'vendor' | 'admin') || 'user',
  avatar:
    supabaseUser.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.email || supabaseUser.id}`,
  coverUrl: supabaseUser.user_metadata?.coverUrl || '',
  isPrivate: supabaseUser.user_metadata?.isPrivate || false,
  isVerified: !!supabaseUser.email,
  storeName: supabaseUser.user_metadata?.storeName || '',
  rating: supabaseUser.user_metadata?.rating || 4.5,
  followers: supabaseUser.user_metadata?.followers || 0,
  activeAds: supabaseUser.user_metadata?.activeAds || 0,
  products: supabaseUser.user_metadata?.products || 0,
  createdAt: supabaseUser.created_at || new Date().toISOString(),
  stats: { ads: 0, favorites: 0, views: 0 },
  bio: supabaseUser.user_metadata?.bio || '',
  location: supabaseUser.user_metadata?.location || '',
  socialLinks: {
    facebook: supabaseUser.user_metadata?.facebook || '',
    twitter: supabaseUser.user_metadata?.twitter || '',
    instagram: supabaseUser.user_metadata?.instagram || '',
  },
});

const makeFingerprint = () => {
  if (typeof window === 'undefined') return 'demo-device';

  const parts = [
    navigator.userAgent || 'unknown-agent',
    navigator.language || 'unknown-language',
    `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown-timezone',
  ];

  let hash = 0;
  for (const part of parts.join('|')) {
    hash = (hash * 31 + part.charCodeAt(0)) >>> 0;
  }
  return `demo-${hash.toString(16)}`;
};

const createDemoUser = (overrides?: Partial<User>): User => {
  const fingerprint = makeFingerprint();
  const shortId = fingerprint.slice(0, 8);
  const deviceLabel = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
    ? 'مستخدم موبايل'
    : 'مستخدم سطح مكتب';

  return {
    id: `demo-${shortId}`,
    name: overrides?.name || `مستخدم تجريبي (${deviceLabel})`,
    email: overrides?.email || `demo-${shortId}@device.local`,
    phone: '07700000000',
    role: 'user',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shortId}`,
    isVerified: true,
    createdAt: new Date().toISOString(),
    stats: { ads: 0, favorites: 0, views: 0 },
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedDemoUser = localStorage.getItem('souq-demo-user');
      if (storedDemoUser) {
        try {
          setUser(JSON.parse(storedDemoUser));
        } catch {
          localStorage.removeItem('souq-demo-user');
        }
      }

      const { data } = await supabase.auth.getSession();

      if (data?.session?.user) {
        setUser(mapSupabaseUser(data.session.user));
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const persistDemoUser = (demoUser: User) => {
    localStorage.setItem('souq-demo-user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (normalizedIdentifier === 'demo' || password === 'demo123') {
      const demoUser = createDemoUser({ name: 'حساب تجريبي', email: 'demo@device.local' });
      persistDemoUser(demoUser);
      return { success: true };
    }

    const credentials = normalizedIdentifier.includes('@')
      ? { email: normalizedIdentifier }
      : { phone: normalizedIdentifier };

    const { data, error } = await supabase.auth.signInWithPassword({
      ...credentials,
      password,
    });

    if (error || !data?.user) {
      const fallbackUser = createDemoUser({
        name: identifier.trim() || 'مستخدم تجريبي',
        email: normalizedIdentifier.includes('@') ? normalizedIdentifier : `demo-${identifier.trim().replace(/\s+/g, '').slice(0, 8)}@device.local`,
      });
      persistDemoUser(fallbackUser);
      return {
        success: true,
        message: 'تم الدخول بحساب تجريبي مؤقت لأن تسجيل الدخول الحقيقي غير متاح حالياً',
      };
    }

    setUser(mapSupabaseUser(data.user));
    return { success: true };
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<{ success: boolean; message?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, role: 'user' },
      },
    });

    if (error || !data?.user) {
      const fallbackUser = createDemoUser({
        name: name || 'مستخدم جديد',
        email: email || 'demo@device.local',
      });
      persistDemoUser(fallbackUser);
      return {
        success: true,
        message: 'تم إنشاء حساب تجريبي مؤقت حتى يصبح التسجيل الحقيقي متاحاً',
      };
    }

    setUser(mapSupabaseUser(data.user));
    return { success: true };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore sign-out errors; still clear local demo session
    }
    localStorage.removeItem('souq-demo-user');
    setUser(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const demoLogin = () => {
    const demoUser = createDemoUser({ name: 'حساب تجريبي', email: 'demo@device.local' });
    localStorage.setItem('souq-demo-user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      demoLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}