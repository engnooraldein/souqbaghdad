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
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage, DEFAULT_AVATAR } from '../App';
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

  useEffect(()=>{
    setImgIdx(0);
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
      setImgIdx(i => i < total - 1 ? i + 1 : i);
    } else if (distance < -35) {
      setImgIdx(i => i > 0 ? i - 1 : i);
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
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <InterestTimer itemId={product.id} itemType="product" />
        <div className="relative">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="aspect-video overflow-hidden rounded-t-3xl bg-gray-800 relative group touch-pan-y"
          >
            <img src={product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={product.title}
              decoding="async"
              fetchPriority="high"
              onClick={() => onImageZoom?.(product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700', product.title, product.images, imgIdx)}
              draggable={false}
              className="w-full h-full object-cover cursor-zoom-in transition-all duration-300"/>
          </div>

          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
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
            className="absolute top-3 right-14 p-2 bg-black/60 rounded-xl text-red-400 z-10 hover:bg-red-950/60 flex items-center gap-1 font-bold text-xs"
            title="إبلاغ عن محتوى مخالف"
          >
            <span>🚩</span> إبلاغ
          </button>
          {totalImgs > 1 && <>
            <button onClick={()=>setImgIdx(i=>(i - 1 + totalImgs) % totalImgs)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-xl text-white z-10 transition-all" title="الصورة السابقة" aria-label="الصورة السابقة"><ChevronRight className="w-6 h-6"/></button>
            <button onClick={()=>setImgIdx(i=>(i + 1) % totalImgs)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-xl text-white z-10 transition-all" title="الصورة التالية" aria-label="الصورة التالية"><ChevronLeft className="w-6 h-6"/></button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">{product.images?.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`h-2 rounded-full transition-all ${i===imgIdx?'w-6 bg-amber-400':'w-2 bg-white/60'}`} title={`عرض الصورة ${i + 1}`} aria-label={`عرض الصورة ${i + 1}`}/>)}</div>
          </>}
          <div className="absolute top-3 left-12 px-3 py-1 rounded-full text-xs font-bold text-white z-10" style={{background:product.condition==='new'?'#22c55e':'#f59e0b'}}>
            {product.condition==='new'?'جديد':'مستعمل'}</div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
                  🛍️ منتج للتسوق
                </span>
                <div className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-700 text-xs text-gray-400">
                  <span>{product.short_id ? `#${product.short_id}` : `#${String(product.id).substring(0, 5)}`}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(product.short_id || String(product.id).substring(0, 5))); alert('تم نسخ رقم المنتج!'); }} className="text-amber-400 hover:text-amber-300" title="نسخ رقم المنتج" aria-label="نسخ رقم المنتج">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{product.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{product.governorate}</span>
                <TimeAgo iso={product.createdAtISO} className="text-green-400 font-medium"/>
                <button onClick={() => {
                  const canViewViewers = user?.isVerified || String(user?.id) === String(product.postedBy) || user?.role === 'admin' || user?.role === 'owner';
                  if (canViewViewers) setShowViewers(true);
                  else alert('عذراً، رؤية قائمة المشاهدات متاحة للمعلن والحسابات الموثقة فقط 🌟');
                }} className="flex items-center gap-1 text-xs hover:text-amber-400 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full transition-colors">
                  <Eye className="w-3.5 h-3.5"/><span>{realViews} مشاهدة</span>
                </button>
              </div>
            </div>
            <div className="text-left shrink-0"><p className="text-2xl font-bold text-amber-400">{formatPrice(product.price)}</p><p className="text-gray-400 text-xs">دينار عراقي</p></div>
          </div>
          <AnimatePresence>
            {showViewers && (
              <Suspense fallback={null}>
                <ViewersModal itemId={product.id} itemType="product" onClose={() => setShowViewers(false)} />
              </Suspense>
            )}
          </AnimatePresence>
          {product.stock>0&&<div className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full mb-3"><Package className="w-3 h-3"/>متوفر: {product.stock} قطعة</div>}
          {product.description&&<div className="bg-gray-800 rounded-xl p-4 mb-4"><h3 className="text-white font-bold text-sm mb-2">الوصف</h3><p className="text-gray-300 text-sm leading-relaxed">{product.description}</p></div>}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="relative hover:opacity-80 transition-opacity shrink-0">
                <img src={currentSeller?.avatar || product.seller?.avatar || DEFAULT_AVATAR} alt="" className={`w-12 h-12 rounded-full object-cover ${currentSeller?.role && currentSeller.role !== 'user' ? getGlowClass(currentSeller.role) : 'border border-gray-600'}`}/>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-transparent shadow-sm shadow-[#0c2b5e]/10 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'أوفلاين'} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-white font-bold text-sm hover:text-amber-400 truncate">{currentSeller?.name || product.seller?.name || 'مستخدم'}</button>
                  {currentSeller?.isVerified && <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_,i)=>(
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(currentSeller?.rating || product.seller?.rating || 4.8) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}/>
                    ))}
                    <span className="text-[10px] text-gray-400 mr-1">({currentSeller?.ratingCount || product.seller?.ratingCount || 5})</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-xs text-amber-400 hover:underline flex items-center gap-1 shrink-0">صفحة البائع<ChevronRight className="w-3 h-3"/></button>
            </div>

            {/* Interactive Rating Panel */}
            {user && String(user.id) !== String(product.postedBy) && (
              <div className="mt-4 pt-3 border-t border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2" dir="rtl">
                <span className="text-xs font-bold text-gray-300">قيّم تجربتك مع هذا المعلن:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateSeller(star)}
                      className="p-1 hover:scale-125 transition-transform"
                      title={`تقييم ${star} نجوم`}
                    >
                      <Star className={`w-5 h-5 transition-colors ${star <= (localUserRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-600 hover:text-amber-300'}`} />
                    </button>
                  ))}
                  {localUserRating > 0 && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold mr-2">تقييمك: {localUserRating} ⭐</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.a href={getWhatsAppLink(product.phone, 'product', { id: product.id, short_id: product.short_id, title: product.title, location: product.governorate })} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl text-sm">
              <MessageSquare className="w-5 h-5"/> واتساب</motion.a>
            <motion.a href={`tel:${product.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white font-bold rounded-xl text-sm">
              <PhoneIcon className="w-5 h-5"/> اتصال</motion.a>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{if(!user){onAuthRequired();return;}onFav();}}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${isFav?'bg-red-500 text-white':'bg-gray-800 text-white'}`}>
              <Heart className={`w-4 h-4 ${isFav?'fill-current':''}`}/>{isFav?'في المفضلة':'أضف للمفضلة'}</button>
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
              className="flex-1 py-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-amber-500/30">
              <Share2 className="w-4 h-4"/> مشاركة</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
