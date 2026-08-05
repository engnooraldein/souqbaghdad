// ===========================================
// مسؤولية هذا الملف:
// يعرض الصفحة الرئيسية للسوق (Market View) وقسم المتجر (Shop/Products).
//
// لا يقوم بجلب البيانات مباشرة من Supabase.
// البيانات تأتيه عبر Props من App.tsx (allAds, allProducts, fetchAds, fetchProducts).
//
// الميزات المدمجة:
// - عرض قائمة الإعلانات (Ads)
// - عرض قائمة المنتجات (Products)
// - فلاتر البحث (Search, Category, Governorate, Sort, Price)
// - Infinite Scroll للتحميل التدريجي
// - زر "نشر إعلان" / "نشر منتج"
//
// انتبه:
// هذا الملف كبير جداً (835 سطر). إذا أردت تعديل تصميم البطاقات
// أو الفلاتر، ابحث عن القسم المناسب قبل التعديل.
//
// اقتراح تحسين:
// يمكن مستقبلاً تقسيمه إلى:
// - AdsListSection.tsx (قسم الإعلانات)
// - ProductsListSection.tsx (قسم المنتجات)
// - FilterBar.tsx (شريط الفلاتر)
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم تغيير Props المستقبَلة أو أسماء الـ functions المُمرَّرة.
// ===========================================
import {  } from '../App';
import { DEFAULT_AVATAR } from '../hooks/useAuth';

import LiveVisitorCounter from './LiveVisitorCounter';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';
import { DEFAULT_COVER, getCoverImage } from '../constants';
import { useOnlineStatuses } from '../hooks/useOnlineStatuses';
import { useDebounce } from '../hooks/useDebounce';
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, ChevronDown, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User as UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image as ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone as PhoneIcon, 
  RefreshCw, TrendingDown, Clock, HelpCircle, Archive, ShoppingCart, Target, 
  Globe, Search as SearchIcon, ArrowLeft, MoreHorizontal, LayoutGrid,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, 
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { 
  Category as IcCategory, Discovery as IcDiscovery, Home as IcHome, Call as IcCall, 
  Video as IcVideo, Bookmark as IcBookmark, Bag as IcBag, Work as IcWork, 
  Setting as IcSetting, Heart as IcHeart, TicketStar as IcTicketStar, Game as IcGame, 
  Document as IcDocument, Star as IcStar
} from 'react-iconly';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  all: IcCategory,
  general: IcStar,
  cars: IcDiscovery,
  'real-estate': IcHome,
  phones: IcCall,
  electronics: IcVideo,
  gym: IcGame,
  clothes: IcBag,
  cosmetics: IcHeart,
  handmade: IcBookmark,
  jobs: IcWork,
  furniture: IcDocument,
  bikes: IcDiscovery,
  services: IcSetting,
  games: IcGame,
};
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';

import { ImageCropModal } from './ImageCropModal';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';

import { SkeletonCard } from './SkeletonCard';
import { VerifiedBadge } from './VerifiedBadge';
import { TransportFormModal } from './TransportFormModal';
import { AdCard, getAdCategoryPlaceholderImage } from './AdCard';
import { ProductCard } from './ProductCard';
import { ImageWithDataSaver } from './ImageWithDataSaver';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';
import { CityOutline } from '../assets/svg/logo/city-outline';

import { PaginationDots } from './market/PaginationDots';
import { HorizontalCarousel } from './market/HorizontalCarousel';
import { getAdTimestamp } from './market/marketHelpers';

export function MarketView({ 
  user, allAds, allProducts, favorites, storedUsers: propStoredUsers, 
  onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, 
  onTransportClick, onSelectTransportAd, transportLines, onActionMenu,
  isStandalone, onInstallClick,
  search, setSearch, cat, setCat, gov, setGov, sort, setSort, 
  priceMin, setPriceMin, priceMax, setPriceMax,
  hasMoreAds, hasMoreProducts, onLoadMoreAds, onLoadMoreProducts,
  totalAdsCount, totalProductsCount,
  loadingMoreAds, loadingMoreProducts, isInitialLoading,
  isDarkMode = true,
  onRefresh,
  setShowSearchPage
}:{
  user:User|null; allAds:Ad[]; allProducts:Product[]; favorites:number[]; storedUsers?: any[];
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void;
  onToggleFav:(id:number)=>void; onRequireAuth:()=>void; onSellerClick:(id:string, source?: 'home'|'accounts')=>void;
  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
  onActionMenu?: any;
  isStandalone?: boolean;
  onInstallClick?: () => void;
  search: string; setSearch: (s: string) => void;
  cat: string; setCat: (c: string) => void;
  gov: string; setGov: (g: string) => void;
  sort: 'recent'|'views'|'price-low'|'price-high'; setSort: (s: any) => void;
  priceMin: string; setPriceMin: (p: string) => void;
  priceMax: string; setPriceMax: (p: string) => void;
  hasMoreAds: boolean; hasMoreProducts: boolean;
  onLoadMoreAds: () => void; onLoadMoreProducts: () => void;
  totalAdsCount: number; totalProductsCount: number;
  loadingMoreAds?: boolean; loadingMoreProducts?: boolean;
  isInitialLoading?: boolean;
  isDarkMode?: boolean;
  onRefresh?: () => Promise<void> | void;
  setShowSearchPage?: (s: boolean) => void;
}) {
  const playSound = useSound();
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [homeToggleType, setHomeToggleType] = useState<'ads' | 'products'>('ads');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<'all'|'new'|'used'>('all');
  const [latestAdsPage, setLatestAdsPage] = useState(0);
  const [vipAdsPage, setVipAdsPage] = useState(0);

  // ── Pull To Refresh state ───────────────────
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.scrollY <= 15) {
      touchStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    } else {
      isPullingRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;
    if (typeof window !== 'undefined' && window.scrollY > 15) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }
    const currentY = e.touches[0].clientY;
    const dy = currentY - touchStartYRef.current;
    if (dy > 0) {
      const distance = Math.min(90, Math.pow(dy, 0.75) * 2.2);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    if (pullDistance > 55 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);
      try { playSound('delete' as any); } catch {}
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (e) {
          console.error(e);
        }
      }
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
    } else {
      setPullDistance(0);
    }
  };

  const triggerManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try { playSound('delete' as any); } catch {}
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (e) {
        console.error(e);
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const [visibleGeneralAdsCount, setVisibleGeneralAdsCount] = useState(6);
  const [categoryAdsPage, setCategoryAdsPage] = useState(0);
  const [visibleCategoryAdsCount, setVisibleCategoryAdsCount] = useState(6);
  const [categoryProductsPage, setCategoryProductsPage] = useState(0);
  const [visibleCategoryProdsCount, setVisibleCategoryProdsCount] = useState(6);
  const [visibleProfilesCount, setVisibleProfilesCount] = useState(6);
  const [visibleTransportCount, setVisibleTransportCount] = useState(6);
  const [visibleTopSellers, setVisibleTopSellers] = useState(5);
  const [contentTab, setContentTab] = useState<'ads'|'products'|'profiles'|'transport'|'all'>(() => {
    if (typeof window === 'undefined') return 'all';
    const h = window.location.hash;
    if (h === '#/accounts' || h === '#/sellers') return 'profiles';
    if (h === '#/transport') return 'transport';
    if (h.startsWith('#/products')) return 'products';
    if (h.startsWith('#/ads')) return 'ads';
    return 'all';
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('souqRecentSearches') || '[]'); } 
    catch { return []; }
  });

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, search, setSearch]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const newRecent = [term.trim(), ...recentSearches.filter(s => s !== term.trim())].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('souqRecentSearches', JSON.stringify(newRecent));
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter(s => s !== term);
    setRecentSearches(newRecent);
    localStorage.setItem('souqRecentSearches', JSON.stringify(newRecent));
  };

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const query = debouncedSearch.toLowerCase().trim();
    const sourceItems = [...allAds, ...allProducts];
    
    // Filter by active category if not 'all' or 'general'
    const catFiltered = sourceItems.filter(item => {
      if (cat === 'all' || cat === 'general') return true;
      return item.category === cat;
    });

    const matches = new Set<string>();
    for (const item of catFiltered) {
      if (item.title && item.title.toLowerCase().includes(query)) {
        matches.add(item.title);
        if (matches.size >= 5) break;
      }
    }

    setSuggestions(Array.from(matches));
  }, [debouncedSearch, cat, allAds, allProducts]);

  // Sync state when URL hash changes externally
  useEffect(() => {
    const handleSwitch = () => setContentTab('profiles');
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#/accounts' || h === '#/sellers') {
        setContentTab('profiles');
      } else if (h === '#/transport') {
        setContentTab('transport');
      } else if (h.startsWith('#/products')) {
        setContentTab('products');
        const parts = h.split('/');
        if (parts[2]) setCat(parts[2]);
      } else if (h.startsWith('#/ads')) {
        setContentTab('ads');
        const parts = h.split('/');
        if (parts[2]) setCat(parts[2]);
      } else if (h.startsWith('#/category/')) {
        const parts = h.split('/');
        if (parts[2]) setCat(parts[2]);
      } else if (h === '#/' || h === '') {
        setContentTab('all');
        // Do not force cat='all' here since useAppInit handles the default routing to 'general'.
      }
    };
    window.addEventListener('switch-to-profiles-tab', handleSwitch);
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => {
      window.removeEventListener('switch-to-profiles-tab', handleSwitch);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  // Push updated hash when user clicks category or content tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let targetHash = '#/';
    if (contentTab === 'profiles') {
      targetHash = '#/accounts';
    } else if (contentTab === 'transport') {
      targetHash = '#/transport';
    } else if (contentTab === 'products') {
      targetHash = cat !== 'all' ? `#/products/${cat}` : '#/products';
    } else if (contentTab === 'ads') {
      targetHash = cat !== 'all' ? `#/ads/${cat}` : '#/ads';
    } else if (contentTab === 'all') {
      if (cat === 'general') {
        targetHash = '/';
      } else if (cat === 'all') {
        targetHash = '/categories';
      } else {
        targetHash = `/category/${cat}`;
      }
    }

    const currentUrl = window.location.hash || window.location.pathname;
    if (currentUrl !== targetHash && !window.location.hash.includes('/ad/') && !window.location.hash.includes('/seller/')) {
      window.history.pushState(null, '', targetHash);
    }
  }, [cat, contentTab]);
  const [showFilters, setShowFilters] = useState(false);

  const [localStoredUsers, setLocalStoredUsers] = useState<any[]>([]);
  const storedUsers = propStoredUsers && propStoredUsers.length > 0 ? propStoredUsers : localStoredUsers;
  const onlineStatuses = useOnlineStatuses();

  const publishedTransportLines = transportLines.filter(a => a.status === 'published');

  const filteredTransport = publishedTransportLines.filter(a => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (a.regions && a.regions.toLowerCase().includes(term)) ||
           (a.university && a.university.toLowerCase().includes(term)) ||
           (a.note && a.note.toLowerCase().includes(term));
  });

  useEffect(() => {
    if (propStoredUsers && propStoredUsers.length > 0) {
      return;
    }
    let isMounted = true;
    async function loadAllProfiles() {
      try {
        const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const sellersMap = new globalThis.Map();

        // Check cache first
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
            } catch (e) {}
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

        // Add local users
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

        // Aggregate ads
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

        // Aggregate products
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

        if (isMounted) setLocalStoredUsers(Array.from(sellersMap.values()));
      } catch (e) {
        console.error(e);
      }
    }
    loadAllProfiles();
    return () => { isMounted = false; };
  }, []);

  const filteredProfiles = storedUsers.filter(u => {
    // Only show verified accounts, owners, admins, or users with at least 1 ad/product
    const isOwnerOrAdmin = u.role === 'owner' || u.role === 'admin' || u.role === 'vendor';
    const isVerified = u.isVerified || u.verified;
    const isMerchant = (u.adCount + (u.prodCount || 0)) >= 1;
    if (!isOwnerOrAdmin && !isVerified && !isMerchant) {
      return false;
    }

    const term = search.toLowerCase();
    return !search || 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.phone && u.phone.includes(term));
  });

  const displayedProfiles = filteredProfiles.slice(0, visibleProfilesCount);

  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');

  const filterAds = useMemo(() => {
    let filtered = allAds.filter(a => {
      if (a.status === 'sold') return false;
      
      if (cat !== 'all' && cat !== 'general') {
        if (a.category !== cat) return false;
      }
      
      // Only apply search filter when NOT in general feed mode
      if (cat !== 'general' && search.trim()) {
        const text = `${a.title} ${a.description || ''} ${a.category || ''}`.toLowerCase();
        const term = search.toLowerCase();
        if (!text.includes(term)) return false;
      }

      if (gov !== 'الكل' && a.governorate !== gov) return false;
      
      if (priceMin || priceMax) {
        const p = a.price || 0;
        const pVal = typeof p === 'string' ? parseInt(p.replace(/,/g, '')) || 0 : p;
        const min = priceMin ? parseInt(priceMin.replace(/,/g, '')) : 0;
        const max = priceMax ? parseInt(priceMax.replace(/,/g, '')) : Infinity;
        if (pVal < min || pVal > max) return false;
      }

      if (conditionFilter !== 'all') {
        const text = `${a.title} ${a.description || ''}`.toLowerCase();
        const isUsed = text.includes('مستعمل') || text.includes('مستعملة') || text.includes('مستخدم') || text.includes('بالة') || text.includes('ثاني يد');
        const isNew = text.includes('جديد') || text.includes('جديدة') || text.includes('كارتون') || text.includes('بالكارتون') || text.includes('غير مستخدم') || text.includes('جديده');
        if (conditionFilter === 'new') {
          if (isUsed && !isNew) return false;
        } else if (conditionFilter === 'used') {
          if (isNew && !isUsed) return false;
        }
      }

      return true;
    });

    const items = [...filtered];
    if (sort === 'views') {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'price-low') {
      items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === 'price-high') {
      items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else {
      items.sort((a, b) => {
        const timeA = getAdTimestamp(a);
        const timeB = getAdTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
    }

    return items;
  }, [allAds, cat, search, gov, priceMin, priceMax, conditionFilter, sort]);

  const filterProds = useMemo(() => {
    let filtered = allProducts.filter(p => {
      if (p.status === 'sold') return false;
      
      if (cat !== 'all' && cat !== 'general') {
        if (p.category !== cat) return false;
      }
      
      if (search.trim()) {
        const text = `${p.title} ${p.description || ''} ${p.category || ''}`.toLowerCase();
        const term = search.toLowerCase();
        if (!text.includes(term)) return false;
      }

      if (gov !== 'الكل' && p.governorate !== gov) return false;
      
      if (priceMin || priceMax) {
        const pr = p.price || 0;
        const prVal = typeof pr === 'string' ? parseInt(pr.replace(/,/g, '')) || 0 : pr;
        const min = priceMin ? parseInt(priceMin.replace(/,/g, '')) : 0;
        const max = priceMax ? parseInt(priceMax.replace(/,/g, '')) : Infinity;
        if (prVal < min || prVal > max) return false;
      }

      if (conditionFilter !== 'all') {
        if (p.condition !== conditionFilter) return false;
      }

      return true;
    });

    if (sort === 'views') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'price-low') {
      filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === 'price-high') {
      filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else {
      filtered.sort((a, b) => {
        const timeA = getAdTimestamp(a);
        const timeB = getAdTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
    }

    return filtered;
  }, [allProducts, cat, search, gov, priceMin, priceMax, conditionFilter, sort]);

  // Auto-reset page numbers back to 0 when query/filters update to prevent out-of-bounds pages
  useEffect(() => {
    setLatestAdsPage(0);
    setVipAdsPage(0);
    setVisibleGeneralAdsCount(6);
    
    setCategoryAdsPage(0);
    setVisibleCategoryAdsCount(6);

    setCategoryProductsPage(0);
    setVisibleCategoryProdsCount(6);
  }, [cat, search, gov, priceMin, priceMax, sort, conditionFilter]);

  const handleCategoryAdsPageChange = (page: number) => {
    setCategoryAdsPage(page);
    setVisibleCategoryAdsCount(6);
  };

  const handleCategoryProductsPageChange = (page: number) => {
    setCategoryProductsPage(page);
    setVisibleCategoryProdsCount(6);
  };

  // Compute "Latest Ads" (منشور خلال الـ 24 ساعة الماضية)
  const latestAds = useMemo(() => {
    const now = Date.now();
    const limit = 24 * 60 * 60 * 1000; // 24 ساعة
    return filterAds
      .filter(a => {
        const time = getAdTimestamp(a);
        if (time <= 0) return false;
        const diff = now - time;
        if (diff < 0 || diff > limit) return false;
        
        // استبعاد الإعلانات المدفوعة VIP
        return !a.is_vip;
      })
      .sort((a, b) => getAdTimestamp(b) - getAdTimestamp(a));
  }, [filterAds]);

  const latestProducts = useMemo(() => {
    const now = Date.now();
    const limit = 24 * 60 * 60 * 1000; // 24 ساعة
    return filterProds
      .filter(p => {
        const time = getAdTimestamp(p);
        if (time <= 0) return false;
        const diff = now - time;
        const isInTime = diff > 0 && diff <= limit;
        if (!isInTime) return false;

        // استبعاد المنتجات المدفوعة VIP
        return !p.is_vip;
      })
      .sort((a, b) => getAdTimestamp(b) - getAdTimestamp(a));
  }, [filterProds]);

  const totalLatestPages = Math.ceil(latestAds.length / 6);
  const paginatedLatestAds = useMemo(() => {
    const start = latestAdsPage * 6;
    return latestAds.slice(start, start + 6);
  }, [latestAds, latestAdsPage]);

  // Compute "VIP Ads" (فقط الإعلانات التي دفعت للتمييز ولم تنتهِ مدتها)
  const vipAds = useMemo(() => {
    const now = Date.now();
    return filterAds.filter(a => {
      const time = getAdTimestamp(a);
      if (time <= 0) return false;
      const diff = now - time;
      const limit = (a.vip_days || 30) * 24 * 60 * 60 * 1000;
      if (diff < 0 || diff > limit) return false;

      return a.is_vip === true;
    });
  }, [filterAds]);

  const totalVipPages = Math.ceil(vipAds.length / 6);
  const paginatedVipAds = useMemo(() => {
    const start = vipAdsPage * 6;
    return vipAds.slice(start, start + 6);
  }, [vipAds, vipAdsPage]);

  // Compute "General Ads" (العرض العام): أحدث الإعلانات أولاً مرتبة زمنياً بوضوح وثبات 100%
  const totalGeneralPages = Math.ceil(filterAds.length / 6);
  const paginatedGeneralAds = useMemo(() => {
    if (filterAds.length === 0) return [];

    // الترتيب الأولوية للأحدث زمنياً أولاً مع إبراز الإعلانات المتميزة
    const sorted = [...filterAds].sort((a, b) => {
      const timeA = getAdTimestamp(a);
      const timeB = getAdTimestamp(b);
      if (timeA !== timeB) return timeB - timeA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    return sorted.slice(0, visibleGeneralAdsCount);
  }, [filterAds, visibleGeneralAdsCount]);

  // Category specific paginated ads
  const totalCategoryAdsPages = Math.ceil(filterAds.length / 8);
  const categoryAdsPageItems = useMemo(() => {
    const start = categoryAdsPage * 8;
    return filterAds.slice(start, start + 8);
  }, [filterAds, categoryAdsPage]);

  const totalCategoryProductsPages = Math.ceil(filterProds.length / 8);
  const categoryProductsPageItems = useMemo(() => {
    const start = categoryProductsPage * 8;
    return filterProds.slice(start, start + 8);
  }, [filterProds, categoryProductsPage]);

  const showAds = contentTab==='ads'||contentTab==='all';
  const showProds = contentTab==='products'||contentTab==='all';

  const canViewFullDirectory = user?.role === 'admin' || user?.role === 'owner' || user?.isVerified;
  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull To Refresh Indicator Banner */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isRefreshing ? 52 : pullDistance, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="overflow-hidden flex items-center justify-center py-2 sticky top-0 z-50 pointer-events-none"
          >
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black shadow-xl border backdrop-blur-md transition-all ${
              isDarkMode 
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-amber-500/10' 
                : 'bg-amber-100 text-amber-900 border-amber-300 shadow-amber-500/10'
            }`}>
              <RefreshCw className={`w-4 h-4 text-amber-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing 
                  ? 'جاري البحث عن إعلانات جديدة...' 
                  : pullDistance > 55 
                    ? 'اترك السحب الآن للتحديث ✨' 
                    : 'اسحب لأسفل لتحديث الإعلانات'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero (Only shown in search/category mode, hidden in General Feed mode) */}
      {cat !== 'general' && (
      <section 
        id="hero-landing-section" 
        className={`pt-4 sm:pt-6 pb-2 relative overflow-hidden transition-all duration-700 ${
          isDarkMode 
            ? 'bg-black' 
            : 'bg-[#F5F5F7]'
        }`}
      >
        {/* Subtle Apple-style Ambient Mesh Gradient Background */}
        {isDarkMode ? (
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40">
            <div className="absolute w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen -top-[200px] -left-[200px]" />
            <div className="absolute w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[100px] mix-blend-screen top-[100px] right-[0px]" />
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-60">
            <div className="absolute w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply -top-[200px] -left-[200px]" />
            <div className="absolute w-[600px] h-[600px] bg-rose-400/10 rounded-full blur-[100px] mix-blend-multiply top-[100px] right-[0px]" />
          </div>
        )}

        <div className="container mx-auto px-0 sm:px-6 relative z-10">
          <div className="text-center w-full max-w-6xl mx-auto mb-2">
            <div className="mb-4">
              {/* VIP Ads Banners Slider (Apple TV+ Style) */}
              {vipAds.length > 0 && (
                <div className="w-full" dir="rtl">
                  <HorizontalCarousel 
                    items={vipAds}
                    lazyLoad={true}
                    initialVisibleCount={5}
                    renderItem={(ad) => (
                      <div 
                        onClick={() => onSelectAd(ad)}
                        className="relative group w-[320px] sm:w-[450px] md:w-[600px] aspect-[21/9] shrink-0 rounded-3xl overflow-hidden cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)] transition-all duration-700"
                      >
                        {/* Soft Hover Overlay */}
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent z-20 transition-colors duration-700 pointer-events-none" />
                        
                        <ImageWithDataSaver 
                          src={
                            (!ad.images?.[0] || ad.images[0].includes('photo-1523275335684') || ad.images[0].includes('watch') || ad.images[0].includes('photo-1558618666')) 
                              ? getAdCategoryPlaceholderImage(ad.category, `${ad.title}`) 
                              : ad.images[0]
                          } 
                          fallback={getAdCategoryPlaceholderImage(ad.category, `${ad.title}`)}
                          alt={ad.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          loading="lazy"
                        />
                        
                        {/* Minimal VIP Badge */}
                        <div className="absolute top-4 right-4 z-20 backdrop-blur-xl bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                          <Crown className="w-3.5 h-3.5" />
                          <span>VIP</span>
                        </div>
                        
                        {/* Premium Text Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 sm:p-8 pt-20 z-10 text-right">
                          <h3 className="text-white text-lg sm:text-2xl md:text-3xl font-black tracking-tight truncate drop-shadow-md">{ad.title}</h3>
                          <p className="text-white/90 text-sm sm:text-lg font-bold mt-1.5 drop-shadow">{formatPrice(ad.price)}</p>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Search Bar Container */}
          <div id="hero-search-wrapper" className="max-w-3xl mx-auto mb-4 relative z-30 px-4 sm:px-0" dir="rtl">
            <div className={`relative rounded-2xl sm:rounded-full border flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 sm:p-2 gap-2 sm:gap-0 transition-all duration-500 backdrop-blur-2xl ${
              isDarkMode 
                ? 'bg-[#1c1c1e]/80 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' 
                : 'bg-white/90 border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
            }`}>
              {/* Input section */}
              <div className="flex-1 relative flex items-center">
                <Search className={`absolute right-4 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input 
                  id="hero-search-input"
                  value={localSearch} 
                  onChange={e => { setLocalSearch(e.target.value); setShowSuggestions(true); }} 
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      saveRecentSearch(localSearch);
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="ابحث عن سيارة، هاتف، عقار..."
                  className={`w-full bg-transparent rounded-full py-3 sm:py-3.5 pr-12 pl-4 outline-none text-base sm:text-lg font-medium transition-colors duration-500 ${
                    isDarkMode ? 'text-white placeholder-gray-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
                {localSearch && (
                  <button 
                    id="hero-search-clear-btn"
                    onClick={() => { setLocalSearch(''); setSuggestions([]); }} 
                    className={`absolute left-3 p-1.5 rounded-full transition-colors ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Vertical divider on desktop */}
              <div className={`hidden sm:block h-8 w-[1px] mx-2 self-center shrink-0 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

              {/* Action Buttons Section */}
              <div className="flex items-center gap-2 px-1 pb-1 sm:pb-0" dir="rtl">
                {/* Search Button */}
                <button
                  onClick={() => {
                    saveRecentSearch(localSearch);
                    setShowSuggestions(false);
                  }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-full font-bold text-sm sm:text-base transition-all ${
                    isDarkMode
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  بحث
                </button>
              </div>

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && (localSearch.trim() || recentSearches.length > 0 || CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'general').length > 0) && (
                  <>
                    <div className="fixed inset-0 z-30 cursor-default" onClick={() => setShowSuggestions(false)} />
                    <div className={`absolute top-full right-0 left-0 mt-3 border rounded-2xl shadow-2xl z-40 overflow-hidden py-2 max-h-80 overflow-y-auto backdrop-blur-xl ${
                      isDarkMode ? 'bg-black/95 border-gray-750/70' : 'bg-white border-slate-200'
                    }`} dir="rtl">
                      
                      {!localSearch.trim() && recentSearches.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> عمليات البحث الأخيرة</span>
                          </div>
                          {recentSearches.map((recent, index) => (
                            <div key={`recent-${index}`} className={`flex items-center justify-between px-4 py-2 transition-colors group ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'}`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLocalSearch(recent);
                                  saveRecentSearch(recent);
                                  setShowSuggestions(false);
                                }}
                                className={`flex-1 text-right text-sm font-bold transition-colors flex items-center gap-2.5 ${
                                  isDarkMode ? 'text-gray-300 group-hover:text-amber-400' : 'text-slate-700 group-hover:text-amber-600'
                                }`}
                              >
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-bold truncate">{recent}</span>
                              </button>
                              <button 
                                onClick={(e) => removeRecentSearch(recent, e)}
                                className={`p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-md ${
                                  isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/5'
                                }`}
                                title="إزالة"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!localSearch.trim() && CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'general').length > 0 && (
                        <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-800/40' : 'border-slate-100'}`}>
                          <div className="px-4 py-2 flex items-center gap-1.5 text-xs font-bold text-gray-400">
                            <Tag className="w-3.5 h-3.5" /> الفئات الشائعة
                          </div>
                          <div className="px-4 py-2 flex flex-wrap gap-2">
                            {CATEGORIES.filter(c => ['cars', 'real-estate', 'phones', 'electronics'].includes(c.id)).map(c => (
                              <button
                                key={`pop-cat-${c.id}`}
                                onClick={() => {
                                  setCat(c.id);
                                  setShowSuggestions(false);
                                }}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isDarkMode 
                                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/30' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/20'
                                }`}
                              >
                                <span>{c.emoji}</span>
                                <span>{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {localSearch.trim() && suggestions.length > 0 && (
                        <div>
                           <div className="px-4 py-2 text-xs font-bold text-gray-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5"/> اقتراحات البحث
                           </div>
                           {suggestions.map((suggestion, index) => (
                              <button
                                key={`sugg-${index}`}
                                type="button"
                                onClick={() => {
                                  setLocalSearch(suggestion);
                                  saveRecentSearch(suggestion);
                                  setShowSuggestions(false);
                                }}
                                className={`w-full text-right px-4 py-3 text-xs sm:text-sm transition-colors flex items-center gap-2.5 border-b last:border-0 ${
                                  isDarkMode 
                                    ? 'text-gray-200 hover:bg-amber-500/15 hover:text-amber-400 border-gray-800/40' 
                                    : 'text-slate-800 hover:bg-amber-500/10 hover:text-amber-600 border-slate-100'
                                }`}
                              >
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-bold truncate">{suggestion}</span>
                              </button>
                            ))}
                        </div>
                      )}

                      {localSearch.trim() && suggestions.length === 0 && (
                         <div className="px-4 py-6 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                            <SearchIcon className="w-6 h-6 opacity-50 mb-1" />
                            لا توجد نتائج مطابقة لـ <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>"{localSearch}"</span>
                            <span className="text-xs mt-1 block">جرب كلمات بحث مختلفة أو عامة أكثر</span>
                         </div>
                      )}
                    </div>
                  </>
                )}
            </div>
          </div>
          {!search ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
            >
              {cat === 'general' ? null : (
                <>
              <div id="hero-categories-tabs" className="flex overflow-x-auto scrollbar-hide gap-3 mb-8 py-2 px-4 relative z-20 max-w-4xl mx-auto touch-pan-x flex-nowrap justify-start sm:justify-center">
                {CATEGORIES.filter(c => c.id !== 'games').map(c => {
                  const IconComp = CATEGORY_ICONS[c.id];
                  const isGeneral = c.id === 'general';
                  const isSelected = cat === c.id;
                  return (
                    <motion.button 
                      id={`cat-btn-${c.id}`}
                      key={c.id} 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => setCat(c.id)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 relative shrink-0 ${
                        isSelected 
                          ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                          : isGeneral
                            ? 'text-amber-500'
                            : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-black hover:bg-black/5')
                      }`}
                    >
                      {IconComp ? (
                        <IconComp 
                          set="bulk" 
                          primaryColor={
                            isSelected 
                              ? (isDarkMode ? '#000' : '#fff') 
                              : isGeneral ? '#f59e0b' : (isDarkMode ? '#9ca3af' : '#6b7280')
                          } 
                          size="small" 
                        />
                      ) : null}
                      <span>{c.name}</span>
                    </motion.button>
                  );
                })}
              </div>


              {/* Action Row: Transport & Install App */}
              <div id="hero-action-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto relative z-20">
                {/* Transport Section card */}
                <motion.button 
                  id="hero-transport-card-btn"
                  whileHover={{ y: -2 }}
                  onClick={() => onTransportClick?.()}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group text-right ${
                    isDarkMode 
                      ? 'bg-gray-900/50 hover:bg-gray-800/80 shadow-md' 
                      : 'bg-white hover:bg-gray-50/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-emerald-500/25' : 'bg-emerald-500/10'}`}>
                      <Car className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>👑 قسم الخطوط والتوصيل</p>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>نقل يومي مباشر للطلاب والموظفين</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
                </motion.button>

                {/* Install PWA section card */}
                {!isStandalone && onInstallClick ? (
                  <motion.button 
                    id="hero-install-card-btn"
                    whileHover={{ y: -2 }}
                    onClick={onInstallClick}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group text-right ${
                      isDarkMode 
                        ? 'bg-gray-900/50 hover:bg-gray-800/80 shadow-md' 
                        : 'bg-white hover:bg-gray-50/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-500/10'}`}>
                        <Smartphone className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>📲 تثبيت التطبيق</p>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-amber-300/90' : 'text-amber-700'}`}>ثبّت "سوق بغداد" كـ PWA على جهازك مباشرة</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-amber-500 group-hover:-translate-x-1 transition-transform" />
                  </motion.button>
                ) : null}
              </div>
              </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center justify-center relative z-20"
            >
              <div className={`border rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3 animate-pulse ${
                isDarkMode ? 'bg-black/60 border-gray-700/50' : 'bg-white border-slate-200'
              }`}>
                <SearchIcon className="w-5 h-5 text-amber-500" />
                <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                  وضع البحث مفعل.. <span className="text-amber-500 font-extrabold">امسح البحث</span> لإظهار الأقسام والأزرار
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Baghdad Skyline Vector Backdrop */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-24 pointer-events-none select-none z-0 transition-opacity duration-500 ${
          isDarkMode ? 'opacity-15' : 'opacity-10'
        }`}>
          <CityOutline className="w-full h-full" />
        </div>
      </section>
      )}

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filter bar */}
          {(cat !== 'general' && (cat !== 'all' || contentTab === 'profiles' || contentTab === 'transport')) && (
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Content type tabs - ONLY show on homepage 'all' */}
                {cat === 'all' ? (
                  <div className="flex bg-gray-100 dark:bg-gray-900 rounded-full p-1 gap-1 overflow-x-auto scrollbar-hide max-w-full">
                    {([['all','الكل'],['ads','📢 إعلانات'],['products','🛍️ منتجات'],['profiles','👤 حسابات'],['transport','🚌 الخطوط']] as [string,string][]).map(([t,l])=>(
                      <button 
                        key={t} 
                        onClick={()=>setContentTab(t as any)} 
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                          contentTab===t
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2" dir="rtl">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">تصفح النتائج</span>
                  </div>
                )}

                {/* Selectors and Action Buttons */}
                <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
                  {/* Governorate Select */}
                  <select 
                    value={gov} 
                    onChange={e=>setGov(e.target.value)} 
                    className="bg-white dark:bg-gray-900 text-slate-800 dark:text-white font-bold rounded-full px-4 py-2 border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 text-xs outline-none transition-all duration-300 cursor-pointer min-w-[110px] shadow-sm" 
                    title="المحافظة" 
                    aria-label="المحافظة"
                  >
                    {IRAQI_GOVERNORATES.map(g=><option key={g} className="bg-white dark:bg-black text-slate-800 dark:text-white">{g}</option>)}
                  </select>

                  {/* Sort Select */}
                  <select 
                    value={sort} 
                    onChange={e=>setSort(e.target.value as any)} 
                    className="bg-white dark:bg-gray-900 text-slate-800 dark:text-white font-bold rounded-full px-4 py-2 border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 text-xs outline-none transition-all duration-300 cursor-pointer min-w-[120px] shadow-sm" 
                    title="الترتيب" 
                    aria-label="الترتيب"
                  >
                    <option value="recent" className="bg-white dark:bg-black text-slate-800 dark:text-white">الأحدث</option>
                    <option value="views" className="bg-white dark:bg-black text-slate-800 dark:text-white">الأكثر مشاهدة</option>
                    <option value="price-low" className="bg-white dark:bg-black text-slate-800 dark:text-white">السعر: من الأقل</option>
                    <option value="price-high" className="bg-white dark:bg-black text-slate-800 dark:text-white">السعر: من الأعلى</option>
                  </select>

                  {/* Advanced Filters Button */}
                  <button 
                    onClick={()=>setShowFilters(!showFilters)} 
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 shadow-sm ${
                      showFilters
                        ? 'bg-amber-500 text-black border-amber-500 shadow-amber-500/20'
                        : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5"/>
                    <span>فلاتر</span>
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-1">
                    <button 
                      onClick={()=>setViewMode('grid')} 
                      className={`p-1.5 rounded-full transition-all duration-300 ${viewMode==='grid'?'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm':'text-gray-500 hover:text-black dark:hover:text-white'}`} 
                      title="عرض شبكي" 
                    >
                      <Grid className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={()=>setViewMode('list')} 
                      className={`p-1.5 rounded-full transition-all duration-300 ${viewMode==='list'?'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm':'text-gray-500 hover:text-black dark:hover:text-white'}`} 
                      title="عرض قائمة" 
                    >
                      <List className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="overflow-hidden"
                  dir="rtl"
                >
                  <div className="pt-4 mt-4 border-t border-gray-700/80">
                    <p className="text-amber-400 text-xs font-bold mb-3 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>شريط الفلاتر المتقدمة والخيارات الذكية</span>
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-gray-750/35">
                      {/* 1. Condition selection */}
                      <div className="flex flex-col gap-2">
                        <label className="text-gray-300 text-xs font-bold">الحالة (جديد / مستعمل):</label>
                        <div className="flex bg-gray-850 p-1 rounded-lg border border-gray-750 max-w-xs">
                          <button
                            type="button"
                            onClick={() => setConditionFilter('all')}
                            className={`flex-1 text-center py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                              conditionFilter === 'all' 
                                ? 'bg-amber-500 text-black shadow-md' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => setConditionFilter('new')}
                            className={`flex-1 text-center py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                              conditionFilter === 'new' 
                                ? 'bg-amber-500 text-black shadow-md' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            جديد ✨
                          </button>
                          <button
                            type="button"
                            onClick={() => setConditionFilter('used')}
                            className={`flex-1 text-center py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                              conditionFilter === 'used' 
                                ? 'bg-amber-500 text-black shadow-md' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            مستعمل 🏷️
                          </button>
                        </div>
                      </div>

                      {/* 2. Price Range */}
                      <div className="flex flex-col gap-2">
                        <label className="text-gray-300 text-xs font-bold">نطاق السعر (د.ع):</label>
                        <div className="flex items-center gap-2 max-w-sm">
                          <div className="relative flex-1">
                            <input 
                              value={fmt(priceMin)} 
                              onChange={e => setPriceMin(fmt(e.target.value))} 
                              placeholder="من (0)" 
                              className="w-full bg-gray-850 text-white placeholder-gray-500 rounded-lg py-1.5 pr-3 pl-10 border border-gray-700 outline-none text-xs focus:border-amber-500/50 transition-colors"
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">د.ع</span>
                          </div>
                          <span className="text-gray-500 text-xs">-</span>
                          <div className="relative flex-1">
                            <input 
                              value={fmt(priceMax)} 
                              onChange={e => setPriceMax(fmt(e.target.value))} 
                              placeholder="إلى (بلا حد)" 
                              className="w-full bg-gray-850 text-white placeholder-gray-500 rounded-lg py-1.5 pr-3 pl-10 border border-gray-700 outline-none text-xs focus:border-amber-500/50 transition-colors"
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">د.ع</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-750/30">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                        <span>يتم تطبيق الفلترة تلقائياً فوراً دون إعادة تحميل الصفحة</span>
                      </span>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setPriceMin('');
                          setPriceMax('');
                          setConditionFilter('all');
                          setGov('الكل');
                        }} 
                        className="px-3.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-500/20"
                      >
                        إعادة تعيين الفلاتر
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}

          {isInitialLoading ? (
            <div className="space-y-8" dir="rtl">
              <div className="flex items-center justify-between mb-4 bg-black/20 p-4 rounded-2xl border border-gray-800/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  <div className="h-5 bg-gray-800 rounded-md w-48 animate-pulse" />
                </div>
                <div className="h-4 bg-gray-800 rounded-md w-24 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <SkeletonCard key={idx} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {contentTab === 'profiles' && null}
              {contentTab === 'transport' && null}

              {contentTab !== 'profiles' && contentTab !== 'transport' && (
                <>
                  {/* CASE 1: HOME PAGE (الرئيسية) */}
                  {cat === 'all' && !search.trim() && (
                    <div className="space-y-12">
                      {/* 1. Latest Ads (أحدث الإعلانات / المنتجات) Section */}
                      {(latestAds.length > 0 || latestProducts.length > 0) && (
                        <div className={`border-y border-x-0 sm:border rounded-none sm:rounded-3xl py-5 px-0 sm:p-5 md:p-6 backdrop-blur-sm shadow-xl -mx-4 sm:mx-0 transition-all duration-500 ${
                          isDarkMode 
                            ? 'bg-black/40 border-gray-800/80 shadow-black/20' 
                            : 'bg-white border-slate-200/80 shadow-slate-100/50'
                        }`}>
                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b pb-4 px-4 sm:px-0 transition-all duration-500 ${
                            isDarkMode ? 'border-gray-800/60' : 'border-slate-100'
                          }`} dir="rtl">
                            <div className="flex flex-col gap-1">
                              <h2 className={`text-lg font-black flex items-center gap-2 transition-colors duration-500 ${
                                isDarkMode ? 'text-white' : 'text-black'
                              }`}>
                                <span className="text-amber-500">✨</span>
                                {homeToggleType === 'ads' ? 'أحدث الإعلانات المبوبة' : 'أحدث المنتجات والمتاجر'} 
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold transition-all duration-500 ${
                                  isDarkMode 
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                    : 'bg-red-50 text-red-600 border-red-100'
                                }`}>خلال 24 ساعة</span>
                              </h2>
                              <p className={`text-xs transition-colors duration-500 ${
                                isDarkMode ? 'text-gray-400' : 'text-slate-500 font-medium'
                              }`}>تطبيق التصفية فوري وسلس دون الحاجة لإعادة تحميل الصفحة</p>
                            </div>

                            {/* Segmented Toggle Buttons */}
                            <div className={`flex p-1 rounded-2xl shrink-0 self-start sm:self-auto shadow-inner border transition-all duration-500 ${
                              isDarkMode 
                                ? 'bg-black/60 border-gray-800' 
                                : 'bg-slate-100 border-slate-200'
                            }`}>
                              <button
                                onClick={() => setHomeToggleType('ads')}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 ${
                                  homeToggleType === 'ads'
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20'
                                    : isDarkMode 
                                      ? 'text-gray-400 hover:text-white' 
                                      : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                <span>📢</span>
                                <span>الإعلانات المبوبة</span>
                              </button>
                              <button
                                onClick={() => setHomeToggleType('products')}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 ${
                                  homeToggleType === 'products'
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20'
                                    : isDarkMode 
                                      ? 'text-gray-400 hover:text-white' 
                                      : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                <span>🛍️</span>
                                <span>المنتجات والمتاجر</span>
                              </button>
                            </div>

                            <button 
                              onClick={() => {
                                if (homeToggleType === 'ads') {
                                  setCat('general'); setContentTab('ads');
                                } else {
                                  setContentTab('products');
                                }
                              }}
                              className={`text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ${
                                isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
                              }`}
                            >
                              العرض العام &gt;
                            </button>
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={homeToggleType}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              {homeToggleType === 'ads' ? (
                                latestAds.length === 0 ? (
                                  <div className="text-center py-10">
                                    <div className="text-4xl mb-3">⏳</div>
                                    <p className="text-gray-400 text-sm font-bold">لا توجد إعلانات جديدة خلال الـ 24 ساعة الماضية</p>
                                    <p className="text-gray-650 text-xs mt-1">ستظهر الإعلانات الجديدة هنا تلقائياً فور نشرها</p>
                                  </div>
                                ) : (
                                  <HorizontalCarousel 
                                    items={latestAds}
                                    renderItem={(ad) => {
                                      const seller = storedUsers?.find(u => u.id === ad.postedBy);
                                      return (
                                        <AdCard 
                                          ad={ad} 
                                          onSelect={() => onSelectAd(ad)} 
                                          isFav={favorites.includes(ad.id)}
                                          onFav={e => { e.stopPropagation(); if (!user) { onRequireAuth(); return; } onToggleFav(ad.id); }}
                                          onSellerClick={(id) => { if (id) onSellerClick(id); }}
                                          onActionMenu={e => { e.preventDefault(); if (user && (user.id === ad.postedBy || user.role === "admin" || user.role === "owner")) onActionMenu?.({ type: "ad", item: ad }); }}
                                          sellerRole={seller?.role}
                                          compact={true}
                                        />
                                      );
                                    }}
                                  />
                                )
                              ) : (
                                latestProducts.length === 0 ? (
                                  <div className="text-center py-10 text-gray-400 text-sm">لا توجد منتجات نشطة حالياً</div>
                                ) : (
                                  <HorizontalCarousel 
                                    items={latestProducts}
                                    renderItem={(p) => {
                                      const seller = storedUsers?.find(u => u.id === p.postedBy);
                                      return (
                                        <ProductCard 
                                          product={p} 
                                          onSelect={() => onSelectProduct(p)} 
                                          isFav={favorites.includes(p.id)}
                                          onFav={e => { e.stopPropagation(); if (!user) { onRequireAuth(); return; } onToggleFav(p.id); }}
                                          onSellerClick={(id) => { if (id) onSellerClick(id); }}
                                          onActionMenu={e => { e.preventDefault(); if (user && (user.id === p.postedBy || user.role === "admin" || user.role === "owner")) onActionMenu?.({ type: "product", item: p }); }}
                                          sellerRole={seller?.role}
                                          compact={true}
                                        />
                                      );
                                    }}
                                  />
                                )
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      )}


                    </div>
                  )}

                  {/* CASE 2: GENERAL FEED (العرض العام - تصفح مثل فيسبوك) */}
                  {cat === 'general' && (
                    <div className="space-y-6 max-w-2xl mx-auto" dir="rtl">
                      {/* Feed Header - Thin Strip with Subtitle Explanation */}
                      <div className={`border rounded-2xl py-2.5 px-4 flex items-center justify-between shadow-md transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-900/90 border-gray-800/80' 
                          : 'bg-white border-slate-200/80 shadow-slate-100'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">📢</span>
                            <h2 className={`text-sm sm:text-base font-black transition-colors ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              العرض العام
                            </h2>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                              isDarkMode 
                                ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>الصفحة الرئيسية</span>
                          </div>
                          <p className={`text-[11px] font-medium mt-1 pr-6 transition-colors ${
                            isDarkMode ? 'text-gray-400' : 'text-slate-500'
                          }`}>تصفح جميع المنشورات والإعلانات الرقمية في سوق بغداد مباشرة</p>
                        </div>
                        <button 
                          onClick={() => setShowSearchPage?.(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold rounded-full text-xs shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>بحث</span>
                        </button>
                      </div>

                      {filterAds.length === 0 ? (
                        <div className={`text-center py-20 rounded-3xl border ${isDarkMode ? 'bg-black/60 border-gray-800' : 'bg-white border-slate-200'}`}>
                          <p className="text-5xl mb-4">📢</p>
                          <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>لا توجد إعلانات عامة حالياً</h3>
                          <p className="text-gray-400 text-xs">تأكد من فلاتر البحث أو أعد المحاولة لاحقاً</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {paginatedGeneralAds.map(ad => {
                            const seller = storedUsers?.find(u => u.id === ad.postedBy);
                            const isFav = favorites.includes(ad.id);
                            const isOnline = ad.postedBy ? !!onlineStatuses[ad.postedBy] : false;
                            const adTime = getAdTimestamp(ad);
                            const isRecent = adTime > 0 && (Date.now() - adTime) <= 24 * 60 * 60 * 1000;
                            return (
                              <motion.div 
                                key={`fb-feed-${ad.id}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden group transition-all duration-500 ${
                                  isDarkMode 
                                    ? 'bg-black/60 border border-gray-800/80 backdrop-blur-sm' 
                                    : 'bg-white border border-slate-200/80 shadow-slate-100/50'
                                }`}
                              >
                                {/* Header block */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="relative cursor-pointer" onClick={() => ad.postedBy && onSellerClick(ad.postedBy)}>
                                      <img loading="lazy" decoding="async"
                                        src={seller?.avatar || ad.seller?.avatar || DEFAULT_AVATAR} 
                                        alt="" 
                                        className={`w-11 h-11 rounded-full object-cover border ${seller?.role ? getGlowClass(seller.role) : 'border-gray-700'}`} 
                                      />
                                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span 
                                          onClick={() => ad.postedBy && onSellerClick(ad.postedBy)}
                                          className={`text-sm font-bold transition-colors cursor-pointer ${
                                            isDarkMode ? 'text-white hover:text-amber-400' : 'text-black hover:text-amber-600'
                                          }`}
                                        >
                                          {seller?.name || ad.seller?.name || 'مستخدم'}
                                        </span>
                                        {seller?.isVerified && (
                                          <span className="text-gray-400 bg-gray-800/10 px-1.5 py-0.5 rounded-md border border-gray-800/20 text-[9px] font-bold flex items-center gap-0.5">
                                            <VerifiedBadge className="w-2.5 h-2.5" /> موثوق
                                          </span>
                                        )}
                                      </div>
                                      <div className={`flex items-center gap-2 text-[10px] mt-0.5 font-medium transition-colors duration-500 ${
                                        isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                      }`}>
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-amber-500/80" /> {ad.governorate || ad.location || 'العراق'}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          <TimeAgo iso={ad.createdAtISO} />
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Top action context menu / Favorites shortcut */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!user) { onRequireAuth(); return; }
                                        onToggleFav(ad.id);
                                      }}
                                      className={`p-2 rounded-xl border transition-all ${
                                        isFav 
                                          ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                          : isDarkMode 
                                            ? 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:text-white'
                                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-black'
                                      }`}
                                    >
                                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                                    </button>
                                    {user && (user.id === ad.postedBy || user.role === "admin" || user.role === "owner") && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          onActionMenu?.({ type: "ad", item: ad });
                                        }}
                                        className={`p-2 rounded-xl transition-all ${
                                          isDarkMode 
                                            ? 'bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:text-white'
                                            : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-black'
                                        }`}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Title & Description body */}
                                <div className="space-y-1.5 cursor-pointer" onClick={() => onSelectAd(ad)}>
                                  <h3 className={`text-base font-black transition-colors ${
                                    isDarkMode ? 'text-white group-hover:text-amber-300' : 'text-black group-hover:text-amber-600'
                                  }`}>
                                    {ad.title}
                                  </h3>
                                  {ad.description && (
                                    <p className={`text-xs sm:text-sm leading-relaxed line-clamp-3 transition-colors duration-500 ${
                                      isDarkMode ? 'text-gray-300' : 'text-slate-600'
                                    }`}>
                                      {ad.description}
                                    </p>
                                  )}
                                </div>

                                {/* Media Attachment */}
                                {ad.images && ad.images.length > 0 && (
                                  <div 
                                    className={`relative rounded-2xl overflow-hidden aspect-[16/9] cursor-pointer transition-all duration-500 ${
                                      isDarkMode ? 'border border-gray-800 bg-black/20' : 'border border-slate-200 bg-slate-50'
                                    }`}
                                    onClick={() => onSelectAd(ad)}
                                  >
                                    <img 
                                      src={ad.images[0]} 
                                      alt="" 
                                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" 
                                    />
                                    {ad.images.length > 1 && (
                                      <div className="absolute bottom-3 left-3 bg-black/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/30 shadow-md">
                                        + {ad.images.length - 1} صور إضافية
                                      </div>
                                    )}

                                    {/* Price Tag Overlay */}
                                    {ad.price && (
                                      <div className="absolute top-3 right-3 bg-amber-500 text-black text-xs font-black px-3 py-1.5 rounded-xl shadow-lg border border-amber-400/40 font-mono">
                                        {formatPrice(ad.price)}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Engagement Metrics & Fast Interaction Buttons */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-800/60 mt-1">
                                  <div className={`flex items-center gap-4 text-xs font-bold transition-colors duration-500 ${
                                    isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                  }`}>
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-4 h-4 text-gray-500" /> {ad.views || 0} مشاهدة
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Heart className="w-4 h-4 text-red-500/80" /> {isFav ? 'مضاف للمفضلة' : 'غير مضاف'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {ad.phone && (
                                      <>
                                        <motion.a
                                          href={`tel:${ad.phone}`}
                                          whileHover={{ scale: 1.03 }}
                                          whileTap={{ scale: 0.97 }}
                                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/15 hover:bg-gray-800/25 border border-gray-800/30 text-gray-400 hover:text-white rounded-xl text-xs font-black transition-all"
                                        >
                                          <Phone className="w-3.5 h-3.5" /> اتصال
                                        </motion.a>
                                        <motion.a
                                          href={getWhatsAppLink(ad.phone, 'product', ad)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          whileHover={{ scale: 1.03 }}
                                          whileTap={{ scale: 0.97 }}
                                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-black hover:bg-emerald-600 rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/10"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" /> واتساب
                                        </motion.a>
                                      </>
                                    )}
                                    <motion.button
                                      onClick={() => handleUniversalShare(ad)}
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 hover:from-amber-500/20 hover:to-yellow-500/15 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-black transition-all shadow-sm active:scale-[0.98]"
                                    >
                                      <Share2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                      <span>مشاركة</span>
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}

                          <InfiniteScrollTrigger
                            hasMore={visibleGeneralAdsCount < filterAds.length || hasMoreAds}
                            isLoading={loadingMoreAds}
                            onLoadMore={async () => {
                              if (visibleGeneralAdsCount < filterAds.length) {
                                setVisibleGeneralAdsCount(prev => {
                                  const next = prev + 6;
                                  if (next >= filterAds.length && !hasMoreAds) {
                                    playSound('admin');
                                    window.dispatchEvent(new CustomEvent('app-toast', { detail: { msg: '🎉 ممتاز! لقد أكملت تصفح جميع الإعلانات المتاحة.', type: 'success' } }));
                                  }
                                  return next;
                                });
                              } else if (hasMoreAds) {
                                await onLoadMoreAds();
                                setVisibleGeneralAdsCount(prev => prev + 6);
                              }
                            }}
                            loadingText="جاري تحميل المزيد من الإعلانات العامة..."
                            skeletonType="feed"
                            skeletonCount={2}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CASE 3: ISOLATED CATEGORY OR GENERAL SEARCH */}
                  {(cat !== 'all' && cat !== 'general' || (cat === 'all' && search.trim().length > 0)) && (
                    <div className="space-y-6">
                      {/* Category Header Card */}
                      <div className="bg-black/40 border border-gray-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
                        <div className="space-y-1">
                          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                            {cat === 'all' ? (
                                <>
                                  <span>🔍</span>
                                  نتائج البحث
                                </>
                            ) : (
                                <>
                                  <span>{CATEGORIES.find(c => c.id === cat)?.emoji || '📦'}</span>
                                  إعلانات {CATEGORIES.find(c => c.id === cat)?.name || 'الفئة'}
                                </>
                            )}
                          </h2>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {cat === 'all' ? `عرض النتائج المطابقة لبحثك عن "${search}" في جميع الأقسام.` : `تصفح أحدث عروض ${CATEGORIES.find(c => c.id === cat)?.name} الحصرية في العراق مرتبة حسب الأكثر مشاهدة.`}
                          </p>
                        </div>
                        <div className="bg-amber-500/15 border border-amber-500/25 px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0 self-start md:self-auto">
                          <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                          <span className="text-amber-400 text-xs font-black">
                            تم العثور على {filterAds.length + filterProds.length} إعلان متاح
                          </span>
                        </div>
                      </div>

                      {/* Grid rendering ads or products strictly */}
                      {filterAds.length === 0 && filterProds.length === 0 ? (
                        <div className="text-center py-24 bg-black/40 rounded-3xl border border-gray-800" dir="rtl">
                          <div className="text-5xl mb-4">🔍</div>
                          <h3 className="text-xl font-bold text-white mb-2">لا توجد إعلانات حالياً</h3>
                          <p className="text-gray-400 text-sm">جرب ضبط فلاتر البحث أو تصفح في وقت آخر</p>
                        </div>
                      ) : (
                        <div className="space-y-10">
                          {/* Category Ads */}
                          {filterAds.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-gray-800/80 pb-2" dir="rtl">
                                <span className="text-amber-400 text-sm">📢</span>
                                <h3 className="text-white font-bold text-sm">إعلانات المعروضة ({filterAds.length})</h3>
                              </div>
                              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                                {categoryAdsPageItems.slice(0, visibleCategoryAdsCount).map(ad => {
                                  const seller = storedUsers?.find(u => u.id === ad.postedBy);
                                  return (
                                    <AdCard 
                                      key={`cat-ad-${ad.id}`} 
                                      ad={ad} 
                                      onSelect={() => onSelectAd(ad)} 
                                      isFav={favorites.includes(ad.id)}
                                      onFav={e => { e.stopPropagation(); if (!user) { onRequireAuth(); return; } onToggleFav(ad.id); }}
                                      onSellerClick={(id) => { if (id) onSellerClick(id); }}
                                      onActionMenu={e => { e.preventDefault(); if (user && (user.id === ad.postedBy || user.role === "admin" || user.role === "owner")) onActionMenu?.({ type: "ad", item: ad }); }}
                                      sellerRole={seller?.role}
                                    />
                                  );
                                })}
                              </div>
                              
                              {visibleCategoryAdsCount < categoryAdsPageItems.length && (
                                <InfiniteScrollTrigger
                                  hasMore={true}
                                  isLoading={loadingMoreAds}
                                  onLoadMore={async () => {
                                    setVisibleCategoryAdsCount(prev => Math.min(prev + 4, 8));
                                  }}
                                  loadingText="جاري تحميل المزيد من الإعلانات في هذه الصفحة..."
                                  skeletonType="grid"
                                  skeletonCount={4}
                                />
                              )}

                              <PaginationDots 
                                total={totalCategoryAdsPages} 
                                current={categoryAdsPage} 
                                onChange={handleCategoryAdsPageChange} 
                                hasMore={hasMoreAds}
                                onLoadMore={onLoadMoreAds}
                                loadingMore={loadingMoreAds}
                              />
                            </div>
                          )}

                          {/* Category Products */}
                          {filterProds.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 border-b border-gray-800/80 pb-2" dir="rtl">
                                <span className="text-emerald-400 text-sm">🛍️</span>
                                <h3 className="text-white font-bold text-sm">المنتجات والمتاجر ({filterProds.length})</h3>
                              </div>
                              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                                {categoryProductsPageItems.slice(0, visibleCategoryProdsCount).map(p => {
                                  const seller = storedUsers?.find(u => u.id === p.postedBy);
                                  return (
                                    <ProductCard 
                                      key={`cat-prod-${p.id}`} 
                                      product={p} 
                                      onSelect={() => onSelectProduct(p)} 
                                      isFav={favorites.includes(p.id)}
                                      onFav={e => { e.stopPropagation(); if (!user) { onRequireAuth(); return; } onToggleFav(p.id); }}
                                      onSellerClick={(id) => { if (id) onSellerClick(id); }}
                                      onActionMenu={e => { e.preventDefault(); if (user && (user.id === p.postedBy || user.role === "admin" || user.role === "owner")) onActionMenu?.({ type: "product", item: p }); }}
                                      sellerRole={seller?.role}
                                    />
                                  );
                                })}
                              </div>
                              
                              {visibleCategoryProdsCount < categoryProductsPageItems.length && (
                                <InfiniteScrollTrigger
                                  hasMore={true}
                                  isLoading={loadingMoreProducts}
                                  onLoadMore={async () => {
                                    setVisibleCategoryProdsCount(prev => Math.min(prev + 4, 8));
                                  }}
                                  loadingText="جاري تحميل المزيد من المنتجات في هذه الصفحة..."
                                  skeletonType="grid"
                                  skeletonCount={4}
                                />
                              )}

                              <PaginationDots 
                                total={totalCategoryProductsPages} 
                                current={categoryProductsPage} 
                                onChange={handleCategoryProductsPageChange} 
                                hasMore={hasMoreProducts}
                                onLoadMore={onLoadMoreProducts}
                                loadingMore={loadingMoreProducts}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Transport Lines */}
              {contentTab === 'transport' && (
            <div className="mb-8">
              {filteredTransport.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🚌</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد خطوط مطابقة</h3>
                  <p className="text-gray-400 text-sm">جرب البحث بكلمات أخرى أو تصفح قسم الخطوط الكامل</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      يتم عرض {Math.min(visibleTransportCount, filteredTransport.length)} من أصل {filteredTransport.length}
                    </h3>
                  </div>
                  {filteredTransport.slice(0, visibleTransportCount).map(ad => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onSelectTransportAd?.(ad)}
                      className={`bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer hover:border-emerald-500/60 ${
                        ad.type === 'offer' ? 'border-emerald-500/30' : 'border-amber-500/30'
                      }`}
                    >
                      {/* Type Badge */}
                      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold ${
                        ad.type === 'offer' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'
                      }`}>
                        {ad.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'}
                      </div>

                      <div className="p-4 pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                              {ad.university}
                            </h3>
                            <p className="text-gray-400 text-sm flex items-center gap-1.5 leading-relaxed">
                              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>المناطق: <span className="text-white">{ad.regions}</span></span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          <div className="bg-black rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">الدوام</p>
                            <p className="text-white font-bold text-xs">{ad.shift}</p>
                          </div>
                          {ad.type === 'offer' && (
                            <div className="bg-black rounded-xl p-2 text-center">
                              <p className="text-gray-400 text-[10px]">المقاعد</p>
                              <p className="text-emerald-400 font-bold text-xs">{ad.seats} <span className="text-gray-500 font-normal">متاح</span></p>
                            </div>
                          )}
                          <div className="bg-black rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">الفئة</p>
                            <p className="text-white font-bold text-xs">{ad.targetAudience}</p>
                          </div>
                          <div className="bg-black rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">المركبة</p>
                            <p className="text-white font-bold text-xs">{ad.vehicleType}</p>
                          </div>
                        </div>

                        {ad.price && (
                          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-3 bg-amber-500/10 px-3 py-2 rounded-lg inline-flex">
                            <Tag className="w-4 h-4" />
                            <span>السعر المفضل: {formatPrice(ad.price)} د.ع</span>
                          </div>
                        )}

                        {ad.note && (
                          <p className="text-gray-300 text-xs mb-4 bg-black/50 rounded-xl p-3 border border-gray-700/50">{ad.note}</p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <img
                              src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-gray-600"
                            />
                            <div>
                              <span className="text-gray-300 text-xs block font-semibold">{ad.sellerName}</span>
                              <span className="text-gray-500 text-[10px] block">
                                <TimeAgo iso={ad.createdAt} />
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.a
                              href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type === 'offer' ? 'خط متوفر' : 'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e: any) => e.stopPropagation()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> واتساب
                            </motion.a>
                            <motion.button
                              onClick={(e: any) => { e.stopPropagation(); handleUniversalShare({ id: ad.id, university: ad.university, type: ad.type, regions: ad.regions, price: ad.price }); }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 hover:from-amber-500/20 hover:to-yellow-500/15 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-black transition-all shadow-sm active:scale-[0.98]"
                            >
                              <Share2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>مشاركة</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
                <InfiniteScrollTrigger
                  hasMore={visibleTransportCount < filteredTransport.length}
                  onLoadMore={async () => { setVisibleTransportCount(prev => prev + 4); }}
                  loadingText="جاري تحميل المزيد من الخطوط..."
                  skeletonType="transport"
                  skeletonCount={2}
                />
              </div>
            )}

          {/* Profiles Hub */}
          {contentTab === 'profiles' && (
            <div className="mb-8 space-y-6">
              {/* Accounts Dedicated Search & Header Banner */}
              {canViewFullDirectory ? (
              <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-5 rounded-3xl border border-gray-700 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>👤 دليل الحسابات والتجار الموثوقين</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {filteredProfiles.length} حساب
                      </span>
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">تصفح وابحث عن كبار التجار والشركاء والمستخدمين وتواصل معهم مباشرة</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                  <input
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    placeholder="ابحث عن حساب باسم المستخدم أو رقم الهاتف (077...)"
                    className="w-full bg-black/80 text-white placeholder-gray-400 rounded-2xl py-3.5 pr-12 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-base shadow-inner"
                  />
                  {localSearch && (
                    <button onClick={() => { setLocalSearch(''); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded-lg">
                      مسح
                    </button>
                  )}
                </div>
              </div>
            ) : null}

              {/* FEATURED TOP SELLERS SLIDER (If no search active and featured exist) */}
              {!search && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>⭐ كبار التجار والحسابات الأكثر نشاطاً</span>
                    </span>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth">
                    {storedUsers.filter(u => u.isVerified || (u.adCount + (u.prodCount || 0)) > 0).sort((a,b) => ((b.adCount||0)+(b.prodCount||0)) - ((a.adCount||0)+(a.prodCount||0))).slice(0, visibleTopSellers).map(topUser => {
                      const isOnline = !!onlineStatuses[topUser.id];
                      return (
                        <motion.div
                          key={`top-${topUser.id}`}
                          whileHover={{ y: -4, scale: 1.02 }}
                          onClick={() => onSellerClick(topUser.id, 'accounts')}
                          className="flex-shrink-0 w-64 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-4 border border-amber-500/40 shadow-lg cursor-pointer relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative shrink-0">
                              <img loading="lazy" decoding="async" src={topUser.avatar} alt="" className={`w-12 h-12 rounded-full object-cover ${topUser.role && topUser.role !== 'user' ? getGlowClass(topUser.role) : 'border-2 border-amber-400'}`} />
                              <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-transparent shadow-sm shadow-[#0c2b5e]/10 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'أوفلاين'} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <h4 className="text-white font-bold text-sm truncate">{topUser.name}</h4>
                                {topUser.isVerified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-amber-300 font-medium block">⭐ 4.9 تاجر مميز</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center bg-black/60 rounded-xl p-2 border border-gray-800">
                            <div>
                              <span className="text-[10px] text-gray-400 block">الإعلانات</span>
                              <span className="text-xs font-bold text-white">{topUser.adCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">المنتجات</span>
                              <span className="text-xs font-bold text-amber-400">{topUser.prodCount || 0}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ALL PROFILES GRID */}
              {canViewFullDirectory ? (
                <>
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-black/60 rounded-3xl border border-gray-800">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد حسابات مطابقة للبحث</h3>
                  <p className="text-gray-400 text-sm">جرب البحث باسم آخر أو تأكد من رقم الهاتف المدخل</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedProfiles.map(profile => {
                    const isOnline = Boolean((user && (String(profile.id) === String(user.id) || String(profile.phone) === String(user.phone))) || onlineStatuses[profile.id] || onlineStatuses[profile.phone]);
                    return (
                      <motion.div
                        key={profile.id}
                        whileHover={{ y: -4 }}
                        onClick={() => onSellerClick(profile.id, 'accounts')}
                        className="bg-gray-800 hover:bg-gray-800/90 rounded-2xl p-4 border border-gray-700/80 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between shadow-md group"
                      >
                        <div className="flex items-start gap-3.5 mb-3">
                          <div className="relative shrink-0">
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className={`w-14 h-14 rounded-full object-cover transition-all ${profile.role && profile.role !== 'user' ? getGlowClass(profile.role) : 'border-2 border-gray-700 group-hover:border-amber-400'}`}
                            />
                            <div 
                              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 flex items-center justify-center ${
                                isOnline ? 'bg-green-500 ring-2 ring-green-500/30' : 'bg-gray-500'
                              }`} 
                              title={isOnline ? 'متصل الآن' : 'غير متصل'}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h3 className="text-white font-bold text-sm truncate group-hover:text-amber-300 transition-colors">{profile.name}</h3>
                              {profile.isVerified && (
                                <span className="bg-gray-800/20 text-gray-400 border border-gray-800/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <VerifiedBadge className="w-3 h-3" /> موثوق
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-700 text-gray-400'}`}>
                                {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                              </span>
                              <span className="text-gray-400 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-400" /> {profile.location || 'بغداد'}
                              </span>
                            </div>

                            {profile.phone && (
                              <p className="text-gray-400 text-xs flex items-center gap-1.5 font-mono">
                                <PhoneIcon className="w-3 h-3 text-emerald-400" />
                                <span>{profile.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-bold bg-black/80 px-2 py-1 rounded-lg border border-gray-700/50">
                              📢 {profile.adCount || 0} إعلان
                            </span>
                            {(profile.prodCount || 0) > 0 && (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                🛍️ {profile.prodCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {profile.phone && (
                              <a
                                href={`https://wa.me/964${profile.phone.replace(/^0/, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all shadow-md shadow-green-500/10"
                                title="مراسلة واتساب"
                              >
                                <MessageSquare className="w-3 h-3" /> مراسلة
                              </a>
                            )}
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                              الملف <ChevronLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              <InfiniteScrollTrigger
                hasMore={visibleProfilesCount < filteredProfiles.length}
                onLoadMore={async () => { setVisibleProfilesCount(prev => prev + 4); }}
                loadingText="جاري تحميل المزيد من الحسابات..."
                skeletonType="profile"
                skeletonCount={3}
              />
                </>
              ) : (
                <div className="bg-black/50 border border-gray-800 rounded-3xl p-8 text-center mt-8">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                    <span className="text-3xl">👋</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">أهلاً بك في دليل الحسابات</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    نحن نسعد بتواجدك معنا! لرؤية الدليل الشامل والتواصل مع كافة التجار والحسابات، يرجى توثيق حسابك أولاً للحفاظ على مجتمع آمن وموثوق.
                  </p>
                  <a href="https://wa.me/9647700028170" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    تواصل معنا للتوثيق
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Empty */}
          {contentTab !== 'profiles' && ((showAds&&filterAds.length===0)||(showProds&&filterProds.length===0))&&filterAds.length===0&&filterProds.length===0&&(
            <div className="text-center py-20"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3><p className="text-gray-400 text-sm">جرب تغيير الفلاتر أو كلمة البحث</p></div>
          )}
        </>
      )}
    </div>
  </section>

      {/* Games */}
      <section className="hidden py-12 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6"><span className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full mb-3"><Gamepad2 className="w-4 h-4 text-amber-400"/><span className="text-amber-400 text-sm font-semibold">قسم الترفيه</span></span>
            <h2 className="text-2xl font-bold text-white">🎮 الألعاب الترفيهية</h2></div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {GAMES_DATA.map(g=><motion.div key={g.id} whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/20 cursor-pointer hover:bg-white/20">
              <div className="text-3xl mb-1">{g.emoji}</div><h3 className="text-white text-xs font-bold">{g.title}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-300 text-[10px] mt-1"><Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400"/>{g.rating}</div>
            </motion.div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
