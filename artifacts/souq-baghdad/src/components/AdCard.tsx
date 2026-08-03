// ===========================================
// مسؤولية هذا الملف:
// يعرض بطاقة إعلان مبسّطة (Ad Card) في قائمة الإعلانات.
//
// لا يقوم بجلب البيانات.
// الجلب يتم في MarketView عبر fetchAds() في App.tsx.
//
// الـ Props:
// - ad: بيانات الإعلان.
// - onSelect: يفتح تفاصيل الإعلان.
// - isFav/onFav: لإدارة المفضلة.
// - onSellerClick: للانتقال لملف البائع.
//
// انتبه:
// المكوّن يستخدم hook خارجي (useOnlineStatuses) يستعلم Supabase
// لمعرفة من هو متصل. تأكد أن هذا الـ Hook لا يُعيد الاستعلام كثيراً.
//
// ⚠️ Dead Code تحذير:
// الـ Import القادم من App.tsx ضخم جداً. الـ CATEGORIES وغيرها لا تُستخدم هنا.
// يُنصح باستخدام import من ملفات مخصصة بدلاً من App.tsx.
// ===========================================
import { useOnlineStatuses } from '../hooks/useOnlineStatuses';
import { useRelativeTime } from '../utils/time';
import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Ad } from '../types';
import { handleUniversalShare, DEFAULT_AVATAR } from '../App';
import { isNewItem, getGlowClass } from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { supabase } from '../lib/supabase';
import { ImageWithDataSaver } from './ImageWithDataSaver';
import { VerifiedBadge } from './VerifiedBadge';
import { triggerHaptic } from '../utils/haptics';

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
  FileText, Gamepad2, Copy, Crown, View, Eye: ViewIcon, Shirt, Laptop
} = LucideIcons;

export function getAdCategoryPlaceholderImage(category?: string, titleText?: string): string {
  const text = (titleText || '').toLowerCase();
  
  // 1. Cars Smart Image Matching
  if (category === 'cars' || text.includes('سيار') || text.includes('النترا') || text.includes('elantra') || text.includes('كورولا') || text.includes('سبورتاج')) {
    if (text.includes('النترا') || text.includes('elantra')) {
      return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=700'; // Modern Hyundai Elantra style
    }
    if (text.includes('كورولا') || text.includes('corolla') || text.includes('كامري') || text.includes('camry') || text.includes('تويوتا')) {
      return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=700'; // Toyota Corolla / Camry style
    }
    if (text.includes('سبورتاج') || text.includes('sportage') || text.includes('توسان') || text.includes('tucson') || text.includes('كيا')) {
      return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=700'; // SUV Sportage / Tucson style
    }
    if (text.includes('تشارجر') || text.includes('charger') || text.includes('دودج') || text.includes('challenger')) {
      return 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=700'; // Dodge Charger / Muscle car style
    }
    if (text.includes('مرسيدس') || text.includes('mercedes') || text.includes('bmw') || text.includes('بي أم')) {
      return 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=700'; // BMW / Luxury Sports Sedan
    }
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700'; // Modern luxury car
  }

  // 2. Phones Smart Image Matching
  if (category === 'phones' || text.includes('آيفون') || text.includes('iphone') || text.includes('سامسونج') || text.includes('samsung')) {
    if (text.includes('آيفون') || text.includes('iphone') || text.includes('أبل') || text.includes('apple')) {
      return 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=700'; // iPhone Pro Max HD
    }
    if (text.includes('سامسونج') || text.includes('samsung') || text.includes('جالكسي') || text.includes('galaxy')) {
      return 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700'; // Samsung Ultra HD
    }
    if (text.includes('شاومي') || text.includes('xiaomi') || text.includes('هواوي') || text.includes('huawei')) {
      return 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700'; // Xiaomi / Android flagship
    }
    if (text.includes('أيباد') || text.includes('ipad') || text.includes('تابلت') || text.includes('tablet')) {
      return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=700'; // iPad Pro / Tablet
    }
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700'; // Sleek smartphone
  }

  // 3. Gym & Supplements Smart Image Matching
  if (category === 'gym' || text.includes('بروتين') || text.includes('مكمل') || text.includes('واي') || text.includes('whey')) {
    if (text.includes('مكمل') || text.includes('بروتين') || text.includes('واي') || text.includes('whey') || text.includes('كرياتين') || text.includes('creatine')) {
      return 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=700'; // Whey Protein Powder Tub HD
    }
    if (text.includes('ملابس') || text.includes('تجهيز') || text.includes('فانيلة')) {
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700'; // Gym Apparel
    }
    if (text.includes('معدات') || text.includes('دامبل') || text.includes('dumbbell') || text.includes('وزن')) {
      return 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=700'; // Gym Dumbbells / Barbell
    }
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700';
  }

  // 4. Real Estate Smart Image Matching
  if (category === 'real-estate' || text.includes('دار') || text.includes('بيت') || text.includes('شقة') || text.includes('أرض')) {
    if (text.includes('شقة') || text.includes('apartment')) {
      return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700'; // Modern Luxury Apartment
    }
    if (text.includes('أرض') || text.includes('مزرعة') || text.includes('فيلا')) {
      return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700'; // Luxury Villa / Estate
    }
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700'; // Premium Iraqi House
  }

  // 5. Electronics Smart Image Matching
  if (category === 'electronics' || text.includes('لاب توب') || text.includes('شاشة') || text.includes('تلفزيون')) {
    if (text.includes('لاب توب') || text.includes('laptop') || text.includes('ماك') || text.includes('macbook')) {
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700'; // Modern Laptop MacBook setup
    }
    if (text.includes('شاشة') || text.includes('تلفزيون') || text.includes('tv')) {
      return 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=700'; // 4K Smart TV Screen
    }
    return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700';
  }

  switch (category) {
    case 'gym':
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700';
    case 'cars':
      return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700';
    case 'real-estate':
      return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700';
    case 'phones':
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700';
    case 'electronics':
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700';
    case 'clothes':
      return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700';
    case 'cosmetics':
      return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700';
    case 'handmade':
      return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=700';
    case 'jobs':
      return 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=700';
    case 'furniture':
      return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700';
    case 'bikes':
      return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=700';
    case 'services':
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700'; // Professional repair/service
    case 'games':
      return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700'; // Gaming console/controller
    default:
      return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700';
  }
}

export const getCategoryIcon = (categoryId?: string) => {
  switch (categoryId) {
    case 'cars':
      return { icon: Car, label: 'سيارات', color: 'bg-gray-800/25 text-blue-300 border-gray-800/40' };
    case 'real-estate':
      return { icon: Home, label: 'عقارات', color: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' };
    case 'phones':
      return { icon: Smartphone, label: 'هواتف', color: 'bg-purple-500/25 text-purple-300 border-purple-500/40' };
    case 'electronics':
      return { icon: Laptop, label: 'إلكترونيات', color: 'bg-pink-500/25 text-pink-300 border-pink-500/40' };
    case 'clothes':
      return { icon: Shirt, label: 'ملابس', color: 'bg-amber-500/25 text-amber-300 border-amber-500/40' };
    case 'cosmetics':
      return { icon: Sparkles, label: 'كوزمتك', color: 'bg-teal-500/25 text-teal-300 border-teal-500/40' };
    case 'handmade':
      return { icon: ShoppingBag, label: 'حرف يدوية', color: 'bg-indigo-500/25 text-indigo-300 border-indigo-500/40' };
    case 'jobs':
      return { icon: FileText, label: 'وظائف', color: 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40' };
    case 'furniture':
      return { icon: Home, label: 'أثاث', color: 'bg-orange-500/25 text-orange-300 border-orange-500/40' };
    case 'bikes':
      return { icon: Bike, label: 'دراجات', color: 'bg-red-500/25 text-red-300 border-red-500/40' };
    case 'services':
      return { icon: Wrench, label: 'خدمات', color: 'bg-yellow-500/25 text-yellow-300 border-yellow-500/40' };
    case 'games':
      return { icon: Gamepad2, label: 'ألعاب', color: 'bg-violet-500/25 text-violet-300 border-violet-500/40' };
    default:
      return { icon: Package, label: 'أخرى', color: 'bg-gray-500/25 text-gray-300 border-gray-500/40' };
  }
};

export const AdCard = React.memo(function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole, compact }:{
  ad:Ad; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
  sellerRole?: string;
  compact?: boolean;
}) {
  const onlineStatuses = useOnlineStatuses();
  const time = useRelativeTime(ad.createdAtISO);
  const catInfo = getCategoryIcon(ad.category);
  const CategoryIconComponent = catInfo.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }} 
      onClick={() => { triggerHaptic('light'); onSelect(); }} 
      onContextMenu={onActionMenu}
      className={`bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full shadow-md hover:shadow-lg ${
        compact ? 'bg-white dark:bg-gray-950/20 border-gray-150 dark:border-gray-900/60' : ''
      }`}
    >
      <div className={`relative w-full overflow-hidden flex-shrink-0 rounded-t-xl aspect-[4/3]`}>
        <ImageWithDataSaver 
          src={
            (!ad.images?.[0] || ad.images[0].includes('photo-1523275335684') || ad.images[0].includes('watch') || ad.images[0].includes('photo-1558618666')) 
              ? getAdCategoryPlaceholderImage(ad.category, `${ad.title} ${(ad as any).subCategory || ''}`) 
              : ad.images[0]
          } 
          fallback={getAdCategoryPlaceholderImage(ad.category, `${ad.title} ${(ad as any).subCategory || ''}`)}
          alt={`${ad.title} | سوق بغداد الرقمي - ${ad.governorate || 'العراق'}`} 
          className="w-full h-full object-cover" 
        />
        
        {/* Top Right: Condition Badge (New/Used) */}
        <div className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow-lg backdrop-blur-md z-10 ${
          ad.condition === 'new' ? 'bg-emerald-600/90 border border-emerald-400/40' : 'bg-amber-600/90 border border-amber-400/40'
        }`}>
          {ad.condition === 'new' ? 'جديد' : 'مستعمل'}
        </div>

        {/* Top Left: Badges Stack (New item / For Rent) */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
          {isNewItem(ad.createdAtISO) && (
            <div className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[8px] font-black rounded-full shadow-lg border border-red-400/40 animate-pulse backdrop-blur-md">
              حديث ✨
            </div>
          )}
          {ad.type === 'rent' && (
            <div className="px-2 py-0.5 bg-sky-600/90 text-white text-[8px] font-black rounded-full shadow-md border border-sky-400/30 backdrop-blur-md">
              للإيجار
            </div>
          )}
        </div>

        {/* Bottom Bar: Verified Badge only */}
        {ad.seller?.isVerified && (
          <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
            <div className="px-1.5 py-0.5 bg-gray-900/90 backdrop-blur-md rounded-full text-[8px] font-bold text-white flex items-center gap-0.5 border border-gray-700/50 shadow-md pointer-events-auto">
              <VerifiedBadge className="w-2.5 h-2.5 text-emerald-400"/>
              <span>موثق</span>
            </div>
          </div>
        )}
        {ad.status==='sold'&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-[1px]"><span className="bg-red-600 text-white font-bold text-[10px] px-2 py-1 rounded-lg border border-red-500/30 shadow-lg">🚫 تم البيع</span></div>}
      </div>
      <div className={`flex-1 flex flex-col relative z-20 bg-white dark:bg-gray-900 rounded-t-xl -mt-3 border-t border-gray-200 dark:border-gray-800 shadow-none ${
        compact ? 'p-2' : 'p-3 sm:p-4'
      }`}>
        <div className="flex items-center justify-between gap-1 mb-1">
          <h3 className={`text-gray-900 dark:text-white font-bold line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>{ad.title}</h3>
          <span className="shrink-0 px-2 py-0.5 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md text-[9px] font-bold">
            {(ad as any).subCategory || catInfo.label}
          </span>
        </div>
        <div className={`flex items-center justify-between ${compact ? 'mt-0 mb-1' : 'mt-1 mb-2'}`}>
          <p className={`font-black text-amber-500 dark:text-amber-400 tracking-tight leading-none ${compact ? 'text-sm' : 'text-lg sm:text-xl'}`}>
            {formatPrice(ad.price)} <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mr-0.5">د.ع</span>
          </p>
        </div>
        <div className={`flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px] flex-1 ${compact ? 'mb-1' : 'mb-2'}`}>
          <MapPin className="w-2.5 h-2.5 flex-shrink-0"/>
          <span className="line-clamp-1 max-w-[50%]">{ad.location}</span>
          <span className="mx-1 opacity-50">•</span>
          <div className="flex items-center gap-0.5 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
            <CategoryIconComponent className="w-2.5 h-2.5"/>
            <span>{catInfo.label}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-150 dark:border-gray-800/40">
          <button onClick={e=>{e.stopPropagation();onSellerClick?.(ad.postedBy||'');}} className="flex items-center gap-1 hover:opacity-85 transition-opacity relative">
            <img src={ad.seller?.avatar || DEFAULT_AVATAR} onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} alt="" loading="lazy" decoding="async" className={`w-4 h-4 rounded-full object-cover ${getGlowClass(sellerRole)}`}/>
            {onlineStatuses[ad.postedBy||''] && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full border border-gray-800" title="متصل الآن"></div>}
            <span className="text-gray-500 dark:text-gray-400 text-[9px] truncate max-w-[65px]">{ad.seller?.name || 'مستخدم'}</span>
          </button>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[9px]">
            <span className="text-green-500 dark:text-green-400 font-medium">{time}</span>
            <span className="flex items-center gap-0.5"><ViewIcon className="w-2.5 h-2.5"/>{ad.views}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
