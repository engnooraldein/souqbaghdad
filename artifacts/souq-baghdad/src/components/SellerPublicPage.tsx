// ===========================================
// مسؤولية هذا الملف:
// يعرض الصفحة العامة للبائع (Seller Public Profile).
//
// يجلب البيانات من Supabase:
// - ملف البائع (profiles).
// - إعلانات البائع.
// - منتجات البائع.
//
// استعلام Supabase:
// يُنفَّذ عند تحميل المكوّن أو تغيير sellerId.
// إذا رأيت جلباً متكرراً، تحقق من useEffect.
//
// ملاحظة مهمة:
// هذه الصفحة تدعم مشاركة رابط البائع (Deep Link).
// تأكد من اختبار الـ URL عند الوصول المباشر.
//
// آمن للتعديل:
// نعم.
// ===========================================

import { DEFAULT_AVATAR } from '../App';
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
import { VerifiedBadge } from './VerifiedBadge';

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

export function SellerPublicPage({ sellerId, allAds, allProducts, allTransportAds = [], storedUsers = [], onBack, onSelectAd, onSelectProduct, onSelectTransport, favorites, onToggleFav, user, onAuthRequired, onDeleteProfile, onActionMenu }:{
  sellerId:string; allAds:Ad[]; allProducts:Product[]; allTransportAds?:TransportAd[]; storedUsers?: any[]; onBack:()=>void;
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void; onSelectTransport?:(ad:TransportAd)=>void;
  favorites:number[]; onToggleFav:(id:number)=>void; user:User|null; onAuthRequired:()=>void;
  onDeleteProfile?:(id:string)=>void; onActionMenu?:any;
}) {
  const onlineStatuses = useOnlineStatuses();
  const [tab, setTab] = useState<'ads'|'products'|'lines'>('ads');
  const [sellerUser, setSellerUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);

  const [localAds, setLocalAds] = useState<Ad[]>([]);
  const [localProds, setLocalProds] = useState<Product[]>([]);
  const [localLines, setLocalLines] = useState<TransportAd[]>([]);
  
  const mergedAds = [...allAds.filter(a=>String(a.postedBy)===String(sellerId) || String(a.phone)===String(sellerId)), ...localAds].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  const mergedProds = [...allProducts.filter(p=>String(p.postedBy)===String(sellerId) || String(p.phone)===String(sellerId)), ...localProds].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  const mergedLines = [...allTransportAds.filter(a=>String(a.postedBy)===String(sellerId) || String(a.phone)===String(sellerId)), ...localLines].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);

  const sellerAds = mergedAds.filter(ad => ad.status === 'active');
  const sellerProds = mergedProds.filter(prod => prod.status === 'active');
  const sellerLines = mergedLines.filter(line => line.status === 'published');
  const sellerInfo: SellerInfo|null = sellerAds[0]?.seller || sellerProds[0]?.seller || null;

  useEffect(() => {
    let isMounted = true;
    async function loadSellerDetails() {
      setLoadingProfile(true);
      try {
        // 1. Check storedUsers prop
        const foundStored = storedUsers.find((u: any) => String(u.id) === String(sellerId) || String(u.phone) === String(sellerId));
        if (foundStored) {
          if (isMounted) { setSellerUser(foundStored); setLoadingProfile(false); }
        }

        // 2. Check local users
        const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const foundLocal = users.find((u: any) => String(u.id) === String(sellerId) || String(u.phone) === String(sellerId));
        if (foundLocal && !foundStored) {
          if (isMounted) { setSellerUser(foundLocal); setLoadingProfile(false); }
        }

        // 3. Check sellerInfo from ads
        if (sellerInfo && !foundStored && !foundLocal) {
          if (isMounted) {
            setSellerUser({
              id: sellerId,
              name: sellerInfo.name,
              avatar: sellerInfo.avatar || DEFAULT_AVATAR,
              location: sellerInfo.location || 'العراق',
              isVerified: sellerInfo.isVerified,
              rating: sellerInfo.rating || 4.9,
              ratingCount: 1,
              cover: DEFAULT_COVER
            });
            setLoadingProfile(false);
          }
        }

        // 4. Query Supabase profiles table directly and fetch seller's sold ads and products
        const isPhone = !sellerId.includes('-');
        const [adsRes, prodsRes, dbProfileRes] = await Promise.all([
          isPhone ? supabase.from('ads').select('*').eq('phone', sellerId) : supabase.from('ads').select('*').eq('seller_id', sellerId),
          isPhone ? supabase.from('products').select('*').eq('phone', sellerId) : supabase.from('products').select('*').eq('seller_id', sellerId),
          isPhone ? supabase.from('profiles').select('*').eq('phone', sellerId).maybeSingle() : supabase.from('profiles').select('*').eq('id', sellerId).maybeSingle()
        ]);
        
        if (adsRes.data && isMounted) {
          const rawAds = adsRes.data.filter((r: any) => r.category !== 'transport' && r.category !== 'notification');
          const rawLines = adsRes.data.filter((r: any) => r.category === 'transport');

          const formattedAds = rawAds.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            price: row.price,
            images: row.images || [],
            category: row.category,
            location: row.location || row.governorate,
            governorate: row.governorate,
            postedBy: row.seller_id,
            phone: row.phone,
            createdAt: row.created_at,
            createdAtISO: row.created_at,
            views: row.views || 0,
            status: row.status,
            isDemo: row.is_demo,
            time: row.created_at,
            type: row.type || 'ad',
            adCount: row.adCount || 0,
            soldCount: row.soldCount || 0,
            favorites: row.likes || 0,
            seller: row.seller || (dbProfileRes.data ? {
              name: dbProfileRes.data.full_name || dbProfileRes.data.name || 'بائع',
              avatar: dbProfileRes.data.avatar_url || dbProfileRes.data.avatar || '',
              isVerified: dbProfileRes.data.role === 'owner' || dbProfileRes.data.role === 'vendor' || dbProfileRes.data.role === 'admin',
              rating: 5
            } : {
              name: 'مستخدم',
              avatar: '',
              isVerified: false,
              rating: 5
            })
          }));
          setLocalAds(formattedAds);

          const formattedLines = rawLines.map((row: any) => {
            let extra = { shift: 'صباحي', seats: 4, vehicleType: 'خصوصي', targetAudience: 'مختلط', categoryType: 'student', note: '' };
            try { if (row.description) extra = { ...extra, ...JSON.parse(row.description) }; } catch(e) { extra.note = row.description || ''; }
            return {
              id: row.id,
              type: row.type || 'offer',
              categoryType: (extra.categoryType === 'employee' ? 'employee' : 'student') as 'employee' | 'student',
              university: row.city || '',
              regions: row.location || '',
              shift: extra.shift,
              seats: extra.seats,
              vehicleType: extra.vehicleType,
              targetAudience: extra.targetAudience,
              price: row.price || '0',
              note: extra.note,
              postedBy: row.seller_id,
              phone: row.phone,
              user_id: row.seller_id,
              status: row.status,
              createdAt: row.created_at,
              createdAtISO: row.created_at,
              views: row.views || 0,
              seller: row.seller || (dbProfileRes.data ? {
                name: dbProfileRes.data.full_name || dbProfileRes.data.name || 'بائع',
                avatar: dbProfileRes.data.avatar_url || dbProfileRes.data.avatar || ''
              } : null),
              sellerName: row.seller?.name || dbProfileRes.data?.full_name || dbProfileRes.data?.name || 'مستخدم',
              sellerAvatar: row.seller?.avatar || dbProfileRes.data?.avatar_url || dbProfileRes.data?.avatar || ''
            };
          });
          setLocalLines(formattedLines);
        }

        if (prodsRes.data && isMounted) {
          const formattedProds = prodsRes.data.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            price: row.price,
            images: row.images || [],
            category: row.category,
            condition: row.condition,
            stock: row.stock,
            location: row.location || row.governorate,
            governorate: row.governorate,
            postedBy: row.seller_id,
            phone: row.phone,
            createdAt: row.created_at,
            createdAtISO: row.created_at,
            views: row.views || 0,
            status: row.status,
            isDemo: row.is_demo,
            time: row.created_at,
            type: row.type || 'product',
            adCount: row.adCount || 0,
            soldCount: row.soldCount || 0,
            favorites: row.favorites || 0,
            seller: row.seller || (dbProfileRes.data ? {
              name: dbProfileRes.data.full_name || dbProfileRes.data.name || 'بائع',
              avatar: dbProfileRes.data.avatar_url || dbProfileRes.data.avatar || '',
              isVerified: dbProfileRes.data.role === 'owner' || dbProfileRes.data.role === 'vendor' || dbProfileRes.data.role === 'admin',
              rating: 5
            } : {
              name: 'مستخدم',
              avatar: '',
              isVerified: false,
              rating: 5
            })
          }));
          setLocalProds(formattedProds);
        }

        // linesRes is ignored since we mapped lines from adsRes

        const dbProfile = dbProfileRes.data;

        if (dbProfile && isMounted) {
          setSellerUser({
            id: dbProfile.id,
            name: dbProfile.full_name || dbProfile.name || 'بائع في سوق بغداد',
            avatar: dbProfile.avatar_url || dbProfile.avatar || DEFAULT_AVATAR,
            phone: dbProfile.phone || '',
            location: dbProfile.city || dbProfile.location || 'بغداد',
            isVerified: dbProfile.role === 'owner' || dbProfile.role === 'vendor' || dbProfile.role === 'admin',
            rating: 4.9,
            ratingCount: 5,
            cover: dbProfile.cover_url || DEFAULT_COVER,
            created_at: dbProfile.created_at,
            role: dbProfile.role || 'user'
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
          setLoadingContent(false);
        }
      }
    }
    loadSellerDetails();
    return () => { isMounted = false; };
  }, [sellerId, sellerInfo, storedUsers]);

  const [visibleAdsCount, setVisibleAdsCount] = useState(4);
  const [visibleProdsCount, setVisibleProdsCount] = useState(4);
  const [visibleLinesCount, setVisibleLinesCount] = useState(4);

  const formatJoinedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' });
    } catch {
      return isoString;
    }
  };

  const handleRate = (stars: number) => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (user.id === sellerId) {
      alert('لا يمكنك تقييم نفسك!');
      return;
    }
    
    try {
      const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const idx = users.findIndex((u: any) => u.id === sellerId);
      let targetUser = users[idx];
      if (!targetUser) {
        targetUser = {
          id: sellerId,
          name: sellerInfo?.name || 'مستخدم',
          avatar: sellerInfo?.avatar || DEFAULT_AVATAR,
          cover: DEFAULT_COVER,
          location: sellerInfo?.location || 'العراق',
          isVerified: sellerInfo?.isVerified || false,
          rating: 5,
          ratingCount: 0
        };
      }
      
      const oldCount = targetUser.ratingCount ?? 0;
      const oldRating = targetUser.rating ?? 5;
      const newCount = oldCount + 1;
      const newRating = oldCount === 0 ? stars : Number(((oldRating * oldCount + stars) / newCount).toFixed(1));
      
      const updatedUser = {
        ...targetUser,
        rating: newRating,
        ratingCount: newCount
      };
      
      if (idx >= 0) {
        users[idx] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      
      localStorage.setItem('souqUsers', JSON.stringify(users));
      setSellerUser(updatedUser);
      alert('تم تسجيل تقييمك بنجاح! ⭐');
    } catch (e) {
      console.error(e);
    }
  };



  const effectiveSeller = sellerUser || {
    id: sellerId,
    name: sellerInfo?.name || 'مستخدم في سوق بغداد',
    avatar: sellerInfo?.avatar || DEFAULT_AVATAR,
    cover: DEFAULT_COVER,
    location: sellerInfo?.location || 'بغداد',
    isVerified: sellerInfo?.isVerified || false,
    rating: sellerInfo?.rating || 4.8,
    ratingCount: 5,
    created_at: new Date().toISOString()
  };

  return (
    <>
      <LoadingScreen isLoading={loadingProfile || loadingContent} />
      <div className="min-h-screen bg-black pt-16 pb-10">
      {/* Cover */}
      <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gray-900 relative overflow-hidden flex items-center justify-center">
        <img src={effectiveSeller?.cover || DEFAULT_COVER} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"/>
        <img 
          src={effectiveSeller?.cover || DEFAULT_COVER} 
          alt="Cover" 
          className="relative w-full h-full object-cover z-0"
        />
        {/* Watermark */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 opacity-60 select-none pointer-events-none drop-shadow-xl">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-lg flex items-center justify-center border border-amber-500/40">
            <span className="text-white font-bold text-[10px] sm:text-xs">سوك</span>
          </div>
          <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md">سوك بغداد</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent z-10"/>
      </div>

      <div className="container mx-auto px-4 max-w-3xl relative">
        {/* Avatar & Actions Container */}
        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
          {/* Avatar */}
          <div className="relative z-20">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 shadow-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center ${effectiveSeller.role && effectiveSeller.role !== 'user' ? getGlowClass(effectiveSeller.role) : 'border-gray-950'}`}>
              <img src={effectiveSeller?.avatar || DEFAULT_AVATAR} alt={effectiveSeller?.name} className="w-full h-full object-cover"/>
            </div>
            {Boolean((user && (String(effectiveSeller.id) === String(user.id) || String(effectiveSeller.phone) === String(user.phone))) || onlineStatuses[effectiveSeller.id] || onlineStatuses[effectiveSeller.phone]) ? (
              <span className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-950 flex items-center justify-center shadow-lg z-30" title="متصل الآن">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              </span>
            ) : (
              <span className="absolute bottom-2 right-2 w-5 h-5 bg-gray-500 rounded-full border-2 border-gray-950 shadow-lg z-30" title="غير متصل" />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-2">
            <button onClick={()=>{
              handleUniversalShare({
                title: effectiveSeller.name,
                type: 'profile',
                location: effectiveSeller.location || 'بغداد',
                id: effectiveSeller.id,
                url: '/seller/' + effectiveSeller.id,
                image: effectiveSeller.avatar || DEFAULT_AVATAR
              });
            }} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg border border-gray-700 hover:bg-gray-700" title="مشاركة الملف">
              <Share2 className="w-4 h-4"/>
              <span className="hidden sm:inline">مشاركة</span>
            </button>
            <button onClick={onBack} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800">
              <ChevronRight className="w-4 h-4"/>
              <span className="hidden sm:inline">رجوع</span>
            </button>
          </div>
        </div>

        {/* User Details */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white always-white">{effectiveSeller?.name}</h2>
            {effectiveSeller?.isVerified && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-800/20 text-gray-400 text-xs rounded-full font-bold">
                <VerifiedBadge className="w-3 h-3"/> موثق
              </span>
            )}
            {Boolean((user && (String(effectiveSeller.id) === String(user.id) || String(effectiveSeller.phone) === String(user.phone))) || onlineStatuses[effectiveSeller.id] || onlineStatuses[effectiveSeller.phone]) ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-full font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> متصل الآن
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 text-xs rounded-full font-medium">
                غير متصل
              </span>
            )}
          </div>
          
          {/* Interactive Rating */}
          <div className="flex items-center gap-2 mt-2 bg-gray-800/40 p-2.5 rounded-xl border border-gray-800/80 inline-flex flex-wrap">
            <span className="text-gray-400 text-xs font-medium">تقييم البائع:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => {
                const isLit = stars <= Math.round(effectiveSeller.rating);
                return (
                  <button 
                    key={stars} 
                    onClick={() => handleRate(stars)}
                    className="p-0.5 hover:scale-125 transition-transform"
                    title={`تقييم بـ ${stars} نجوم`}
                  >
                    <Star className={`w-5 h-5 ${isLit ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>
            <span className="text-amber-400 font-bold text-sm mr-1">{effectiveSeller.rating}</span>
            <span className="text-gray-500 text-xs">({effectiveSeller.ratingCount || 1} تقييم)</span>
          </div>

          {user && (user.role === 'admin' || user.role === 'owner') && (
            <div className="mt-3">
              <button 
                onClick={() => {
                  if(window.confirm('هل أنت متأكد من حذف هذا الملف الشخصي وجميع إعلاناته؟')) {
                    onDeleteProfile?.(sellerId);
                  }
                }} 
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-colors text-sm w-max"
              >
                <Trash2 className="w-4 h-4"/> حذف الملف الشخصي
              </button>
            </div>
          )}

          <p className="text-gray-400 text-sm mt-3 flex items-center gap-3">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-500" />{effectiveSeller.location}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-500" />انضم في {formatJoinedDate(effectiveSeller.joinedDate || effectiveSeller.created_at || new Date().toISOString())}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[{v:sellerAds.length,l:'إعلان',c:'text-amber-400'},{v:sellerProds.length,l:'منتج',c:'text-purple-400'},{v:sellerAds.reduce((s,a)=>s+a.views,0)+sellerProds.reduce((s,p)=>s+p.views,0),l:'مشاهدة',c:'text-gray-400'}].map((s,i)=>(
            <div key={i} className="bg-gray-800 rounded-2xl p-3 text-center border border-gray-700">
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-gray-400 text-xs">{s.l}</p>
            </div>
          ))}
        </div>
        {/* Tabs */}
        {loadingContent ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
            <p className="text-amber-400 font-bold mb-1">جاري جلب كامل المحتوى...</p>
            <p className="text-gray-400 text-sm">يرجى الانتظار ثوانٍ قليلة</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-5 bg-gray-800 p-1.5 rounded-2xl border border-gray-700 overflow-x-auto hide-scrollbar">
              {([['ads',`📢 الإعلانات (${sellerAds.length})`],['products',`🛍️ المنتجات (${sellerProds.length})`]] as [string,string][]).map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t as any)} className={`flex-shrink-0 flex-1 py-2 px-3 rounded-xl text-sm font-bold ${tab===t?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>{l}</button>
              ))}
              {sellerLines.length > 0 && (
                <button onClick={() => setTab('lines')} className={`flex-shrink-0 flex-1 py-2 px-3 rounded-xl text-sm font-bold ${tab==='lines'?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>
                  🚐 الخطوط ({sellerLines.length})
                </button>
              )}
            </div>

            {tab==='ads'&&(sellerAds.length===0?(
              <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">📭</div><p className="text-gray-400">لا إعلانات بعد</p></div>
            ):(
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {sellerAds.slice(0, visibleAdsCount).map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}} sellerRole={effectiveSeller.role}/>)}
                </div>
                {visibleAdsCount < sellerAds.length && (
                  <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-gray-400 text-sm mb-3">
                      تم العثور على {sellerAds.length} إعلان، يتم عرض {visibleAdsCount} من أصل {sellerAds.length} (يتوفر {sellerAds.length - visibleAdsCount} إعلان متاح حالياً)
                    </p>
                    <InfiniteScrollTrigger
                      hasMore={visibleAdsCount < sellerAds.length}
                      onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleAdsCount(prev => prev + 4); }}
                      loadingText="جاري تحميل المزيد من الإعلانات..."
                      skeletonType="grid"
                      skeletonCount={3}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {tab==='products'&&(sellerProds.length===0?(
              <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">🛍️</div><p className="text-gray-400">لا منتجات بعد</p></div>
            ):(
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {sellerProds.slice(0, visibleProdsCount).map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}} sellerRole={effectiveSeller.role}/>)}
                </div>
                {visibleProdsCount < sellerProds.length && (
                  <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-gray-400 text-sm mb-3">
                      تم العثور على {sellerProds.length} منتج، يتم عرض {visibleProdsCount} من أصل {sellerProds.length} (يتوفر {sellerProds.length - visibleProdsCount} منتج متاح حالياً)
                    </p>
                    <InfiniteScrollTrigger
                      hasMore={visibleProdsCount < sellerProds.length}
                      onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleProdsCount(prev => prev + 4); }}
                      loadingText="جاري تحميل المزيد من المنتجات..."
                      skeletonType="grid"
                      skeletonCount={3}
                    />
                  </div>
                )}
              </div>
            ))}

            {tab==='lines'&&(sellerLines.length===0?(
              <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">🚐</div><p className="text-gray-400">لا خطوط نقل بعد</p></div>
            ):(
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerLines.slice(0, visibleLinesCount).map(line=><TransportAdCard key={line.id} ad={line} onSelect={()=>onSelectTransport?.(line)} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===line.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"transport",item:line});}} onShare={() => handleUniversalShare({ id: line.id, university: line.university, type: line.type, regions: line.regions, price: line.price })} seller={storedUsers.find(u=>u.id===line.postedBy)} />)}
                </div>
                {visibleLinesCount < sellerLines.length && (
                  <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-gray-400 text-sm mb-3">
                      تم العثور على {sellerLines.length} خط نقل، يتم عرض {visibleLinesCount} من أصل {sellerLines.length}
                    </p>
                    <InfiniteScrollTrigger
                      hasMore={visibleLinesCount < sellerLines.length}
                      onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleLinesCount(prev => prev + 4); }}
                      loadingText="جاري تحميل المزيد من الخطوط..."
                      skeletonType="transport"
                      skeletonCount={2}
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
    </>
  );
}
