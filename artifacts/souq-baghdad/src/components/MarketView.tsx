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
import { DEFAULT_AVATAR } from '../App';

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
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';
import { CityOutline } from '../assets/svg/logo/city-outline';
import { LionOutline } from '../assets/svg/logo/lion-outline';
import { BackgroundGrid } from '../assets/svg/background/background-grid';
import { GoldParticles } from '../assets/svg/effects/gold-particles';

function PaginationDots({ 
  total, 
  current, 
  onChange 
}: { 
  total: number; 
  current: number; 
  onChange: (page: number) => void; 
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6 mb-8" dir="rtl">
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = idx === current;
        return (
          <motion.button
            key={idx}
            onClick={() => onChange(idx)}
            className={`transition-all duration-300 rounded-full h-3 ${
              isActive 
                ? 'bg-[#fbbf24] w-9 shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
                : 'bg-white/20 hover:bg-white/40 w-3'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={`الصفحة ${idx + 1}`}
            aria-label={`الصفحة ${idx + 1}`}
          />
        );
      })}
    </div>
  );
}

function HorizontalCarousel({ 
  items, 
  renderItem 
}: { 
  items: any[]; 
  renderItem: (item: any, idx: number) => React.ReactNode 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const maxScroll = containerRef.current.scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const currentScroll = Math.abs(scrollLeft);
    const index = Math.min(
      items.length - 1,
      Math.max(0, Math.round((currentScroll / containerRef.current.scrollWidth) * items.length))
    );
    setActiveIndex(index);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollToItem = (idx: number) => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const cardWidth = el.scrollWidth / items.length;
    // Scroll RTL-aware
    const isRtl = document.dir === 'rtl' || true;
    const targetScroll = isRtl ? - (cardWidth * idx) : (cardWidth * idx);
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setActiveIndex(idx);
  };

  return (
    <div className="relative w-full overflow-hidden" dir="rtl">
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-3 px-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="flex-none w-[75%] sm:w-[45%] md:w-[30%] lg:w-[23.5%] snap-start">
            {renderItem(item, idx)}
          </div>
        ))}
      </div>
      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToItem(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-350 ${
              activeIndex === idx 
                ? 'bg-[#fbbf24] w-5 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function MarketView({ 
  user, allAds, allProducts, favorites, storedUsers: propStoredUsers, 
  onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, 
  onTransportClick, onSelectTransportAd, transportLines, onActionMenu,
  isStandalone, onInstallClick,
  search, setSearch, cat, setCat, gov, setGov, sort, setSort, 
  priceMin, setPriceMin, priceMax, setPriceMax,
  hasMoreAds, hasMoreProducts, onLoadMoreAds, onLoadMoreProducts,
  totalAdsCount, totalProductsCount,
  loadingMoreAds, loadingMoreProducts, isInitialLoading
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
}) {
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [homeToggleType, setHomeToggleType] = useState<'ads' | 'products'>('ads');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<'all'|'new'|'used'>('all');
  const [latestAdsPage, setLatestAdsPage] = useState(0);
  const [vipAdsPage, setVipAdsPage] = useState(0);
  const [generalAdsPage, setGeneralAdsPage] = useState(0);
  const [visibleGeneralAdsCount, setVisibleGeneralAdsCount] = useState(4);
  const [productsPage, setProductsPage] = useState(0);
  const [visibleProfilesCount, setVisibleProfilesCount] = useState(4);
  const [visibleTransportCount, setVisibleTransportCount] = useState(4);
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
        setCat('all');
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
      targetHash = cat !== 'all' ? `#/category/${cat}` : '#/';
    }

    if (window.location.hash !== targetHash && !window.location.hash.includes('/ad/') && !window.location.hash.includes('/seller/')) {
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
    let isMounted = true;
    async function loadAllProfiles() {
      try {
        const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const sellersMap = new globalThis.Map();

        // Fetch registered profiles from DB
        const { data: dbProfiles } = await supabase.from('profiles').select('id, full_name, avatar_url, phone, city, created_at, role').limit(200);
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
    return allAds.filter(a => {
      if (a.status === 'sold') return false;
      if (cat === 'general') return true;
      if (conditionFilter === 'all') return true;
      const text = `${a.title} ${a.description || ''}`.toLowerCase();
      const isUsed = text.includes('مستعمل') || text.includes('مستعملة') || text.includes('مستخدم') || text.includes('بالة') || text.includes('ثاني يد');
      const isNew = text.includes('جديد') || text.includes('جديدة') || text.includes('كارتون') || text.includes('بالكارتون') || text.includes('غير مستخدم') || text.includes('جديده');
      if (conditionFilter === 'new') {
        if (isUsed && !isNew) return false;
        return true;
      } else { // 'used'
        if (isNew && !isUsed) return false;
        return true;
      }
    });
  }, [allAds, conditionFilter]);

  const filterProds = useMemo(() => {
    return allProducts.filter(p => {
      if (p.status === 'sold') return false;
      if (cat === 'general') return true;
      if (conditionFilter === 'all') return true;
      return p.condition === conditionFilter;
    });
  }, [allProducts, conditionFilter]);

  // Auto-reset page numbers back to 0 when query/filters update to prevent out-of-bounds pages
  useEffect(() => {
    setLatestAdsPage(0);
    setVipAdsPage(0);
    setGeneralAdsPage(0);
    setVisibleGeneralAdsCount(4);
    setProductsPage(0);
  }, [cat, search, gov, priceMin, priceMax, sort, conditionFilter]);

  // Compute "Latest Ads" (منشور خلال الـ 24 ساعة الماضية)
  const latestAds = useMemo(() => {
    const now = Date.now();
    const limit = 24 * 60 * 60 * 1000;
    return filterAds
      .filter(a => {
        if (!a.createdAtISO) return false;
        const diff = now - new Date(a.createdAtISO).getTime();
        return diff > 0 && diff <= limit;
      })
      .sort((a, b) => new Date(b.createdAtISO!).getTime() - new Date(a.createdAtISO!).getTime());
  }, [filterAds]);

  const latestProducts = useMemo(() => {
    const now = Date.now();
    const limit = 24 * 60 * 60 * 1000;
    return filterProds
      .filter(p => {
        if (!p.createdAtISO) return false;
        const diff = now - new Date(p.createdAtISO).getTime();
        return diff > 0 && diff <= limit;
      })
      .sort((a, b) => new Date(b.createdAtISO!).getTime() - new Date(a.createdAtISO!).getTime());
  }, [filterProds]);

  const totalLatestPages = Math.ceil(latestAds.length / 4);
  const paginatedLatestAds = useMemo(() => {
    const start = latestAdsPage * 4;
    return latestAds.slice(start, start + 4);
  }, [latestAds, latestAdsPage]);

  // Compute "VIP Ads" (إعلانات الحسابات الموثقة)
  const vipAds = useMemo(() => {
    return filterAds.filter(a => {
      const isSellerVerified = a.seller?.isVerified;
      const sellerProfile = storedUsers.find(u => u.id === a.postedBy);
      const isProfileVerified = sellerProfile?.isVerified || sellerProfile?.verified;
      const isPremiumRole = sellerProfile?.role === 'owner' || sellerProfile?.role === 'admin' || sellerProfile?.role === 'vendor';
      return isSellerVerified || isProfileVerified || isPremiumRole || (a.seller?.rating && a.seller.rating >= 4.9);
    });
  }, [filterAds, storedUsers]);

  const totalVipPages = Math.ceil(vipAds.length / 4);
  const paginatedVipAds = useMemo(() => {
    const start = vipAdsPage * 4;
    return vipAds.slice(start, start + 4);
  }, [vipAds, vipAdsPage]);

  // Compute "General Ads" Pagination
  const totalGeneralPages = Math.ceil(filterAds.length / 4);
  const paginatedGeneralAds = useMemo(() => {
    return filterAds.slice(0, visibleGeneralAdsCount);
  }, [filterAds, visibleGeneralAdsCount]);

  // Category specific paginated ads
  const paginatedCategoryAds = useMemo(() => {
    const start = generalAdsPage * 4;
    return filterAds.slice(start, start + 4);
  }, [filterAds, generalAdsPage]);

  // Compute "Products" Pagination
  const totalProductsPages = Math.ceil(filterProds.length / 4);
  const paginatedProducts = useMemo(() => {
    const start = productsPage * 4;
    return filterProds.slice(start, start + 4);
  }, [filterProds, productsPage]);

  const showAds = contentTab==='ads'||contentTab==='all';
  const showProds = contentTab==='products'||contentTab==='all';

  const canViewFullDirectory = user?.role === 'admin' || user?.role === 'owner' || user?.isVerified;
  return (
    <div>
      {/* Hero */}
      <section id="hero-landing-section" className="bg-gradient-to-br from-[#070b19] via-[#0c1a3a] to-[#050c1e] py-14 sm:py-20 relative overflow-hidden border-b border-gray-800/40">
        {/* Background Grid & Particles Decoration */}
        <BackgroundGrid className="absolute inset-0 opacity-[0.12] mix-blend-color-dodge w-full h-full object-cover pointer-events-none" />
        <GoldParticles className="absolute inset-0 opacity-30 pointer-events-none w-full h-full" />
        
        {/* Ambient Radial Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        {/* Floating Majestic Babylonian Lion (Backdrop Corner decoration) */}
        <div className="absolute -top-16 -right-16 w-80 h-80 opacity-[0.08] pointer-events-none text-amber-400 select-none">
          <LionOutline className="w-full h-full" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            {/* Top Interactive Badge */}
            <motion.div 
              id="hero-badge"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/5 border border-amber-500/25 text-amber-400 text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.06)] mb-6 cursor-default"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>أول منصة متكاملة للإعلانات والمتاجر في العراق</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              id="hero-main-title"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white always-white tracking-tight leading-tight mb-4"
            >
              كل ما تحتاجه في <span className="bg-gradient-to-r from-[#fdf5a6] via-[#d4af37] to-[#b8860b] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)]">سوق بغداد</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p 
              id="hero-sub-title"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-300 always-white text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
            >
              تصفّح آلاف الإعلانات والمنتجات الحصرية، وتسوق بكل ثقة وأمان من أفضل الحسابات والمتاجر الموثقة في جميع المحافظات العراقية.
            </motion.p>
          </div>

          {/* Search Bar Container */}
          <div id="hero-search-wrapper" className="max-w-2xl mx-auto mb-8 relative z-30 group" dir="rtl">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-yellow-600/30 rounded-[22px] blur-md opacity-25 group-hover:opacity-40 transition duration-300 pointer-events-none" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 gap-2 sm:gap-0">
              {/* Input section */}
              <div className="flex-1 relative flex items-center">
                <Search className="absolute right-4 w-5 h-5 text-amber-400" />
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
                  placeholder="ابحث عن سيارة، هاتف، عقار، منتج في العراق..."
                  className="w-full bg-transparent text-white placeholder-gray-400 rounded-xl py-3 sm:py-3.5 pr-12 pl-4 outline-none text-base font-medium"
                />
                {localSearch && (
                  <button 
                    id="hero-search-clear-btn"
                    onClick={() => { setLocalSearch(''); setSuggestions([]); }} 
                    className="absolute left-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-2.5 py-1 rounded-lg text-xs transition-colors"
                  >
                    مسح
                  </button>
                )}

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && (localSearch.trim() || recentSearches.length > 0 || CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'general').length > 0) && (
                  <>
                    <div className="fixed inset-0 z-30 cursor-default" onClick={() => setShowSuggestions(false)} />
                    <div className="absolute top-full right-0 left-0 mt-3 bg-gray-900/95 backdrop-blur-xl border border-gray-750/70 rounded-2xl shadow-2xl z-40 overflow-hidden py-2 max-h-80 overflow-y-auto" dir="rtl">
                      
                      {!localSearch.trim() && recentSearches.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> عمليات البحث الأخيرة</span>
                          </div>
                          {recentSearches.map((recent, index) => (
                            <div key={`recent-${index}`} className="flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 transition-colors group">
                              <button
                                type="button"
                                onClick={() => {
                                  setLocalSearch(recent);
                                  setSearch(recent);
                                  saveRecentSearch(recent);
                                  setShowSuggestions(false);
                                }}
                                className="flex-1 text-right text-sm text-gray-300 group-hover:text-amber-400 transition-colors flex items-center gap-2.5"
                              >
                                <Search className="w-4 h-4 text-gray-500 shrink-0" />
                                <span className="font-bold truncate">{recent}</span>
                              </button>
                              <button 
                                onClick={(e) => removeRecentSearch(recent, e)}
                                className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-500/10"
                                title="إزالة"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!localSearch.trim() && CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'general').length > 0 && (
                        <div className="pt-2 border-t border-gray-800/40">
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
                                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs font-bold text-gray-300 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center gap-1.5"
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
                                  setSearch(suggestion);
                                  saveRecentSearch(suggestion);
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-right px-4 py-3 text-xs sm:text-sm text-gray-200 hover:bg-amber-500/15 hover:text-amber-400 transition-colors flex items-center gap-2.5 border-b border-gray-800/40 last:border-0"
                              >
                                <Search className="w-4 h-4 text-gray-500 shrink-0" />
                                <span className="font-bold truncate">{suggestion}</span>
                              </button>
                            ))}
                        </div>
                      )}

                      {localSearch.trim() && suggestions.length === 0 && (
                         <div className="px-4 py-6 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                            <SearchIcon className="w-6 h-6 opacity-50 mb-1" />
                            لا توجد نتائج مطابقة لـ <span className="font-bold text-white">"{localSearch}"</span>
                            <span className="text-xs mt-1 block">جرب كلمات بحث مختلفة أو عامة أكثر</span>
                         </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Vertical divider on desktop */}
              <div className="hidden sm:block h-8 w-[1px] bg-gray-800/80 mx-2 self-center shrink-0" />

              {/* Sorting Dropdown container */}
              <div className="relative shrink-0 flex items-center px-2 sm:px-1" dir="rtl">
                <motion.button
                  id="hero-search-sort-dropdown-trigger"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-750/50 text-gray-300 hover:text-white text-xs md:text-sm font-bold transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span className="whitespace-nowrap">
                      {sort === 'price-low' ? 'السعر: من الأقل إلى الأعلى' : 
                       sort === 'price-high' ? 'السعر: من الأعلى إلى الأقل' :
                       sort === 'views' ? 'الأكثر مشاهدة' : 'الأحدث'}
                    </span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isSortOpen && (
                    <>
                      {/* Backdrop overlay to close dropdown */}
                      <div className="fixed inset-0 z-35" onClick={() => setIsSortOpen(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 right-0 sm:right-auto sm:left-0 mt-2 sm:w-56 bg-gray-950/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl z-40 overflow-hidden"
                      >
                        <div className="py-1 text-right" dir="rtl">
                          <button
                            onClick={() => { setSort('recent'); setIsSortOpen(false); }}
                            className={`w-full text-right px-4 py-2.5 text-xs md:text-sm transition-colors flex items-center justify-between ${
                              sort === 'recent' ? 'bg-amber-500/10 text-amber-400 font-extrabold' : 'text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            <span>الأحدث</span>
                            {sort === 'recent' && <span className="text-amber-400 font-bold">✓</span>}
                          </button>
                          <button
                            onClick={() => { setSort('views'); setIsSortOpen(false); }}
                            className={`w-full text-right px-4 py-2.5 text-xs md:text-sm transition-colors flex items-center justify-between ${
                              sort === 'views' ? 'bg-amber-500/10 text-amber-400 font-extrabold' : 'text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            <span>الأكثر مشاهدة</span>
                            {sort === 'views' && <span className="text-amber-400 font-bold">✓</span>}
                          </button>
                          <button
                            onClick={() => { setSort('price-low'); setIsSortOpen(false); }}
                            className={`w-full text-right px-4 py-2.5 text-xs md:text-sm transition-colors flex items-center justify-between ${
                              sort === 'price-low' ? 'bg-amber-500/10 text-amber-400 font-extrabold' : 'text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            <span>السعر: من الأقل إلى الأعلى</span>
                            {sort === 'price-low' && <span className="text-amber-400 font-bold">✓</span>}
                          </button>
                          <button
                            onClick={() => { setSort('price-high'); setIsSortOpen(false); }}
                            className={`w-full text-right px-4 py-2.5 text-xs md:text-sm transition-colors flex items-center justify-between ${
                              sort === 'price-high' ? 'bg-amber-500/10 text-amber-400 font-extrabold' : 'text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            <span>السعر: من الأعلى إلى الأقل</span>
                            {sort === 'price-high' && <span className="text-amber-400 font-bold">✓</span>}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Categories Grid/Horizontal Badges */}
          <div id="hero-categories-tabs" className="flex flex-wrap justify-center gap-2 mb-8 relative z-20 max-w-4xl mx-auto">
            {CATEGORIES.filter(c => c.id !== 'games').map(c => (
              <motion.button 
                id={`cat-btn-${c.id}`}
                key={c.id} 
                whileHover={{ y: -2, scale: 1.03 }} 
                whileTap={{ scale: 0.97 }} 
                onClick={() => setCat(c.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 ${
                  cat === c.id 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-400 shadow-[0_4px_15px_rgba(212,175,55,0.25)] font-black' 
                    : 'bg-gray-900/60 text-gray-300 border-gray-800 backdrop-blur-md hover:border-gray-700 hover:text-white hover:bg-gray-900/85'
                }`}
              >
                <span className="text-base sm:text-lg">{c.emoji}</span>
                <span>{c.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Quick Metrics Cards */}
          <div id="hero-metrics-grid" className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-8 relative z-20">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3.5 text-center flex flex-col justify-center">
              <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">18</p>
              <p className="text-gray-400 text-[11px] font-bold mt-1">محافظة عراقية مغطاة</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3.5 text-center flex flex-col justify-center">
              <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalAdsCount || 2040}+</p>
              <p className="text-gray-400 text-[11px] font-bold mt-1">إعلان معروض حالياً</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3.5 text-center col-span-2 md:col-span-1 flex flex-col justify-center">
              <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">24/7</p>
              <p className="text-gray-400 text-[11px] font-bold mt-1">خدمة ومتابعة مباشرة</p>
            </div>
          </div>

          {/* Live Visitor Counter */}
          <div className="mb-6 relative z-20">
            <LiveVisitorCounter />
          </div>

          {/* Action Row: Transport & Install App */}
          <div id="hero-action-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto relative z-20">
            {/* Transport Section card */}
            <motion.button 
              id="hero-transport-card-btn"
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => onTransportClick?.()}
              className="w-full flex items-center justify-between px-5 py-4 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/35 rounded-2xl transition-all group text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-500/25 rounded-xl flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">🚌 قسم الخطوط والتوصيل</p>
                  <p className="text-emerald-300 text-xs mt-0.5">نقل يومي مباشر للطلاب والموظفين</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            </motion.button>

            {/* Install PWA section card */}
            {!isStandalone && onInstallClick ? (
              <motion.button 
                id="hero-install-card-btn"
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={onInstallClick}
                className="w-full flex items-center justify-between px-5 py-4 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 rounded-2xl transition-all group text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">📲 تثبيت التطبيق</p>
                    <p className="text-amber-300/90 text-xs mt-0.5">ثبّت "سوق بغداد" كـ PWA على جهازك مباشرة</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
              </motion.button>
            ) : null}
          </div>
        </div>

        {/* Baghdad Skyline Vector Backdrop */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-24 opacity-15 pointer-events-none select-none z-0">
          <CityOutline className="w-full h-full" />
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filter bar */}
          {(cat !== 'general' && (cat !== 'all' || contentTab === 'profiles' || contentTab === 'transport')) && (
            <div className="bg-gray-900/40 border border-gray-800/80 backdrop-blur-md rounded-3xl p-4 mb-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Content type tabs - ONLY show on homepage 'all' */}
              {cat === 'all' ? (
                <div className="flex bg-gray-950/60 border border-gray-850 rounded-2xl p-1 gap-1 overflow-x-auto scrollbar-hide max-w-full">
                  {([['all','الكل'],['ads','📢 إعلانات'],['products','🛍️ منتجات'],['profiles','👤 حسابات'],['transport','🚌 الخطوط']] as [string,string][]).map(([t,l])=>(
                    <button 
                      key={t} 
                      onClick={()=>setContentTab(t as any)} 
                      className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                        contentTab===t
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2" dir="rtl">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-gray-300 text-xs font-black">خيارات التصفية الذكية والترتيب</span>
                </div>
              )}

              {/* Selectors and Action Buttons */}
              <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
                {/* Governorate Select */}
                <select 
                  value={gov} 
                  onChange={e=>setGov(e.target.value)} 
                  className="bg-gray-950/60 hover:bg-gray-900/80 text-white font-bold rounded-xl px-3.5 py-2 border border-gray-800 hover:border-amber-500/30 text-xs outline-none transition-all duration-300 cursor-pointer min-w-[110px]" 
                  title="المحافظة" 
                  aria-label="المحافظة"
                >
                  {IRAQI_GOVERNORATES.map(g=><option key={g} className="bg-gray-900 text-white">{g}</option>)}
                </select>

                {/* Sort Select */}
                <select 
                  value={sort} 
                  onChange={e=>setSort(e.target.value as any)} 
                  className="bg-gray-950/60 hover:bg-gray-900/80 text-white font-bold rounded-xl px-3.5 py-2 border border-gray-800 hover:border-amber-500/30 text-xs outline-none transition-all duration-300 cursor-pointer min-w-[120px]" 
                  title="الترتيب" 
                  aria-label="الترتيب"
                >
                  <option value="recent" className="bg-gray-900 text-white">الأحدث</option>
                  <option value="views" className="bg-gray-900 text-white">الأكثر مشاهدة</option>
                  <option value="price-low" className="bg-gray-900 text-white">السعر: من الأقل</option>
                  <option value="price-high" className="bg-gray-900 text-white">السعر: من الأعلى</option>
                </select>

                {/* Advanced Filters Button */}
                <button 
                  onClick={()=>setShowFilters(!showFilters)} 
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black border transition-all duration-300 ${
                    showFilters
                      ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-gray-950/60 hover:bg-gray-900/80 text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5"/>
                  <span>فلاتر</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-950/60 border border-gray-850 rounded-xl p-0.5">
                  <button 
                    onClick={()=>setViewMode('grid')} 
                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode==='grid'?'bg-amber-500 text-black shadow-sm shadow-amber-500/5':'text-gray-500 hover:text-white'}`} 
                    title="عرض شبكي" 
                    aria-label="عرض شبكي"
                  >
                    <Grid className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={()=>setViewMode('list')} 
                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode==='list'?'bg-amber-500 text-black shadow-sm shadow-amber-500/5':'text-gray-500 hover:text-white'}`} 
                    title="عرض قائمة" 
                    aria-label="عرض قائمة"
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/40 p-4 rounded-xl border border-gray-750/35">
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
              <div className="flex items-center justify-between mb-4 bg-gray-900/20 p-4 rounded-2xl border border-gray-800/40">
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
                        <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-5 md:p-6 backdrop-blur-sm shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-gray-800/60 pb-4" dir="rtl">
                            <div className="flex flex-col gap-1">
                              <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <span className="text-amber-400">✨</span>
                                {homeToggleType === 'ads' ? 'أحدث الإعلانات المبوبة' : 'أحدث المنتجات والمتاجر'} 
                                <span className="text-xs bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full border border-red-500/20 font-bold">خلال 24 ساعة</span>
                              </h2>
                              <p className="text-gray-400 text-xs">تطبيق التصفية فوري وسلس دون الحاجة لإعادة تحميل الصفحة</p>
                            </div>

                            {/* Segmented Toggle Buttons */}
                            <div className="flex bg-gray-950/60 border border-gray-800 p-1 rounded-2xl shrink-0 self-start sm:self-auto shadow-inner">
                              <button
                                onClick={() => setHomeToggleType('ads')}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 ${
                                  homeToggleType === 'ads'
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20'
                                    : 'text-gray-400 hover:text-white'
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
                                    : 'text-gray-400 hover:text-white'
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
                              className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                            >
                              عرض الكل &gt;
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
                                    <p className="text-gray-600 text-xs mt-1">ستظهر الإعلانات الجديدة هنا تلقائياً فور نشرها</p>
                                  </div>
                                ) : (
                                  <HorizontalCarousel 
                                    items={latestAds.slice(0, 12)}
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
                                    items={latestProducts.slice(0, 12)}
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

                      {/* 2. VIP Ads (إعلانات VIP المميزة) Section */}
                      {vipAds.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-500/5 via-gray-900/40 to-amber-900/5 border border-amber-500/20 rounded-3xl p-5 md:p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
                          <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                          
                          <div className="flex items-center justify-between mb-5 border-b border-amber-500/10 pb-3" dir="rtl">
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                              <span className="text-amber-400">👑</span>
                              إعلانات VIP <span className="text-xs bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/20 font-bold">الحسابات الموثقة</span>
                            </h2>
                            <span className="text-gray-500 text-xs font-bold">أولوية العرض</span>
                          </div>

                          <HorizontalCarousel 
                            items={vipAds.slice(0, 12)}
                            renderItem={(ad) => {
                              const seller = storedUsers?.find(u => u.id === ad.postedBy);
                              return (
                                <div className="relative group">
                                  <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                  <AdCard 
                                    ad={ad} 
                                    onSelect={() => onSelectAd(ad)} 
                                    isFav={favorites.includes(ad.id)}
                                    onFav={e => { e.stopPropagation(); if (!user) { onRequireAuth(); return; } onToggleFav(ad.id); }}
                                    onSellerClick={(id) => { if (id) onSellerClick(id); }}
                                    onActionMenu={e => { e.preventDefault(); if (user && (user.id === ad.postedBy || user.role === "admin" || user.role === "owner")) onActionMenu?.({ type: "ad", item: ad }); }}
                                    sellerRole={seller?.role || 'vendor'}
                                  />
                                </div>
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CASE 2: GENERAL FEED (العرض العام - تصفح مثل فيسبوك) */}
                  {cat === 'general' && (
                    <div className="space-y-6 max-w-2xl mx-auto" dir="rtl">
                      {/* Feed Header */}
                      <div className="bg-[#0c2b5e]/40 border border-gray-800 rounded-3xl p-4 flex items-center justify-between shadow-xl">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                          <span>👥</span>
                          العرض العام <span className="text-xs bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/20 font-bold">تصفح مثل فيسبوك</span>
                        </h2>
                        <span className="text-gray-400 text-xs font-bold">خوارزمية تفاعلية ناجحة</span>
                      </div>

                      {filterAds.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/40 rounded-3xl border border-gray-800">
                          <p className="text-5xl mb-4">📢</p>
                          <h3 className="text-lg font-bold text-white mb-1">لا توجد إعلانات عامة حالياً</h3>
                          <p className="text-gray-400 text-xs">تأكد من فلاتر البحث أو أعد المحاولة لاحقاً</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {paginatedGeneralAds.map(ad => {
                            const seller = storedUsers?.find(u => u.id === ad.postedBy);
                            const isFav = favorites.includes(ad.id);
                            const isOnline = ad.postedBy ? !!onlineStatuses[ad.postedBy] : false;
                            return (
                              <motion.div 
                                key={`fb-feed-${ad.id}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900/60 border border-gray-800 rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden group"
                              >
                                {/* Header block */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="relative cursor-pointer" onClick={() => ad.postedBy && onSellerClick(ad.postedBy)}>
                                      <img 
                                        src={seller?.avatar || ad.seller?.avatar || DEFAULT_AVATAR} 
                                        alt="" 
                                        className={`w-11 h-11 rounded-full object-cover border ${seller?.role ? getGlowClass(seller.role) : 'border-gray-700'}`} 
                                      />
                                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span 
                                          onClick={() => ad.postedBy && onSellerClick(ad.postedBy)}
                                          className="text-white text-sm font-bold hover:text-amber-400 transition-colors cursor-pointer"
                                        >
                                          {seller?.name || ad.seller?.name || 'مستخدم'}
                                        </span>
                                        {seller?.isVerified && (
                                          <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20 text-[9px] font-bold flex items-center gap-0.5">
                                            <VerifiedBadge className="w-2.5 h-2.5" /> موثوق
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-400 text-[10px] mt-0.5 font-medium">
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
                                          : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:text-white'
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
                                        className="p-2 rounded-xl bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:text-white transition-all"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Title & Description body */}
                                <div className="space-y-1.5 cursor-pointer" onClick={() => onSelectAd(ad)}>
                                  <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                                    {ad.title}
                                  </h3>
                                  {ad.description && (
                                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
                                      {ad.description}
                                    </p>
                                  )}
                                </div>

                                {/* Media Attachment */}
                                {ad.images && ad.images.length > 0 && (
                                  <div 
                                    className="relative rounded-2xl overflow-hidden border border-gray-800 bg-black/20 aspect-[16/9] cursor-pointer"
                                    onClick={() => onSelectAd(ad)}
                                  >
                                    <img 
                                      src={ad.images[0]} 
                                      alt="" 
                                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" 
                                    />
                                    {ad.images.length > 1 && (
                                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/10">
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
                                  <div className="flex items-center gap-4 text-gray-400 text-xs font-bold">
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
                                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 hover:text-white rounded-xl text-xs font-black transition-all"
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
                              // Artificial delay to prevent rapid scrolling & let them load smoothly
                              await new Promise(r => setTimeout(r, 600));
                              if (visibleGeneralAdsCount < filterAds.length) {
                                setVisibleGeneralAdsCount(prev => prev + 4);
                              } else if (hasMoreAds) {
                                await onLoadMoreAds();
                                setVisibleGeneralAdsCount(prev => prev + 4);
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
                      <div className="bg-[#0c2b5e]/40 border border-gray-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
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
                        <div className="text-center py-24 bg-gray-900/40 rounded-3xl border border-gray-800" dir="rtl">
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
                                {paginatedCategoryAds.map(ad => {
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
                              <PaginationDots 
                                total={totalGeneralPages} 
                                current={generalAdsPage} 
                                onChange={setGeneralAdsPage} 
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
                                {paginatedProducts.map(p => {
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
                              <PaginationDots 
                                total={totalProductsPages} 
                                current={productsPage} 
                                onChange={setProductsPage} 
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
                          <div className="bg-gray-900 rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">الدوام</p>
                            <p className="text-white font-bold text-xs">{ad.shift}</p>
                          </div>
                          {ad.type === 'offer' && (
                            <div className="bg-gray-900 rounded-xl p-2 text-center">
                              <p className="text-gray-400 text-[10px]">المقاعد</p>
                              <p className="text-emerald-400 font-bold text-xs">{ad.seats} <span className="text-gray-500 font-normal">متاح</span></p>
                            </div>
                          )}
                          <div className="bg-gray-900 rounded-xl p-2 text-center">
                            <p className="text-gray-400 text-[10px]">الفئة</p>
                            <p className="text-white font-bold text-xs">{ad.targetAudience}</p>
                          </div>
                          <div className="bg-gray-900 rounded-xl p-2 text-center">
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
                          <p className="text-gray-300 text-xs mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">{ad.note}</p>
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
                  onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleTransportCount(prev => prev + 4); }}
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
                    className="w-full bg-[#0c2b5e]/80 text-white placeholder-gray-400 rounded-2xl py-3.5 pr-12 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-base shadow-inner"
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
                              <img src={topUser.avatar} alt="" className={`w-12 h-12 rounded-full object-cover ${topUser.role && topUser.role !== 'user' ? getGlowClass(topUser.role) : 'border-2 border-amber-400'}`} />
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

                          <div className="grid grid-cols-2 gap-2 text-center bg-[#0c2b5e]/60 rounded-xl p-2 border border-gray-800">
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
                <div className="text-center py-20 bg-gray-900/60 rounded-3xl border border-gray-800">
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
                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
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
                            <span className="text-gray-300 font-bold bg-gray-900/80 px-2 py-1 rounded-lg border border-gray-700/50">
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
                onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleProfilesCount(prev => prev + 4); }}
                loadingText="جاري تحميل المزيد من الحسابات..."
                skeletonType="profile"
                skeletonCount={3}
              />
                </>
              ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 text-center mt-8">
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
