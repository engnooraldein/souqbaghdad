// ===========================================
// مسؤولية هذا الملف:
// نافذة عرض الصور بحجم كامل (Image Lightbox).
// تدعم التكبير والتصفح بين الصور.
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User as UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image as ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone as PhoneIcon,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, 
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';

import { ImageCropModal } from './ImageCropModal';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

export function ImageLightboxModal({ src, title, images, initialIdx = 0, onClose }: { src: string; title: string; images?: string[]; initialIdx?: number; onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [downloading, setDownloading] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const timerRef = useRef<any>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const galleryList = images && images.length > 0 ? images : [src];
  const activeSrc = galleryList[currentIdx] || src;
  const totalCount = galleryList.length;

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ('targetTouches' in e) {
      setTouchStartX(e.targetTouches[0].clientX);
      setTouchEndX(null);
    }
    timerRef.current = setTimeout(() => {
      setLongPressActive(true);
    }, 600);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (touchStartX !== null && touchEndX !== null && totalCount > 1) {
      const distance = touchStartX - touchEndX;
      if (distance > 35) {
        setCurrentIdx(i => i < totalCount - 1 ? i + 1 : i);
      } else if (distance < -35) {
        setCurrentIdx(i => i > 0 ? i - 1 : i);
      }
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const bannerH = Math.max(70, Math.round(h * 0.09));

      canvas.width = w;
      canvas.height = h + bannerH;

      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, h, w, bannerH);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, h, w, Math.max(3, Math.round(bannerH * 0.04)));

      const logoSize = Math.round(bannerH * 0.7);
      const margin = Math.round(bannerH * 0.15);
      const logoX = w - logoSize - margin;
      const logoY = h + margin;

      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(1, Math.round(logoSize * 0.05));
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      const cx = logoX + logoSize / 2;
      const cy = logoY + logoSize / 2;
      const r = logoSize * 0.25;
      ctx.ellipse(cx, cy + r * 0.2, r * 1.2, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.5, cy - r * 0.5);
      ctx.quadraticCurveTo(cx, cy - r * 1.2, cx + r * 1.5, cy - r * 0.5);
      ctx.quadraticCurveTo(cx, cy + r * 0.8, cx - r * 1.5, cy - r * 0.5);
      ctx.fill();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const titleFontSize = Math.max(14, Math.round(bannerH * 0.32));
      ctx.font = `bold ${titleFontSize}px Cairo, system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('سوك بغداد', logoX - margin, h + bannerH * 0.35);

      const subFontSize = Math.max(10, Math.round(bannerH * 0.22));
      ctx.font = `${subFontSize}px Cairo, system-ui, sans-serif`;
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('السوق الرقمي العراقي الأول', logoX - margin, h + bannerH * 0.68);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${subFontSize}px Cairo, system-ui, sans-serif`;
      ctx.fillText(title, margin * 2, h + bannerH * 0.4);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = `${Math.max(8, Math.round(bannerH * 0.16))}px system-ui, sans-serif`;
      ctx.fillText('souqbaghdad.store', margin * 2, h + bannerH * 0.7);

      const link = document.createElement('a');
      link.download = `souq-baghdad-${title.replace(/\s+/g, '-')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setDownloading(false);
      setLongPressActive(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 select-none">
      
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto z-10 pt-12 md:pt-4">
        <div>
          <h4 className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{title}</h4>
          {totalCount > 1 && <span className="text-amber-400 text-xs font-semibold">{currentIdx + 1} من {totalCount}</span>}
        </div>
        <button onClick={onClose} className="p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white transition-colors shadow-lg border border-gray-600" title="إغلاق" aria-label="إغلاق">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center max-w-4xl w-full mx-auto relative overflow-hidden my-4 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <img src={activeSrc} alt={title} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl pointer-events-none transition-all duration-200" />
        
        {totalCount > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(i => (i - 1 + totalCount) % totalCount); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all" title="الصورة السابقة" aria-label="الصورة السابقة">
              <ChevronRight className="w-6 h-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setCurrentIdx(i => (i + 1) % totalCount); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all" title="الصورة التالية" aria-label="الصورة التالية">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}

        {longPressActive && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute bg-gray-900/90 border border-gray-700 rounded-2xl p-4 text-center space-y-3 shadow-2xl max-w-xs z-[260]">
            <p className="text-white text-xs font-bold">خيارات الصورة</p>
            <button onClick={handleDownload} disabled={downloading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 rotate-45" />}
              تحميل مع الشعار 📥
            </button>
            <button onClick={() => setLongPressActive(false)} className="w-full py-2 bg-gray-800 text-gray-400 rounded-xl text-xs">إلغاء</button>
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-3 pb-6 z-10">
        <p className="text-gray-400 text-xs text-center font-medium">👈 اسحب باللمس للتقليب أو اضغط مطولاً للتحميل بشعار المنصة 👉</p>
        <div className="flex gap-3 w-full max-w-xs justify-center">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleDownload} disabled={downloading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 disabled:from-gray-700 disabled:to-gray-700 text-black font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 rotate-45" />}
            تحميل الصورة بالشعار 📥
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
