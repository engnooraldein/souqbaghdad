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
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
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
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

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

  const filterAds = allAds.filter(a => a.status !== 'sold');
  const filterProds = allProducts.filter(p => p.status !== 'sold');

  const showAds = contentTab==='ads'||contentTab==='all';
  const showProds = contentTab==='products'||contentTab==='all';

  const canViewFullDirectory = user?.role === 'admin' || user?.role === 'owner' || user?.isVerified;
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-12 relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-10 right-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"/><div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl"/></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <motion.h1 initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="text-3xl md:text-4xl font-bold text-white mb-3">كل شي تحتاجه <span className="text-amber-400">بمكان واحد</span></motion.h1>
            <p className="text-gray-300">إعلانات + متجر — السوق الرقمي العراقي</p>
          </div>
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن سيارة، هاتف، عقار، منتج..."
                className="w-full bg-white/10 backdrop-blur text-white placeholder-gray-300 rounded-2xl py-4 pr-12 pl-4 border border-white/20 focus:border-amber-400 outline-none text-sm"/></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.filter(c=>c.id!=='games').map(c=>(
              <motion.button key={c.id} whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setCat(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${cat===c.id?'bg-amber-500 text-black border-amber-500':'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
                <span>{c.emoji}</span><span>{c.name}</span>
              </motion.button>
            ))}
          </div>
          <LiveVisitorCounter />
          {/* Transport Quick Access */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="mt-5 max-w-2xl mx-auto">
            <button onClick={()=>onTransportClick?.()}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-2xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-400"/>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">🚌 قسم الخطوط</p>
                  <p className="text-emerald-300 text-xs">نقل يومي للطلاب والموظفين 🎓👔</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1 transition-transform"/>
            </button>
          </motion.div>

          {!isStandalone && onInstallClick && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
              className="mt-3 max-w-2xl mx-auto">
              <button onClick={onInstallClick}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/30 rounded-2xl transition-all group"
                title="تثبيت التطبيق"
                aria-label="تثبيت التطبيق"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-amber-400"/>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">📲 تثبيت التطبيق</p>
                    <p className="text-amber-300/80 text-xs">ثبّت تطبيق "سوك بغداد" على جهازك لسهولة الوصول السريع</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform"/>
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filter bar */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
              {/* Content type tabs */}
              <div className="flex bg-gray-700 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-hide max-w-full">
                {([['all','الكل'],['ads','📢 إعلانات'],['products','🛍️ منتجات'],['profiles','👤 حسابات'],['transport','🚌 الخطوط']] as [string,string][]).map(([t,l])=>(
                  <button key={t} onClick={()=>setContentTab(t as any)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold ${contentTab===t?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>{l}</button>
                ))}
              </div>
              <div className="flex-1 flex flex-wrap gap-2 items-center justify-end">
                <select value={gov} onChange={e=>setGov(e.target.value)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none" title="المحافظة" aria-label="المحافظة">
                  {IRAQI_GOVERNORATES.map(g=><option key={g}>{g}</option>)}</select>
                <select value={sort} onChange={e=>setSort(e.target.value as any)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none" title="الترتيب" aria-label="الترتيب">
                  <option value="recent">الأحدث</option><option value="views">الأكثر مشاهدة</option>
                  <option value="price-low">السعر: من الأقل</option><option value="price-high">السعر: من الأعلى</option>
                </select>
                <button onClick={()=>setShowFilters(!showFilters)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs border ${showFilters?'bg-amber-500 text-black border-amber-500':'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  <SlidersHorizontal className="w-3.5 h-3.5"/><span>فلاتر</span></button>
                <div className="flex bg-gray-700 rounded-xl p-0.5">
                  <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode==='grid'?'bg-amber-500 text-black':'text-gray-400'}`} title="عرض شبكي" aria-label="عرض شبكي"><Grid className="w-4 h-4"/></button>
                  <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode==='list'?'bg-amber-500 text-black':'text-gray-400'}`} title="عرض قائمة" aria-label="عرض قائمة"><List className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {showFilters&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className="pt-3 mt-3 border-t border-gray-700 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2"><label className="text-gray-400 text-xs">السعر من:</label>
                    <input value={fmt(priceMin)} onChange={e=>setPriceMin(fmt(e.target.value))} placeholder="0" className="w-32 bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm outline-none"/></div>
                  <div className="flex items-center gap-2"><label className="text-gray-400 text-xs">إلى:</label>
                    <input value={fmt(priceMax)} onChange={e=>setPriceMax(fmt(e.target.value))} placeholder="بلا حد" className="w-32 bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm outline-none"/></div>
                  <button onClick={()=>{setPriceMin('');setPriceMax('');setGov('الكل');setSearch('');}} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm">مسح الفلاتر</button>
                </div>
              </motion.div>}
            </AnimatePresence>
          </div>

          {isInitialLoading ? (
            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl" dir="rtl">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Sparkles className="w-8 h-8 text-amber-400"/>
              </div>
              <h3 className="text-xl font-bold text-white">أهلاً بك في سوق بغداد! ✨</h3>
              <p className="text-gray-300 text-sm">جاري تحميل أحدث الإعلانات والمنتجات، يرجى الانتظار ثوانٍ...</p>
              <div className="flex justify-center gap-1.5 pt-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
              </div>
            </div>
          ) : (
            <>
              {/* Ads */}
              {showAds&&filterAds.length>0&&(
                <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><FileText className="w-4 h-4"/>الإعلانات ({filterAds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              
              {/* Sticky Counts stats banner */}
              <div className="sticky top-[4rem] z-20 bg-[#0c2b5e]/90 backdrop-blur-md py-2.5 px-3 border-b border-transparent shadow-sm shadow-[#0c2b5e]/10 mb-4 rounded-xl flex items-center justify-between">
                <p className="text-gray-400 text-xs">تم العثور على <span className="text-amber-400 font-bold">{totalAdsCount}</span> إعلان، يتم عرض {Math.min(filterAds.length, totalAdsCount)} من أصل {totalAdsCount}{totalAdsCount > 0 && ` (يتوفر ${totalAdsCount} إعلان متاح حالياً)`}</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                  {filterAds.map(ad=>{
                    const seller = propStoredUsers?.find(u=>u.id===ad.postedBy);
                    return <AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                      onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(ad.id);}}
                      onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                      onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}
                      sellerRole={seller?.role}
                    />;
                  })}
                </div>
                <InfiniteScrollTrigger 
                  hasMore={hasMoreAds} 
                  isLoading={loadingMoreAds} 
                  onLoadMore={onLoadMoreAds} 
                  loadingText="جاري تحميل المزيد من الإعلانات..." 
                />
              </div>
            </div>
          )}

          {/* Products */}
          {showProds&&filterProds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><ShoppingBag className="w-4 h-4"/>المنتجات ({filterProds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              
              {/* Sticky Counts stats banner */}
              <div className="sticky top-[4rem] z-20 bg-[#0c2b5e]/90 backdrop-blur-md py-2.5 px-3 border-b border-transparent shadow-sm shadow-[#0c2b5e]/10 mb-4 rounded-xl flex items-center justify-between">
                <p className="text-gray-400 text-xs">تم العثور على <span className="text-blue-450 font-bold">{totalProductsCount}</span> منتج، يتم عرض {Math.min(filterProds.length, totalProductsCount)} من أصل {totalProductsCount}{totalProductsCount > 0 && ` (يتوفر ${totalProductsCount} منتج متاح حالياً)`}</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                  {filterProds.map(p=>{
                    const seller = propStoredUsers?.find(u=>u.id===p.postedBy);
                    return <ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                      onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(p.id);}}
                      onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                      onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}
                      sellerRole={seller?.role}
                    />;
                  })}
                </div>
                <InfiniteScrollTrigger 
                  hasMore={hasMoreProducts} 
                  isLoading={loadingMoreProducts} 
                  onLoadMore={onLoadMoreProducts} 
                  loadingText="جاري تحميل المزيد من المنتجات..." 
                />
              </div>
            </div>
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
                            <span>السعر المفضل: {ad.price}</span>
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
                              onClick={(e) => e.stopPropagation()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> واتساب
                            </motion.a>
                            <motion.button
                              onClick={(e) => { e.stopPropagation(); handleUniversalShare({ id: ad.id, university: ad.university, type: ad.type, regions: ad.regions, price: ad.price }); }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-xl text-xs hover:bg-amber-500/30"
                            >
                              <Share2 className="w-3.5 h-3.5" /> مشاركة
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
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ابحث عن حساب باسم المستخدم أو رقم الهاتف (077...)"
                    className="w-full bg-[#0c2b5e]/80 text-white placeholder-gray-400 rounded-2xl py-3.5 pr-12 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-sm shadow-inner"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded-lg">
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
                                {topUser.isVerified && <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
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
                                  <Shield className="w-3 h-3 fill-current" /> موثوق
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
