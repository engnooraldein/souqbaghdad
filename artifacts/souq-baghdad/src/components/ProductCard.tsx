import { useOnlineStatuses } from '../hooks/useOnlineStatuses';
import { useRelativeTime } from '../utils/time';
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
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

export function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{
  product:Product; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
  sellerRole?: string;
}) {
  const onlineStatuses = useOnlineStatuses();
  const time = useRelativeTime(product.createdAtISO);
  return (
    <motion.div whileHover={{y:-4}} onClick={onSelect} onContextMenu={onActionMenu}
      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
        <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={product.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{background:product.condition==='new'?'#22c55e':'#f59e0b'}}>
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
}
