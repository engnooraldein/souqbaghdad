// ===========================================
// مسؤولية هذا الملف:
// نافذة تسجيل الدخول / إنشاء حساب (Auth Modal).
//
// يتعامل مع Supabase Auth مباشرة:
// - supabase.auth.signInWithPassword()
// - supabase.auth.signUp()
// - supabase.auth.signInWithOAuth()
//
// استعلام Supabase:
// يُنفَّذ فقط عند الضغط على زر تسجيل الدخول.
// لا توجد Background Queries.
//
// آمن للتعديل:
// نعم، لكن تأكد من اختبار جميع حالات الخطأ (Wrong Password, Email not found, etc.).
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
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, Fingerprint
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';
import { Capacitor } from '@capacitor/core';

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

export function AuthModal({ onClose, onLogin }:{onClose:()=>void; onLogin:(u:User)=>void}) {
  const [step, setStep] = useState<'phone'|'login'|'signup'|'biometric_prompt'>(() => {
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

  const normalizeArabicNumerals = (str: string) => {
    return str.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632))
              .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776));
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true); playSound('click');
    try {
      if (identifier.length < 3) { setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني'); setLoading(false); return; }
      
      let phoneToCheck = normalizeArabicNumerals(identifier.trim());
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
      let normalizedIdentifier = normalizeArabicNumerals(identifier.trim());
      let emailToUse = normalizedIdentifier.toLowerCase();
      let phone = normalizedIdentifier;
      
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
        if (!localStorage.getItem('biometricPromptShown')) {
          setStep('biometric_prompt');
        } else {
          onClose();
        }
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
        if (!signInErr) { 
          playSound('success');
          if (!localStorage.getItem('biometricPromptShown')) {
            setStep('biometric_prompt');
          } else {
            onClose();
          }
        }
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
      let normalizedRecovery = normalizeArabicNumerals(recoveryPhone.trim());
      const { error } = await supabase.from('password_recovery_requests').insert([{ phone: normalizedRecovery }]);
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (step !== 'biometric_prompt') onClose(); }}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}
        className="relative bg-gray-900 rounded-3xl p-7 w-full max-w-md border border-gray-700 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors" title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{step === 'biometric_prompt' ? '🚀' : step === 'login' ? '🔐' : step === 'signup' ? '✨' : '📱'}</div>
          <h2 className="text-2xl font-bold text-white">
            {isRecovery ? 'استعادة الحساب' : step === 'biometric_prompt' ? 'أمان وسرعة' : step === 'phone' ? 'الدخول السريع' : step === 'login' ? 'مرحباً بعودتك' : 'حساب جديد'}
          </h2>
          {!isRecovery && step !== 'phone' && step !== 'biometric_prompt' && (
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
            <div className="w-16 h-16 bg-gray-800/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
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
          step === 'biometric_prompt' ? (
             <div className="text-center py-2 space-y-6">
                <div className="w-20 h-20 bg-[#0052ff]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                   <Fingerprint className="w-10 h-10 text-[#0052ff]" />
                </div>
                <h3 className="text-white text-xl font-bold">تسجيل الدخول بالبصمة 🔒</h3>
                <p className="text-gray-400 text-sm leading-relaxed px-4">
                  فعّل تسجيل الدخول بالبصمة للوصول إلى حسابك بسرعة وأمان، بدون كتابة كلمة المرور كل مرة.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                   <button 
                     onClick={async () => {
                       playSound('click');
                       if (!Capacitor.isNativePlatform()) {
                          try {
                             await supabase.auth.registerPasskey();
                          } catch (err) {
                             console.error('Passkey registration error:', err);
                          }
                       }
                       localStorage.setItem('biometricEnabled', 'true');
                       localStorage.setItem('biometricPromptShown', 'true');
                       onClose();
                     }}
                     className="w-full py-4 bg-[#0052ff] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                   >
                     <CheckCircle className="w-5 h-5" /> تفعيل الآن
                   </button>
                   <button 
                     onClick={() => {
                       playSound('click');
                       localStorage.setItem('biometricEnabled', 'false');
                       localStorage.setItem('biometricPromptShown', 'true');
                       onClose();
                     }}
                     className="w-full py-4 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors"
                   >
                     لاحقاً
                   </button>
                </div>
             </div>
          ) : step === 'phone' ? (
             <form onSubmit={handlePhoneSubmit} className="space-y-4">
               <div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                 <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="رقم الهاتف أو البريد الإلكتروني" required autoComplete="username" className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-4 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-lg" dir="rtl"/>
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
                <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" required autoComplete="current-password" autoFocus className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" title="إظهار أو إخفاء كلمة المرور" aria-label="إظهار أو إخفاء كلمة المرور">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
              
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                {step === 'login' ? 'تسجيل الدخول' : 'تأكيد وإنشاء الحساب'}
              </button>
              
              {step === 'login' && !Capacitor.isNativePlatform() && (
                 <button 
                   type="button" 
                   onClick={async () => {
                     try {
                        const { data, error } = await supabase.auth.signInWithPasskey();
                        if (error) throw error;
                        playSound('success');
                        onClose();
                     } catch (err: any) {
                        console.error(err);
                        setError('حدث خطأ أثناء المصادقة بمفتاح المرور: ' + (err.message || ''));
                        playSound('error');
                     }
                   }}
                   className="w-full py-4 bg-[#0052ff]/10 text-[#0052ff] font-bold rounded-xl hover:bg-[#0052ff]/20 transition-colors flex items-center justify-center gap-2"
                 >
                   <Fingerprint className="w-5 h-5" /> تسجيل الدخول بالمفتاح (Passkey)
                 </button>
              )}
              
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
