import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LoadingScreen } from './components/LoadingScreen';
import { useOnlineStatuses } from './hooks/useOnlineStatuses';
import { SellerInfo, Ad, Product, User, StoredUser, Visit, SystemLog, TransportAd } from './types';
import { formatPrice } from './utils/format';
import { logSystemAction } from './utils/logs';
import { getRelative, useRelativeTime } from './utils/time';

const ProductsView = lazy(() => import('./components/ProductsView').then(m => ({ default: m.ProductsView })));
const ViewersModal = lazy(() => import('./components/ViewersModal').then(m => ({ default: m.ViewersModal })));
const ShareModal = lazy(() => import('./components/ShareModal').then(m => ({ default: m.ShareModal })));
import {
  Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, AlertCircle, Check,
  Gamepad2, Heart, Bell, Plus, LogOut, Star, X, Search, MapPin,
  Eye as ViewIcon, Phone as PhoneIcon, Grid, List, Menu, MessageSquare,
  Share2, Copy, CheckCircle, XCircle, Loader2, ChevronRight, Shield, ImagePlus,
  Trash2, SlidersHorizontal, Settings, ChevronLeft, Info, LogIn, Edit2,
  Save, BarChart3, Smartphone, Monitor, Tablet, Globe, UserCheck, Activity,
  Crown, UserX, FileText, ShoppingBag, Package, Store, Camera, ZoomIn,
  ZoomOut, Calendar, Users, ChevronDown, Tag, Layers, Home, Car, UserCircle, Key, Sparkles, Clock
} from 'lucide-react';

const OwnerDashboard = lazy(() => import('./components/OwnerDashboard'));
const StoreShareGuideModal = lazy(() => import('./components/StoreShareGuideModal').then(m => ({ default: m.StoreShareGuideModal })));
import LiveVisitorCounter from './components/LiveVisitorCounter';
import InfiniteScrollTrigger from './components/InfiniteScrollTrigger';
// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const OWNER_EMAIL = 'nooraldeinsbah@gmail.com';
const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e3a5f"/><circle cx="50" cy="38" r="18" fill="#4b7ab5"/><ellipse cx="50" cy="82" rx="28" ry="20" fill="#4b7ab5"/></svg>')}`;
const DEFAULT_COVER = '/logo.jpg';

export const getCoverImage = (user: {role?: string, cover?: string}) => {
  if (['pro', 'vendor', 'admin', 'owner'].includes(user?.role || '')) {
    return user?.cover || DEFAULT_COVER;
  }
  return DEFAULT_COVER;
};

export { getGlowClass, getWhatsAppResetLink } from './utils/helpers';
import { getGlowClass, getWhatsAppResetLink } from './utils/helpers';

const IRAQI_GOVERNORATES = [
  'الكل','بغداد','البصرة','نينوى','أربيل','كربلاء','النجف',
  'دهوك','السليمانية','بابل','ديالى','المثنى','ميسان',
  'القادسية','صلاح الدين','واسط','الأنبار','ذي قار','كركوك',
];

const CATEGORIES = [
  { id:'all',          name:'الكل',        emoji:'📦' },
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

const GAMES_DATA = [
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
async function compressImage(file: File, maxPx = 900, quality = 0.78, addWatermark = true): Promise<string> {
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

async function uploadImageToStorage(fileOrBase64: File | string, bucket = 'ad-images', maxPx = 900, quality = 0.78, addWatermark = true): Promise<string> {
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

export function handleUniversalShare(details: { title?: string; university?: string; type?: string; location?: string; governorate?: string; regions?: string; id?: any; short_id?: string; price?: string; image?: string; images?: string[]; url?: string; description?: string }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-share-modal', { detail: details }));
  }
}

// Time helpers moved to src/utils/time.ts
function TimeAgo({ iso, className }: { iso:string; className?:string }) {
  return <span className={className}>{useRelativeTime(iso)}</span>;
}

function detectDevice(): Visit['device'] {
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}
function recordVisit(user: User | null) {
  const v: Visit = { id: Date.now()+Math.random().toString(36).slice(2), timestamp: new Date().toISOString(), device: detectDevice(), location: user?.location||'زائر', userId: user?.id, userName: user?.name, page:'home' };
  try { const prev:Visit[] = JSON.parse(localStorage.getItem('souqVisits')||'[]'); localStorage.setItem('souqVisits', JSON.stringify([v,...prev].slice(0,2000))); } catch {}
}
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
function isBanned(email: string) {
  try { return (JSON.parse(localStorage.getItem('souqUsers')||'[]') as StoredUser[]).find(u=>u.email===email)?.isBanned||false; } catch { return false; }
}
const useSound = () => {
  const ctx = useRef<AudioContext|null>(null);
  return (type:'success'|'error'|'click'|'info') => {
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const c=ctx.current, osc=c.createOscillator(), gain=c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      const f:Record<string,number[]>={success:[800,1000],error:[400,300],click:[500,500],info:[700,900]};
      osc.frequency.setValueAtTime(f[type][0],c.currentTime); osc.frequency.setValueAtTime(f[type][1],c.currentTime+0.1);
      gain.gain.setValueAtTime(0.2,c.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,c.currentTime+0.3);
      osc.start(c.currentTime); osc.stop(c.currentTime+0.3);
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
function Logo({ small }:{small?:boolean}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${small?'w-10 h-10':'w-14 h-14'} shrink-0 bg-blue-900 rounded-xl flex items-center justify-center border-2 border-amber-500/40 shadow-lg overflow-hidden`}>
        <img src="/logo.jpg" alt="سوق بغداد" className="w-full h-full object-cover" />
      </div>
      {!small && <div className="shrink-0"><h1 className="text-xl font-bold text-white leading-tight">سوك بغداد</h1><p className="text-amber-400 text-xs">السوق الرقمي العراقي</p></div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
function Toast({ msg,type,visible,onClose }:{msg:string;type:string;visible:boolean;onClose:()=>void}) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, onClose]);
  const c:Record<string,string>={success:'from-green-500 to-emerald-500',error:'from-red-500 to-rose-500',info:'from-blue-500 to-cyan-500'};
  return (
    <AnimatePresence>
      {visible&&<motion.div initial={{opacity:0,y:-40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-40}}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 bg-gradient-to-r ${c[type]||c.info}`}>
        {type==='success'?<CheckCircle className="w-5 h-5 text-white"/>:type==='error'?<XCircle className="w-5 h-5 text-white"/>:<Info className="w-5 h-5 text-white"/>}
        <span className="text-white font-bold text-sm">{msg}</span>
      </motion.div>}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Image Crop Modal
// ─────────────────────────────────────────────
function ImageCropModal({ src, aspectRatio=1, title='قص الصورة', onSave, onClose }:{
  src:string; aspectRatio?:number; title?:string; onSave:(b64:string)=>void; onClose:()=>void;
}) {
  const PREV_W = 300, PREV_H = Math.round(300/aspectRatio);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos]   = useState({ x:0, y:0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x:0, y:0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const onMouseDown = (e:React.MouseEvent) => { e.preventDefault(); setDragging(true); setStart({x:e.clientX-pos.x, y:e.clientY-pos.y}); };
  const onMouseMove = (e:React.MouseEvent) => { if(!dragging) return; setPos({x:e.clientX-start.x, y:e.clientY-start.y}); };
  const onMouseUp   = () => setDragging(false);
  const onTouchStart = (e:React.TouchEvent) => { const t=e.touches[0]; setDragging(true); setStart({x:t.clientX-pos.x, y:t.clientY-pos.y}); };
  const onTouchMove  = (e:React.TouchEvent) => { if(!dragging) return; const t=e.touches[0]; setPos({x:t.clientX-start.x, y:t.clientY-start.y}); };

  const handleSave = () => {
    const img = imgRef.current; if(!img) return;
    const c = document.createElement('canvas');
    c.width=PREV_W; c.height=PREV_H;
    const ctx = c.getContext('2d')!;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    // Calculate the scale at which the browser's object-cover renders the image
    const coverScale = Math.max((PREV_W*zoom)/nw, (PREV_H*zoom)/nh);
    const dw = nw * coverScale;
    const dh = nh * coverScale;
    const dx = (PREV_W - dw)/2 + pos.x;
    const dy = (PREV_H - dh)/2 + pos.y;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, PREV_W, PREV_H);
    ctx.drawImage(img, dx, dy, dw, dh);
    onSave(c.toDataURL('image/jpeg', 0.88));
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="relative bg-gray-900 rounded-2xl p-5 w-full max-w-sm border border-gray-700 shadow-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 bg-gray-800 rounded-lg text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-4 h-4"/></button>
        </div>
        {/* Crop area */}
        <div className="relative overflow-hidden rounded-xl bg-gray-800 border border-gray-600 cursor-grab active:cursor-grabbing select-none mx-auto"
          style={{width:PREV_W, height:PREV_H}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}>
          <img ref={imgRef} src={src} alt=""
            className="absolute object-cover pointer-events-none"
            style={{ width:PREV_W*zoom, height:PREV_H*zoom, left:(PREV_W-PREV_W*zoom)/2+pos.x, top:(PREV_H-PREV_H*zoom)/2+pos.y }}
            draggable={false}/>
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',backgroundSize:`${PREV_W/3}px ${PREV_H/3}px`}}/>
          <div className="absolute inset-0 border-2 border-white/40 rounded-xl pointer-events-none"/>
        </div>
        {/* Zoom */}
        <div className="flex items-center gap-3 mt-4">
          <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0"/>
          <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={e=>setZoom(+e.target.value)} className="flex-1 accent-amber-400" title="نسبة التقريب" aria-label="نسبة التقريب"/>
          <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0"/>
          <span className="text-gray-400 text-xs w-8">{(zoom*100).toFixed(0)}%</span>
        </div>
        <p className="text-gray-500 text-xs text-center mt-2">اسحب الصورة لتحريكها</p>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium">إلغاء</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-amber-500 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Check className="w-4 h-4"/> حفظ</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

async function recordItemView(itemId: string|number, itemType: 'ad'|'product'|'transport', currentUser: User|null, sellerId?: string) {
  try {
    const viewerId = currentUser?.id || localStorage.getItem('souqGuestId') || 'guest-' + Math.random().toString(36).substring(2, 7);
    const viewerName = currentUser?.name || 'زائر';
    const viewerAvatar = currentUser?.avatar || `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#374151"/><circle cx="50" cy="50" r="30" fill="#4b5563"/></svg>')}`;
    const viewerLocation = currentUser?.location || 'العراق';

    // 1. Check if already viewed in last hour to avoid spam
    const lastViewKey = `last_view_${itemType}_${itemId}`;
    const lastView = localStorage.getItem(lastViewKey);
    if (lastView && Date.now() - Number(lastView) < 60 * 60 * 1000) {
      return; // Already viewed recently
    }

    // 2. Insert into ad_viewers
    const { error } = await supabase.from('ad_viewers').insert({
      item_id: itemId,
      item_type: itemType,
      viewer_id: viewerId,
      viewer_name: viewerName,
      viewer_avatar: viewerAvatar,
      viewer_location: viewerLocation
    });

    if (!error) {
      localStorage.setItem(lastViewKey, Date.now().toString());
      
      // 3. Send notification to seller
      if (sellerId && sellerId !== viewerId) {
        await supabase.from('user_notifications').insert({
          user_id: sellerId,
          title: 'مشاهدة جديدة 👀',
          body: `قام ${viewerName} بمشاهدة إعلانك للتو.`,
          type: 'view',
          audience: 'user'
        });
      }

      // 4. Update the views counter on the item itself
      const table = itemType === 'product' ? 'products' : 'ads';
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

function InterestTimer({ itemId, itemType, onInterestRegistered }: { itemId: string|number, itemType: 'ad'|'product'|'transport', onInterestRegistered?: () => void }) {
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
      initial={{ scale: 0, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute top-4 left-4 z-50 px-4 py-2 bg-amber-500 text-black font-black rounded-full shadow-lg border border-yellow-300 flex items-center gap-1.5 animate-bounce"
    >
      <span>{sticker}</span>
      <span className="text-[10px] bg-black/15 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{seconds}ث</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Skeleton Card
// ─────────────────────────────────────────────
function SkeletonCard() {
  return <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 animate-pulse"><div className="aspect-[4/3] bg-gray-700"/><div className="p-4 space-y-3"><div className="h-4 bg-gray-700 rounded w-3/4"/><div className="h-5 bg-gray-700 rounded w-1/2"/><div className="h-3 bg-gray-700 rounded w-2/3"/></div></div>;
}

// ─────────────────────────────────────────────
// Onboarding Modal
// ─────────────────────────────────────────────
function OnboardingModal({ onClose }:{onClose:()=>void}) {
  const [step, setStep] = useState(0);
  const steps=[{icon:'🛍️',title:'مرحباً في سوك بغداد',desc:'أكبر سوق رقمي عراقي. تصفح بدون تسجيل، وسجّل لتنشر إعلاناتك ومتجرك.'},{icon:'📢',title:'إعلانات + متجر',desc:'انشر إعلانات العقارات والسيارات، أو افتح متجرك لبيع المنتجات مباشرة.'},{icon:'✏️',title:'تعديل في أي وقت',desc:'عدّل صورك وبياناتك وإعلاناتك ومنتجاتك بسهولة من ملفك الشخصي.'},{icon:'👤',title:'صفحة بائع عامة',desc:'كل مستخدم له صفحة عامة يراها أي زائر مع جميع إعلاناته ومنتجاته.'}];
  const s=steps[step];
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="relative bg-gray-900 rounded-3xl p-8 w-full max-w-sm text-center border border-gray-700 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        <motion.div key={step} initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} className="text-6xl mb-4">{s.icon}</motion.div>
        <h2 className="text-xl font-bold text-white mb-3">{s.title}</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-6">{s.desc}</p>
        <div className="flex justify-center gap-2 mb-6">{steps.map((_,i)=><div key={i} onClick={()=>setStep(i)} className={`h-2 rounded-full cursor-pointer transition-all ${i===step?'bg-amber-400 w-6':'bg-gray-600 w-2'}`}/>)}</div>
        <div className="flex gap-3">
          {step>0&&<button onClick={()=>setStep(step-1)} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium">السابق</button>}
          {step<steps.length-1?<button onClick={()=>setStep(step+1)} className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-bold">التالي</button>
            :<button onClick={onClose} className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-bold">ابدأ الآن</button>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Congratulations Modal
// ─────────────────────────────────────────────
function CongratulationsModal({ item, onClose }: { item: { title: string; type: 'ad' | 'product' }; onClose: () => void }) {
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


// ─────────────────────────────────────────────
// Auth Modal
// ─────────────────────────────────────────────

function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [step, setStep] = useState<'phone'|'login'|'signup'>(() => {
    const last = localStorage.getItem('souqLastUser');
    return last ? 'login' : 'phone';
  });
  const [identifier, setIdentifier] = useState(() => {
    const last = localStorage.getItem('souqLastUser');
    if (last) {
      try {
        const u = JSON.parse(last);
        return u.phone || u.email || '';
      } catch { return ''; }
    }
    return '';
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('بغداد');
  
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const playSound = useSound();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      if (identifier.length < 3) { setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني'); setLoading(false); return; }
      
      let phoneToCheck = identifier.trim();
      const isPhone = /^\d+$/.test(phoneToCheck);
      
      if (isPhone || !phoneToCheck.includes('@')) {
         const { data, error } = await supabase.from('profiles').select('id').eq('phone', phoneToCheck).maybeSingle();
         if (data) {
           setStep('login');
         } else {
           if(!isPhone) {
             const { data: emailData } = await supabase.from('profiles').select('id').eq('email', phoneToCheck).maybeSingle();
             if (emailData) setStep('login');
             else setStep('signup');
           } else {
             setStep('signup');
           }
         }
      } else {
         const { data } = await supabase.from('profiles').select('id').eq('email', phoneToCheck.toLowerCase()).maybeSingle();
         if (data) setStep('login');
         else setStep('signup');
      }
    } catch(err) {
      setError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      let emailToUse = identifier.trim().toLowerCase();
      let phone = identifier.trim();
      
      if (!emailToUse.includes('@')) {
        const isPhone = /^\d+$/.test(emailToUse);
        if (isPhone) {
          emailToUse = `${emailToUse}@souqbaghdad.com`;
        } else {
          emailToUse = `${emailToUse.replace(/\s+/g, '')}@souqbaghdad.com`;
          phone = ''; // Username
        }
      } else {
        phone = ''; // Email
      }

      if (password.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); playSound('error'); setLoading(false); return; }
      
      if (step === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (error) {
          const msg = error.message.includes('Invalid login credentials')
            ? 'كلمة المرور غير صحيحة'
            : 'حدث خطأ في تسجيل الدخول';
          setError(msg); playSound('error'); setLoading(false); return;
        }
        playSound('success');
        onClose();
      } else if (step === 'signup') {
        const role = phone === '07701109692' ? 'owner' : 'user';
        const { error } = await supabase.auth.signUp({
          email: emailToUse, password,
          options: { data: { full_name: name, phone, city, role } }
        });
        if (error) {
          let msg = error.message;
          if (msg.includes('already registered') || msg === '{}') {
            msg = 'هذا الحساب مسجّل مسبقاً، يرجى تسجيل الدخول';
            setStep('login');
          }
          setError(msg); playSound('error'); setLoading(false); return;
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (!signInErr) { playSound('success'); onClose(); }
        else { setError('تم إنشاء الحساب. يرجى تسجيل الدخول.'); setStep('login'); }
      }
    } catch {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  const submitRecovery = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      if (recoveryPhone.length < 10) { setError('يرجى إدخال رقم هاتف صحيح'); playSound('error'); setLoading(false); return; }
      const { error } = await supabase.from('password_recovery_requests').insert([{ phone: recoveryPhone }]);
      if (error) throw error;
      setRecoverySent(true);
      playSound('success');
    } catch {
      setError('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl p-7 w-full max-w-md border border-gray-700 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{step === 'login' ? '🔐' : step === 'signup' ? '✨' : '📱'}</div>
          <h2 className="text-2xl font-bold text-white">
            {isRecovery ? 'استعادة الحساب' : step === 'phone' ? 'الدخول السريع' : step === 'login' ? 'مرحباً بعودتك' : 'حساب جديد'}
          </h2>
          {!isRecovery && step !== 'phone' && (
             <p className="text-gray-400 text-sm mt-1">{identifier}</p>
          )}
        </div>
        <AnimatePresence>
          {error&&<motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0"/><span className="text-red-400 text-sm">{error}</span>
          </motion.div>}
        </AnimatePresence>

        {isRecovery ? (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            <h3 className="text-white text-xl font-bold">استعادة كلمة المرور</h3>
            <p className="text-gray-400 text-sm leading-relaxed px-4">
              لاستعادة حسابك بسرعة وأمان، يرجى الانتقال إلى المساعد الذكي الخاص بنا على تيليكرام.
            </p>
            <div className="pt-2">
              <a 
                href="https://t.me/souqbaghda_bot" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex w-full items-center justify-center gap-2 py-4 bg-[#2AABEE] text-white font-bold rounded-xl hover:bg-[#229ED9] transition-colors"
              >
                <span>الذهاب إلى البوت</span>
              </a>
            </div>
            <button type="button" onClick={() => setIsRecovery(false)} className="w-full text-center text-gray-400 hover:text-white text-sm mt-4">
              العودة لتسجيل الدخول
            </button>
          </div>
        ) : loading?<div className="flex flex-col items-center py-8"><Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3"/><p className="text-white">جاري التحميل...</p></div>:(
          step === 'phone' ? (
             <form onSubmit={handlePhoneSubmit} className="space-y-4">
               <div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                 <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="رقم الهاتف أو البريد الإلكتروني" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-4 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-lg" dir="rtl"/>
               </div>
               <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-lg mt-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">متابعة</button>
             </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {step === 'signup' && <div className="relative"><UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>}
              
              {step === 'signup' && <div className="grid grid-cols-1 gap-3">
                <select value={city} onChange={e=>setCity(e.target.value)} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none" title="اختر المدينة" aria-label="اختر المدينة">
                  {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select>
              </div>}
              
              <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" required autoFocus className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" title="إظهار أو إخفاء كلمة المرور" aria-label="إظهار أو إخفاء كلمة المرور">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
              
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                {step === 'login' ? 'تسجيل الدخول' : 'تأكيد وإنشاء الحساب'}
              </button>
              
              <div className="mt-4 flex flex-col items-center gap-3">
                 {step === 'login' && <button type="button" onClick={() => {setIsRecovery(true); setError('');}} className="text-amber-400 hover:text-amber-300 text-sm">نسيت كلمة المرور؟</button>}
                 <button type="button" onClick={() => {setStep('phone'); setError('');}} className="text-gray-400 hover:text-white text-sm">تغيير رقم الهاتف</button>
              </div>
            </form>
          )
        )}
      </motion.div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
function InfoDocsModal({ activeTab, onClose, user }: { activeTab: string; onClose: () => void; user?: any }) {
  const [tab, setTab] = useState(activeTab);
  const [contactForm, setContactForm] = useState({ name: '', email: '', msg: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setTab(activeTab);
    setSent(false);
  }, [activeTab]);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.msg.trim()) return;
    setSending(true);
    try {
      const payload: any = {
        name: contactForm.name.trim(),
        contact_info: contactForm.email.trim(),
        message: contactForm.msg.trim()
      };
      if (user) {
        payload.user_id = user.id;
      }
      const { error } = await supabase.from('support_messages').insert([payload]);
      if (error) throw error;
      setSent(true);
      setContactForm({ name: '', email: '', msg: '' });
    } catch (err: any) {
      alert('حدث خطأ أثناء إرسال الرسالة: ' + (err?.message || err));
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { id: 'من نحن', icon: <Info className="w-4 h-4" /> },
    { id: 'الشروط والأحكام', icon: <Shield className="w-4 h-4" /> },
    { id: 'سياسة الخصوصية', icon: <Lock className="w-4 h-4" /> },
    { id: 'تواصل معنا', icon: <Mail className="w-4 h-4" /> },
    { id: 'سجل التحديثات', icon: <Sparkles className="w-4 h-4" /> }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-gray-900 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col border border-gray-700 shadow-2xl z-[210] overflow-hidden text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-white font-bold text-lg">مركز المعلومات والسياسات</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors" title="إغلاق" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-800 bg-[#0c2b5e] p-2 gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSent(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {t.icon}
              <span>{t.id}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="wait">
            {tab === 'من نحن' && (
              <motion.div key="about" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div className="text-center py-4">
                  <span className="text-5xl">🇮🇶</span>
                  <h4 className="text-lg font-bold text-white mt-2">سوك بغداد — Souq Baghdad</h4>
                  <p className="text-amber-400 text-xs mt-1">منصة الإعلانات الرقمية العراقية الأولى</p>
                </div>
                <p>
                  <strong>سوك بغداد</strong> هو سوق رقمي وتطبيق إعلانات مجاني مصمم خصيصاً للمستخدم العراقي. نحن نسهل على الجميع في كافة المحافظات العراقية الـ 18 عرض منتجاتهم وسياراتهم وعقاراتهم وخدماتهم للبيع أو الإيجار بكل سهولة ويسر.
                </p>
                <p>
                  كما ننفرد بتقديم <strong>قسم الخطوط</strong> لمساعدة الطلاب والموظفين في العثور على خطوط نقل نقل يومية تناسب أوقاتهم وجامعاتهم، دعماً منا لتسهيل الحركة اليومية والتنقل الآمن.
                </p>
                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                  <h5 className="font-bold text-white mb-2">💡 رؤيتنا:</h5>
                  <p className="text-xs text-gray-400">تمكين الأفراد وأصحاب المشاريع الصغيرة في العراق من الوصول لأكبر قاعدة عملاء ممكنة دون قيود أو عمولات مرتفعة، مع الحفاظ على هوية وطنية عراقية أصيلة.</p>
                </div>
              </motion.div>
            )}

            {tab === 'الشروط والأحكام' && (
              <motion.div key="terms" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-bold text-xs mb-1">تنبيه وإخلاء مسؤولية قانوني هام</h4>
                    <p className="text-xs text-gray-400">سوك بغداد هو مجرد منصة إعلانية وسيطة (لوحة إعلانات). لا نملك السلع المعروضة، ولا نتحقق منها، ولا نضمن أي بائع أو مشتري. كافة المعاملات والاتفاقات تتم مباشرة بين الأطراف على مسؤوليتهم الشخصية والقانونية.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">1. شروط الاستخدام والأمان:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pr-2">
                    <li>يجب فحص السلع والممتلكات يدوياً وبدقة قبل إتمام أي عملية دفع.</li>
                    <li>ننصح بشدة بمقابلة الطرف الآخر وجهاً لوجه في <strong>أماكن عامة آمنة ومزدحمة</strong> (مثل المولات التجارية، المطاعم، أو الساحات العامة).</li>
                    <li>لا تقم بتحويل مبالغ مالية كعربون أو سلفة قبل استلام السلعة ومعاينتها.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">2. المحتوى والمواد المحظورة:</h4>
                  <p className="text-xs text-gray-400">يُمنع منعاً باتاً نشر أو بيع السلع والخدمات التالية:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pr-2">
                    <li>الأسلحة والمعدات العسكرية بجميع أنواعها.</li>
                    <li>المواد المخدرة والمسكرات والتبغ ومنتجاتها.</li>
                    <li>الأدوية والمستلزمات الطبية التي تتطلب ترخيصاً رسمياً.</li>
                    <li>السلع المسروقة أو المقلدة أو المقرصنة.</li>
                    <li>الإعلانات الوهمية أو الاحتيالية أو المضللة.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">3. حظر الحسابات والإعلانات:</h4>
                  <p className="text-xs text-gray-400">
                    لإدارة المنصة الحق الكامل في حذف أي إعلان أو إيقاف وحظر أي حساب مستخدم يتبين أنه يخالف هذه الشروط أو يقوم بسلوك مشبوه أو احتيالي، وذلك حماية لسلامة مجتمع "سوك بغداد".
                  </p>
                </div>
              </motion.div>
            )}

            {tab === 'سياسة الخصوصية' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  نحن في <strong>سوك بغداد</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيف نتعامل مع معلوماتك:
                </p>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">1. البيانات التي نجمعها:</h4>
                  <p className="text-xs text-gray-400">
                    عند إنشاء حساب أو نشر إعلان، نطلب منك تزويدنا بـ (الاسم، البريد الإلكتروني، رقم الهاتف، والمحافظة). تُخزن هذه المعلومات محلياً في متصفحك (localStorage) وفي قاعدة بياناتنا لتمكينك من إدارة إعلاناتك.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">2. علانية معلومات التواصل:</h4>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                    ⚠️ <strong>تنبيه:</strong> نظراً لأن المنصة تهدف لتسهيل التجارة المباشرة، فإن <strong>رقم الهاتف</strong>، <strong>الاسم</strong>، و<strong>الموقع</strong> التي تدرجها في إعلانك ستكون معلنة ومرئية للجميع لكي يتمكن المشترون من الاتصال بك أو مراسلتك عبر واتساب.
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">3. أمن البيانات:</h4>
                  <p className="text-xs text-gray-400">
                    نحن لا نقوم ببيع أو تأجير بياناتك لأي جهات خارجية. نستخدم تقنيات الحماية المتوفرة لتأمين قواعد البيانات ضد أي محاولة وصول غير مشروعة.
                  </p>
                </div>
              </motion.div>
            )}

            {tab === 'تواصل معنا' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  إذا كان لديك استفسار، شكوى، أو ترغب في الإبلاغ عن إعلان مخالف، يرجى ملء النموذج أدناه أو الاتصال بنا مباشرة:
                </p>

                {sent ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                    <h4 className="text-green-400 font-bold">شكراً لتواصلك معنا!</h4>
                    <p className="text-gray-300 text-xs">تم إرسال رسالتك بنجاح إلى فريق الدعم. سنقوم بمراجعتها والرد عليك في أقرب وقت ممكن.</p>
                    <button type="button" onClick={() => setSent(false)} className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-xl text-xs hover:bg-gray-700 transition-colors">إرسال رسالة أخرى</button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitContact} className="space-y-3">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">الاسم الكريم</label>
                      <input type="text" required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500" placeholder="اكتب اسمك هنا" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">البريد الإلكتروني أو رقم الهاتف</label>
                      <input type="text" required value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500" placeholder="للتواصل معك" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">نص الرسالة أو البلاغ</label>
                      <textarea required rows={3} value={contactForm.msg} onChange={e => setContactForm({ ...contactForm, msg: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500 resize-none" placeholder="كيف يمكننا مساعدتك؟" />
                    </div>
                    <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                      {sending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                    </motion.button>
                  </form>
                )}

                                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <p className="text-gray-400 text-xs text-center font-bold">تواصل معنا عبر منصاتنا الرسمية:</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <a 
                      href="tel:07700028170" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-bold rounded-2xl border border-blue-500/20 transition-all text-xs"
                    >
                      <Phone className="w-4 h-4" />
                      <span>اتصال هاتفي</span>
                    </a>
                    
                    <a 
                      href="https://wa.me/9647700028170" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 font-bold rounded-2xl border border-green-500/20 transition-all text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <span>واتساب الدعم</span>
                    </a>
                    
                    <a 
                      href="https://instagram.com/SOUQBAGHDAD.IQ" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300 font-bold rounded-2xl border border-pink-500/20 transition-all text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      <span>انستغرام المنصة</span>
                    </a>
                    
                    <a 
                      href="https://t.me/SOUQBAGHDA" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 font-bold rounded-2xl border border-sky-500/20 transition-all text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0C5.344 0 0 5.344 0 12c0 6.656 5.344 12 12 12 6.656 0 12-5.344 12-12C24 5.344 18.656 0 11.944 0zm5.892 8.046c-.144.9-.99 5.874-1.44 8.286-.192 1.014-.564 1.356-.924 1.392-.786.072-1.386-.516-2.148-1.014-.762-.5-1.188-.81-1.926-1.296-.852-.564-.3-.876.186-1.38.126-.132 2.334-2.136 2.376-2.316.006-.024.012-.114-.042-.162-.054-.048-.132-.03-.186-.018-.084.018-1.392.882-3.924 2.592-.372.258-.708.384-1.008.378-.33-.006-.966-.186-1.44-.342-.582-.192-1.044-.294-1.002-.624.024-.168.252-.342.69-.516 2.688-1.17 4.482-1.938 5.388-2.31 2.562-1.056 3.096-1.242 3.444-1.248.078 0 .252.018.366.114.096.084.12.198.132.282.012.072.024.228.012.384z"/></svg>
                      <span>تليكرام المنصة</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'سجل التحديثات' && (
              <motion.div key="changelog" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 text-right">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                  <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-amber-400"/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-bold text-xl">سجل التحديثات والإصدارات</h2>
                      <span className="px-2.5 py-0.5 bg-amber-500 text-black font-extrabold text-xs rounded-full">v1.6.0</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">تتبع التغييرات والميزات المضافة في كل إصدار</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* v1.6.0 */}
                  <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-amber-950/20 border border-amber-500/40 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                      الإصدار الأخير
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-sm">⚡ الإصدار v1.6.0 (تحسين الأداء وفصل المكونات)</span>
                      <span className="text-gray-400 text-xs font-mono">(06/07/2026)</span>
                    </div>
                    <ul className="text-gray-300 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>تحسين سرعة التحميل:</strong> تطبيق تقنية Lazy Loading والمكونات المنفصلة.</li>
                      <li><strong>سجل التحديثات:</strong> إتاحة سجل التحديثات لجميع المستخدمين من خلال الفوتر.</li>
                      <li><strong>مشاركة الروابط:</strong> إصلاح وتحسين نظام مشاركة روابط الملفات الشخصية.</li>
                    </ul>
                  </div>

                  {/* v1.5.0 */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">🤖 الإصدار v1.5.0 (المساعد الذكي)</span>
                      <span className="text-gray-500 text-xs font-mono">(04/07/2026)</span>
                    </div>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li>تحويل بوت التيليكرام إلى مساعد تفاعلي ذكي للاستعادة.</li>
                      <li>نظام توليد آمن لكلمات المرور بضغطة زر.</li>
                    </ul>
                  </div>
                  
                  {/* v1.4.0 */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">🚀 الإصدار v1.4.0 (النسخة الاحترافية)</span>
                      <span className="text-gray-500 text-xs font-mono">(02/07/2026)</span>
                    </div>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li>تثبيت العدادات عند التمرير وإضافة رسالة التحميل التفاعلية.</li>
                      <li>توحيد فئات المنتجات في المتجر والفورم.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Image Lightbox Modal with Watermark Download
// ─────────────────────────────────────────────
function ImageLightboxModal({ src, title, images, initialIdx = 0, onClose }: { src: string; title: string; images?: string[]; initialIdx?: number; onClose: () => void }) {
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
        setCurrentIdx(i => (i + 1) % totalCount);
      } else if (distance < -35) {
        setCurrentIdx(i => (i - 1 + totalCount) % totalCount);
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

// ─────────────────────────────────────────────
// Ad Card
// ─────────────────────────────────────────────
function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{
  ad:Ad; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(id:string)=>void; onActionMenu?:(e:React.MouseEvent)=>void;
  sellerRole?: string;
}) {
  const onlineStatuses = useOnlineStatuses();
  const time = useRelativeTime(ad.createdAtISO);
  return (
    <motion.div whileHover={{y:-4}} onClick={onSelect} onContextMenu={onActionMenu}
      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
        <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={ad.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
        {isNewItem(ad.createdAtISO) && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-extrabold rounded-lg z-10 shadow-lg shadow-red-500/25 border border-red-400/30 animate-pulse">
            حديث ✨
          </div>
        )}
        {ad.type==='rent'&&<div className={`absolute px-2 py-0.5 bg-blue-500 rounded-full text-[10px] font-bold text-white transition-all ${isNewItem(ad.createdAtISO) ? 'top-8 left-2' : 'top-2 left-2'}`}>للإيجار</div>}
        <button onClick={onFav} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${isFav?'bg-red-500':'bg-black/50 hover:bg-black/70'} transition-colors`} title={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"} aria-label={isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}>
          <Heart className={`w-4 h-4 text-white ${isFav?'fill-current':''}`}/></button>
        {ad.seller?.isVerified&&<div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center gap-1"><Shield className="w-2.5 h-2.5"/>موثق</div>}
        {ad.status==='sold'&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]"><span className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-red-500/30 shadow-lg">🚫 تم البيع</span></div>}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{ad.title}</h3>
        <p className="text-lg font-bold text-amber-400 mb-2">{formatPrice(ad.price)} <span className="text-xs text-gray-400">د.ع</span></p>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2 flex-1"><MapPin className="w-3 h-3 flex-shrink-0"/><span className="line-clamp-1">{ad.location}</span></div>
        <div className="flex items-center justify-between mt-auto">
          <button onClick={e=>{e.stopPropagation();onSellerClick?.(ad.postedBy||'');}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity relative">
            <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-5 h-5 rounded-full object-cover ${getGlowClass(sellerRole)}`}/>
            {onlineStatuses[ad.postedBy||''] && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-800" title="متصل الآن"></div>}
            <span className="text-gray-400 text-xs truncate max-w-[80px]">{ad.seller?.name || 'مستخدم'}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span className="text-green-400 font-medium">{time}</span>
            <span className="flex items-center gap-0.5"><ViewIcon className="w-3 h-3"/>{ad.views}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────
function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{
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

// ─────────────────────────────────────────────
// Ad Detail Modal
// ─────────────────────────────────────────────
function AdDetailModal({ ad, onClose, isFav, onFav, user, storedUsers = [], onAuthRequired, onSellerClick, onViewDurationLogged, onImageZoom }:{
  ad:Ad|null; onClose:()=>void; isFav:boolean; onFav:()=>void; user:User|null; storedUsers?:any[]; onAuthRequired:()=>void; onSellerClick?:(sellerId:string)=>void;
  onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string, images?:string[], initialIdx?:number)=>void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const onlineStatuses = useOnlineStatuses();

  useEffect(()=>{
    setImgIdx(0);
    if (ad) {
      recordItemView(ad.id, 'ad', user, ad.postedBy);
    }
  },[ad]);

  useEffect(() => {
    const start = Date.now();
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed >= 1 && ad) {
        onViewDurationLogged?.(elapsed);
      }
    };
  }, [ad?.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const total = ad?.images?.length || 0;
    if (total <= 1) return;

    if (distance > 35) {
      setImgIdx(i => (i + 1) % total);
    } else if (distance < -35) {
      setImgIdx(i => (i - 1 + total) % total);
    }
  };

  if(!ad) return null;
  const totalImgs = ad.images?.length || 0;
  const liveSeller = storedUsers.find(u => String(u.id) === String(ad.postedBy)) || ad.seller;
  const isOnline = Boolean(ad.postedBy && onlineStatuses[ad.postedBy]);
  const catObj = CATEGORIES.find(c => c.id === ad.category);
  const catName = catObj ? `${catObj.emoji} ${catObj.name}` : ad.category || 'عام';

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <InterestTimer itemId={ad.id} itemType="ad" />
        <div className="relative">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="aspect-video overflow-hidden rounded-t-3xl bg-gray-800 relative group touch-pan-y"
          >
            <img src={ad.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={ad.title}
              decoding="async"
              fetchPriority="high"
              onClick={() => onImageZoom?.(ad.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700', ad.title, ad.images, imgIdx)}
              className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all duration-300"/>
            
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
              <span>🔍 اضغط لتكبير وتحميل الصورة</span>
            </div>

            {totalImgs > 1 && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1">
                <span>👈 اسحب باللمس للتقليب 👉</span>
              </div>
            )}
          </div>

          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
          <button 
            onClick={async () => {
              if(!user) { onAuthRequired(); return; }
              const reason = window.prompt('يرجى كتابة سبب الإبلاغ عن هذا الإعلان:');
              if (!reason) return;
              const { error } = await supabase.from('support_messages').insert({
                name: `REPORT: ${ad.title}`,
                contact_info: `${user.name} (${user.phone || user.id})`,
                message: JSON.stringify({ item_id: ad.id, item_type: 'ad', reason }),
                user_id: user.id
              });
              if (!error) {
                alert('تم تقديم البلاغ بنجاح وسيتم مراجعته من قبل الإدارة. شكراً لك! 🚩');
              } else {
                alert('حدث خطأ أثناء إرسال البلاغ.');
              }
            }} 
            className="absolute top-3 right-14 p-2 bg-black/60 rounded-xl text-red-400 z-10 hover:bg-red-950/60 flex items-center gap-1 font-bold text-xs"
            title="إبلاغ عن محتوى مخالف"
          >
            <span>🚩</span> إبلاغ
          </button>
          {totalImgs > 1 && <>
            <button onClick={()=>setImgIdx(i=>(i - 1 + totalImgs) % totalImgs)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-xl text-white z-10 transition-all" title="الصورة السابقة" aria-label="الصورة السابقة"><ChevronRight className="w-6 h-6"/></button>
            <button onClick={()=>setImgIdx(i=>(i + 1) % totalImgs)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-xl text-white z-10 transition-all" title="الصورة التالية" aria-label="الصورة التالية"><ChevronLeft className="w-6 h-6"/></button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">{ad.images?.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`h-2 rounded-full transition-all ${i===imgIdx?'w-6 bg-amber-400':'w-2 bg-white/60'}`} title={`عرض الصورة ${i + 1}`} aria-label={`عرض الصورة ${i + 1}`}/>)}</div>
          </>}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
                  {catName}
                </span>
                <div className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-700 text-xs text-gray-400">
                  <span>{ad.short_id ? `#${ad.short_id}` : `#${String(ad.id).substring(0, 5)}`}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(ad.short_id || String(ad.id).substring(0, 5))); alert('تم نسخ رقم الإعلان!'); }} className="text-amber-400 hover:text-amber-300" title="نسخ رقم الإعلان" aria-label="نسخ رقم الإعلان">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{ad.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{ad.location}</span>
                <TimeAgo iso={ad.createdAtISO} className="text-green-400 font-medium"/>
                <button onClick={() => setShowViewers(true)} className="flex items-center gap-1 text-xs hover:text-amber-400 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Eye className="w-3.5 h-3.5"/><span>{ad.views} مشاهدة</span>
                </button>
              </div>
            </div>
            <div className="text-left shrink-0"><p className="text-2xl font-bold text-amber-400">{formatPrice(ad.price)}</p><p className="text-gray-400 text-xs">دينار عراقي</p></div>
          </div>
          <AnimatePresence>
            {showViewers && (
              <Suspense fallback={null}>
                <ViewersModal itemId={ad.id} itemType="ad" onClose={() => setShowViewers(false)} />
              </Suspense>
            )}
          </AnimatePresence>
          {ad.description&&<div className="bg-gray-800 rounded-xl p-4 mb-4"><h3 className="text-white font-bold text-sm mb-2">الوصف</h3><p className="text-gray-300 text-sm leading-relaxed">{ad.description}</p></div>}
          {/* Seller */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="relative hover:opacity-80 transition-opacity shrink-0">
                <img src={liveSeller?.avatar || ad.seller?.avatar || DEFAULT_AVATAR} alt="" className={`w-12 h-12 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-transparent shadow-sm shadow-[#0c2b5e]/10 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'أوفلاين'} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="text-white font-bold text-sm hover:text-amber-400 truncate">{liveSeller?.name || ad.seller?.name || 'مستخدم'}</button>
                  {liveSeller?.isVerified && <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                  </span>
                  <div className="flex items-center gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} className={`w-3 h-3 ${i<Math.floor(liveSeller?.rating || ad.seller?.rating || 4.8)?'fill-amber-400 text-amber-400':'text-gray-600'}`}/>)}</div>
                </div>
              </div>
              <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="text-xs text-amber-400 hover:underline flex items-center gap-1 shrink-0">صفحة البائع<ChevronRight className="w-3 h-3"/></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.a href={getWhatsAppLink(ad.phone, ad.type === 'transport' ? 'transport' : 'product', { id: ad.id, short_id: ad.short_id, title: ad.title, location: ad.location, university: ad.description, time: 'راجع الإعلان' })} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl text-sm">
              <MessageSquare className="w-5 h-5"/> واتساب</motion.a>
            <motion.a href={`tel:${ad.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white font-bold rounded-xl text-sm">
              <PhoneIcon className="w-5 h-5"/> اتصال</motion.a>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{if(!user){onAuthRequired();return;}onFav();}}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${isFav?'bg-red-500 text-white':'bg-gray-800 text-white'}`}>
              <Heart className={`w-4 h-4 ${isFav?'fill-current':''}`}/>{isFav?'في المفضلة':'أضف للمفضلة'}</button>
            <button onClick={()=>{
              const slugify = (text: string) => {
                return text
                  .toString()
                  .toLowerCase()
                  .trim()
                  .replace(/[\s_]+/g, '-')
                  .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
                  .replace(/--+/g, '-');
              };
              const typeText = ad.type === 'buy' ? 'شراء' : ad.type === 'rent' ? 'ايجار' : ad.type === 'service' ? 'خدمات' : 'بيع';
              const categoryText = ad.category || 'عام';
              const titleText = ad.title || 'اعلان';
              const govText = ad.governorate || ad.location || 'العراق';
              const slug = `${slugify(typeText)}-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
              handleUniversalShare({ 
                id: ad.id, 
                short_id: ad.short_id, 
                title: ad.title, 
                location: ad.location, 
                price: ad.price, 
                image: ad.images?.[0], 
                description: ad.description,
                url: `/ad/${slug}-${ad.short_id || ad.id}`
              });
            }}
              className="flex-1 py-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-amber-500/30">
              <Share2 className="w-4 h-4"/> مشاركة</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Product Detail Modal
// ─────────────────────────────────────────────
function ProductDetailModal({ product, onClose, isFav, onFav, user, storedUsers = [], onAuthRequired, onSellerClick, onViewDurationLogged, onImageZoom }:{
  product:Product|null; onClose:()=>void; isFav:boolean; onFav:()=>void; user:User|null; storedUsers?:any[]; onAuthRequired:()=>void; onSellerClick?:(id:any)=>void;
  onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string, images?:string[], initialIdx?:number)=>void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const onlineStatuses = useOnlineStatuses();

  useEffect(()=>{
    setImgIdx(0);
    if (product) {
      recordItemView(product.id, 'product', user, product.postedBy);
    }
  },[product]);

  useEffect(() => {
    const start = Date.now();
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed >= 1 && product) {
        onViewDurationLogged?.(elapsed);
      }
    };
  }, [product?.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const total = product?.images?.length || 0;
    if (total <= 1) return;

    if (distance > 35) {
      setImgIdx(i => (i + 1) % total);
    } else if (distance < -35) {
      setImgIdx(i => (i - 1 + total) % total);
    }
  };

  if(!product) return null;
  const totalImgs = product.images?.length || 0;
  const liveSeller = storedUsers.find(u => String(u.id) === String(product.postedBy)) || product.seller;
  const isOnline = !!onlineStatuses[product.postedBy];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <InterestTimer itemId={product.id} itemType="product" />
        <div className="relative">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="aspect-video overflow-hidden rounded-t-3xl bg-gray-800 relative group touch-pan-y"
          >
            <img src={product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={product.title}
              decoding="async"
              fetchPriority="high"
              onClick={() => onImageZoom?.(product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700', product.title, product.images, imgIdx)}
              className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all duration-300"/>
            
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
              <span>🔍 اضغط لتكبير وتحميل الصورة</span>
            </div>

            {totalImgs > 1 && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1">
                <span>👈 اسحب باللمس للتقليب 👉</span>
              </div>
            )}
          </div>

          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white z-10 hover:bg-black/80" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
          <button 
            onClick={async () => {
              if(!user) { onAuthRequired(); return; }
              const reason = window.prompt('يرجى كتابة سبب الإبلاغ عن هذا المنتج:');
              if (!reason) return;
              const { error } = await supabase.from('support_messages').insert({
                name: `REPORT: ${product.title}`,
                contact_info: `${user.name} (${user.phone || user.id})`,
                message: JSON.stringify({ item_id: product.id, item_type: 'product', reason })
              });
              if (!error) {
                alert('تم تقديم البلاغ بنجاح وسيتم مراجعته من قبل الإدارة. شكراً لك! 🚩');
              } else {
                alert('حدث خطأ أثناء إرسال البلاغ.');
              }
            }} 
            className="absolute top-3 right-14 p-2 bg-black/60 rounded-xl text-red-400 z-10 hover:bg-red-950/60 flex items-center gap-1 font-bold text-xs"
            title="إبلاغ عن محتوى مخالف"
          >
            <span>🚩</span> إبلاغ
          </button>
          {totalImgs > 1 && <>
            <button onClick={()=>setImgIdx(i=>(i - 1 + totalImgs) % totalImgs)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-xl text-white z-10 transition-all" title="الصورة السابقة" aria-label="الصورة السابقة"><ChevronRight className="w-6 h-6"/></button>
            <button onClick={()=>setImgIdx(i=>(i + 1) % totalImgs)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-xl text-white z-10 transition-all" title="الصورة التالية" aria-label="الصورة التالية"><ChevronLeft className="w-6 h-6"/></button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">{product.images?.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`h-2 rounded-full transition-all ${i===imgIdx?'w-6 bg-amber-400':'w-2 bg-white/60'}`} title={`عرض الصورة ${i + 1}`} aria-label={`عرض الصورة ${i + 1}`}/>)}</div>
          </>}
          <div className="absolute top-3 left-12 px-3 py-1 rounded-full text-xs font-bold text-white z-10" style={{background:product.condition==='new'?'#22c55e':'#f59e0b'}}>
            {product.condition==='new'?'جديد':'مستعمل'}</div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
                  🛍️ منتج للتسوق
                </span>
                <div className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-700 text-xs text-gray-400">
                  <span>{product.short_id ? `#${product.short_id}` : `#${String(product.id).substring(0, 5)}`}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(String(product.short_id || String(product.id).substring(0, 5))); alert('تم نسخ رقم المنتج!'); }} className="text-amber-400 hover:text-amber-300" title="نسخ رقم المنتج" aria-label="نسخ رقم المنتج">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{product.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{product.governorate}</span>
                <TimeAgo iso={product.createdAtISO} className="text-green-400 font-medium"/>
                <button onClick={() => setShowViewers(true)} className="flex items-center gap-1 text-xs hover:text-amber-400 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                  <Eye className="w-3.5 h-3.5"/><span>{product.views} مشاهدة</span>
                </button>
              </div>
            </div>
            <div className="text-left shrink-0"><p className="text-2xl font-bold text-amber-400">{formatPrice(product.price)}</p><p className="text-gray-400 text-xs">دينار عراقي</p></div>
          </div>
          <AnimatePresence>
            {showViewers && (
              <Suspense fallback={null}>
                <ViewersModal itemId={product.id} itemType="product" onClose={() => setShowViewers(false)} />
              </Suspense>
            )}
          </AnimatePresence>
          {product.stock>0&&<div className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full mb-3"><Package className="w-3 h-3"/>متوفر: {product.stock} قطعة</div>}
          {product.description&&<div className="bg-gray-800 rounded-xl p-4 mb-4"><h3 className="text-white font-bold text-sm mb-2">الوصف</h3><p className="text-gray-300 text-sm leading-relaxed">{product.description}</p></div>}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="relative hover:opacity-80 transition-opacity shrink-0">
                <img src={liveSeller?.avatar || product.seller?.avatar || DEFAULT_AVATAR} alt="" className={`w-12 h-12 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-transparent shadow-sm shadow-[#0c2b5e]/10 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'أوفلاين'} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-white font-bold text-sm hover:text-amber-400 truncate">{liveSeller?.name || product.seller?.name || 'مستخدم'}</button>
                  {liveSeller?.isVerified && <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                  </span>
                  <p className="text-gray-400 text-xs">{liveSeller?.location || product.seller?.location || 'بغداد'}</p>
                </div>
              </div>
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-xs text-amber-400 hover:underline flex items-center gap-1 shrink-0">صفحة البائع<ChevronRight className="w-3 h-3"/></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.a href={getWhatsAppLink(product.phone, 'product', { id: product.id, short_id: product.short_id, title: product.title, location: product.governorate })} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl text-sm">
              <MessageSquare className="w-5 h-5"/> واتساب</motion.a>
            <motion.a href={`tel:${product.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white font-bold rounded-xl text-sm">
              <PhoneIcon className="w-5 h-5"/> اتصال</motion.a>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{if(!user){onAuthRequired();return;}onFav();}}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${isFav?'bg-red-500 text-white':'bg-gray-800 text-white'}`}>
              <Heart className={`w-4 h-4 ${isFav?'fill-current':''}`}/>{isFav?'في المفضلة':'أضف للمفضلة'}</button>
            <button onClick={()=>{
              const slugify = (text: string) => {
                return text
                  .toString()
                  .toLowerCase()
                  .trim()
                  .replace(/[\s_]+/g, '-')
                  .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
                  .replace(/--+/g, '-');
              };
              const categoryText = product.category || 'منتجات';
              const titleText = product.title || 'منتج';
              const govText = product.governorate || 'العراق';
              const slug = `تسوق-${slugify(categoryText)}-${slugify(titleText)}-${slugify(govText)}-سوق-بغداد-الرقمي`;
              handleUniversalShare({ 
                id: product.id, 
                short_id: product.short_id, 
                title: product.title, 
                governorate: product.governorate, 
                price: formatPrice(product.price), 
                image: product.images?.[0], 
                description: product.description,
                url: `/product/${slug}-${product.short_id || product.id}`
              });
            }}
              className="flex-1 py-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-amber-500/30">
              <Share2 className="w-4 h-4"/> مشاركة</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TransportDetailModal({ ad, onClose, user, onAuthRequired, onViewDurationLogged, storedUsers }:{
  ad:TransportAd|null; onClose:()=>void; user:User|null; onAuthRequired:()=>void;
  onViewDurationLogged?:(seconds:number)=>void;
  storedUsers?: any[];
}) {
  const [showViewers, setShowViewers] = useState(false);
  useEffect(()=>{
    if (ad) {
      recordItemView(ad.id, 'transport', user, ad.postedBy);
    }
  },[ad]);

  useEffect(() => {
    const start = Date.now();
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed >= 1 && ad) {
        onViewDurationLogged?.(elapsed);
      }
    };
  }, [ad?.id]);

  if(!ad) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10 p-6">
        <InterestTimer itemId={ad.id} itemType="transport" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-400"/>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{ad.type === 'offer' ? 'خط متوفر' : 'طلب خط'} إلى {ad.university}</h2>
              <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400"/> <span>{ad.regions}</span>
                {ad.short_id && (
                  <span className="mr-1 text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">#{ad.short_id}</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-white" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
            <p className="text-gray-400 text-[10px] mb-0.5">الدوام</p>
            <p className="text-white font-bold text-xs">{ad.shift}</p>
          </div>
          {ad.type === 'offer' && (
            <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
              <p className="text-gray-400 text-[10px] mb-0.5">المقاعد</p>
              <p className="text-emerald-400 font-bold text-xs">{ad.seats} متاح</p>
            </div>
          )}
          <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
            <p className="text-gray-400 text-[10px] mb-0.5">الفئة</p>
            <p className="text-white font-bold text-xs">{ad.targetAudience}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700">
            <p className="text-gray-400 text-[10px] mb-0.5">المركبة</p>
            <p className="text-white font-bold text-xs">{ad.vehicleType}</p>
          </div>
        </div>

        {ad.price && (
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-4 bg-amber-500/10 px-3 py-2 rounded-lg inline-flex">
            <Tag className="w-4 h-4"/>
            <span>السعر المفضل: {ad.price}</span>
          </div>
        )}

        {ad.note && (
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <h3 className="text-white font-bold text-xs mb-1.5">ملاحظات إضافية</h3>
            <p className="text-gray-300 text-xs leading-relaxed">{ad.note}</p>
          </div>
        )}

        {/* Views & Date */}
        <div className="flex items-center justify-between mb-5 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowViewers(true)} className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full hover:bg-emerald-500/20">
              <Eye className="w-3.5 h-3.5"/> <span>{ad.views} مشاهدة</span>
            </button>
            <span>•</span>
            <span className="text-amber-400 font-bold">الاهتمام: {ad.interest}</span>
          </div>
          <TimeAgo iso={ad.createdAt} />
        </div>

        {/* Seller Info */}
        {(() => {
          const liveSeller = storedUsers?.find(u=>u.id===ad.postedBy);
          return (
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-5 flex items-center gap-3">
              <img src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={`w-10 h-10 rounded-full object-cover ${liveSeller?.role && liveSeller.role !== 'user' ? getGlowClass(liveSeller.role) : 'border border-gray-600'}`}/>
              <div>
                <span className="text-white font-bold text-sm block">{ad.sellerName}</span>
                <span className="text-gray-400 text-xs">صاحب الإعلان</span>
              </div>
            </div>
          );
        })()}

        {/* Call Actions */}
        <div className="grid grid-cols-3 gap-2">
          <motion.a href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
            whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-1.5 py-3 bg-green-500 text-white font-bold rounded-xl text-xs">
            <MessageSquare className="w-4 h-4"/> واتساب
          </motion.a>
          <motion.button
            onClick={() => handleUniversalShare({ id: ad.id, short_id: ad.short_id, university: ad.university, type: ad.type, regions: ad.regions, price: ad.price, url: `/transport/card/${ad.short_id || ad.id}` })}
            whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-1.5 py-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-xl text-xs hover:bg-amber-500/30">
            <Share2 className="w-4 h-4"/> مشاركة
          </motion.button>
          <motion.a href={`tel:${ad.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-1.5 py-3 bg-blue-500 text-white font-bold rounded-xl text-xs">
            <PhoneIcon className="w-4 h-4"/> اتصال
          </motion.a>
        </div>

        <AnimatePresence>
          {showViewers && (
            <Suspense fallback={null}>
              <ViewersModal itemId={ad.id} itemType="transport" onClose={() => setShowViewers(false)} />
            </Suspense>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Ad Form Modal (Create / Edit)
// ─────────────────────────────────────────────
function AdFormModal({ isOpen, onClose, onSubmit, user, editAd }:{
  isOpen:boolean; onClose:()=>void; onSubmit:(ad:Ad)=>void; user:User; editAd?:Ad|null;
}) {
  const isEdit = !!editAd;
  const [tab, setTab] = useState<'form'|'preview'>('form');
  const [fd, setFd] = useState({ title:editAd?.title||'', price:editAd?.price?formatPrice(editAd.price):'', description:editAd?.description||'', category:editAd?.category||'cars', governorate:editAd?.governorate||user?.location||'بغداد', phone:editAd?.phone||user?.phone||'', type:editAd?.type||'sell' });
  const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>((editAd?.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)}))||[]));
  const [uploading, setUploading] = useState(false); const [pct, setPct] = useState(0);
  const playSound = useSound();
  useEffect(()=>{ if(editAd){ setFd({title:editAd.title,price:formatPrice(editAd.price),description:editAd.description,category:editAd.category,governorate:editAd.governorate,phone:editAd.phone,type:editAd.type}); setImages(editAd.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)})) || []); } },[editAd]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    const files = Array.from(e.target.files);
    for(const file of files){
      const uid = Math.random().toString(36).substring(2, 9);
      setImages(prev=>[...prev,{preview:'',progress:0,_uid:uid}]);
      let p=0;
      const iv=setInterval(()=>{
        p=Math.min(p+Math.random()*30,85);
        setImages(prev=>prev.map(img=>img._uid===uid&&img.progress<100?{...img,progress:p}:img));
      },120);
      try {
        const url = await uploadImageToStorage(file);
        clearInterval(iv);
        setImages(prev=>prev.map(img=>img._uid===uid?{...img,preview:url,progress:100}:img));
      } catch (err) {
        clearInterval(iv);
        setImages(prev=>prev.filter(img=>img._uid!==uid));
      }
    }
  };
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setUploading(true); playSound('click');
    for(let i=0;i<=100;i+=20){await new Promise(r=>setTimeout(r,100));setPct(i);}
    const ad:Ad = { id:isEdit?editAd!.id:Date.now(), title:fd.title, price:fd.price.replace(/,/g,''), governorate:fd.governorate, location:fd.governorate, phone:fd.phone, category:fd.category,
      images:images.filter(i=>i.preview).map(i=>i.preview).concat(images.length===0?['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700']:[]),
      seller:{name:user.name,avatar:user.avatar,isVerified:user.isVerified,rating:user.rating||5,joinedDate:user.joinedDate,location:user.location},
      time:'الآن', createdAtISO:isEdit?(editAd?.createdAtISO||new Date().toISOString()):new Date().toISOString(), views:isEdit?(editAd?.views||0):0,
      status:'active', type:fd.type, description:fd.description, adCount:user.stats.ads+1, soldCount:0, responseRate:100, avgResponseTime:'5 دقائق', postedBy:user.id };
    setUploading(false); playSound('success'); onSubmit(ad); onClose();
    if(!isEdit){setFd({title:'',price:'',description:'',category:'cars',governorate:user?.location||'بغداد',phone:user?.phone||'',type:'sell'});setImages([]);}
    setTab('form');
  };
  const fmt = (v:string) => v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  const cats = CATEGORIES.filter(c=>c.id!=='all'&&c.id!=='games');
  if(!isOpen) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">{isEdit&&<div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center"><Edit2 className="w-4 h-4 text-amber-400"/></div>}
            <h2 className="text-xl font-bold text-white">{isEdit?'تعديل الإعلان':'رفع إعلان جديد'}</h2></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex border-b border-gray-700">
          {(['form','preview'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-3 text-sm font-bold ${tab===t?'text-amber-400 border-b-2 border-amber-400':'text-gray-400'}`}>{t==='form'?'📝 بيانات الإعلان':'👁️ معاينة'}</button>
          ))}
        </div>
        {tab==='form'?(
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">{['sell','rent'].map(t=>(
              <button key={t} type="button" onClick={()=>setFd({...fd,type:t})} className={`py-3 rounded-xl font-bold text-sm ${fd.type===t?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t==='sell'?'للبيع':'للإيجار'}</button>
            ))}</div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">القسم</label>
              <div className="grid grid-cols-4 gap-2">{cats.map(c=>(
                <button key={c.id} type="button" onClick={()=>setFd({...fd,category:c.id})} className={`p-2 rounded-xl flex flex-col items-center gap-1 text-xs ${fd.category===c.id?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  <span className="text-lg">{c.emoji}</span><span>{c.name}</span></button>
              ))}</div></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">عنوان الإعلان</label>
              <input value={fd.title} onChange={e=>setFd({...fd,title:e.target.value})} placeholder="مثال: Toyota Land Cruiser 2024" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">السعر (دينار عراقي)</label>
              <input value={fmt(fd.price)} onChange={e=>setFd({...fd,price:fmt(e.target.value)})} placeholder="مثال: 850,000,000" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none text-lg font-bold"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-300 text-xs font-medium mb-2 block">المحافظة</label>
                <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none" title="اختر المحافظة" aria-label="اختر المحافظة">
                  {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select></div>
              <div><label className="text-gray-300 text-xs font-medium mb-2 block">رقم الهاتف</label>
                <input value={fd.phone} onChange={e=>setFd({...fd,phone:e.target.value})} placeholder="07XXXXXXXXX" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
            </div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">الوصف</label>
              <textarea value={fd.description} onChange={e=>setFd({...fd,description:e.target.value})} placeholder="اكتب وصفاً مفصلاً..." rows={3} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none resize-none"/></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">الصور ({images.filter(i=>i.preview).length}/10)</label>
              <div className="grid grid-cols-4 gap-2">
                {images.map((img,i)=>(
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-800">
                    {img.preview?<img src={img.preview} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full bg-gray-700 animate-pulse"/>}
                    {img.progress<100&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-3/4 h-1 bg-gray-600 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{width:`${img.progress}%`}}/></div></div>}
                    <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center" title="حذف الصورة" aria-label="حذف الصورة"><X className="w-3 h-3 text-white"/></button>
                  </div>
                ))}
                {images.length<10&&<label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500">
                  <ImagePlus className="w-6 h-6 text-gray-500"/><span className="text-[10px] text-gray-500 mt-1">إضافة</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/></label>}
              </div></div>
            <div className="flex gap-3">
              <button type="button" onClick={()=>setTab('preview')} className="flex-1 py-3 bg-gray-800 text-amber-400 font-bold rounded-xl text-sm border border-amber-500/30">👁️ معاينة</button>
              <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={uploading}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading?<><Loader2 className="w-4 h-4 animate-spin"/>{pct}%</>:<><Save className="w-4 h-4"/>{isEdit?'حفظ التعديلات':'نشر الإعلان'}</>}</motion.button>
            </div>
          </form>
        ):(
          <div className="p-5">
            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
              <div className="aspect-[4/3]"><img src={images[0]?.preview||'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-full h-full object-cover"/></div>
              <div className="p-4"><h3 className="text-white font-bold mb-1">{fd.title||'عنوان الإعلان'}</h3>
                <p className="text-xl font-bold text-amber-400 mb-2">{formatPrice(fd.price||'0')} <span className="text-xs text-gray-400">د.ع</span></p>
                <p className="text-gray-400 text-xs">{fd.governorate} • {fd.description?.slice(0,60)||'وصف الإعلان'}</p></div>
            </div>
            <button onClick={()=>setTab('form')} className="mt-4 w-full py-3 bg-gray-800 text-amber-400 font-bold rounded-xl text-sm">← تعديل البيانات</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Product Form Modal (Create / Edit)
// ─────────────────────────────────────────────
function ProductFormModal({ isOpen, onClose, onSubmit, user, editProduct }:{
  isOpen:boolean; onClose:()=>void; onSubmit:(p:Product)=>void; user:User; editProduct?:Product|null;
}) {
  const isEdit = !!editProduct;
  const [fd, setFd] = useState({ title:editProduct?.title||'', price:editProduct?.price?formatPrice(editProduct.price):'', description:editProduct?.description||'', category:editProduct?.category||'electronics', governorate:editProduct?.governorate||user?.location||'بغداد', phone:editProduct?.phone||user?.phone||'', condition:(editProduct?.condition||'new') as 'new'|'used', stock:editProduct?.stock||1 });
  const [images, setImages] = useState<{preview:string;progress:number;_uid?:string}[]>((editProduct?.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)}))||[]));
  const [uploading, setUploading] = useState(false); const [pct, setPct] = useState(0);
  const playSound = useSound();
  useEffect(()=>{if(editProduct){setFd({title:editProduct.title,price:formatPrice(editProduct.price),description:editProduct.description,category:editProduct.category,governorate:editProduct.governorate,phone:editProduct.phone,condition:editProduct.condition,stock:editProduct.stock});setImages(editProduct.images?.map(img=>({preview:img,progress:100,_uid:Math.random().toString(36).substring(2,9)})) || []);}},[editProduct]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    for(const file of Array.from(e.target.files)){
      const uid = Math.random().toString(36).substring(2, 9);
      setImages(prev=>[...prev,{preview:'',progress:0,_uid:uid}]);
      let p=0;
      const iv=setInterval(()=>{
        p=Math.min(p+Math.random()*30,85);
        setImages(prev=>prev.map(img=>img._uid===uid&&img.progress<100?{...img,progress:p}:img));
      },120);
      try {
        const url = await uploadImageToStorage(file);
        clearInterval(iv);
        setImages(prev=>prev.map(img=>img._uid===uid?{...img,preview:url,progress:100}:img));
      } catch (err) {
        clearInterval(iv);
        setImages(prev=>prev.filter(img=>img._uid!==uid));
      }
    }
  };
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setUploading(true); playSound('click');
    for(let i=0;i<=100;i+=20){await new Promise(r=>setTimeout(r,100));setPct(i);}
    const p:Product = { id:isEdit?editProduct!.id:Date.now(), title:fd.title, price:fd.price.replace(/,/g,''), description:fd.description, category:fd.category, governorate:fd.governorate, phone:fd.phone, condition:fd.condition, stock:fd.stock,
      images:images.filter(i=>i.preview).map(i=>i.preview).concat(images.length===0?['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700']:[]),
      seller:{name:user.name,avatar:user.avatar,isVerified:user.isVerified,rating:user.rating||5,joinedDate:user.joinedDate,location:user.location},
      createdAtISO:isEdit?(editProduct?.createdAtISO||new Date().toISOString()):new Date().toISOString(), views:isEdit?(editProduct?.views||0):0, postedBy:user.id,
      status:isEdit?(editProduct?.status||'active'):'active' };
    setUploading(false); playSound('success'); onSubmit(p); onClose();
    if(!isEdit){setFd({title:'',price:'',description:'',category:'electronics',governorate:user?.location||'بغداد',phone:user?.phone||'',condition:'new',stock:1});setImages([]);}
  };
  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  const cats = [
    { id: 'electronics', name: 'أجهزة وإلكترونيات', emoji: '💻' },
    { id: 'fashion', name: 'أزياء وملابس', emoji: '👕' },
    { id: 'home', name: 'المنزل والمطبخ', emoji: '🏠' },
    { id: 'furniture', name: 'أثاث وديكور', emoji: '🛋️' },
    { id: 'beauty', name: 'العناية والجمال', emoji: '✨' },
    { id: 'toys', name: 'ألعاب وأطفال', emoji: '🧸' },
    { id: 'bikes', name: 'دراجات ورياضة', emoji: '🚲' },
    { id: 'services', name: 'خدمات المتجر', emoji: '🔧' },
    { id: 'other', name: 'أصناف أخرى', emoji: '📦' }
  ];
  if(!isOpen) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-purple-400"/></div>
            <h2 className="text-xl font-bold text-white">{isEdit?'تعديل المنتج':'إضافة منتج جديد'}</h2></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Condition */}
          <div className="grid grid-cols-2 gap-3">{(['new','used'] as const).map(c=>(
            <button key={c} type="button" onClick={()=>setFd({...fd,condition:c})} className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${fd.condition===c?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {c==='new'?<><Tag className="w-4 h-4"/>جديد</>:<><Package className="w-4 h-4"/>مستعمل</>}</button>
          ))}</div>
          {/* Category */}
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">القسم</label>
            <div className="grid grid-cols-4 gap-2">{cats.map(c=>(
              <button key={c.id} type="button" onClick={()=>setFd({...fd,category:c.id})} className={`p-2 rounded-xl flex flex-col items-center gap-1 text-xs ${fd.category===c.id?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                <span className="text-lg">{c.emoji}</span><span>{c.name}</span></button>
            ))}</div></div>
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">اسم المنتج</label>
            <input value={fd.title} onChange={e=>setFd({...fd,title:e.target.value})} placeholder="مثال: ساعة كاسيو G-Shock" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">السعر (دينار)</label>
              <input value={fmt(fd.price)} onChange={e=>setFd({...fd,price:fmt(e.target.value)})} placeholder="35,000" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none font-bold"/></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">الكمية المتاحة</label>
              <input type="number" min="1" value={fd.stock} onChange={e=>setFd({...fd,stock:+e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none" title="الكمية المتاحة" aria-label="الكمية المتاحة" placeholder="الكمية المتاحة"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">المحافظة</label>
              <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none" title="اختر المحافظة" aria-label="اختر المحافظة">
                {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select></div>
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">رقم الهاتف</label>
              <input value={fd.phone} onChange={e=>setFd({...fd,phone:e.target.value})} placeholder="07XXXXXXXXX" required className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
          </div>
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">الوصف</label>
            <textarea value={fd.description} onChange={e=>setFd({...fd,description:e.target.value})} placeholder="اكتب وصفاً مفصلاً للمنتج..." rows={3} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none resize-none"/></div>
          <div><label className="text-gray-300 text-xs font-medium mb-2 block">صور المنتج ({images.filter(i=>i.preview).length}/10)</label>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img,i)=>(
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-800">
                  {img.preview?<img src={img.preview} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full bg-gray-700 animate-pulse"/>}
                  {img.progress<100&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-3/4 h-1 bg-gray-600 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{width:`${img.progress}%`}}/></div></div>}
                  <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center" title="حذف الصورة" aria-label="حذف الصورة"><X className="w-3 h-3 text-white"/></button>
                </div>
              ))}
              {images.length<10&&<label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500">
                <ImagePlus className="w-6 h-6 text-gray-500"/><span className="text-[10px] text-gray-500 mt-1">إضافة</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/></label>}
            </div></div>
          <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={uploading}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {uploading?<><Loader2 className="w-4 h-4 animate-spin"/>{pct}%</>:<><Save className="w-4 h-4"/>{isEdit?'حفظ التعديلات':'نشر المنتج'}</>}</motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
function MyLinesTab({ userId, lines, onUpdateStatus, onDelete }: {
  userId: string;
  lines: TransportAd[];
  onUpdateStatus: (id: number, status: TransportAd['status'], reason?: TransportAd['completion_reason']) => void;
  onDelete: (id: number) => void;
}) {
  const [subTab, setSubTab] = useState<'published' | 'pending' | 'matched' | 'archived'>('published');
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: number; action: 'found_line' | 'line_full' } | null>(null);

  const updateStatus = (id: number, status: TransportAd['status'], reason: TransportAd['completion_reason'] = null) => {
    onUpdateStatus(id, status, reason);
    setShowConfirmModal(null);
  };

  const activeLines = lines.filter(l => l.status === 'published');
  const completedLines = lines.filter(l => l.status === 'matched');
  const totalInteractions = lines.reduce((acc, l) => acc + (l.whatsappClicks || 0), 0);
  const totalViews = lines.reduce((acc, l) => acc + l.views, 0);

  const displayLines = lines.filter(l => l.status === subTab);

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-emerald-400">{activeLines.length}</p>
          <p className="text-xs text-gray-400 mt-1">خطوط نشطة</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-blue-400">{completedLines.length}</p>
          <p className="text-xs text-gray-400 mt-1">مكتملة</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-amber-400">{totalInteractions}</p>
          <p className="text-xs text-gray-400 mt-1">تواصل (واتساب)</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 text-center">
          <p className="text-xl font-bold text-purple-400">{totalViews}</p>
          <p className="text-xs text-gray-400 mt-1">المشاهدات</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(
          [
            ['published', 'نشطة'],
            ['pending', 'بانتظار الموافقة'],
            ['matched', 'تم العثور / مكتمل'],
            ['archived', 'مؤرشفة']
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${subTab === key ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}
          >
            {label} ({lines.filter(l => l.status === key).length})
          </button>
        ))}
      </div>

      {/* Lines List */}
      <div className="space-y-3">
        {displayLines.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center border-dashed">
            <div className="text-4xl mb-2">🚌</div>
            <p className="text-white font-bold">لا توجد خطوط في هذا القسم</p>
          </div>
        ) : (
          displayLines.map(line => (
            <div key={line.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-bold">
                    {line.type === 'offer' ? 'أوفر خط إلى' : 'أبحث عن خط إلى'} {line.university}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{line.regions}</p>
                </div>
                {line.status === 'matched' && (
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${line.completion_reason === 'found_line' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {line.completion_reason === 'found_line' ? 'تم العثور على خط' : 'اكتمل العدد'}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3 bg-gray-900/50 p-2 rounded-lg">
                <div className="flex justify-between"><span>المركبة:</span> <span className="text-white">{line.vehicleType}</span></div>
                <div className="flex justify-between"><span>الفئة:</span> <span className="text-white">{line.targetAudience}</span></div>
                <div className="flex justify-between"><span>المشاهدات:</span> <span className="text-white">{line.views}</span></div>
                <div className="flex justify-between"><span>الاهتمام:</span> <span className="text-white">{line.interest}</span></div>
              </div>

              {line.status === 'matched' && line.completedAt && (
                <p className="text-xs text-gray-500 mb-3">
                  تم إنهاء الإعلان بتاريخ: {new Date(line.completedAt).toLocaleDateString('ar-IQ')}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
                {line.status === 'published' && (
                  <>
                    <button onClick={() => updateStatus(line.id, 'archived')} className="flex-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-600">أرشفة</button>
                    <button onClick={() => setShowConfirmModal({ id: line.id, action: line.type === 'request' ? 'found_line' : 'line_full' })} className="flex-[2] px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/20">
                      {line.type === 'request' ? 'حصلت على خط' : 'اكتمل العدد'}
                    </button>
                  </>
                )}
                {line.status === 'matched' && (
                  <>
                    <button onClick={() => updateStatus(line.id, 'published')} className="flex-1 px-3 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400">إعادة فتح الخط</button>
                    <button onClick={() => updateStatus(line.id, 'archived')} className="flex-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-600">أرشفة</button>
                  </>
                )}
                {line.status === 'archived' && (
                  <>
                    <button onClick={() => updateStatus(line.id, 'published')} className="flex-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400">تنشيط الإعلان</button>
                    <button onClick={() => onDelete(line.id)} className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">حذف نهائي</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden border border-gray-800 shadow-2xl relative">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {showConfirmModal.action === 'found_line' ? 'هل حصلت على خط؟' : 'هل اكتمل الخط أو تم حجز المقاعد؟'}
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {showConfirmModal.action === 'found_line'
                    ? 'شكراً على استخدامك سوق بغداد! سيتم إخفاء إعلانك من قائمة الخطوط العامة. سيتم خزن إعلانك في قسم خطوطي ويمكنك إعادة فتح الإعلان في أي وقت.'
                    : 'إذا تم إغلاق الخط، سيتم إخفاء الإعلان من قائمة الخطوط العامة ونقله إلى قسم "مكتمل" داخل حسابك.'}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmModal(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors">إلغاء</button>
                  <button onClick={() => updateStatus(showConfirmModal.id, 'matched', showConfirmModal.action)} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                    {showConfirmModal.action === 'found_line' ? 'نعم، حصلت' : 'نعم، اكتمل العدد'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PasswordChangeModal({ isOpen, onClose, userEmail, userPhone }:{
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userPhone?: string;
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword) { setErrorMsg('الرجاء إدخال كلمة المرور السابقة'); return; }
    if (newPassword.length < 6) { setErrorMsg('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('كلمة المرور الجديدة وتأكيدها غير متطابقين'); return; }

    setLoading(true);
    try {
      const identifier = userEmail || userPhone;
      if (!identifier) {
        setErrorMsg('لم يتم العثور على بريد إلكتروني أو رقم هاتف للتحقق');
        setLoading(false);
        return;
      }

      const credentials = userEmail 
        ? { email: identifier, password: oldPassword }
        : { phone: identifier, password: oldPassword };
      const { error: signInErr } = await supabase.auth.signInWithPassword(credentials);

      if (signInErr) {
        setErrorMsg('كلمة المرور السابقة غير صحيحة');
        setLoading(false);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        setErrorMsg(updateErr.message || 'فشل تحديث كلمة المرور');
      } else {
        setSuccessMsg('تم تغيير كلمة المرور بنجاح! ✅');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(onClose, 2000);
      }
    } catch {
      setErrorMsg('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors" title="إغلاق" aria-label="إغلاق">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-400" /> تعديل كلمة المرور
        </h2>
        {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span></div>}
        {successMsg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" /><span>{successMsg}</span></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1.5">كلمة المرور السابقة</label>
            <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1.5">كلمة المرور الجديدة</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1.5">تأكيد كلمة المرور الجديدة</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500 text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تحديث كلمة المرور'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ProfileView({ user, myAds, myProducts, onDeleteAd, onEditAd, onDeleteProduct, onEditProduct, onUpdateUser, onAddAd, onAddProduct, transportLines, onUpdateTransportStatus, onDeleteTransportAd, onMarkAdSold, onMarkProductSold, favorites = [], allAds = [], allProducts = [], onAdSelect, onProductSelect, onFav, onStoreGuideClick }:{
  user:User; myAds:Ad[]; myProducts:Product[]; onDeleteAd:(id:number)=>void; onEditAd:(ad:Ad)=>void;
  onDeleteProduct:(id:number)=>void; onEditProduct:(p:Product)=>void; onUpdateUser:(u:User)=>void;
  onAddAd:()=>void; onAddProduct:()=>void;
  transportLines: TransportAd[];
  onUpdateTransportStatus: (id: number, status: TransportAd['status'], reason?: TransportAd['completion_reason']) => void;
  onDeleteTransportAd: (id: number) => void;
  onMarkAdSold:(ad:Ad)=>void;
  onMarkProductSold:(p:Product)=>void;
  favorites?: number[];
  allAds?: Ad[];
  allProducts?: Product[];
  onAdSelect?: (ad: Ad) => void;
  onProductSelect?: (p: Product) => void;
  onFav?: (id: number) => void;
  onStoreGuideClick?: () => void;
}) {
  const [tab, setTab] = useState<'ads'|'store'|'favs'|'archive'|'lines'|'account'>('ads');
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({ name:user.name, phone:user.phone, location:user.location, bio:user.bio||'', email:user.email||'' });
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyImage, setVerifyImage] = useState<string|null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Image crop state
  const [cropSrc, setCropSrc] = useState<string|null>(null);
  const [cropType, setCropType] = useState<'avatar'|'cover'>('avatar');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar||DEFAULT_AVATAR);
  const [coverPreview, setCoverPreview] = useState(getCoverImage(user));
  const playSound = useSound();

  const favAds = allAds.filter(a => favorites.includes(a.id));
  const favProducts = allProducts.filter(p => favorites.includes(p.id));

  const formatJoinedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' });
    } catch {
      return isoString;
    }
  };

  const submitVerification = async () => {
    if (!verifyImage) return;
    setIsVerifying(true);
    try {
      const { error } = await supabase.from('verification_requests').insert([{
        user_id: user.id,
        id_image: verifyImage
      }]);
      if (error) throw error;
      alert('تم تقديم طلب التوثيق بنجاح! سيتم مراجعته قريباً.');
      setShowVerifyModal(false);
    } catch {
      alert('حدث خطأ أثناء تقديم الطلب.');
    } finally {
      setIsVerifying(false);
    }
  };

  const [localArchiveAds, setLocalArchiveAds] = useState<Ad[]>([]);
  const [localArchiveProds, setLocalArchiveProds] = useState<Product[]>([]);
  const [localArchiveLines, setLocalArchiveLines] = useState<TransportAd[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadArchive() {
      if (!user) { setIsLoadingArchive(false); return; }
      setIsLoadingArchive(true);
      const adsQuery = user.phone && !user.phone.includes('-') ? `seller_id.eq.${user.id},phone.eq.${user.phone}` : `seller_id.eq.${user.id}`;
      const [adsRes, prodsRes] = await Promise.all([
        supabase.from('ads').select('*').or(adsQuery),
        supabase.from('products').select('*').or(adsQuery)
      ]);
      
      if (adsRes.data && isMounted) {
        const rawAds = adsRes.data.filter((r: any) => r.category !== 'transport' && r.category !== 'notification');
        const rawLines = adsRes.data.filter((r: any) => r.category === 'transport');

        const formattedAds = rawAds.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          price: row.price,
          images: row.images || [],
          category: row.category,
          location: row.location || row.governorate,
          governorate: row.governorate,
          postedBy: row.seller_id,
          phone: row.phone,
          createdAt: row.created_at,
          createdAtISO: row.created_at,
          views: row.views || 0,
          status: row.status,
          isDemo: row.is_demo,
          time: row.created_at,
          type: row.type || 'ad',
          adCount: row.adCount || 0,
          soldCount: row.soldCount || 0,
          favorites: row.likes || 0,
          seller: row.seller || { name: 'مستخدم', avatar: '', isVerified: false, rating: 5 }
        }));
        setLocalArchiveAds(formattedAds);

        const formattedLines = rawLines.map((row: any) => {
          let extra = { shift: 'صباحي', seats: 4, vehicleType: 'خصوصي', targetAudience: 'مختلط', categoryType: 'student', note: '' };
          try { if (row.description) extra = { ...extra, ...JSON.parse(row.description) }; } catch(e) { extra.note = row.description || ''; }
          return {
            id: row.id,
            type: row.type || 'offer',
            categoryType: (extra.categoryType === 'employee' ? 'employee' : 'student') as 'employee' | 'student',
            university: row.city || '',
            regions: row.location || '',
            shift: extra.shift,
            seats: extra.seats,
            vehicleType: extra.vehicleType,
            targetAudience: extra.targetAudience,
            price: row.price || '0',
            note: extra.note,
            postedBy: row.seller_id,
            phone: row.phone,
            user_id: row.seller_id,
            status: row.status,
            createdAt: row.created_at,
            createdAtISO: row.created_at,
            views: row.views || 0,
            seller: row.seller,
            sellerName: row.seller?.name || 'مستخدم',
            sellerAvatar: row.seller?.avatar || ''
          };
        });
        setLocalArchiveLines(formattedLines);
      }
      if (prodsRes.data && isMounted) {
        const formattedProds = prodsRes.data.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          price: row.price,
          images: row.images || [],
          category: row.category,
          condition: row.condition,
          stock: row.stock,
          location: row.location || row.governorate,
          governorate: row.governorate,
          postedBy: row.seller_id,
          phone: row.phone,
          createdAt: row.created_at,
          createdAtISO: row.created_at,
          views: row.views || 0,
          status: row.status,
          isDemo: row.is_demo,
          seller: row.seller || { name: 'مستخدم', avatar: '', isVerified: false, rating: 5 }
        }));
        setLocalArchiveProds(formattedProds);
      }
      if (isMounted) {
        setIsLoadingArchive(false);
      }
    }
    loadArchive();
    return () => { isMounted = false; };
  }, [user]);

  const allMyAds = [...myAds, ...localArchiveAds].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  const allMyProducts = [...myProducts, ...localArchiveProds].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  const allMyLines = [...transportLines.filter(line => line.postedBy === user?.id), ...localArchiveLines].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);

  useEffect(() => {
    const handleSwitch = () => setTab('lines');
    window.addEventListener('switch-to-lines-tab', handleSwitch);
    return () => window.removeEventListener('switch-to-lines-tab', handleSwitch);
  }, []);

  const handleSave = async () => {
    if (!ef.name.trim()) { alert('الرجاء إدخال الاسم الكامل'); return; }
    if (!ef.phone.trim()) { alert('الرجاء إدخال رقم الهاتف'); return; }
    if (!ef.email.trim()) { alert('الرجاء إدخال البريد الإلكتروني'); return; }
    if (!/\S+@\S+\.\S+/.test(ef.email)) { alert('الرجاء إدخال بريد إلكتروني صالح'); return; }

    setIsSaving(true);
    try {
      // Check phone uniqueness
      const { data: phoneCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', ef.phone.trim())
        .neq('id', user.id);
      if (phoneCheck && phoneCheck.length > 0) {
        alert('رقم الهاتف هذا مستخدم بالفعل في حساب آخر!');
        setIsSaving(false);
        return;
      }

      // Check email uniqueness
      const { data: emailCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ef.email.trim().toLowerCase())
        .neq('id', user.id);
      if (emailCheck && emailCheck.length > 0) {
        alert('البريد الإلكتروني هذا مستخدم بالفعل في حساب آخر!');
        setIsSaving(false);
        return;
      }

      // Update in auth if email changed
      if (ef.email.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
        const { error: authErr } = await supabase.auth.updateUser({ email: ef.email.trim().toLowerCase() });
        if (authErr) {
          console.warn('Could not update email in Auth:', authErr.message);
          alert('تم تحديث البريد الإلكتروني للملف، ولكن قد يتطلب ذلك تأكيد البريد الجديد عبر البريد الإلكتروني.');
        }
      }

      // Update in auth if phone changed
      if (ef.phone.trim() !== (user.phone || '')) {
        await supabase.auth.updateUser({ phone: ef.phone.trim() }).catch(() => {});
      }

      let finalAvatar = avatarPreview;
      if (finalAvatar && finalAvatar.startsWith('data:image/')) {
        finalAvatar = await uploadImageToStorage(finalAvatar, 'ad-images', 1200, 0.8, false);
      }
      
      let finalCover = coverPreview;
      if (finalCover && finalCover.startsWith('data:image/')) {
        finalCover = await uploadImageToStorage(finalCover, 'ad-images', 1200, 0.9, false);
      }

      const updated: User = { ...user, ...ef, email: ef.email.trim().toLowerCase(), phone: ef.phone.trim(), avatar: finalAvatar, cover: finalCover };
      await onUpdateUser(updated);
      setEditing(false);
    } catch (e) {
      alert('حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setIsSaving(false);
    }
  };

  const openCrop = async (e:React.ChangeEvent<HTMLInputElement>, type:'avatar'|'cover') => {
    if(!e.target.files?.[0]) return;
    const quality = type === 'avatar' ? 0.8 : 0.9;
    const b64 = await compressImage(e.target.files[0], 1200, quality, false);
    setCropType(type); setCropSrc(b64);
  };

  const handleCropSave = (b64:string) => {
    if(cropType==='avatar') setAvatarPreview(b64); else setCoverPreview(b64);
    setCropSrc(null);
  };

  const totalViews = allMyAds.reduce((s,a)=>s+(a.views||0),0) + allMyProducts.reduce((s,p)=>s+(p.views||0),0);
  const totalFavorites = allMyAds.reduce((s,a)=>s+(a.favorites||0),0);

  return (
    <div className="min-h-screen bg-[#0c2b5e] pt-16 pb-24">
      {/* Banner & Header */}
      <div className="relative w-full">
        {/* Banner with 3:1 aspect ratio */}
        <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gray-900 relative overflow-hidden flex items-center justify-center">
          <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"/>
          <img src={coverPreview} alt="Cover" className="relative w-full h-full object-cover z-0"/>
          {/* Watermark */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 opacity-60 select-none pointer-events-none drop-shadow-xl">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-900 rounded-lg flex items-center justify-center border border-amber-500/40">
              <span className="text-white font-bold text-[10px] sm:text-xs">سوك</span>
            </div>
            <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md">سوك بغداد</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent z-10"/>
          {editing && ['pro','vendor','admin','owner'].includes(user.role) && <label className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs rounded-xl cursor-pointer hover:bg-black/80 backdrop-blur-md z-20">
            <Camera className="w-4 h-4"/> تغيير الغلاف
            <input type="file" accept="image/*" onChange={e=>openCrop(e,'cover')} className="hidden"/></label>}
        </div>

        <div className="container mx-auto px-4 max-w-3xl relative">
          {/* Avatar & Actions Container */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            {/* Avatar */}
            <div className="relative z-20">
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 shadow-xl overflow-hidden bg-white flex items-center justify-center ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border-gray-950'}`}>
                <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover"/>
              </div>
              {editing&&(
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <label className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-amber-400">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-black"/>
                    <input type="file" accept="image/*" onChange={e=>openCrop(e,'avatar')} className="hidden" title="اختر الصورة الشخصية" aria-label="اختر الصورة الشخصية"/></label>
                  <button onClick={()=>setAvatarPreview(DEFAULT_AVATAR)} className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-400" title="حذف الصورة الشخصية" aria-label="حذف الصورة الشخصية">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white"/></button>
                </div>
              )}
              {user.isVerified&&!editing&&<div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-950"><Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white"/></div>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-2">
              {editing?(
                <>
                  <button onClick={handleSave} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:bg-green-600"><Save className="w-4 h-4"/>حفظ</button>
                  <button onClick={()=>{setEditing(false);setAvatarPreview(user.avatar||DEFAULT_AVATAR);setCoverPreview(user.cover||DEFAULT_COVER);}} className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl text-sm hover:bg-gray-700">إلغاء</button>
                </>
              ):(
                <>
                  <button onClick={()=>{
                    onStoreGuideClick?.();
                  }} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg hover:from-purple-600 hover:to-indigo-600" title="نسخ رابط المتجر للبايو">
                    <Copy className="w-4 h-4"/>
                    <span className="hidden sm:inline">رابط المتجر</span>
                  </button>
                  <button onClick={()=>{
                    window.location.hash = '#/accounts';
                    window.dispatchEvent(new CustomEvent('switch-to-profiles-tab'));
                  }} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-600" title="دليل الحسابات والمتاجر">
                    <Users className="w-4 h-4"/>
                    <span className="hidden sm:inline">دليل الحسابات</span>
                  </button>
                  <button onClick={()=>{
                    handleUniversalShare({
                      title: user.name,
                      type: 'profile',
                      location: user.location || 'بغداد',
                      id: user.id,
                      url: '/seller/' + user.id,
                      image: user.avatar || DEFAULT_AVATAR
                    });
                  }} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg border border-gray-700 hover:bg-gray-700">
                    <Share2 className="w-4 h-4"/>
                    <span className="hidden sm:inline">مشاركة</span>
                  </button>
                  <button onClick={()=>{setEditing(true);setEf({name:user.name,phone:user.phone,location:user.location,bio:user.bio||'',email:user.email||''});}} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-amber-500 text-black rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600">
                    <Edit2 className="w-4 h-4"/>تعديل
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h2>
              {user.role==='owner'&&<span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-bold"><Crown className="w-3 h-3"/>مالك</span>}
              {user.role==='admin'&&<span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold">مشرف</span>}
              {user.role==='vendor'&&<span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-bold"><Crown className="w-3 h-3"/>تاجر موثق</span>}
              {user.role==='pro'&&<span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-bold"><Star className="w-3 h-3"/>حساب برو</span>}
              {user.badges?.isStudent && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md text-xs font-semibold flex items-center gap-1">🎓 طالب موثق</span>}
              {user.badges?.hasVehicle && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-md text-xs font-semibold flex items-center gap-1">🚗 مركبة موثقة</span>}
              {user.badges?.hasID && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md text-xs font-semibold flex items-center gap-1">🪪 هوية موثقة</span>}
              {user.badges?.isPhoneVerified && <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-md text-xs font-semibold flex items-center gap-1">📱 هاتف موثق</span>}
            
              {!user.isVerified && (
                <button onClick={() => setShowVerifyModal(true)} className="px-2 py-1 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ml-2">
                  🛡️ طلب توثيق
                </button>
              )}
</div>
            
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
              <div className="flex items-center gap-1"><MapPin className="w-4 h-4"/><span>{user.location || 'العراق'}</span></div>
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4"/><span>انضم في {formatJoinedDate(user.joinedDate)}</span></div>
              {user.rating && <div className="flex items-center gap-1 text-amber-400"><Star className="w-4 h-4 fill-current"/><span className="font-bold">{user.rating}</span></div>}
            </div>
            {user.bio&&<p className="text-gray-300 text-sm mt-3 line-clamp-2 bg-gray-800/50 p-3 rounded-xl border border-gray-800">{user.bio}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
            {[{v:allMyAds.length,l:'إعلان',c:'text-amber-400'},{v:allMyProducts.length,l:'منتج',c:'text-purple-400'},{v:totalViews,l:'مشاهدة',c:'text-blue-400'},{v:totalFavorites,l:'مفضلة',c:'text-red-400'}].map((s,i)=>(
              <div key={i} className="bg-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-gray-700 flex flex-col justify-center">
                <p className={`text-lg sm:text-xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl">

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-gray-800 p-1.5 rounded-2xl border border-gray-700 overflow-x-auto scrollbar-hide">
          {([['ads',`📢 إعلاناتي (${allMyAds.filter(a=>a.status==='active').length})`],['store',`🛍️ متجري (${allMyProducts.filter(p=>p.status==='active').length})`],['archive',`📦 الأرشيف (${allMyAds.filter(a=>a.status==='sold').length + allMyProducts.filter(p=>p.status==='sold').length})`],['lines',`🚌 خطوطي`],['account','⚙️ الحساب']] as [string,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tab===t?'bg-amber-500 text-black shadow':'text-gray-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>

        {/* Ads Tab */}
        {tab==='ads'&&(
          <>
            <button onClick={onAddAd} className="w-full mb-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2">
              <Plus className="w-5 h-5"/> إضافة إعلان جديد</button>
            {isLoadingArchive ? (
              <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : allMyAds.filter(a=>a.status==='active').length===0?(
              <div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700 border-dashed">
                <div className="text-4xl mb-3">📭</div><p className="text-white font-bold mb-1">لا إعلانات بعد</p><p className="text-gray-400 text-sm">انشر أول إعلان الآن!</p>
              </div>
            ):(
              <div className="space-y-3">
                {allMyAds.filter(a=>a.status==='active').map(ad=>(
                  <div key={ad.id} className="bg-gray-800 rounded-2xl p-3 border border-gray-700 flex gap-3 hover:border-amber-500/30 transition-colors">
                    <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-700"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm line-clamp-1">{ad.title}</p>
                      <p className="text-amber-400 text-sm font-bold">{formatPrice(ad.price)} <span className="text-xs text-gray-400">د.ع</span></p>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <TimeAgo iso={ad.createdAtISO} className="text-green-400"/>
                        <span className="text-gray-400 flex items-center gap-0.5"><ViewIcon className="w-3 h-3"/>{ad.views}</span>
                        <span className="text-gray-500">{ad.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 self-center">
                      <button onClick={()=>onMarkAdSold(ad)} title="تم البيع" className="p-2 bg-green-500/20 rounded-xl text-green-400 hover:bg-green-500/30"><CheckCircle className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onEditAd(ad)} className="p-2 bg-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/30" title="تعديل الإعلان" aria-label="تعديل الإعلان"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30" title="حذف الإعلان" aria-label="حذف الإعلان"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Store Tab */}
        {tab==='store'&&(
          <>
            <button onClick={onAddProduct} className="w-full mb-4 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              <Plus className="w-5 h-5"/> إضافة منتج جديد</button>
            {isLoadingArchive ? (
              <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : allMyProducts.filter(p=>p.status==='active').length===0?(
              <div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700 border-dashed">
                <div className="text-4xl mb-3">🛍️</div><p className="text-white font-bold mb-1">متجرك فارغ</p><p className="text-gray-400 text-sm">أضف أول منتج الآن!</p>
              </div>
            ):(
              <div className="space-y-3">
                {allMyProducts.filter(p=>p.status==='active').map(p=>(
                  <div key={p.id} className="bg-gray-800 rounded-2xl p-3 border border-gray-700 flex gap-3 hover:border-purple-500/30 transition-colors">
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-700"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm line-clamp-1">{p.title}</p>
                      <p className="text-amber-400 text-sm font-bold">{formatPrice(p.price)} <span className="text-xs text-gray-400">د.ع</span></p>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${p.condition==='new'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>{p.condition==='new'?'جديد':'مستعمل'}</span>
                        <span className="text-gray-400">الكمية: {p.stock}</span>
                        <TimeAgo iso={p.createdAtISO} className="text-green-400"/>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 self-center">
                      <button onClick={()=>onMarkProductSold(p)} title="تم البيع" className="p-2 bg-green-500/20 rounded-xl text-green-400 hover:bg-green-500/30"><CheckCircle className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onEditProduct(p)} className="p-2 bg-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/30" title="تعديل المنتج" aria-label="تعديل المنتج"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onDeleteProduct(p.id)} className="p-2 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30" title="حذف المنتج" aria-label="حذف المنتج"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Archive Tab */}
        {tab==='archive'&&(
          <>
            {isLoadingArchive ? (
              <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (allMyAds.filter(a=>a.status==='sold').length === 0 && allMyProducts.filter(p=>p.status==='sold').length === 0) ? (
              <div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700 border-dashed">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-white font-bold mb-1">الأرشيف فارغ</p>
                <p className="text-gray-400 text-sm">المنتجات والإعلانات التي تبيعها وتؤرشفها ستظهر هنا.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Sold Ads */}
                {allMyAds.filter(a=>a.status==='sold').map(ad=>(
                  <div key={ad.id} className="bg-gray-800 rounded-2xl p-3 border border-gray-700 flex gap-3 hover:border-red-500/30 transition-colors relative">
                    <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-700 opacity-60"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm line-clamp-1 opacity-75">{ad.title}</p>
                      <p className="text-amber-400 text-sm font-bold opacity-75">{formatPrice(ad.price)} <span className="text-xs text-gray-400">د.ع</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/30 flex items-center gap-0.5">
                          🚫 تم البيع
                        </span>
                        <span className="text-gray-500 text-xs">إعلان</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 self-center">
                      <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30" title="حذف الإعلان" aria-label="حذف الإعلان"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))}
                {/* Sold Products */}
                {allMyProducts.filter(p=>p.status==='sold').map(p=>(
                  <div key={p.id} className="bg-gray-800 rounded-2xl p-3 border border-gray-700 flex gap-3 hover:border-red-500/30 transition-colors relative">
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-700 opacity-60"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm line-clamp-1 opacity-75">{p.title}</p>
                      <p className="text-amber-400 text-sm font-bold opacity-75">{formatPrice(p.price)} <span className="text-xs text-gray-400">د.ع</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/30 flex items-center gap-0.5">
                          🚫 تم البيع
                        </span>
                        <span className="text-gray-500 text-xs">منتج</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 self-center">
                      <button onClick={()=>onDeleteProduct(p.id)} className="p-2 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30" title="حذف المنتج" aria-label="حذف المنتج"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Account Tab */}
        {/* Lines Tab */}
        {tab==='lines'&& (
          isLoadingArchive ? (
            <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <MyLinesTab 
              userId={user.id} 
              lines={allMyLines}
              onUpdateStatus={onUpdateTransportStatus}
              onDelete={onDeleteTransportAd}
            />
          )
        )}

        {tab==='account'&&(
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2"><UserIcon className="w-4 h-4 text-amber-400"/>المعلومات الشخصية</h3>
                {!editing&&<button onClick={()=>setEditing(true)} className="text-xs text-amber-400 hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3"/> تعديل</button>}
              </div>
              <div className="space-y-3">
                 {[{label:'الاسم الكامل',field:'name',placeholder:'اسمك الكامل'},{label:'رقم الهاتف',field:'phone',placeholder:'07XXXXXXXXX'},{label:'البريد الإلكتروني',field:'email',placeholder:'example@domain.com'},{label:'نبذة شخصية',field:'bio',placeholder:'اكتب نبذة...',multi:true}].map(({label,field,placeholder,multi})=>(
                  <div key={field}><label className="text-gray-400 text-xs font-medium mb-1 block">{label}</label>
                    {multi?(
                      <textarea disabled={!editing} value={(ef as any)[field]} onChange={e=>setEf({...ef,[field]:e.target.value})} placeholder={placeholder} rows={2} className={`w-full bg-gray-700 text-white rounded-xl py-2.5 px-4 border outline-none resize-none text-sm ${editing?'border-amber-400':'border-gray-600 opacity-70'}`}/>
                    ):(
                      <input disabled={!editing} value={(ef as any)[field]} onChange={e=>setEf({...ef,[field]:e.target.value})} placeholder={placeholder} className={`w-full bg-gray-700 text-white rounded-xl py-2.5 px-4 border outline-none text-sm ${editing?'border-amber-400':'border-gray-600 opacity-70'}`}/>
                    )}
                  </div>
                ))}
                <div><label className="text-gray-400 text-xs font-medium mb-1 block">المحافظة</label>
                  <select disabled={!editing} value={ef.location} onChange={e=>setEf({...ef,location:e.target.value})} className={`w-full bg-gray-700 text-white rounded-xl py-2.5 px-4 border outline-none text-sm ${editing?'border-amber-400':'border-gray-600 opacity-70'}`} title="المحافظة" aria-label="المحافظة">
                    {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select></div>
                {editing&&<div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4"/>}
                    حفظ التغييرات
                  </button>
                  <button onClick={()=>setEditing(false)} className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl text-sm">إلغاء</button>
                </div>}
              </div>
            </div>
            {/* Email (read-only info card, but we add Edit Password button here) */}
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="text-white font-bold flex items-center gap-2 mb-3"><Mail className="w-4 h-4 text-blue-400"/>معلومات الحساب</h3>
              <div className="space-y-2">
                {[{label:'البريد الإلكتروني',val:user.email},{label:'تاريخ الانضمام',val:formatJoinedDate(user.joinedDate)},{label:'نوع الحساب',val:user.role==='owner'?'مالك':user.role==='admin'?'مشرف':'مستخدم'}].map((r,i)=>(
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <span className="text-gray-400 text-sm">{r.label}</span>
                    <span className="text-white text-sm font-medium">{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                <button 
                  onClick={() => setShowPasswordModal(true)} 
                  className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Key className="w-3.5 h-3.5" /> تعديل كلمة المرور
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropSrc&&<ImageCropModal src={cropSrc} aspectRatio={cropType==='avatar'?1:3} title={cropType==='avatar'?'قص الصورة الشخصية':'قص صورة الغلاف'} onSave={handleCropSave} onClose={()=>setCropSrc(null)}/>}
        
        {showVerifyModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={()=>setShowVerifyModal(false)}/>
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="relative bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
              <button onClick={()=>setShowVerifyModal(false)} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400"/> طلب توثيق الحساب</h2>
              <p className="text-gray-400 text-sm mb-4">يرجى رفع صورة واضحة لهويتك الشخصية (البطاقة الوطنية أو جواز السفر) لتوثيق حسابك والحصول على شارة الموثوقية.</p>
              
              <div className="mb-4">
                {verifyImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-gray-800">
                    <img src={verifyImage} alt="ID" className="w-full h-48 object-cover"/>
                    <button onClick={()=>setVerifyImage(null)} className="absolute top-2 left-2 p-2 bg-red-500 rounded-xl text-white shadow-lg" title="حذف الصورة" aria-label="حذف الصورة"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-800 transition-colors">
                    <Camera className="w-8 h-8 text-gray-500 mb-2"/>
                    <span className="text-gray-400 text-sm">اضغط هنا لالتقاط أو رفع صورة</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" title="تحميل صورة الهوية" aria-label="تحميل صورة الهوية" onChange={async (e) => {
                      if(e.target.files?.[0]) {
                        const b64 = await compressImage(e.target.files[0], 1200, 0.8, false);
                        setVerifyImage(b64);
                      }
                    }}/>
                  </label>
                )}
              </div>
              
              <button onClick={submitVerification} disabled={!verifyImage || isVerifying} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors">
                {isVerifying ? 'جاري الإرسال...' : 'إرسال طلب التوثيق'}
              </button>
            </motion.div>
          </motion.div>
        )}
        {showPasswordModal && (
          <PasswordChangeModal 
            isOpen={showPasswordModal} 
            onClose={() => setShowPasswordModal(false)} 
            userEmail={user.email} 
            userPhone={user.phone} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Seller Public Page
// ─────────────────────────────────────────────
function SellerPublicPage({ sellerId, allAds, allProducts, allTransportAds = [], storedUsers = [], onBack, onSelectAd, onSelectProduct, onSelectTransport, favorites, onToggleFav, user, onAuthRequired, onDeleteProfile, onActionMenu }:{
  sellerId:string; allAds:Ad[]; allProducts:Product[]; allTransportAds?:TransportAd[]; storedUsers?: any[]; onBack:()=>void;
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void; onSelectTransport?:(ad:TransportAd)=>void;
  favorites:number[]; onToggleFav:(id:number)=>void; user:User|null; onAuthRequired:()=>void;
  onDeleteProfile?:(id:string)=>void; onActionMenu?:any;
}) {
  const onlineStatuses = useOnlineStatuses();
  const [tab, setTab] = useState<'ads'|'products'|'lines'>('ads');
  const [sellerUser, setSellerUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);

  const [localAds, setLocalAds] = useState<Ad[]>([]);
  const [localProds, setLocalProds] = useState<Product[]>([]);
  const [localLines, setLocalLines] = useState<TransportAd[]>([]);
  
  const mergedAds = [...allAds.filter(a=>String(a.postedBy)===String(sellerId) || String(a.phone)===String(sellerId)), ...localAds].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  const mergedProds = [...allProducts.filter(p=>String(p.postedBy)===String(sellerId) || String(p.phone)===String(sellerId)), ...localProds].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  const mergedLines = [...allTransportAds.filter(a=>String(a.postedBy)===String(sellerId) || String(a.phone)===String(sellerId)), ...localLines].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);

  const sellerAds = mergedAds;
  const sellerProds = mergedProds;
  const sellerLines = mergedLines;
  const sellerInfo: SellerInfo|null = sellerAds[0]?.seller || sellerProds[0]?.seller || null;

  useEffect(() => {
    let isMounted = true;
    async function loadSellerDetails() {
      setLoadingProfile(true);
      try {
        // 1. Check storedUsers prop
        const foundStored = storedUsers.find((u: any) => String(u.id) === String(sellerId) || String(u.phone) === String(sellerId));
        if (foundStored) {
          if (isMounted) { setSellerUser(foundStored); setLoadingProfile(false); }
          return;
        }

        // 2. Check local users
        const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const foundLocal = users.find((u: any) => String(u.id) === String(sellerId) || String(u.phone) === String(sellerId));
        if (foundLocal) {
          if (isMounted) { setSellerUser(foundLocal); setLoadingProfile(false); }
          return;
        }

        // 3. Check sellerInfo from ads
        if (sellerInfo) {
          if (isMounted) {
            setSellerUser({
              id: sellerId,
              name: sellerInfo.name,
              avatar: sellerInfo.avatar || DEFAULT_AVATAR,
              location: sellerInfo.location || 'العراق',
              isVerified: sellerInfo.isVerified,
              rating: sellerInfo.rating || 4.9,
              ratingCount: 1,
              cover: DEFAULT_COVER
            });
            setLoadingProfile(false);
          }
          return;
        }

        // 4. Query Supabase profiles table directly and fetch seller's sold ads and products
        const isPhone = !sellerId.includes('-');
        const [adsRes, prodsRes, linesRes, dbProfileRes] = await Promise.all([
          isPhone ? supabase.from('ads').select('*').eq('phone', sellerId) : supabase.from('ads').select('*').eq('seller_id', sellerId),
          isPhone ? supabase.from('products').select('*').eq('phone', sellerId) : supabase.from('products').select('*').eq('seller_id', sellerId),
          isPhone ? supabase.from('ads').select('*').eq('phone', sellerId).eq('category', 'transport') : supabase.from('ads').select('*').eq('postedBy', sellerId).eq('category', 'transport'),
          isPhone ? supabase.from('profiles').select('*').eq('phone', sellerId).maybeSingle() : supabase.from('profiles').select('*').eq('id', sellerId).maybeSingle()
        ]);
        
        if (adsRes.data && isMounted) {
          const rawAds = adsRes.data.filter((r: any) => r.category !== 'transport' && r.category !== 'notification');
          const rawLines = adsRes.data.filter((r: any) => r.category === 'transport');

          const formattedAds = rawAds.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            price: row.price,
            images: row.images || [],
            category: row.category,
            location: row.location || row.governorate,
            governorate: row.governorate,
            postedBy: row.seller_id,
            phone: row.phone,
            createdAt: row.created_at,
            createdAtISO: row.created_at,
            views: row.views || 0,
            status: row.status,
            isDemo: row.is_demo,
            time: row.created_at,
            type: row.type || 'ad',
            adCount: row.adCount || 0,
            soldCount: row.soldCount || 0,
            favorites: row.likes || 0,
            seller: row.seller || {
              name: 'مستخدم',
              avatar: '',
              isVerified: false,
              rating: 5
            }
          }));
          setLocalAds(formattedAds);

          const formattedLines = rawLines.map((row: any) => {
            let extra = { shift: 'صباحي', seats: 4, vehicleType: 'خصوصي', targetAudience: 'مختلط', categoryType: 'student', note: '' };
            try { if (row.description) extra = { ...extra, ...JSON.parse(row.description) }; } catch(e) { extra.note = row.description || ''; }
            return {
              id: row.id,
              type: row.type || 'offer',
              categoryType: (extra.categoryType === 'employee' ? 'employee' : 'student') as 'employee' | 'student',
              university: row.city || '',
              regions: row.location || '',
              shift: extra.shift,
              seats: extra.seats,
              vehicleType: extra.vehicleType,
              targetAudience: extra.targetAudience,
              price: row.price || '0',
              note: extra.note,
              postedBy: row.seller_id,
              phone: row.phone,
              user_id: row.seller_id,
              status: row.status,
              createdAt: row.created_at,
              createdAtISO: row.created_at,
              views: row.views || 0,
              seller: row.seller,
              sellerName: row.seller?.name || 'مستخدم',
              sellerAvatar: row.seller?.avatar || ''
            };
          });
          setLocalLines(formattedLines);
        }

        if (prodsRes.data && isMounted) {
          const formattedProds = prodsRes.data.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            price: row.price,
            images: row.images || [],
            category: row.category,
            condition: row.condition,
            stock: row.stock,
            location: row.location || row.governorate,
            governorate: row.governorate,
            postedBy: row.seller_id,
            phone: row.phone,
            createdAt: row.created_at,
            createdAtISO: row.created_at,
            views: row.views || 0,
            status: row.status,
            isDemo: row.is_demo,
            time: row.created_at,
            type: row.type || 'product',
            adCount: row.adCount || 0,
            soldCount: row.soldCount || 0,
            favorites: row.favorites || 0,
            seller: row.seller || {
              name: 'مستخدم',
              avatar: '',
              isVerified: false,
              rating: 5
            }
          }));
          setLocalProds(formattedProds);
        }

        // linesRes is ignored since we mapped lines from adsRes

        const dbProfile = dbProfileRes.data;

        if (dbProfile && isMounted) {
          setSellerUser({
            id: dbProfile.id,
            name: dbProfile.full_name || dbProfile.name || 'بائع في سوق بغداد',
            avatar: dbProfile.avatar_url || dbProfile.avatar || DEFAULT_AVATAR,
            phone: dbProfile.phone || '',
            location: dbProfile.city || dbProfile.location || 'بغداد',
            isVerified: dbProfile.role === 'owner' || dbProfile.role === 'vendor' || dbProfile.role === 'admin',
            rating: 4.9,
            ratingCount: 5,
            cover: dbProfile.cover_url || DEFAULT_COVER,
            created_at: dbProfile.created_at,
            role: dbProfile.role || 'user'
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
          setLoadingContent(false);
        }
      }
    }
    loadSellerDetails();
    return () => { isMounted = false; };
  }, [sellerId, sellerInfo, storedUsers]);

  const [visibleAdsCount, setVisibleAdsCount] = useState(4);
  const [visibleProdsCount, setVisibleProdsCount] = useState(4);
  const [visibleLinesCount, setVisibleLinesCount] = useState(4);

  const formatJoinedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' });
    } catch {
      return isoString;
    }
  };

  const handleRate = (stars: number) => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (user.id === sellerId) {
      alert('لا يمكنك تقييم نفسك!');
      return;
    }
    
    try {
      const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const idx = users.findIndex((u: any) => u.id === sellerId);
      let targetUser = users[idx];
      if (!targetUser) {
        targetUser = {
          id: sellerId,
          name: sellerInfo?.name || 'مستخدم',
          avatar: sellerInfo?.avatar || DEFAULT_AVATAR,
          cover: DEFAULT_COVER,
          location: sellerInfo?.location || 'العراق',
          isVerified: sellerInfo?.isVerified || false,
          rating: 5,
          ratingCount: 0
        };
      }
      
      const oldCount = targetUser.ratingCount ?? 0;
      const oldRating = targetUser.rating ?? 5;
      const newCount = oldCount + 1;
      const newRating = oldCount === 0 ? stars : Number(((oldRating * oldCount + stars) / newCount).toFixed(1));
      
      const updatedUser = {
        ...targetUser,
        rating: newRating,
        ratingCount: newCount
      };
      
      if (idx >= 0) {
        users[idx] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      
      localStorage.setItem('souqUsers', JSON.stringify(users));
      setSellerUser(updatedUser);
      alert('تم تسجيل تقييمك بنجاح! ⭐');
    } catch (e) {
      console.error(e);
    }
  };



  const effectiveSeller = sellerUser || {
    id: sellerId,
    name: sellerInfo?.name || 'مستخدم في سوق بغداد',
    avatar: sellerInfo?.avatar || DEFAULT_AVATAR,
    cover: DEFAULT_COVER,
    location: sellerInfo?.location || 'بغداد',
    isVerified: sellerInfo?.isVerified || false,
    rating: sellerInfo?.rating || 4.8,
    ratingCount: 5,
    created_at: new Date().toISOString()
  };

  return (
    <>
      <LoadingScreen isLoading={loadingProfile || loadingContent} minDuration={2000} />
      <div className="min-h-screen bg-[#0c2b5e] pt-16 pb-10">
      {/* Cover */}
      <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gray-900 relative overflow-hidden flex items-center justify-center">
        <img src={effectiveSeller?.cover || DEFAULT_COVER} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"/>
        <img 
          src={effectiveSeller?.cover || DEFAULT_COVER} 
          alt="Cover" 
          className="relative w-full h-full object-cover z-0"
        />
        {/* Watermark */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 opacity-60 select-none pointer-events-none drop-shadow-xl">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-900 rounded-lg flex items-center justify-center border border-amber-500/40">
            <span className="text-white font-bold text-[10px] sm:text-xs">سوك</span>
          </div>
          <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md">سوك بغداد</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent z-10"/>
      </div>

      <div className="container mx-auto px-4 max-w-3xl relative">
        {/* Avatar & Actions Container */}
        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
          {/* Avatar */}
          <div className="relative z-20">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 shadow-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center ${effectiveSeller.role && effectiveSeller.role !== 'user' ? getGlowClass(effectiveSeller.role) : 'border-gray-950'}`}>
              <img src={effectiveSeller?.avatar || DEFAULT_AVATAR} alt={effectiveSeller?.name} className="w-full h-full object-cover"/>
            </div>
            {Boolean((user && (String(effectiveSeller.id) === String(user.id) || String(effectiveSeller.phone) === String(user.phone))) || onlineStatuses[effectiveSeller.id] || onlineStatuses[effectiveSeller.phone]) ? (
              <span className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-950 flex items-center justify-center shadow-lg z-30" title="متصل الآن">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              </span>
            ) : (
              <span className="absolute bottom-2 right-2 w-5 h-5 bg-gray-500 rounded-full border-2 border-gray-950 shadow-lg z-30" title="غير متصل" />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-2">
            <button onClick={()=>{
              handleUniversalShare({
                title: effectiveSeller.name,
                type: 'profile',
                location: effectiveSeller.location || 'بغداد',
                id: effectiveSeller.id,
                url: '/seller/' + effectiveSeller.id,
                image: effectiveSeller.avatar || DEFAULT_AVATAR
              });
            }} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg border border-gray-700 hover:bg-gray-700" title="مشاركة الملف">
              <Share2 className="w-4 h-4"/>
              <span className="hidden sm:inline">مشاركة</span>
            </button>
            <button onClick={onBack} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-600">
              <ChevronRight className="w-4 h-4"/>
              <span className="hidden sm:inline">رجوع</span>
            </button>
          </div>
        </div>

        {/* User Details */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{effectiveSeller?.name}</h2>
            {effectiveSeller?.isVerified && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-bold">
                <Shield className="w-3 h-3"/>موثق
              </span>
            )}
            {Boolean((user && (String(effectiveSeller.id) === String(user.id) || String(effectiveSeller.phone) === String(user.phone))) || onlineStatuses[effectiveSeller.id] || onlineStatuses[effectiveSeller.phone]) ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-full font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> متصل الآن
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 text-xs rounded-full font-medium">
                غير متصل
              </span>
            )}
          </div>
          
          {/* Interactive Rating */}
          <div className="flex items-center gap-2 mt-2 bg-gray-800/40 p-2.5 rounded-xl border border-gray-800/80 inline-flex flex-wrap">
            <span className="text-gray-400 text-xs font-medium">تقييم البائع:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => {
                const isLit = stars <= Math.round(effectiveSeller.rating);
                return (
                  <button 
                    key={stars} 
                    onClick={() => handleRate(stars)}
                    className="p-0.5 hover:scale-125 transition-transform"
                    title={`تقييم بـ ${stars} نجوم`}
                  >
                    <Star className={`w-5 h-5 ${isLit ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>
            <span className="text-amber-400 font-bold text-sm mr-1">{effectiveSeller.rating}</span>
            <span className="text-gray-500 text-xs">({effectiveSeller.ratingCount || 1} تقييم)</span>
          </div>

          {user && (user.role === 'admin' || user.role === 'owner') && (
            <div className="mt-3">
              <button 
                onClick={() => {
                  if(window.confirm('هل أنت متأكد من حذف هذا الملف الشخصي وجميع إعلاناته؟')) {
                    onDeleteProfile?.(sellerId);
                  }
                }} 
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-colors text-sm w-max"
              >
                <Trash2 className="w-4 h-4"/> حذف الملف الشخصي
              </button>
            </div>
          )}

          <p className="text-gray-400 text-sm mt-3 flex items-center gap-3">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-500" />{effectiveSeller.location}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-500" />انضم في {formatJoinedDate(effectiveSeller.joinedDate || effectiveSeller.created_at || new Date().toISOString())}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[{v:sellerAds.length,l:'إعلان',c:'text-amber-400'},{v:sellerProds.length,l:'منتج',c:'text-purple-400'},{v:sellerAds.reduce((s,a)=>s+a.views,0)+sellerProds.reduce((s,p)=>s+p.views,0),l:'مشاهدة',c:'text-blue-400'}].map((s,i)=>(
            <div key={i} className="bg-gray-800 rounded-2xl p-3 text-center border border-gray-700">
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-gray-400 text-xs">{s.l}</p>
            </div>
          ))}
        </div>
        {/* Tabs */}
        {loadingContent ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
            <p className="text-amber-400 font-bold mb-1">جاري جلب كامل المحتوى...</p>
            <p className="text-gray-400 text-sm">يرجى الانتظار ثوانٍ قليلة</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-5 bg-gray-800 p-1.5 rounded-2xl border border-gray-700 overflow-x-auto hide-scrollbar">
              {([['ads',`📢 الإعلانات (${sellerAds.length})`],['products',`🛍️ المنتجات (${sellerProds.length})`]] as [string,string][]).map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t as any)} className={`flex-shrink-0 flex-1 py-2 px-3 rounded-xl text-sm font-bold ${tab===t?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>{l}</button>
              ))}
              {sellerLines.length > 0 && (
                <button onClick={() => setTab('lines')} className={`flex-shrink-0 flex-1 py-2 px-3 rounded-xl text-sm font-bold ${tab==='lines'?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>
                  🚐 الخطوط ({sellerLines.length})
                </button>
              )}
            </div>

            {tab==='ads'&&(sellerAds.length===0?(
              <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">📭</div><p className="text-gray-400">لا إعلانات بعد</p></div>
            ):(
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {sellerAds.slice(0, visibleAdsCount).map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}} sellerRole={effectiveSeller.role}/>)}
                </div>
                {visibleAdsCount < sellerAds.length && (
                  <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-gray-400 text-sm mb-3">
                      تم العثور على {sellerAds.length} إعلان، يتم عرض {visibleAdsCount} من أصل {sellerAds.length} (يتوفر {sellerAds.length - visibleAdsCount} إعلان متاح حالياً)
                    </p>
                    <InfiniteScrollTrigger
                      hasMore={visibleAdsCount < sellerAds.length}
                      onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleAdsCount(prev => prev + 4); }}
                      loadingText="جاري تحميل المزيد من الإعلانات..."
                    />
                  </div>
                )}
              </div>
            ))}
            
            {tab==='products'&&(sellerProds.length===0?(
              <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">🛍️</div><p className="text-gray-400">لا منتجات بعد</p></div>
            ):(
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {sellerProds.slice(0, visibleProdsCount).map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}} sellerRole={effectiveSeller.role}/>)}
                </div>
                {visibleProdsCount < sellerProds.length && (
                  <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-gray-400 text-sm mb-3">
                      تم العثور على {sellerProds.length} منتج، يتم عرض {visibleProdsCount} من أصل {sellerProds.length} (يتوفر {sellerProds.length - visibleProdsCount} منتج متاح حالياً)
                    </p>
                    <InfiniteScrollTrigger
                      hasMore={visibleProdsCount < sellerProds.length}
                      onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleProdsCount(prev => prev + 4); }}
                      loadingText="جاري تحميل المزيد من المنتجات..."
                    />
                  </div>
                )}
              </div>
            ))}

            {tab==='lines'&&(sellerLines.length===0?(
              <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">🚐</div><p className="text-gray-400">لا خطوط نقل بعد</p></div>
            ):(
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerLines.slice(0, visibleLinesCount).map(line=><TransportAdCard key={line.id} ad={line} onSelect={()=>onSelectTransport?.(line)} onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===line.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"transport",item:line});}} onShare={() => handleUniversalShare({ id: line.id, university: line.university, type: line.type, regions: line.regions, price: line.price })} seller={storedUsers.find(u=>u.id===line.postedBy)} />)}
                </div>
                {visibleLinesCount < sellerLines.length && (
                  <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-gray-400 text-sm mb-3">
                      تم العثور على {sellerLines.length} خط نقل، يتم عرض {visibleLinesCount} من أصل {sellerLines.length}
                    </p>
                    <InfiniteScrollTrigger
                      hasMore={visibleLinesCount < sellerLines.length}
                      onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleLinesCount(prev => prev + 4); }}
                      loadingText="جاري تحميل المزيد من الخطوط..."
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Owner Dashboard
// ─────────────────────────────────────────────

// getWhatsAppResetLink is imported from utils/helpers

// SystemLog interface is imported from ./types (removed duplicate)

// logSystemAction moved to src/utils/logs.ts

// OwnerDashboard component has been extracted and is now lazy loaded.

function TransportAdCard({ ad, onSelect, onActionMenu, onShare, seller }: { ad: TransportAd, onSelect: () => void, onActionMenu?: (e: any) => void, onShare?: () => void, seller?: any }) {
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
      <div className="absolute top-0 right-0 flex items-center gap-1">
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

function AdminPanel({ ads, onDeleteAd, onClose }:{ads:Ad[];onDeleteAd:(id:number)=>void;onClose:()=>void}) {
  return (
    <div className="min-h-screen bg-[#0c2b5e] pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-red-400"/></div>
            <div><h1 className="text-xl font-bold text-white">لوحة الإدارة</h1><p className="text-gray-400 text-xs">إدارة الإعلانات والمحتوى</p></div></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3></div>
          {ads.length===0?<div className="p-8 text-center text-gray-400">لا إعلانات</div>:ads.map(ad=>(
            <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50">
              <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover"/>
              <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع</p></div>
              <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400" title="حذف الإعلان" aria-label="حذف الإعلان"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Notifications Panel
// ─────────────────────────────────────────────
function NotifPanel({ isOpen, onClose, notifs, onNotifClick, onHistoryClick, onMarkRead, onArchiveAll }:{
  isOpen:boolean;
  onClose:()=>void;
  notifs:any[];
  onNotifClick:(senderId:string)=>void;
  onHistoryClick:(itemId: string | number, itemType: string)=>void;
  onMarkRead:(id: number | string, sourceTable?: 'ads' | 'user_notifications') => void;
  onArchiveAll:() => void;
}) {
  const [tab, setTab] = useState<'incoming' | 'history'>('incoming');
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const playSound = useSound();

  const [dismissedAdmin, setDismissedAdmin] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissedAdminNotifs') || '[]'); } catch { return []; }
  });

  const ADMIN_NOTIFICATIONS = [
    { 
      id: 'admin_welcome_v1', 
      title: 'إشعار من الإدارة 👑', 
      message: 'مرحباً بك في تحديثات سوك بغداد! نعمل حالياً على تحسين سرعة التطبيق وإضافة ميزات جديدة لتسهيل عملك.',
      time: new Date().toISOString()
    }
  ];

  const fetchedAdminNotifs = notifs.filter(n => n.type === 'system' || n.sourceTable === 'user_notifications');
  const allAdminNotifs = [...ADMIN_NOTIFICATIONS, ...fetchedAdminNotifs];
  const visibleAdminNotifs = allAdminNotifs.filter(n => !dismissedAdmin.includes(String(n.id)));

  const handleDismissAdmin = (n: any) => {
    playSound('click');
    const updated = [...dismissedAdmin, String(n.id)];
    setDismissedAdmin(updated);
    localStorage.setItem('dismissedAdminNotifs', JSON.stringify(updated));
    if (n.sourceTable) {
       onMarkRead(n.id, n.sourceTable);
    }
  };

  const incomingNotifs = notifs.filter(n => n.targetType === 'owner' || !n.targetType);
  const historyNotifs = notifs.filter(n => n.targetType === 'viewer');
  const activeNotifs = tab === 'incoming' ? incomingNotifs : historyNotifs;

  return (
    <AnimatePresence>
      {isOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60"/>
        <motion.div initial={{x:300}} animate={{x:0}} exit={{x:300}} onClick={e=>e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 p-5 overflow-y-auto border-l border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">الإشعارات</h2>
            <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
          </div>

          {visibleAdminNotifs.length > 0 && (
            <div className="mb-4 space-y-2">
              {visibleAdminNotifs.map(n => (
                <div key={n.id} onClick={() => handleDismissAdmin(n)} className="bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border border-amber-500/30 rounded-xl p-3 cursor-pointer hover:bg-amber-500/30 transition-all relative group shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">👑</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-amber-400 text-sm font-bold">{n.title}</p>
                      <p className="text-gray-300 text-xs mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-amber-500/60 text-[10px] mt-2 font-bold animate-pulse">👉 اضغط لإخفاء هذا الإشعار</p>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <X className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-4 bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button 
              onClick={() => setTab('incoming')} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'incoming' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🔔 المهتمين بي ({incomingNotifs.length})
            </button>
            <button 
              onClick={() => setTab('history')} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'history' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              🕒 سجل مشاهداتي ({historyNotifs.length})
            </button>
          </div>

          {tab === 'incoming' && incomingNotifs.length > 0 && (
            <button 
              onClick={onArchiveAll}
              className="w-full mb-4 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" /> أرشفة كل الإشعارات
            </button>
          )}

          <div className="space-y-2">
            <div className="text-center py-10 bg-gray-800/30 rounded-2xl border border-gray-700/50 mt-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                {tab === 'history' ? <Clock className="w-6 h-6 text-gray-500" /> : <Bell className="w-6 h-6 text-gray-500" />}
              </div>
              <h3 className="text-white font-bold mb-2">{tab === 'history' ? 'سجل المشاهدات غير متوفر' : 'قسم المهتمين بي غير متوفر'}</h3>
              <p className="text-gray-400 text-xs px-6 leading-relaxed">
                سوف يعمل قريباً.. قم بترقية حسابك وتوثيقه للحصول على هذه الميزة! 🚀
              </p>
            </div>
            {false && activeNotifs.map((n, i) => (
                <div key={n.id || i} 
                  onClick={async () => {
                    // Mark as read/archive
                    if (n.id) onMarkRead(n.id, n.sourceTable);
                    
                    if (tab === 'incoming') {
                      if (n.type === 'message' || !n.senderId) {
                        setSelectedNotif(n);
                      } else if (n.senderId) {
                        onNotifClick(n.senderId);
                        onClose();
                      }
                    } else {
                      if (n.itemId) {
                        onHistoryClick(n.itemId, n.itemType);
                        onClose();
                      }
                    }
                  }}
                  className="bg-gray-800 rounded-xl p-3 border border-gray-700 transition-colors cursor-pointer hover:border-amber-500/50 hover:bg-gray-800/80"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'message' ? 'bg-blue-500/20' : n.type === 'interest' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                      {n.type === 'message' ? <MessageSquare className="w-4 h-4 text-blue-400" /> : n.type === 'interest' ? <Heart className="w-4 h-4 text-red-400 fill-red-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{n.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed break-words">{n.message}</p>
                      
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        <p className="text-gray-500 text-[10px]"><TimeAgo iso={n.time || new Date().toISOString()} /></p>
                        {tab === 'incoming' && (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            {n.type === 'message' ? '🔍 تفاصيل الرسالة' : '👉 عرض الملف'}
                          </span>
                        )}
                        {tab === 'history' && n.itemId && (
                          <span className="text-[10px] text-emerald-400 font-semibold">🔍 فتح الإعلان</span>
                        )}
                      </div>

                      {tab === 'incoming' && n.senderPhone && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                          <a 
                            href={`https://wa.me/964${n.senderPhone.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-green-500/10"
                          >
                            <MessageSquare className="w-3 h-3" /> مراسلة واتساب
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Selected Notification Detail Modal inside notifications view */}
        <AnimatePresence>
          {selectedNotif && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedNotif(null)}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-amber-500" />
                <button title="إغلاق" aria-label="إغلاق" 
                  onClick={() => setSelectedNotif(null)} 
                  className="absolute top-4 left-4 p-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base leading-tight">{selectedNotif.title}</h3>
                    <p className="text-gray-500 text-[10px] mt-0.5"><TimeAgo iso={selectedNotif.time || new Date().toISOString()} /></p>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{selectedNotif.message}</p>
                
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-750 text-white font-bold text-xs rounded-xl border border-gray-700 transition-colors"
                >
                  إغلاق
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Market View
// ─────────────────────────────────────────────
function MarketView({ 
  user, allAds, allProducts, favorites, storedUsers: propStoredUsers, 
  onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, 
  onTransportClick, onSelectTransportAd, transportLines, onActionMenu,
  isStandalone, onInstallClick,
  search, setSearch, cat, setCat, gov, setGov, sort, setSort, 
  priceMin, setPriceMin, priceMax, setPriceMax,
  hasMoreAds, hasMoreProducts, onLoadMoreAds, onLoadMoreProducts,
  totalAdsCount, totalProductsCount,
  loadingMoreAds, loadingMoreProducts, isInitialLoading
}:{
  user:User|null; allAds:Ad[]; allProducts:Product[]; favorites:number[]; storedUsers?: any[];
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void;
  onToggleFav:(id:number)=>void; onRequireAuth:()=>void; onSellerClick:(id:string, source?: 'home'|'accounts')=>void;
  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
  onActionMenu?: any;
  isStandalone?: boolean;
  onInstallClick?: () => void;
  search: string; setSearch: (s: string) => void;
  cat: string; setCat: (c: string) => void;
  gov: string; setGov: (g: string) => void;
  sort: 'recent'|'views'|'price-low'|'price-high'; setSort: (s: any) => void;
  priceMin: string; setPriceMin: (p: string) => void;
  priceMax: string; setPriceMax: (p: string) => void;
  hasMoreAds: boolean; hasMoreProducts: boolean;
  onLoadMoreAds: () => void; onLoadMoreProducts: () => void;
  totalAdsCount: number; totalProductsCount: number;
  loadingMoreAds?: boolean; loadingMoreProducts?: boolean;
  isInitialLoading?: boolean;
}) {
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [visibleProfilesCount, setVisibleProfilesCount] = useState(4);
  const [visibleTransportCount, setVisibleTransportCount] = useState(4);
  const [visibleTopSellers, setVisibleTopSellers] = useState(5);
  const [contentTab, setContentTab] = useState<'ads'|'products'|'profiles'|'transport'|'all'>(() => {
    if (typeof window === 'undefined') return 'all';
    const h = window.location.hash;
    if (h === '#/accounts' || h === '#/sellers') return 'profiles';
    if (h === '#/transport') return 'transport';
    if (h.startsWith('#/products')) return 'products';
    if (h.startsWith('#/ads')) return 'ads';
    return 'all';
  });

  // Sync state when URL hash changes externally
  useEffect(() => {
    const handleSwitch = () => setContentTab('profiles');
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#/accounts' || h === '#/sellers') {
        setContentTab('profiles');
      } else if (h === '#/transport') {
        setContentTab('transport');
      } else if (h.startsWith('#/products')) {
        setContentTab('products');
        const parts = h.split('/');
        if (parts[2]) setCat(parts[2]);
      } else if (h.startsWith('#/ads')) {
        setContentTab('ads');
        const parts = h.split('/');
        if (parts[2]) setCat(parts[2]);
      } else if (h.startsWith('#/category/')) {
        const parts = h.split('/');
        if (parts[2]) setCat(parts[2]);
      } else if (h === '#/' || h === '') {
        setContentTab('all');
        setCat('all');
      }
    };
    window.addEventListener('switch-to-profiles-tab', handleSwitch);
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => {
      window.removeEventListener('switch-to-profiles-tab', handleSwitch);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  // Push updated hash when user clicks category or content tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let targetHash = '#/';
    if (contentTab === 'profiles') {
      targetHash = '#/accounts';
    } else if (contentTab === 'transport') {
      targetHash = '#/transport';
    } else if (contentTab === 'products') {
      targetHash = cat !== 'all' ? `#/products/${cat}` : '#/products';
    } else if (contentTab === 'ads') {
      targetHash = cat !== 'all' ? `#/ads/${cat}` : '#/ads';
    } else if (contentTab === 'all') {
      targetHash = cat !== 'all' ? `#/category/${cat}` : '#/';
    }

    if (window.location.hash !== targetHash && !window.location.hash.includes('/ad/') && !window.location.hash.includes('/seller/')) {
      window.history.pushState(null, '', targetHash);
    }
  }, [cat, contentTab]);
  const [showFilters, setShowFilters] = useState(false);

  const [localStoredUsers, setLocalStoredUsers] = useState<any[]>([]);
  const storedUsers = propStoredUsers && propStoredUsers.length > 0 ? propStoredUsers : localStoredUsers;
  const onlineStatuses = useOnlineStatuses();

  const publishedTransportLines = transportLines.filter(a => a.status === 'published');

  const filteredTransport = publishedTransportLines.filter(a => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (a.regions && a.regions.toLowerCase().includes(term)) ||
           (a.university && a.university.toLowerCase().includes(term)) ||
           (a.note && a.note.toLowerCase().includes(term));
  });

  useEffect(() => {
    let isMounted = true;
    async function loadAllProfiles() {
      try {
        const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const sellersMap = new Map();

        // Fetch registered profiles from DB
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
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

        // Add local users
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

        // Aggregate ads
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

        // Aggregate products
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

        if (isMounted) setLocalStoredUsers(Array.from(sellersMap.values()));
      } catch (e) {
        console.error(e);
      }
    }
    loadAllProfiles();
    return () => { isMounted = false; };
  }, [allAds, allProducts]);

  const filteredProfiles = storedUsers.filter(u => {
    // Only show verified accounts, owners, admins, or users with at least 1 ad/product
    const isOwnerOrAdmin = u.role === 'owner' || u.role === 'admin' || u.role === 'vendor';
    const isVerified = u.isVerified || u.verified;
    const isMerchant = (u.adCount + (u.prodCount || 0)) >= 1;
    if (!isOwnerOrAdmin && !isVerified && !isMerchant) {
      return false;
    }

    const term = search.toLowerCase();
    return !search || 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.phone && u.phone.includes(term));
  });

  const displayedProfiles = filteredProfiles.slice(0, visibleProfilesCount);

  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');

  const filterAds = allAds.filter(a => a.status !== 'sold');
  const filterProds = allProducts.filter(p => p.status !== 'sold');

  const showAds = contentTab==='ads'||contentTab==='all';
  const showProds = contentTab==='products'||contentTab==='all';

  const canViewFullDirectory = user?.role === 'admin' || user?.role === 'owner' || user?.isVerified;
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-12 relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-10 right-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"/><div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl"/></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <motion.h1 initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="text-3xl md:text-4xl font-bold text-white mb-3">كل شي تحتاجه <span className="text-amber-400">بمكان واحد</span></motion.h1>
            <p className="text-gray-300">إعلانات + متجر — السوق الرقمي العراقي</p>
          </div>
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن سيارة، هاتف، عقار، منتج..."
                className="w-full bg-white/10 backdrop-blur text-white placeholder-gray-300 rounded-2xl py-4 pr-12 pl-4 border border-white/20 focus:border-amber-400 outline-none text-sm"/></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.filter(c=>c.id!=='games').map(c=>(
              <motion.button key={c.id} whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setCat(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${cat===c.id?'bg-amber-500 text-black border-amber-500':'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
                <span>{c.emoji}</span><span>{c.name}</span>
              </motion.button>
            ))}
          </div>
          <LiveVisitorCounter />
          {/* Transport Quick Access */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="mt-5 max-w-2xl mx-auto">
            <button onClick={()=>onTransportClick?.()}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-2xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-400"/>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">🚌 قسم الخطوط</p>
                  <p className="text-emerald-300 text-xs">نقل يومي للطلاب والموظفين 🎓👔</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1 transition-transform"/>
            </button>
          </motion.div>

          {!isStandalone && onInstallClick && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
              className="mt-3 max-w-2xl mx-auto">
              <button onClick={onInstallClick}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/30 rounded-2xl transition-all group"
                title="تثبيت التطبيق"
                aria-label="تثبيت التطبيق"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-amber-400"/>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">📲 تثبيت التطبيق</p>
                    <p className="text-amber-300/80 text-xs">ثبّت تطبيق "سوك بغداد" على جهازك لسهولة الوصول السريع</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform"/>
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filter bar */}
          <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
              {/* Content type tabs */}
              <div className="flex bg-gray-700 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-hide max-w-full">
                {([['all','الكل'],['ads','📢 إعلانات'],['products','🛍️ منتجات'],['profiles','👤 حسابات'],['transport','🚌 الخطوط']] as [string,string][]).map(([t,l])=>(
                  <button key={t} onClick={()=>setContentTab(t as any)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold ${contentTab===t?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>{l}</button>
                ))}
              </div>
              <div className="flex-1 flex flex-wrap gap-2 items-center justify-end">
                <select value={gov} onChange={e=>setGov(e.target.value)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none" title="المحافظة" aria-label="المحافظة">
                  {IRAQI_GOVERNORATES.map(g=><option key={g}>{g}</option>)}</select>
                <select value={sort} onChange={e=>setSort(e.target.value as any)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none" title="الترتيب" aria-label="الترتيب">
                  <option value="recent">الأحدث</option><option value="views">الأكثر مشاهدة</option>
                  <option value="price-low">السعر: من الأقل</option><option value="price-high">السعر: من الأعلى</option>
                </select>
                <button onClick={()=>setShowFilters(!showFilters)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs border ${showFilters?'bg-amber-500 text-black border-amber-500':'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  <SlidersHorizontal className="w-3.5 h-3.5"/><span>فلاتر</span></button>
                <div className="flex bg-gray-700 rounded-xl p-0.5">
                  <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode==='grid'?'bg-amber-500 text-black':'text-gray-400'}`} title="عرض شبكي" aria-label="عرض شبكي"><Grid className="w-4 h-4"/></button>
                  <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode==='list'?'bg-amber-500 text-black':'text-gray-400'}`} title="عرض قائمة" aria-label="عرض قائمة"><List className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {showFilters&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className="pt-3 mt-3 border-t border-gray-700 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2"><label className="text-gray-400 text-xs">السعر من:</label>
                    <input value={fmt(priceMin)} onChange={e=>setPriceMin(fmt(e.target.value))} placeholder="0" className="w-32 bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm outline-none"/></div>
                  <div className="flex items-center gap-2"><label className="text-gray-400 text-xs">إلى:</label>
                    <input value={fmt(priceMax)} onChange={e=>setPriceMax(fmt(e.target.value))} placeholder="بلا حد" className="w-32 bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm outline-none"/></div>
                  <button onClick={()=>{setPriceMin('');setPriceMax('');setGov('الكل');setSearch('');}} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm">مسح الفلاتر</button>
                </div>
              </motion.div>}
            </AnimatePresence>
          </div>

          {isInitialLoading ? (
            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl" dir="rtl">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Sparkles className="w-8 h-8 text-amber-400"/>
              </div>
              <h3 className="text-xl font-bold text-white">أهلاً بك في سوق بغداد! ✨</h3>
              <p className="text-gray-300 text-sm">جاري تحميل أحدث الإعلانات والمنتجات، يرجى الانتظار ثوانٍ...</p>
              <div className="flex justify-center gap-1.5 pt-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
              </div>
            </div>
          ) : (
            <>
              {/* Ads */}
              {showAds&&filterAds.length>0&&(
                <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><FileText className="w-4 h-4"/>الإعلانات ({filterAds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              
              {/* Sticky Counts stats banner */}
              <div className="sticky top-[4rem] z-20 bg-[#0c2b5e]/90 backdrop-blur-md py-2.5 px-3 border-b border-transparent shadow-sm shadow-[#0c2b5e]/10 mb-4 rounded-xl flex items-center justify-between">
                <p className="text-gray-400 text-xs">تم العثور على <span className="text-amber-400 font-bold">{totalAdsCount}</span> إعلان، يتم عرض {Math.min(filterAds.length, totalAdsCount)} من أصل {totalAdsCount}{totalAdsCount > 0 && ` (يتوفر ${totalAdsCount} إعلان متاح حالياً)`}</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                  {filterAds.map(ad=>{
                    const seller = propStoredUsers?.find(u=>u.id===ad.postedBy);
                    return <AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                      onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(ad.id);}}
                      onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                      onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===ad.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"ad",item:ad});}}
                      sellerRole={seller?.role}
                    />;
                  })}
                </div>
                <InfiniteScrollTrigger 
                  hasMore={hasMoreAds} 
                  isLoading={loadingMoreAds} 
                  onLoadMore={onLoadMoreAds} 
                  loadingText="جاري تحميل المزيد من الإعلانات..." 
                />
              </div>
            </div>
          )}

          {/* Products */}
          {showProds&&filterProds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><ShoppingBag className="w-4 h-4"/>المنتجات ({filterProds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              
              {/* Sticky Counts stats banner */}
              <div className="sticky top-[4rem] z-20 bg-[#0c2b5e]/90 backdrop-blur-md py-2.5 px-3 border-b border-transparent shadow-sm shadow-[#0c2b5e]/10 mb-4 rounded-xl flex items-center justify-between">
                <p className="text-gray-400 text-xs">تم العثور على <span className="text-blue-450 font-bold">{totalProductsCount}</span> منتج، يتم عرض {Math.min(filterProds.length, totalProductsCount)} من أصل {totalProductsCount}{totalProductsCount > 0 && ` (يتوفر ${totalProductsCount} منتج متاح حالياً)`}</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                  {filterProds.map(p=>{
                    const seller = propStoredUsers?.find(u=>u.id===p.postedBy);
                    return <ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                      onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(p.id);}}
                      onSellerClick={(id)=>{if(id)onSellerClick(id);}}
                      onActionMenu={(e)=>{e.preventDefault(); if(user&&(user.id===p.postedBy||user.role==="admin"||user.role==="owner")) onActionMenu?.({type:"product",item:p});}}
                      sellerRole={seller?.role}
                    />;
                  })}
                </div>
                <InfiniteScrollTrigger 
                  hasMore={hasMoreProducts} 
                  isLoading={loadingMoreProducts} 
                  onLoadMore={onLoadMoreProducts} 
                  loadingText="جاري تحميل المزيد من المنتجات..." 
                />
              </div>
            </div>
          )}

          {/* Transport Lines */}
          {contentTab === 'transport' && (
            <div className="mb-8">
              {filteredTransport.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🚌</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد خطوط مطابقة</h3>
                  <p className="text-gray-400 text-sm">جرب البحث بكلمات أخرى أو تصفح قسم الخطوط الكامل</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      يتم عرض {Math.min(visibleTransportCount, filteredTransport.length)} من أصل {filteredTransport.length}
                    </h3>
                  </div>
                  {filteredTransport.slice(0, visibleTransportCount).map(ad => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onSelectTransportAd?.(ad)}
                      className={`bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer hover:border-emerald-500/60 ${
                        ad.type === 'offer' ? 'border-emerald-500/30' : 'border-amber-500/30'
                      }`}
                    >
                      {/* Type Badge */}
                      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold ${
                        ad.type === 'offer' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'
                      }`}>
                        {ad.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'}
                      </div>

                      <div className="p-4 pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                              {ad.university}
                            </h3>
                            <p className="text-gray-400 text-sm flex items-center gap-1.5 leading-relaxed">
                              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
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
                            <Tag className="w-4 h-4" />
                            <span>السعر المفضل: {ad.price}</span>
                          </div>
                        )}

                        {ad.note && (
                          <p className="text-gray-300 text-xs mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">{ad.note}</p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <img
                              src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-gray-600"
                            />
                            <div>
                              <span className="text-gray-300 text-xs block font-semibold">{ad.sellerName}</span>
                              <span className="text-gray-500 text-[10px] block">
                                <TimeAgo iso={ad.createdAt} />
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.a
                              href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type === 'offer' ? 'خط متوفر' : 'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> واتساب
                            </motion.a>
                            <motion.button
                              onClick={(e) => { e.stopPropagation(); handleUniversalShare({ id: ad.id, university: ad.university, type: ad.type, regions: ad.regions, price: ad.price }); }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-xl text-xs hover:bg-amber-500/30"
                            >
                              <Share2 className="w-3.5 h-3.5" /> مشاركة
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
                <InfiniteScrollTrigger
                  hasMore={visibleTransportCount < filteredTransport.length}
                  onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleTransportCount(prev => prev + 4); }}
                  loadingText="جاري تحميل المزيد من الخطوط..."
                />
              </div>
            )}

          {/* Profiles Hub */}
          {contentTab === 'profiles' && (
            <div className="mb-8 space-y-6">
              {/* Accounts Dedicated Search & Header Banner */}
              {canViewFullDirectory ? (
              <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-5 rounded-3xl border border-gray-700 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>👤 دليل الحسابات والتجار الموثوقين</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {filteredProfiles.length} حساب
                      </span>
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">تصفح وابحث عن كبار التجار والشركاء والمستخدمين وتواصل معهم مباشرة</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ابحث عن حساب باسم المستخدم أو رقم الهاتف (077...)"
                    className="w-full bg-[#0c2b5e]/80 text-white placeholder-gray-400 rounded-2xl py-3.5 pr-12 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-sm shadow-inner"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded-lg">
                      مسح
                    </button>
                  )}
                </div>
              </div>
            ) : null}

              {/* FEATURED TOP SELLERS SLIDER (If no search active and featured exist) */}
              {!search && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>⭐ كبار التجار والحسابات الأكثر نشاطاً</span>
                    </span>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth">
                    {storedUsers.filter(u => u.isVerified || (u.adCount + (u.prodCount || 0)) > 0).sort((a,b) => ((b.adCount||0)+(b.prodCount||0)) - ((a.adCount||0)+(a.prodCount||0))).slice(0, visibleTopSellers).map(topUser => {
                      const isOnline = !!onlineStatuses[topUser.id];
                      return (
                        <motion.div
                          key={`top-${topUser.id}`}
                          whileHover={{ y: -4, scale: 1.02 }}
                          onClick={() => onSellerClick(topUser.id, 'accounts')}
                          className="flex-shrink-0 w-64 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-4 border border-amber-500/40 shadow-lg cursor-pointer relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative shrink-0">
                              <img src={topUser.avatar} alt="" className={`w-12 h-12 rounded-full object-cover ${topUser.role && topUser.role !== 'user' ? getGlowClass(topUser.role) : 'border-2 border-amber-400'}`} />
                              <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-transparent shadow-sm shadow-[#0c2b5e]/10 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={isOnline ? 'متصل الآن' : 'أوفلاين'} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <h4 className="text-white font-bold text-sm truncate">{topUser.name}</h4>
                                {topUser.isVerified && <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-amber-300 font-medium block">⭐ 4.9 تاجر مميز</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center bg-[#0c2b5e]/60 rounded-xl p-2 border border-gray-800">
                            <div>
                              <span className="text-[10px] text-gray-400 block">الإعلانات</span>
                              <span className="text-xs font-bold text-white">{topUser.adCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">المنتجات</span>
                              <span className="text-xs font-bold text-amber-400">{topUser.prodCount || 0}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ALL PROFILES GRID */}
              {canViewFullDirectory ? (
                <>
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/60 rounded-3xl border border-gray-800">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد حسابات مطابقة للبحث</h3>
                  <p className="text-gray-400 text-sm">جرب البحث باسم آخر أو تأكد من رقم الهاتف المدخل</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedProfiles.map(profile => {
                    const isOnline = Boolean((user && (String(profile.id) === String(user.id) || String(profile.phone) === String(user.phone))) || onlineStatuses[profile.id] || onlineStatuses[profile.phone]);
                    return (
                      <motion.div
                        key={profile.id}
                        whileHover={{ y: -4 }}
                        onClick={() => onSellerClick(profile.id, 'accounts')}
                        className="bg-gray-800 hover:bg-gray-800/90 rounded-2xl p-4 border border-gray-700/80 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between shadow-md group"
                      >
                        <div className="flex items-start gap-3.5 mb-3">
                          <div className="relative shrink-0">
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className={`w-14 h-14 rounded-full object-cover transition-all ${profile.role && profile.role !== 'user' ? getGlowClass(profile.role) : 'border-2 border-gray-700 group-hover:border-amber-400'}`}
                            />
                            <div 
                              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 flex items-center justify-center ${
                                isOnline ? 'bg-green-500 ring-2 ring-green-500/30' : 'bg-gray-500'
                              }`} 
                              title={isOnline ? 'متصل الآن' : 'غير متصل'}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h3 className="text-white font-bold text-sm truncate group-hover:text-amber-300 transition-colors">{profile.name}</h3>
                              {profile.isVerified && (
                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <Shield className="w-3 h-3 fill-current" /> موثوق
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-700 text-gray-400'}`}>
                                {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
                              </span>
                              <span className="text-gray-400 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-400" /> {profile.location || 'بغداد'}
                              </span>
                            </div>

                            {profile.phone && (
                              <p className="text-gray-400 text-xs flex items-center gap-1.5 font-mono">
                                <PhoneIcon className="w-3 h-3 text-emerald-400" />
                                <span>{profile.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-bold bg-gray-900/80 px-2 py-1 rounded-lg border border-gray-700/50">
                              📢 {profile.adCount || 0} إعلان
                            </span>
                            {(profile.prodCount || 0) > 0 && (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                🛍️ {profile.prodCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {profile.phone && (
                              <a
                                href={`https://wa.me/964${profile.phone.replace(/^0/, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all shadow-md shadow-green-500/10"
                                title="مراسلة واتساب"
                              >
                                <MessageSquare className="w-3 h-3" /> مراسلة
                              </a>
                            )}
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                              الملف <ChevronLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              <InfiniteScrollTrigger
                hasMore={visibleProfilesCount < filteredProfiles.length}
                onLoadMore={async () => { await new Promise(r => setTimeout(r, 400)); setVisibleProfilesCount(prev => prev + 4); }}
                loadingText="جاري تحميل المزيد من الحسابات..."
              />
                </>
              ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 text-center mt-8">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                    <span className="text-3xl">👋</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">أهلاً بك في دليل الحسابات</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    نحن نسعد بتواجدك معنا! لرؤية الدليل الشامل والتواصل مع كافة التجار والحسابات، يرجى توثيق حسابك أولاً للحفاظ على مجتمع آمن وموثوق.
                  </p>
                  <a href="https://wa.me/9647700028170" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    تواصل معنا للتوثيق
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Empty */}
          {contentTab !== 'profiles' && ((showAds&&filterAds.length===0)||(showProds&&filterProds.length===0))&&filterAds.length===0&&filterProds.length===0&&(
            <div className="text-center py-20"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3><p className="text-gray-400 text-sm">جرب تغيير الفلاتر أو كلمة البحث</p></div>
          )}
        </>
      )}
    </div>
  </section>

      {/* Games */}
      <section className="hidden py-12 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6"><span className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full mb-3"><Gamepad2 className="w-4 h-4 text-amber-400"/><span className="text-amber-400 text-sm font-semibold">قسم الترفيه</span></span>
            <h2 className="text-2xl font-bold text-white">🎮 الألعاب الترفيهية</h2></div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {GAMES_DATA.map(g=><motion.div key={g.id} whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/20 cursor-pointer hover:bg-white/20">
              <div className="text-3xl mb-1">{g.emoji}</div><h3 className="text-white text-xs font-bold">{g.title}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-300 text-[10px] mt-1"><Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400"/>{g.rating}</div>
            </motion.div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
// ─────────────────────────────────────────────
// Transport View (قسم خطوط الجامعات)
// ─────────────────────────────────────────────
const UNIVERSITIES = [
  'الكل', 'جامعة بغداد', 'الجامعة المستنصرية', 'الجامعة التكنولوجية', 'الجامعة العراقية',
  'جامعة النهرين', 'كلية المأمون الجامعة', 'كلية التراث الجامعة', 'جامعة الفراهيدي',
  'كلية المنصور الجامعة', 'جامعة دجلة', 'كلية الاسراء الجامعة', 'كلية مدينة العلم', 'أخرى'
];

const EMPLOYEE_WORKPLACES = [
  'الكل', 'الوزارات والدوائر الحكومية', 'المنطقة الخضراء', 'مجمع الكليات / الجادرية',
  'البنوك والمصارف', 'الشركات الأهلية', 'المستشفيات والدوائر الصحية', 'ميناء / مطار بغداد',
  'شارع فلسطين / زيونة (تجارية)', 'المنصور / الحارثية (دوائر وشركات)', 'الكرادة (مؤسسات وشركات)', 'أخرى'
];

// TransportAd moved to src/types/index.ts

function TransportFormModal({ onClose, onSubmit, user, lines = [], editAd }: {
  onClose: () => void;
  onSubmit: (ad: TransportAd) => void;
  user: { id: string; name: string; avatar: string; phone: string };
  lines?: TransportAd[];
  editAd?: TransportAd | null;
}) {
  const isEdit = !!editAd;
  const [type, setType] = useState<'offer'|'request'>(editAd?.type || 'offer');
  const [categoryType, setCategoryType] = useState<'student'|'employee'>(editAd?.categoryType || 'student');
  
  const dynamicFormUniversities = categoryType === 'employee'
    ? Array.from(new Set([
        ...EMPLOYEE_WORKPLACES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType === 'employee').map(l => l.university)
      ])).filter(Boolean)
    : Array.from(new Set([
        ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType !== 'employee').map(l => l.university)
      ])).filter(Boolean);

  const finalFormUniversities = [...dynamicFormUniversities, 'أخرى'];

  const initialUniv = editAd?.university || finalFormUniversities[0] || (categoryType === 'employee' ? EMPLOYEE_WORKPLACES[1] : UNIVERSITIES[1]);
  const isCustomUniv = editAd?.university && !finalFormUniversities.includes(editAd.university);
  const [university, setUniversity] = useState(isCustomUniv ? 'أخرى' : initialUniv);
  const [customUniversity, setCustomUniversity] = useState(isCustomUniv ? editAd.university : '');
  const [regions, setRegions] = useState(editAd?.regions || '');
  const [price, setPrice] = useState(editAd?.price ? editAd.price : '');
  const [seats, setSeats] = useState(editAd?.seats?.toString() || '4');
  const [shift, setShift] = useState(editAd?.shift || 'صباحي');
  const [vehicleType, setVehicleType] = useState(editAd?.vehicleType || 'خصوصي');
  const [targetAudience, setTargetAudience] = useState(editAd?.targetAudience || 'مختلط');
  const [phone, setPhone] = useState(editAd?.phone || user.phone || '');
  const [note, setNote] = useState(editAd?.note || '');

  const formatPriceInput = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('en-US');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUniversity = university === 'أخرى' ? customUniversity.trim() : university;
    if (!finalUniversity || !regions || !phone) return;
    const generatedShortId = isEdit
      ? editAd.short_id
      : Math.random().toString(36).substring(2, 7).toUpperCase();
    onSubmit({
      id: isEdit ? editAd.id : Date.now(),
      type, categoryType, university: finalUniversity, regions, price, seats: type==='offer'?parseInt(seats)||4:0,
      shift, vehicleType, targetAudience, phone, note,
      postedBy: isEdit ? editAd.postedBy : user.id, sellerName: isEdit ? editAd.sellerName : user.name, sellerAvatar: isEdit ? editAd.sellerAvatar : user.avatar,
      createdAt: isEdit ? editAd.createdAt : new Date().toISOString(),
      status: isEdit ? editAd.status : 'published',
      views: isEdit ? editAd.views : 0,
      interest: isEdit ? editAd.interest : 0,
      whatsappClicks: isEdit ? editAd.whatsappClicks : 0,
      short_id: generatedShortId
    });
    onClose();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-md border border-emerald-500/30 z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{categoryType==='employee'?'إعلان خطوط الموظفين والشركات 👔':'إعلان خطوط الجامعات 🚐'}</h2>
              <p className="text-emerald-100 text-xs">{categoryType==='employee'?'موظف أم صاحب خط؟':'طالب أم صاحب خط؟'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 bg-white/20 rounded-xl text-white" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="flex bg-gray-800 p-1 rounded-xl">
            <button type="button" onClick={()=>setType('offer')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type==='offer'?'bg-emerald-500 text-white':'text-gray-400 hover:text-white'}`}>صاحب خط (أوفر مقاعد)</button>
            <button type="button" onClick={()=>setType('request')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type==='request'?'bg-emerald-500 text-white':'text-gray-400 hover:text-white'}`}>أبحث عن خط</button>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">فئة الخط والجمهور المستهدف</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setCategoryType('student'); setUniversity(UNIVERSITIES[1]); }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${categoryType==='student'?'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400':'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                🎓 خط طلاب (جامعات/مدارس)
              </button>
              <button type="button" onClick={() => { setCategoryType('employee'); setUniversity(EMPLOYEE_WORKPLACES[1]); }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${categoryType==='employee'?'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400':'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
                👔 خط موظفين (دوائر/شركات)
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">{categoryType==='employee'?'مكان العمل (دوائر / شركات)':'الجامعة / الكلية'}</label>
            <select value={university} onChange={e=>setUniversity(e.target.value)} title="الجامعة" aria-label="الجامعة"
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm mb-2">
              {finalFormUniversities.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {university === 'أخرى' && (
              <input value={customUniversity} onChange={e=>setCustomUniversity(e.target.value)} placeholder={categoryType==='employee'?'اكتب اسم الدائرة، الشركة أو مكان العمل هنا':'اكتب اسم الجامعة أو الكلية هنا'} required
                className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm animate-in fade-in duration-200"/>
            )}
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">مناطق المرور (مثال: السيدية، المنصور، الكرادة)</label>
            <input value={regions} onChange={e=>setRegions(e.target.value)} placeholder="أدخل المناطق مفصولة بفاصلة" required
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نوع الدوام</label>
              <input type="text" list="shiftOptions" value={shift} onChange={e=>setShift(e.target.value)} title="نوع الدوام أو الوقت" aria-label="نوع الدوام" placeholder="مثال: من 8 إلى 2 ظهراً"
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm" />
              <datalist id="shiftOptions">
                <option value="صباحي" />
                <option value="مسائي" />
                <option value="صباحي ومسائي" />
                <option value="من 8 صباحاً إلى 2 ظهراً" />
              </datalist>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">المقاعد (لأصحاب الخطوط)</label>
              <input type="number" min="1" max="50" value={seats} onChange={e=>setSeats(e.target.value)} disabled={type==='request'} title="عدد المقاعد" aria-label="عدد المقاعد" placeholder="عدد المقاعد"
                className="w-full bg-gray-800 text-white disabled:opacity-50 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نوع المركبة</label>
              <select value={vehicleType} onChange={e=>setVehicleType(e.target.value)} title="نوع المركبة" aria-label="نوع المركبة"
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm">
                <option>خصوصي</option><option>أجرة</option><option>فان 11 راكب</option><option>كوستر</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">الفئة</label>
              <select value={targetAudience} onChange={e=>setTargetAudience(e.target.value)} title="الفئة المستهدفة" aria-label="الفئة المستهدفة"
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm">
                <option>مختلط</option><option>بنات فقط</option><option>شباب فقط</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">السعر الشهري (اختياري)</label>
            <input value={price} onChange={e=>setPrice(formatPriceInput(e.target.value))} placeholder="مثال: 100,000 د.ع"
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">رقم الهاتف للتواصل</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07XXXXXXXXX" required
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">ملاحظات إضافية (اختياري)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="مثال: السيارة مكيفة، سواقة هادئة، التزام بالوقت..."
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm resize-none"/>
          </div>

          <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
            <Car className="w-5 h-5"/> نشر الإعلان
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function TransportView({ user, onBack, onCreateAd, onGoToMyLines, onSelectAd, lines, onPost, onUpdateStatus, onDeleteAd, onActionMenu, isInitialLoading, storedUsers, onLoadMore, hasMore, totalCount }: {
  user: { id: string; name: string; avatar: string; phone: string; role?: string } | null;
  onBack: () => void;
  onCreateAd: () => void;
  onGoToMyLines?: () => void;
  onSelectAd?: (ad: TransportAd) => void;
  lines: TransportAd[];
  onPost: (ad: TransportAd) => void;
  onUpdateStatus: (id: number, status: TransportAd['status'], reason?: TransportAd['completion_reason']) => void;
  onDeleteAd?: (id: number) => void;
  onActionMenu?: (target: {type:"transport", item:TransportAd}) => void;
  isInitialLoading?: boolean;
  storedUsers?: any[];
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  totalCount?: number;
}) {
  const [mainCategoryFilter, setMainCategoryFilter] = useState<'student'|'employee'|'all'>('student');
  const [filterUniversity, setFilterUniversity] = useState('الكل');
  const [filterType, setFilterType] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (ad: TransportAd) => {
    longPressTimer.current = setTimeout(() => {
      if (user && (user.role === 'admin' || user.role === 'owner' || user.id === ad.postedBy)) {
        onActionMenu?.({ type: 'transport', item: ad });
      }
    }, 800);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleContextMenu = (e: React.MouseEvent, ad: TransportAd) => {
    e.preventDefault();
    if (user && (user.role === 'admin' || user.role === 'owner' || user.id === ad.postedBy)) {
      onActionMenu?.({ type: 'transport', item: ad });
    }
  };

  const handlePost = (ad: TransportAd) => {
    onPost(ad);
    setShowForm(false);
  };

  const filtered = lines.filter(a => {
    if (a.status !== 'published') return false;
    const adCat = a.categoryType || 'student';
    if (mainCategoryFilter !== 'all' && adCat !== mainCategoryFilter) return false;
    if (filterUniversity !== 'الكل' && a.university !== filterUniversity) return false;
    if (filterType !== 'الكل' && a.type !== (filterType === 'خطوط متوفرة' ? 'offer' : 'طلبات خطوط')) return false;
    if (searchQuery) {
      return a.regions.includes(searchQuery) || a.university.includes(searchQuery) || (a.note && a.note.includes(searchQuery));
    }
    return true;
  });

  const dynamicUniversities = mainCategoryFilter === 'employee'
    ? Array.from(new Set([
        'الكل',
        ...EMPLOYEE_WORKPLACES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType === 'employee').map(l => l.university)
      ])).filter(Boolean)
    : Array.from(new Set([
        'الكل',
        ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType !== 'employee').map(l => l.university)
      ])).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0c2b5e]">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 pt-6 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_,i)=><div key={i} className="absolute border border-white/20 rounded-full" style={{width:`${(i+1)*80}px`,height:`${(i+1)*80}px`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>)}
        </div>
        <div className="container mx-auto max-w-2xl relative">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20" title="رجوع" aria-label="رجوع">
              <ChevronLeft className="w-5 h-5"/>
            </button>
            <div>
              <h1 className="text-white font-bold text-xl">🚌 قسم الخطوط والنقل اليومي</h1>
              <p className="text-emerald-200 text-sm">أسرع وأأمن طريق لدوامك اليومي (طلاب وموظفين)</p>
            </div>
          </div>
          
          {/* Smart Search & Filters */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 mb-4 space-y-3">
            
            {/* Main Category Tabs (Student vs Employee) */}
            <div className="flex items-center gap-2 p-1 bg-gray-900/80 rounded-2xl border border-emerald-500/20 shadow-inner">
              <button onClick={() => { setMainCategoryFilter('student'); setFilterUniversity('الكل'); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${mainCategoryFilter === 'student' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'text-gray-400 hover:text-white'}`}>
                🎓 خطوط الطلاب
              </button>
              <button onClick={() => { setMainCategoryFilter('employee'); setFilterUniversity('الكل'); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${mainCategoryFilter === 'employee' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                👔 خطوط الموظفين
              </button>
              <button onClick={() => { setMainCategoryFilter('all'); setFilterUniversity('الكل'); }}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${mainCategoryFilter === 'all' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}>
                ⚡ الكل
              </button>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300"/>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={mainCategoryFilter === 'employee' ? "ابحث عن شركة، دائرة، منطقة..." : "ابحث عن جامعة، منطقة، مقصد..."}
                className="w-full bg-gray-900/50 text-white placeholder-emerald-200/50 rounded-xl py-3 pr-10 pl-3 border border-emerald-500/30 focus:border-emerald-400 outline-none text-sm"/>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-emerald-300 text-xs mb-1 block">{mainCategoryFilter === 'employee' ? 'مكان العمل (دوائر / شركات)' : 'الوجهة / الجامعة'}</label>
                <select value={filterUniversity} onChange={e=>setFilterUniversity(e.target.value)} title="تصفية بالجامعة" aria-label="تصفية بالجامعة"
                  className="w-full bg-gray-900/50 text-white border border-emerald-500/30 rounded-xl py-2.5 px-3 outline-none text-sm backdrop-blur [color-scheme:dark]">
                  {dynamicUniversities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-emerald-300 text-xs mb-1 block">نوع الإعلان</label>
                <select value={filterType} onChange={e=>setFilterType(e.target.value)} title="تصفية بنوع الإعلان" aria-label="تصفية بنوع الإعلان"
                  className="w-full bg-gray-900/50 text-white border border-emerald-500/30 rounded-xl py-2.5 px-3 outline-none text-sm backdrop-blur [color-scheme:dark]">
                  <option>الكل</option>
                  <option>خطوط متوفرة</option>
                  <option>طلبات خطوط</option>
                </select>
              </div>
            </div>
          </div>

          {/* Post Button & My Lines Button */}
          <div className="flex gap-2">
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{ if(!user){onCreateAd();return;} setShowForm(true); }}
              className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30">
              <Plus className="w-5 h-5"/> إضافة إعلان جديد
            </motion.button>
            {user && onGoToMyLines && (
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={onGoToMyLines}
                className="px-4 py-3.5 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-gray-700 shadow-lg hover:bg-gray-700">
                🚌 خطوطي
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="container mx-auto max-w-2xl px-4 py-4">
        {isInitialLoading ? (
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl" dir="rtl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-emerald-400"/>
            </div>
            <h3 className="text-xl font-bold text-white">أهلاً بك في قسم الخطوط! ✨</h3>
            <p className="text-gray-300 text-sm">جاري تحميل أحدث إعلانات خطوط النقل، يرجى الانتظار ثوانٍ...</p>
            <div className="flex justify-center gap-1.5 pt-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚐</div>
            <h3 className="text-white font-bold text-lg mb-2">لا توجد إعلانات حالياً في هذا القسم</h3>
            <p className="text-gray-400 text-sm mb-6">كن أول من يضيف إعلاناً خط جديد</p>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{if(!user){onCreateAd();return;}setShowForm(true);}}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl">
              إضافة إعلان الآن
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="sticky top-[4rem] z-20 bg-[#0c2b5e]/90 backdrop-blur-md py-2.5 border-b border-transparent shadow-sm shadow-[#0c2b5e]/10 mb-2">
              <p className="text-gray-400 text-sm">
                تم العثور على <span className="text-emerald-400 font-bold">{filtered.length}</span> خط، يتم عرض {onLoadMore ? filtered.length : Math.min(visibleCount, filtered.length)} من أصل {filtered.length}
                {totalCount !== undefined && totalCount > 0 && ` (يتوفر ${totalCount} خط متاح حالياً)`}
              </p>
            </div>
            {filtered.slice(0, onLoadMore ? filtered.length : visibleCount).map(ad=>{
              const isEmployee = ad.categoryType === 'employee';
              const seller = storedUsers?.find(u=>u.id===ad.postedBy);
              return (
              <motion.div key={ad.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                onClick={() => onSelectAd?.(ad)}
                onTouchStart={() => handleTouchStart(ad)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onMouseDown={() => handleTouchStart(ad)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onContextMenu={(e) => handleContextMenu(e, ad)}
                className={`bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer ${
                  isEmployee 
                    ? 'border-indigo-500/50 hover:border-indigo-400 shadow-lg shadow-indigo-950/40' 
                    : ad.type === 'offer' ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-amber-500/30 hover:border-amber-500/60'
                }`}>
                
                {/* Type & Category Badges */}
                <div className="absolute top-0 right-0 flex items-center gap-1">
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

                {isNewItem(ad.createdAt) && (
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
                        <span className="text-gray-500 text-[10px] block"><TimeAgo iso={ad.createdAt}/></span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {user && user.id === ad.postedBy && (
                        <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(ad.id, 'matched', ad.type === 'request' ? 'found_line' : 'line_full'); }} className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white rounded-xl text-xs hover:bg-gray-600">
                          <CheckCircle className="w-3.5 h-3.5"/> حصلت
                        </button>
                      )}
                      <motion.a href={getWhatsAppLink(ad.phone, 'transport', { id: ad.id, title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
                        whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20">
                        <MessageSquare className="w-3.5 h-3.5"/> واتساب
                      </motion.a>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleUniversalShare({ id: ad.id, university: ad.university, type: ad.type, regions: ad.regions, price: ad.price }); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-xl text-xs hover:bg-amber-500/30"
                      >
                        <Share2 className="w-3.5 h-3.5" /> مشاركة
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
            <InfiniteScrollTrigger 
              hasMore={hasMore !== undefined ? hasMore : visibleCount < filtered.length} 
              isLoading={loadingMore} 
              onLoadMore={async () => {
                setLoadingMore(true);
                if (onLoadMore) {
                  await onLoadMore();
                } else {
                  await new Promise(r => setTimeout(r, 400));
                  setVisibleCount(prev => prev + 4);
                }
                setLoadingMore(false);
              }} 
              loadingText="جاري تحميل المزيد من الخطوط..." 
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && user && (
          <TransportFormModal user={user} onClose={()=>setShowForm(false)} onSubmit={handlePost} lines={lines}/>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Root App

// ─────────────────────────────────────────────
type AppView = 'home'|'profile'|'admin'|'owner'|'seller'|'transport'|'products'|'ad-detail'|'product-detail'|'transport-detail';

export default function App() {
  const [user, setUser] = useState<User|null>(() => {
    try {
      const stored = localStorage.getItem('souqUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showStoreGuide, setShowStoreGuide] = useState(false);
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
    if (hash.startsWith('#/transport')) return 'transport';
    if (hash.startsWith('#/seller') || hash.startsWith('#/profile')) return 'seller';
    if (hash.startsWith('#/admin')) return 'admin';
    if (hash.startsWith('#/owner')) return 'owner';
    return 'home';
  });
  const [bottomNavActive, setBottomNavActive] = useState(() => {
    const { hash } = getInitialRouteInfo();
    if (hash.startsWith('#/transport')) return 'transport';
    if (hash.startsWith('#/seller') || hash.startsWith('#/profile')) return 'profile';
    return 'home';
  });
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
  const [activeLightbox, setActiveLightbox] = useState<{ src: string; title: string; images?: string[]; initialIdx?: number } | null>(null);
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; title: string; url: string; image?: string; price?: string; governorate?: string; location?: string; short_id?: string; description?: string }>({ isOpen: false, title: '', url: '' });
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

            console.log('🚌 Transport Deep Link — fetched row:', row, 'error:', error);

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

  useEffect(() => {
    let isMounted = true;
    async function loadAllProfilesGlobal() {
      try {
        const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
        const sellersMap = new Map();

        const { data: dbProfiles } = await supabase.from('profiles').select('*');
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
  }, [allAds, allProducts]);

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
        console.log('[DeepLink] Product lookup:', { actualId, isUUID, isNumeric, targetId: targetId.substring(0, 50) });
        let query = supabase.from('products').select('*');
        if (isUUID) {
          query = query.eq('id', actualId);
        } else if (isNumeric) {
          query = query.eq('id', Number(actualId));
        } else {
          query = query.eq('short_id', actualId);
        }
        query.single().then(({ data, error }) => {
          console.log('[DeepLink] Product query result:', { found: !!data, error: error?.message, actualId });
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
            };
            setSelectedProduct(mappedProd);
          } else {
            // Query failed — keep pendingDeepLinkRef so retry from allProducts update can pick it up
            console.warn('[DeepLink] Product fetch failed for', actualId, error);
            setLoadingRoute(false);
          }
        });
      }
    } else if ((type === 'profile' || type === 'seller') && targetId) {
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
    } else if (type === 'accounts' || type === 'sellers') {
      setView('home');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('switch-to-profiles-tab'));
    } else if (type === 'transport') {
      setView('transport');
    } else if (type === 'admin') {
      setView('admin');
    } else if (type === 'owner') {
      setView('owner');
    }
  };

  // PWA & Redirection normalization
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

  // Initial route parsing — runs once on mount, then retries pending deep links when data arrives
  useEffect(() => {
    if (!initialHashParsed) {
      // First run: parse URL and start any async fetch
      console.log('[DeepLink] Initial parse, path:', window.location.pathname);
      syncStateFromPath();
      setInitialHashParsed(true);
      return;
    }

    // Retry pending deep links when allAds/allProducts update
    if (pendingDeepLinkRef.current) {
      const [linkType, linkId] = pendingDeepLinkRef.current.split(':');
      console.log('[DeepLink] Retry check:', { linkType, linkId, adsLen: allAds.length, prodsLen: allProducts.length });
      if (linkType === 'ad' && allAds.length > 0) {
        const found = allAds.find(a => String(a.id) === linkId || a.short_id === linkId);
        if (found) {
          console.log('[DeepLink] Retry found ad:', found.id);
          pendingDeepLinkRef.current = null;
          setSelectedAd(found);
        }
      } else if (linkType === 'product' && allProducts.length > 0) {
        const found = allProducts.find(p => String(p.id) === linkId || p.short_id === linkId);
        if (found) {
          console.log('[DeepLink] Retry found product:', found.id);
          pendingDeepLinkRef.current = null;
          setSelectedProduct(found);
        } else {
          console.log('[DeepLink] Retry: product NOT found in allProducts. IDs:', allProducts.map(p => String(p.id).substring(0, 8)));
        }
      }
    }
  }, [allAds, allProducts, initialHashParsed]);

  useEffect(() => {
    const handlePopState = () => syncStateFromPath();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allAds, allProducts]);

  useEffect(() => {
    if (!initialHashParsed || loadingRoute || pendingDeepLinkRef.current) return; // Don't push state before initial parse, while routing/fetching, or while deep link is pending
    let newPath: string | null = null;
    
    const slugify = (text: string) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\u0621-\u064A0-9-]+/g, '')
        .replace(/--+/g, '-');
    };

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
            categoryType: 'student' as 'student' | 'employee',
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
      const pageSize = 4;
      const from = pageToFetch * pageSize;
      const to = from + pageSize - 1;



      let query = supabase.from('ads').select('*', { count: 'exact' }).eq('is_demo', false).neq('category', 'transport').neq('category', 'notification').neq('status', 'sold');

      if (cat && cat !== 'all') {
        query = query.eq('category', cat);
      }
      if (gov && gov !== 'الكل') {
        query = query.eq('city', gov);
      }
      if (search) {
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},location.ilike.${term},short_id.ilike.${term}`);
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
      if (error) { console.error('Error fetching ads:', error); return; }
      if (count !== null) setTotalAdsCount(count);
      if (data) {
        // Map normal ads
        const normalRows = data.filter((row: any) => row.category !== 'transport' && row.category !== 'notification');
        const normalMapped: Ad[] = normalRows.map((row: any) => ({
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
          description: row.description || '',
          adCount: 0,
          soldCount: 0,
          responseRate: 100,
          avgResponseTime: 'دقائق',
          postedBy: row.seller_id,
          short_id: row.short_id,
        }));

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

      if (cat && cat !== 'all') {
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

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    const channel = supabase
      .channel('user-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const prevNotifsLength = useRef(0);
  useEffect(() => {
    if (notifications.length > prevNotifsLength.current) {
      if (prevNotifsLength.current > 0) {
        const hasNewIncoming = notifications.some(n => n.targetType === 'owner' || !n.targetType);
        if (hasNewIncoming) {
          const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/24/audio_783d1a0e1c.mp3');
          audio.volume = 0.6;
          audio.play().catch(() => {});
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
    if (!user) return;
    if (user.id === ownerId) return;

    const viewerName = user.name || 'مستخدم';
    const viewerId = user.id;
    const viewerPhone = user.phone || '';

    // 1. Owner notification row
    const ownerNotifRow = {
      seller_id: ownerId,
      title: seconds >= 15 ? '🔥 اهتمام كبير بإعلانك' : '👀 مشاهدة جديدة لإعلانك',
      description: JSON.stringify({
        message: `قام الحساب (${viewerName}) بمشاهدة إعلانك "${itemTitle}" لمدة ${seconds} ثوانٍ.`,
        type: seconds >= 15 ? 'interest' : 'view',
        senderId: viewerId,
        senderName: viewerName,
        senderPhone: viewerPhone,
        itemTitle: itemTitle,
        itemType: itemType,
        itemId: itemId,
        duration: seconds,
        targetType: 'owner'
      }),
      price: '0',
      category: 'notification',
      location: '',
      city: '',
      images: [],
      phone: viewerPhone,
      type: 'notification',
      status: 'active',
      is_demo: false,
      seller_name: viewerName,
      seller_avatar: user.avatar,
    };

    // 2. Viewer history row
    const viewerNotifRow = {
      seller_id: viewerId,
      title: '🕒 سجل المشاهدة',
      description: JSON.stringify({
        message: `شاهدت إعلان "${itemTitle}" (${itemType === 'ad' ? 'إعلان' : itemType === 'product' ? 'منتج' : 'خط'}) لـ ${seconds} ثوانٍ.`,
        type: 'history',
        senderId: ownerId,
        senderName: '',
        senderPhone: '',
        itemTitle: itemTitle,
        itemType: itemType,
        itemId: itemId,
        duration: seconds,
        targetType: 'viewer'
      }),
      price: '0',
      category: 'notification',
      location: '',
      city: '',
      images: [],
      phone: '',
      type: 'notification',
      status: 'active',
      is_demo: false,
      seller_name: '',
      seller_avatar: '',
    };

    const { error } = await supabase.from('ads').insert([ownerNotifRow, viewerNotifRow]);
    if (!error) {
      fetchNotifications();
    }
  };


  useEffect(()=>{localStorage.setItem('souqFavs',JSON.stringify(favorites));},[favorites]);

  useEffect(() => {
    if (view === 'transport' || view === 'profile') {
      fetchTransportAds();
    }
  }, [view, fetchTransportAds]);

  useEffect(() => {
    if (['home', 'profile', 'transport'].includes(view)) {
      setBottomNavActive(view);
    }
  }, [view]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (view === 'home' || view === 'products' || view === 'transport' || view === 'profile') {
        fetchAds(true);
        fetchProducts(true);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search, cat, gov, sort, priceMin, priceMax, view]);

  useEffect(()=>{
    if(user){const mc=allAds.filter(a=>a.postedBy===user.id).length+allProducts.filter(p=>p.postedBy===user.id).length;saveStoredUser(user,mc);}
  },[user]);

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
    interval = setInterval(trackActivity, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
  }, [user]);

  const showToast = useCallback((msg:string,type:string)=>{
    setToast({msg,type,visible:true}); playSound(type==='success'?'success':'info');
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
  const handleUpdateUser = async (u:User)=>{
    setUser(u);
    localStorage.setItem('souqUser', JSON.stringify(u));
    saveStoredUser(u, allAds.filter(a=>a.postedBy===u.id).length);
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
      seller_name: user?.name,
      seller_avatar: user?.avatar,
    };
    if (editingAd) {
      const { error } = await supabase.from('ads').update(rowData).eq('id', ad.id);
      if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
      setEditingAd(null);
      showToast('تم تعديل الإعلان ✅', 'success');
    } else {
      const { data, error } = await supabase.from('ads').insert(rowData).select().single();
      if (error) { showToast('حدث خطأ أثناء النشر', 'error'); console.error(error); return; }
      if (user && data) {
        const u = { ...user, stats: { ...user.stats, ads: user.stats.ads + 1 } };
        setUser(u); localStorage.setItem('souqUser', JSON.stringify(u));
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

    const { error } = await supabase.from('ads').insert(rowData);
    if (error) {
      showToast('حدث خطأ أثناء حفظ الخط', 'error');
      console.error(error);
      return;
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
    showToast('تم حذف الخط بنجاح', 'info');
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
      seller_name: user?.name,
      seller_avatar: user?.avatar,
    };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(rowData).eq('id', p.id);
      if (error) { showToast('حدث خطأ أثناء التعديل', 'error'); return; }
      setEditingProduct(null);
      showToast('تم تعديل المنتج ✅', 'success');
    } else {
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
    showToast('تم حذف الإعلان', 'info');
  };

  const handleDeleteProduct = async (id: number) => {
    await supabase.from('products').delete().eq('id', id);
    setAllProducts(prev => prev.filter(p => p.id !== id));
    showToast('تم حذف المنتج', 'info');
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
  const handleInstallClick = () => {
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

  return (
    <div className="dark min-h-screen bg-[#0c2b5e] pwa-outer-container">
      <LoadingScreen isLoading={isInitialLoading} minDuration={2000} />
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
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0c2b5e]/70 backdrop-blur-xl border-b border-transparent pwa-header shadow-md shadow-[#0c2b5e]/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button onClick={()=>setView('home')} className="flex items-center gap-2"><Logo small/><span className="text-white font-bold text-sm sm:text-lg">سوك بغداد</span></button>
            <div className="hidden md:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input placeholder="ابحث في سوك بغداد..." onClick={()=>setView('home')} readOnly className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-2 pr-9 pl-4 border border-gray-700 outline-none text-sm cursor-pointer"/></div>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              {user?(
                <>
                  <button onClick={()=>setShowNotifs(true)} className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative" title="الإشعارات" aria-label="الإشعارات">
                    <Bell className="w-5 h-5"/>
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {isOwner&&<button onClick={()=>setView('owner')} className={`p-2 rounded-xl text-amber-400 hover:bg-amber-500/20 ${view==='owner'?'bg-amber-500/20':''}`} title="لوحة المالك" aria-label="لوحة المالك"><Crown className="w-5 h-5"/></button>}
                  {isAdmin&&!isOwner&&<button onClick={()=>setView('admin')} className={`p-2 rounded-xl text-red-400 hover:bg-red-500/20 ${view==='admin'?'bg-red-500/20':''}`} title="لوحة الإدارة" aria-label="لوحة الإدارة"><Settings className="w-5 h-5"/></button>}
                  <button onClick={()=>{setShowCreateProduct(true);setEditingProduct(null);}}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700">
                    <ShoppingBag className="w-4 h-4"/> منتج</button>
                  <button onClick={()=>{setShowCreateAd(true);setEditingAd(null);}}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-sm">
                    <Plus className="w-4 h-4"/> إعلان</button>
                  <button onClick={()=>setView('profile')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}>
                    <img src={user.avatar} alt="" className={`w-6 h-6 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-600'}`}/>
                    <span className="max-w-20 truncate">{user.name}</span>{isOwner&&<Crown className="w-3 h-3 text-amber-400"/>}</button>
                  <button onClick={handleLogout} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20" title="تسجيل الخروج" aria-label="تسجيل الخروج"><LogOut className="w-5 h-5"/></button>
                </>
              ):(
                <>
                  <button onClick={requireAuth} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-sm"><Plus className="w-4 h-4"/> رفع إعلان</button>
                  <button onClick={()=>setShowAuth(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700"><LogIn className="w-4 h-4"/> تسجيل الدخول</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 lg:hidden">
              {/* زر رفع إعلان على الموبايل */}
              <button 
                onClick={() => {
                  if (!user) { requireAuth(); return; }
                  setShowCreateAd(true);
                  setEditingAd(null);
                }} 
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5"/> <span>إعلان</span>
              </button>

              {user ? (
                <button onClick={()=>setView('profile')} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white'}`}>
                  <img src={user.avatar} alt="" className={`w-5.5 h-5.5 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-600'}`}/>
                  <span className="max-w-16 truncate hidden sm:block">{user.name}</span>
                </button>
              ) : (
                <button onClick={()=>setShowAuth(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700">
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowMobileMenu(false)}/>
          <motion.div initial={{x:300}} animate={{x:0}} exit={{x:300}} className="absolute right-0 top-0 bottom-0 w-72 bg-gray-900 p-5 pb-24 overflow-y-auto border-l border-gray-700">
            <div className="flex items-center justify-between mb-6"><Logo small/><button onClick={()=>setShowMobileMenu(false)} className="p-2 bg-gray-800 rounded-xl text-white" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button></div>
            {user?(
              <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt="" className={`w-12 h-12 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border-2 border-amber-500'}`}/>
                  <div><div className="flex items-center gap-1"><p className="text-white font-bold text-sm">{user.name}</p>{isOwner&&<Crown className="w-3.5 h-3.5 text-amber-400"/>}</div>
                    <p className="text-gray-400 text-xs">{user.email}</p></div>
                </div>
              </div>
            ):(
              <button onClick={()=>{setShowAuth(true);setShowMobileMenu(false);}} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mb-5 flex items-center justify-center gap-2"><LogIn className="w-4 h-4"/> تسجيل الدخول</button>
            )}
            <div className="space-y-1">
              {CATEGORIES.filter(c=>c.id!=='games').map(c=>(
                <button key={c.id} onClick={()=>{setView('home');setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-white text-sm">
                  <span className="text-xl">{c.emoji}</span><span>{c.name}</span></button>
              ))}
            </div>
            {user&&<div className="mt-5 pt-5 border-t border-gray-700 space-y-1">
              <button onClick={()=>{setShowCreateAd(true);setEditingAd(null);setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500 text-black font-bold text-sm"><Plus className="w-5 h-5"/> رفع إعلان</button>
              <button onClick={()=>{setShowCreateProduct(true);setEditingProduct(null);setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-600 text-white font-bold text-sm"><ShoppingBag className="w-5 h-5"/> إضافة منتج</button>
              <button onClick={()=>{setView('profile');setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-white text-sm"><UserIcon className="w-5 h-5 text-gray-400"/> ملفي الشخصي</button>
              {isOwner&&<button onClick={()=>{setView('owner');setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-amber-400 text-sm"><Crown className="w-5 h-5"/> داشبورت المالك</button>}
              {isAdmin&&!isOwner&&<button onClick={()=>{setView('admin');setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-red-400 text-sm"><Settings className="w-5 h-5"/> لوحة الإدارة</button>}
              <button onClick={()=>{handleLogout();setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-red-400 text-sm"><LogOut className="w-5 h-5"/> تسجيل الخروج</button>
            </div>}
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      {/* Main */}
      <main className="pwa-main">
        <AnimatePresence mode="wait">
          {view==='home'&&<motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
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
            />
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
            <ProfileView user={user} myAds={myAds} myProducts={myProducts} onDeleteAd={handleDeleteAd} onEditAd={ad=>{setEditingAd(ad);setShowCreateAd(true);}} onDeleteProduct={handleDeleteProduct} onEditProduct={p=>{setEditingProduct(p);setShowCreateProduct(true);}} onUpdateUser={handleUpdateUser} onAddAd={()=>{setEditingAd(null);setShowCreateAd(true);}} onAddProduct={()=>{setEditingProduct(null);setShowCreateProduct(true);}} transportLines={allTransportAds} onUpdateTransportStatus={handleUpdateTransportStatus} onDeleteTransportAd={handleDeleteTransportAd} onMarkAdSold={handleMarkAdSold} onMarkProductSold={handleMarkProductSold} favorites={favorites} allAds={allAds} allProducts={allProducts} onAdSelect={setSelectedAd} onProductSelect={setSelectedProduct} onFav={handleToggleFav} onStoreGuideClick={() => setShowStoreGuide(true)} /></motion.div>}
          {view==='seller'&&selectedSellerId&&<motion.div key="seller" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <SellerPublicPage sellerId={selectedSellerId} allAds={allAds} allProducts={allProducts} allTransportAds={allTransportAds} storedUsers={storedUsers} onBack={() => {
              setView('home');
              if (previousSellerSource === 'accounts') {
                if (typeof window !== 'undefined') window.location.hash = '#/accounts';
                setTimeout(() => window.dispatchEvent(new CustomEvent('switch-to-profiles-tab')), 50);
              } else {
                if (typeof window !== 'undefined') window.location.hash = '#/';
              }
            }} onSelectAd={setSelectedAd} onSelectProduct={setSelectedProduct} onSelectTransport={setSelectedTransportAd} favorites={favorites} onToggleFav={handleToggleFav} user={user} onAuthRequired={requireAuth} onDeleteProfile={handleDeleteProfile} onActionMenu={setActionMenuTarget}/></motion.div>}
          {view==='transport'&&<motion.div key="transport" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <TransportView user={user} onBack={()=>setView('home')} onCreateAd={()=>{if(!user){requireAuth();return;}setShowCreateTransport(true);}} onGoToMyLines={()=>{setView('profile'); setTimeout(()=>window.dispatchEvent(new CustomEvent('switch-to-lines-tab')), 100);}} onSelectAd={setSelectedTransportAd} lines={allTransportAds} onPost={handlePostTransportAd} onUpdateStatus={handleUpdateTransportStatus} onDeleteAd={handleDeleteTransportAd} onActionMenu={setActionMenuTarget} isInitialLoading={isInitialLoading || loadingTransport} storedUsers={storedUsers} onLoadMore={() => fetchTransportAds(false)} hasMore={hasMoreTransport} totalCount={totalTransportCount}/></motion.div>}
          {view==='admin'&&isAdmin&&!isOwner&&<motion.div key="admin" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <AdminPanel ads={allAds} onDeleteAd={handleDeleteAd} onClose={()=>setView('home')}/></motion.div>}
          {view==='owner'&&isOwner&&<motion.div key="owner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              <OwnerDashboard ads={allAds} products={allProducts} transportAds={allTransportAds} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onDeleteTransportAd={handleDeleteTransportAd} onClose={()=>setView('home')} onDeleteProfile={handleDeleteProfile}/>
            </Suspense></motion.div>}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[#0c2b5e] border-t border-[#d4af37]/20 py-6">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c2b5e]/95 backdrop-blur-xl border-t border-[#d4af37]/20 lg:hidden pwa-bottom-nav">
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
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'products' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'products' ? 'bg-blue-500/20' : ''}`}>
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

      {/* Modals */}
      <AnimatePresence>
        {showOnboarding&&<OnboardingModal onClose={()=>{setShowOnboarding(false);localStorage.setItem('souqOnboarded','1');}}/>}
        {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={handleLogin}/>}
        {selectedAd&&<AdDetailModal ad={selectedAd} onClose={()=>setSelectedAd(null)} isFav={favorites.includes(selectedAd.id)} onFav={()=>handleToggleFav(selectedAd.id)} user={user} storedUsers={storedUsers} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedAd(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedAd.id, selectedAd.title, selectedAd.postedBy || '', 'ad', sec)} onImageZoom={(src, title, imgs, idx) => setActiveLightbox({ src, title, images: imgs, initialIdx: idx })}/>}
        {selectedProduct&&<ProductDetailModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} isFav={favorites.includes(selectedProduct.id)} onFav={()=>handleToggleFav(selectedProduct.id)} user={user} storedUsers={storedUsers} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedProduct(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedProduct.id, selectedProduct.title, selectedProduct.postedBy || '', 'product', sec)} onImageZoom={(src, title, imgs, idx) => setActiveLightbox({ src, title, images: imgs, initialIdx: idx })}/>}
        {selectedTransportAd&&<TransportDetailModal ad={selectedTransportAd} onClose={()=>setSelectedTransportAd(null)} user={user} onAuthRequired={requireAuth} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedTransportAd.id, selectedTransportAd.type==='offer'?'خط متوفر':'طلب خط', selectedTransportAd.postedBy || '', 'transport', sec)} storedUsers={storedUsers}/>}
        {showCreateAd&&user&&<AdFormModal isOpen={showCreateAd} onClose={()=>{setShowCreateAd(false);setEditingAd(null);}} onSubmit={handleAddOrEditAd} user={user} editAd={editingAd}/>}
        {showCreateProduct&&user&&<ProductFormModal isOpen={showCreateProduct} onClose={()=>{setShowCreateProduct(false);setEditingProduct(null);}} onSubmit={handleAddOrEditProduct} user={user} editProduct={editingProduct}/>}
        {showNotifs&&<NotifPanel isOpen={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifications} onNotifClick={handleSellerClick} onHistoryClick={handleHistoryClick} onMarkRead={markNotifAsRead} onArchiveAll={handleArchiveAllNotifications}/>}
        {activeDocTab&&<InfoDocsModal activeTab={activeDocTab} onClose={()=>setActiveDocTab(null)} user={user}/>}
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
