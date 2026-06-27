import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareModal } from './components/ShareModal';
import { generateAdUrl, generateProductUrl } from './lib/slugUtils';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check,
  Gamepad2, Heart, Bell, Plus, LogOut, Star, X, Search, MapPin,
  Eye as ViewIcon, Phone as PhoneIcon, Grid, List, Menu, MessageSquare,
  Share2, CheckCircle, XCircle, Loader2, ChevronRight, Shield, ImagePlus,
  Trash2, SlidersHorizontal, Settings, ChevronLeft, Info, LogIn, Edit2,
  Save, BarChart3, Smartphone, Monitor, Tablet, Globe, UserCheck, Activity,
  Crown, UserX, FileText, ShoppingBag, Package, Store, Camera, ZoomIn,
  ZoomOut, Calendar, Users, ChevronDown, Tag, Layers, Home, Car, UserCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';


// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const OWNER_EMAIL = 'nooraldeinsbah@gmail.com';
const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e3a5f"/><circle cx="50" cy="38" r="18" fill="#4b7ab5"/><ellipse cx="50" cy="82" rx="28" ry="20" fill="#4b7ab5"/></svg>')}`;
const DEFAULT_COVER  = 'https://images.unsplash.com/photo-1579546929518-9e396f3b809b?w=900&q=60';

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
interface SellerInfo {
  name: string; avatar: string; isVerified: boolean;
  rating: number; joinedDate: string; location: string;
}
interface Ad {
  id: number; title: string; price: string;
  governorate: string; location: string; phone: string;
  category: string; images: string[]; seller: SellerInfo;
  time: string; createdAtISO: string; views: number; status: string;
  type: string; description: string; adCount: number; soldCount: number;
  responseRate: number; avgResponseTime: string; postedBy?: string;
}
interface Product {
  id: number; title: string; price: string; description: string;
  category: string; images: string[]; governorate: string; phone: string;
  condition: 'new' | 'used'; seller: SellerInfo;
  createdAtISO: string; views: number; postedBy: string; stock: number;
}
interface User {
  id: string; name: string; email: string; phone: string; role: string;
  avatar: string; cover: string; bio: string; location: string;
  rating: number; isVerified: boolean; joinedDate: string;
  stats: { ads:number; favorites:number; views:number };
  sellerStats: { totalAds:number; sold:number; responseRate:number; avgResponseTime:string };
  badges?: { isStudent?: boolean; hasVehicle?: boolean; hasID?: boolean; isPhoneVerified?: boolean };
}
interface StoredUser {
  id: string; name: string; email: string; phone: string; location: string;
  role: string; avatar: string; registeredAt: string; lastSeen: string;
  adCount: number; isBanned: boolean;
  cover?: string; bio?: string; rating?: number; ratingCount?: number;
}
interface Visit {
  id: string; timestamp: string; device: 'mobile'|'desktop'|'tablet';
  location: string; userId?: string; userName?: string; page: string;
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
async function compressImage(file: File, maxPx = 900, quality = 0.78): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const formatPrice = (p: string | number) => {
  const n = typeof p === 'string' ? parseInt(p.replace(/,/g,'')) : p;
  return isNaN(n) ? String(p) : n.toLocaleString('en-US');
};

function getWhatsAppLink(phone: string, itemType: 'product' | 'transport', details: any) {
  let text = '';
  if (itemType === 'product') {
    text = `السلام عليكم 🌹\n\nشفت إعلان (${details.title}) وحاب أستفسر عنه إذا متوفر حالياً.\n\nتفاصيل الإعلان:\n📌 ${details.title}\n📍 ${details.location}\n\nتم إرسال هذه الرسالة مباشرة من خلال منصة سوك بغداد لتسهيل التواصل بين البائع والمشتري.\n\nبانتظار ردكم، شكراً 🙏`;
  } else if (itemType === 'transport') {
    text = `السلام عليكم 🌹\n\nشفت إعلان خط الجامعة وأرغب بمعرفة التفاصيل إذا ما زال متوفر.\n\n📍 المنطقة: ${details.location}\n🎓 الجامعة: ${details.university}\n🕒 الدوام: ${details.time}\n\nتم إرسال هذه الرسالة مباشرة عبر سوك بغداد لتسهيل الوصول إلى الخدمات والإعلانات المناسبة.\n\nشكراً لكم 🙏`;
  }
  const cleanPhone = phone.replace(/^0/, '');
  const num = cleanPhone.startsWith('964') ? cleanPhone : `964${cleanPhone}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function getRelative(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5)  return 'الآن';
  if (s < 60) return `منذ ${s} ثانية`;
  const m = Math.floor(s/60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m/60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h/24);
  if (d < 7)  return `منذ ${d} يوم`;
  const w = Math.floor(d/7);
  if (w < 5)  return `منذ ${w} أسبوع`;
  return `منذ ${Math.floor(d/30)} شهر`;
}
function useRelativeTime(iso: string) {
  const [rel, setRel] = useState(() => getRelative(iso));
  useEffect(() => {
    setRel(getRelative(iso));
    const iv = setInterval(() => setRel(getRelative(iso)), 10_000);
    return () => clearInterval(iv);
  }, [iso]);
  return rel;
}
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
// Logo
// ─────────────────────────────────────────────
function Logo({ small }:{small?:boolean}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${small?'w-9 h-9':'w-11 h-11'} bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center border-2 border-amber-500/40 shadow-lg`}>
        <svg viewBox="0 0 120 120" className={small?'w-7 h-7':'w-9 h-9'}>
          <defs><linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#d4af37"/><stop offset="50%" stopColor="#f4d03f"/><stop offset="100%" stopColor="#d4af37"/></linearGradient></defs>
          <ellipse cx="60" cy="50" rx="25" ry="20" fill="url(#eg)"/>
          <path d="M35 50 Q20 35 15 55 Q10 75 30 70" fill="url(#eg)"/>
          <path d="M85 50 Q100 35 105 55 Q110 75 90 70" fill="url(#eg)"/>
          <circle cx="60" cy="35" r="12" fill="url(#eg)"/>
          <path d="M45 55 L75 55 L75 85 L60 95 L45 85 Z" fill="#1e3a8a" stroke="#d4af37" strokeWidth="2"/>
          <rect x="48" y="60" width="24" height="6" fill="#fff"/>
          <rect x="48" y="66" width="24" height="6" fill="#000"/>
          <rect x="48" y="72" width="24" height="6" fill="#ce1126"/>
        </svg>
      </div>
      {!small && <div><h1 className="text-xl font-bold text-white leading-tight">سوك بغداد</h1><p className="text-amber-400 text-xs">السوق الرقمي العراقي</p></div>}
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
    const sw = img.naturalWidth*zoom, sh = img.naturalHeight*zoom;
    const dx = (PREV_W-sw)/2+pos.x, dy = (PREV_H-sh)/2+pos.y;
    ctx.drawImage(img, dx, dy, sw, sh);
    onSave(c.toDataURL('image/jpeg', 0.88));
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="relative bg-gray-900 rounded-2xl p-5 w-full max-w-sm border border-gray-700 shadow-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 bg-gray-800 rounded-lg text-gray-400"><X className="w-4 h-4"/></button>
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
          <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={e=>setZoom(+e.target.value)} className="flex-1 accent-amber-400"/>
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

function recordItemView(itemId: string|number, itemType: 'ad'|'product'|'transport', currentUser: User|null) {
  try {
    const allViewers = JSON.parse(localStorage.getItem('souqItemViewers') || '{}');
    const key = `${itemType}-${itemId}`;
    const list = allViewers[key] || [];
    
    const viewerId = currentUser?.id || 'guest-' + Math.random().toString(36).substring(2, 7);
    const viewerName = currentUser?.name || 'زائر';
    const viewerAvatar = currentUser?.avatar || `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#374151"/><circle cx="50" cy="50" r="30" fill="#4b5563"/></svg>')}`;
    const viewerLocation = currentUser?.location || 'العراق';

    if (!list.some((v: any) => v.id === viewerId)) {
      list.unshift({
        id: viewerId,
        name: viewerName,
        avatar: viewerAvatar,
        location: viewerLocation,
        time: new Date().toISOString()
      });
      allViewers[key] = list.slice(0, 50);
      localStorage.setItem('souqItemViewers', JSON.stringify(allViewers));
    }
  } catch (e) {}
}

function ViewersModal({ itemId, itemType, onClose }: { itemId: string|number, itemType: 'ad'|'product'|'transport', onClose: () => void }) {
  const [viewers, setViewers] = useState<any[]>([]);
  useEffect(() => {
    try {
      const allViewers = JSON.parse(localStorage.getItem('souqItemViewers') || '{}');
      const key = `${itemType}-${itemId}`;
      setViewers(allViewers[key] || []);
    } catch {}
  }, [itemId, itemType]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose}/>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-800 p-5 shadow-2xl relative z-[210]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">👀 الحسابات التي شاهدت الإعلان ({viewers.length})</h3>
          <button onClick={onClose} className="p-1.5 bg-gray-800 rounded-lg text-gray-400"><X className="w-4 h-4"/></button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {viewers.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-6">لا يوجد مشاهدات مسجلة بعد</p>
          ) : (
            viewers.map((v, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <img src={v.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-600"/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-xs truncate">{v.name}</p>
                  <p className="text-[10px] text-gray-400">{v.location || 'العراق'}</p>
                </div>
                <span className="text-[9px] text-gray-500">{getRelative(v.time)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

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
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
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
// Auth Modal
// ─────────────────────────────────────────────
function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('بغداد');
  const playSound = useSound();

  const submit = (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    setTimeout(()=>{
      if(password.length<4){setError('كلمة المرور 4 أحرف على الأقل');playSound('error');setLoading(false);return;}
      if(!isLogin&&phone.length<10){setError('رقم الهاتف غير صحيح');playSound('error');setLoading(false);return;}
      if(isBanned(email)){setError('هذا الحساب موقوف. تواصل مع الإدارة.');playSound('error');setLoading(false);return;}
      const role = email.toLowerCase()===OWNER_EMAIL?'owner':email.toLowerCase().includes('admin')?'admin':'user';
      const u:User = {
        id:'u-'+btoa(email).replace(/[^a-zA-Z0-9]/g,'').slice(0,12),
        name:isLogin?(email.split('@')[0]||'مستخدم'):name,
        email, phone:isLogin?'07700000000':phone, role,
        avatar: DEFAULT_AVATAR, cover: DEFAULT_COVER,
        bio:'', location:city, rating:4.8,
        isVerified:role!=='user', joinedDate:isLogin?'منذ فترة':'الآن',
        stats:{ads:0,favorites:0,views:0},
        sellerStats:{totalAds:0,sold:0,responseRate:0,avgResponseTime:'-'},
      };
      // Preserve existing avatar/cover if user re-logs in
      try {
        const stored:StoredUser[] = JSON.parse(localStorage.getItem('souqUsers')||'[]');
        const prev = stored.find(s=>s.id===u.id);
        if(prev?.avatar && prev.avatar !== DEFAULT_AVATAR) u.avatar = prev.avatar;
      } catch {}
      localStorage.setItem('souqUser', JSON.stringify(u));
      setTimeout(()=>{onLogin(u);onClose();},600);
      setLoading(false);
    },1000);
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl p-7 w-full max-w-md border border-gray-700 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
        <div className="text-center mb-6"><div className="text-5xl mb-3">{isLogin?'🔐':'✨'}</div>
          <h2 className="text-2xl font-bold text-white">{isLogin?'تسجيل الدخول':'إنشاء حساب'}</h2></div>
        <AnimatePresence>
          {error&&<motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400"/><span className="text-red-400 text-sm">{error}</span>
          </motion.div>}
        </AnimatePresence>
        {loading?<div className="flex flex-col items-center py-8"><Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3"/><p className="text-white">جاري التحميل...</p></div>:(
          <form onSubmit={submit} className="space-y-4">
            {!isLogin&&<div className="relative"><User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>}
            <div className="relative"><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
            {!isLogin&&<div className="grid grid-cols-2 gap-3">
              <div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07XXXXXXXXX" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
              <select value={city} onChange={e=>setCity(e.target.value)} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none">
                {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select>
            </div>}
            <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" required className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"/>
              <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
            <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl">
              {isLogin?'تسجيل الدخول':'إنشاء الحساب'}</motion.button>
          </form>
        )}
        <div className="mt-5 text-center">
          <button onClick={()=>{setIsLogin(!isLogin);setError('');}} className="text-gray-400 hover:text-amber-400 text-sm">
            {isLogin?'ليس لديك حساب؟ سجّل الآن':'لديك حساب؟ تسجيل الدخول'}</button></div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Info & Legal Docs Modal
// ─────────────────────────────────────────────
function InfoDocsModal({ activeTab, onClose }: { activeTab: string; onClose: () => void }) {
  const [tab, setTab] = useState(activeTab);
  const [contactForm, setContactForm] = useState({ name: '', email: '', msg: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setTab(activeTab);
    setSent(false);
  }, [activeTab]);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setContactForm({ name: '', email: '', msg: '' });
  };

  const tabs = [
    { id: 'من نحن', icon: <Info className="w-4 h-4" /> },
    { id: 'الشروط والأحكام', icon: <Shield className="w-4 h-4" /> },
    { id: 'سياسة الخصوصية', icon: <Lock className="w-4 h-4" /> },
    { id: 'تواصل معنا', icon: <Mail className="w-4 h-4" /> }
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
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-800 bg-gray-950 p-2 gap-1 overflow-x-auto">
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
                    <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-xs">
                      إرسال الرسالة
                    </motion.button>
                  </form>
                )}

                <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                  <span>📧 الدعم الفني: support@souqbaghdad.com</span>
                  <a href="https://wa.me/9647700000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-400 font-bold hover:underline">
                    💬 واتساب الإدارة
                  </a>
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
function ImageLightboxModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const timerRef = useRef<any>(null);

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      setLongPressActive(true);
    }, 600);
  };
  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
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
      ctx.fillText('souqbaghdad.com', margin * 2, h + bannerH * 0.7);

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
      
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto z-10 pt-2">
        <h4 className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{title}</h4>
        <button onClick={onClose} className="p-2 bg-gray-900/80 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center max-w-4xl w-full mx-auto relative overflow-hidden my-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <img src={src} alt={title} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl pointer-events-none" />
        
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
        <p className="text-gray-500 text-[10px] text-center">اضغط مطولاً على الصورة أو اضغط الزر أدناه للتحميل مع الشعار لمشاركتها</p>
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
function AdCard({ ad, onSelect, isFav, onFav, onSellerClick }:{
  ad:Ad; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(e:React.MouseEvent)=>void;
}) {
  const time = useRelativeTime(ad.createdAtISO);
  return (
    <motion.div whileHover={{y:-4}} onClick={onSelect}
      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
        <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={ad.title} className="w-full h-full object-cover" loading="lazy"/>
        {ad.type==='rent'&&<div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs font-bold text-white">للإيجار</div>}
        <button onClick={onFav} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${isFav?'bg-red-500':'bg-black/50 hover:bg-black/70'} transition-colors`}>
          <Heart className={`w-4 h-4 text-white ${isFav?'fill-current':''}`}/></button>
        {ad.seller?.isVerified&&<div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center gap-1"><Shield className="w-2.5 h-2.5"/>موثق</div>}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{ad.title}</h3>
        <p className="text-lg font-bold text-amber-400 mb-2">{formatPrice(ad.price)} <span className="text-xs text-gray-400">د.ع</span></p>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2 flex-1"><MapPin className="w-3 h-3 flex-shrink-0"/><span className="line-clamp-1">{ad.location}</span></div>
        <div className="flex items-center justify-between mt-auto">
          <button onClick={e=>{e.stopPropagation();onSellerClick?.(e);}} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>
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
function ProductCard({ product, onSelect, isFav, onFav, onSellerClick }:{
  product:Product; onSelect:()=>void; isFav:boolean; onFav:(e:React.MouseEvent)=>void; onSellerClick?:(e:React.MouseEvent)=>void;
}) {
  const time = useRelativeTime(product.createdAtISO);
  return (
    <motion.div whileHover={{y:-4}} onClick={onSelect}
      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
        <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={product.title} className="w-full h-full object-cover" loading="lazy"/>
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{background:product.condition==='new'?'#22c55e':'#f59e0b'}}>
          {product.condition==='new'?'جديد':'مستعمل'}</div>
        <button onClick={onFav} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${isFav?'bg-red-500':'bg-black/50 hover:bg-black/70'}`}>
          <Heart className={`w-4 h-4 text-white ${isFav?'fill-current':''}`}/></button>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-purple-600 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
          <ShoppingBag className="w-2.5 h-2.5"/>متجر</div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{product.title}</h3>
        <p className="text-lg font-bold text-amber-400 mb-2">{formatPrice(product.price)} <span className="text-xs text-gray-400">د.ع</span></p>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2 flex-1"><MapPin className="w-3 h-3 flex-shrink-0"/><span>{product.governorate}</span></div>
        <div className="flex items-center justify-between mt-auto">
          <button onClick={e=>{e.stopPropagation();onSellerClick?.(e);}} className="flex items-center gap-1.5 hover:opacity-80">
            <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-5 h-5 rounded-full border border-gray-600 object-cover"/>
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
function AdDetailModal({ ad, onClose, isFav, onFav, user, onAuthRequired, onSellerClick, onViewDurationLogged, onImageZoom, onShare }:{
  ad:Ad|null; onClose:()=>void; isFav:boolean; onFav:()=>void; user:User|null; onAuthRequired:()=>void; onSellerClick?:(sellerId:string)=>void;
  onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string)=>void;
  onShare?:(data:{title:string; url:string; image?:string; price?:string})=>void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  useEffect(()=>{
    setImgIdx(0);
    if (ad) {
      recordItemView(ad.id, 'ad', user);
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
        className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <InterestTimer itemId={ad.id} itemType="ad" />
        <div className="relative"><div className="aspect-video overflow-hidden rounded-t-3xl bg-gray-800 relative group">
          <img src={ad.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={ad.title}
            onClick={() => onImageZoom?.(ad.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700', ad.title)}
            className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all duration-300"/>
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
            <span>🔍 اضغط لتكبير وتحميل الصورة</span>
          </div>
        </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white"><X className="w-5 h-5"/></button>
          {(ad.images?.length || 0)>1&&<>
            <button onClick={()=>setImgIdx(i=>Math.max(0,i-1))} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-xl text-white"><ChevronRight className="w-5 h-5"/></button>
            <button onClick={()=>setImgIdx(i=>Math.min((ad.images?.length || 0)-1,i+1))} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-xl text-white"><ChevronLeft className="w-5 h-5"/></button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{ad.images?.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`h-1.5 rounded-full transition-all ${i===imgIdx?'w-5 bg-white':'w-1.5 bg-white/50'}`}/>)}</div>
          </>}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-xl font-bold text-white mb-1">{ad.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{ad.location}</span>
                <TimeAgo iso={ad.createdAtISO} className="text-green-400 font-medium"/>
                <button onClick={() => setShowViewers(true)} className="flex items-center gap-1 text-xs hover:text-amber-400 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Eye className="w-3.5 h-3.5"/><span>{ad.views} مشاهدة</span>
                </button>
              </div>
            </div>
            <div className="text-left"><p className="text-2xl font-bold text-amber-400">{formatPrice(ad.price)}</p><p className="text-gray-400 text-xs">دينار عراقي</p></div>
          </div>
          <AnimatePresence>
            {showViewers && <ViewersModal itemId={ad.id} itemType="ad" onClose={() => setShowViewers(false)} />}
          </AnimatePresence>
          {ad.description&&<div className="bg-gray-800 rounded-xl p-4 mb-4"><h3 className="text-white font-bold text-sm mb-2">الوصف</h3><p className="text-gray-300 text-sm leading-relaxed">{ad.description}</p></div>}
          {/* Seller */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="relative hover:opacity-80 transition-opacity">
                <img src={ad.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>
                {ad.seller?.isVerified&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white"/></div>}
              </button>
              <div className="flex-1">
                <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="text-white font-bold text-sm hover:text-amber-400">{ad.seller?.name || 'مستخدم'}</button>
                <div className="flex items-center gap-1">{[...Array(5)].map((_,i)=><Star key={i} className={`w-3 h-3 ${i<Math.floor(ad.seller?.rating || 0)?'fill-amber-400 text-amber-400':'text-gray-600'}`}/>)}</div>
              </div>
              <button onClick={()=>onSellerClick?.(ad.postedBy||'')} className="text-xs text-amber-400 hover:underline flex items-center gap-1">صفحة البائع<ChevronRight className="w-3 h-3"/></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.a href={getWhatsAppLink(ad.phone, ad.type === 'transport' ? 'transport' : 'product', { title: ad.title, location: ad.location, university: ad.description, time: 'راجع الإعلان' })} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl text-sm">
              <MessageSquare className="w-5 h-5"/> واتساب</motion.a>
            <motion.a href={`tel:${ad.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white font-bold rounded-xl text-sm">
              <PhoneIcon className="w-5 h-5"/> اتصال</motion.a>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{if(!user){onAuthRequired();return;}onFav();}}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${isFav?'bg-red-500 text-white':'bg-gray-800 text-white'}`}>
              <Heart className={`w-4 h-4 ${isFav?'fill-current':''}`}/>{isFav?'في المفضلة':'أضف للمفضلة'}</button>
            <button onClick={() => onShare?.({ title: ad.title, url: generateAdUrl(ad.category, ad.title, ad.id), image: ad.images?.[0], price: formatPrice(ad.price) })}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20">
              <Share2 className="w-4 h-4"/> مشاركة الإعلان</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Product Detail Modal
// ─────────────────────────────────────────────
function ProductDetailModal({ product, onClose, isFav, onFav, user, onAuthRequired, onSellerClick, onViewDurationLogged, onImageZoom, onShare }:{
  product:Product|null; onClose:()=>void; isFav:boolean; onFav:()=>void; user:User|null; onAuthRequired:()=>void; onSellerClick?:(id:string)=>void;
  onViewDurationLogged?:(seconds:number)=>void; onImageZoom?:(src:string, title:string)=>void;
  onShare?:(data:{title:string; url:string; image?:string; price?:string})=>void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  useEffect(()=>{
    setImgIdx(0);
    if (product) {
      recordItemView(product.id, 'product', user);
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

  if(!product) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <InterestTimer itemId={product.id} itemType="product" />
        <div className="relative"><div className="aspect-video overflow-hidden rounded-t-3xl bg-gray-800 relative group">
          <img src={product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt={product.title}
            onClick={() => onImageZoom?.(product.images?.[imgIdx] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700', product.title)}
            className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all duration-300"/>
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
            <span>🔍 اضغط لتكبير وتحميل الصورة</span>
          </div>
        </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white"><X className="w-5 h-5"/></button>
          {(product.images?.length || 0)>1&&<>
            <button onClick={()=>setImgIdx(i=>Math.max(0,i-1))} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-xl text-white"><ChevronRight className="w-5 h-5"/></button>
            <button onClick={()=>setImgIdx(i=>Math.min((product.images?.length || 0)-1,i+1))} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-xl text-white"><ChevronLeft className="w-5 h-5"/></button>
          </>}
          <div className="absolute top-3 left-12 px-3 py-1 rounded-full text-xs font-bold text-white" style={{background:product.condition==='new'?'#22c55e':'#f59e0b'}}>
            {product.condition==='new'?'جديد':'مستعمل'}</div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-xl font-bold text-white mb-1">{product.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{product.governorate}</span>
                <TimeAgo iso={product.createdAtISO} className="text-green-400 font-medium"/>
                <button onClick={() => setShowViewers(true)} className="flex items-center gap-1 text-xs hover:text-amber-400 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                  <Eye className="w-3.5 h-3.5"/><span>{product.views} مشاهدة</span>
                </button>
              </div>
            </div>
            <div className="text-left"><p className="text-2xl font-bold text-amber-400">{formatPrice(product.price)}</p><p className="text-gray-400 text-xs">دينار عراقي</p></div>
          </div>
          <AnimatePresence>
            {showViewers && <ViewersModal itemId={product.id} itemType="product" onClose={() => setShowViewers(false)} />}
          </AnimatePresence>
          {product.stock>0&&<div className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full mb-3"><Package className="w-3 h-3"/>متوفر: {product.stock} قطعة</div>}
          {product.description&&<div className="bg-gray-800 rounded-xl p-4 mb-4"><h3 className="text-white font-bold text-sm mb-2">الوصف</h3><p className="text-gray-300 text-sm leading-relaxed">{product.description}</p></div>}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="hover:opacity-80">
                <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>
              </button>
              <div className="flex-1">
                <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-white font-bold text-sm hover:text-amber-400">{product.seller?.name || 'مستخدم'}</button>
                <p className="text-gray-400 text-xs">{product.seller?.location || 'غير محدد'}</p>
              </div>
              <button onClick={()=>onSellerClick?.(product.postedBy)} className="text-xs text-amber-400 hover:underline flex items-center gap-1">صفحة البائع<ChevronRight className="w-3 h-3"/></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.a href={getWhatsAppLink(product.phone, 'product', { title: product.title, location: product.governorate })} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl text-sm">
              <MessageSquare className="w-5 h-5"/> واتساب</motion.a>
            <motion.a href={`tel:${product.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white font-bold rounded-xl text-sm">
              <PhoneIcon className="w-5 h-5"/> اتصال</motion.a>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{if(!user){onAuthRequired();return;}onFav();}}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${isFav?'bg-red-500 text-white':'bg-gray-800 text-white'}`}>
              <Heart className={`w-4 h-4 ${isFav?'fill-current':''}`}/>{isFav?'في المفضلة':'أضف للمفضلة'}</button>
            <button onClick={()=>navigator.share?.({title:product.title,url:window.location.href})}
              className="flex-1 py-3 bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <Share2 className="w-4 h-4"/> مشاركة</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TransportDetailModal({ ad, onClose, user, onAuthRequired, onViewDurationLogged }:{
  ad:TransportAd|null; onClose:()=>void; user:User|null; onAuthRequired:()=>void;
  onViewDurationLogged?:(seconds:number)=>void;
}) {
  const [showViewers, setShowViewers] = useState(false);
  useEffect(()=>{
    if (ad) {
      recordItemView(ad.id, 'transport', user);
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
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-white"><X className="w-5 h-5"/></button>
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
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-5 flex items-center gap-3">
          <img src={ad.sellerAvatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-10 h-10 rounded-full border border-gray-600 object-cover"/>
          <div>
            <span className="text-white font-bold text-sm block">{ad.sellerName}</span>
            <span className="text-gray-400 text-xs">صاحب الإعلان</span>
          </div>
        </div>

        {/* Call Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.a href={getWhatsAppLink(ad.phone, 'transport', { title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
            whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-bold rounded-xl text-sm">
            <MessageSquare className="w-5 h-5"/> واتساب
          </motion.a>
          <motion.a href={`tel:${ad.phone}`} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white font-bold rounded-xl text-sm">
            <PhoneIcon className="w-5 h-5"/> اتصال
          </motion.a>
        </div>

        <AnimatePresence>
          {showViewers && <ViewersModal itemId={ad.id} itemType="transport" onClose={() => setShowViewers(false)} />}
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
  const [images, setImages] = useState<{preview:string;progress:number}[]>(editAd?.images?.map(img=>({preview:img,progress:100}))||[]);
  const [uploading, setUploading] = useState(false); const [pct, setPct] = useState(0);
  const playSound = useSound();
  useEffect(()=>{ if(editAd){ setFd({title:editAd.title,price:formatPrice(editAd.price),description:editAd.description,category:editAd.category,governorate:editAd.governorate,phone:editAd.phone,type:editAd.type}); setImages(editAd.images?.map(img=>({preview:img,progress:100})) || []); } },[editAd]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    const files = Array.from(e.target.files);
    for(const file of files){
      const idx = images.length;
      setImages(prev=>[...prev,{preview:'',progress:0}]);
      let p=0; const iv=setInterval(()=>{ p=Math.min(p+Math.random()*30,85); setImages(prev=>prev.map((img,i)=>i===idx&&img.progress<100?{...img,progress:p}:img)); },120);
      const b64 = await compressImage(file);
      clearInterval(iv);
      setImages(prev=>prev.map((img,i)=>i===idx?{preview:b64,progress:100}:img));
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
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
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
                <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none">
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
                    <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white"/></button>
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
  const [fd, setFd] = useState({ title:editProduct?.title||'', price:editProduct?.price?formatPrice(editProduct.price):'', description:editProduct?.description||'', category:editProduct?.category||'phones', governorate:editProduct?.governorate||user?.location||'بغداد', phone:editProduct?.phone||user?.phone||'', condition:(editProduct?.condition||'new') as 'new'|'used', stock:editProduct?.stock||1 });
  const [images, setImages] = useState<{preview:string;progress:number}[]>(editProduct?.images?.map(img=>({preview:img,progress:100}))||[]);
  const [uploading, setUploading] = useState(false); const [pct, setPct] = useState(0);
  const playSound = useSound();
  useEffect(()=>{if(editProduct){setFd({title:editProduct.title,price:formatPrice(editProduct.price),description:editProduct.description,category:editProduct.category,governorate:editProduct.governorate,phone:editProduct.phone,condition:editProduct.condition,stock:editProduct.stock});setImages(editProduct.images?.map(img=>({preview:img,progress:100})) || []);}},[editProduct]);
  const handleImages = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    for(const file of Array.from(e.target.files)){
      const idx = images.length;
      setImages(prev=>[...prev,{preview:'',progress:0}]);
      let p=0; const iv=setInterval(()=>{p=Math.min(p+Math.random()*30,85);setImages(prev=>prev.map((img,i)=>i===idx&&img.progress<100?{...img,progress:p}:img));},120);
      const b64=await compressImage(file); clearInterval(iv);
      setImages(prev=>prev.map((img,i)=>i===idx?{preview:b64,progress:100}:img));
    }
  };
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setUploading(true); playSound('click');
    for(let i=0;i<=100;i+=20){await new Promise(r=>setTimeout(r,100));setPct(i);}
    const p:Product = { id:isEdit?editProduct!.id:Date.now(), title:fd.title, price:fd.price.replace(/,/g,''), description:fd.description, category:fd.category, governorate:fd.governorate, phone:fd.phone, condition:fd.condition, stock:fd.stock,
      images:images.filter(i=>i.preview).map(i=>i.preview).concat(images.length===0?['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700']:[]),
      seller:{name:user.name,avatar:user.avatar,isVerified:user.isVerified,rating:user.rating||5,joinedDate:user.joinedDate,location:user.location},
      createdAtISO:isEdit?(editProduct?.createdAtISO||new Date().toISOString()):new Date().toISOString(), views:isEdit?(editProduct?.views||0):0, postedBy:user.id };
    setUploading(false); playSound('success'); onSubmit(p); onClose();
    if(!isEdit){setFd({title:'',price:'',description:'',category:'phones',governorate:user?.location||'بغداد',phone:user?.phone||'',condition:'new',stock:1});setImages([]);}
  };
  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  const cats = CATEGORIES.filter(c=>c.id!=='all'&&c.id!=='games');
  if(!isOpen) return null;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="relative bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-700 z-10">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-purple-400"/></div>
            <h2 className="text-xl font-bold text-white">{isEdit?'تعديل المنتج':'إضافة منتج جديد'}</h2></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
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
              <input type="number" min="1" value={fd.stock} onChange={e=>setFd({...fd,stock:+e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-gray-300 text-xs font-medium mb-2 block">المحافظة</label>
              <select value={fd.governorate} onChange={e=>setFd({...fd,governorate:e.target.value})} className="w-full bg-gray-800 text-white rounded-xl py-3 px-4 border border-gray-700 focus:border-amber-400 outline-none">
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
                  <button type="button" onClick={()=>setImages(images.filter((_,j)=>j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white"/></button>
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
                    ? 'إذا تم العثور على خط، سيتم إخفاء إعلانك من قائمة الخطوط العامة ونقله إلى قسم "مكتمل" داخل حسابك.'
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


// Profile View
// ─────────────────────────────────────────────
function ProfileView({ user, myAds, myProducts, onDeleteAd, onEditAd, onDeleteProduct, onEditProduct, onUpdateUser, onAddAd, onAddProduct, transportLines, onUpdateTransportStatus, onDeleteTransportAd }:{
  user:User; myAds:Ad[]; myProducts:Product[]; onDeleteAd:(id:number)=>void; onEditAd:(ad:Ad)=>void;
  onDeleteProduct:(id:number)=>void; onEditProduct:(p:Product)=>void; onUpdateUser:(u:User)=>void;
  onAddAd:()=>void; onAddProduct:()=>void;
  transportLines: TransportAd[];
  onUpdateTransportStatus: (id: number, status: TransportAd['status'], reason?: TransportAd['completion_reason']) => void;
  onDeleteTransportAd: (id: number) => void;
}) {
  const [tab, setTab] = useState<'ads'|'store'|'lines'|'account'>('ads');
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({ name:user.name, phone:user.phone, location:user.location, bio:user.bio||'' });
  // Image crop state
  const [cropSrc, setCropSrc] = useState<string|null>(null);
  const [cropType, setCropType] = useState<'avatar'|'cover'>('avatar');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar||DEFAULT_AVATAR);
  const [coverPreview, setCoverPreview] = useState(user.cover||DEFAULT_COVER);
  const playSound = useSound();

  useEffect(() => {
    const handleSwitch = () => setTab('lines');
    window.addEventListener('switch-to-lines-tab', handleSwitch);
    return () => window.removeEventListener('switch-to-lines-tab', handleSwitch);
  }, []);

  const handleSave = () => {
    const updated:User = { ...user, ...ef, avatar:avatarPreview, cover:coverPreview };
    onUpdateUser(updated); setEditing(false);
  };

  const openCrop = async (e:React.ChangeEvent<HTMLInputElement>, type:'avatar'|'cover') => {
    if(!e.target.files?.[0]) return;
    const b64 = await compressImage(e.target.files[0], 1200, 0.9);
    setCropType(type); setCropSrc(b64);
  };

  const handleCropSave = (b64:string) => {
    if(cropType==='avatar') setAvatarPreview(b64); else setCoverPreview(b64);
    setCropSrc(null);
  };

  const totalViews = myAds.reduce((s,a)=>s+a.views,0) + myProducts.reduce((s,p)=>s+p.views,0);

  return (
    <div className="min-h-screen bg-gray-950 pt-16 pb-10">
      {/* Banner & Header */}
      <div className="relative w-full">
        {/* Banner with 3:1 aspect ratio */}
        <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gray-900 relative overflow-hidden flex items-center justify-center">
          <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"/>
          <img src={coverPreview} alt="Cover" className="relative w-full h-full object-contain z-0"/>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent z-10"/>
          {editing&&<label className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs rounded-xl cursor-pointer hover:bg-black/80 backdrop-blur-md z-20">
            <Camera className="w-4 h-4"/> تغيير الغلاف
            <input type="file" accept="image/*" onChange={e=>openCrop(e,'cover')} className="hidden"/></label>}
        </div>

        <div className="container mx-auto px-4 max-w-3xl relative">
          {/* Avatar & Actions Container */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            {/* Avatar */}
            <div className="relative z-20">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-950 shadow-xl overflow-hidden bg-white flex items-center justify-center">
                <img src={avatarPreview} alt={user.name} className="w-full h-full object-contain p-0.5"/>
              </div>
              {editing&&(
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <label className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-amber-400">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-black"/>
                    <input type="file" accept="image/*" onChange={e=>openCrop(e,'avatar')} className="hidden"/></label>
                  <button onClick={()=>setAvatarPreview(DEFAULT_AVATAR)} className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-400">
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
                <button onClick={()=>{setEditing(true);setEf({name:user.name,phone:user.phone,location:user.location,bio:user.bio||''});}} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-amber-500 text-black rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600">
                  <Edit2 className="w-4 h-4"/>تعديل</button>
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
              {user.badges?.isStudent && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md text-xs font-semibold flex items-center gap-1">🎓 طالب موثق</span>}
              {user.badges?.hasVehicle && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-md text-xs font-semibold flex items-center gap-1">🚗 مركبة موثقة</span>}
              {user.badges?.hasID && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md text-xs font-semibold flex items-center gap-1">🪪 هوية موثقة</span>}
              {user.badges?.isPhoneVerified && <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-md text-xs font-semibold flex items-center gap-1">📱 هاتف موثق</span>}
            </div>
            
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
              <div className="flex items-center gap-1"><MapPin className="w-4 h-4"/><span>{user.location || 'العراق'}</span></div>
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4"/><span>انضم {user.joinedDate}</span></div>
              {user.rating && <div className="flex items-center gap-1 text-amber-400"><Star className="w-4 h-4 fill-current"/><span className="font-bold">{user.rating}</span></div>}
            </div>
            {user.bio&&<p className="text-gray-300 text-sm mt-3 line-clamp-2 bg-gray-800/50 p-3 rounded-xl border border-gray-800">{user.bio}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
            {[{v:myAds.length,l:'إعلان',c:'text-amber-400'},{v:myProducts.length,l:'منتج',c:'text-purple-400'},{v:totalViews,l:'مشاهدة',c:'text-blue-400'},{v:user.stats.favorites,l:'مفضلة',c:'text-red-400'}].map((s,i)=>(
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
          {([['ads',`📢 إعلاناتي (${myAds.length})`],['store',`🛍️ متجري (${myProducts.length})`],['lines',`🚌 خطوطي`],['account','⚙️ الحساب']] as [string,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tab===t?'bg-amber-500 text-black shadow':'text-gray-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>

        {/* Ads Tab */}
        {tab==='ads'&&(
          <>
            <button onClick={onAddAd} className="w-full mb-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2">
              <Plus className="w-5 h-5"/> إضافة إعلان جديد</button>
            {myAds.length===0?(
              <div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700 border-dashed">
                <div className="text-4xl mb-3">📭</div><p className="text-white font-bold mb-1">لا إعلانات بعد</p><p className="text-gray-400 text-sm">انشر أول إعلان الآن!</p>
              </div>
            ):(
              <div className="space-y-3">
                {myAds.map(ad=>(
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
                      <button onClick={()=>onEditAd(ad)} className="p-2 bg-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/30"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30"><Trash2 className="w-3.5 h-3.5"/></button>
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
            {myProducts.length===0?(
              <div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700 border-dashed">
                <div className="text-4xl mb-3">🛍️</div><p className="text-white font-bold mb-1">متجرك فارغ</p><p className="text-gray-400 text-sm">أضف أول منتج الآن!</p>
              </div>
            ):(
              <div className="space-y-3">
                {myProducts.map(p=>(
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
                      <button onClick={()=>onEditProduct(p)} className="p-2 bg-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/30"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onDeleteProduct(p.id)} className="p-2 bg-red-500/20 rounded-xl text-red-400 hover:bg-red-500/30"><Trash2 className="w-3.5 h-3.5"/></button>
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
          <MyLinesTab 
            userId={user.id} 
            lines={transportLines.filter(line => line.postedBy === user.id)}
            onUpdateStatus={onUpdateTransportStatus}
            onDelete={onDeleteTransportAd}
          />
        )}

        {tab==='account'&&(
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2"><User className="w-4 h-4 text-amber-400"/>المعلومات الشخصية</h3>
                {!editing&&<button onClick={()=>setEditing(true)} className="text-xs text-amber-400 hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3"/> تعديل</button>}
              </div>
              <div className="space-y-3">
                {[{label:'الاسم الكامل',field:'name',placeholder:'اسمك الكامل'},{label:'رقم الهاتف',field:'phone',placeholder:'07XXXXXXXXX'},{label:'نبذة شخصية',field:'bio',placeholder:'اكتب نبذة...',multi:true}].map(({label,field,placeholder,multi})=>(
                  <div key={field}><label className="text-gray-400 text-xs font-medium mb-1 block">{label}</label>
                    {multi?(
                      <textarea disabled={!editing} value={(ef as any)[field]} onChange={e=>setEf({...ef,[field]:e.target.value})} placeholder={placeholder} rows={2} className={`w-full bg-gray-700 text-white rounded-xl py-2.5 px-4 border outline-none resize-none text-sm ${editing?'border-amber-400':'border-gray-600 opacity-70'}`}/>
                    ):(
                      <input disabled={!editing} value={(ef as any)[field]} onChange={e=>setEf({...ef,[field]:e.target.value})} placeholder={placeholder} className={`w-full bg-gray-700 text-white rounded-xl py-2.5 px-4 border outline-none text-sm ${editing?'border-amber-400':'border-gray-600 opacity-70'}`}/>
                    )}
                  </div>
                ))}
                <div><label className="text-gray-400 text-xs font-medium mb-1 block">المحافظة</label>
                  <select disabled={!editing} value={ef.location} onChange={e=>setEf({...ef,location:e.target.value})} className={`w-full bg-gray-700 text-white rounded-xl py-2.5 px-4 border outline-none text-sm ${editing?'border-amber-400':'border-gray-600 opacity-70'}`}>
                    {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select></div>
                {editing&&<div className="flex gap-3 pt-2">
                  <button onClick={handleSave} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4"/>حفظ التغييرات</button>
                  <button onClick={()=>setEditing(false)} className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl text-sm">إلغاء</button>
                </div>}
              </div>
            </div>
            {/* Email (read-only) */}
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="text-white font-bold flex items-center gap-2 mb-3"><Mail className="w-4 h-4 text-blue-400"/>معلومات الحساب</h3>
              <div className="space-y-2">
                {[{label:'البريد الإلكتروني',val:user.email},{label:'تاريخ الانضمام',val:user.joinedDate},{label:'نوع الحساب',val:user.role==='owner'?'مالك':user.role==='admin'?'مشرف':'مستخدم'}].map((r,i)=>(
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <span className="text-gray-400 text-sm">{r.label}</span>
                    <span className="text-white text-sm font-medium">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropSrc&&<ImageCropModal src={cropSrc} aspectRatio={cropType==='avatar'?1:3} title={cropType==='avatar'?'قص الصورة الشخصية':'قص صورة الغلاف'} onSave={handleCropSave} onClose={()=>setCropSrc(null)}/>}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Seller Public Page
// ─────────────────────────────────────────────
function SellerPublicPage({ sellerId, allAds, allProducts, onBack, onSelectAd, onSelectProduct, favorites, onToggleFav, user, onAuthRequired }:{
  sellerId:string; allAds:Ad[]; allProducts:Product[]; onBack:()=>void;
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void;
  favorites:number[]; onToggleFav:(id:number)=>void; user:User|null; onAuthRequired:()=>void;
}) {
  const [tab, setTab] = useState<'ads'|'products'>('ads');
  const [sellerUser, setSellerUser] = useState<any>(null);

  const sellerAds = allAds.filter(a=>a.postedBy===sellerId);
  const sellerProds = allProducts.filter(p=>p.postedBy===sellerId);
  const sellerInfo: SellerInfo|null = sellerAds[0]?.seller || sellerProds[0]?.seller || null;

  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const found = users.find((u: any) => u.id === sellerId);
      if (found) {
        setSellerUser(found);
      } else if (sellerInfo) {
        setSellerUser({
          id: sellerId,
          name: sellerInfo.name,
          avatar: sellerInfo.avatar,
          location: sellerInfo.location,
          isVerified: sellerInfo.isVerified,
          rating: sellerInfo.rating || 5,
          ratingCount: 1,
          cover: DEFAULT_COVER
        });
      }
    } catch (e) {}
  }, [sellerId, sellerInfo]);

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

  if(!sellerInfo) return (
    <div className="min-h-screen bg-gray-950 pt-16 flex flex-col items-center justify-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-white font-bold text-xl mb-2">لم يتم العثور على البائع</h2>
      <button onClick={onBack} className="mt-4 px-6 py-2 bg-amber-500 text-black rounded-xl font-bold">عودة</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 pt-16 pb-10">
      {/* Cover */}
      <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gray-900 relative overflow-hidden flex items-center justify-center">
        <img src={sellerUser?.cover || DEFAULT_COVER} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"/>
        <img 
          src={sellerUser?.cover || DEFAULT_COVER} 
          alt="Cover" 
          className="relative w-full h-full object-contain z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent z-10"/>
        <button onClick={onBack} className="absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-xl text-xs hover:bg-black/80 font-bold border border-white/10">
          <ChevronRight className="w-4 h-4"/> رجوع</button>
      </div>

      <div className="container mx-auto px-4 max-w-3xl relative">
        {/* Avatar Area */}
        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-gray-950 shadow-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
            <img src={sellerUser?.avatar || sellerInfo.avatar} alt={sellerUser?.name || sellerInfo.name} className="w-full h-full object-contain p-0.5"/>
          </div>
        </div>

        {/* User Details */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{sellerUser?.name || sellerInfo.name}</h2>
            {(sellerUser?.isVerified || sellerInfo.isVerified) && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-bold">
                <Shield className="w-3 h-3"/>موثق
              </span>
            )}
          </div>
          
          {/* Interactive Rating */}
          <div className="flex items-center gap-2 mt-2 bg-gray-800/40 p-2.5 rounded-xl border border-gray-800/80 inline-flex flex-wrap">
            <span className="text-gray-400 text-xs font-medium">تقييم البائع:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => {
                const isLit = stars <= Math.round(sellerUser?.rating || sellerInfo.rating);
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
            <span className="text-amber-400 font-bold text-sm mr-1">{sellerUser?.rating || sellerInfo.rating}</span>
            <span className="text-gray-500 text-xs">({sellerUser?.ratingCount || 1} تقييم)</span>
          </div>

          <p className="text-gray-400 text-sm mt-3 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{sellerUser?.location || sellerInfo.location}</span>
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
        <div className="flex gap-2 mb-5 bg-gray-800 p-1.5 rounded-2xl border border-gray-700">
          {([['ads',`📢 الإعلانات (${sellerAds.length})`],['products',`🛍️ المنتجات (${sellerProds.length})`]] as [string,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`flex-1 py-2 rounded-xl text-sm font-bold ${tab===t?'bg-amber-500 text-black':'text-gray-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>
        {tab==='ads'&&(sellerAds.length===0?(
          <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">📭</div><p className="text-gray-400">لا إعلانات بعد</p></div>
        ):(
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sellerAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(ad.id);}}/>)}
          </div>
        ))}
        {tab==='products'&&(sellerProds.length===0?(
          <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700"><div className="text-3xl mb-2">🛍️</div><p className="text-gray-400">لا منتجات بعد</p></div>
        ):(
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sellerProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)} onFav={e=>{e.stopPropagation();if(!user){onAuthRequired();return;}onToggleFav(p.id);}}/>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Owner Dashboard
// ─────────────────────────────────────────────
const DEVICE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6'];
function OwnerDashboard({ ads, products, onDeleteAd, onDeleteProduct, onClose }:{ads:Ad[];products:Product[];onDeleteAd:(id:number)=>void;onDeleteProduct:(id:number)=>void;onClose:()=>void}) {
  const [tab, setTab] = useState<'overview'|'visitors'|'users'|'content'|'broadcast'>('overview');
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  
  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(()=>{
    try{setStoredUsers(JSON.parse(localStorage.getItem('souqUsers')||'[]'));}catch{}
    try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}
    const iv=setInterval(()=>{try{setVisits(JSON.parse(localStorage.getItem('souqVisits')||'[]'));}catch{}},30_000);
    return()=>clearInterval(iv);
  },[]);

  // Calculate stats
  const today = new Date().toDateString();
  const todayV = visits.filter(v=>new Date(v.timestamp).toDateString()===today);
  const deviceData=[{name:'موبايل',value:visits.filter(v=>v.device==='mobile').length},{name:'كمبيوتر',value:visits.filter(v=>v.device==='desktop').length},{name:'تابلت',value:visits.filter(v=>v.device==='tablet').length}].filter(d=>d.value>0);
  const locMap:Record<string,number>={};
  visits.forEach(v=>{locMap[v.location]=(locMap[v.location]||0)+1;});
  const locData=Object.entries(locMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({name,value}));
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return{name:`${d.getDate()}/${d.getMonth()+1}`,زيارات:visits.filter(v=>new Date(v.timestamp).toDateString()===d.toDateString()).length};}).reverse();
  
  // Financial & Market stats
  const parsePrice = (p: string) => {
    if(!p) return 0;
    const num = Number(p.toString().replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? 0 : num;
  };
  const totalMarketValue = ads.reduce((s,a)=>s+parsePrice(a.price),0) + products.reduce((s,p)=>s+parsePrice(p.price),0);
  const formatter = new Intl.NumberFormat('en-US');
  
  const allContent = [...ads, ...products];
  const mostViewed = allContent.sort((a,b)=>b.views - a.views)[0];
  
  const catMap:Record<string,number>={};
  ads.forEach(a=>{catMap[a.category]=(catMap[a.category]||0)+1;});
  const topCategory = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'لا يوجد';

  // Actions
  const toggleBan=(id:string)=>{
    const u=storedUsers.map(u=>u.id===id?{...u,isBanned:!u.isBanned}:u);
    setStoredUsers(u);localStorage.setItem('souqUsers',JSON.stringify(u));
  };

  const changeRole=(id:string, newRole:string)=>{
    const u=storedUsers.map(u=>u.id===id?{...u,role:newRole as any}:u);
    setStoredUsers(u);localStorage.setItem('souqUsers',JSON.stringify(u));
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!broadcastTitle || !broadcastMsg) return;
    setIsBroadcasting(true);
    try {
      const userIds = storedUsers.map(u => u.id).filter(id => id);
      if (userIds.length > 0) {
        const notifications = userIds.map(uid => ({
          seller_id: uid,
          title: broadcastTitle,
          description: broadcastMsg,
          price: '0',
          category: 'notification',
          location: '',
          city: '',
          images: [],
          phone: '',
          type: 'notification',
          status: 'active',
          is_demo: false,
          seller_name: 'إدارة الموقع',
          seller_avatar: '',
          metadata: { type: 'message', message: broadcastMsg, title: broadcastTitle }
        }));
        
        const chunkSize = 100;
        for (let i = 0; i < notifications.length; i += chunkSize) {
          const chunk = notifications.slice(i, i + chunkSize);
          await supabase.from('ads').insert(chunk);
        }
      }
      setBroadcastSent(true);
      setTimeout(() => { setBroadcastTitle(''); setBroadcastMsg(''); setBroadcastSent(false); }, 3000);
    } catch (err) {
      console.error('Broadcast failed:', err);
      alert('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"><Crown className="w-6 h-6 text-black"/></div>
            <div><h1 className="text-2xl font-bold text-white">داشبورت المالك</h1><p className="text-amber-400 text-xs">تحليلات شاملة وإدارة كاملة للموقع</p></div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[{l:'زيارات اليوم',v:todayV.length,icon:<Activity className="w-5 h-5"/>,c:'text-green-400',bg:'bg-green-500/10 border-green-500/20'},
            {l:'إجمالي الزيارات',v:visits.length,icon:<Globe className="w-5 h-5"/>,c:'text-blue-400',bg:'bg-blue-500/10 border-blue-500/20'},
            {l:'المستخدمون',v:storedUsers.length,icon:<Users className="w-5 h-5"/>,c:'text-purple-400',bg:'bg-purple-500/10 border-purple-500/20'},
            {l:'المحتوى',v:ads.length+products.length,icon:<Layers className="w-5 h-5"/>,c:'text-amber-400',bg:'bg-amber-500/10 border-amber-500/20'}].map((s,i)=>(
            <div key={i} className={`${s.bg} rounded-2xl p-4 border text-center`}>
              <div className={`flex justify-center mb-2 ${s.c}`}>{s.icon}</div>
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {([['overview','📊 نظرة عامة'],['visitors','👥 الزوار'],['users','🧑‍💼 المستخدمون'],['content','📢 المحتوى'],['broadcast','🔔 إشعار عام']] as [string,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab===t?'bg-amber-500 text-black':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{l}</button>
          ))}
        </div>
        
        {tab==='overview'&&(
          <div className="space-y-5">
            {/* Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-amber-400 mb-1"><BarChart3 className="w-6 h-6"/></span>
                <p className="text-gray-300 text-xs mb-1">إجمالي القيمة السوقية</p>
                <h3 className="text-white text-2xl font-bold" dir="ltr">{formatter.format(totalMarketValue)} <span className="text-amber-500 text-sm">IQD</span></h3>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-emerald-400 mb-1"><Star className="w-6 h-6"/></span>
                <p className="text-gray-300 text-xs mb-1">الإعلان الأكثر مشاهدة</p>
                <h3 className="text-white text-lg font-bold line-clamp-1">{mostViewed?.title || 'لا يوجد'}</h3>
                <span className="text-gray-500 text-xs">{mostViewed?.views || 0} مشاهدة</span>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-purple-400 mb-1"><Package className="w-6 h-6"/></span>
                <p className="text-gray-300 text-xs mb-1">القسم الأكثر نشاطاً</p>
                <h3 className="text-white text-lg font-bold">{topCategory}</h3>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-amber-400"/>الزيارات آخر 7 أيام</h3>
              {visits.length===0?<div className="h-40 flex items-center justify-center text-gray-500 text-sm">لا توجد زيارات مسجلة بعد</div>:(
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={last7} margin={{top:5,right:5,left:-20,bottom:5}}>
                    <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize:11}} tickLine={false}/>
                    <YAxis stroke="#6b7280" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                    <Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'12px',color:'#fff'}}/>
                    <Bar dataKey="زيارات" fill="#f59e0b" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-400"/>حسب الجهاز</h3>
                {deviceData.length===0?<p className="text-gray-500 text-sm text-center py-6">لا بيانات</p>:(
                  <>
                    <ResponsiveContainer width="100%" height={140}><PieChart><Pie data={deviceData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">{deviceData.map((_,i)=><Cell key={i} fill={DEVICE_COLORS[i%3]}/>)}</Pie><Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'12px',color:'#fff'}}/><Legend formatter={v=><span style={{color:'#d1d5db',fontSize:11}}>{v}</span>}/></PieChart></ResponsiveContainer>
                    <div className="mt-2 space-y-1.5">
                      {deviceData.map((d,i)=>(
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:DEVICE_COLORS[i%3]}}/>
                          <span className="text-gray-300 text-xs flex-1">{d.name}</span>
                          <div className="w-20 h-1.5 bg-gray-700 rounded-full"><div className="h-full rounded-full" style={{width:`${Math.round(d.value/visits.length*100)}%`,background:DEVICE_COLORS[i%3]}}/></div>
                          <span className="text-white text-xs font-bold w-6">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-green-400"/>حسب الموقع</h3>
                {locData.length===0?<p className="text-gray-500 text-sm text-center py-6">لا بيانات</p>:(
                  <div className="space-y-2">
                    {locData.map((d,i)=>{const pct=visits.length?Math.round(d.value/visits.length*100):0;return(
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-14 text-right flex-shrink-0">{d.name}</span>
                        <div className="flex-1 h-2.5 bg-gray-700 rounded-full"><motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:i*0.05,duration:0.6}} className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"/></div>
                        <span className="text-amber-400 text-xs font-bold w-6">{d.value}</span>
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {tab==='visitors'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-bold">سجل الزيارات ({visits.length})</h3>
              <button onClick={()=>{try{localStorage.removeItem('souqVisits');}catch{}setVisits([]);}} className="text-xs text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3"/>مسح</button>
            </div>
            {visits.length===0?<div className="p-10 text-center"><Globe className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">لا توجد زيارات</p></div>:(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50"><tr>{['الوقت','الجهاز','الموقع','المستخدم'].map(h=><th key={h} className="text-right py-3 px-4 text-gray-400 font-medium text-xs">{h}</th>)}</tr></thead>
                  <tbody>
                    {visits.slice(0,100).map((v,i)=>(
                      <tr key={i} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-2.5 px-4 text-gray-300 text-xs">{new Date(v.timestamp).toLocaleString('ar-IQ',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}</td>
                        <td className="py-2.5 px-4"><span className={`flex items-center gap-1 text-xs ${v.device==='mobile'?'text-amber-400':v.device==='tablet'?'text-purple-400':'text-blue-400'}`}>{v.device==='mobile'?<Smartphone className="w-3 h-3"/>:v.device==='tablet'?<Tablet className="w-3 h-3"/>:<Monitor className="w-3 h-3"/>}{v.device==='mobile'?'موبايل':v.device==='tablet'?'تابلت':'كمبيوتر'}</span></td>
                        <td className="py-2.5 px-4 text-gray-300 text-xs">{v.location}</td>
                        <td className="py-2.5 px-4 text-gray-300 text-xs">{v.userName||<span className="text-gray-500">زائر</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {tab==='users'&&(
          <div className="space-y-3">
            {storedUsers.length===0?<div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700"><Users className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">لا مستخدمون بعد</p></div>:storedUsers.map(u=>(
              <div key={u.id} className={`bg-gray-800 rounded-2xl p-4 border ${u.isBanned?'border-red-500/30':'border-gray-700'} flex items-center gap-3 flex-wrap`}>
                <img src={u.avatar} alt="" className={`w-12 h-12 rounded-full object-cover border-2 ${u.isBanned?'border-red-500/50':'border-gray-600'} flex-shrink-0`}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-sm">{u.name}</p>
                    {u.isBanned&&<span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">موقوف</span>}
                    {u.role==='owner'&&<span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full flex items-center gap-0.5"><Crown className="w-2.5 h-2.5"/>مالك</span>}
                    {u.role==='admin'&&<span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full flex items-center gap-0.5"><Shield className="w-2.5 h-2.5"/>مشرف</span>}
                    {u.role==='vendor'&&<span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full flex items-center gap-0.5"><UserCheck className="w-2.5 h-2.5"/>تاجر موثق</span>}
                  </div>
                  <p className="text-gray-400 text-xs">{u.email}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">{u.location} • {u.adCount} إعلان • آخر ظهور: {new Date(u.lastSeen).toLocaleDateString('ar-IQ')}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                  {u.role !== 'owner' && (
                    <select 
                      value={u.role || 'user'} 
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
                    >
                      <option value="user">مستخدم عادي</option>
                      <option value="vendor">تاجر موثق</option>
                      <option value="admin">مشرف منصة</option>
                    </select>
                  )}
                  {u.role!=='owner'&&<button onClick={()=>toggleBan(u.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border ${u.isBanned?'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20':'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}>
                    {u.isBanned?<><UserCheck className="w-3.5 h-3.5"/>رفع الإيقاف</>:<><UserX className="w-3.5 h-3.5"/>حظر</>}</button>}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {tab==='content'&&(
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3><span className="text-gray-400 text-xs">{ads.reduce((s,a)=>s+a.views,0)} مشاهدة</span></div>
              {ads.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا إعلانات</div>:ads.map(ad=>(
                <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                    <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع • {ad.views} 👁</p></div>
                  <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h3 className="text-white font-bold">المنتجات ({products.length})</h3><span className="text-gray-400 text-xs">{products.reduce((s,p)=>s+p.views,0)} مشاهدة</span></div>
              {products.length===0?<div className="p-6 text-center text-gray-400 text-sm">لا منتجات</div>:products.map(p=>(
                <div key={p.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50 hover:bg-gray-700/30">
                  <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.governorate} • {formatPrice(p.price)} د.ع • {p.views} 👁 • {p.condition==='new'?'جديد':'مستعمل'}</p></div>
                  <button onClick={()=>onDeleteProduct(p.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='broadcast'&&(
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6 text-amber-500"/></div>
              <div>
                <h2 className="text-white font-bold text-lg">إرسال إشعار للجميع</h2>
                <p className="text-gray-400 text-xs">سيصل هذا الإشعار كرسالة منبثقة في التطبيق لجميع المستخدمين ({storedUsers.length} مستخدم).</p>
              </div>
            </div>

            {broadcastSent ? (
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3"/>
                <h3 className="text-green-400 font-bold text-lg mb-1">تم إرسال الإشعار بنجاح!</h3>
                <p className="text-gray-300 text-sm">سيتمكن المستخدمون من رؤيته عند فتحهم للتطبيق أو تحديثهم للصفحة.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-1.5">عنوان الإشعار</label>
                  <input required value={broadcastTitle} onChange={e=>setBroadcastTitle(e.target.value)}
                    placeholder="مثال: تحديث جديد في سوك بغداد!"
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-1.5">نص الرسالة</label>
                  <textarea required value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} rows={4}
                    placeholder="اكتب رسالتك لجميع المستخدمين هنا..."
                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
                <button type="submit" disabled={isBroadcasting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
                  {isBroadcasting ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Mail className="w-5 h-5"/> إرسال الإشعار الآن</>}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Admin Panel
// ─────────────────────────────────────────────
function AdminPanel({ ads, onDeleteAd, onClose }:{ads:Ad[];onDeleteAd:(id:number)=>void;onClose:()=>void}) {
  return (
    <div className="min-h-screen bg-gray-950 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-red-400"/></div>
            <div><h1 className="text-xl font-bold text-white">لوحة الإدارة</h1><p className="text-gray-400 text-xs">إدارة الإعلانات والمحتوى</p></div></div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700"><h3 className="text-white font-bold">الإعلانات ({ads.length})</h3></div>
          {ads.length===0?<div className="p-8 text-center text-gray-400">لا إعلانات</div>:ads.map(ad=>(
            <div key={ad.id} className="flex items-center gap-3 p-3 border-t border-gray-700/50">
              <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className="w-12 h-12 rounded-lg object-cover"/>
              <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium line-clamp-1">{ad.title}</p>
                <p className="text-xs text-gray-400">{ad.location} • {formatPrice(ad.price)} د.ع</p></div>
              <button onClick={()=>onDeleteAd(ad.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4"/></button>
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
function NotifPanel({ isOpen, onClose, notifs, onNotifClick, onHistoryClick }:{
  isOpen:boolean;
  onClose:()=>void;
  notifs:any[];
  onNotifClick:(senderId:string)=>void;
  onHistoryClick:(itemId: string | number, itemType: string)=>void;
}) {
  const [tab, setTab] = useState<'incoming' | 'history'>('incoming');

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
            <button onClick={onClose} className="p-2 bg-gray-800 rounded-xl text-gray-400"><X className="w-5 h-5"/></button>
          </div>

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

          <div className="space-y-2">
            {activeNotifs.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                {tab === 'incoming' ? 'لا توجد إشعارات واردة حالياً' : 'لم تقم بمشاهدة أي إعلانات بعد'}
              </div>
            ) : (
              activeNotifs.map((n, i) => (
                <div key={n.id || i} 
                  onClick={() => {
                    if (tab === 'incoming') {
                      if (n.senderId) { onNotifClick(n.senderId); onClose(); }
                    } else {
                      if (n.itemId) { onHistoryClick(n.itemId, n.itemType); onClose(); }
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
                        {tab === 'incoming' && n.senderId && (
                          <span className="text-[10px] text-amber-400 font-semibold">👉 عرض الملف</span>
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
              ))
            )}
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Market View
// ─────────────────────────────────────────────
function MarketView({ user, allAds, allProducts, favorites, onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, onTransportClick, onSelectTransportAd, transportLines }:{
  user:User|null; allAds:Ad[]; allProducts:Product[]; favorites:number[];
  onSelectAd:(ad:Ad)=>void; onSelectProduct:(p:Product)=>void;
  onToggleFav:(id:number)=>void; onRequireAuth:()=>void; onSellerClick:(id:string)=>void;
  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
}) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [gov, setGov] = useState('الكل');
  const [sort, setSort] = useState<'recent'|'views'|'price-low'|'price-high'>('recent');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [contentTab, setContentTab] = useState<'ads'|'products'|'profiles'|'transport'|'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [storedUsers, setStoredUsers] = useState<any[]>([]);

  const publishedTransportLines = transportLines.filter(a => a.status === 'published');

  const filteredTransport = publishedTransportLines.filter(a => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (a.regions && a.regions.toLowerCase().includes(term)) ||
           (a.university && a.university.toLowerCase().includes(term)) ||
           (a.note && a.note.toLowerCase().includes(term));
  });

  useEffect(() => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const sellersMap = new Map();
      
      // Seed with local users
      localUsers.forEach((u: any) => {
        sellersMap.set(u.id, {
          id: u.id,
          name: u.name,
          avatar: u.avatar || DEFAULT_AVATAR,
          phone: u.phone,
          location: u.location,
          adCount: u.adCount || 0,
          isVerified: u.role === 'owner' || u.role === 'vendor' || u.isVerified
        });
      });

      // Add sellers from ads
      allAds.forEach(ad => {
        if (ad.postedBy && !sellersMap.has(ad.postedBy)) {
          sellersMap.set(ad.postedBy, {
            id: ad.postedBy,
            name: ad.seller?.name || 'مستخدم',
            avatar: ad.seller?.avatar || DEFAULT_AVATAR,
            phone: ad.phone || '',
            location: ad.location || ad.governorate || '',
            adCount: 1,
            isVerified: ad.seller?.isVerified || false
          });
        } else if (ad.postedBy) {
          const existing = sellersMap.get(ad.postedBy);
          existing.adCount += 1;
          if (ad.phone && !existing.phone) existing.phone = ad.phone;
        }
      });

      // Add sellers from products
      allProducts.forEach(p => {
        if (p.postedBy && !sellersMap.has(p.postedBy)) {
          sellersMap.set(p.postedBy, {
            id: p.postedBy,
            name: p.seller?.name || 'مستخدم',
            avatar: p.seller?.avatar || DEFAULT_AVATAR,
            phone: p.phone || '',
            location: p.governorate || '',
            adCount: 1,
            isVerified: p.seller?.isVerified || false
          });
        } else if (p.postedBy) {
          const existing = sellersMap.get(p.postedBy);
          existing.adCount += 1;
          if (p.phone && !existing.phone) existing.phone = p.phone;
        }
      });

      setStoredUsers(Array.from(sellersMap.values()));
    } catch (e) {
      console.error(e);
    }
  }, [allAds, allProducts]);

  const filteredProfiles = storedUsers.filter(u => {
    const term = search.toLowerCase();
    return !search || 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.phone && u.phone.includes(term));
  });

  const fmt=(v:string)=>v.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');

  const filterAds = allAds.filter(a=>{
    const ms=!search||a.title.toLowerCase().includes(search.toLowerCase())||a.location.toLowerCase().includes(search.toLowerCase());
    const mc=cat==='all'||a.category===cat; const mg=gov==='الكل'||a.governorate===gov;
    const min=priceMin?parseInt(priceMin.replace(/,/g,'')):0, max=priceMax?parseInt(priceMax.replace(/,/g,'')):Infinity, ap=parseInt(a.price)||0;
    return ms&&mc&&mg&&ap>=min&&ap<=max;
  }).sort((a,b)=>sort==='views'?b.views-a.views:sort==='price-low'?parseInt(a.price)-parseInt(b.price):sort==='price-high'?parseInt(b.price)-parseInt(a.price):new Date(b.createdAtISO).getTime()-new Date(a.createdAtISO).getTime());

  const filterProds = allProducts.filter(p=>{
    const ms=!search||p.title.toLowerCase().includes(search.toLowerCase())||p.governorate.toLowerCase().includes(search.toLowerCase());
    const mc=cat==='all'||p.category===cat; const mg=gov==='الكل'||p.governorate===gov;
    const min=priceMin?parseInt(priceMin.replace(/,/g,'')):0, max=priceMax?parseInt(priceMax.replace(/,/g,'')):Infinity, pp=parseInt(p.price)||0;
    return ms&&mc&&mg&&pp>=min&&pp<=max;
  }).sort((a,b)=>sort==='views'?b.views-a.views:sort==='price-low'?parseInt(a.price)-parseInt(b.price):sort==='price-high'?parseInt(b.price)-parseInt(a.price):new Date(b.createdAtISO).getTime()-new Date(a.createdAtISO).getTime());

  const showAds = contentTab==='ads'||contentTab==='all';
  const showProds = contentTab==='products'||contentTab==='all';

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
                  <p className="text-emerald-300 text-xs">رحلات بين مدن العراق</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1 transition-transform"/>
            </button>
          </motion.div>
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
                <select value={gov} onChange={e=>setGov(e.target.value)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none">
                  {IRAQI_GOVERNORATES.map(g=><option key={g}>{g}</option>)}</select>
                <select value={sort} onChange={e=>setSort(e.target.value as any)} className="bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 text-xs outline-none">
                  <option value="recent">الأحدث</option><option value="views">الأكثر مشاهدة</option>
                  <option value="price-low">السعر: من الأقل</option><option value="price-high">السعر: من الأعلى</option>
                </select>
                <button onClick={()=>setShowFilters(!showFilters)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs border ${showFilters?'bg-amber-500 text-black border-amber-500':'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  <SlidersHorizontal className="w-3.5 h-3.5"/><span>فلاتر</span></button>
                <div className="flex bg-gray-700 rounded-xl p-0.5">
                  <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode==='grid'?'bg-amber-500 text-black':'text-gray-400'}`}><Grid className="w-4 h-4"/></button>
                  <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode==='list'?'bg-amber-500 text-black':'text-gray-400'}`}><List className="w-4 h-4"/></button>
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

          {/* Ads */}
          {showAds&&filterAds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><FileText className="w-4 h-4"/>الإعلانات ({filterAds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                {filterAds.map(ad=><AdCard key={ad.id} ad={ad} onSelect={()=>onSelectAd(ad)} isFav={favorites.includes(ad.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(ad.id);}}
                  onSellerClick={e=>{e.stopPropagation();if(ad.postedBy)onSellerClick(ad.postedBy);}}/>)}
              </div>
            </div>
          )}

          {/* Products */}
          {showProds&&filterProds.length>0&&(
            <div className="mb-8">
              {contentTab==='all'&&<div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-gray-700"/><span className="text-gray-400 text-sm font-medium flex items-center gap-1.5"><ShoppingBag className="w-4 h-4"/>المنتجات ({filterProds.length})</span><div className="h-px flex-1 bg-gray-700"/></div>}
              <div className={viewMode==='grid'?'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4':'space-y-3'}>
                {filterProds.map(p=><ProductCard key={p.id} product={p} onSelect={()=>onSelectProduct(p)} isFav={favorites.includes(p.id)}
                  onFav={e=>{e.stopPropagation();if(!user){onRequireAuth();return;}onToggleFav(p.id);}}
                  onSellerClick={e=>{e.stopPropagation();onSellerClick(p.postedBy);}}/>)}
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
                  {filteredTransport.map(ad => (
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
                              href={getWhatsAppLink(ad.phone, 'transport', {
                                title: ad.type === 'offer' ? 'خط متوفر' : 'طلب خط',
                                location: ad.regions,
                                university: ad.university,
                                time: ad.shift
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> واتساب
                            </motion.a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profiles */}
          {contentTab === 'profiles' && (
            <div className="mb-8">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد حسابات مطابقة</h3>
                  <p className="text-gray-400 text-sm">جرب البحث باسم آخر أو رقم هاتف آخر</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProfiles.map(profile => (
                    <motion.div
                      key={profile.id}
                      whileHover={{ y: -4 }}
                      onClick={() => onSellerClick(profile.id)}
                      className="bg-gray-800 rounded-2xl p-4 border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-white font-bold text-sm truncate">{profile.name}</h3>
                          {profile.isVerified && (
                            <span className="text-blue-500 flex-shrink-0">
                              <Shield className="w-3.5 h-3.5 fill-current text-blue-500" />
                            </span>
                          )}
                        </div>
                        {profile.phone && (
                          <p className="text-gray-400 text-xs flex items-center gap-1 mb-0.5">
                            <PhoneIcon className="w-3 h-3 text-emerald-400" />
                            <span className="font-semibold">{profile.phone}</span>
                          </p>
                        )}
                        <p className="text-gray-500 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{profile.location || 'العراق'}</span>
                          <span className="mx-1">•</span>
                          <span className="text-amber-400 font-medium">{profile.adCount} إعلان</span>
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty */}
          {contentTab !== 'profiles' && ((showAds&&filterAds.length===0)||(showProds&&filterProds.length===0))&&filterAds.length===0&&filterProds.length===0&&(
            <div className="text-center py-20"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3><p className="text-gray-400 text-sm">جرب تغيير الفلاتر أو كلمة البحث</p></div>
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

interface TransportAd {
  id: number;
  type: 'offer' | 'request'; // متوفر خط أو أبحث عن خط
  university: string;
  regions: string;
  price: string;
  seats: number;
  shift: string;
  vehicleType: string;
  targetAudience: string;
  phone: string;
  note: string;
  postedBy: string;
  sellerName: string;
  sellerAvatar: string;
  createdAt: string;
  status: 'pending' | 'published' | 'matched' | 'archived' | 'deleted_soft';
  completion_reason?: 'found_line' | 'line_full' | 'closed_by_owner' | null;
  completedAt?: string;
  views: number;
  interest: number;
  whatsappClicks?: number;
}

function TransportFormModal({ onClose, onSubmit, user, lines = [] }: {
  onClose: () => void;
  onSubmit: (ad: TransportAd) => void;
  user: { id: string; name: string; avatar: string; phone: string };
  lines?: TransportAd[];
}) {
  const [type, setType] = useState<'offer'|'request'>('offer');
  
  const dynamicFormUniversities = Array.from(new Set([
    ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
    ...lines.filter(l => l.status === 'published').map(l => l.university)
  ])).filter(Boolean);

  const finalFormUniversities = [...dynamicFormUniversities, 'أخرى'];

  const [university, setUniversity] = useState(finalFormUniversities[0] || UNIVERSITIES[1]);
  const [customUniversity, setCustomUniversity] = useState('');
  const [regions, setRegions] = useState('');
  const [price, setPrice] = useState('');
  const [seats, setSeats] = useState('4');
  const [shift, setShift] = useState('صباحي');
  const [vehicleType, setVehicleType] = useState('خصوصي');
  const [targetAudience, setTargetAudience] = useState('مختلط');
  const [phone, setPhone] = useState(user.phone || '');
  const [note, setNote] = useState('');

  const formatPriceInput = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('en-US');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUniversity = university === 'أخرى' ? customUniversity.trim() : university;
    if (!finalUniversity || !regions || !phone) return;
    onSubmit({
      id: Date.now(),
      type, university: finalUniversity, regions, price, seats: type==='offer'?parseInt(seats)||4:0,
      shift, vehicleType, targetAudience, phone, note,
      postedBy: user.id, sellerName: user.name, sellerAvatar: user.avatar,
      createdAt: new Date().toISOString(),
      status: 'published',
      views: 0,
      interest: 0,
      whatsappClicks: 0
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
              <h2 className="text-white font-bold text-lg">إعلان خطوط الجامعات</h2>
              <p className="text-emerald-100 text-xs">طالب أم صاحب خط؟</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 bg-white/20 rounded-xl text-white"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="flex bg-gray-800 p-1 rounded-xl">
            <button type="button" onClick={()=>setType('offer')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type==='offer'?'bg-emerald-500 text-white':'text-gray-400 hover:text-white'}`}>صاحب خط (أوفر مقاعد)</button>
            <button type="button" onClick={()=>setType('request')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type==='request'?'bg-emerald-500 text-white':'text-gray-400 hover:text-white'}`}>طالب (أبحث عن خط)</button>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">الجامعة / الكلية</label>
            <select value={university} onChange={e=>setUniversity(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm mb-2">
              {finalFormUniversities.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {university === 'أخرى' && (
              <input value={customUniversity} onChange={e=>setCustomUniversity(e.target.value)} placeholder="اكتب اسم الجامعة أو الكلية هنا" required
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
              <select value={shift} onChange={e=>setShift(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm">
                <option>صباحي</option><option>مسائي</option><option>صباحي ومسائي</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">المقاعد (لأصحاب الخطوط)</label>
              <input type="number" min="1" max="50" value={seats} onChange={e=>setSeats(e.target.value)} disabled={type==='request'}
                className="w-full bg-gray-800 text-white disabled:opacity-50 rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نوع المركبة</label>
              <select value={vehicleType} onChange={e=>setVehicleType(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl py-3 px-3 border border-gray-700 focus:border-emerald-400 outline-none text-sm">
                <option>خصوصي</option><option>أجرة</option><option>فان 11 راكب</option><option>كوستر</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">الفئة</label>
              <select value={targetAudience} onChange={e=>setTargetAudience(e.target.value)}
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

function TransportView({ user, onBack, onCreateAd, onGoToMyLines, onSelectAd, lines, onPost, onUpdateStatus }: {
  user: { id: string; name: string; avatar: string; phone: string } | null;
  onBack: () => void;
  onCreateAd: () => void;
  onGoToMyLines?: () => void;
  onSelectAd?: (ad: TransportAd) => void;
  lines: TransportAd[];
  onPost: (ad: TransportAd) => void;
  onUpdateStatus: (id: number, status: TransportAd['status'], reason?: TransportAd['completion_reason']) => void;
}) {
  const [filterUniversity, setFilterUniversity] = useState('الكل');
  const [filterType, setFilterType] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handlePost = (ad: TransportAd) => {
    onPost(ad);
    setShowForm(false);
  };

  const filtered = lines.filter(a => {
    if (a.status !== 'published') return false;
    if (filterUniversity !== 'الكل' && a.university !== filterUniversity) return false;
    if (filterType !== 'الكل' && a.type !== (filterType === 'خطوط متوفرة' ? 'offer' : 'طلبات خطوط')) return false;
    if (searchQuery) {
      return a.regions.includes(searchQuery) || a.university.includes(searchQuery) || (a.note && a.note.includes(searchQuery));
    }
    return true;
  });

  const dynamicUniversities = Array.from(new Set([
    'الكل',
    ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
    ...lines.filter(l => l.status === 'published').map(l => l.university)
  ])).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 pt-6 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_,i)=><div key={i} className="absolute border border-white/20 rounded-full" style={{width:`${(i+1)*80}px`,height:`${(i+1)*80}px`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>)}
        </div>
        <div className="container mx-auto max-w-2xl relative">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5"/>
            </button>
            <div>
              <h1 className="text-white font-bold text-xl">🎓 خطوط الجامعات</h1>
              <p className="text-emerald-200 text-sm">أسرع وأأمن طريق لدوامك</p>
            </div>
          </div>
          
          {/* Smart Search & Filters */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300"/>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="ابحث عن منطقة، جامعة..."
                className="w-full bg-gray-900/50 text-white placeholder-emerald-200/50 rounded-xl py-3 pr-10 pl-3 border border-emerald-500/30 focus:border-emerald-400 outline-none text-sm"/>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-emerald-300 text-xs mb-1 block">الجامعة</label>
                <select value={filterUniversity} onChange={e=>setFilterUniversity(e.target.value)}
                  className="w-full bg-gray-900/50 text-white border border-emerald-500/30 rounded-xl py-2.5 px-3 outline-none text-sm backdrop-blur [color-scheme:dark]">
                  {dynamicUniversities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-emerald-300 text-xs mb-1 block">نوع الإعلان</label>
                <select value={filterType} onChange={e=>setFilterType(e.target.value)}
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
      <div className="container mx-auto max-w-2xl px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚐</div>
            <h3 className="text-white font-bold text-lg mb-2">لا توجد إعلانات حالياً</h3>
            <p className="text-gray-400 text-sm mb-6">كن أول من يضيف إعلاناً في هذا القسم</p>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{if(!user){onCreateAd();return;}setShowForm(true);}}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl">
              إضافة إعلان الآن
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">تم العثور على <span className="text-emerald-400 font-bold">{filtered.length}</span> إعلان</p>
            {filtered.map(ad=>(
              <motion.div key={ad.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                onClick={() => onSelectAd?.(ad)}
                className={`bg-gray-800 rounded-2xl border transition-all overflow-hidden relative cursor-pointer hover:border-emerald-500/60 ${ad.type === 'offer' ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
                
                {/* Type Badge */}
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold ${ad.type === 'offer' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>
                  {ad.type === 'offer' ? 'متوفر خط' : 'أبحث عن خط'}
                </div>

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
                      <img src={ad.sellerAvatar||'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-600"/>
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
                      <motion.a href={getWhatsAppLink(ad.phone, 'transport', { title: ad.type==='offer'?'خط متوفر':'طلب خط', location: ad.regions, university: ad.university, time: ad.shift })} target="_blank" rel="noopener noreferrer"
                        whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-green-500/20">
                        <MessageSquare className="w-3.5 h-3.5"/> واتساب
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
type AppView = 'home'|'profile'|'admin'|'owner'|'seller'|'transport';

export default function App() {
  const [user, setUser] = useState<User|null>(() => {
    try {
      const stored = localStorage.getItem('souqUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [view, setView] = useState<AppView>('home');
  const [bottomNavActive, setBottomNavActive] = useState('home');
  const [selectedSellerId, setSelectedSellerId] = useState<string|null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad|null>(null);
  const [editingProduct, setEditingProduct] = useState<Product|null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad|null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product|null>(null);
  const [selectedTransportAd, setSelectedTransportAd] = useState<TransportAd|null>(null);
  const [toast, setToast] = useState<{msg:string;type:string;visible:boolean}>({msg:'',type:'info',visible:false});
  const [showCreateTransport, setShowCreateTransport] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<string | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<{ src: string; title: string } | null>(null);
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; title: string; url: string; image?: string; price?: string }>({ isOpen: false, title: '', url: '' });
  const handleOpenShare = (data: { title: string; url: string; image?: string; price?: string }) => setShareModalData({ isOpen: true, ...data });
  const playSound = useSound();

  // Default demo ads to show for all users
  const getDefaultAds = (): Ad[] => [
    { id: 1, title: 'هاتف ايفون 14 برو', category: 'هواتف', governorate: 'بغداد', price: '850000', description: 'هاتف ايفون 14 برو جديد، لم يستخدم', images: ['https://images.unsplash.com/photo-1591290619762-bcc52fb0a910?w=500&h=500&fit=crop'], location: 'بغداد', phone: '07700000000', time: 'الآن', status: 'نشط', type: 'sale', adCount: 1, soldCount: 0, responseRate: 100, avgResponseTime: 'ساعة', postedBy: 'demo-user-1', createdAtISO: new Date(Date.now() - 86400000).toISOString(), views: 250, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'بغداد' } },
    { id: 2, title: 'عقار في الكرادة - منزل 3 غرف', category: 'عقارات', governorate: 'بغداد', price: '250000000', description: 'منزل فاخر في موقع ممتاز بالكرادة', images: ['https://images.unsplash.com/photo-1575373342425-76569f2865d2?w=500&h=500&fit=crop'], location: 'بغداد', phone: '07700000000', time: 'الآن', status: 'نشط', type: 'sale', adCount: 1, soldCount: 0, responseRate: 100, avgResponseTime: 'ساعة', postedBy: 'demo-user-2', createdAtISO: new Date(Date.now() - 172800000).toISOString(), views: 420, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'بغداد' } },
    { id: 3, title: 'سيارة BMW 520 موديل 2022', category: 'سيارات', governorate: 'بغداد', price: '75000000', description: 'سيارة جديدة بحالة ممتازة، مع ضمان كامل', images: ['https://images.unsplash.com/photo-1552519507-da3effff991c?w=500&h=500&fit=crop'], location: 'بغداد', phone: '07700000000', time: 'الآن', status: 'نشط', type: 'sale', adCount: 1, soldCount: 0, responseRate: 100, avgResponseTime: 'ساعة', postedBy: 'demo-user-3', createdAtISO: new Date(Date.now() - 259200000).toISOString(), views: 580, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'بغداد' } },
    { id: 4, title: 'خدمة تدريس خصوصي - رياضيات وإنجليزي', category: 'خدمات', governorate: 'بغداد', price: '50000', description: 'معلم ذو خبرة يقدم دروس خصوصية', images: ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=500&fit=crop'], location: 'بغداد', phone: '07700000000', time: 'الآن', status: 'نشط', type: 'service', adCount: 1, soldCount: 0, responseRate: 100, avgResponseTime: 'ساعة', postedBy: 'demo-user-4', createdAtISO: new Date(Date.now() - 345600000).toISOString(), views: 180, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'بغداد' } },
    { id: 5, title: 'لابتوب Dell XPS 13 - شبه جديد', category: 'إلكترونيات', governorate: 'البصرة', price: '1200000', description: 'لابتوب عالي المواصفات، استخدام خفيف فقط', images: ['https://images.unsplash.com/photo-1588872657839-cd2f3e5614f0?w=500&h=500&fit=crop'], location: 'البصرة', phone: '07700000000', time: 'الآن', status: 'نشط', type: 'sale', adCount: 1, soldCount: 0, responseRate: 100, avgResponseTime: 'ساعة', postedBy: 'demo-user-5', createdAtISO: new Date(Date.now() - 432000000).toISOString(), views: 320, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'البصرة' } },
  ];

  const getDefaultProducts = (): Product[] => [
    { id: 1, title: 'معطف شتوي فخم', category: 'ملابس', governorate: 'بغداد', price: '150000', description: 'معطف برند عالمي، أصلي 100%', images: ['https://images.unsplash.com/photo-1539533057440-7814baea1002?w=500&h=500&fit=crop'], postedBy: 'demo-seller-1', createdAtISO: new Date(Date.now() - 86400000).toISOString(), views: 180, phone: '07700000000', condition: 'new', stock: 10, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'بغداد' } },
    { id: 2, title: 'أثاث غرفة نوم كامل', category: 'أثاث', governorate: 'البصرة', price: '2500000', description: 'مجموعة أثاث فاخرة - سرير + دولاب + تسريحة', images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop'], postedBy: 'demo-seller-2', createdAtISO: new Date(Date.now() - 172800000).toISOString(), views: 290, phone: '07700000000', condition: 'new', stock: 5, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'البصرة' } },
    { id: 3, title: 'دراجة هوائية ماونتن بايك', category: 'دراجات', governorate: 'أربيل', price: '500000', description: 'دراجة رياضية احترافية', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd58?w=500&h=500&fit=crop'], postedBy: 'demo-seller-3', createdAtISO: new Date(Date.now() - 259200000).toISOString(), views: 150, phone: '07700000000', condition: 'used', stock: 1, seller: { name: 'Demo Seller', avatar: '', isVerified: true, rating: 5, joinedDate: '2023', location: 'أربيل' } },
  ];

  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [allTransportAds, setAllTransportAds] = useState<TransportAd[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<number[]>(()=>{
    try{return JSON.parse(localStorage.getItem('souqFavs')||'[]');}catch{return[];}
  });

  // ── Fetch ads & products from Supabase ─────────────────────────
  const fetchAds = useCallback(async () => {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('is_demo', false)
      .order('created_at', { ascending: false });
    if (error) { console.error('Error fetching ads:', error); return; }
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
      }));

      // Map transport ads
      const transportRows = data.filter((row: any) => row.category === 'transport');
      const transportMapped: TransportAd[] = transportRows.map((row: any) => {
        let extra = {
          shift: 'صباحي',
          seats: 4,
          vehicleType: 'خصوصي',
          targetAudience: 'مختلط',
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
          completion_reason: extra.completion_reason
        };
      });

      setAllAds(normalMapped.filter(a => a.status === 'active'));
      setAllTransportAds(transportMapped);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('Error fetching products:', error); return; }
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
      }));
      setAllProducts(mapped);
    }
  }, []);


  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('category', 'notification')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { console.error('Error fetching notifications:', error); return; }
    if (data) {
      const mapped = data.map((row: any) => {
        let extra = {
          message: '',
          type: 'view',
          senderId: '',
          senderName: 'مستخدم',
          senderPhone: '',
          itemTitle: '',
          itemType: 'ad',
          itemId: '',
          duration: 0,
          targetType: 'owner'
        };
        try {
          if (row.description) {
            extra = { ...extra, ...JSON.parse(row.description) };
          }
        } catch (e) {
          extra.message = row.description || '';
        }
        return {
          id: row.id,
          type: extra.type,
          title: row.title,
          message: extra.message,
          time: row.created_at,
          senderId: extra.senderId,
          senderName: extra.senderName,
          senderPhone: extra.senderPhone,
          itemTitle: extra.itemTitle,
          itemType: extra.itemType,
          itemId: extra.itemId,
          duration: extra.duration,
          targetType: extra.targetType
        };
      });
      setNotifications(mapped);
    }
  }, [user]);

  useEffect(() => {
    let iv: any;
    if (user) {
      fetchNotifications();
      iv = setInterval(fetchNotifications, 10000);
    } else {
      setNotifications([]);
    }
    return () => {
      if (iv) clearInterval(iv);
    };
  }, [user, fetchNotifications]);

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

  useEffect(()=>{localStorage.setItem('souqFavs',JSON.stringify(favorites));},[favorites]);

  useEffect(() => {
    if (['home', 'profile', 'transport'].includes(view)) {
      setBottomNavActive(view);
    }
  }, [view]);

  useEffect(() => {
    fetchAds();
    fetchProducts();
  }, [fetchAds, fetchProducts]);

  useEffect(()=>{
    if(user){const mc=allAds.filter(a=>a.postedBy===user.id).length+allProducts.filter(p=>p.postedBy===user.id).length;saveStoredUser(user,mc);}
  },[user]);

  const showToast = useCallback((msg:string,type:string)=>{
    setToast({msg,type,visible:true}); playSound(type==='success'?'success':'info');
    setTimeout(()=>setToast(t=>({...t,visible:false})),4000);
  },[]);

  const handleLogin = (u:User)=>{
    setUser(u); setShowAuth(false); showToast(`مرحباً ${u.name}! 🎉`,'success');
    if(!localStorage.getItem('souqOnboarded'))setShowOnboarding(true);
    recordVisit(u);
  };
  const handleLogout = ()=>{localStorage.removeItem('souqUser');setUser(null);setView('home');showToast('تم تسجيل الخروج','info');};
  const handleUpdateUser = (u:User)=>{setUser(u);localStorage.setItem('souqUser',JSON.stringify(u));saveStoredUser(u,allAds.filter(a=>a.postedBy===u.id).length);showToast('تم حفظ الملف الشخصي ✅','success');};
  const handleToggleFav = (id:number)=>{setFavorites(prev=>{const f=prev.includes(id);showToast(f?'تمت الإزالة من المفضلة':'تمت الإضافة للمفضلة','success');return f?prev.filter(x=>x!==id):[...prev,id];});};
  const requireAuth = ()=>setShowAuth(true);

  const handleAddOrEditAd = async (ad: Ad) => {
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
    const rowData = {
      seller_id: user?.id || ad.postedBy || '',
      title: ad.type === 'offer' ? `أوفر خط إلى ${ad.university}` : `أبحث عن خط إلى ${ad.university}`,
      description: JSON.stringify({
        shift: ad.shift,
        seats: ad.seats,
        vehicleType: ad.vehicleType,
        targetAudience: ad.targetAudience,
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

  const handleSellerClick = (sellerId:string)=>{if(sellerId){setSelectedSellerId(sellerId);setView('seller');}};

  const myAds = allAds.filter(a=>a.postedBy===user?.id);
  const myProducts = allProducts.filter(p=>p.postedBy===user?.id);
  const isAdmin = user?.role==='admin';
  const isOwner = user?.role==='owner';

  return (
    <div className="dark min-h-screen bg-gray-950 pb-20 lg:pb-0">
      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} onClose={()=>setToast(t=>({...t,visible:false}))}/>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button onClick={()=>setView('home')} className="flex items-center gap-2"><Logo small/><span className="hidden sm:block text-white font-bold text-lg">سوك بغداد</span></button>
            <div className="hidden md:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input placeholder="ابحث في سوك بغداد..." onClick={()=>setView('home')} readOnly className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-2 pr-9 pl-4 border border-gray-700 outline-none text-sm cursor-pointer"/></div>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              {user?(
                <>
                  <button onClick={()=>setShowNotifs(true)} className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative">
                    <Bell className="w-5 h-5"/>
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {isOwner&&<button onClick={()=>setView('owner')} className={`p-2 rounded-xl text-amber-400 hover:bg-amber-500/20 ${view==='owner'?'bg-amber-500/20':''}`}><Crown className="w-5 h-5"/></button>}
                  {isAdmin&&!isOwner&&<button onClick={()=>setView('admin')} className={`p-2 rounded-xl text-red-400 hover:bg-red-500/20 ${view==='admin'?'bg-red-500/20':''}`}><Settings className="w-5 h-5"/></button>}
                  <button onClick={()=>{setShowCreateProduct(true);setEditingProduct(null);}}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700">
                    <ShoppingBag className="w-4 h-4"/> منتج</button>
                  <button onClick={()=>{setShowCreateAd(true);setEditingAd(null);}}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-sm">
                    <Plus className="w-4 h-4"/> إعلان</button>
                  <button onClick={()=>setView('profile')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}>
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-600"/>
                    <span className="max-w-20 truncate">{user.name}</span>{isOwner&&<Crown className="w-3 h-3 text-amber-400"/>}</button>
                  <button onClick={handleLogout} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"><LogOut className="w-5 h-5"/></button>
                </>
              ):(
                <>
                  <button onClick={requireAuth} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-sm"><Plus className="w-4 h-4"/> رفع إعلان</button>
                  <button onClick={()=>setShowAuth(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700"><LogIn className="w-4 h-4"/> تسجيل الدخول</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <button onClick={()=>setShowNotifs(true)} className="p-2 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative">
                <Bell className="w-5 h-5"/>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button onClick={()=>setShowMobileMenu(true)} className="p-2 rounded-xl bg-gray-800 text-white"><Menu className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowMobileMenu(false)}/>
          <motion.div initial={{x:300}} animate={{x:0}} exit={{x:300}} className="absolute right-0 top-0 bottom-0 w-72 bg-gray-900 p-5 pb-24 overflow-y-auto border-l border-gray-700">
            <div className="flex items-center justify-between mb-6"><Logo small/><button onClick={()=>setShowMobileMenu(false)} className="p-2 bg-gray-800 rounded-xl text-white"><X className="w-5 h-5"/></button></div>
            {user?(
              <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"/>
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
              <button onClick={()=>{setView('profile');setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-white text-sm"><User className="w-5 h-5 text-gray-400"/> ملفي الشخصي</button>
              {isOwner&&<button onClick={()=>{setView('owner');setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-amber-400 text-sm"><Crown className="w-5 h-5"/> داشبورت المالك</button>}
              {isAdmin&&!isOwner&&<button onClick={()=>{setView('admin');setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-red-400 text-sm"><Settings className="w-5 h-5"/> لوحة الإدارة</button>}
              <button onClick={()=>{handleLogout();setShowMobileMenu(false);}} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-red-400 text-sm"><LogOut className="w-5 h-5"/> تسجيل الخروج</button>
            </div>}
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      {/* Main */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {view==='home'&&<motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <MarketView user={user} allAds={allAds} allProducts={allProducts} favorites={favorites} onSelectAd={setSelectedAd} onSelectProduct={setSelectedProduct} onToggleFav={handleToggleFav} onRequireAuth={requireAuth} onSellerClick={handleSellerClick} onTransportClick={()=>{setView('transport');setBottomNavActive('transport');}} onSelectTransportAd={setSelectedTransportAd} transportLines={allTransportAds}/></motion.div>}
          {view==='profile'&&user&&<motion.div key="profile" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ProfileView user={user} myAds={myAds} myProducts={myProducts} onDeleteAd={handleDeleteAd} onEditAd={ad=>{setEditingAd(ad);setShowCreateAd(true);}} onDeleteProduct={handleDeleteProduct} onEditProduct={p=>{setEditingProduct(p);setShowCreateProduct(true);}} onUpdateUser={handleUpdateUser} onAddAd={()=>{setEditingAd(null);setShowCreateAd(true);}} onAddProduct={()=>{setEditingProduct(null);setShowCreateProduct(true);}} transportLines={allTransportAds} onUpdateTransportStatus={handleUpdateTransportStatus} onDeleteTransportAd={handleDeleteTransportAd}/></motion.div>}
          {view==='seller'&&selectedSellerId&&<motion.div key="seller" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <SellerPublicPage sellerId={selectedSellerId} allAds={allAds} allProducts={allProducts} onBack={()=>setView('home')} onSelectAd={setSelectedAd} onSelectProduct={setSelectedProduct} favorites={favorites} onToggleFav={handleToggleFav} user={user} onAuthRequired={requireAuth}/></motion.div>}
          {view==='transport'&&<motion.div key="transport" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <TransportView user={user} onBack={()=>setView('home')} onCreateAd={()=>{if(!user){requireAuth();return;}setShowCreateTransport(true);}} onGoToMyLines={()=>{setView('profile'); setTimeout(()=>window.dispatchEvent(new CustomEvent('switch-to-lines-tab')), 100);}} onSelectAd={setSelectedTransportAd} lines={allTransportAds} onPost={handlePostTransportAd} onUpdateStatus={handleUpdateTransportStatus}/></motion.div>}
          {view==='admin'&&isAdmin&&!isOwner&&<motion.div key="admin" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <AdminPanel ads={allAds} onDeleteAd={handleDeleteAd} onClose={()=>setView('home')}/></motion.div>}
          {view==='owner'&&isOwner&&<motion.div key="owner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <OwnerDashboard ads={allAds} products={allProducts} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onClose={()=>setView('home')}/></motion.div>}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3"><span className="text-2xl">🇮🇶</span><span className="text-lg font-bold text-white">سوك بغداد</span></div>
          <p className="text-gray-500 text-xs">© 2025 سوك بغداد — السوق الرقمي العراقي</p>
          <div className="flex items-center justify-center gap-3 mt-3 text-gray-500 text-xs">
            {['الشروط والأحكام','سياسة الخصوصية','تواصل معنا','من نحن'].map(l=><button key={l} onClick={()=>setActiveDocTab(l)} className="hover:text-amber-400">{l}</button>)}</div>
        </div>
      </footer>

      {/* Bottom Navigation Bar - Fixed Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
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

          {/* إضافة إعلان */}
          <button
            onClick={() => { setBottomNavActive('create-ad'); setShowCreateAd(true); }}
            className="flex flex-col items-center justify-center flex-1 py-2"
          >
            <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full -mt-6 shadow-lg shadow-amber-500/30">
              <Plus className="w-6 h-6 text-black" />
            </div>
            <span className="text-[10px] mt-1 font-medium text-amber-400">إعلان</span>
          </button>

          {/* إضافة منتج */}
          <button
            onClick={() => { setBottomNavActive('create-product'); setShowCreateProduct(true); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'create-product' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${bottomNavActive === 'create-product' ? 'bg-blue-500/20' : ''}`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-1 font-medium">منتج</span>
          </button>

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
        </div>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showOnboarding&&<OnboardingModal onClose={()=>{setShowOnboarding(false);localStorage.setItem('souqOnboarded','1');}}/>}
        {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={handleLogin}/>}
        {selectedAd&&<AdDetailModal ad={selectedAd} onClose={()=>setSelectedAd(null)} isFav={favorites.includes(selectedAd.id)} onFav={()=>handleToggleFav(selectedAd.id)} user={user} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedAd(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedAd.id, selectedAd.title, selectedAd.postedBy || '', 'ad', sec)} onImageZoom={(src, title) => setActiveLightbox({ src, title })} onShare={handleOpenShare}/>}
        {selectedProduct&&<ProductDetailModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} isFav={favorites.includes(selectedProduct.id)} onFav={()=>handleToggleFav(selectedProduct.id)} user={user} onAuthRequired={requireAuth} onSellerClick={id=>{setSelectedProduct(null);handleSellerClick(id);}} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedProduct.id, selectedProduct.title, selectedProduct.postedBy || '', 'product', sec)} onImageZoom={(src, title) => setActiveLightbox({ src, title })} onShare={handleOpenShare}/>}
        {selectedTransportAd&&<TransportDetailModal ad={selectedTransportAd} onClose={()=>setSelectedTransportAd(null)} user={user} onAuthRequired={requireAuth} onViewDurationLogged={(sec) => handleViewDurationLogged(selectedTransportAd.id, selectedTransportAd.type==='offer'?'خط متوفر':'طلب خط', selectedTransportAd.postedBy || '', 'transport', sec)}/>}
        {showCreateAd&&user&&<AdFormModal isOpen={showCreateAd} onClose={()=>{setShowCreateAd(false);setEditingAd(null);}} onSubmit={handleAddOrEditAd} user={user} editAd={editingAd}/>}
        {showCreateProduct&&user&&<ProductFormModal isOpen={showCreateProduct} onClose={()=>{setShowCreateProduct(false);setEditingProduct(null);}} onSubmit={handleAddOrEditProduct} user={user} editProduct={editingProduct}/>}
        {showNotifs&&<NotifPanel isOpen={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifications} onNotifClick={handleSellerClick} onHistoryClick={handleHistoryClick}/>}
        {activeDocTab&&<InfoDocsModal activeTab={activeDocTab} onClose={()=>setActiveDocTab(null)}/>}
        {activeLightbox&&<ImageLightboxModal src={activeLightbox.src} title={activeLightbox.title} onClose={()=>setActiveLightbox(null)}/>}
        <ShareModal isOpen={shareModalData.isOpen} onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))} title={shareModalData.title} url={shareModalData.url} image={shareModalData.image} price={shareModalData.price} />
      </AnimatePresence>
    </div>
  );
}
