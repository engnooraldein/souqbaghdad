import { TimeAgo } from "./components/TimeAgo";
import { Logo } from "./components/Logo";
import { Toast } from "./components/Toast";
import { InterestTimer } from "./components/InterestTimer";
import { SkeletonCard } from "./components/SkeletonCard";
import { CongratulationsModal } from "./components/CongratulationsModal";
import { AuthModal } from "./components/AuthModal";
import { ImageLightboxModal } from "./components/ImageLightboxModal";
import { AdCard } from "./components/AdCard";
import { ProductCard } from "./components/ProductCard";
import { TransportAdCard } from "./components/TransportAdCard";
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';

const ImageCropModal = lazy(() => import("./components/ImageCropModal").then(m => ({ default: m.ImageCropModal })));
const OnboardingModal = lazy(() => import("./components/OnboardingModal").then(m => ({ default: m.OnboardingModal })));
const InfoDocsModal = lazy(() => import("./components/InfoDocsModal").then(m => ({ default: m.InfoDocsModal })));
const AdDetailModal = lazy(() => import("./components/AdDetailModal").then(m => ({ default: m.AdDetailModal })));
const ProductDetailModal = lazy(() => import("./components/ProductDetailModal").then(m => ({ default: m.ProductDetailModal })));
const TransportDetailModal = lazy(() => import("./components/TransportDetailModal").then(m => ({ default: m.TransportDetailModal })));
const AdFormModal = lazy(() => import("./components/AdFormModal").then(m => ({ default: m.AdFormModal })));
const ProductFormModal = lazy(() => import("./components/ProductFormModal").then(m => ({ default: m.ProductFormModal })));
const MyLinesTab = lazy(() => import("./components/MyLinesTab").then(m => ({ default: m.MyLinesTab })));
const PasswordChangeModal = lazy(() => import("./components/PasswordChangeModal").then(m => ({ default: m.PasswordChangeModal })));
const ProfileView = lazy(() => import("./components/ProfileView").then(m => ({ default: m.ProfileView })));
const SellerPublicPage = lazy(() => import("./components/SellerPublicPage").then(m => ({ default: m.SellerPublicPage })));
const AdminPanel = lazy(() => import("./components/AdminPanel").then(m => ({ default: m.AdminPanel })));
const NotifPanel = lazy(() => import("./components/NotifPanel").then(m => ({ default: m.NotifPanel })));
const MarketView = lazy(() => import("./components/MarketView").then(m => ({ default: m.MarketView })));
const TransportFormModal = lazy(() => import("./components/TransportFormModal").then(m => ({ default: m.TransportFormModal })));
const TransportView = lazy(() => import("./components/TransportView").then(m => ({ default: m.TransportView })));
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LoadingScreen } from './components/LoadingScreen';
import { useOnlineStatuses, triggerOnlineStatusesSync } from './hooks/useOnlineStatuses';
import { SellerInfo, Ad, Product, User, StoredUser, Visit, SystemLog, TransportAd } from './types';
import { formatPrice } from './utils/format';
import { logSystemAction } from './utils/logs';
import { getRelative, useRelativeTime } from './utils/time';

const ProductsView = lazy(() => import('./components/ProductsView').then(m => ({ default: m.ProductsView })));
export const ViewersModal = lazy(() => import('./components/ViewersModal').then(m => ({ default: m.ViewersModal })));
const ShareModal = lazy(() => import('./components/ShareModal').then(m => ({ default: m.ShareModal })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
import {
  Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, AlertCircle, Check,
  Gamepad2, Heart, Bell, Plus, LogOut, Star, X, Search, MapPin,
  Eye as ViewIcon, Phone as PhoneIcon, Grid, List, Menu, MessageSquare,
  Share2, Copy, CheckCircle, XCircle, Loader2, ChevronRight, Shield, ImagePlus,
  Trash2, SlidersHorizontal, Settings, ChevronLeft, Info, LogIn, Edit2,
  Save, BarChart3, Smartphone, Monitor, Tablet, Globe, UserCheck, Activity,
  Crown, UserX, FileText, ShoppingBag, Package, Store, Camera, ZoomIn,
  ZoomOut, Calendar, Users, ChevronDown, Tag, Layers, Home, Car, UserCircle, Key, Sparkles, Clock, Wallet, MessageCircle, Sun, Moon, Fingerprint
} from 'lucide-react';

const OwnerDashboard = lazy(() => import('./components/OwnerDashboard'));
const StoreShareGuideModal = lazy(() => import('./components/StoreShareGuideModal').then(m => ({ default: m.StoreShareGuideModal })));
import { InstallOptionsModal } from './components/InstallOptionsModal';
import LiveVisitorCounter from './components/LiveVisitorCounter';
import InfiniteScrollTrigger from './components/InfiniteScrollTrigger';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const OWNER_EMAIL = 'nooraldeinsbah@gmail.com';
export const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#111111"/><circle cx="50" cy="38" r="18" fill="#555555"/><ellipse cx="50" cy="82" rx="28" ry="20" fill="#555555"/></svg>')}`;
const DEFAULT_COVER = '/logo-512.webp';

export const getCoverImage = (user: {role?: string, cover?: string}) => {
  if (['pro', 'vendor', 'admin', 'owner'].includes(user?.role || '')) {
    return user?.cover || DEFAULT_COVER;
  }
  return DEFAULT_COVER;
};

export { getGlowClass, getWhatsAppResetLink } from './utils/helpers';
import { getGlowClass, getWhatsAppResetLink, slugify } from './utils/helpers';

export const IRAQI_GOVERNORATES = [
  'الكل','بغداد','البصرة','نينوى','أربيل','كربلاء','النجف',
  'دهوك','السليمانية','بابل','ديالى','المثنى','ميسان',
  'القادسية','صلاح الدين','واسط','الأنبار','ذي قار','كركوك',
];

export const CATEGORIES = [
  { id:'all',          name:'الرئيسية',     emoji:'🏠' },
  { id:'general',      name:'العرض العام',  emoji:'📢' },
  { id:'cars',         name:'السيارات',    emoji:'🚗' },
  { id:'real-estate',  name:'العقارات',    emoji:'🏠' },
  { id:'phones',       name:'الهواتف',     emoji:'📱' },
  { id:'electronics',  name:'إلكترونيات', emoji:'💻' },
  { id:'clothes',      name:'الملابس',     emoji:'👕' },
  { id:'cosmetics',    name:'الكوزمتك',    emoji:'💄' },
  { id:'handmade',     name:'حرف يدوية',   emoji:'🧶' },
  { id:'jobs',         name:'وظائف',       emoji:'💼' },
  { id:'furniture',    name:'أثاث',        emoji:'🛋️' },
  { id:'bikes',        name:'دراجات',      emoji:'🚲' },
  { id:'services',     name:'خدمات',       emoji:'🔧' },
  { id:'games',        name:'الألعاب',     emoji:'🎮' },
];

export const GAMES_DATA = [
  { id:1, title:'ضارب الدجاج', emoji:'🐔💥', rating:4.9 },
  { id:2, title:'ورق طاولي',   emoji:'🃏',    rating:4.8 },
  { id:3, title:'داما',         emoji:'🎲',    rating:4.6 },
  { id:4, title:'سودوكو',       emoji:'🧩',    rating:4.5 },
  { id:5, title:'شطرنج',        emoji:'♟️',    rating:4.7 },
  { id:6, title:'بورت',         emoji:'🎴',    rating:4.4 },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
// Interfaces moved to src/types/index.ts

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
// ===========================================
// المسؤولية:
// ضغط الصور قبل رفعها لقاعدة البيانات لتقليل الحجم.
//
// لماذا موجود؟
// لتوفير المساحة في Supabase Storage وتسريع تحميل الصور للمستخدمين.
//
// انتبه:
// إضافة علامة مائية (Watermark) تتم هنا. أي خطأ في الـ Canvas قد يوقف عملية الرفع.
//
// آمن للتعديل:
// نعم، لضبط جودة الصورة أو حجمها.
// ===========================================
export async function compressImage(file: File, maxPx = 900, quality = 0.78, addWatermark = true): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if (addWatermark) {
          // Add Watermark
          const fontSize = Math.max(16, Math.floor(canvas.width * 0.035));
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = `bold ${fontSize}px Tajawal, sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText('سوك بغداد | souqbaghdad.store', canvas.width - 20, canvas.height - 20);
        }
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ===========================================
// المسؤولية:
// رفع الصورة إلى Supabase Storage وإرجاع الرابط العام (Public URL).
//
// لماذا موجود؟
// لرفع صور الإعلانات والمنتجات والنقليات.
//
// استهلاك Supabase:
// كل عملية رفع تستهلك من حصة الـ Storage.
//
// آمن للتعديل:
// بحذر، تأكد من سياسات الأمان (RLS) للـ Bucket.
// ===========================================
export async function uploadImageToStorage(fileOrBase64: File | string, bucket = 'ad-images', maxPx = 900, quality = 0.78, addWatermark = true): Promise<string> {
  try {
    let base64Data: string;
    if (typeof fileOrBase64 === 'string') {
      base64Data = fileOrBase64;
    } else {
      base64Data = await compressImage(fileOrBase64, maxPx, quality, addWatermark);
    }

    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const fileExt = 'jpeg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to storage:', err);
    throw err;
  }
}

// formatPrice utility moved to src/utils/format.ts

const isNewItem = (createdAtISO?: string) => {
  if (!createdAtISO) return false;
  const createdDate = new Date(createdAtISO).getTime();
  const diffTime = Date.now() - createdDate;
  return diffTime > 0 && diffTime < 24 * 60 * 60 * 1000;
};

// ===========================================
// المسؤولية:
// توليد رابط WhatsApp مباشر للتواصل مع البائع.
//
// لماذا موجود؟
// لتسهيل التواصل المباشر بين المشتري والبائع بضغطة زر.
//
// آمن للتعديل:
// نعم.
// ===========================================
function getWhatsAppLink(phone: string, itemType: 'product' | 'transport', details: any) {
  if (!phone) return '#';
    let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
  if (!cleanPhone.startsWith('964') && !cleanPhone.startsWith('+964')) {
    cleanPhone = '964' + cleanPhone;
  }
  cleanPhone = cleanPhone.replace('+', '');
  const idStr = details.short_id ? `#${details.short_id}` : `#${String(details.id).substring(0, 5)}`;
  const title = details.title || details.university || 'إعلان';
  const location = details.location || details.governorate || 'غير محدد';
  
  const text = `السلام عليكم 🌹
شفت إعلان (*${title}*) وحاب أستفسر عنه إذا متوفر حالياً.

*تفاصيل الإعلان:*
📌 *${title}*
🆔 *رمز الإعلان:* ${idStr}
📍 *${location}*

*رسالة من منصة سوق بغداد:*
سوق بغداد هو السوق الرقمي العراقي الحديث، نسهل عليكم التواصل المباشر بين البائع والمشتري بكل سرعة وأمان.
🌐 تصفحوا المزيد من العروض عبر موقعنا:
www.souqbaghdad.store
بانتظار ردكم، شكراً 🙏`;
  
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

// ===========================================
// المسؤولية:
// تفعيل واجهة المشاركة الأصلية (Web Share API) في الهواتف، أو نسخ الرابط كبديل.
//
// لماذا موجود؟
// لتسهيل نشر الإعلانات والمنتجات في منصات أخرى.
//
// آمن للتعديل:
// نعم.
// ===========================================
export function handleUniversalShare(details: { title?: string; university?: string; type?: string; location?: string; governorate?: string; regions?: string; id?: any; short_id?: string; price?: string; image?: string; images?: string[]; url?: string; description?: string; views?: number; createdAt?: string; isVerified?: boolean; }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-share-modal', { detail: details }));
  }
}

// Time helpers moved to src/utils/time.ts


// ===========================================
// المسؤولية:
// معرفة نوع جهاز المستخدم (موبايل، ديسكتوب، تابلت).
//
// لماذا موجود؟
// لأغراض الإحصائيات وتحليل البيانات (Analytics).
//
// آمن للتعديل:
// نعم.
// ===========================================
function detectDevice(): Visit['device'] {
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}
// ===========================================
// المسؤولية:
// تسجيل زيارة المستخدم للتطبيق في قاعدة البيانات.
//
// استعلام Supabase:
// عدد مرات التنفيذ المتوقع: مرة واحدة لكل جلسة متصفح (Session).
// إذا تكرر بشكل كبير فهناك مشكلة (تأكد من عدم وضعه داخل Render loop).
// ===========================================
function recordVisit(user: User | null) {
  const v: Visit = { id: Date.now()+Math.random().toString(36).slice(2), timestamp: new Date().toISOString(), device: detectDevice(), location: user?.location||'زائر', userId: user?.id, userName: user?.name, page:'home' };
  try { const prev:Visit[] = JSON.parse(localStorage.getItem('souqVisits')||'[]'); localStorage.setItem('souqVisits', JSON.stringify([v,...prev].slice(0,2000))); } catch {}
}
// ===========================================
// المسؤولية:
// حفظ بيانات المستخدم في LocalStorage.
//
// لماذا موجود؟
// لتسريع عملية تسجيل الدخول في المرات القادمة (Caching).
// ===========================================
function saveStoredUser(user: User, adCount: number) {
  try {
    const users: StoredUser[] = JSON.parse(localStorage.getItem('souqUsers')||'[]');
    const idx = users.findIndex(u=>u.id===user.id);
    const su: StoredUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      role: user.role,
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      rating: users[idx]?.rating ?? user.rating ?? 5,
      ratingCount: users[idx]?.ratingCount ?? 1,
      registeredAt: users[idx]?.registeredAt || new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      adCount,
      isBanned: users[idx]?.isBanned || false
    };
    if (idx>=0) users[idx]=su; else users.unshift(su);
    localStorage.setItem('souqUsers', JSON.stringify(users));
  } catch {}
}
// ===========================================
// المسؤولية:
// التحقق مما إذا كان البريد الإلكتروني محظوراً من النظام.
// ===========================================
function isBanned(email: string) {
  try { return (JSON.parse(localStorage.getItem('souqUsers')||'[]') as StoredUser[]).find(u=>u.email===email)?.isBanned||false; } catch { return false; }
}
const useSound = () => {
  const ctx = useRef<AudioContext|null>(null);
  return (type: 'success' | 'error' | 'click' | 'info' | 'upload' | 'delete' | 'admin') => {
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const c = ctx.current;
      if (c.state === 'suspended') {
        c.resume();
      }
      const playTone = (freqs: number[], duration = 0.3, typeNode: OscillatorType = 'sine', volume = 0.2) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = typeNode;
        osc.connect(gain);
        gain.connect(c.destination);
        const now = c.currentTime;
        if (freqs.length === 1) {
          osc.frequency.setValueAtTime(freqs[0], now);
        } else if (freqs.length === 2) {
          osc.frequency.setValueAtTime(freqs[0], now);
          osc.frequency.setValueAtTime(freqs[1], now + duration / 2);
        } else {
          freqs.forEach((f, idx) => {
            osc.frequency.setValueAtTime(f, now + (idx * (duration / freqs.length)));
          });
        }
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + duration);
        osc.start(now);
        osc.stop(now + duration);
      };

      if (type === 'upload') {
        playTone([523.25, 659.25, 783.99], 0.25, 'sine', 0.25);
      } else if (type === 'delete') {
        playTone([493.88, 329.63], 0.35, 'triangle', 0.25);
      } else if (type === 'admin') {
        playTone([880.00, 1318.51], 0.6, 'sine', 0.3);
      } else {
        const f: Record<string, number[]> = {
          success: [800, 1000],
          error: [400, 300],
          click: [500, 500],
          info: [700, 900]
        };
        playTone(f[type], 0.3, 'sine', 0.2);
      }
    } catch {}
  };
};


// ─────────────────────────────────────────────
// Online Statuses Cache
// ─────────────────────────────────────────────
// useOnlineStatuses moved to src/hooks/useOnlineStatuses.ts

// ─────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Image Crop Modal
// ─────────────────────────────────────────────


// ===========================================
// المسؤولية:
// تسجيل مشاهدة جديدة لـ (إعلان، منتج، نقل).
//
// استهلاك Supabase:
// يتم استدعاء قاعدة البيانات لإضافة المشاهدة.
// لمنع الـ Spam، يوجد LocalStorage لحفظ الـ IDs التي تمت مشاهدتها حديثاً.
// ===========================================
export async function recordItemView(itemId: string|number, itemType: 'ad'|'product'|'transport', currentUser: User|null, sellerId?: string) {
  try {
    // Owner should not count towards their own ad's views
    if (currentUser && sellerId && currentUser.id === sellerId) {
      return;
    }

    const lastViewKey = `last_view_${itemType}_${itemId}`;
    const lastView = localStorage.getItem(lastViewKey);
    if (lastView && Date.now() - Number(lastView) < 60 * 60 * 1000) {
      return; // Already viewed recently
    }

    localStorage.setItem(lastViewKey, Date.now().toString());

    // Update the views counter on the item itself directly
    const table = itemType === 'product' ? 'products' : 'ads';
    const { error: rpcErr } = await supabase.rpc('increment_view', { table_name: table, item_id: itemId });
    
    if (rpcErr) {
      // Fallback if RPC doesn't exist yet
      const { data: item } = await supabase.from(table).select('views').eq('id', itemId).single();
      if (item) {
        await supabase.from(table).update({ views: (item.views || 0) + 1 }).eq('id', itemId);
      }
    }
  } catch (e) {
    console.error('Failed to record view', e);
  }
}

// ViewersModal moved to src/components/ViewersModal.tsx



// ─────────────────────────────────────────────
// Skeleton Card
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Onboarding Modal
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Congratulations Modal
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────
// Auth Modal
// ─────────────────────────────────────────────




// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Image Lightbox Modal with Watermark Download
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Ad Card
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Ad Detail Modal
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Product Detail Modal
// ─────────────────────────────────────────────




// ─────────────────────────────────────────────
// Ad Form Modal (Create / Edit)
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Product Form Modal (Create / Edit)
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────






// ─────────────────────────────────────────────
// Seller Public Page
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Owner Dashboard
// ─────────────────────────────────────────────

// getWhatsAppResetLink is imported from utils/helpers

// SystemLog interface is imported from ./types (removed duplicate)

// logSystemAction moved to src/utils/logs.ts

// OwnerDashboard component has been extracted and is now lazy loaded.





// ─────────────────────────────────────────────
// Notifications Panel
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Market View
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Transport View (قسم خطوط الجامعات)
// ─────────────────────────────────────────────
export const UNIVERSITIES = [
  'الكل', 'جامعة بغداد', 'الجامعة المستنصرية', 'الجامعة التكنولوجية', 'الجامعة العراقية',
  'جامعة النهرين', 'كلية المأمون الجامعة', 'كلية التراث الجامعة', 'جامعة الفراهيدي',
  'كلية المنصور الجامعة', 'جامعة دجلة', 'كلية الاسراء الجامعة', 'كلية مدينة العلم', 'أخرى'
];

export const EMPLOYEE_WORKPLACES = [
  'الكل', 'الوزارات والدوائر الحكومية', 'المنطقة الخضراء', 'مجمع الكليات / الجادرية',
  'البنوك والمصارف', 'الشركات الأهلية', 'المستشفيات والدوائر الصحية', 'ميناء / مطار بغداد',
  'شارع فلسطين / زيونة (تجارية)', 'المنصور / الحارثية (دوائر وشركات)', 'الكرادة (مؤسسات وشركات)', 'أخرى'
];

// TransportAd moved to src/types/index.ts





// ─────────────────────────────────────────────
// Root App

// ─────────────────────────────────────────────
type AppView = 'home'|'profile'|'admin'|'owner'|'seller'|'transport'|'products'|'ad-detail'|'product-detail'|'transport-detail' | string;

// ===========================================
// مسؤولية هذا الملف:
// الموجه الرئيسي (Router) للتطبيق بأكمله.
//
// لماذا موجود؟
// يحتوي على هيكل الصفحات، حالة المستخدم (User State)، وشريط التنقل (Navigation).
//
// انتبه:
// يحتوي على حالات (States) رئيسية. أي إعادة تعيين (State Update) هنا ستؤدي إلى
// إعادة تصيير (Re-render) للتطبيق بالكامل.
// ===========================================
export default function App() {
  const [user, setUser] = useState<User|null>(() => {
    try {
      const stored = localStorage.getItem('souqUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const stored = localStorage.getItem('souqThemeMode');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {}
    return 'system';
  });

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showBiometricBanner, setShowBiometricBanner] = useState(false);
  const playNotificationSound = useSound();

  const [isBiometricLocked, setIsBiometricLocked] = useState<boolean>(() => {
    return localStorage.getItem('biometricEnabled') === 'true' && localStorage.getItem('souqUser') !== null && sessionStorage.getItem('biometricUnlocked') !== 'true';
  });

  useEffect(() => {
    const checkBiometric = async () => {
      if (isBiometricLocked) {
        if (Capacitor.isNativePlatform()) {
          try {
            const { isAvailable } = await BiometricAuth.checkBiometry();
            if (isAvailable) {
              await BiometricAuth.authenticate({
                reason: "يرجى تأكيد هويتك للوصول إلى التطبيق",
                androidTitle: "المصادقة بالبصمة",
              });
              setIsBiometricLocked(false);
              sessionStorage.setItem('biometricUnlocked', 'true');
            } else {
              setIsBiometricLocked(false); // No biometric hardware
            }
          } catch (e) {
            console.log('Biometric failed or cancelled', e);
            // User cancelled or failed
          }
        } else {
           setIsBiometricLocked(false); // Skip on web
        }
      }
    };
    checkBiometric();
  }, [isBiometricLocked]);

  useEffect(() => {
    if (user && !localStorage.getItem('biometricPromptShown') && !isBiometricLocked) {
      const t = setTimeout(() => {
        setShowBiometricBanner(true);
        try { playNotificationSound('info'); } catch(e){}
      }, 4000); // Show 4 seconds after loading
      return () => clearTimeout(t);
    }
    return undefined;
  }, [user, isBiometricLocked]);

  useEffect(() => {
    if (themeMode === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemDark);
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode]);

  // Initialize Native Permissions
  useEffect(() => {
    const initPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        setTimeout(async () => {
          try {
            const notifStatus = await LocalNotifications.checkPermissions();
            if (notifStatus.display !== 'granted') {
              const requestResult = await LocalNotifications.requestPermissions();
              console.log('Notification permission request result:', requestResult);
            }
          } catch (e) {
            console.warn('Native permissions error:', e);
          }
        }, 1500); // 1.5 second delay to ensure UI is ready for the OS prompt
      }
    };
    initPermissions();
  }, []);


  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const changeThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    try {
      localStorage.setItem('souqThemeMode', mode);
    } catch {}
    setShowThemeMenu(false);
  };

  const toggleDarkMode = () => {
    setThemeMode(prev => {
      const next = prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system';
      try {
        localStorage.setItem('souqThemeMode', next);
      } catch {}
      return next;
    });
  };

  const [showScrollButtons, setShowScrollButtons] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Disappear when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setShowScrollButtons(false);
      }

      lastScrollY = currentScrollY;

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        setShowScrollButtons(true);
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);
  const [showStoreGuide, setShowStoreGuide] = useState(false);
  const [adCosts, setAdCosts] = useState<{ad:number; product:number; transport:number; vip_ad:number}>({ ad: 1, product: 1, transport: 1, vip_ad: 5 });

  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يجلب إعدادات النظام (تكلفة الإعلانات) من Supabase.
  // استعلام Supabase — عدد مرات التنفيذ المتوقع: مرة واحدة فقط.
  // إذا تكرر فهناك مشكلة في تغيير State خارج هذا الـ Effect.
  useEffect(() => {
    supabase.from('system_settings').select('*').then(({ data, error }) => {
      if (!error && data) {
        const costs: any = { ad: 1, product: 1, transport: 1, vip_ad: 5 };
        data.forEach(r => { costs[r.category] = r.cost; });
        setAdCosts(costs);
      }
    });
  }, []);
  const getInitialRouteInfo = () => {
    if (typeof window === 'undefined') return { hash: '', path: '' };
    let hash = window.location.hash;
    const path = window.location.pathname;
    
    // Fallback if hash is empty but path has content (SEO friendly URL)
    if ((!hash || hash === '#/') && path !== '/') {
      hash = '#' + path;
    }
    return { hash, path };
  };

  const [view, setView] = useState<AppView>(() => {
    const { hash } = getInitialRouteInfo();
    if (hash.startsWith('#/privacy')) return 'privacy';
    if (hash.startsWith('#/transport')) return 'transport';
    if (hash.startsWith('#/products')) return 'products';
    if (hash.startsWith('#/seller') || hash.startsWith('#/profile/')) return 'seller';
    if (hash === '#/profile' || hash.startsWith('#/profile')) return 'profile';
    if (hash.startsWith('#/admin')) return 'admin';
    if (hash.startsWith('#/owner')) return 'owner';
    return 'home';
  });
  const [bottomNavActive, setBottomNavActive] = useState(() => {
    const { hash } = getInitialRouteInfo();
    if (hash.startsWith('#/transport')) return 'transport';
    if (hash.startsWith('#/products')) return 'products';
    if (hash.startsWith('#/seller') || hash.startsWith('#/profile')) return 'profile';
    return 'home';
  });

  useEffect(() => {
    if (view === 'transport') setBottomNavActive('transport');
    else if (view === 'products') setBottomNavActive('products');
    else if (view === 'profile' || view === 'seller') setBottomNavActive('profile');
    else if (view === 'home') setBottomNavActive('home');
  }, [view]);
  const [selectedSellerId, setSelectedSellerId] = useState<string|null>(() => {
    const { hash } = getInitialRouteInfo();
    // Extract UUID from /seller/UUID or /profile/UUID
    const sellerMatch = hash.match(/^#\/(seller|profile)\/([0-9a-f-]{36})/i);
    if (sellerMatch) return sellerMatch[2];
    // Fallback: last segment if it looks like a UUID
    const parts = hash.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last)) return last;
    return null;
  });
  const [selectedSellerPhone, setSelectedSellerPhone] = useState<string|null>(() => {
    const { hash } = getInitialRouteInfo();
    if (hash.startsWith('#/seller/')) return hash.split('/')[2] || null;
    if (hash.startsWith('#/profile/')) return hash.split('/')[2] || null;
    return null;
  });

  // هذا useEffect يعمل عندما يتغير view أو selectedSellerPhone.
  // يحول رقم الهاتف إلى معرّف UUID للبائع من Supabase.
  // استعلام Supabase — يعمل فقط عند عرض ملف البائع.
  useEffect(() => {
    if (view === 'profile' && selectedSellerPhone) {
      if (selectedSellerPhone.includes('-')) {
        setSelectedSellerId(selectedSellerPhone);
      } else {
        supabase.from('profiles').select('id').eq('phone', selectedSellerPhone).single().then(({data}) => {
          if (data) setSelectedSellerId(data.id);
        });
      }
    }
  }, [view, selectedSellerPhone]);

  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad|null>(null);
  const [editingProduct, setEditingProduct] = useState<Product|null>(null);
  const [editingTransportAd, setEditingTransportAd] = useState<TransportAd|null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad|null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product|null>(null);
  const [selectedTransportAd, setSelectedTransportAd] = useState<TransportAd|null>(null);
  const [actionMenuTarget, setActionMenuTarget] = useState<{type:'ad'|'product'|'transport'; item:any}|null>(null);
  const [toast, setToast] = useState<{msg:string;type:string;visible:boolean}>({msg:'',type:'info',visible:false});
  const [showCreateTransport, setShowCreateTransport] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<string | null>(null);
  const [docContactForm, setDocContactForm] = useState({ name: '', email: '', msg: '' });
  const [docContactSent, setDocContactSent] = useState(false);
  const [docContactSending, setDocContactSending] = useState(false);

  const handleDocContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docContactForm.name.trim() || !docContactForm.email.trim() || !docContactForm.msg.trim()) return;
    setDocContactSending(true);
    try {
      const payload: any = {
        name: docContactForm.name.trim(),
        contact_info: docContactForm.email.trim(),
        message: docContactForm.msg.trim()
      };
      if (user) {
        payload.user_id = user.id;
      }
      const { error } = await supabase.from('support_messages').insert([payload]);
      if (error) throw error;
      setDocContactSent(true);
      setDocContactForm({ name: '', email: '', msg: '' });
    } catch (err: any) {
      alert('حدث خطأ أثناء إرسال الرسالة: ' + (err?.message || err));
    } finally {
      setDocContactSending(false);
    }
  };
  const [activeLightbox, setActiveLightbox] = useState<{ src: string; title: string; images?: string[]; initialIdx?: number } | null>(null);
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; title: string; url: string; image?: string; price?: string; governorate?: string; location?: string; short_id?: string; description?: string; category?: string; views?: number; createdAt?: string; isVerified?: boolean; images?: string[]; university?: string; regions?: string; type?: string; }>({ isOpen: false, title: '', url: '' });
  const getDefaultAds = (): Ad[] => [];

  const getDefaultProducts = (): Product[] => [];

  const [allAds, setAllAds] = useState<Ad[]>(getDefaultAds);
  const [allTransportAds, setAllTransportAds] = useState<TransportAd[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>(getDefaultProducts);
  const [congratulationsItem, setCongratulationsItem] = useState<{ title: string; type: 'ad' | 'product' } | null>(null);
  const [favorites, setFavorites] = useState<number[]>(()=>{
    try{return JSON.parse(localStorage.getItem('souqFavs')||'[]');}catch{return[];}
  });
  const [initialHashParsed, setInitialHashParsed] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [storedUsers, setStoredUsers] = useState<any[]>([]);
  
  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState<'safari' | 'ios-other' | 'android-fallback' | null>(null);
  const [showInstallOptions, setShowInstallOptions] = useState(false);
  
  // Pagination & Filtering state
  const [adsPage, setAdsPage] = useState(0);
  const [hasMoreAds, setHasMoreAds] = useState(true);
  const [totalAdsCount, setTotalAdsCount] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const transportPageRef = useRef(0);
  const [hasMoreTransport, setHasMoreTransport] = useState(true);
  const [totalTransportCount, setTotalTransportCount] = useState(0);
  
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [gov, setGov] = useState('الكل');
  const [sort, setSort] = useState<'recent'|'views'|'price-low'|'price-high'>('recent');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all'|'new'|'used'>('all');

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const isFirstLoadDone = useRef(false);
  const [loadingMoreAds, setLoadingMoreAds] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [loadingTransport, setLoadingTransport] = useState(false);

  const playSound = useSound();

  useEffect(() => {
    const completed = localStorage.getItem('souq_onboarding_completed') || localStorage.getItem('souqOnboarded');
    if (!completed) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يحلل عنوان URL لفتح الإعلان أو المنتج أو النقل مباشرة (Deep Linking).
  // استعلام Supabase — يُنفَّذ فقط إذا كان الرابط يحتوي على معرّف.
  // انتبه: قد يسبب جلبين (fetch هنا + fetch في useEffect آخر). تأكد من عدم التكرار.
  useEffect(() => {
    const handleUrlRefresh = async () => {
      try {
        const path = decodeURIComponent(window.location.pathname);
        if (!path || path === '/' || path === '/IQ') return;

        if (path.includes('/ad/')) {
          const cleanPath = path.replace(/[\/#]+$/, '');
          const parts = cleanPath.split('-');
          const extractedId = parts[parts.length - 1];

          if (extractedId) {
            const isNumeric = /^\d+$/.test(extractedId);
            const searchQuery = isNumeric 
              ? `id.eq.${extractedId},short_id.eq.${extractedId}` 
              : `short_id.eq.${extractedId}`;

            const { data } = await supabase.from('ads').select('*').or(searchQuery).maybeSingle();
            if (data) {
              const mappedAd: Ad = {
                id: data.id,
                title: data.title,
                price: data.price,
                governorate: data.city || '',
                location: data.location || '',
                phone: data.phone || '',
                category: data.category,
                images: data.images || [],
                seller: {
                  name: data.seller_name || 'مستخدم',
                  avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                  isVerified: false,
                  rating: data.seller_rating || 4.8,
                  joinedDate: data.created_at,
                  location: data.city || '',
                },
                time: '',
                createdAtISO: data.created_at,
                views: data.views || 0,
                status: data.status,
                type: data.type || 'sell',
                description: data.description || '',
                adCount: 0,
                soldCount: 0,
                responseRate: 100,
                avgResponseTime: 'دقائق',
                postedBy: data.seller_id,
                short_id: data.short_id,
              };
              setSelectedAd(mappedAd);
            }
          }
        } 
        else if (path.includes('/product/')) {
          const cleanPath = path.replace(/[\/#]+$/, '');
          const parts = cleanPath.split('-');
          const extractedId = parts[parts.length - 1];

          if (extractedId) {
            const isNumeric = /^\d+$/.test(extractedId);
            const searchQuery = isNumeric 
              ? `id.eq.${extractedId},short_id.eq.${extractedId}` 
              : `short_id.eq.${extractedId}`;

            const { data } = await supabase.from('products').select('*').or(searchQuery).maybeSingle();
            if (data) {
              const mappedProduct: Product = {
                id: data.id,
                title: data.title,
                price: data.price,
                description: data.description || '',
                category: data.category,
                images: data.images || [],
                governorate: data.governorate || data.city || '',
                phone: data.phone || '',
                condition: data.condition || 'used',
                seller: {
                  name: data.seller_name || 'مستخدم',
                  avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                  isVerified: false,
                  rating: 4.8,
                  joinedDate: data.created_at,
                  location: data.governorate || '',
                },
                createdAtISO: data.created_at,
                views: data.views || 0,
                postedBy: data.seller_id,
                stock: data.stock || 1,
                status: data.status || 'active',
                short_id: data.short_id,
              };
              setSelectedProduct(mappedProduct);
            }
          }
        }
        else if (path.includes('/transport/card/')) {
          const cleanPath = path.replace(/[\/#]+$/, '');
          const parts = cleanPath.split('/');
          const extractedId = parts[parts.length - 1];

          if (extractedId) {
            const isNumeric = /^\d+$/.test(extractedId);

            let query = supabase
              .from('ads')
              .select('*')
              .eq('category', 'transport');

            if (isNumeric) {
              query = query.or(`id.eq.${extractedId},short_id.eq.${extractedId}`);
            } else {
              query = query.eq('short_id', extractedId);
            }

            const { data: row, error } = await query.maybeSingle();

            if (!error && row) {
              // Parse JSON description field exactly like fetchAds does
              let extra: any = {
                shift: 'صباحي', seats: 4, vehicleType: 'خصوصي',
                targetAudience: 'مختلط', categoryType: 'student',
                note: '', interest: 0, whatsappClicks: 0,
                completedAt: undefined, completion_reason: null
              };
              try {
                if (row.description) extra = { ...extra, ...JSON.parse(row.description) };
              } catch { extra.note = row.description || ''; }

              const mapped: TransportAd = {
                id: row.id,
                type: row.type || 'offer',
                categoryType: extra.categoryType || 'student',
                university: row.city || '',
                regions: row.location || '',
                shift: extra.shift,
                seats: Number(extra.seats) || 0,
                vehicleType: extra.vehicleType,
                targetAudience: extra.targetAudience,
                price: row.price ? String(row.price) : '',
                phone: row.phone || '',
                note: extra.note,
                sellerName: row.seller_name || 'مستخدم',
                sellerAvatar: row.seller_avatar || '',
                createdAt: row.created_at,
                status: row.status === 'active' ? 'published' : row.status,
                postedBy: row.seller_id,
                views: row.views || 0,
                interest: extra.interest,
                whatsappClicks: extra.whatsappClicks,
                completedAt: extra.completedAt,
                completion_reason: extra.completion_reason,
                short_id: row.short_id || undefined,
              };
              setSelectedTransportAd(mapped);
              setView('transport');
            }
          }
        }
      } catch (error) {
        console.error("URL parsing error:", error);
      }
    };

    handleUrlRefresh();
  }, []);

  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يجلب بيانات جميع البائعين من Supabase (حتى 200 ملف).
  // استعلام Supabase — عدد مرات التنفيذ المتوقع: مرة واحدة فقط.
  // اقتراح تحسين: يمكن تطبيق Caching لتقليل استهلاك الباقة.
  // ✅ آمن: يستخدم isMounted لمنع Memory Leak بعد إلغاء التحميل.
  useEffect(() => {
    let isMounted = true;
    async function loadAllProfilesGlobal() {
      try {
        const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const sellersMap = new Map();

        const cachedProfilesStr = localStorage.getItem('souq_cached_profiles');
        const cachedProfilesTime = localStorage.getItem('souq_cached_profiles_time');
        let dbProfiles = null;
        let isCacheValid = false;

        if (cachedProfilesStr && cachedProfilesTime) {
          const cacheAge = Date.now() - Number(cachedProfilesTime);
          if (cacheAge < 60 * 60 * 1000) { // 1 hour cache
            try {
              dbProfiles = JSON.parse(cachedProfilesStr);
              isCacheValid = true;
            } catch (e) {
              console.warn('Failed to parse cached profiles:', e);
            }
          }
        }

        if (!isCacheValid) {
          const { data, error } = await supabase.from('profiles').select('id, full_name, avatar_url, phone, city, created_at, role').limit(200);
          if (!error && data) {
            dbProfiles = data;
            localStorage.setItem('souq_cached_profiles', JSON.stringify(data));
            localStorage.setItem('souq_cached_profiles_time', String(Date.now()));
          }
        }

        if (dbProfiles && dbProfiles.length > 0) {
          dbProfiles.forEach((p: any) => {
            sellersMap.set(p.id, {
              id: p.id,
              name: p.full_name || p.name || 'مستخدم',
              avatar: p.avatar_url || p.avatar || DEFAULT_AVATAR,
              phone: p.phone || '',
              location: p.city || p.location || 'بغداد',
              adCount: 0,
              prodCount: 0,
              rating: 4.9,
              created_at: p.created_at || new Date().toISOString(),
              isVerified: p.role === 'owner' || p.role === 'vendor' || p.role === 'admin',
              role: p.role || 'user'
            });
          });
        }

        localUsers.forEach((u: any) => {
          if (!sellersMap.has(u.id)) {
            sellersMap.set(u.id, {
              id: u.id,
              name: u.name,
              avatar: u.avatar || DEFAULT_AVATAR,
              phone: u.phone || '',
              location: u.location || 'بغداد',
              adCount: u.adCount || 0,
              prodCount: 0,
              rating: 4.8,
              created_at: new Date().toISOString(),
              isVerified: u.role === 'owner' || u.role === 'vendor' || u.isVerified,
              role: u.role || 'user'
            });
          }
        });

        allAds.forEach(ad => {
          if (ad.postedBy) {
            if (!sellersMap.has(ad.postedBy)) {
              sellersMap.set(ad.postedBy, {
                id: ad.postedBy,
                name: ad.seller?.name || 'مستخدم',
                avatar: ad.seller?.avatar || DEFAULT_AVATAR,
                phone: ad.phone || '',
                location: ad.location || ad.governorate || 'بغداد',
                adCount: 1,
                prodCount: 0,
                rating: ad.seller?.rating || 4.8,
                created_at: ad.createdAtISO || new Date().toISOString(),
                isVerified: ad.seller?.isVerified || false,
                role: 'user'
              });
            } else {
              const existing = sellersMap.get(ad.postedBy);
              existing.adCount = (existing.adCount || 0) + 1;
              if (ad.phone && !existing.phone) existing.phone = ad.phone;
            }
          }
        });

        allProducts.forEach(p => {
          if (p.postedBy) {
            if (!sellersMap.has(p.postedBy)) {
              sellersMap.set(p.postedBy, {
                id: p.postedBy,
                name: p.seller?.name || 'مستخدم',
                avatar: p.seller?.avatar || DEFAULT_AVATAR,
                phone: p.phone || '',
                location: p.governorate || 'بغداد',
                adCount: 0,
                prodCount: 1,
                rating: p.seller?.rating || 4.8,
                created_at: p.createdAtISO || new Date().toISOString(),
                isVerified: p.seller?.isVerified || false,
                role: 'user'
              });
            } else {
              const existing = sellersMap.get(p.postedBy);
              existing.prodCount = (existing.prodCount || 0) + 1;
              if (p.phone && !existing.phone) existing.phone = p.phone;
            }
          }
        });

        if (isMounted) setStoredUsers(Array.from(sellersMap.values()));
      } catch (e) {
        console.error(e);
      }
    }
    loadAllProfilesGlobal();
    return () => { isMounted = false; };
  }, []);

  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يستمع لحدث (open-share-modal) لفتح نافذة المشاركة من أي مكوّن.
  // ✅ آمن: يتم تنظيف الـ Event Listener في الـ cleanup function.
  useEffect(() => {
    const handleOpenShare = (e: any) => {
      const d = e.detail || {};
      const itemTitle = d.title || (d.university ? `${d.type === 'offer' ? 'خط متوفر' : 'طلب خط'} - ${d.university}` : 'إعلان في سوق بغداد');
      const itemLoc = d.location || d.governorate || d.regions || 'العراق';
      const itemImg = d.image || (Array.isArray(d.images) && d.images[0] ? d.images[0] : undefined);
      const itemUrl = d.url || (typeof window !== 'undefined' ? window.location.href : 'https://www.souqbaghdad.store');
      setShareModalData({
        isOpen: true,
        title: itemTitle,
        url: itemUrl,
        image: itemImg,
        price: d.price ? String(d.price) : undefined,
        governorate: itemLoc,
        short_id: d.short_id || (d.id ? String(d.id).substring(0, 5) : undefined),
        description: d.description || d.details || '',
        category: d.category || 'general',
        views: d.views,
        createdAt: d.createdAt,
        isVerified: d.isVerified,
        images: d.images,
        university: d.university,
        regions: d.regions,
        type: d.type,
      });
    };
    window.addEventListener('open-share-modal', handleOpenShare);
    return () => window.removeEventListener('open-share-modal', handleOpenShare);
  }, []);

  // ── دالة تحميل بيانات المستخدم من Supabase ──────────────────────────
  const loadUserFromSupabase = async (authUser: any) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    const role = authUser.email === OWNER_EMAIL ? 'owner'
      : (profile?.role || authUser.user_metadata?.role || 'user');
    const u: User = {
      id: authUser.id,
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'مستخدم',
      email: authUser.email || '',
      phone: profile?.phone || authUser.user_metadata?.phone || '',
      role,
      avatar: profile?.avatar_url || DEFAULT_AVATAR,
      cover: profile?.cover_url || DEFAULT_COVER,
      bio: '',
      location: profile?.city || authUser.user_metadata?.city || 'بغداد',
      points: profile?.points || 0,
      rating: 4.8,
      isVerified: role !== 'user',
      joinedDate: profile?.created_at || 'الآن',
      stats: { ads: profile?.ads_count || 0, favorites: profile?.favorites_count || 0, views: profile?.views_count || 0 },
      sellerStats: { totalAds: 0, sold: 0, responseRate: 100, avgResponseTime: 'دقائق' }
    };
    setUser(u);
    localStorage.setItem('souqUser', JSON.stringify(u));
  };

  // ── استعادة الجلسة ومراقبة Auth ────────────────────────────────────
  

  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يستعيد جلسة المستخدم الحالية ويراقب تغييرات حالة المصادقة.
  // ✅ آمن: يتم إلغاء اشتراك Auth listener في الـ cleanup.
  // استعلام Supabase — مرة واحدة فقط + listener دائم.
  // انتبه: لا تضف State هنا حتى لا يتحول إلى Infinite Loop.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserFromSupabase(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserFromSupabase(session.user);
      else if (_event === 'SIGNED_OUT') { setUser(null); localStorage.removeItem('souqUser'); }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notifications handlers and effects are initialized below notifications state

  // --- DEEP LINKING & ROUTING HOOKS ---

  // Ref to track whether a deep link fetch is in-flight (prevents race with URL sync)
  const pendingDeepLinkRef = useRef<string | null>(null);

  const syncStateFromPath = () => {
    let path = window.location.pathname;
    let hasHash = false;
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      path = window.location.hash.substring(1);
      hasHash = true;
    }

    if (hasHash && typeof window !== 'undefined') {
      window.history.replaceState(null, '', path + window.location.search);
    }

    if (!path || path === '/' || path === '/IQ') {
      setView('home');
      setSelectedAd(null);
      setSelectedProduct(null);
      setSelectedSellerId(null);
      return;
    }
    
    // Normalize path: remove leading '/'
    const cleanPath = path.replace(/^\//, '');
    const parts = cleanPath.split('/').filter(Boolean);
    // parts[0] is route type ('ad', 'product', 'accounts', 'seller', 'profile', 'transport', 'admin', 'owner')
    const type = parts[0];
    const targetId = parts[parts.length - 1]; // Get last segment as ID or slug
    
    if (type === 'ad' && targetId) {
      let actualId = targetId;
      const uuidMatch = targetId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
      if (uuidMatch) {
        actualId = uuidMatch[1];
      } else if (targetId.includes('-')) {
        const segments = targetId.split('-');
        actualId = segments[segments.length - 1];
      }
      
      const slugify = (text: string) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[\s_]+/g, '-')
          .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
          .replace(/--+/g, '-');
      };
      
      const targetSlug = slugify(decodeURIComponent(targetId));
      const ad = allAds.find(a => 
        String(a.id) === actualId || 
        a.short_id === actualId ||
        (a.title && slugify(a.title) === targetSlug) ||
        (a.title && slugify(a.title).includes(targetSlug)) ||
        (a.title && targetSlug.includes(slugify(a.title)))
      );
      
      if (ad) {
        setSelectedAd(ad);
      } else {
        setLoadingRoute(true);
        pendingDeepLinkRef.current = 'ad:' + actualId;
        const isNumeric = /^\d+$/.test(actualId);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualId);
        let query = supabase.from('ads').select('*').eq('is_demo', false);
        if (isUUID) {
          query = query.eq('id', actualId);
        } else if (isNumeric) {
          query = query.eq('id', Number(actualId));
        } else {
          query = query.eq('short_id', actualId);
        }
        query.single().then(({ data, error }) => {
          if (data && !error) {
            pendingDeepLinkRef.current = null;
            setLoadingRoute(false);
            const mappedAd: Ad = {
              id: data.id,
              title: data.title,
              price: data.price,
              governorate: data.city || '',
              location: data.location || '',
              phone: data.phone || '',
              category: data.category,
              images: data.images || [],
              seller: {
                name: data.seller_name || 'مستخدم',
                avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                isVerified: false,
                rating: data.seller_rating || 4.8,
                joinedDate: data.created_at,
                location: data.city || '',
              },
              time: '',
              createdAtISO: data.created_at,
              views: data.views || 0,
              status: data.status,
              type: data.type || 'sell',
              description: data.description || '',
              adCount: 0,
              soldCount: 0,
              responseRate: 100,
              avgResponseTime: 'دقائق',
              postedBy: data.seller_id,
              short_id: data.short_id,
            };
            setSelectedAd(mappedAd);
          } else {
            // Query failed — keep pendingDeepLinkRef so retry from allAds update can pick it up
            console.warn('[DeepLink] Ad fetch failed for', actualId, error);
            setLoadingRoute(false);
          }
        });
      }
    } else if (type === 'product' && targetId) {
      let actualId = targetId;
      const uuidMatch = targetId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
      if (uuidMatch) {
        actualId = uuidMatch[1];
      } else if (targetId.includes('-')) {
        const segments = targetId.split('-');
        actualId = segments[segments.length - 1];
      }
      const prod = allProducts.find(p => 
        String(p.id) === actualId || 
        p.short_id === actualId ||
        String(p.id) === targetId || 
        p.short_id === targetId
      );
      if (prod) {
        setSelectedProduct(prod);
      } else {
        setLoadingRoute(true);
        pendingDeepLinkRef.current = 'product:' + actualId;
        const isNumeric = /^\d+$/.test(actualId);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualId);
        let query = supabase.from('products').select('*');
        if (isUUID) {
          query = query.eq('id', actualId);
        } else if (isNumeric) {
          query = query.eq('id', Number(actualId));
        } else {
          query = query.eq('short_id', actualId);
        }
        query.single().then(({ data, error }) => {
          if (data && !error) {
            pendingDeepLinkRef.current = null;
            setLoadingRoute(false);
            const mappedProd: Product = {
              id: data.id,
              title: data.title,
              price: data.price,
              description: data.description || '',
              category: data.category,
              images: data.images || [],
              governorate: data.governorate || data.city || '',
              phone: data.phone || '',
              condition: data.condition || 'used',
              seller: {
                name: data.seller_name || 'مستخدم',
                avatar: data.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
                isVerified: false,
                rating: 4.8,
                joinedDate: data.created_at,
                location: data.governorate || '',
              },
              createdAtISO: data.created_at,
              views: data.views || 0,
              postedBy: data.seller_id,
              stock: data.stock || 1,
              status: data.status || 'active',
              short_id: data.short_id,
              is_vip: data.is_vip || false,
              vip_days: data.vip_days || 30,
            };
            setSelectedProduct(mappedProd);
          } else {
            // Query failed — keep pendingDeepLinkRef so retry from allProducts update can pick it up
            console.warn('[DeepLink] Product fetch failed for', actualId, error);
            setLoadingRoute(false);
          }
        });
      }
    } else if (type === 'profile') {
      setView('profile');
      setBottomNavActive('profile');
      if (targetId === 'pay' || targetId === 'wallet') {
        if (typeof window !== 'undefined') {
          setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-wallet-tab')), 100);
        }
      }
    } else if (type === 'products') {
      setView('products');
      setBottomNavActive('products');
    } else if (type === 'seller' && targetId) {
      if (targetId === 'pay' || targetId === 'wallet') {
        setView('profile');
        if (typeof window !== 'undefined') {
          setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-wallet-tab')), 100);
        }
      } else {
        let actualId = targetId;
        const uuidMatch = targetId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
        if (uuidMatch) {
          actualId = uuidMatch[1];
        } else if (targetId.includes('-')) {
          const segments = targetId.split('-');
          actualId = segments[segments.length - 1];
        }
        setSelectedSellerId(actualId);
        setView('seller');
      }
    } else if (type === 'accounts' || type === 'sellers') {
      setView('home');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('switch-to-profiles-tab'));
    } else if (type === 'transport') {
      setView('transport');
      if (parts.length > 1 && targetId && targetId !== 'transport') {
        const actualId = targetId;
        const line = allTransportAds.find(l => String(l.id) === actualId || l.short_id === actualId);
        if (line) {
          setSelectedTransportAd(line);
        } else {
          const isNumeric = /^\d+$/.test(actualId);
          let query = supabase.from('ads').select('*').eq('category', 'transport');
          if (isNumeric) {
            query = query.eq('id', Number(actualId));
          } else {
            query = query.eq('short_id', actualId);
          }
          query.single().then(({ data, error }) => {
            if (data && !error) {
              let extra = {
                shift: 'صباحي',
                seats: 4,
                vehicleType: 'خصوصي',
                targetAudience: 'مختلط',
                categoryType: 'student' as 'student' | 'employee',
                note: '',
                interest: 0,
                whatsappClicks: 0,
                completedAt: undefined,
                completion_reason: null
              };
              try {
                if (data.description) {
                  const parsed = JSON.parse(data.description);
                  extra = { ...extra, ...parsed };
                }
              } catch (e) {
                extra.note = data.description || '';
              }
              const mappedLine: TransportAd = {
                id: data.id,
                type: data.type || 'offer',
                categoryType: extra.categoryType || 'student',
                university: data.city || '',
                regions: data.location || '',
                shift: extra.shift,
                seats: Number(extra.seats) || 0,
                vehicleType: extra.vehicleType,
                targetAudience: extra.targetAudience,
                price: data.price ? String(data.price) : '',
                phone: data.phone || '',
                note: extra.note,
                sellerName: data.seller_name || 'مستخدم',
                sellerAvatar: data.seller_avatar || '',
                createdAt: data.created_at,
                status: data.status === 'active' ? 'published' : data.status,
                postedBy: data.seller_id,
                views: data.views || 0,
                interest: extra.interest,
                whatsappClicks: extra.whatsappClicks,
                completedAt: extra.completedAt,
                completion_reason: extra.completion_reason,
                short_id: data.short_id || undefined,
              };
              setSelectedTransportAd(mappedLine);
            }
          });
        }
      }
    } else if (type === 'admin') {
      setView('admin');
    } else if (type === 'owner') {
      setView('owner');
    }
  };

  // PWA & Redirection normalization
  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يتعامل مع أحداث تثبيت التطبيق كـ PWA وتنظيم مسارات URL.
  // ✅ آمن: يتم تنظيف جميع Event Listeners في الـ cleanup.
  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    
    // Normalize old /IQ paths to clean root path
    if (window.location.pathname === '/IQ') {
      window.history.replaceState(null, '', '/');
    }

    // Check standalone mode
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // PWA installation events
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // هذا useEffect يعمل عند أول تحميل وعند تغيير allAds أو allProducts.
  // يحلل مسار URL عند التحميل الأول، ثم يعيد المحاولة إذا لم تصل البيانات بعد.
  // انتبه: يعتمد على allAds وallProducts كـ Dependencies، أي يُعاد تنفيذه عند كل تحديث للإعلانات.
  // Initial route parsing — runs once on mount, then retries pending deep links when data arrives
  useEffect(() => {
    if (!initialHashParsed) {
      // First run: parse URL and start any async fetch
      syncStateFromPath();
      setInitialHashParsed(true);
      return;
    }

    // Retry pending deep links when allAds/allProducts update
    if (pendingDeepLinkRef.current) {
      const [linkType, linkId] = pendingDeepLinkRef.current.split(':');
      if (linkType === 'ad' && allAds.length > 0) {
        const found = allAds.find(a => String(a.id) === linkId || a.short_id === linkId);
        if (found) {
          pendingDeepLinkRef.current = null;
          setSelectedAd(found);
        }
      } else if (linkType === 'product' && allProducts.length > 0) {
        const found = allProducts.find(p => String(p.id) === linkId || p.short_id === linkId);
        if (found) {
          pendingDeepLinkRef.current = null;
          setSelectedProduct(found);
        } else {
        }
      }
    }
  }, [allAds, allProducts, initialHashParsed]);

  // هذا useEffect يستمع لحدث "popstate" و "hashchange" (زر الرجوع وتغير الهامش في المتصفح).
  // ✅ آمن: يتم تنظيف Event Listener في الـ cleanup.
  useEffect(() => {
    const handlePopState = () => syncStateFromPath();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [allAds, allProducts]);

  // هذا useEffect يعمل عند تغيير أي حالة تتعلق بالتنقل.
  // يقوم بتحديث عنوان URL في المتصفح ليعكس الصفحة الحالية (History Management).
  // انتبه: لا تضف States جديدة في dependencies بدون تفكير.
  useEffect(() => {
    if (!initialHashParsed || loadingRoute || pendingDeepLinkRef.current) return; // Don't push state before initial parse, while routing/fetching, or while deep link is pending
    let newPath: string | null = null;
    
    if (selectedAd) {
      const typeText = selectedAd.type === 'buy' ? 'شراء' : selectedAd.type === 'rent' ? 'ايجار' : selectedAd.type === 'service' ? 'خدمات' : 'بيع';
      const categoryText = selectedAd.category || 'عام';
      const titleText = selectedAd.title || 'اعلان';
      const govText = selectedAd.governorate || selectedAd.location || 'العراق';
      const slug = `${slugify(typeText)}-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
      newPath = `/ad/${slug}-${selectedAd.short_id || selectedAd.id}`;
    } else if (selectedProduct) {
      const categoryText = selectedProduct.category || 'منتجات';
      const titleText = selectedProduct.title || 'منتج';
      const govText = selectedProduct.governorate || 'العراق';
      const slug = `تسوق-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
      newPath = `/product/${slug}-${selectedProduct.short_id || selectedProduct.id}`;
    } else if (selectedTransportAd) {
      newPath = `/transport/card/${selectedTransportAd.short_id || selectedTransportAd.id}`;
    } else if (view === 'seller' && selectedSellerId) {
      newPath = `/seller/${selectedSellerPhone || selectedSellerId}`;
    } else if (view === 'transport') {
      newPath = `/transport`;
    } else if (view === 'privacy-policy') {
      newPath = `/privacy-policy`;
    } else if (view === 'products') {
      newPath = `/products`;
    } else if (view === 'profile') {
      newPath = `/profile`;
    } else if (view === 'admin') {
      newPath = `/admin`;
    } else if (view === 'owner') {
      newPath = `/owner`;
    } else {
      newPath = `/IQ`;
    }
    
    const currentPath = window.location.pathname + window.location.search;
    if (newPath && currentPath !== newPath) {
      window.history.pushState(null, '', newPath);
    } else if (!newPath && currentPath !== '/IQ') {
      window.history.pushState(null, '', '/IQ');
    }
  }, [view, selectedAd, selectedProduct, selectedSellerId, selectedTransportAd, initialHashParsed, loadingRoute]);
  // ------------------------------------

  // ── Rate Limit Helper ─────────────────────────
  const checkPostRateLimit = (): boolean => {
    const now = Date.now();
    let posts = [];
    try {
      posts = JSON.parse(localStorage.getItem('souq_post_timestamps') || '[]');
    } catch {
      posts = [];
    }
    posts = posts.filter((t: number) => now - t < 60000);
    if (posts.length >= 2) {
      showToast('⚠️ لقد تجاوزت الحد المسموح به. يمكنك نشر إعلانين كحد أقصى في الدقيقة الواحدة. يرجى الانتظار قليلاً.', 'error');
      return false;
    }
    posts.push(now);
    localStorage.setItem('souq_post_timestamps', JSON.stringify(posts));
    return true;
  };

  const fetchTransportAds = useCallback(async (reset = true) => {
    setLoadingTransport(true);
    try {
      const pageToFetch = reset ? 0 : transportPageRef.current + 1;
      const pageSize = 10;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      const { data: transportData, error: transportError, count } = await supabase
        .from('ads')
        .select('*', { count: 'exact' })
        .eq('category', 'transport')
        .eq('is_demo', false)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (!transportError && transportData) {
        const transportMapped = transportData.map((row: any) => {
          let extra = {
            shift: 'صباحي',
            seats: 4,
            vehicleType: 'خصوصي',
            targetAudience: 'مختلط',
            categoryType: 'student' as 'student' | 'employee' | 'emergency',
            note: '',
            interest: 0,
            whatsappClicks: 0,
            completedAt: undefined,
            completion_reason: null
          };
          try {
            if (row.description) {
              const parsed = JSON.parse(row.description);
              extra = { ...extra, ...parsed };
            }
          } catch (e) {
            extra.note = row.description || '';
          }
          return {
            id: row.id,
            type: row.type || 'offer',
            categoryType: extra.categoryType || 'student',
            university: row.city || '',
            regions: row.location || '',
            shift: extra.shift,
            seats: Number(extra.seats) || 0,
            vehicleType: extra.vehicleType,
            targetAudience: extra.targetAudience,
            price: row.price ? formatPrice(row.price) : '',
            phone: row.phone || '',
            note: extra.note,
            sellerName: row.seller_name || 'مستخدم',
            sellerAvatar: row.seller_avatar || '',
            createdAt: row.created_at,
            status: row.status === 'active' ? 'published' : row.status,
            postedBy: row.seller_id,
            views: row.views || 0,
            interest: extra.interest,
            whatsappClicks: extra.whatsappClicks,
            completedAt: extra.completedAt,
            completion_reason: extra.completion_reason,
            short_id: row.short_id || undefined,
          };
        });

        if (reset) {
          setAllTransportAds(transportMapped);
        } else {
          setAllTransportAds(prev => {
            const combined = [...prev, ...transportMapped];
            return combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
          });
        }
        transportPageRef.current = pageToFetch;
        if (count !== null) {
          setTotalTransportCount(count);
        }
        setHasMoreTransport(transportData.length === pageSize);
      }
    } catch (e) {
      console.error('Error fetching transport ads:', e);
    } finally {
      setLoadingTransport(false);
    }
  }, []);

  const fetchAds = useCallback(async (reset = true) => {
    if (reset) {
      if (!isFirstLoadDone.current) {
        setIsInitialLoading(true);
      }
      setLoadingMoreAds(true);
    } else {
      setLoadingMoreAds(true);
    }
    try {
      const pageToFetch = reset ? 0 : adsPage + 1;
      const pageSize = 20;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('ads').select('*', { count: 'exact' }).eq('is_demo', false).neq('category', 'transport').neq('category', 'notification').neq('status', 'sold');

      if (cat && cat !== 'all' && cat !== 'general') {
        query = query.eq('category', cat);
      }
      if (gov && gov !== 'الكل' && cat !== 'general') {
        query = query.eq('city', gov);
      }
      if (search && cat !== 'general') {
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},location.ilike.${term},short_id.ilike.${term}`);
      }
      if (priceMin && cat !== 'general') {
        const minVal = parseInt(priceMin.replace(/,/g, ''));
        if (!isNaN(minVal)) query = query.gte('price', minVal);
      }
      if (priceMax && cat !== 'general') {
        const maxVal = parseInt(priceMax.replace(/,/g, ''));
        if (!isNaN(maxVal)) query = query.lte('price', maxVal);
      }

      if (cat === 'general') {
        query = query.order('views', { ascending: false }).order('created_at', { ascending: false });
      } else {
        if (sort === 'views') {
          query = query.order('views', { ascending: false });
        } else if (sort === 'price-low') {
          query = query.order('price', { ascending: true });
        } else if (sort === 'price-high') {
          query = query.order('price', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) { console.error('Error fetching ads:', error); return; }
      if (count !== null) setTotalAdsCount(count);
      if (data) {
        // Map normal ads
        const normalRows = data.filter((row: any) => row.category !== 'transport' && row.category !== 'notification');
        const normalMapped: Ad[] = normalRows.map((row: any) => {
          const titleAndDesc = `${row.title || ''} ${row.description || ''}`.toLowerCase();
          const isUsed = titleAndDesc.includes('مستعمل') || titleAndDesc.includes('مستعملة') || titleAndDesc.includes('مستخدم') || titleAndDesc.includes('بالة') || titleAndDesc.includes('ثاني يد') || titleAndDesc.includes('مستعمله');
          const isNew = titleAndDesc.includes('جديد') || titleAndDesc.includes('جديدة') || titleAndDesc.includes('كارتون') || titleAndDesc.includes('بالكارتون') || titleAndDesc.includes('غير مستخدم') || titleAndDesc.includes('جديده') || titleAndDesc.includes('حديثة') || titleAndDesc.includes('زيرو');
          const inferredCondition: 'new' | 'used' = isNew && !isUsed ? 'new' : 'used';
          const condition: 'new' | 'used' = row.condition || inferredCondition;

          return {
            id: row.id,
            title: row.title,
            price: row.price,
            governorate: row.city || '',
            location: row.location || '',
            phone: row.phone || '',
            category: row.category,
            images: row.images || [],
            seller: {
              name: row.seller_name || 'مستخدم',
              avatar: row.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
              isVerified: false,
              rating: row.seller_rating || 4.8,
              joinedDate: row.created_at,
              location: row.city || '',
            },
            time: '',
            createdAtISO: row.created_at,
            views: row.views || 0,
            status: row.status,
            type: row.type || 'sell',
            condition,
            description: row.description || '',
            adCount: 0,
            soldCount: 0,
            responseRate: 100,
            avgResponseTime: 'دقائق',
            postedBy: row.seller_id,
            short_id: row.short_id,
            is_vip: row.is_vip || false,
            vip_days: row.vip_days || 30,
          };
        });

        const activeMapped = normalMapped.filter(a => a.status === 'active' || a.status === 'sold');
        
        if (reset) {
          setAllAds(activeMapped);
          setAdsPage(0);
          setHasMoreAds(data.length === pageSize);
        } else {
          setAllAds(prev => {
            const combined = [...prev, ...activeMapped];
            const unique = combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
            return unique;
          });

          setAdsPage(pageToFetch);
          setHasMoreAds(data.length === pageSize);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFirstLoadDone.current = true;
      setIsInitialLoading(false);
      setLoadingMoreAds(false);
      setLoadingTransport(false);
    }
  }, [adsPage, search, cat, gov, sort, priceMin, priceMax]);

  const handleDeleteProfile = async (profileId: string) => {
    // Try to delete using the admin RPC first
    const { error: rpcError } = await supabase.rpc('admin_delete_user', { target_user_id: profileId });
    
    if (rpcError) {
      // Fallback to client-side deletion if RPC fails or doesn't exist yet
      await supabase.from('ads').delete().eq('seller_id', profileId);
      await supabase.from('products').delete().eq('seller_id', profileId);
      await supabase.from('ads').delete().eq('postedBy', profileId).eq('category', 'transport');
      await supabase.from('profiles').delete().eq('id', profileId);
    }

    setAllAds(prev => prev.filter(a => a.postedBy !== profileId));
    setAllTransportAds(prev => prev.filter(a => a.postedBy !== profileId));
    setAllProducts(prev => prev.filter(p => p.postedBy !== profileId));

    try {
      const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const filtered = users.filter((u: any) => u.id !== profileId);
      localStorage.setItem('souqUsers', JSON.stringify(filtered));
    } catch (e) {}

    // Only redirect and logout if the current user deletes their own account
    if (user?.id === profileId) {
      showToast('تم حذف حسابك وجميع محتوياته بنجاح', 'success');
      setView('home');
      handleLogout();
    } else {
      showToast('تم حذف الحساب ومحتوياته نهائياً', 'success');
    }
  };

  const fetchProducts = useCallback(async (reset = true) => {
    if (reset) {
      if (!isFirstLoadDone.current) {
        setIsInitialLoading(true);
      }
      setLoadingMoreProducts(true);
    } else {
      setLoadingMoreProducts(true);
    }
    try {
      const pageToFetch = reset ? 0 : productsPage + 1;
      const pageSize = 4;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('products').select('*', { count: 'exact' }).neq('status', 'sold');

      if (cat && cat !== 'all' && cat !== 'general') {
        query = query.eq('category', cat);
      }
      if (gov && gov !== 'الكل') {
        query = query.eq('governorate', gov);
      }
      if (search) {
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term},short_id.ilike.${term}`);
      }
      if (priceMin) {
        const minVal = parseInt(priceMin.replace(/,/g, ''));
        if (!isNaN(minVal)) query = query.gte('price', minVal);
      }
      if (priceMax) {
        const maxVal = parseInt(priceMax.replace(/,/g, ''));
        if (!isNaN(maxVal)) query = query.lte('price', maxVal);
      }

      if (sort === 'views') {
        query = query.order('views', { ascending: false });
      } else if (sort === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price-high') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) { console.error('Error fetching products:', error); return; }
      if (count !== null) setTotalProductsCount(count);
      if (data) {
        const mapped: Product[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          price: row.price,
          description: row.description || '',
          category: row.category,
          images: row.images || [],
          governorate: row.governorate || row.city || '',
          phone: row.phone || '',
          condition: row.condition || 'used',
          seller: {
            name: row.seller_name || 'مستخدم',
            avatar: row.seller_avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
            isVerified: false,
            rating: 4.8,
            joinedDate: row.created_at,
            location: row.governorate || '',
          },
          createdAtISO: row.created_at,
          views: row.views || 0,
          postedBy: row.seller_id,
          stock: row.stock || 1,
          status: row.status || 'active',
          short_id: row.short_id,
          is_vip: row.is_vip || false,
          vip_days: row.vip_days || 30,
        }));
        
        if (reset) {
          setAllProducts(mapped);
          setProductsPage(0);
          setHasMoreProducts(data.length === pageSize);
        } else {
          setAllProducts(prev => {
            const combined = [...prev, ...mapped];
            const unique = combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);
            return unique;
          });
          setProductsPage(pageToFetch);
          setHasMoreProducts(data.length === pageSize);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFirstLoadDone.current = true;
      setIsInitialLoading(false);
      setLoadingMoreProducts(false);
    }
  }, [productsPage, search, cat, gov, sort, priceMin, priceMax]);


  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      // Only fetch admin/system notifications to reduce load
      const { data: userNotifs, error: userNotifsError } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .limit(10);

      let combined: any[] = [];
      if (!userNotifsError && userNotifs) {
        userNotifs.forEach((row: any) => {
          // Filter out the old view/interest notifications so they don't show up anymore
          if (row.type === 'view' || row.type === 'interest' || (row.title && row.title.includes('مشاهدة'))) {
            return;
          }
          
          combined.push({
            id: row.id,
            type: row.type || 'system',
            title: row.title,
            message: row.body,
            time: row.created_at,
            senderId: '',
            senderName: 'إدارة الموقع',
            senderPhone: '',
            itemTitle: '',
            itemType: 'ad',
            itemId: '',
            duration: 0,
            targetType: 'owner',
            sourceTable: 'user_notifications'
          });
        });
      }
      
      combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(combined);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [user]);

  // هذا useEffect يعمل عند تسجيل الدخول أو الخروج.
  // يجلب الإشعارات ويفعّل Polling كل 45 ثانية بدلاً من Realtime (لتوفير الباقة).
  // ✅ آمن: يتم إيقاف الـ Interval في الـ cleanup.
  // 🔥 استهلاك Supabase: استعلام كل 45 ثانية ما دام المستخدم مسجلاً.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    // Use polling instead of Realtime to avoid hitting Supabase free tier connection limits (200 connections)
    // and to prevent the red WebSocket connection errors in the console. Only poll if page is visible to save egress bandwidth.
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 90000); // 90 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [user, fetchNotifications]);

  const prevNotifsLength = useRef(0);
  // هذا useEffect يعمل عند تغيير قائمة الإشعارات.
  // يُشغّل صوت تنبيه عند وصول إشعار جديد.
  // آمن للتعديل: نعم، يمكن تغيير الصوت أو تعطيله.
  useEffect(() => {
    if (notifications.length > prevNotifsLength.current) {
      if (prevNotifsLength.current > 0) {
        const hasNewIncoming = notifications.some(n => n.targetType === 'owner' || !n.targetType);
        if (hasNewIncoming) {
          playSound('admin');
          if (Capacitor.isNativePlatform()) {
            const newest = notifications[0];
            LocalNotifications.schedule({
              notifications: [
                {
                  title: newest?.title || 'سوك بغداد',
                  body: newest?.message || 'لديك إشعار جديد!',
                  id: new Date().getTime(),
                  sound: 'default'
                }
              ]
            }).catch(console.warn);
          }
        }
      }
    }
    prevNotifsLength.current = notifications.length;
  }, [notifications]);

  const handleHistoryClick = (itemId: string | number, itemType: string) => {
    if (itemType === 'ad') {
      const found = allAds.find(a => String(a.id) === String(itemId));
      if (found) setSelectedAd(found);
    } else if (itemType === 'product') {
      const found = allProducts.find(p => String(p.id) === String(itemId));
      if (found) setSelectedProduct(found);
    } else if (itemType === 'transport') {
      const found = allTransportAds.find(t => String(t.id) === String(itemId));
      if (found) setSelectedTransportAd(found);
    }
  };

  const markNotifAsRead = async (notifId: number | string, sourceTable: 'ads' | 'user_notifications' = 'ads') => {
    try {
      if (sourceTable === 'user_notifications') {
        const { error } = await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('id', notifId);
        if (!error) {
          setNotifications(prev => prev.filter(n => n.id !== notifId));
        }
      } else {
        const { error } = await supabase
          .from('ads')
          .update({ status: 'archived' })
          .eq('id', notifId);
        if (!error) {
          setNotifications(prev => prev.filter(n => n.id !== notifId));
        }
      }
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleArchiveAllNotifications = async () => {
    if (!user) return;
    try {
      await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('category', 'notification')
        .eq('seller_id', user.id)
        .eq('status', 'active');

      await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications([]);
    } catch (e) {
      console.error('Failed to archive all notifications', e);
    }
  };

  const handleViewDurationLogged = async (itemId: number | string, itemTitle: string, ownerId: string, itemType: string, seconds: number) => {
    // Disabled to stop heavy DB bandwidth usage and save egress costs
    return;
  };


  // هذا useEffect يعمل عند كل تغيير في قائمة المفضلة.
  // يحفظ المفضلة في LocalStorage فوراً. لا يستهلك Supabase.
  // هذا useEffect يعمل عند كل تغيير في قائمة المفضلة.
  // يحفظ المفضلة في LocalStorage. لا يستهلك Supabase.
  useEffect(()=>{localStorage.setItem('souqFavs',JSON.stringify(favorites));},[favorites]);

  // هذا useEffect يعمل عند الانتقال لصفحة النقل أو الملف الشخصي.
  // استعلام Supabase — يُنفَّذ فقط عند تغيير view.
  useEffect(() => {
    if (view === 'transport' || view === 'profile') {
      fetchTransportAds();
    }
  }, [view, fetchTransportAds]);

  // هذا useEffect يعمل عند تغيير view.
  // يحدث الشريط السفلي للتنقل. لا يستهلك Supabase. آمن للتعديل.
  useEffect(() => {
    if (['home', 'profile', 'transport'].includes(view)) {
      setBottomNavActive(view);
    }
  }, [view]);

  // هذا useEffect يعمل عند تغيير أي فلتر بحث.
  // يطبّق Debounce بمقدار 450ms لمنع إرسال طلبات Supabase عند كل حرف.
  // ✅ آمن: يتم إلغاء الـ Timeout في الـ cleanup.
  // 🔥 استعلام Supabase — يُجلب كل مرة تتغير فيها الفلاتر.
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (view === 'home' || view === 'products' || view === 'transport' || view === 'profile') {
        fetchAds(true);
        fetchProducts(true);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search, cat, gov, sort, priceMin, priceMax, view]);

  // هذا useEffect يعمل عند تغيير بيانات المستخدم.
  // يحفظ بيانات المستخدم مع عدد إعلاناته في LocalStorage. لا يستهلك Supabase.
  useEffect(()=>{
    if(user){const mc=allAds.filter(a=>a.postedBy===user.id).length+allProducts.filter(p=>p.postedBy===user.id).length;saveStoredUser(user,mc);}
  },[user]);

  // هذا useEffect يعمل مرة واحدة عند تغيير user.
  // يتحقق من حالة الحظر (Ban) للمستخدم أو الجهاز، ويحدث last_seen.
  // 🔥 استعلام Supabase — مرة واحدة عند تغيير user.
  // ملاحظة: الـ Interval كان يعمل كل دقيقتين لكن تم تعطيله لتوفير الباقة.
  // Track online status and guests
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const trackActivity = async () => {
      try {
        if (user) {
          const { data } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single();
          if (data?.is_banned) {
            await supabase.auth.signOut();
            document.body.innerHTML = '<div style="padding: 3rem; text-align: center; color: red; font-size: 1.5rem; font-weight: bold;">عذراً، هذا الحساب محظور من تصفح الموقع لانتهاكه الشروط.</div>';
            return;
          }
          await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
        } else {
          let deviceId = localStorage.getItem('souqGuestId');
          if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('souqGuestId', deviceId);
          }
          const { data } = await supabase.from('guests').select('is_banned').eq('id', deviceId).single();
          if (data?.is_banned) {
            document.body.innerHTML = '<div style="padding: 3rem; text-align: center; color: red; font-size: 1.5rem; font-weight: bold;">عذراً، هذا الجهاز محظور من تصفح الموقع لانتهاكه الشروط.</div>';
            return;
          }
          await supabase.from('guests').upsert({ id: deviceId, last_seen: new Date().toISOString(), user_agent: navigator.userAgent });
        }
      } catch (e) {
        // silently fail tracking errors
      }
    };

    trackActivity();
    // Disabled interval to reduce heavy background data usage
    // interval = setInterval(trackActivity, 2 * 60 * 1000); 
    // return () => clearInterval(interval);
  }, [user]);

  const showToast = useCallback((msg:string,type:string)=>{
    setToast({msg,type,visible:true});
    if (type === 'success') {
      playSound('success');
    } else if (type === 'delete') {
      playSound('delete');
    } else if (type === 'admin') {
      playSound('admin');
    } else {
      playSound('info');
    }
    setTimeout(()=>setToast(t=>({...t,visible:false})),4000);
  },[]);

  const handleLogin = (u:User)=>{
    setUser(u); setShowAuth(false); showToast(`مرحباً ${u.name}! 🎉`,'success');
    if(!localStorage.getItem('souqOnboarded'))setShowOnboarding(true);
    recordVisit(u);
  };
  const handleLogout = async ()=>{
    await supabase.auth.signOut();
    localStorage.removeItem('souqUser');
    setUser(null);
    setView('home');
    showToast('تم تسجيل الخروج', 'info');
  };
  const handleUpdateUser = async (u:User, quiet: boolean = false)=>{
    setUser(u);
    localStorage.setItem('souqUser', JSON.stringify(u));
    saveStoredUser(u, allAds.filter(a=>a.postedBy===u.id).length);
    if (!quiet) {
      localStorage.removeItem('souq_cached_profiles');
      localStorage.removeItem('souq_cached_profiles_time');
      await supabase.from('profiles').upsert({
        id: u.id,
        full_name: u.name,
        email: u.email,
        phone: u.phone,
        avatar_url: u.avatar,
        cover_url: u.cover,
        city: u.location,
        role: u.role
      }, { onConflict: 'id' });
      showToast('تم حفظ الملف الشخصي ✅', 'success');
    }
  };
  const handleToggleFav = (id:number)=>{setFavorites(prev=>{const f=prev.includes(id);showToast(f?'تمت الإزالة من المفضلة':'تمت الإضافة للمفضلة','success');return f?prev.filter(x=>x!==id):[...prev,id];});};
  const requireAuth = ()=>setShowAuth(true);

  const handleAddOrEditAd = async (ad: Ad) => {
    if (!editingAd) {
      if (!checkPostRateLimit()) return;
    }
    const rowData = {
      seller_id: user?.id || '',
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category: ad.category,
      location: ad.location,
      city: ad.governorate,
      images: ad.images,
      phone: ad.phone,
      type: ad.type,
      status: 'active',
      is_demo: false,
      is_vip: ad.is_vip || false,
      vip_days: ad.vip_days || 30,
      seller_name: user?.name,
      seller_avatar: user?.avatar,
    };
    if (editingAd) {
      const { error } = await supabase.from('ads').update(rowData).eq('id', ad.id);
      if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
      setEditingAd(null);
      showToast('تم تعديل الإعلان ✅', 'success');
    } else {
      // Deduct points before publishing
      let cost = adCosts.ad !== undefined ? adCosts.ad : 1;
      if (ad.is_vip) {
        cost += Math.ceil(((adCosts.vip_ad !== undefined ? adCosts.vip_ad : 30) / 30) * (ad.vip_days || 30));
      }
      if (user?.role !== 'admin' && user?.role !== 'owner' && cost > 0) {
        const { data: deductData, error: deductError } = await supabase.rpc('deduct_points', {
          p_user_id: user?.id,
          p_amount: cost,
          p_reason: 'خصم لنشر إعلان مبوب'
        });
        
        if (deductError || !deductData?.success) {
          showToast(deductData?.message || 'رصيد النقاط غير كافٍ لنشر إعلان. يرجى شحن المحفظة.', 'error');
          return;
        }
        
        // Update local points
        if (user && deductData.remaining !== undefined) {
          setUser(prev => {
            if (!prev) return prev;
            const u = { ...prev, points: deductData.remaining };
            localStorage.setItem('souqUser', JSON.stringify(u));
            return u;
          });
        }
      }

      const { data, error } = await supabase.from('ads').insert(rowData).select().single();
      triggerOnlineStatusesSync();
      if (error) { showToast('حدث خطأ أثناء النشر', 'error'); console.error(error); return; }
      if (user && data) {
        setUser(prev => {
          if (!prev) return prev;
          const u = { ...prev, stats: { ...prev.stats, ads: prev.stats.ads + 1 } };
          localStorage.setItem('souqUser', JSON.stringify(u));
          return u;
        });
      }
      showToast('تم نشر إعلانك! 🎉', 'success');
    }
    fetchAds();
  };

  const handlePostTransportAd = async (ad: TransportAd) => {
    if (!checkPostRateLimit()) return;
    const rowData = {
      seller_id: user?.id || ad.postedBy || '',
      title: ad.type === 'offer' ? `أوفر خط إلى ${ad.university}` : `أبحث عن خط إلى ${ad.university}`,
      description: JSON.stringify({
        shift: ad.shift,
        seats: ad.seats,
        vehicleType: ad.vehicleType,
        targetAudience: ad.targetAudience,
        categoryType: ad.categoryType || 'student',
        note: ad.note,
        interest: ad.interest || 0,
        whatsappClicks: ad.whatsappClicks || 0,
        completedAt: ad.completedAt,
        completion_reason: ad.completion_reason
      }),
      price: ad.price ? ad.price.replace(/[^0-9]/g, '') : '0',
      category: 'transport',
      location: ad.regions,
      city: ad.university,
      images: [],
      phone: ad.phone,
      type: ad.type,
      status: ad.status === 'published' ? 'active' : ad.status,
      is_demo: false,
      seller_name: ad.sellerName || user?.name || 'مستخدم',
      seller_avatar: ad.sellerAvatar || user?.avatar || '',
      short_id: ad.short_id || Math.random().toString(36).substring(2, 7).toUpperCase(),
    };

    // Deduct points before publishing
    const cost = adCosts.transport !== undefined ? adCosts.transport : 1;
    if (user?.role !== 'admin' && user?.role !== 'owner' && cost > 0) {
      const { data: deductData, error: deductError } = await supabase.rpc('deduct_points', {
        p_user_id: user?.id,
        p_amount: cost,
        p_reason: 'خصم لنشر خط نقل'
      });
      
      if (deductError || !deductData?.success) {
        showToast(deductData?.message || 'رصيد النقاط غير كافٍ. يرجى شحن المحفظة.', 'error');
        return;
      }
      
      // Update local points
      if (user && deductData.remaining !== undefined) {
        setUser(prev => {
          if (!prev) return prev;
          const u = { ...prev, points: deductData.remaining };
          localStorage.setItem('souqUser', JSON.stringify(u));
          return u;
        });
      }
    }

    const { error } = await supabase.from('ads').insert(rowData);
    if (error) {
      showToast('حدث خطأ أثناء حفظ الخط', 'error');
      console.error(error);
      return;
    }
    
    // Alert matching logic
    try {
      const { data: alerts, error: alertError } = await supabase
        .from('subscription_alerts')
        .select('*');
        
      if (!alertError && alerts && alerts.length > 0) {
        const matches = alerts.filter(alert => {
          if (alert.user_id === rowData.seller_id) return false;
          
          const alertCat = alert.category_type;
          const adCat = ad.categoryType || 'student';
          if (alertCat && alertCat !== 'all' && alertCat !== adCat) return false;
          
          if (alert.university && alert.university.trim() !== '') {
            const alertUnivNorm = alert.university.trim().toLowerCase();
            const adUnivNorm = ad.university.trim().toLowerCase();
            if (!adUnivNorm.includes(alertUnivNorm) && !alertUnivNorm.includes(adUnivNorm)) {
              return false;
            }
          }
          
          if (alert.regions && alert.regions.trim() !== '') {
            const alertRegs = alert.regions.split(/[،,,\-]/).map((r: string) => r.trim().toLowerCase()).filter(Boolean);
            const adRegs = ad.regions.split(/[،,,\-]/).map((r: string) => r.trim().toLowerCase()).filter(Boolean);
            const hasOverlap = alertRegs.some((ar: string) => adRegs.some((adr: string) => adr.includes(ar) || ar.includes(adr)));
            if (!hasOverlap) return false;
          }
          
          if (alert.type && alert.type !== 'all' && alert.type !== ad.type) return false;
          
          return true;
        });

        if (matches.length > 0) {
          const notifsToInsert = matches.map(match => ({
            user_id: match.user_id,
            title: ad.categoryType === 'emergency' ? '🚗 رحلة طوارئ يومية مطابقة!' : '🔔 خط نقل جديد يطابق بحثك!',
            body: ad.categoryType === 'emergency'
              ? `تم نشر رحلة طوارئ يومية من مناطق (${ad.regions}) إلى (${ad.university}) بسعر ${ad.price || 'غير محدد'}. تواصل الآن!`
              : `تم نشر خط نقل جديد من مناطق (${ad.regions}) إلى (${ad.university}) بسعر ${ad.price || 'غير محدد'}. تواصل الآن!`,
            type: 'transport_alert',
            read: false,
            created_at: new Date().toISOString()
          }));
          
          await supabase.from('user_notifications').insert(notifsToInsert);
        }
      }
    } catch (e) {
      console.error("Error matching alert notifications:", e);
    }

    showToast('تم نشر الخط بنجاح ✅', 'success');
    fetchAds();
  };

  const handleUpdateTransportStatus = async (id: number, status: string, reason: string | null = null) => {
    const ad = allTransportAds.find(a => a.id === id);
    if (!ad) return;

    const newStatus = status === 'published' ? 'active' : status;
    const dbStatus = newStatus;

    const descriptionData = JSON.stringify({
      shift: ad.shift,
      seats: ad.seats,
      vehicleType: ad.vehicleType,
      targetAudience: ad.targetAudience,
      note: ad.note,
      interest: ad.interest || 0,
      whatsappClicks: ad.whatsappClicks || 0,
      completedAt: status === 'matched' ? new Date().toISOString() : ad.completedAt,
      completion_reason: reason
    });

    const { error } = await supabase
      .from('ads')
      .update({
        status: dbStatus,
        description: descriptionData
      })
      .eq('id', id);

    if (error) {
      showToast('حدث خطأ أثناء تحديث حالة الخط', 'error');
      console.error(error);
      return;
    }
    showToast('تم تحديث حالة الخط بنجاح ✅', 'success');
    fetchAds();
  };

  const handleDeleteTransportAd = async (id: number) => {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('حدث خطأ أثناء حذف الخط', 'error');
      console.error(error);
      return;
    }
    showToast('تم حذف الخط بنجاح', 'delete');
    fetchAds();
  };

  const handleAddOrEditProduct = async (p: Product) => {
    if (!editingProduct) {
      if (!checkPostRateLimit()) return;
    }
    const rowData = {
      seller_id: user?.id || '',
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      governorate: p.governorate,
      phone: p.phone,
      images: p.images,
      condition: p.condition,
      stock: p.stock,
      is_vip: p.is_vip || false,
      vip_days: p.vip_days || 30,
      seller_name: user?.name,
      seller_avatar: user?.avatar,
    };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(rowData).eq('id', p.id);
      if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
      setEditingProduct(null);
      showToast('تم تعديل المنتج ✅', 'success');
    } else {
      // Deduct points before publishing
      let cost = adCosts.product !== undefined ? adCosts.product : 1;
      if (p.is_vip) {
        cost += Math.ceil(((adCosts.vip_ad !== undefined ? adCosts.vip_ad : 30) / 30) * (p.vip_days || 30));
      }
      if (user?.role !== 'admin' && user?.role !== 'owner' && cost > 0) {
        const { data: deductData, error: deductError } = await supabase.rpc('deduct_points', {
          p_user_id: user?.id,
          p_amount: cost,
          p_reason: 'خصم لنشر منتج'
        });
        
        if (deductError || !deductData?.success) {
          showToast(deductData?.message || 'رصيد النقاط غير كافٍ لنشر منتج. يرجى شحن المحفظة.', 'error');
          return;
        }
        
        // Update local points
        if (user && deductData.remaining !== undefined) {
          setUser(prev => {
            if (!prev) return prev;
            const u = { ...prev, points: deductData.remaining };
            localStorage.setItem('souqUser', JSON.stringify(u));
            return u;
          });
        }
      }

      const { error } = await supabase.from('products').insert(rowData);
      if (error) { showToast('حدث خطأ أثناء النشر', 'error'); console.error(error); return; }
      showToast('تم نشر المنتج في متجرك! 🛍️', 'success');
    }
    fetchProducts();
  };

  const handleMarkAdSold = async (ad: Ad) => {
    if (!window.confirm('هل تريد وضع علامة "تم البيع" على هذا الإعلان؟ سيختفي من المعرض العام ويُحفظ في الأرشيف.')) return;
    const { error } = await supabase.from('ads').update({ status: 'sold' }).eq('id', ad.id);
    if (error) {
      showToast('حدث خطأ أثناء تحديث الحالة', 'error');
      console.error(error);
      return;
    }
    setAllAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'sold' } : a));
    playSound('success');
    setCongratulationsItem({ title: ad.title, type: 'ad' });
    fetchAds();
  };

  const handleMarkProductSold = async (p: Product) => {
    if (!window.confirm('هل تريد وضع علامة "تم البيع" على هذا المنتج؟ سيختفي من المعرض العام ويُحفظ في الأرشيف.')) return;
    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', p.id);
    if (error) {
      showToast('حدث خطأ أثناء تحديث الحالة', 'error');
      console.error(error);
      return;
    }
    setAllProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, status: 'sold' } : pr));
    playSound('success');
    setCongratulationsItem({ title: p.title, type: 'product' });
    fetchProducts();
  };

  const handleDeleteAd = async (id: number) => {
    await supabase.from('ads').delete().eq('id', id);
    setAllAds(prev => prev.filter(a => a.id !== id));
    showToast('تم حذف الإعلان', 'delete');
  };

  const handleDeleteProduct = async (id: number) => {
    await supabase.from('products').delete().eq('id', id);
    setAllProducts(prev => prev.filter(p => p.id !== id));
    showToast('تم حذف المنتج', 'delete');
  };

  
  const [previousSellerSource, setPreviousSellerSource] = useState<'home'|'accounts'>('home');
  const handleSellerClick = (sellerId:string, source: 'home'|'accounts' = 'home') => {
    if(sellerId) {
      setPreviousSellerSource(source);
      setSelectedSellerId(sellerId);
      setView('seller');
      if (typeof window !== 'undefined') window.location.hash = `#/seller/${sellerId}`;
    }
  };

  const myAds = allAds.filter(a=>a.postedBy===user?.id);
  const handlePwaInstall = () => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|mercury/i.test(ua);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    if (standalone) {
      alert("التطبيق مثبت بالفعل ويعمل حالياً.");
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else if (isIOS) {
      if (isSafari) {
        setShowInstallGuide('safari');
      } else {
        setShowInstallGuide('ios-other');
      }
    } else {
      setShowInstallGuide('android-fallback');
    }
  };

  const handleInstallClick = () => {
    setShowInstallOptions(true);
  };

  const myProducts = allProducts.filter(p=>p.postedBy===user?.id);
  const isAdmin = user?.role==='admin';
  const isOwner = user?.role==='owner';

  // Dynamic SEO metadata based on current router state
  let pageTitle = "سوق بغداد - السوق الرقمي العراقي | أكبر منصة إعلانات في العراق";
  let pageDescription = "سوق بغداد - أكبر منصة عراقية للبيع والشراء والإعلانات. سيارات، عقارات، هواتف، إلكترونيات، خدمات والمزيد. اكتشف آلاف الإعلانات في أقسام متعددة.";
  let pageImage = "https://souqbaghdad.store/opengraph.jpg";
  let canonicalUrl = "https://souqbaghdad.store/";

  if (selectedAd) {
    const slugify = (text: string) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
        .replace(/--+/g, '-');
    };
    const typeText = selectedAd.type === 'buy' ? 'شراء' : selectedAd.type === 'rent' ? 'ايجار' : selectedAd.type === 'service' ? 'خدمات' : 'بيع';
    const categoryText = selectedAd.category || 'عام';
    const titleText = selectedAd.title || 'اعلان';
    const govText = selectedAd.governorate || selectedAd.location || 'العراق';
    const slug = `${slugify(typeText)}-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;

    pageTitle = `${selectedAd.title} - ${govText} | ${formatPrice(selectedAd.price)} د.ع - سوق بغداد`;
    pageDescription = `${selectedAd.description ? selectedAd.description.slice(0, 150) + '...' : 'تفاصيل الإعلان'} | سوق بغداد - أكبر منصة عراقية للبيع والشراء والإعلانات. سيارات، عقارات، هواتف، إلكترونيات، خدمات والمزيد.`;
    pageImage = selectedAd.images?.[0] || pageImage;
    canonicalUrl = `https://souqbaghdad.store/ad/${slug}-${selectedAd.short_id || selectedAd.id}`;
  } else if (selectedProduct) {
    const slugify = (text: string) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
        .replace(/--+/g, '-');
    };
    const categoryText = selectedProduct.category || 'منتجات';
    const titleText = selectedProduct.title || 'منتج';
    const govText = selectedProduct.governorate || 'العراق';
    const slug = `تسوق-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;

    pageTitle = `${selectedProduct.title} - ${govText} | ${formatPrice(selectedProduct.price)} د.ع - سوق بغداد`;
    pageDescription = `${selectedProduct.description ? selectedProduct.description.slice(0, 150) + '...' : 'تفاصيل المنتج'} | سوق بغداد - أكبر منصة عراقية للبيع والشراء والإعلانات. سيارات، عقارات، هواتف، إلكترونيات، خدمات والمزيد.`;
    pageImage = selectedProduct.images?.[0] || pageImage;
    canonicalUrl = `https://souqbaghdad.store/product/${slug}-${selectedProduct.short_id || selectedProduct.id}`;
  } else if (view === 'seller' && selectedSellerId) {
    pageTitle = `صفحة البائع | سوق بغداد`;
    pageDescription = `تصفح كافة الإعلانات والمنتجات المتوفرة لدى هذا المعلن في منصة سوق بغداد.`;
    canonicalUrl = `https://souqbaghdad.store/seller/${selectedSellerPhone || selectedSellerId}`;
  } else if (view === 'transport') {
    pageTitle = `خطوط النقل والتوصيل | سوق بغداد`;
    pageDescription = `تصفح خطوط النقل والتوصيل المتاحة في العراق - سوق بغداد`;
    canonicalUrl = `https://souqbaghdad.store/transport`;
  }

  if (isBiometricLocked) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <Helmet>
          <title>قفل التطبيق | سوك بغداد</title>
        </Helmet>
        <div className="w-24 h-24 bg-[#0052ff]/10 rounded-full flex items-center justify-center mb-6">
           {/* Add a Fingerprint icon or Lock icon (Lock imported above) */}
           <Lock className="w-12 h-12 text-[#0052ff] animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-2">تسجيل الدخول بالبصمة</h2>
        <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>يرجى تأكيد هويتك للوصول إلى التطبيق</p>
        <button 
          onClick={async () => {
             if (Capacitor.isNativePlatform()) {
                try {
                  const { isAvailable } = await BiometricAuth.checkBiometry();
                  if (isAvailable) {
                    await BiometricAuth.authenticate({
                      reason: "يرجى تأكيد هويتك للوصول إلى التطبيق",
                      androidTitle: "المصادقة بالبصمة",
                    });
                    setIsBiometricLocked(false);
                    sessionStorage.setItem('biometricUnlocked', 'true');
                  } else {
                    setIsBiometricLocked(false);
                  }
                } catch (e) {
                  // user cancelled or failed
                }
             } else {
                setIsBiometricLocked(false);
             }
          }}
          className="px-8 py-3 bg-[#0052ff] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors flex items-center gap-2 mb-4"
        >
           <Lock className="w-5 h-5" /> المحاولة مرة أخرى
        </button>
        <button 
          onClick={async () => {
             if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                await supabase.auth.signOut();
                localStorage.setItem('biometricEnabled', 'false');
                window.location.reload();
             }
          }}
          className="text-red-500 text-sm font-semibold hover:underline"
        >
          تسجيل الخروج
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pwa-outer-container transition-colors duration-300 ${isDarkMode ? 'dark bg-[black] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <LoadingScreen isLoading={isInitialLoading} />
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:image:secure_url" content={pageImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} onClose={()=>setToast(t=>({...t,visible:false}))}/>

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 pwa-header shadow-md ${isDarkMode ? 'bg-[black]/70 border-transparent shadow-[black]/10' : 'bg-white/80 border-slate-200/80 shadow-slate-100'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button onClick={()=>setView('home')} className="flex items-center gap-2">
              <Logo small/>
              <span className={`font-bold text-sm sm:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>سوك بغداد</span>
            </button>
            <div className="hidden md:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input placeholder="ابحث في سوك بغداد..." onClick={()=>setView('home')} readOnly className={`w-full rounded-xl py-2 pr-9 pl-4 border outline-none text-sm cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700' : 'bg-slate-100 text-slate-800 placeholder-slate-400 border-slate-200'}`}/>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowThemeMenu(!showThemeMenu)} 
                  className={`p-2 rounded-xl border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                  title="تغيير المظهر"
                  aria-label="تغيير المظهر"
                >
                  {themeMode === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : themeMode === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Monitor className="w-5 h-5 text-purple-400" />}
                </button>
                {showThemeMenu && (
                  <div className={`absolute left-0 mt-2 w-32 rounded-xl shadow-xl border p-1 z-50 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' : 'bg-white border-slate-100 text-slate-800 shadow-slate-100'}`}>
                    <button onClick={() => changeThemeMode('light')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${themeMode === 'light' ? 'text-amber-500 bg-amber-500/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                      <Sun className="w-4 h-4" /> فاتح
                    </button>
                    <button onClick={() => changeThemeMode('dark')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${themeMode === 'dark' ? 'text-blue-400 bg-blue-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                      <Moon className="w-4 h-4" /> داكن
                    </button>
                    <button onClick={() => changeThemeMode('system')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${themeMode === 'system' ? 'text-purple-400 bg-purple-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                      <Monitor className="w-4 h-4" /> تلقائي
                    </button>
                  </div>
                )}
              </div>
              {user?(
                <>
                  <button onClick={()=>setShowNotifs(true)} className={`p-2 rounded-xl relative transition-colors ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} title="الإشعارات" aria-label="الإشعارات">
                    <Bell className="w-5 h-5"/>
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => { setView('profile'); window.location.hash = '#/profile/wallet'; setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-wallet-tab')), 50); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700 hover:border-amber-500/50' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-amber-500/50'}`} title="محفظتي">
                    <Wallet className="w-4 h-4 text-emerald-400"/>
                    <span className="font-bold font-mono">{user.points || 0}</span>
                  </button>
                  {isOwner&&<button onClick={()=>setView('owner')} className={`p-2 rounded-xl text-amber-400 hover:bg-amber-500/20 ${view==='owner'?'bg-amber-500/20':''}`} title="لوحة المالك" aria-label="لوحة المالك"><Crown className="w-5 h-5"/></button>}
                  {isAdmin&&!isOwner&&<button onClick={()=>setView('admin')} className={`p-2 rounded-xl text-red-400 hover:bg-red-500/20 ${view==='admin'?'bg-red-500/20':''}`} title="لوحة الإدارة" aria-label="لوحة الإدارة"><Settings className="w-5 h-5"/></button>}
                  <button onClick={()=>{setShowCreateProduct(true);setEditingProduct(null);}}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700">
                    <ShoppingBag className="w-4 h-4"/> منتج</button>
                  <button onClick={() => window.location.hash = '#/profile'} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':(isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200')}`}>
                    <img src={user.avatar} alt="" className={`w-6 h-6 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-600'}`}/>
                    <span className="max-w-20 truncate">{user.name}</span>{isOwner&&<Crown className="w-3 h-3 text-amber-400"/>}</button>
                  <button onClick={handleLogout} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20" title="تسجيل الخروج" aria-label="تسجيل الخروج"><LogOut className="w-5 h-5"/></button>
                </>
              ):(
                <>
                  <button onClick={()=>setShowAuth(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white font-bold rounded-xl text-sm hover:bg-gray-700"><LogIn className="w-4 h-4"/> تسجيل الدخول</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 lg:hidden">
              <div className="relative">
                <button 
                  onClick={() => setShowThemeMenu(!showThemeMenu)} 
                  className="p-1.5 rounded-xl bg-gray-800 text-white hover:bg-gray-700"
                  title="تغيير المظهر"
                  aria-label="تغيير المظهر"
                >
                  {themeMode === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : themeMode === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Monitor className="w-4 h-4 text-purple-400" />}
                </button>
                {showThemeMenu && (
                  <div className={`absolute left-0 mt-2 w-28 rounded-xl shadow-xl border p-1 z-50 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' : 'bg-white border-slate-100 text-slate-800 shadow-slate-100'}`}>
                    <button onClick={() => changeThemeMode('light')} className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${themeMode === 'light' ? 'text-amber-500 bg-amber-500/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                      <Sun className="w-3.5 h-3.5" /> فاتح
                    </button>
                    <button onClick={() => changeThemeMode('dark')} className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${themeMode === 'dark' ? 'text-blue-400 bg-blue-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                      <Moon className="w-3.5 h-3.5" /> داكن
                    </button>
                    <button onClick={() => changeThemeMode('system')} className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${themeMode === 'system' ? 'text-purple-400 bg-purple-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                      <Monitor className="w-3.5 h-3.5" /> تلقائي
                    </button>
                  </div>
                )}
              </div>
              {/* Dark mode toggle mobile */}
              {user ? (
                <>
                  <button onClick={() => { setView('profile'); window.location.hash = '#/profile/wallet'; setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-wallet-tab')), 50); }} className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 text-white rounded-xl text-xs border border-gray-700" title="محفظتي">
                    <Wallet className="w-3 h-3 text-emerald-400"/>
                    <span className="font-bold font-mono">{user.points || 0}</span>
                  </button>
                  <button onClick={() => window.location.hash = '#/profile'} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white'}`}>
                    <img src={user.avatar} alt="" className={`w-5.5 h-5.5 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-650'}`}/>
                    <span className="max-w-16 truncate hidden sm:block">{user.name}</span>
                  </button>
                </>
              ) : (
                <button onClick={()=>setShowAuth(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 text-white font-bold rounded-xl text-xs hover:bg-gray-700">
                  <LogIn className="w-3.5 h-3.5"/> <span>دخول</span>
                </button>
              )}
              <button onClick={()=>setShowNotifs(true)} className="p-1.5 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative" title="الإشعارات" aria-label="الإشعارات">
                <Bell className="w-4 h-4"/>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button onClick={()=>setShowMobileMenu(true)} className="p-1.5 rounded-xl bg-gray-800 text-white" title="القائمة" aria-label="القائمة"><Menu className="w-4.5 h-4.5"/></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Navigation Sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 fixed right-0 top-16 bottom-0 z-30 border-l transition-colors duration-300 text-right ${
        isDarkMode ? 'bg-[black]/95 border-gray-800/80 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`} dir="rtl">
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* User Profile Card */}
          {user ? (
            <div className={`p-3.5 rounded-2xl border transition-all ${
              isDarkMode ? 'bg-gray-800/40 border-gray-700/60' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className={`w-10 h-10 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-650'}`}/>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-sm truncate text-white">{user.name}</p>
                    {isOwner && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0"/>}
                  </div>
                  <button onClick={() => { setView('profile'); window.location.hash = '#/profile/wallet'; setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-wallet-tab')), 50); }} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-black flex items-center gap-1 mt-0.5 transition-colors cursor-pointer">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user.points || 0} نقطة (محفظتي)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer">
              <LogIn className="w-4.5 h-4.5"/> 
              <span>تسجيل الدخول</span>
            </button>
          )}

          {/* Core App Navigation */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider pr-3 mb-2">القائمة الرئيسية</p>
            
            <button onClick={() => { setView('home'); setBottomNavActive('home'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              view === 'home' 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Home className="w-4.5 h-4.5"/>
              <span>سوق بغداد الرئيسية</span>
            </button>

            <button onClick={() => { setView('products'); setBottomNavActive('products'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              view === 'products' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-650/25' 
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <ShoppingBag className="w-4.5 h-4.5"/>
              <span>المتجر الإلكتروني</span>
            </button>

            <button onClick={() => { setView('transport'); setBottomNavActive('transport'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              view === 'transport' 
                ? 'bg-gray-800 text-white' 
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Car className="w-4.5 h-4.5"/>
              <span>خطوط النقل والتوصيل</span>
            </button>

            {user && (
              <button onClick={() => { setView('profile'); setBottomNavActive('profile'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                view === 'profile' && !window.location.hash.includes('/wallet')
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' 
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }`}>
                <UserIcon className="w-4.5 h-4.5 text-gray-400"/>
                <span>صفحتي الشخصية</span>
              </button>
            )}

            {user && (
              <button onClick={() => { setBottomNavActive('profile'); setView('profile'); window.location.hash = '#/profile/wallet'; setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-wallet-tab')), 50); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                view === 'profile' && window.location.hash.includes('/wallet')
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }`}>
                <Wallet className="w-4.5 h-4.5 text-emerald-400"/>
                <span>محفظتي وإعادة الشحن</span>
              </button>
            )}

            {isOwner && (
              <button onClick={() => { setView('owner'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                view === 'owner' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }`}>
                <Crown className="w-4.5 h-4.5 text-amber-400"/>
                <span>لوحة تحكم المالك</span>
              </button>
            )}

            {isAdmin && !isOwner && (
              <button onClick={() => { setView('admin'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                view === 'admin' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }`}>
                <Settings className="w-4.5 h-4.5 text-red-400"/>
                <span>لوحة تحكم الإدارة</span>
              </button>
            )}
          </div>

          <hr className={isDarkMode ? 'border-gray-800/60' : 'border-slate-100'} />

          {/* Info and Policy Links inside Sidebar */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider pr-3 mb-2">معلومات وسياسات المنصة</p>
            
            <button onClick={() => { setActiveDocTab('من نحن'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeDocTab === 'من نحن' 
                ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
                : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Info className="w-4 h-4 text-amber-500"/>
              <span>من نحن؟</span>
            </button>

            <button onClick={() => { setActiveDocTab('الشروط والأحكام'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeDocTab === 'الشروط والأحكام' 
                ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
                : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Shield className="w-4 h-4 text-amber-500"/>
              <span>الشروط والأحكام</span>
            </button>

            <button onClick={() => { setActiveDocTab('سياسة الخصوصية'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeDocTab === 'سياسة الخصوصية' 
                ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
                : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Lock className="w-4 h-4 text-amber-500"/>
              <span>سياسة الخصوصية</span>
            </button>

            <button onClick={() => { setActiveDocTab('تواصل معنا'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeDocTab === 'تواصل معنا' 
                ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
                : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Mail className="w-4 h-4 text-amber-500"/>
              <span>تواصل معنا</span>
            </button>

            <button onClick={() => { setActiveDocTab('سجل التحديثات'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeDocTab === 'سجل التحديثات' 
                ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
                : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse"/>
              <span>سجل التحديثات (v1.9.0)</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-850' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <button onClick={toggleDarkMode} className={`p-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              isDarkMode ? 'bg-gray-850 border-gray-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-indigo-600'
            }`} title="تبديل الوضع">
              {isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
            </button>
            <span className="text-[10px] text-gray-500 font-mono">سوك بغداد v1.9.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute right-0 top-0 bottom-0 w-72 p-5 pb-24 overflow-y-auto border-l text-right flex flex-col justify-between ${
                isDarkMode ? 'bg-[black] border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
              dir="rtl"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Logo small />
                  <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-gray-800/10 hover:bg-gray-800/20 rounded-xl" title="إغلاق" aria-label="إغلاق">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <button onClick={() => { setView('home'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                    <Home className="w-5 h-5" /> الرئيسية
                  </button>
                  <button onClick={() => { setView('products'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                    <ShoppingBag className="w-5 h-5" /> المنتجات
                  </button>
                  <button onClick={() => { setView('transport'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                    <Car className="w-5 h-5" /> خطوط النقل والتوصيل
                  </button>
                </div>

                <hr className="my-4 border-gray-800/20" />

                {user ? (
                  <div className="space-y-1">
                    <button onClick={() => { setShowCreateAd(true); setEditingAd(null); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500 text-black font-bold text-sm">
                      <Plus className="w-5 h-5" /> رفع إعلان
                    </button>
                    <button onClick={() => { setShowCreateProduct(true); setEditingProduct(null); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-600 text-white font-bold text-sm">
                      <ShoppingBag className="w-5 h-5" /> إضافة منتج
                    </button>
                    <button onClick={() => { setView('profile'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                      <UserIcon className="w-5 h-5 text-gray-400" /> ملفي الشخصي
                    </button>
                    {isOwner && (
                      <button onClick={() => { setView('owner'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-amber-400 text-sm font-bold">
                        <Crown className="w-5 h-5" /> لوحة تحكم المالك
                      </button>
                    )}
                    {isAdmin && !isOwner && (
                      <button onClick={() => { setView('admin'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-red-400 text-sm font-bold">
                        <Settings className="w-5 h-5" /> لوحة تحكم الإدارة
                      </button>
                    )}
                    <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 text-sm font-bold">
                      <LogOut className="w-5 h-5" /> تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setShowAuth(true); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800 text-white font-bold text-sm">
                    <LogIn className="w-5 h-5" /> تسجيل الدخول
                  </button>
                )}

                <hr className="my-4 border-gray-800/20" />

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider pr-3 mb-2">معلومات وسياسات المنصة</p>
                  {['من نحن', 'الشروط والأحكام', 'سياسة الخصوصية', 'تواصل معنا', 'سجل التحديثات'].map((item) => (
                    <button key={item} onClick={() => { setActiveDocTab(item); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs hover:bg-gray-800/10 font-bold">
                      <Info className="w-4 h-4 text-amber-500" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Menu Footer */}
              <div className="pt-4 border-t border-gray-800/20 flex items-center justify-between">
                <button onClick={toggleDarkMode} className="p-2 rounded-xl border flex items-center justify-center">
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <span className="text-[10px] text-gray-500 font-mono">سوك بغداد v1.9.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="pwa-main lg:pr-64">
        <AnimatePresence mode="wait">
          {view==='home'&&<motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <MarketView 
                user={user} 
                allAds={allAds} 
                allProducts={allProducts} 
                favorites={favorites} 
                storedUsers={storedUsers} 
                onSelectAd={setSelectedAd} 
                onSelectProduct={setSelectedProduct} 
                onToggleFav={handleToggleFav} 
                onRequireAuth={requireAuth} 
                onSellerClick={handleSellerClick} 
                onTransportClick={()=>{setView('transport');setBottomNavActive('transport');}} 
                isStandalone={isStandalone}
                onInstallClick={handleInstallClick}
                onSelectTransportAd={setSelectedTransportAd} 
                transportLines={allTransportAds}
                search={search}
                setSearch={setSearch}
                cat={cat}
                setCat={setCat}
                gov={gov}
                setGov={setGov}
                sort={sort}
                setSort={setSort}
                priceMin={priceMin}
                setPriceMin={setPriceMin}
                priceMax={priceMax}
                setPriceMax={setPriceMax}
                hasMoreAds={hasMoreAds}
                hasMoreProducts={hasMoreProducts}
                onLoadMoreAds={() => fetchAds(false)}
                onLoadMoreProducts={() => fetchProducts(false)}
                totalAdsCount={totalAdsCount}
                totalProductsCount={totalProductsCount}
                loadingMoreAds={loadingMoreAds}
                loadingMoreProducts={loadingMoreProducts}
                isInitialLoading={isInitialLoading}
                isDarkMode={isDarkMode}
              />
            </Suspense>
          </motion.div>}
          {view==='privacy'&&<motion.div key="privacy" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <PrivacyPolicy />
            </Suspense>
          </motion.div>}
          {view==='products'&&<motion.div key="products" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <ProductsView 
                user={user} 
                onBack={()=>setView('home')} 
                onCreateProduct={()=>{if(!user){requireAuth();return;}setShowCreateProduct(true);}} 
                onSelectProduct={setSelectedProduct} 
                products={allProducts} 
                onActionMenu={setActionMenuTarget} 
                hasMoreProducts={hasMoreProducts} 
                onLoadMoreProducts={() => fetchProducts(false)}
                totalProductsCount={totalProductsCount}
                loadingMoreProducts={loadingMoreProducts}
                isInitialLoading={isInitialLoading}
                search={search}
                setSearch={setSearch}
                cat={cat}
                setCat={setCat}
                gov={gov}
                setGov={setGov}
                sort={sort}
                setSort={setSort}
                priceMin={priceMin}
                setPriceMin={setPriceMin}
                priceMax={priceMax}
                setPriceMax={setPriceMax}
                conditionFilter={conditionFilter}
                setConditionFilter={setConditionFilter}
              />
            </Suspense>
          </motion.div>}
          {view==='profile'&&user&&<motion.div key="profile" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <ProfileView user={user} myAds={myAds} myProducts={myProducts} onDeleteAd={handleDeleteAd} onEditAd={ad=>{setEditingAd(ad);setShowCreateAd(true);}} onDeleteProduct={handleDeleteProduct} onEditProduct={p=>{setEditingProduct(p);setShowCreateProduct(true);}} onUpdateUser={handleUpdateUser} onAddAd={()=>{setEditingAd(null);setShowCreateAd(true);}} onAddProduct={()=>{setEditingProduct(null);setShowCreateProduct(true);}} transportLines={allTransportAds} onUpdateTransportStatus={handleUpdateTransportStatus} onDeleteTransportAd={handleDeleteTransportAd} onMarkAdSold={handleMarkAdSold} onMarkProductSold={handleMarkProductSold} favorites={favorites} allAds={allAds} allProducts={allProducts} onAdSelect={setSelectedAd} onProductSelect={setSelectedProduct} onFav={handleToggleFav} onStoreGuideClick={() => setShowStoreGuide(true)} isDarkMode={isDarkMode} />
            </Suspense>
          </motion.div>}
          {view==='seller'&&selectedSellerId&&<motion.div key="seller" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <SellerPublicPage sellerId={selectedSellerId} allAds={allAds} allProducts={allProducts} allTransportAds={allTransportAds} storedUsers={storedUsers} onBack={() => {
                setView('home');
                if (previousSellerSource === 'accounts') {
                  if (typeof window !== 'undefined') window.location.hash = '#/accounts';
                  setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-profiles-tab')), 50);
                } else {
                  if (typeof window !== 'undefined') window.location.hash = '#/';
                }
              }} onSelectAd={setSelectedAd} onSelectProduct={setSelectedProduct} onSelectTransport={setSelectedTransportAd} favorites={favorites} onToggleFav={handleToggleFav} user={user} onAuthRequired={requireAuth} onDeleteProfile={handleDeleteProfile} onActionMenu={setActionMenuTarget} isDarkMode={isDarkMode}/>
            </Suspense>
          </motion.div>}
          {view==='transport'&&<motion.div key="transport" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <TransportView user={user} onBack={()=>setView('home')} onCreateAd={()=>{if(!user){requireAuth();return;}setShowCreateTransport(true);}} onGoToMyLines={()=>{setView('profile'); setTimeout(()=>window.dispatchEvent(new CustomEvent('switch-to-lines-tab')), 100);}} onSelectAd={setSelectedTransportAd} lines={allTransportAds} onPost={handlePostTransportAd} onUpdateStatus={handleUpdateTransportStatus} onDeleteAd={handleDeleteTransportAd} onActionMenu={setActionMenuTarget} isInitialLoading={isInitialLoading || (loadingTransport && allTransportAds.length === 0)} storedUsers={storedUsers} onLoadMore={() => fetchTransportAds(false)} hasMore={hasMoreTransport} totalCount={totalTransportCount} adCosts={adCosts}/>
            </Suspense>
          </motion.div>}
          {view==='admin'&&isAdmin&&!isOwner&&<motion.div key="admin" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <AdminPanel ads={allAds} onDeleteAd={handleDeleteAd} onClose={()=>setView('home')}/>
            </Suspense>
          </motion.div>}
          {view==='owner'&&isOwner&&<motion.div key="owner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <OwnerDashboard ads={allAds} products={allProducts} transportAds={allTransportAds} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onDeleteTransportAd={handleDeleteTransportAd} onClose={()=>setView('home')} onDeleteProfile={handleDeleteProfile}/>
            </Suspense>
          </motion.div>}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[black] border-t border-[#d4af37]/20 py-6 lg:pr-64">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3"><span className="text-2xl">🇮🇶</span><span className="text-lg font-bold text-white">سوك بغداد</span></div>
                    <p className="text-gray-500 text-xs">© 2025 سوك بغداد — السوق الرقمي العراقي</p>
          
          <div className="flex items-center justify-center gap-4 mt-3">
            <a href="https://wa.me/9647700028170" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700/50 flex items-center justify-center text-green-400 hover:bg-green-500/10 hover:border-green-500/30 transition-all" title="واتساب الدعم">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </a>
            <a href="https://instagram.com/SOUQBAGHDAD.IQ" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700/50 flex items-center justify-center text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all" title="انستغرام المنصة">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <a href="https://t.me/SOUQBAGHDA" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700/50 flex items-center justify-center text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all" title="تليكرام المنصة">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0C5.344 0 0 5.344 0 12c0 6.656 5.344 12 12 12 6.656 0 12-5.344 12-12C24 5.344 18.656 0 11.944 0zm5.892 8.046c-.144.9-.99 5.874-1.44 8.286-.192 1.014-.564 1.356-.924 1.392-.786.072-1.386-.516-2.148-1.014-.762-.5-1.188-.81-1.926-1.296-.852-.564-.3-.876.186-1.38.126-.132 2.334-2.136 2.376-2.316.006-.024.012-.114-.042-.162-.054-.048-.132-.03-.186-.018-.084.018-1.392.882-3.924 2.592-.372.258-.708.384-1.008.378-.33-.006-.966-.186-1.44-.342-.582-.192-1.044-.294-1.002-.624.024-.168.252-.342.69-.516 2.688-1.17 4.482-1.938 5.388-2.31 2.562-1.056 3.096-1.242 3.444-1.248.078 0 .252.018.366.114.096.084.12.198.132.282.012.072.024.228.012.384z"/></svg>
            </a>
          </div>

          <div className="flex items-center justify-center gap-3 mt-3 text-gray-500 text-xs flex-wrap">
            {['الشروط والأحكام','سياسة الخصوصية','تواصل معنا','من نحن','سجل التحديثات'].map(l=><button key={l} onClick={()=>setActiveDocTab(l)} className="hover:text-amber-400">{l}</button>)}</div>
        </div>
      </footer>

      {/* Bottom Navigation Bar - Fixed Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[black]/95 backdrop-blur-xl border-t border-[#d4af37]/20 lg:hidden pwa-bottom-nav">
        <div className="flex items-center justify-around h-16 px-2">
          {/* الملف الشخصي */}
          <button
            onClick={() => {
              if (!user) {
                requireAuth();
              } else {
                setBottomNavActive('profile');
                setView('profile');
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'profile' ? 'text-purple-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'profile' ? 'bg-purple-500/20' : ''}`}>
              <UserCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">حسابي</span>
          </button>

          {/* المنتجات */}
          <button
            onClick={() => { setBottomNavActive('products'); setView('products'); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'products' ? 'text-gray-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'products' ? 'bg-gray-800/20' : ''}`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">المنتجات</span>
          </button>

          {/* إضافة إعلان */}
          <button
            onClick={() => {
              if (!user) {
                requireAuth();
              } else {
                setBottomNavActive('create-ad');
                setShowCreateAd(true);
              }
            }}
            className="flex flex-col items-center justify-center flex-1 py-2"
          >
            <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full -mt-6 shadow-lg shadow-amber-500/30">
              <Plus className="w-6 h-6 text-black" />
            </div>
            <span className="text-[10px] mt-1 font-medium text-amber-400">إعلان</span>
          </button>

          {/* الخطوط */}
          <button
            onClick={() => { setBottomNavActive('transport'); setView('transport'); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'transport' ? 'text-emerald-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'transport' ? 'bg-emerald-500/20' : ''}`}>
              <Car className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">الخطوط</span>
          </button>

          {/* الرئيسية */}
          <button
            onClick={() => { setBottomNavActive('home'); setView('home'); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'home' ? 'text-amber-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'home' ? 'bg-amber-500/20' : ''}`}>
              <Home className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
          </button>
        </div>
      </nav>

      {/* Biometric Reminder Banner */}
      <AnimatePresence>
      {showBiometricBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[80px] left-4 right-4 z-[90] bg-[#0052ff] text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 border border-blue-400/30"
            dir="rtl"
          >
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <Fingerprint className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h4 className="font-bold">أمان وسرعة 🔒</h4>
                      <p className="text-xs text-blue-100 mt-0.5">فعّل تسجيل الدخول بالبصمة للوصول السريع بدون كتابة الرمز كل مرة.</p>
                   </div>
                </div>
             </div>
              <div className="flex items-center gap-2 mt-2">
                 <button
                   onClick={async () => {
                       playNotificationSound('click');
                       if (!Capacitor.isNativePlatform()) {
                          try { await supabase.auth.registerPasskey(); } catch (err) {}
                       }
                       localStorage.setItem('biometricEnabled', 'true');
                       localStorage.setItem('biometricPromptShown', 'true');
                       setShowBiometricBanner(false);
                   }}
                   className="flex-1 py-2.5 bg-white text-[#0052ff] font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                 >
                    <CheckCircle className="w-4 h-4" /> تفعيل الآن
                 </button>
                 <button
                   onClick={() => {
                       playNotificationSound('click');
                       setShowBiometricBanner(false);
                       localStorage.setItem('biometricPromptShown', 'true');
                   }}
                   className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
                 >
                    لاحقاً
                 </button>
              </div>
          </motion.div>
      )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showOnboarding&&<Suspense fallback={null}><OnboardingModal isOpen={showOnboarding} onClose={()=>{setShowOnboarding(false);localStorage.setItem('souqOnboarded','1');localStorage.setItem('souq_onboarding_completed','true');}}/></Suspense>}
        {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={handleLogin}/>}
        {selectedAd&&<Suspense fallback={null}><AdDetailModal ad={selectedAd} onClose={()=>setSelectedAd(null)} isFav={favorites.includes(selectedAd.id)} onFav={()=>handleToggleFav(selectedAd.id)} user={user} storedUsers={storedUsers} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedAd(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedAd.id, selectedAd.title, selectedAd.postedBy || '', 'ad', sec)} onImageZoom={(src, title, imgs, idx) => setActiveLightbox({ src, title, images: imgs, initialIdx: idx })} onViewsUpdated={(id, views) => { setAllAds(prev => prev.map(a => String(a.id) === String(id) ? { ...a, views: Math.max(a.views || 0, views) } : a)); window.dispatchEvent(new CustomEvent('update-views', { detail: { id, views, type: 'ad' } })); }} /></Suspense>}
        {selectedProduct&&<Suspense fallback={null}><ProductDetailModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} isFav={favorites.includes(selectedProduct.id)} onFav={()=>handleToggleFav(selectedProduct.id)} user={user} storedUsers={storedUsers} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedProduct(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedProduct.id, selectedProduct.title, selectedProduct.postedBy || '', 'product', sec)} onImageZoom={(src, title, imgs, idx) => setActiveLightbox({ src, title, images: imgs, initialIdx: idx })} onViewsUpdated={(id, views) => { setAllProducts(prev => prev.map(p => String(p.id) === String(id) ? { ...p, views: Math.max(p.views || 0, views) } : p)); window.dispatchEvent(new CustomEvent('update-views', { detail: { id, views, type: 'product' } })); }} /></Suspense>}
        {selectedTransportAd&&<Suspense fallback={null}><TransportDetailModal ad={selectedTransportAd} onClose={()=>setSelectedTransportAd(null)} user={user} onAuthRequired={requireAuth} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedTransportAd.id, selectedTransportAd.type==='offer'?'خط متوفر':'طلب خط', selectedTransportAd.postedBy || '', 'transport', sec)} storedUsers={storedUsers}/></Suspense>}
        {showCreateAd&&user&&<Suspense fallback={null}><AdFormModal isOpen={showCreateAd} onClose={()=>{setShowCreateAd(false);setEditingAd(null);}} onSubmit={handleAddOrEditAd} user={user} editAd={editingAd} cost={adCosts.ad !== undefined ? adCosts.ad : 1} vipCost={adCosts.vip_ad !== undefined ? adCosts.vip_ad : 5} /></Suspense>}
        {showCreateProduct&&user&&<Suspense fallback={null}><ProductFormModal isOpen={showCreateProduct} onClose={()=>{setShowCreateProduct(false);setEditingProduct(null);}} onSubmit={handleAddOrEditProduct} user={user} editProduct={editingProduct} cost={adCosts.product !== undefined ? adCosts.product : 1} vipCost={adCosts.vip_ad !== undefined ? adCosts.vip_ad : 5} /></Suspense>}
        {showNotifs&&<Suspense fallback={null}><NotifPanel isOpen={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifications} onNotifClick={handleSellerClick} onHistoryClick={handleHistoryClick} onMarkRead={markNotifAsRead} onArchiveAll={handleArchiveAllNotifications}/></Suspense>}
        {activeDocTab&&<Suspense fallback={null}><InfoDocsModal activeTab={activeDocTab} onClose={()=>setActiveDocTab(null)} user={user}/></Suspense>}
        {activeLightbox&&<ImageLightboxModal src={activeLightbox.src} title={activeLightbox.title} images={(activeLightbox as any).images} initialIdx={(activeLightbox as any).initialIdx} onClose={()=>setActiveLightbox(null)}/>}
        {congratulationsItem && <CongratulationsModal item={congratulationsItem} onClose={() => setCongratulationsItem(null)} />}
        {shareModalData.isOpen && (
          <Suspense fallback={null}>
            <ShareModal
              isOpen={shareModalData.isOpen}
              onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
              title={shareModalData.title}
              url={shareModalData.url}
              image={shareModalData.image}
              price={shareModalData.price}
              governorate={shareModalData.governorate}
              location={shareModalData.location}
              short_id={shareModalData.short_id}
              description={(shareModalData as any).description}
              category={shareModalData.category}
              views={shareModalData.views}
              createdAt={shareModalData.createdAt}
              isVerified={shareModalData.isVerified}
              images={shareModalData.images}
              university={shareModalData.university}
              regions={shareModalData.regions}
              type={shareModalData.type}
            />
          </Suspense>
        )}

        {showInstallGuide && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={()=>setShowInstallGuide(null)}/>
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="relative bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-700 shadow-2xl text-right" dir="rtl">
              <button onClick={()=>setShowInstallGuide(null)} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
              
              {showInstallGuide === 'safari' && (
                <>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-amber-400"/> تثبيت التطبيق على iPhone (Safari)</h2>
                  <p className="text-gray-400 text-sm mb-4">لتثبيت تطبيق "سوك بغداد" على الشاشة الرئيسية لجهاز الـ iPhone الخاص بك، يرجى اتباع الخطوات البسيطة التالية:</p>
                  <ol className="space-y-3 text-gray-300 text-sm list-decimal list-inside">
                    <li>اضغط على زر <span className="font-bold text-amber-400">مشاركة (Share)</span> <Share2 className="w-4 h-4 inline-block mx-1 text-amber-400"/> الموجود في شريط الأدوات بالأسفل.</li>
                    <li>قم بالتمرير لأسفل واضغط على خيار <span className="font-bold text-amber-400">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span> <Plus className="w-4 h-4 inline-block mx-1 text-amber-400"/>.</li>
                    <li>اضغط على <span className="font-bold text-amber-400">إضافة (Add)</span> في الزاوية العلوية اليمنى لإتمام التثبيت.</li>
                  </ol>
                </>
              )}

              {showInstallGuide === 'ios-other' && (
                <>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-400"/> متصفح غير مدعوم للتثبيت</h2>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    يبدو أنك تستخدم متصفحًا آخر غير <span className="text-amber-400 font-bold">Safari</span> على هاتف iPhone الخاص بك (مثل Chrome أو Edge).
                  </p>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    نظام iOS لا يسمح بتثبيت التطبيقات على الشاشة الرئيسية إلا من خلال متصفح <span className="text-white font-bold">Safari</span>.
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs mb-4">
                    <strong>الحل:</strong> يرجى نسخ رابط الموقع الحالي، وفتحه باستخدام متصفح <strong>Safari</strong> الرسمي على جهازك، ثم الضغط على زر التثبيت مرة أخرى.
                  </div>
                  <button onClick={() => {
                    navigator.clipboard.writeText("https://souqbaghdad.store");
                    alert("تم نسخ رابط الموقع!");
                  }} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-sm" title="نسخ رابط الموقع" aria-label="نسخ رابط الموقع">
                    نسخ رابط الموقع 📋
                  </button>
                </>
              )}

              {showInstallGuide === 'android-fallback' && (
                <>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-amber-400"/> كيفية تثبيت التطبيق</h2>
                  <p className="text-gray-400 text-sm mb-4">لتثبيت التطبيق على جهازك يدويًا:</p>
                  <ul className="space-y-3 text-gray-300 text-sm list-disc list-inside">
                    <li>اضغط على زر <span className="font-bold text-amber-400">خيارات المتصفح (الثلاث نقاط في الأعلى)</span>.</li>
                    <li>اختر <span className="font-bold text-amber-400">تثبيت التطبيق (Install App)</span> أو <span className="font-bold text-amber-400">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.</li>
                    <li>أكّد عملية التثبيت في المربع الذي يظهر لك.</li>
                  </ul>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstallOptionsModal
        isOpen={showInstallOptions}
        onClose={() => setShowInstallOptions(false)}
        onPwaInstall={handlePwaInstall}
        playStoreUrl="https://play.google.com/store/apps/details?id=souqbaghdad.store"
      />

      <Suspense fallback={null}>
        {user && showStoreGuide && (
          <StoreShareGuideModal
            isOpen={showStoreGuide}
            onClose={() => setShowStoreGuide(false)}
            storeUrl={`https://www.souqbaghdad.store/seller/${user.id}`}
            onShare={() => {
              setShowStoreGuide(false);
              handleUniversalShare({
                title: user.name,
                type: 'profile',
                location: user.location || 'بغداد',
                id: user.id,
                url: '/seller/' + user.id,
                image: user.avatar || DEFAULT_AVATAR
              });
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
