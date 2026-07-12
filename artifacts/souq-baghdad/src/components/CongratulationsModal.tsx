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

export function CongratulationsModal({ item, onClose }: { item: { title: string; type: 'ad' | 'product' }; onClose: () => void }) {
  const confettiCount = 35;
  const particles = Array.from({ length: confettiCount });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((_, i) => {
          const size = Math.random() * 8 + 6;
          const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const delay = Math.random() * 0.5;
          const left = `${Math.random() * 100}%`;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                left: left,
                top: -20,
              }}
              animate={{
                y: '105vh',
                rotate: Math.random() * 360 + 360,
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                ease: "easeOut",
                delay: delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
              }}
            />
          );
        })}
      </div>

      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative bg-gradient-to-b from-gray-900 to-slate-950 rounded-3xl p-8 w-full max-w-md text-center border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] z-10"
      >
        {/* Animated Celebration Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 relative"
        >
          <motion.span
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ delay: 0.5, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="text-5xl"
          >
            🏆
          </motion.span>
          <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🎉</div>
          <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>💰</div>
        </motion.div>

        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">تهانينا! 🎉 تم البيع بنجاح</h2>
        <p className="text-amber-400 font-bold text-sm mb-4">
          تم نقل {item.type === 'ad' ? 'الإعلان' : 'المنتج'} إلى أرشيفك الشخصي
        </p>

        <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl p-4 mb-6 text-right">
          <p className="text-gray-400 text-xs mb-1">اسم العنصر:</p>
          <p className="text-white font-bold text-base leading-snug line-clamp-2">{item.title}</p>
        </div>

        <p className="text-gray-300 text-xs leading-relaxed mb-6 max-w-sm mx-auto">
          سيختفي هذا العنصر من المعرض العام والبحث تلقائياً، ولكنه سيظل معروضاً في الأرشيف بملفك الشخصي كرمز لنجاح مبيعاتك وبناء الثقة مع زوار صفحتك العامة.
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black rounded-2xl transition-all hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98]"
        >
          رائع، شكراً لك!
        </button>
      </motion.div>
    </motion.div>
  );
}
