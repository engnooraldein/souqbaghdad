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
import { handleUniversalShare } from '../App';
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

export function getAdCategoryPlaceholderImage(category?: string): string {
  switch (category) {
    case 'cars':
      return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700'; // Modern luxury car
    case 'real-estate':
      return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700'; // Modern premium house
    case 'phones':
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700'; // Sleek smartphone
    case 'electronics':
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700'; // Tech/laptop setup
    case 'clothes':
      return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700'; // Modern fashion/suits
    case 'cosmetics':
      return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700'; // Cosmetics/perfume setup
    case 'handmade':
      return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=700'; // Beautiful handmade crafts
    case 'jobs':
      return 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=700'; // Professional interview/workspace
    case 'furniture':
      return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700'; // Luxury sofa/furniture
    case 'bikes':
      return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=700'; // Modern bicycle
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
        <ImageWithDataSaver src={ad.images?.[0] || getAdCategoryPlaceholderImage(ad.category)} alt={ad.title} className="w-full h-full object-cover" />
        
        <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-md z-10 ${
          ad.condition === 'new' ? 'bg-emerald-600 border border-emerald-500/30' : 'bg-amber-600 border border-amber-500/30'
        }`}>
          {ad.condition === 'new' ? 'جديد' : 'مستعمل'}
        </div>
        {isNewItem(ad.createdAtISO) && (
          <div className={`absolute px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[8px] font-extrabold rounded z-10 shadow-lg shadow-red-500/25 border border-red-400/30 animate-pulse ${
            compact ? 'top-6 left-1.5' : 'top-8 left-2'
          }`}>
            حديث ✨
          </div>
        )}
        {ad.type==='rent'&&<div className={`absolute px-1.5 py-0.5 bg-gray-800 rounded text-[8px] font-bold text-white transition-all z-10 ${
          isNewItem(ad.createdAtISO) ? (compact ? 'top-11 left-1.5' : 'top-14 left-2') : (compact ? 'top-6 left-1.5' : 'top-8 left-2')
        }`}>للإيجار</div>}
        <button onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); onFav(e); }} className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center ${isFav?'bg-red-500':'bg-black/50 hover:bg-black/70'} transition-colors`} title={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"} aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}>
          <Heart className={`w-3.5 h-3.5 text-white ${isFav?'fill-current':''}`}/></button>
        {ad.seller?.isVerified&&<div className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-gray-800 rounded-full text-[8px] font-bold text-white flex items-center gap-0.5`}><VerifiedBadge className="w-2 h-2"/>موثق</div>}
        {ad.status==='sold'&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]"><span className="bg-red-600 text-white font-bold text-[10px] px-2 py-1 rounded-lg border border-red-500/30 shadow-lg">🚫 تم البيع</span></div>}
      </div>
      <div className={`flex-1 flex flex-col relative z-20 bg-white dark:bg-gray-900 rounded-t-xl -mt-3 border-t border-gray-200 dark:border-gray-800 shadow-none ${
        compact ? 'p-2' : 'p-3 sm:p-4'
      }`}>
        <h3 className={`text-gray-900 dark:text-white font-bold mb-0.5 line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>{ad.title}</h3>
        <div className={`flex items-center justify-between ${compact ? 'mt-0 mb-1' : 'mt-1 mb-2'}`}>
          <p className={`font-black text-amber-500 dark:text-amber-400 tracking-tight leading-none ${compact ? 'text-sm' : 'text-lg sm:text-xl'}`}>
            {formatPrice(ad.price)} <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mr-0.5">د.ع</span>
          </p>
        </div>
        <div className={`flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px] flex-1 ${compact ? 'mb-1' : 'mb-2'}`}>
          <MapPin className="w-2.5 h-2.5 flex-shrink-0"/>
          <span className="line-clamp-1 max-w-[45%]">{ad.location}</span>
          <span className="mx-1 opacity-50">•</span>
          <div className="flex items-center gap-0.5 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
            <CategoryIconComponent className="w-2.5 h-2.5"/>
            <span>{catInfo.label}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-150 dark:border-gray-800/40">
          <button onClick={e=>{e.stopPropagation();onSellerClick?.(ad.postedBy||'');}} className="flex items-center gap-1 hover:opacity-85 transition-opacity relative">
            <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" loading="lazy" decoding="async" className={`w-4 h-4 rounded-full object-cover ${getGlowClass(sellerRole)}`}/>
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
