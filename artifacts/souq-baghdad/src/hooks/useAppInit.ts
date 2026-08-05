import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ad, Product, TransportAd, User } from '../types';
import { DEFAULT_AVATAR } from '../constants';

interface UseAppInitProps {
  user: User | null;
  view: string;
  setView: (v: string) => void;
  setCat: (c: string) => void;
  setSelectedAd: (a: Ad | null) => void;
  setSelectedProduct: (p: Product | null) => void;
  setSelectedTransportAd: (t: TransportAd | null) => void;
  setSelectedSellerId: (id: string | null) => void;
  allAds: Ad[];
  allProducts: Product[];
  setStoredUsers: (users: any[]) => void;
  fetchAds: (force?: boolean) => void;
  fetchProducts: (force?: boolean) => void;
  fetchTransportAds: () => void;
  search: string;
  cat: string;
  gov: string;
  sort: string;
  priceMin: string;
  priceMax: string;
}

export function useAppInit({
  user,
  view,
  setView,
  setCat,
  setSelectedAd,
  setSelectedProduct,
  setSelectedTransportAd,
  setSelectedSellerId,
  allAds,
  allProducts,
  setStoredUsers,
  fetchAds,
  fetchProducts,
  fetchTransportAds,
  search, cat, gov, sort, priceMin, priceMax
}: UseAppInitProps) {
  
  const [initialHashParsed, setInitialHashParsed] = useState(false);
  const pendingDeepLinkRef = useRef<string | null>(null);

  // 1. URL Refresh (Deep Linking from server-side or direct link)
  useEffect(() => {
    const handleUrlRefresh = async () => {
      try {
        const fullLocation = decodeURIComponent(window.location.pathname + window.location.hash);
        if (!fullLocation || fullLocation === '/' || fullLocation === '/IQ' || fullLocation === '#/') return;

        if (fullLocation.includes('/ad/')) {
          const cleanPath = fullLocation.replace(/[\/#]+$/, '');
          const parts = cleanPath.split('-');
          const extractedId = parts[parts.length - 1];

          if (extractedId) {
            const isNumeric = /^\d+$/.test(extractedId);
            const searchQuery = isNumeric 
              ? `id.eq.${extractedId},short_id.eq.${extractedId}` 
              : `short_id.eq.${extractedId}`;

            const { data } = await supabase.from('ads').select('*').or(searchQuery).maybeSingle();
            if (data) {
              const mappedAd: Ad = {
                id: data.id,
                title: data.title,
                price: data.price,
                governorate: data.city || '',
                location: data.location || '',
                phone: data.phone || '',
                category: data.category,
                images: data.images || [],
                seller: {
                  name: data.seller_name || 'مستخدم',
                  avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                  isVerified: false,
                  rating: data.seller_rating || 4.8,
                  joinedDate: data.created_at,
                  location: data.city || '',
                },
                time: '',
                createdAtISO: data.created_at,
                views: data.views || 0,
                status: data.status,
                type: data.type || 'sell',
                description: data.description || '',
                adCount: 0,
                soldCount: 0,
                responseRate: 100,
                avgResponseTime: 'دقائق',
                postedBy: data.seller_id,
                short_id: data.short_id,
              };
              setSelectedAd(mappedAd);
            }
          }
        } 
        else if (fullLocation.includes('/product/')) {
          const cleanPath = fullLocation.replace(/[\/#]+$/, '');
          const parts = cleanPath.split('-');
          const extractedId = parts[parts.length - 1];

          if (extractedId) {
            const isNumeric = /^\d+$/.test(extractedId);
            const searchQuery = isNumeric 
              ? `id.eq.${extractedId},short_id.eq.${extractedId}` 
              : `short_id.eq.${extractedId}`;

            const { data } = await supabase.from('products').select('*').or(searchQuery).maybeSingle();
            if (data) {
              const mappedProduct: Product = {
                id: data.id,
                title: data.title,
                price: data.price,
                description: data.description || '',
                category: data.category,
                images: data.images || [],
                governorate: data.governorate || data.city || '',
                phone: data.phone || '',
                condition: data.condition || 'used',
                seller: {
                  name: data.seller_name || 'مستخدم',
                  avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                  isVerified: false,
                  rating: 4.8,
                  joinedDate: data.created_at,
                  location: data.governorate || '',
                },
                createdAtISO: data.created_at,
                views: data.views || 0,
                postedBy: data.seller_id,
                stock: data.stock || 1,
                status: data.status || 'active',
                short_id: data.short_id,
              };
              setSelectedProduct(mappedProduct);
            }
          }
        }
        else if (fullLocation.includes('/transport/card/')) {
          const cleanPath = fullLocation.replace(/[\/#]+$/, '');
          const parts = cleanPath.split('/');
          const extractedId = parts[parts.length - 1];

          if (extractedId) {
            const isNumeric = /^\d+$/.test(extractedId);

            let query = supabase
              .from('ads')
              .select('*')
              .eq('category', 'transport');

            if (isNumeric) {
              query = query.or(`id.eq.${extractedId},short_id.eq.${extractedId}`);
            } else {
              query = query.eq('short_id', extractedId);
            }

            const { data: row, error } = await query.maybeSingle();

            if (!error && row) {
              let extra: any = {
                shift: 'صباحي', seats: 4, vehicleType: 'خصوصي',
                targetAudience: 'مختلط', categoryType: 'student',
                note: '', interest: 0, whatsappClicks: 0,
                completedAt: undefined, completion_reason: null
              };
              try {
                if (row.description) extra = { ...extra, ...JSON.parse(row.description) };
              } catch { extra.note = row.description || ''; }

              const mapped: TransportAd = {
                id: row.id,
                type: row.type || 'offer',
                categoryType: extra.categoryType || 'student',
                university: row.city || '',
                regions: row.location || '',
                shift: extra.shift,
                seats: Number(extra.seats) || 0,
                vehicleType: extra.vehicleType,
                targetAudience: extra.targetAudience,
                price: row.price ? String(row.price) : '',
                phone: row.phone || '',
                note: extra.note,
                sellerName: row.seller_name || 'مستخدم',
                sellerAvatar: row.seller_avatar || '',
                createdAt: row.created_at,
                status: row.status === 'active' ? 'published' : row.status,
                postedBy: row.seller_id,
                views: row.views || 0,
                interest: extra.interest,
                whatsappClicks: extra.whatsappClicks,
                completedAt: extra.completedAt,
                completion_reason: extra.completion_reason,
                short_id: row.short_id || undefined,
              };
              setSelectedTransportAd(mapped);
              setView('transport');
            }
          }
        }
      } catch (error) {
        console.error("URL parsing error:", error);
      }
    };

    handleUrlRefresh();
  }, []);

  // 2. Load Profiles globally and cache them
  useEffect(() => {
    let isMounted = true;
    async function loadAllProfilesGlobal() {
      try {
        const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const sellersMap = new Map();

        const cachedProfilesStr = localStorage.getItem('souq_cached_profiles');
        const cachedProfilesTime = localStorage.getItem('souq_cached_profiles_time');
        let dbProfiles = null;
        let isCacheValid = false;

        if (cachedProfilesStr && cachedProfilesTime) {
          const cacheAge = Date.now() - Number(cachedProfilesTime);
          if (cacheAge < 60 * 60 * 1000) { // 1 hour cache
            try {
              dbProfiles = JSON.parse(cachedProfilesStr);
              isCacheValid = true;
            } catch (e) {
              console.warn('Failed to parse cached profiles:', e);
            }
          }
        }

        if (!isCacheValid) {
          const { data, error } = await supabase.from('profiles').select('id, full_name, avatar_url, phone, city, created_at, role').limit(200);
          if (!error && data) {
            dbProfiles = data;
            localStorage.setItem('souq_cached_profiles', JSON.stringify(data));
            localStorage.setItem('souq_cached_profiles_time', String(Date.now()));
          }
        }

        if (dbProfiles && dbProfiles.length > 0) {
          dbProfiles.forEach((p: any) => {
            sellersMap.set(p.id, {
              id: p.id,
              name: p.full_name || p.name || 'مستخدم',
              avatar: p.avatar_url || p.avatar || DEFAULT_AVATAR,
              phone: p.phone || '',
              location: p.city || p.location || 'بغداد',
              adCount: 0,
              prodCount: 0,
              rating: 4.9,
              created_at: p.created_at || new Date().toISOString(),
              isVerified: p.role === 'owner' || p.role === 'vendor' || p.role === 'admin',
              role: p.role || 'user'
            });
          });
        }

        localUsers.forEach((u: any) => {
          if (!sellersMap.has(u.id)) {
            sellersMap.set(u.id, {
              id: u.id,
              name: u.name,
              avatar: u.avatar || DEFAULT_AVATAR,
              phone: u.phone || '',
              location: u.location || 'بغداد',
              adCount: u.adCount || 0,
              prodCount: 0,
              rating: 4.8,
              created_at: new Date().toISOString(),
              isVerified: u.role === 'owner' || u.role === 'vendor' || u.isVerified,
              role: u.role || 'user'
            });
          }
        });

        allAds.forEach(ad => {
          if (ad.postedBy) {
            if (!sellersMap.has(ad.postedBy)) {
              sellersMap.set(ad.postedBy, {
                id: ad.postedBy,
                name: ad.seller?.name || 'مستخدم',
                avatar: ad.seller?.avatar || DEFAULT_AVATAR,
                phone: ad.phone || '',
                location: ad.location || ad.governorate || 'بغداد',
                adCount: 1,
                prodCount: 0,
                rating: ad.seller?.rating || 4.8,
                created_at: ad.createdAtISO || new Date().toISOString(),
                isVerified: ad.seller?.isVerified || false,
                role: 'user'
              });
            } else {
              const existing = sellersMap.get(ad.postedBy);
              existing.adCount = (existing.adCount || 0) + 1;
              if (ad.phone && !existing.phone) existing.phone = ad.phone;
            }
          }
        });

        allProducts.forEach(p => {
          if (p.postedBy) {
            if (!sellersMap.has(p.postedBy)) {
              sellersMap.set(p.postedBy, {
                id: p.postedBy,
                name: p.seller?.name || 'مستخدم',
                avatar: p.seller?.avatar || DEFAULT_AVATAR,
                phone: p.phone || '',
                location: p.governorate || 'بغداد',
                adCount: 0,
                prodCount: 1,
                rating: p.seller?.rating || 4.8,
                created_at: p.createdAtISO || new Date().toISOString(),
                isVerified: p.seller?.isVerified || false,
                role: 'user'
              });
            } else {
              const existing = sellersMap.get(p.postedBy);
              existing.prodCount = (existing.prodCount || 0) + 1;
              if (p.phone && !existing.phone) existing.phone = p.phone;
            }
          }
        });

        if (isMounted) setStoredUsers(Array.from(sellersMap.values()));
      } catch (e) {
        console.error(e);
      }
    }
    loadAllProfilesGlobal();
    return () => { isMounted = false; };
  }, []);

  // 3. syncStateFromPath
  const syncStateFromPath = () => {
    let path = window.location.pathname;
    let hasHash = false;
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      path = window.location.hash.substring(1);
      hasHash = true;
    }

    if (hasHash && typeof window !== 'undefined') {
      window.history.replaceState(null, '', path + window.location.search);
    }

    const decodedPath = decodeURIComponent(path);
    const cleanPath = decodedPath.replace(/^\//, '');
    let parts = cleanPath.split('/').filter(Boolean);

    if (parts.length > 0 && parts[0] === 'IQ') {
      parts.shift();
    }

    if (parts.length === 0) {
      setView('home');
      setCat('general');
      setSelectedAd(null);
      setSelectedProduct(null);
      setSelectedSellerId(null);
      return;
    }
    
    const type = parts[0];
    const targetId = parts[parts.length - 1];

    if (type === 'search' || type === 'بحث') {
      setView('home');
      setCat('all');
      setSelectedAd(null);
      setSelectedProduct(null);
      setSelectedSellerId(null);
      return;
    }

    if (type === 'category' && parts[1]) {
      setView('home');
      setCat(parts[1]);
      setSelectedAd(null);
      setSelectedProduct(null);
      setSelectedSellerId(null);
      return;
    }
    
    if (type === 'ad' && targetId) {
      let actualId = targetId;
      const uuidMatch = targetId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
      if (uuidMatch) {
        actualId = uuidMatch[1];
      } else if (targetId.includes('-')) {
        const segments = targetId.split('-');
        actualId = segments[segments.length - 1];
      }
      
      const slugify = (text: string) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[\s_]+/g, '-')
          .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
          .replace(/--+/g, '-');
      };
      
      const targetSlug = slugify(decodeURIComponent(targetId));
      const ad = allAds.find(a => 
        String(a.id) === actualId || 
        a.short_id === actualId ||
        (a.title && slugify(a.title) === targetSlug) ||
        (a.title && slugify(a.title).includes(targetSlug)) ||
        (a.short_id && targetId.includes(a.short_id))
      );

      if (ad) {
        setSelectedAd(ad);
      } else {
        pendingDeepLinkRef.current = `ad:${actualId}`;
      }
      return;
    }
    
    if (type === 'product' && targetId) {
      let actualId = targetId;
      const uuidMatch = targetId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
      if (uuidMatch) {
        actualId = uuidMatch[1];
      } else if (targetId.includes('-')) {
        const segments = targetId.split('-');
        actualId = segments[segments.length - 1];
      }
      
      const product = allProducts.find(p => String(p.id) === actualId || p.short_id === actualId);
      if (product) {
        setSelectedProduct(product);
      } else {
        pendingDeepLinkRef.current = `product:${actualId}`;
      }
      return;
    }
    
    if (type === 'accounts' || type === 'المتاجر') {
      setView('admin');
      return;
    }

    if (type === 'seller' || type === 'profile') {
      const sId = parts[1];
      if (sId) {
        setSelectedSellerId(sId);
        setView('seller');
      }
      return;
    }

    if (type === 'transport') {
      setView('transport');
      return;
    }

    if (type === 'admin') {
      setView('admin');
      return;
    }

    if (type === 'owner') {
      setView('owner');
      return;
    }
  };

  useEffect(() => {
    if (!initialHashParsed) {
      syncStateFromPath();
      setInitialHashParsed(true);
      return;
    }
    if (pendingDeepLinkRef.current) {
      const [linkType, linkId] = pendingDeepLinkRef.current.split(':');
      if (linkType === 'ad' && allAds.length > 0) {
        const found = allAds.find(a => String(a.id) === linkId || a.short_id === linkId);
        if (found) {
          pendingDeepLinkRef.current = null;
          setSelectedAd(found);
        }
      } else if (linkType === 'product' && allProducts.length > 0) {
        const found = allProducts.find(p => String(p.id) === linkId || p.short_id === linkId);
        if (found) {
          pendingDeepLinkRef.current = null;
          setSelectedProduct(found);
        }
      }
    }
  }, [allAds, allProducts, initialHashParsed]);

  useEffect(() => {
    const handlePopState = () => syncStateFromPath();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [allAds, allProducts]);

  // 4. Fetch dependent data
  useEffect(() => {
    if (view === 'transport' || view === 'profile') {
      fetchTransportAds();
    }
  }, [view, fetchTransportAds]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (view === 'home' || view === 'products' || view === 'transport' || view === 'profile') {
        fetchAds(true);
        fetchProducts(true);
      }
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [search, cat, gov, sort, priceMin, priceMax, view]);

  // 5. User Activity Tracker
  useEffect(() => {
    const trackActivity = async () => {
      try {
        if (user) {
          const { data } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single();
          if (data?.is_banned) {
            await supabase.auth.signOut();
            document.body.innerHTML = '<div style="padding: 3rem; text-align: center; color: red; font-size: 1.5rem; font-weight: bold;">عذراً، هذا الحساب محظور من تصفح الموقع لانتهاكه الشروط.</div>';
            return;
          }
          await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
        } else {
          let deviceId = localStorage.getItem('souqGuestId');
          if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('souqGuestId', deviceId);
          }
          const { data } = await supabase.from('guests').select('is_banned').eq('id', deviceId).single();
          if (data?.is_banned) {
            document.body.innerHTML = '<div style="padding: 3rem; text-align: center; color: red; font-size: 1.5rem; font-weight: bold;">عذراً، هذا الجهاز محظور من تصفح الموقع لانتهاكه الشروط.</div>';
            return;
          }
          await supabase.from('guests').upsert({ id: deviceId, last_seen: new Date().toISOString(), user_agent: navigator.userAgent });
        }
      } catch (e) {
        // silently fail tracking errors
      }
    };
    trackActivity();
  }, [user]);

}
