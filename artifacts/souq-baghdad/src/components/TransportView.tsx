// ===========================================
// مسؤولية هذا الملف:
// يعرض صفحة الخطوط والنقل (Transport View).
//
// لا يقوم بجلب البيانات مباشرة.
// البيانات تأتيه عبر Props من App.tsx (allTransportAds, fetchTransportAds).
//
// الميزات المدمجة:
// - عرض إعلانات النقل (TransportAdCard)
// - فلتر نوع الجمهور (طلاب / موظفون / مختلط)
// - نافذة نشر خط جديد (TransportFormModal)
// - نافذة تفاصيل الخط (TransportDetailModal)
// - تتبع الاهتمام بالخط (InterestTimer)
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم تغيير Props المستقبَلة من App.tsx.
// ===========================================

import InfiniteScrollTrigger from './InfiniteScrollTrigger';
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

export function TransportView({ user, onBack, onCreateAd, onGoToMyLines, onSelectAd, lines, onPost, onUpdateStatus, onDeleteAd, onActionMenu, isInitialLoading, storedUsers, onLoadMore, hasMore, totalCount, adCosts }: {
  user: { id: string; name: string; avatar: string; phone: string; role?: string } | null;
  onBack: () => void;
  onCreateAd: () => void;
  onGoToMyLines?: () => void;
  onSelectAd?: (ad: TransportAd) => void;
  lines: TransportAd[];
  onPost: (ad: TransportAd) => void;
  onUpdateStatus: (id: number, status: TransportAd['status'], reason?: TransportAd['completion_reason']) => void;
  onDeleteAd?: (id: number) => void;
  onActionMenu?: (target: {type:"transport", item:TransportAd}) => void;
  isInitialLoading?: boolean;
  storedUsers?: any[];
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  totalCount?: number;
  adCosts?: Record<string, number>;
}) {
  const [mainCategoryFilter, setMainCategoryFilter] = useState<'student'|'employee'|'all'>('student');
  const [filterUniversity, setFilterUniversity] = useState('الكل');
  const [filterType, setFilterType] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (ad: TransportAd) => {
    longPressTimer.current = setTimeout(() => {
      if (user && (user.role === 'admin' || user.role === 'owner' || user.id === ad.postedBy)) {
        onActionMenu?.({ type: 'transport', item: ad });
      }
    }, 800);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleContextMenu = (e: React.MouseEvent, ad: TransportAd) => {
    e.preventDefault();
    if (user && (user.role === 'admin' || user.role === 'owner' || user.id === ad.postedBy)) {
      onActionMenu?.({ type: 'transport', item: ad });
    }
  };

  const handlePost = (ad: TransportAd) => {
    onPost(ad);
    setShowForm(false);
  };

  const filtered = lines.filter(a => {
    if (a.status !== 'published') return false;
    const adCat = a.categoryType || 'student';
    if (mainCategoryFilter !== 'all' && adCat !== mainCategoryFilter) return false;
    if (filterUniversity !== 'الكل' && a.university !== filterUniversity) return false;
    if (filterType !== 'الكل' && a.type !== (filterType === 'خطوط متوفرة' ? 'offer' : 'طلبات خطوط')) return false;
    if (searchQuery) {
      return a.regions.includes(searchQuery) || a.university.includes(searchQuery) || (a.note && a.note.includes(searchQuery));
    }
    return true;
  });

  const dynamicUniversities = mainCategoryFilter === 'employee'
    ? Array.from(new Set([
        'الكل',
        ...EMPLOYEE_WORKPLACES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType === 'employee').map(l => l.university)
      ])).filter(Boolean)
    : Array.from(new Set([
        'الكل',
        ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType !== 'employee').map(l => l.university)
      ])).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061224] via-[#0b2145] to-[#041026] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950 pt-10 pb-12 px-4 relative overflow-hidden border-b border-gray-900/60 shadow-2xl">
        <div className="absolute inset-0 opacity-5">
          {[...Array(8)].map((_,i)=><div key={i} className="absolute border border-white/20 rounded-full" style={{width:`${(i+1)*90}px`,height:`${(i+1)*90}px`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>)}
        </div>
        <div className="container mx-auto max-w-2xl relative">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3.5">
              <button onClick={onBack} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/15 transition-all" title="رجوع" aria-label="رجوع">
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <div>
                <h1 className="text-white font-black text-2xl flex items-center gap-2" dir="rtl">
                  <span>🚌</span>
                  <span>قسم الخطوط والنقل اليومي</span>
                </h1>
                <p className="text-gray-400 text-xs mt-1 font-semibold" dir="rtl">أسرع وأأمن طريق لدوامك اليومي (طلاب وموظفين)</p>
              </div>
            </div>
          </div>
          
          {/* Smart Search & Filters */}
          <div className="bg-gray-950/40 border border-gray-900/80 backdrop-blur-md rounded-3xl p-5 shadow-2xl space-y-4 mb-5">
            
            {/* Main Category Tabs (Student vs Employee) */}
            <div className="bg-gray-950/60 p-1.5 rounded-2xl border border-gray-900/80 flex gap-1.5 shadow-inner">
              <button onClick={() => { setMainCategoryFilter('student'); setFilterUniversity('الكل'); }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-300 ${mainCategoryFilter === 'student' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}>
                🎓 خطوط الطلاب
              </button>
              <button onClick={() => { setMainCategoryFilter('employee'); setFilterUniversity('الكل'); }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-300 ${mainCategoryFilter === 'employee' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}>
                👔 خطوط الموظفين
              </button>
              <button onClick={() => { setMainCategoryFilter('all'); setFilterUniversity('الكل'); }}
                className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all duration-300 ${mainCategoryFilter === 'all' ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/15' : 'text-gray-400 hover:text-white'}`}>
                ⚡ الكل
              </button>
            </div>

            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500"/>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={mainCategoryFilter === 'employee' ? "ابحث عن شركة، دائرة، منطقة..." : "ابحث عن جامعة، منطقة، مقصد..."}
                className="w-full bg-gray-950/60 backdrop-blur-md text-white placeholder-emerald-200/40 rounded-2xl py-3.5 pr-11 pl-4 border border-gray-800 focus:border-emerald-500/50 outline-none text-xs sm:text-sm shadow-inner transition-all duration-300"/>
            </div>
            
            <div className="grid grid-cols-2 gap-3" dir="rtl">
              <div>
                <label className="text-gray-400 text-[11px] font-black mr-1 mb-1 block">{mainCategoryFilter === 'employee' ? 'مكان العمل (دوائر / شركات)' : 'الوجهة / الجامعة'}</label>
                <select value={filterUniversity} onChange={e=>setFilterUniversity(e.target.value)} title="تصفية بالجامعة" aria-label="تصفية بالجامعة"
                  className="w-full bg-gray-900/80 text-white font-bold rounded-xl py-2.5 px-3.5 border border-gray-800 focus:border-emerald-500/50 outline-none text-xs sm:text-sm transition-all duration-300 cursor-pointer [color-scheme:dark]">
                  {dynamicUniversities.map(c=><option key={c} value={c} className="bg-gray-900 text-white">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-[11px] font-black mr-1 mb-1 block">نوع الإعلان</label>
                <select value={filterType} onChange={e=>setFilterType(e.target.value)} title="تصفية بنوع الإعلان" aria-label="تصفية بنوع الإعلان"
                  className="w-full bg-gray-900/80 text-white font-bold rounded-xl py-2.5 px-3.5 border border-gray-800 focus:border-emerald-500/50 outline-none text-xs sm:text-sm transition-all duration-300 cursor-pointer [color-scheme:dark]">
                  <option className="bg-gray-900 text-white">الكل</option>
                  <option className="bg-gray-900 text-white">خطوط متوفرة</option>
                  <option className="bg-gray-900 text-white">طلبات خطوط</option>
                </select>
              </div>
            </div>
          </div>

          {/* Post Button & My Lines Button */}
          <div className="flex gap-3">
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{ if(!user){onCreateAd();return;} setShowForm(true); }}
              className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/15 border border-amber-400/20 hover:from-amber-400 hover:to-yellow-300 transition-all text-xs sm:text-sm">
              <Plus className="w-5 h-5"/> إضافة إعلان خط جديد
            </motion.button>
            {user && onGoToMyLines && (
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={onGoToMyLines}
                className="px-5 py-3 bg-gray-950/60 text-white font-black rounded-2xl flex items-center justify-center gap-2 border border-gray-850 shadow-xl hover:bg-gray-900 transition-all text-xs sm:text-sm">
                🚌 خطوطي
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="container mx-auto max-w-2xl px-4 py-6">
        {isInitialLoading ? (
          <div className="bg-gray-950/40 backdrop-blur-md border border-gray-900 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl" dir="rtl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-emerald-400"/>
            </div>
            <h3 className="text-xl font-bold text-white">أهلاً بك في قسم الخطوط! ✨</h3>
            <p className="text-gray-400 text-sm">جاري تحميل أحدث إعلانات خطوط النقل، يرجى الانتظار ثوانٍ...</p>
            <div className="flex justify-center gap-1.5 pt-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-950/20 rounded-3xl border border-gray-900 shadow-sm" dir="rtl">
            <div className="text-6xl mb-4">🚐</div>
            <h3 className="text-white font-black text-lg mb-2">لا توجد إعلانات حالياً في هذا القسم</h3>
            <p className="text-gray-400 text-sm mb-6 font-semibold">كن أول من يضيف إعلاناً خط جديد</p>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{if(!user){onCreateAd();return;}setShowForm(true);}}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/10 text-xs sm:text-sm border border-emerald-400/20">
              إضافة إعلان الآن
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="sticky top-[4rem] z-20 bg-gray-950/85 backdrop-blur-md py-3 px-4 border border-gray-900 shadow-xl mb-4 rounded-2xl flex items-center justify-between" dir="rtl">
              <p className="text-gray-400 text-xs font-bold">
                تم العثور على <span className="text-emerald-400 font-black">{filtered.length}</span> خط، يتم عرض {onLoadMore ? filtered.length : Math.min(visibleCount, filtered.length)} من أصل {filtered.length}
                {totalCount !== undefined && totalCount > 0 && ` (يتوفر ${totalCount} خط متاح حالياً)`}
              </p>
            </div>
            {filtered.slice(0, onLoadMore ? filtered.length : visibleCount).map(ad=>{
              const isEmployee = ad.categoryType === 'employee';
              const seller = storedUsers?.find(u=>u.id===ad.postedBy);
              return (
              <motion.div key={ad.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                onClick={() => onSelectAd?.(ad)}
                onTouchStart={() => handleTouchStart(ad)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onMouseDown={() => handleTouchStart(ad)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onContextMenu={(e) => handleContextMenu(e, ad)}
                className={`bg-gray-950/40 border hover:border-emerald-500/40 backdrop-blur-md rounded-3xl transition-all duration-300 overflow-hidden relative cursor-pointer p-5 shadow-xl ${
                  isEmployee 
                    ? 'border-indigo-500/30 shadow-lg shadow-indigo-950/20 hover:border-indigo-500/50' 
                    : ad.type === 'offer' ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-amber-500/20 hover:border-amber-500/40'
                }`} dir="rtl">
                
                {/* Type & Category Badges */}
                <div className="absolute top-0 left-0 flex items-center gap-1.5">
                  {isEmployee && (
                    <div className="px-3 py-1 rounded-br-2xl text-[10px] font-black bg-indigo-600/90 text-white shadow-lg flex items-center gap-1">
                      <span>👔</span>
                      <span>خط موظفين</span>
                    </div>
                  )}
                  <div className={`px-3.5 py-1 text-[10px] font-black ${!isEmployee ? 'rounded-br-2xl' : 'rounded-b-2xl'} ${ad.type === 'offer' ? 'bg-emerald-600/95 text-white' : 'bg-amber-600/95 text-white'}`}>
                    {ad.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'}
                  </div>
                </div>

                {isNewItem(ad.createdAt) && (
                  <div className="absolute top-8 left-3 px-2.5 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-black rounded-full z-10 shadow-lg shadow-red-500/20 border border-red-400/20 animate-pulse">
                    حديث ✨
                  </div>
                )}

                <div className="pt-4">
                  <div className="flex justify-between items-start mb-3.5">
                    <div>
                      <h3 className="text-lg font-black text-white mb-1.5 flex items-center gap-2">
                        {ad.university}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1.5 leading-relaxed">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0"/> 
                        <span>المناطق: <span className="text-white font-bold">{ad.regions}</span></span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4.5">
                    <div className="bg-gray-900/60 border border-gray-850/40 rounded-2xl p-2.5 text-center shadow-inner">
                      <p className="text-gray-400 text-[10px] font-bold mb-0.5">الدوام</p>
                      <p className="text-white font-black text-xs">{ad.shift}</p>
                    </div>
                    {ad.type === 'offer' && (
                      <div className="bg-gray-900/60 border border-gray-850/40 rounded-2xl p-2.5 text-center shadow-inner">
                        <p className="text-gray-400 text-[10px] font-bold mb-0.5">المقاعد</p>
                        <p className="text-emerald-400 font-black text-xs">{ad.seats} <span className="text-gray-500 font-normal">متاح</span></p>
                      </div>
                    )}
                    <div className="bg-gray-900/60 border border-gray-850/40 rounded-2xl p-2.5 text-center shadow-inner">
                      <p className="text-gray-400 text-[10px] font-bold mb-0.5">الفئة</p>
                      <p className="text-white font-black text-xs">{ad.targetAudience}</p>
                    </div>
                    <div className="bg-gray-900/60 border border-gray-850/40 rounded-2xl p-2.5 text-center shadow-inner">
                      <p className="text-gray-400 text-[10px] font-bold mb-0.5">المركبة</p>
                      <p className="text-white font-black text-xs">{ad.vehicleType}</p>
                    </div>
                  </div>

                  {ad.price && (
                    <div className="flex items-center gap-2 text-amber-500 text-xs sm:text-sm font-black mb-3.5 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl inline-flex">
                      <Tag className="w-4 h-4"/>
                      <span>السعر المفضل: {ad.price}</span>
                    </div>
                  )}

                  {ad.note&&<p className="text-gray-300 text-xs mb-4.5 bg-gray-900/40 border border-gray-850 rounded-2xl p-3.5 leading-relaxed">{ad.note}</p>}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-900/60">
                    <div className="flex items-center gap-2.5">
                      <img src={ad.sellerAvatar||'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-9 h-9 rounded-full object-cover ${seller?.role && seller.role !== 'user' ? getGlowClass(seller.role) : 'border border-gray-800'}`}/>
                      <div>
                        <span className="text-gray-300 text-xs block font-bold">{ad.sellerName}</span>
                        <span className="text-gray-500 text-[10px] block font-semibold"><TimeAgo iso={ad.createdAt}/></span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {user && user.id === ad.postedBy && (
                        <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(ad.id, 'matched', ad.type === 'request' ? 'found_line' : 'line_full'); }} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black rounded-xl text-xs hover:bg-emerald-500/20 transition-all">
                          <CheckCircle className="w-3.5 h-3.5"/> حصلت
                        </button>
                      )}
                      <motion.a href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
                        whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-xl text-xs shadow-lg shadow-green-500/10 hover:from-green-400 hover:to-emerald-500 transition-all">
                        <MessageSquare className="w-3.5 h-3.5"/> واتساب
                      </motion.a>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleUniversalShare({ id: ad.id, university: ad.university, type: ad.type, regions: ad.regions, price: ad.price }); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black rounded-xl text-xs hover:bg-amber-500/20 transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" /> مشاركة
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
            <InfiniteScrollTrigger 
              hasMore={hasMore !== undefined ? hasMore : visibleCount < filtered.length} 
              isLoading={loadingMore} 
              onLoadMore={async () => {
                setLoadingMore(true);
                if (onLoadMore) {
                  await onLoadMore();
                } else {
                  await new Promise(r => setTimeout(r, 400));
                  setVisibleCount(prev => prev + 4);
                }
                setLoadingMore(false);
              }} 
              loadingText="جاري تحميل المزيد من الخطوط..." 
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && user && (
          <TransportFormModal user={user} onClose={()=>setShowForm(false)} onSubmit={handlePost} lines={lines} cost={adCosts?.transport !== undefined ? adCosts.transport : 1} />
        )}
      </AnimatePresence>
    </div>
  );
}
