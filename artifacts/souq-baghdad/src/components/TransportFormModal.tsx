// ===========================================
// مسؤولية هذا الملف:
// نافذة نشر خط نقل جديد أو تعديله (Transport Form Modal).
//
// يتعامل مع Supabase مباشرة:
// - إضافة أو تحديث الخط في جدول 'ads' بـ category = 'transport'.
//
// استعلام Supabase:
// INSERT أو UPDATE عند الضغط على زر النشر/الحفظ.
//
// آمن للتعديل:
// نعم، لكن تأكد من الحفاظ على هيكل JSON في حقل description.
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

import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

export function TransportFormModal({ onClose, onSubmit, user, lines = [], editAd, cost = 1 }: {
  onClose: () => void;
  onSubmit: (ad: TransportAd) => void;
  user: { id: string; name: string; avatar: string; phone: string; points?: number; role?: string };
  lines?: TransportAd[];
  editAd?: TransportAd | null;
  cost?: number;
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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}}
        className="relative bg-gradient-to-b from-[#051c14] via-[#03110d] to-[#010a08] rounded-3xl w-full max-w-md border border-emerald-900/30 z-10 overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-hide">
        
        <div className="bg-gray-950/25 border-b border-emerald-950/40 p-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Car className="w-5 h-5 text-emerald-400"/>
            </div>
            <div>
              <h2 className="text-white font-black text-base">{categoryType==='employee'?'خطوط الموظفين والشركات 👔':'خطوط الجامعات والمدارس 🚐'}</h2>
              <p className="text-emerald-500/80 text-[10px] font-bold">{categoryType==='employee'?'انشر عرض مقاعد أو طلب خط للموظفين':'انشر عرض مقاعد أو طلب خط للطلاب'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2.5 bg-gray-950/40 border border-gray-900 hover:border-gray-850 rounded-xl text-gray-400 hover:text-white transition-all duration-300" title="إغلاق" aria-label="إغلاق">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" dir="rtl">
          
          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">نوع الإعلان</label>
            <div className="flex bg-gray-950/40 p-1.5 rounded-2xl border border-gray-900/60 gap-2">
              <button type="button" onClick={()=>setType('offer')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='offer'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>صاحب خط (أوفر مقاعد)</button>
              <button type="button" onClick={()=>setType('request')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='request'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>أبحث عن خط</button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">فئة الخط والجمهور المستهدف</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => { setCategoryType('student'); setUniversity(UNIVERSITIES[1]); }}
                className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-300 ${categoryType==='student'?'bg-emerald-500 text-white shadow-lg shadow-emerald-500/15 border-transparent':'bg-gray-950/30 text-gray-400 border border-gray-900/60 hover:text-white'}`}>
                🎓 خط طلاب
              </button>
              <button type="button" onClick={() => { setCategoryType('employee'); setUniversity(EMPLOYEE_WORKPLACES[1]); }}
                className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-300 ${categoryType==='employee'?'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border-transparent':'bg-gray-950/30 text-gray-400 border border-gray-900/60 hover:text-white'}`}>
                👔 خط موظفين
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">{categoryType==='employee'?'مكان العمل (دوائر / شركات)':'الجامعة / الكلية'}</label>
            <select value={university} onChange={e=>setUniversity(e.target.value)} title="الجامعة" aria-label="الجامعة"
              className="w-full bg-gray-950/40 text-white rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm mb-2 font-bold transition-all duration-300">
              {finalFormUniversities.map(c=><option key={c} value={c} className="bg-gray-950 text-white">{c}</option>)}
            </select>
            {university === 'أخرى' && (
              <input value={customUniversity} onChange={e=>setCustomUniversity(e.target.value)} placeholder={categoryType==='employee'?'اكتب اسم الدائرة أو مكان العمل هنا':'اكتب اسم الجامعة أو الكلية هنا'} required
                className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold transition-all duration-300"/>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">مناطق المرور ومسار الخط</label>
            <input value={regions} onChange={e=>setRegions(e.target.value)} placeholder="مثال: السيدية، المنصور، الكرادة" required
              className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold transition-all duration-300"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">وقت الدوام</label>
              <input type="text" list="shiftOptions" value={shift} onChange={e=>setShift(e.target.value)} title="نوع الدوام أو الوقت" aria-label="نوع الدوام" placeholder="مثال: من 8 إلى 2 ظهراً"
                className="w-full bg-gray-950/40 text-white rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold transition-all duration-300" />
              <datalist id="shiftOptions">
                <option value="صباحي" />
                <option value="مسائي" />
                <option value="صباحي ومسائي" />
                <option value="من 8 صباحاً إلى 2 ظهراً" />
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">المقاعد المتاحة</label>
              <input type="number" min="1" max="50" value={seats} onChange={e=>setSeats(e.target.value)} disabled={type==='request'} title="عدد المقاعد" aria-label="عدد المقاعد" placeholder="عدد المقاعد"
                className="w-full bg-gray-950/40 text-white disabled:opacity-40 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-bold transition-all duration-300"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">نوع المركبة</label>
              <select value={vehicleType} onChange={e=>setVehicleType(e.target.value)} title="نوع المركبة" aria-label="نوع المركبة"
                className="w-full bg-gray-950/40 text-white rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-bold transition-all duration-300">
                <option className="bg-gray-950 text-white">خصوصي</option>
                <option className="bg-gray-950 text-white">أجرة</option>
                <option className="bg-gray-950 text-white">فان 11 راكب</option>
                <option className="bg-gray-950 text-white">كوستر</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">الفئة المستهدفة</label>
              <select value={targetAudience} onChange={e=>setTargetAudience(e.target.value)} title="الفئة المستهدفة" aria-label="الفئة المستهدفة"
                className="w-full bg-gray-950/40 text-white rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-bold transition-all duration-300">
                <option className="bg-gray-950 text-white">مختلط</option>
                <option className="bg-gray-950 text-white">بنات فقط</option>
                <option className="bg-gray-950 text-white">شباب فقط</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">الأجور الشهرية (اختياري)</label>
            <input value={price} onChange={e=>setPrice(formatPriceInput(e.target.value))} placeholder="مثال: 100,000 د.ع"
              className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold transition-all duration-300"/>
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">رقم هاتف السائق/التواصل</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07XXXXXXXXX" required
              className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-bold text-left transition-all duration-300 text-white" dir="ltr"/>
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 text-xs font-black block">تفاصيل إضافية (اختياري)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="مثال: السيارة مكيفة، سواقة هادئة، التزام تام بالمواعيد..."
              className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-medium resize-none transition-all duration-300 leading-relaxed"/>
          </div>

          <motion.button type="submit" whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={user?.role !== 'admin' && user?.role !== 'owner' && cost > 0 && (user?.points || 0) < cost}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:from-gray-850 disabled:to-gray-900 transition-all duration-300">
            <div className="flex items-center gap-2"><Car className="w-4 h-4"/> نشر الإعلان عن الخط</div>
            {user?.role !== 'admin' && user?.role !== 'owner' && cost > 0 && (
              <span className="text-[9px] opacity-80 font-bold bg-black/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Wallet className="w-2.5 h-2.5"/> يخصم {cost} نقطة (متبقي {user?.points || 0})
              </span>
            )}
            {user?.role !== 'admin' && user?.role !== 'owner' && cost === 0 && (
              <span className="text-[9px] opacity-80 font-bold bg-black/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ✨ مجاني بالكامل
              </span>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
