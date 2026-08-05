import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const OWNER_EMAIL = 'nooraldeinsbah@gmail.com';
export const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e293b"/><circle cx="50" cy="38" r="18" fill="#64748b"/><ellipse cx="50" cy="82" rx="28" ry="20" fill="#64748b"/></svg>')}`;
export const DEFAULT_COVER = '/logo-512.webp';

import { User } from '../types';

let hasShownLoginToast = false;

export function useAuth(setToast: (toast: any) => void) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('souqUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [storedUsers, setStoredUsers] = useState<any[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';
  const isOwner = user?.role === 'owner';

  // Fetch all stored users (profiles)
  const fetchProfiles = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, phone, role, email');
      if (data) setStoredUsers(data);
    } catch (e) {
      console.error('Failed to fetch stored users:', e);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const loadUserFromSupabase = async (authUser: any) => {
    try {
      let profile: any = null;

      // 0. استرجاع بيانات المستخدم النشط المحفوظة محلياً (الحساب الحقيقي الحالي)
      let savedLocalUser: any = null;
      try {
        const rawLocal = localStorage.getItem('souqUser');
        if (rawLocal) savedLocalUser = JSON.parse(rawLocal);
      } catch (e) {}

      const realEmail = (authUser.email && !authUser.email.endsWith('@souqbaghdad.store'))
        ? authUser.email.toLowerCase().trim()
        : (savedLocalUser?.email && !savedLocalUser.email.endsWith('@souqbaghdad.store') ? savedLocalUser.email : '');

      const persistentLinkedId = realEmail ? localStorage.getItem('linked_id_' + realEmail) : null;
      const persistentLinkedPhone = realEmail ? localStorage.getItem('linked_phone_' + realEmail) : null;

      const linkingProfileId = localStorage.getItem('linking_profile_id') || persistentLinkedId || (savedLocalUser?.id && savedLocalUser?.phone ? savedLocalUser.id : null);
      const linkingProfilePhone = localStorage.getItem('linking_profile_phone') || persistentLinkedPhone || savedLocalUser?.phone || '';
      localStorage.removeItem('linking_profile_id');
      localStorage.removeItem('linking_profile_phone');

      const userPhone = authUser.user_metadata?.phone || authUser.phone || linkingProfilePhone;

      // أولوية 1: البحث بمعرف الحساب القديم المحفوظ أو المطلوب ربطه
      if (linkingProfileId) {
        try {
          const { data: linkTarget } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', linkingProfileId)
            .maybeSingle();
          if (linkTarget) profile = linkTarget;
        } catch (e) {}
      }

      // أولوية 2: البحث بالإيميل الحقيقي في جدول البروفايلات (الأولوية للحساب القديم)
      if (!profile && realEmail) {
        try {
          const { data: candidates } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', realEmail)
            .order('created_at', { ascending: true });
          
          if (candidates && candidates.length > 0) {
            const oldTarget = candidates.find(c => c.phone || (c.points && c.points > 10) || c.ads_count > 0) || candidates[0];
            profile = oldTarget;

            for (const c of candidates) {
              if (c.id !== profile.id && !c.ads_count && (!c.points || c.points <= 10) && !c.phone) {
                try {
                  await supabase.from('profiles').delete().eq('id', c.id);
                } catch (delErr) {}
              }
            }
          }
        } catch (err) {}
      }

      // أولوية 3: البحث برقم هاتف الحساب القديم
      if (!profile && userPhone) {
        try {
          const { data: byPhone } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', userPhone)
            .maybeSingle();
          if (byPhone) profile = byPhone;
        } catch (err) {}
      }

      // أولوية 4: الاعتماد على البروفايل المحلي إذا كان حقيقياً ومسجلاً برقم هاتف
      if (!profile && savedLocalUser && savedLocalUser.phone) {
        profile = savedLocalUser;
      }

      // أولوية 5: البحث بالـ authUser.id فقط كآخر حل للمستخدمين الجدد كلياً
      if (!profile) {
        try {
          const { data: byId } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          if (byId) profile = byId;
        } catch (err) {}
      }

      // تحديث بيانات البروفايل القديم بـ Gmail الحقيقي وتخزين الروابط محلياً
      if (profile) {
        if (realEmail) {
          profile.email = realEmail;
          if (profile.phone) {
            try { localStorage.setItem('linked_phone_' + realEmail, profile.phone); } catch (e) {}
          }
          try { localStorage.setItem('linked_id_' + realEmail, profile.id); } catch (e) {}

          if (profile.email !== realEmail) {
            try {
              const { data: dups } = await supabase
                .from('profiles')
                .select('id, ads_count, points, phone')
                .eq('email', realEmail)
                .neq('id', profile.id);
              
              if (dups && dups.length > 0) {
                for (const d of dups) {
                  if (!d.ads_count && (!d.points || d.points <= 10) && !d.phone) {
                    await supabase.from('profiles').delete().eq('id', d.id);
                  }
                }
              }
              await supabase.from('profiles').update({ email: realEmail }).eq('id', profile.id);
            } catch (e) {}
          }
        } else if (profile.email && profile.email.includes('@souqbaghdad.store')) {
          profile.email = '';
        }

        const googleAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;
        if (googleAvatar && !profile.avatar_url) {
          profile.avatar_url = googleAvatar;
          try {
            await supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', profile.id);
          } catch (e) {}
        }
      }

      // 3. مستخدم جديد بـ Google
      if (!profile && authUser.id) {
        const googleName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'مستخدم جديد';
        const googleAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;
        const role = authUser.email === OWNER_EMAIL ? 'owner' : 'user';
        const cleanEmail = (authUser.email && !authUser.email.endsWith('@souqbaghdad.store')) ? authUser.email.toLowerCase().trim() : '';

        const newProfileData = {
          id: authUser.id,
          full_name: googleName,
          email: cleanEmail,
          phone: authUser.user_metadata?.phone || '',
          role: role,
          avatar_url: googleAvatar,
          city: authUser.user_metadata?.city || 'بغداد',
          points: 10
        };

        try {
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert([newProfileData], { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (createdProfile) {
            profile = createdProfile;
          }
        } catch (err) {
          console.warn('Profile creation error:', err);
        }
      }

      const role = authUser.email === OWNER_EMAIL ? 'owner'
        : (profile?.role || authUser.user_metadata?.role || 'user');
      
      const realDisplayEmail = (authUser.email && !authUser.email.endsWith('@souqbaghdad.store'))
        ? authUser.email
        : (profile?.email && !profile.email.endsWith('@souqbaghdad.store') ? profile.email : '');

      const u: User = {
        id: profile?.id || authUser.id,
        name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.picture || authUser.email?.split('@')[0] || 'مستخدم',
        email: realDisplayEmail,
        phone: profile?.phone || savedLocalUser?.phone || authUser.user_metadata?.phone || '',
        role,
        avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || DEFAULT_AVATAR,
        cover: profile?.cover_url || DEFAULT_COVER,
        bio: profile?.bio || savedLocalUser?.bio || '',
        location: profile?.city || authUser.user_metadata?.city || 'بغداد',
        points: profile?.points || 0,
        rating: 4.8,
        isVerified: role !== 'user',
        joinedDate: profile?.created_at || 'الآن',
        stats: { ads: profile?.ads_count || 0, favorites: profile?.favorites_count || 0, views: profile?.views_count || 0 },
        sellerStats: { totalAds: 0, sold: 0, responseRate: 100, avgResponseTime: 'دقائق' }
      };

      setUser(u);
      localStorage.setItem('souqUser', JSON.stringify(u));

      // Upload FCM token if available
      const fcmToken = localStorage.getItem('fcm_token');
      if (fcmToken) {
         supabase.from('profiles').update({ fcm_token: fcmToken }).eq('id', u.id).then();
      }
    } catch (err) {
      console.error('Critical error in loadUserFromSupabase:', err);
      const cleanEmail = (authUser.email && !authUser.email.endsWith('@souqbaghdad.store')) ? authUser.email : '';
      const fallbackUser: User = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || 'مستخدم جديد',
        email: cleanEmail,
        role: 'user',
        avatar: DEFAULT_AVATAR,
        cover: DEFAULT_COVER,
        bio: '',
        location: 'بغداد',
        points: 0,
        rating: 5,
        isVerified: false,
        joinedDate: 'الآن',
        stats: { ads: 0, favorites: 0, views: 0 },
        sellerStats: { totalAds: 0, sold: 0, responseRate: 100, avgResponseTime: 'دقائق' }
      };
      setUser(fallbackUser);
      localStorage.setItem('souqUser', JSON.stringify(fallbackUser));
    }
  };

  useEffect(() => {
    // URL Check
    if (typeof window !== 'undefined' && (window.location.hash.includes('error=') || window.location.search.includes('error='))) {
      try {
        const hashOrQuery = window.location.search || (window.location.hash ? '?' + window.location.hash.substring(1) : '');
        const urlParams = new URLSearchParams(hashOrQuery);
        const errorDesc = urlParams.get('error_description') || urlParams.get('error');
        if (errorDesc) {
          setToast({ msg: `فشل تسجيل الدخول بـ Google: ${errorDesc}`, type: 'error', visible: true });
        }
      } catch (e) {}
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        loadUserFromSupabase(session.user);
      }
    });

    // Deep Linking
    let appListener: any = null;
    const setupDeepLinkListener = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        const { App: CapApp } = await import('@capacitor/app');

        appListener = await CapApp.addListener('appUrlOpen', async (data: { url: string }) => {
          if (data.url.startsWith('souqbaghdad://login-callback')) {
            try {
              const { Browser } = await import('@capacitor/browser');
              await Browser.close();
            } catch {}

            const url = new URL(data.url.replace('souqbaghdad://login-callback', 'https://placeholder.com'));

            const code = url.searchParams.get('code');
            if (code) {
              const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
              if (!error && sessionData?.session?.user) {
                loadUserFromSupabase(sessionData.session.user);
                setShowAuth(false);
              }
              return;
            }

            const hashParams = new URLSearchParams(url.hash.replace('#', ''));
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');
            if (access_token && refresh_token) {
              const { data: sessionData, error } = await supabase.auth.setSession({ access_token, refresh_token });
              if (!error && sessionData?.user) {
                loadUserFromSupabase(sessionData.user);
                setShowAuth(false);
              }
            }
          }
        });
      } catch (e) {
        console.warn('Deep link listener setup failed:', e);
      }
    };
    setupDeepLinkListener();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadUserFromSupabase(session.user);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setShowAuth(false);
          if (!hasShownLoginToast && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            hasShownLoginToast = true;
            setToast({ msg: 'أهلاً بك في سوق بغداد ✨', type: 'success', visible: true });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('souqUser');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (appListener) appListener.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const moduleName = '@codetrix-studio/capacitor-google-auth';
          const { GoogleAuth } = await import(/* @vite-ignore */ moduleName);
          await GoogleAuth.signOut();
        } catch {}
      }
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('souqUser');
      localStorage.removeItem('fcm_token');
      localStorage.removeItem('linked_id_' + user?.email);
      localStorage.removeItem('linked_phone_' + user?.email);
      setToast({ msg: 'تم تسجيل الخروج بنجاح 👋', type: 'success', visible: true });
    } catch (error: any) {
      setToast({ msg: 'حدث خطأ أثناء تسجيل الخروج', type: 'error', visible: true });
    }
  };

  return {
    user,
    setUser,
    storedUsers,
    fetchProfiles,
    isAdmin,
    isOwner,
    showAuth,
    setShowAuth,
    handleLogout,
    loadUserFromSupabase // Exposed in case it's needed elsewhere
  };
}
