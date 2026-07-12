// ===========================================
// مسؤولية هذا الملف:
// يعرض بطاقة منتج (Product Card) في قائمة المنتجات.
//
// لا يقوم بجلب البيانات.
// الجلب يتم في MarketView عبر fetchProducts() في App.tsx.
//
// الـ Props:
// - product: بيانات المنتج.
// - onSelect: يفتح تفاصيل المنتج.
// - isFav/onFav: لإدارة المفضلة.
//
// انتبه:
// يستخدم useOnlineStatuses (Supabase Hook). تأكد من عدم تكرار الاستعلام.
//
// ⚠️ Dead Code تحذير:
// كثير من الـ Imports لا تُستخدم في هذا المكوّن الصغير.
// ===========================================
import { useOnlineStatuses } from '../hooks/useOnlineStatuses';
import { useRelativeTime } from '../utils/time';
import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Product } from '../types';
import { isNewItem, getGlowClass } from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { supabase } from '../lib/supabase';
import { ImageWithDataSaver } from './ImageWithDataSaver';

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

export function getProductCategoryPlaceholderImage(category?: string): string {
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
      return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=700'; // Shop front
  }
}

export const getCategoryIcon = (categoryId?: string) => {
  switch (categoryId) {
    case 'cars':
      return { icon: Car, label: 'سيارات', color: 'bg-blue-500/25 text-blue-300 border-blue-500/40' };
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

export const ProductCard = React.memo(function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{
  product:Product; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
  sellerRole?: string;
}) {
  const onlineStatuses = useOnlineStatuses();
  const time = useRelativeTime(product.createdAtISO);
  const catInfo = getCategoryIcon(product.category);
  const CategoryIconComponent = catInfo.icon;

  return (
    <motion.div whileHover={{y:-4}} onClick={onSelect} onContextMenu={onActionMenu}
      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
        <ImageWithDataSaver src={product.images?.[0] || getProductCategoryPlaceholderImage(product.category)} alt={product.title} className="w-full h-full object-cover" />
        
        {/* Dynamic Category Overlay Badge */}
        <div className={`absolute bottom-2 right-2 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 border backdrop-blur-md shadow-lg z-10 transition-transform hover:scale-105 ${catInfo.color}`}>
          <CategoryIconComponent className="w-3.5 h-3.5" />
          <span>{catInfo.label}</span>
        </div>

        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-md z-10" style={{background:product.condition==='new'?'#22c55e':'#f59e0b'}}>
          {product.condition==='new'?'جديد':'مستعمل'}</div>
        {isNewItem(product.createdAtISO) && (
          <div className="absolute top-8 left-2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-extrabold rounded-lg z-10 shadow-lg shadow-red-500/25 border border-red-400/30 animate-pulse">
            حديث ✨
          </div>
        )}
        <button onClick={onFav} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${isFav?'bg-red-500':'bg-black/50 hover:bg-black/70'}`} title={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"} aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}>
          <Heart className={`w-4 h-4 text-white ${isFav?'fill-current':''}`}/></button>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-purple-600 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
          <ShoppingBag className="w-2.5 h-2.5"/>متجر</div>
        {product.status==='sold'&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]"><span className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-red-500/30 shadow-lg">🚫 تم البيع</span></div>}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{product.title}</h3>
        <p className="text-lg font-bold text-amber-400 mb-2">{formatPrice(product.price)} <span className="text-xs text-gray-400">د.ع</span></p>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2 flex-1"><MapPin className="w-3 h-3 flex-shrink-0"/><span>{product.governorate}</span></div>
        <div className="flex items-center justify-between mt-auto">
          <button onClick={e=>{e.stopPropagation();onSellerClick?.(product.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 relative">
            <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-5 h-5 rounded-full object-cover ${getGlowClass(sellerRole)}`}/>
            {onlineStatuses[product.postedBy||''] && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-800" title="متصل الآن"></div>}
            <span className="text-gray-400 text-xs truncate max-w-[80px]">{product.seller?.name || 'مستخدم'}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span className="text-green-400 font-medium">{time}</span>
            <span className="flex items-center gap-0.5"><ViewIcon className="w-3 h-3"/>{product.views}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
