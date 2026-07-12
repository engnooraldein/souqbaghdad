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

export function TransportAdCard({ ad, onSelect, onActionMenu, onShare, seller }: { ad: TransportAd, onSelect: () => void, onActionMenu?: (e: any) => void, onShare?: () => void, seller?: any }) {
  const isEmployee = ad.categoryType === 'employee';
  
  // Note: isNewItem needs to be passed or accessed if globally available. Assuming it's defined in App.tsx globally.
  // Actually isNewItem is defined locally in App! Let's just inline a simple check.
  const isNew = new Date().getTime() - new Date(ad.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      onClick={onSelect}
      onContextMenu={onActionMenu}
      className={`bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer ${
        isEmployee 
          ? 'border-indigo-500/50 hover:border-indigo-400 shadow-lg shadow-indigo-950/40' 
          : ad.type === 'offer' ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-amber-500/30 hover:border-amber-500/60'
      }`}>
      
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

      {isNew && (
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
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-xl text-xs hover:bg-amber-500/30"
              >
                <Share2 className="w-3.5 h-3.5" /> مشاركة
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
