// ===========================================
// مسؤولية هذا الملف:
// يعرض نافذة تفاصيل المنتج الكاملة (Product Detail Modal).
//
// يجلب البيانات من Supabase:
// - تسجيل مشاهدة المنتج (recordItemView).
//
// الميزات المدمجة:
// - عرض صور المنتج مع Lightbox.
// - زر واتساب للتواصل مع البائع.
// - زر مشاركة المنتج.
//
// استعلام Supabase:
// يُنفَّذ مرة واحدة عند فتح النافذة.
//
// آمن للتعديل:
// نعم.
// ===========================================
import { useOnlineStatuses } from '../hooks/useOnlineStatuses';
import { InterestTimer } from './InterestTimer';
import { TimeAgo } from './TimeAgo';
import { VerifiedBadge } from './VerifiedBadge';
import { ReadingModeOverlay } from './ReadingModeOverlay';
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage, DEFAULT_AVATAR } from '../App';
import { ReportModal } from './ReportModal';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass } from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';

// Map all lucide icons to global scope to avoid missing imports
const {
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User: UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image: ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone: PhoneIcon,
  FileText, Gamepad2, Copy, Crown, View, Eye: ViewIcon
} = LucideIcons;

export function ProductDetailModal({ product, onClose, isFav, onFav, user, storedUsers = [], onAuthRequired, onSellerClick, onViewDurationLogged, onImageZoom, onViewsUpdated }:{
  product:Product|null; onClose:()=>void; isFav:boolean; onFav:()=>void; user:User|null; storedUsers?:any[]; onAuthRequired:()=>void; onSellerClick?:(id:any)=>void;
  onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string, images?:string[], initialIdx?:number)=>void;
  onViewsUpdated?:(id:string|number, views:number)=>void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const onlineStatuses = useOnlineStatuses();
  const [realViews, setRealViews] = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReadingMode, setShowReadingMode] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(()=>{
    setImgIdx(0);
    setIsDescExpanded(false);
    if (product) {
      setRealViews(product.views || 0);
      recordItemView(product.id, 'product', user, product.postedBy).then(() => {
        if (user?.id !== product.postedBy) {
          const newViews = (product.views || 0) + 1;
          setRealViews(newViews);
          onViewsUpdated?.(product.id, newViews);
        }
      });
    }
  },[product]);

  useEffect(() => {
    const start = Date.now();
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed >= 1 && product) {
        onViewDurationLogged?.(elapsed);
      }
    };
  }, [product?.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const total = product?.images?.length || 0;
    if (total <= 1) return;

    if (distance > 35) {
      setImgIdx(i => (i + 1) % total);
    } else if (distance < -35) {
      setImgIdx(i => (i - 1 + total) % total);
    }
  };

  if(!product) return null;
  const totalImgs = product.images?.length || 0;
  
  const [currentSeller, setCurrentSeller] = useState(() => {
    return storedUsers?.find(u => String(u.id) === String(product?.postedBy)) || product?.seller;
  });

  const [localUserRating, setLocalUserRating] = useState(() => {
    try {
      const rated = JSON.parse(localStorage.getItem('souq_rated_sellers') || '{}');
      return rated[product?.postedBy || ''] || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const found = storedUsers?.find(u => String(u.id) === String(product?.postedBy));
    if (found) {
      setCurrentSeller(found);
    }
  }, [storedUsers, product?.postedBy]);

  const handleRateSeller = (stars: number) => {
    if (!user) {
      onAuthRequired();
      return;
    }
    const sellerId = product?.postedBy;
    if (!sellerId) return;
    if (user.id === sellerId) {
      alert('لا يمكنك تقييم نفسك!');
      return;
    }

    try {
      const rated = JSON.parse(localStorage.getItem('souq_rated_sellers') || '{}');
      rated[sellerId] = stars;
      localStorage.setItem('souq_rated_sellers', JSON.stringify(rated));
      setLocalUserRating(stars);

      const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const idx = users.findIndex((u: any) => u.id === sellerId);
      let targetUser = users[idx];
      if (!targetUser) {
        targetUser = {
          id: sellerId,
          name: currentSeller?.name || product?.seller?.name || 'مستخدم',
          avatar: currentSeller?.avatar || product?.seller?.avatar || '',
          cover: currentSeller?.cover || '',
          location: currentSeller?.location || 'العراق',
          isVerified: currentSeller?.isVerified || false,
          rating: 4.8,
          ratingCount: 5
        };
      }

      const oldCount = targetUser.ratingCount ?? 5;
      const oldRating = targetUser.rating ?? 4.8;
      const newCount = oldCount + 1;
      const newRating = Number(((oldRating * oldCount + stars) / newCount).toFixed(1));

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
      setCurrentSeller(updatedUser);
      
      window.dispatchEvent(new CustomEvent('souq-seller-rated', { detail: { sellerId, updatedUser } }));
      alert('شكراً لتقييمك! ⭐ تم تحديث تقييم البائع بنجاح.');
    } catch (e) {
      console.error(e);
    }
  };

  const isOnline = !!onlineStatuses[product.postedBy];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-2xl w-full max-w-lg max-h-[94vh] overflow-y-auto border border-gray-700 z-10 scrollbar-none">
        <InterestTimer itemId={product.id} itemType="product" />
        <div className="relative">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="aspect-[16/10] sm:aspect-video overflow-hidden rounded-t-2xl bg-gray-800 relative group touch-pan-y"
          >
            <img src={product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={product.title}
              decoding="async"
              fetchPriority="high"
              onClick={() => onImageZoom?.(product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700', product.title, product.images, imgIdx)}
              draggable={false}
              className="w-full h-full object-cover cursor-zoom-in transition-all duration-300"/>
          </div>

          <button onClick={onClose} className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 rounded-lg text-white z-10 hover:bg-black/80" title="إغلاق" aria-label="إغلاق"><X className="w-4 h-4"/></button>
          <button 
            onClick={async () => {
              if(!user) { onAuthRequired(); return; }
              const reason = window.prompt('يرجى كتابة سبب الإبلاغ عن هذا المنتج:');
              if (!reason) return;
              const { error } = await supabase.from('support_messages').insert({
                name: `REPORT: ${product.title}`,
                contact_info: `${user.name} (${user.phone || user.id})`,
                message: JSON.stringify({ item_id: product.id, item_type: 'product', reason })
              });
              if (!error) {
                alert('تم تقديم البلاغ بنجاح وسيتم مراجعته من قبل الإدارة. شكراً لك! 🚩');
              } else {
                alert('حدث خطأ أثناء إرسال البلاغ.');
              }
            }} 
            className="absolute top-2.5 right-11 p-1.5 bg-black/60 rounded-lg text-red-400 z-10 hover:bg-red-950/60 flex items-center gap-0.5 font-bold text-[10px]"
            title="إبلاغ عن محتوى مخالف"
          >
            <span>🚩</span> إبلاغ
          </button>
          {totalImgs > 1 && <>
            <button onClick={()=>setImgIdx(i=>(i - 1 + totalImgs) % totalImgs)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white z-10 transition-all" title="الصورة السابقة" aria-label="الصورة السابقة"><ChevronRight className="w-5 h-5"/></button>
            <button onClick={()=>setImgIdx(i=>(i + 1) % totalImgs)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white z-10 transition-all" title="الصورة التالية" aria-label="الصورة التالية"><ChevronLeft className="w-5 h-5"/></button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">{product.images?.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`h-1.5 rounded-full transition-all ${i===imgIdx?'w-4 bg-amber-400':'w-1.5 bg-white/60'}`} title={`عرض الصورة ${i + 1}`} aria-label={`عرض الصورة ${i + 1}`}/>)}</div>
          </>}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white z-10" style={{background:product.condition==='new'?'#22c55e':'#f59e0b'}}>
            {product.condition==='new'?'جديد':'مستعمل'}</div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3.5 pb-3.5 border-b border-gray-800/60">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                  🛍️ منتج للتسوق
                </span>
                <div className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-700 text-[10px] text-gray-400">
                  <span>{product.short_id ? `#${product.short_id}` : `#${String(product.id).substring(0, 5)}`}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(product.short_id || String(product.id).substring(0, 5))); alert('تم نسخ رقم المنتج!'); }} className="text-amber-400 hover:text-amber-300" title="نسخ رقم المنتج" aria-label="نسخ رقم المنتج">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">{product.title}</h2>
              <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-purple-400"/>{product.governorate}</span>
                <span className="text-gray-700">•</span>
                <TimeAgo iso={product.createdAtISO} className="text-green-400 font-bold"/>
                <span className="text-gray-700">•</span>
                <button onClick={() => {
                  const canViewViewers = user?.isVerified || String(user?.id) === String(product.postedBy) || user?.role === 'admin' || user?.role === 'owner';
                  if (canViewViewers) setShowViewers(true);
                  else alert('عذراً، رؤية قائمة المشاهدات متاحة للمعلن والحسابات الموثقة فقط 🌟');
                }} className="flex items-center gap-1 text-[10px] hover:text-amber-400 text-amber-500 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full transition-colors">
                  <Eye className="w-3 h-3"/><span>{realViews} مشاهدة</span>
                </button>
              </div>
            </div>
            
            {/* Price Box: responsive layout */}
            <div className="w-full sm:w-auto bg-gradient-to-l from-purple-500/10 to-indigo-500/5 sm:bg-none border border-purple-500/20 sm:border-0 rounded-xl p-2.5 sm:p-0 flex items-center justify-between sm:block sm:text-left shrink-0">
              <span className="text-gray-400 text-[10px] font-black sm:hidden">السعر المطلوب:</span>
              <div className="text-left">
                <p className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight leading-none">{formatPrice(product.price)}</p>
                <p className="text-gray-400 text-[9px] sm:text-[10px] font-bold mt-0.5">دينار عراقي</p>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {showViewers && (
              <Suspense fallback={null}>
                <ViewersModal itemId={product.id} itemType="product" onClose={() => setShowViewers(false)} />
              </Suspense>
            )}
          </AnimatePresence>
          {product.stock>0&&<div className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-[10px] px-2.5 py-0.5 rounded-lg mb-2.5"><Package className="w-3 h-3"/>متوفر: {product.stock} قطعة</div>}
          {product.description && (
            <div className="bg-gray-800 rounded-xl p-3 mb-3 border border-gray-700/50">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-white font-bold text-xs">الوصف</h3>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(product.description || '');
                      alert('تم نسخ الوصف!');
                    }}
                    className="px-2 py-0.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 text-gray-300 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all duration-300"
                  >
                    <Copy className="w-3 h-3" /> نسخ
                  </button>
                  {product.description.length > 50 && (
                    <button 
                      type="button"
                      onClick={() => setShowReadingMode(true)}
                      className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all duration-300"
                    >
                      <span>📖</span> وضع القراءة المريح
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <p className={`text-gray-300 text-xs sm:text-sm leading-relaxed transition-all duration-300 whitespace-pre-line ${!isDescExpanded ? 'line-clamp-4' : ''}`}>
                  {product.description}
                </p>
                {(product.description.length > 180 || product.description.split('\n').length > 4) && (
                  <button 
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-amber-400 hover:text-amber-300 text-[10px] sm:text-xs font-bold mt-2 flex items-center gap-0.5 transition-all duration-200"
                  >
                    <span>{isDescExpanded ? 'عرض أقل ⬆️' : 'عرض المزيد... ⬇️'}</span>
                  </button>
                )}
              </div>
              
              <AnimatePresence>
                {showReadingMode && (
                  <ReadingModeOverlay 
                    text={product.description} 
                    title={product.title} 
                    onClose={() => setShowReadingMode(false)} 
                  />
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 mb-3">
            <div className="flex items-center gap-2.5">
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="relative hover:opacity-80 transition-opacity shrink-0">
                <img src={currentSeller?.avatar || product.seller?.avatar || DEFAULT_AVATAR} alt="" className={`w-10 h-10 rounded-full object-cover ${currentSeller?.role && currentSeller.role !== 'user' ? getGlowClass(currentSeller.role) : 'border border-gray-600'}`}/>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-transparent shadow-sm shadow-[#0c2b5e]/10 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'أوفلاين'} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-white font-bold text-xs sm:text-sm hover:text-amber-400 truncate">{currentSeller?.name || product.seller?.name || 'مستخدم'}</button>
                  {currentSeller?.isVerified && <VerifiedBadge className="w-3 h-3 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {isOnline ? '🟢 متصل' : '⚪ غير متصل'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_,i)=>(
                      <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(currentSeller?.rating || product.seller?.rating || 4.8) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}/>
                    ))}
                    <span className="text-[9px] text-gray-400 mr-0.5">({currentSeller?.ratingCount || product.seller?.ratingCount || 5})</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5 shrink-0">صفحة البائع<ChevronRight className="w-2.5 h-2.5"/></button>
            </div>

            {/* Interactive Rating Panel */}
            {user && String(user.id) !== String(product.postedBy) && (
              <div className="mt-2.5 pt-2 border-t border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5" dir="rtl">
                <span className="text-[10px] font-bold text-gray-300">قيّم تجربتك مع هذا المعلن:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateSeller(star)}
                      className="p-0.5 hover:scale-125 transition-transform"
                      title={`تقييم ${star} نجوم`}
                    >
                      <Star className={`w-4 h-4 transition-colors ${star <= (localUserRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-650 hover:text-amber-300'}`} />
                    </button>
                  ))}
                  {localUserRating > 0 && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold mr-1.5">تقييمك: {localUserRating} ⭐</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <motion.a href={getWhatsAppLink(product.phone, 'product', { id: product.id, short_id: product.short_id, title: product.title, location: product.governorate })} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white font-bold rounded-xl text-xs sm:text-sm">
              <MessageSquare className="w-4.5 h-4.5"/> واتساب</motion.a>
            <motion.a href={`tel:${product.phone}`} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-800 text-white font-bold rounded-xl text-xs sm:text-sm">
              <PhoneIcon className="w-4.5 h-4.5"/> اتصال</motion.a>
          </div>
          <div className="flex gap-2.5">
            <button onClick={()=>{if(!user){onAuthRequired();return;}onFav();}}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium ${isFav?'bg-red-500 text-white':'bg-gray-800 text-white'}`}>
              <Heart className={`w-3.5 h-3.5 ${isFav?'fill-current':''}`}/>{isFav?'في المفضلة':'أضف للمفضلة'}</button>
            <button onClick={()=>{
              const slugify = (text: string) => {
                return text
                  .toString()
                  .toLowerCase()
                  .trim()
                  .replace(/[\s_]+/g, '-')
                  .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
                  .replace(/--+/g, '-');
              };
              const categoryText = product.category || 'منتجات';
              const titleText = product.title || 'منتج';
              const govText = product.governorate || 'العراق';
              const slug = `تسوق-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
              handleUniversalShare({ 
                id: product.id, 
                short_id: product.short_id, 
                title: product.title, 
                governorate: product.governorate, 
                price: formatPrice(product.price), 
                image: product.images?.[0], 
                description: product.description,
                url: `/product/${slug}-${product.short_id || product.id}`
              });
            }}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/15 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black transition-all duration-300 shadow-sm active:scale-[0.98]">
              <Share2 className="w-3.5 h-3.5 text-amber-400 animate-pulse"/>
              <span>مشاركة المنتج</span>
            </button>
            <button 
              onClick={() => {
                if (!user) {
                  requireAuth();
                  return;
                }
                setShowReportModal(true);
              }}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition-all duration-300"
              title="إبلاغ عن المنتج"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={product.id}
        targetType="product"
        targetTitle={product.title}
      />
    </motion.div>
  );
}
