// ===========================================
// مسؤولية هذا الملف:
// نافذة تغيير كلمة السر (Password Change Modal).
//
// يتعامل مع Supabase Auth:
// - supabase.auth.updateUser({ password: newPassword })
//
// استعلام Supabase:
// يُنفَّذ فقط عند الضغط على زر التغيير.
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

import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

export function PasswordChangeModal({ isOpen, onClose, userEmail, userPhone }:{
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
