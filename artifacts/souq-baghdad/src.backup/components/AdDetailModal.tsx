// ===========================================
// مسؤولية هذا الملف:
// يعرض نافذة تفاصيل الإعلان الكاملة (Ad Detail Modal).
//
// يجلب البيانات من Supabase:
// - تسجيل مشاهدة الإعلان (recordItemView).
// - بيانات البائع ودرجة التقييم.
//
// الميزات المدمجة:
// - عرض صور الإعلان مع Lightbox.
// - زر واتساب للتواصل مع البائع.
// - زر مشاركة الإعلان.
// - عرض تفاصيل البائع.
//
// استعلام Supabase:
// يُنفَّذ مرة واحدة عند فتح النافذة (تسجيل المشاهدة).
//
// آمن للتعديل:
// نعم، لكن لا تحذف استدعاء recordItemView.
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

export function AdDetailModal({ ad, onClose, isFav, onFav, user, storedUsers = [], onAuthRequired, onSellerClick, onViewDurationLogged, onImageZoom, onViewsUpdated }:{
  ad:Ad|null; onClose:()=>void; isFav:boolean; onFav:()=>void; user:User|null; storedUsers?:any[]; onAuthRequired:()=>void; onSellerClick?:(sellerId:string)=>void;
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
    if (ad) {
      setRealViews(ad.views || 0);
      recordItemView(ad.id, 'ad', user, ad.postedBy).then(() => {
        // Optimistically update local view count by 1 since we just recorded a view
        const lastViewKey = `last_view_ad_${ad.id}`;
        // Only increment local count if we aren't the owner
        if (user?.id !== ad.postedBy) {
           const newViews = (ad.views || 0) + 1;
           setRealViews(newViews);
           onViewsUpdated?.(ad.id, newViews);
        }
      });
    }
  },[ad]);

  useEffect(() => {
    const start = Date.now();
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed >= 1 && ad) {
        onViewDurationLogged?.(elapsed);
      }
    };
  }, [ad?.id]);

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
    const total = ad?.images?.length || 0;
    if (total <= 1) return;

    if (distance > 35) {
      setImgIdx(i => i < total - 1 ? i + 1 : i);
    } else if (distance < -35) {
      setImgIdx(i => i > 0 ? i - 1 : i);
    }
  };

  if(!ad) return null;
  const totalImgs = ad.images?.length || 0;
  const liveSeller = storedUsers.find(u => String(u.id) === String(ad.postedBy)) || ad.seller;
  const isOnline = Boolean(ad.postedBy && onlineStatuses[ad.postedBy]);
  const catObj = CATEGORIES.find(c => c.id === ad.category);
  const catName = catObj ? `${catObj.emoji} ${catObj.name}` : ad.category || 'عام';

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <InterestTimer itemId={ad.id} itemType="ad" />
        <div className="relative">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="aspect-video overflow-hidden rounded-t-3xl bg-gray-800 relative group touch-pan-y"
          >
            <img src={ad.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={ad.title}
              decoding="async"
              fetchPriority="high"
              onClick={() => onImageZoom?.(ad.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700', ad.title, ad.images, imgIdx)}
              draggable={false}
              className="w-full h-full object-cover cursor-zoom-in transition-all duration-300"/>
            
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
              <span>🔍 اضغط لتكبير وتحميل الصورة</span>
            </div>

            {totalImgs > 1 && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1">
                <span>👈 اسحب باللمس للتقليب 👉</span>
              </div>
            )}
          </div>

          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
          <button 
            onClick={async () => {
              if(!user) { onAuthRequired(); return; }
              const reason = window.prompt('يرجى كتابة سبب الإبلاغ عن هذا الإعلان:');
              if (!reason) return;
              const { error } = await supabase.from('support_messages').insert({
                name: `REPORT: ${ad.title}`,
                contact_info: `${user.name} (${user.phone || user.id})`,
                message: JSON.stringify({ item_id: ad.id, item_type: 'ad', reason }),
                user_id: user.id
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
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">{ad.images?.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`h-2 rounded-full transition-all ${i===imgIdx?'w-6 bg-amber-400':'w-2 bg-white/60'}`} title={`عرض الصورة ${i + 1}`} aria-label={`عرض الصورة ${i + 1}`}/>)}</div>
          </>}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
                  {catName}
                </span>
                <div className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-700 text-xs text-gray-400">
                  <span>{ad.short_id ? `#${ad.short_id}` : `#${String(ad.id).substring(0, 5)}`}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(ad.short_id || String(ad.id).substring(0, 5))); alert('تم نسخ رقم الإعلان!'); }} className="text-amber-400 hover:text-amber-300" title="نسخ رقم الإعلان" aria-label="نسخ رقم الإعلان">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{ad.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{ad.location}</span>
                <TimeAgo iso={ad.createdAtISO} className="text-green-400 font-medium"/>
                <button onClick={() => {
                  const canViewViewers = user?.isVerified || String(user?.id) === String(ad.postedBy) || user?.role === 'admin' || user?.role === 'owner';
                  if (canViewViewers) setShowViewers(true);
                  else alert('عذراً، رؤية قائمة المشاهدات متاحة للمعلن والحسابات الموثقة فقط 🌟');
                }} className="flex items-center gap-1 text-xs hover:text-amber-400 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full transition-colors">
                  <Eye className="w-3.5 h-3.5"/><span>{realViews} مشاهدة</span>
                </button>
              </div>
            </div>
            <div className="text-left shrink-0"><p className="text-2xl font-bold text-amber-400">{formatPrice(ad.price)}</p><p className="text-gray-400 text-xs">دينار عراقي</p></div>
          </div>
          <AnimatePresence>
            {showViewers && (
              <Suspense fallback={null}>
                <ViewersModal itemId={ad.id} itemType="ad" onClose={() => setShowViewers(false)} />
              </Suspense>
            )}
          </AnimatePresence>
          {ad.description&&<div className="bg-gray-800 rounded-xl p-4 mb-4"><h3 className="text-white font-bold text-sm mb-2">الوصف</h3><p className="text-gray-300 text-sm leading-relaxed">{ad.description}</p></div>}
          {/* Seller */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="relative hover:opacity-80 transition-opacity shrink-0">
                <img src={liveSeller?.avatar || ad.seller?.avatar || DEFAULT_AVATAR} alt="" className={`w-12 h-12 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-transparent shadow-sm shadow-[#0c2b5e]/10 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'أوفلاين'} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="text-white font-bold text-sm hover:text-amber-400 truncate">{liveSeller?.name || ad.seller?.name || 'مستخدم'}</button>
                  {liveSeller?.isVerified && <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                  </span>
                  <div className="flex items-center gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} className={`w-3 h-3 ${i<Math.floor(liveSeller?.rating || ad.seller?.rating || 4.8)?'fill-amber-400 text-amber-400':'text-gray-600'}`}/>)}</div>
                </div>
              </div>
              <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="text-xs text-amber-400 hover:underline flex items-center gap-1 shrink-0">صفحة البائع<ChevronRight className="w-3 h-3"/></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.a href={getWhatsAppLink(ad.phone, ad.type === 'transport' ? 'transport' : 'product', { id: ad.id, short_id: ad.short_id, title: ad.title, location: ad.location, university: ad.description, time: 'راجع الإعلان' })} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl text-sm">
              <MessageSquare className="w-5 h-5"/> واتساب</motion.a>
            <motion.a href={`tel:${ad.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white font-bold rounded-xl text-sm">
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
              const typeText = ad.type === 'buy' ? 'شراء' : ad.type === 'rent' ? 'ايجار' : ad.type === 'service' ? 'خدمات' : 'بيع';
              const categoryText = ad.category || 'عام';
              const titleText = ad.title || 'اعلان';
              const govText = ad.governorate || ad.location || 'العراق';
              const slug = `${slugify(typeText)}-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
              handleUniversalShare({ 
                id: ad.id, 
                short_id: ad.short_id, 
                title: ad.title, 
                location: ad.location, 
                price: ad.price, 
                image: ad.images?.[0], 
                description: ad.description,
                url: `/ad/${slug}-${ad.short_id || ad.id}`
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
