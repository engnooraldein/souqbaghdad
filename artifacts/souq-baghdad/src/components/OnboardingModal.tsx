// ===========================================
// مسؤولية هذا الملف:
// نافذة الترحيب والتعريف بالتطبيق للمستخدمين الجدد (Onboarding Modal).
//
// لا يتصل بـ Supabase مباشرة.
// يحفظ حالة "تم الترحيب" في LocalStorage لمنع الظهور مجدداً.
//
// آمن للتعديل:
// نعم، يمكن تحديث محتوى الشرائح.
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

export function OnboardingModal({ onClose }:{onClose:()=>void}) {
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
