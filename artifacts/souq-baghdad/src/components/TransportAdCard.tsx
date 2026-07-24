// ===========================================
// مسؤولية هذا الملف:
// يعرض بطاقة خط نقل (Transport Ad Card) في قائمة النقليات.
//
// لا يجلب البيانات مباشرة.
// البيانات تأتيه عبر Props من TransportView.
//
// آمن للتعديل:
// نعم. يمكن تحسين التصميم دون التأثير على منطق الجلب.
// ===========================================
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

export function VisualRoutePath({ regions, university, type }: { regions: string, university: string, type: 'offer' | 'request' }) {
  const points = useMemo(() => {
    const list = regions ? regions.split(/[،,,\-]/).map(r => r.trim()).filter(Boolean) : [];
    const pts: { name: string, type: 'start' | 'stop' | 'destination' }[] = [];
    if (list.length > 0) {
      list.forEach((r, idx) => {
        pts.push({ name: r, type: idx === 0 ? 'start' : 'stop' });
      });
    }
    pts.push({ name: university, type: 'destination' });
    return pts;
  }, [regions, university]);

  return (
    <div className="my-3.5 bg-gray-900/80 border border-gray-800/80 rounded-2xl p-3.5" dir="rtl">
      <div className="flex flex-wrap items-center gap-2">
        {points.map((pt, idx) => {
          let badgeBg = 'bg-gray-800 text-gray-300 border-gray-700';
          let icon = '📍';

          if (pt.type === 'start') {
            badgeBg = type === 'offer' 
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold' 
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-extrabold';
            icon = '🚏 الانطلاق:';
          } else if (pt.type === 'destination') {
            badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-extrabold';
            icon = '🎓 الوصول:';
          } else {
            badgeBg = type === 'offer'
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/20 font-bold'
              : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20 font-bold';
            icon = '➔';
          }

          return (
            <React.Fragment key={idx}>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm whitespace-normal shadow-sm ${badgeBg}`}>
                <span className="text-[11px] opacity-80">{icon}</span>
                <span>{pt.name}</span>
              </div>
              {idx < points.length - 1 && (
                <span className="text-gray-600 text-xs font-black select-none">←</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function TransportAdCard({ ad, onSelect, onActionMenu, onShare, seller }: { ad: TransportAd, onSelect: () => void, onActionMenu?: (e: any) => void, onShare?: () => void, seller?: any }) {
  const isEmployee = ad.categoryType === 'employee';
  
  // Note: isNewItem needs to be passed or accessed if globally available. Assuming it's defined in App.tsx globally.
  // Actually isNewItem is defined locally in App! Let's just inline a simple check.
  const isNew = new Date().getTime() - new Date(ad.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      onClick={onSelect}
      onContextMenu={onActionMenu}
      className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer p-3.5 sm:p-5 ${
        isEmployee 
          ? 'border-indigo-500/50 hover:border-indigo-400 shadow-lg shadow-indigo-950/40' 
          : ad.type === 'offer' ? 'border-gray-200 dark:border-emerald-500/30 hover:border-emerald-500/60' : 'border-gray-200 dark:border-amber-500/30 hover:border-amber-500/60'
      }`}>
      
      {/* Matched / Archived overlays */}
      {(ad.status === 'matched') && (
        <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-emerald-500 text-white font-bold px-6 py-2 rounded-xl transform -rotate-12 border-2 border-emerald-300 shadow-xl text-lg">
            {ad.type === 'offer' ? 'اكتمل العدد' : 'تم العثور على خط'}
          </div>
        </div>
      )}
      {ad.status === 'archived' && (
        <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-gray-800 text-white font-bold px-6 py-2 rounded-xl transform border border-gray-600 shadow-xl text-sm opacity-90">
            مؤرشف
          </div>
        </div>
      )}

      {/* 1. DESKTOP LAYOUT */}
      <div className="hidden sm:block">
        {/* Type & Category Badges */}
        <div className="absolute top-0 right-0 flex items-center gap-1 z-10">
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

        {isNew && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-extrabold rounded-lg z-10 shadow-lg shadow-red-500/25 border border-red-400/30 animate-pulse">
            حديث ✨
          </div>
        )}

        <div className="pt-4">
          <div className="flex justify-between items-start mb-3">
            <div className="w-full">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                {ad.university}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5 leading-relaxed mb-3">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0"/> 
                <span>المناطق: <span className="text-gray-800 dark:text-white font-bold">{ad.regions}</span></span>
              </p>
              
              {/* Visual Route Path */}
              <VisualRoutePath regions={ad.regions} university={ad.university} type={ad.type} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-transparent rounded-xl p-2 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">الدوام</p>
              <p className="text-gray-800 dark:text-white font-bold text-xs">{ad.shift}</p>
            </div>
            {ad.type === 'offer' && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-transparent rounded-xl p-2 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-[10px]">المقاعد</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{ad.seats} <span className="text-gray-400 font-normal">متاح</span></p>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-transparent rounded-xl p-2 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">الفئة</p>
              <p className="text-gray-800 dark:text-white font-bold text-xs">{ad.targetAudience}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-transparent rounded-xl p-2 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">المركبة</p>
              <p className="text-gray-800 dark:text-white font-bold text-xs">{ad.vehicleType}</p>
            </div>
          </div>

          {ad.price && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-black mb-3 bg-amber-500/10 px-3 py-2 rounded-lg inline-flex">
              <Tag className="w-4 h-4"/>
              <span>السعر المفضل: {formatPrice(ad.price)} د.ع</span>
            </div>
          )}

          {ad.note&&<p className="text-gray-700 dark:text-gray-300 text-xs mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700/50">{ad.note}</p>}
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-150 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <img src={ad.sellerAvatar||'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" loading="lazy" decoding="async" className={`w-8 h-8 rounded-full object-cover ${seller?.role && seller.role !== 'user' ? getGlowClass(seller.role) : 'border border-gray-200 dark:border-gray-600'}`}/>
              <div>
                <span className="text-gray-700 dark:text-gray-300 text-xs block font-semibold">{ad.sellerName}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <motion.a href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
                whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20">
                <MessageSquare className="w-3.5 h-3.5"/> واتساب
              </motion.a>
              {onShare && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onShare(); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold rounded-xl text-xs hover:bg-amber-500/30"
                >
                  <Share2 className="w-3.5 h-3.5" /> مشاركة
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MOBILE LAYOUT (Compact Wide Horizontal Rectangular Card) */}
      <div className="block sm:hidden relative">
        {/* Top Badge/Header section */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1">
            {isEmployee && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold flex items-center gap-0.5">
                👔 خط موظفين
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
              ad.type === 'offer' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {ad.type === 'offer' ? 'متوفر خط' : 'طلب خط'}
            </span>
            {isNew && (
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[8px] font-bold rounded animate-pulse">
                جديد ✨
              </span>
            )}
          </div>

          {ad.price && (
            <span className="text-amber-600 dark:text-amber-400 text-xs font-black bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              {formatPrice(ad.price)} د.ع
            </span>
          )}
        </div>

        {/* Body Info */}
        <div className="mb-2">
          <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
            {ad.university}
          </h3>
          
          <p className="text-gray-700 dark:text-gray-300 text-xs flex items-center gap-1.5 mt-1.5 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-xl border border-gray-150 dark:border-gray-850/50">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate leading-none">
              <span className="text-gray-500 dark:text-gray-400 text-[10px]">المناطق:</span> {ad.regions}
            </span>
          </p>
        </div>

        {/* Compact Specs Row */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-850/30 text-gray-700 dark:text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-lg">
            🕒 {ad.shift}
          </span>
          {ad.type === 'offer' && (
            <span className="bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-850/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-lg">
              🪑 {ad.seats} متاح
            </span>
          )}
          <span className="bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-850/30 text-gray-700 dark:text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-lg">
            👥 {ad.targetAudience}
          </span>
          <span className="bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-850/30 text-gray-700 dark:text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-lg">
            🚗 {ad.vehicleType}
          </span>
        </div>

        {ad.note && (
          <p className="text-gray-500 dark:text-gray-400 text-[10px] line-clamp-1 mb-2 italic">
            {ad.note}
          </p>
        )}

        {/* Bottom Row - Seller & Quick Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-150 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <img src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" loading="lazy" decoding="async" className={`w-6 h-6 rounded-full object-cover shrink-0 ${seller?.role && seller.role !== 'user' ? getGlowClass(seller.role) : 'border border-gray-200 dark:border-gray-800'}`} />
            <div className="leading-tight">
              <span className="text-gray-700 dark:text-gray-300 text-[10px] block font-bold max-w-[70px] truncate">{ad.sellerName}</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <a 
              href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-lg text-[10px] shadow"
            >
              <MessageSquare className="w-3 h-3" /> واتساب
            </a>
            {onShare && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare(); }}
                className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black rounded-lg text-[10px]"
              >
                <Share2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
}
