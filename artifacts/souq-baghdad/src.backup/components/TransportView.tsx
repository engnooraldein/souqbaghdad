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
    <div className="min-h-screen bg-[#0c2b5e]">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 pt-6 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_,i)=><div key={i} className="absolute border border-white/20 rounded-full" style={{width:`${(i+1)*80}px`,height:`${(i+1)*80}px`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>)}
        </div>
        <div className="container mx-auto max-w-2xl relative">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20" title="رجوع" aria-label="رجوع">
              <ChevronLeft className="w-5 h-5"/>
            </button>
            <div>
              <h1 className="text-white font-bold text-xl">🚌 قسم الخطوط والنقل اليومي</h1>
              <p className="text-emerald-200 text-sm">أسرع وأأمن طريق لدوامك اليومي (طلاب وموظفين)</p>
            </div>
          </div>
          
          {/* Smart Search & Filters */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 mb-4 space-y-3">
            
            {/* Main Category Tabs (Student vs Employee) */}
            <div className="flex items-center gap-2 p-1 bg-gray-900/80 rounded-2xl border border-emerald-500/20 shadow-inner">
              <button onClick={() => { setMainCategoryFilter('student'); setFilterUniversity('الكل'); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${mainCategoryFilter === 'student' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'text-gray-400 hover:text-white'}`}>
                🎓 خطوط الطلاب
              </button>
              <button onClick={() => { setMainCategoryFilter('employee'); setFilterUniversity('الكل'); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${mainCategoryFilter === 'employee' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                👔 خطوط الموظفين
              </button>
              <button onClick={() => { setMainCategoryFilter('all'); setFilterUniversity('الكل'); }}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${mainCategoryFilter === 'all' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}>
                ⚡ الكل
              </button>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300"/>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={mainCategoryFilter === 'employee' ? "ابحث عن شركة، دائرة، منطقة..." : "ابحث عن جامعة، منطقة، مقصد..."}
                className="w-full bg-gray-900/50 text-white placeholder-emerald-200/50 rounded-xl py-3 pr-10 pl-3 border border-emerald-500/30 focus:border-emerald-400 outline-none text-sm"/>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-emerald-300 text-xs mb-1 block">{mainCategoryFilter === 'employee' ? 'مكان العمل (دوائر / شركات)' : 'الوجهة / الجامعة'}</label>
                <select value={filterUniversity} onChange={e=>setFilterUniversity(e.target.value)} title="تصفية بالجامعة" aria-label="تصفية بالجامعة"
                  className="w-full bg-gray-900/50 text-white border border-emerald-500/30 rounded-xl py-2.5 px-3 outline-none text-sm backdrop-blur [color-scheme:dark]">
                  {dynamicUniversities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-emerald-300 text-xs mb-1 block">نوع الإعلان</label>
                <select value={filterType} onChange={e=>setFilterType(e.target.value)} title="تصفية بنوع الإعلان" aria-label="تصفية بنوع الإعلان"
                  className="w-full bg-gray-900/50 text-white border border-emerald-500/30 rounded-xl py-2.5 px-3 outline-none text-sm backdrop-blur [color-scheme:dark]">
                  <option>الكل</option>
                  <option>خطوط متوفرة</option>
                  <option>طلبات خطوط</option>
                </select>
              </div>
            </div>
          </div>

          {/* Post Button & My Lines Button */}
          <div className="flex gap-2">
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{ if(!user){onCreateAd();return;} setShowForm(true); }}
              className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30">
              <Plus className="w-5 h-5"/> إضافة إعلان جديد
            </motion.button>
            {user && onGoToMyLines && (
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={onGoToMyLines}
                className="px-4 py-3.5 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-gray-700 shadow-lg hover:bg-gray-700">
                🚌 خطوطي
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="container mx-auto max-w-2xl px-4 py-4">
        {isInitialLoading ? (
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl" dir="rtl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-emerald-400"/>
            </div>
            <h3 className="text-xl font-bold text-white">أهلاً بك في قسم الخطوط! ✨</h3>
            <p className="text-gray-300 text-sm">جاري تحميل أحدث إعلانات خطوط النقل، يرجى الانتظار ثوانٍ...</p>
            <div className="flex justify-center gap-1.5 pt-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚐</div>
            <h3 className="text-white font-bold text-lg mb-2">لا توجد إعلانات حالياً في هذا القسم</h3>
            <p className="text-gray-400 text-sm mb-6">كن أول من يضيف إعلاناً خط جديد</p>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{if(!user){onCreateAd();return;}setShowForm(true);}}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl">
              إضافة إعلان الآن
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="sticky top-[4rem] z-20 bg-[#0c2b5e]/90 backdrop-blur-md py-2.5 border-b border-transparent shadow-sm shadow-[#0c2b5e]/10 mb-2">
              <p className="text-gray-400 text-sm">
                تم العثور على <span className="text-emerald-400 font-bold">{filtered.length}</span> خط، يتم عرض {onLoadMore ? filtered.length : Math.min(visibleCount, filtered.length)} من أصل {filtered.length}
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
                className={`bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer ${
                  isEmployee 
                    ? 'border-indigo-500/50 hover:border-indigo-400 shadow-lg shadow-indigo-950/40' 
                    : ad.type === 'offer' ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-amber-500/30 hover:border-amber-500/60'
                }`}>
                
                {/* Type & Category Badges */}
                <div className="absolute top-0 right-0 flex items-center gap-1">
                  {isEmployee && (
                    <div className="px-2.5 py-1 rounded-bl-xl text-[10px] font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-1">
                      <span>👔</span>
                      <span>خط موظفين</span>
                    </div>
                  )}
                  <div className={`px-3 py-1 text-[10px] font-bold ${!isEmployee ? 'rounded-bl-xl' : 'rounded-b-xl'} ${ad.type === 'offer' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>
                    {ad.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'}
                  </div>
                </div>

                {isNewItem(ad.createdAt) && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-extrabold rounded-lg z-10 shadow-lg shadow-red-500/25 border border-red-400/30 animate-pulse">
                    حديث ✨
                  </div>
                )}

                <div className="p-4 pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                        {ad.university}
                      </h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1.5 leading-relaxed">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0"/> 
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
                      <Tag className="w-4 h-4"/>
                      <span>السعر المفضل: {ad.price}</span>
                    </div>
                  )}

                  {ad.note&&<p className="text-gray-300 text-xs mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">{ad.note}</p>}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <img src={ad.sellerAvatar||'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-8 h-8 rounded-full object-cover ${seller?.role && seller.role !== 'user' ? getGlowClass(seller.role) : 'border border-gray-600'}`}/>
                      <div>
                        <span className="text-gray-300 text-xs block font-semibold">{ad.sellerName}</span>
                        <span className="text-gray-500 text-[10px] block"><TimeAgo iso={ad.createdAt}/></span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {user && user.id === ad.postedBy && (
                        <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(ad.id, 'matched', ad.type === 'request' ? 'found_line' : 'line_full'); }} className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white rounded-xl text-xs hover:bg-gray-600">
                          <CheckCircle className="w-3.5 h-3.5"/> حصلت
                        </button>
                      )}
                      <motion.a href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
                        whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20">
                        <MessageSquare className="w-3.5 h-3.5"/> واتساب
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
