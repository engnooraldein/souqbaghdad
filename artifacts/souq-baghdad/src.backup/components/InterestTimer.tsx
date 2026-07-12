// ===========================================
// مسؤولية هذا الملف:
// مؤقت يُظهر عدد المهتمين بخط النقل (Interest Timer).
// يُزيد عداد الاهتمام ويعرضه للبائع.
//
// يتعامل مع Supabase:
// - UPDATE على جدول 'ads' لزيادة عداد الاهتمام.
//
// استعلام Supabase:
// يُنفَّذ عند انتهاء المؤقت (ليس بشكل مستمر).
//
// آمن للتعديل:
// نعم. تأكد من عدم زيادة عدد الاستعلامات.
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

export function InterestTimer({ itemId, itemType, onInterestRegistered }: { itemId: string|number, itemType: 'ad'|'product'|'transport', onInterestRegistered?: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [sticker, setSticker] = useState<string | null>(null);
  const playSound = useSound();

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        if (next === 5) {
          setSticker('مهتم 👍');
          playSound('success');
          incrementInterest(itemId, itemType);
          if (onInterestRegistered) onInterestRegistered();
        } else if (next === 15) {
          setSticker('مهتم جداً 🔥');
          playSound('success');
          incrementInterest(itemId, itemType);
          if (onInterestRegistered) onInterestRegistered();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [itemId, itemType]);

  const incrementInterest = (id: string|number, type: string) => {
    try {
      if (type === 'transport') {
        const lines = JSON.parse(localStorage.getItem('souqTransportUniversity') || '[]');
        const updated = lines.map((l: any) => l.id === id ? { ...l, interest: (l.interest || 0) + 1 } : l);
        localStorage.setItem('souqTransportUniversity', JSON.stringify(updated));
      } else {
        const key = `interest-${type}-${id}`;
        localStorage.setItem(key, String((parseInt(localStorage.getItem(key) || '0')) + 1));
      }
    } catch (e) {}
  };

  if (!sticker) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: -10 }}
      className="absolute top-24 left-4 z-50 px-3 py-1.5 bg-[#0c2b5e]/80 backdrop-blur-md text-white border border-[#4b7ab5]/50 rounded-2xl shadow-xl flex items-center gap-2 transition-all"
    >
      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm">
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        {sticker}
      </div>
      <div className="w-px h-3.5 sm:h-4 bg-gray-500/50 mx-0.5" />
      <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{seconds}ث</span>
    </motion.div>
  );
}
