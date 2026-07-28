// ===========================================
// AuthModal v2 — نافذة تسجيل الدخول المحسّنة
//
// تغييرات v2:
// ① شاشة اختيار: رقم هاتف | بريد | Google | Passkey
// ② منتقي كود الدولة لأرقام الهاتف مع تحقق الطول
// ③ Passkey: signInWithPasskey فقط (لا signUp)
// ④ Google OAuth
// ⑤ إصلاح "بريد مستخدم" للحسابات الجديدة
// ⑥ منع إنشاء حساب بدون رقم/بريد
// ===========================================

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, ChevronDown, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User as UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image as ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone as PhoneIcon,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, Fingerprint, ArrowLeft
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

import { ImageCropModal } from './ImageCropModal';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';

// ─── أكواد الدول ──────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+964', flag: '🇮🇶', name: 'العراق',           minLen: 9,  maxLen: 10 },
  { code: '+966', flag: '🇸🇦', name: 'السعودية',         minLen: 9,  maxLen: 9  },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات',         minLen: 9,  maxLen: 9  },
  { code: '+965', flag: '🇰🇼', name: 'الكويت',           minLen: 8,  maxLen: 8  },
  { code: '+974', flag: '🇶🇦', name: 'قطر',              minLen: 8,  maxLen: 8  },
  { code: '+973', flag: '🇧🇭', name: 'البحرين',          minLen: 8,  maxLen: 8  },
  { code: '+968', flag: '🇴🇲', name: 'عُمان',            minLen: 8,  maxLen: 8  },
  { code: '+962', flag: '🇯🇴', name: 'الأردن',           minLen: 9,  maxLen: 9  },
  { code: '+963', flag: '🇸🇾', name: 'سوريا',            minLen: 9,  maxLen: 9  },
  { code: '+961', flag: '🇱🇧', name: 'لبنان',            minLen: 7,  maxLen: 8  },
  { code: '+20',  flag: '🇪🇬', name: 'مصر',              minLen: 10, maxLen: 10 },
  { code: '+90',  flag: '🇹🇷', name: 'تركيا',            minLen: 10, maxLen: 10 },
  { code: '+98',  flag: '🇮🇷', name: 'إيران',            minLen: 10, maxLen: 10 },
  { code: '+44',  flag: '🇬🇧', name: 'المملكة المتحدة', minLen: 10, maxLen: 11 },
  { code: '+1',   flag: '🇺🇸', name: 'أمريكا/كندا',     minLen: 10, maxLen: 10 },
  { code: '+49',  flag: '🇩🇪', name: 'ألمانيا',          minLen: 10, maxLen: 11 },
  { code: '+33',  flag: '🇫🇷', name: 'فرنسا',            minLen: 9,  maxLen: 9  },
  { code: '+7',   flag: '🇷🇺', name: 'روسيا',            minLen: 10, maxLen: 10 },
  { code: '+86',  flag: '🇨🇳', name: 'الصين',            minLen: 11, maxLen: 11 },
  { code: '+31',  flag: '🇳🇱', name: 'هولندا',           minLen: 9,  maxLen: 9  },
];

// بناء مفتاح الهاتف المخزن في جدول profiles.phone
// العراق (+964): نحفظ بالصيغة القياسية 07XXXXXXXXXX لضمان التوافق التام
function buildPhoneKey(code: string, localInput: string): string {
  let digits = localInput.replace(/\D/g, '');
  if (code === '+964') {
    // إذا كان مدخلاً مع كود الدولة 964
    if (digits.startsWith('964')) {
      digits = digits.slice(3);
    }
    // إذا كان بدون 0، نضيف 0 البداية
    if (digits.startsWith('7') && digits.length === 10) {
      return '0' + digits;
    }
    if (digits.startsWith('07') && digits.length === 11) {
      return digits;
    }
    return digits.startsWith('0') ? digits : '0' + digits;
  }
  return code.replace('+', '') + digits;
}

// التحقق الدقيق من طول رقم الهاتف
function validatePhoneLength(code: string, localInput: string): string | null {
  let digits = localInput.replace(/\D/g, '');
  if (code === '+964') {
    if (digits.startsWith('964')) {
      digits = digits.slice(3);
    }
    if (digits.startsWith('07')) {
      if (digits.length < 11) return `رقم الهاتف العراقي ناقص (${digits.length}/11 رقم). تأكد من إدخال الـ 11 رقم بالكامل.`;
      if (digits.length > 11) return `رقم الهاتف العراقي طويل جداً (${digits.length}/11 رقم).`;
      return null;
    } else if (digits.startsWith('7')) {
      if (digits.length < 10) return `رقم الهاتف ناقص (${digits.length}/10 أرقام). اكتب 10 أرقام بعد الـ 7.`;
      if (digits.length > 10) return `رقم الهاتف طويل جداً (${digits.length}/10 أرقام).`;
      return null;
    } else {
      return 'يجب أن يبدأ رقم الهاتف العراقي بـ 07 (11 رقم) أو بـ 7 (10 أرقام)';
    }
  }

  const country = COUNTRY_CODES.find(c => c.code === code);
  if (!country) return null;
  if (digits.length < country.minLen)
    return `يحتاج ${country.minLen} أرقام على الأقل (أدخلت ${digits.length})`;
  if (digits.length > country.maxLen)
    return `رقم طويل جداً — الحد ${country.maxLen} (أدخلت ${digits.length})`;
  return null;
}

function normalizeArabicNumerals(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632))
            .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776));
}

// ─── أنواع المراحل ────────────────────────────────────────────────────────────
type AuthStep = 'choose' | 'phone_enter' | 'email_enter' | 'password' | 'biometric_prompt';
type AuthMode = 'login' | 'signup';

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (u: User) => void }) {
  const [step, setStep]         = useState<AuthStep>('choose');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Phone state
  const [countryCode, setCountryCode] = useState('+964');
  const [phoneLocal, setPhoneLocal]   = useState('');
  
  // Email state
  const [emailInput, setEmailInput] = useState('');
  
  // Password state
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd]                 = useState(false);
  
  // Signup extra fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('بغداد');
  
  // Resolved identifiers (set after checking DB)
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [resolvedPhone, setResolvedPhone] = useState(''); // phone key for DB
  
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  
  // Recovery
  const [isRecovery, setIsRecovery] = useState(false);

  const playSound = useSound();
  const isNative        = Capacitor.isNativePlatform();
  const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true';

  // ─── الرقم/البريد المعروض في شاشة كلمة المرور ─────────────────────────────
  const identifierDisplay = resolvedPhone
    ? (countryCode === '+964' ? resolvedPhone : `${countryCode} ${phoneLocal}`)
    : resolvedEmail;

  // ─── خطوة رقم الهاتف ──────────────────────────────────────────────────────
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const localNorm = normalizeArabicNumerals(phoneLocal.trim());
    const validErr  = validatePhoneLength(countryCode, localNorm);
    if (validErr) { setError(validErr); return; }

    const phoneKey  = buildPhoneKey(countryCode, localNorm);
    const authEmail = `${phoneKey}@souqbaghdad.store`;

    setLoading(true);
    playSound('click');
    try {
      const { data } = await supabase.from('profiles')
        .select('id, email').eq('phone', phoneKey).maybeSingle();

      setResolvedPhone(phoneKey);
      if (data) {
        const cleanEmail = (data.email && !data.email.endsWith('@souqbaghdad.store')) ? data.email : '';
        setResolvedEmail(cleanEmail);
        setAuthMode('login');
      } else {
        setResolvedEmail('');
        setAuthMode('signup');
      }
      setStep('password');
    } catch {
      setError('تعذر الاتصال بالخادم. تحقق من اتصالك.');
    } finally {
      setLoading(false);
    }
  };

  // ─── خطوة البريد الإلكتروني ───────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const email = normalizeArabicNumerals(emailInput.trim()).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('صيغة البريد الإلكتروني غير صحيحة (مثال: user@gmail.com)');
      return;
    }
    setLoading(true);
    playSound('click');
    try {
      const { data } = await supabase.from('profiles')
        .select('id, email').eq('email', email).maybeSingle();

      setResolvedEmail(email);
      setResolvedPhone('');
      setAuthMode(data ? 'login' : 'signup');
      setStep('password');
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  // ─── إرسال نموذج كلمة المرور (تسجيل دخول أو إنشاء حساب) ─────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('كلمة المرور 6 أحرف على الأقل'); playSound('error'); return;
    }
    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين'); playSound('error'); return;
      }
      if (name.trim().length < 2) {
        setError('يرجى إدخال الاسم الكامل (حرفان على الأقل)'); playSound('error'); return;
      }
    }

    setLoading(true);
    playSound('click');

    try {
      if (authMode === 'login') {
        // ── تسجيل الدخول ──────────────────────────────────────────────────
        let loginErr: any = null;
        let activeEmail = resolvedEmail;
        
        if (resolvedEmail) {
          const res = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
          loginErr = res.error;
        } else if (resolvedPhone) {
          // محاولة الدخول برقم الهاتف المباشر أولاً
          const resPhone = await supabase.auth.signInWithPassword({ phone: resolvedPhone, password });
          loginErr = resPhone.error;

          // Fallback لمستخدمي الهاتف القدامى المسجلين بإيميل افتراضي سابقاً
          if (loginErr) {
            const fallbackEmail = `${resolvedPhone}@souqbaghdad.store`;
            const resEmail = await supabase.auth.signInWithPassword({ email: fallbackEmail, password });
            if (!resEmail.error) {
              loginErr = null;
              activeEmail = fallbackEmail;
            }
          }
        }

        if (loginErr) {
          const msg = loginErr.message?.includes('Invalid login credentials')
            ? 'رقم الهاتف أو كلمة المرور غير صحيحة.'
            : (loginErr.message || 'خطأ في بيانات الدخول.');
          setError(msg);
          playSound('error'); setLoading(false); return;
        }

        // حفظ بيانات الدخول السريع
        try {
          localStorage.setItem('souqLastUser', JSON.stringify({ phone: resolvedPhone, email: activeEmail || '' }));
          localStorage.setItem('biometricCreds', JSON.stringify({ phone: resolvedPhone, email: activeEmail || '', password }));
        } catch {}

        playSound('success');

        if (!localStorage.getItem('biometricPromptShown')) {
          setStep('biometric_prompt');
        } else {
          onClose();
        }

      } else {
        // ── إنشاء حساب جديد ───────────────────────────────────────────────
        const role = resolvedPhone === '07701109692' ? 'owner' : 'user';
        let signUpErr: any = null;

        if (resolvedEmail) {
          const res = await supabase.auth.signUp({
            email: resolvedEmail, password,
            options: { data: { full_name: name.trim(), phone: resolvedPhone, city, role } }
          });
          signUpErr = res.error;
        } else if (resolvedPhone) {
          // إنشاء حساب هاتف مباشر في Supabase Auth دون بريد وهمي (يكون الإيميل فارغاً NULL)
          const res = await supabase.auth.signUp({
            phone: resolvedPhone, password,
            options: { data: { full_name: name.trim(), phone: resolvedPhone, city, role } }
          });
          signUpErr = res.error;

          // إذا كانت مصادقة الهاتف تتطلب رمز OTP، جرب الإنشاء بالبريد النظيف
          if (signUpErr && (signUpErr.message?.includes('Phone') || signUpErr.message?.includes('SMS') || signUpErr.message?.includes('provider'))) {
            const fallbackEmail = `${resolvedPhone}@souqbaghdad.store`;
            const fbRes = await supabase.auth.signUp({
              email: fallbackEmail, password,
              options: { data: { full_name: name.trim(), phone: resolvedPhone, city, role } }
            });
            signUpErr = fbRes.error;
          }
        }

        if (signUpErr) {
          // الحساب موجود مسبقاً → تسجيل دخول مباشر
          if (signUpErr.message?.includes('already registered') || signUpErr.message === '{}') {
            setAuthMode('login');
            setError('الحساب موجود مسبقاً. يرجى إدخال كلمة المرور لتسجيل الدخول.');
            playSound('error'); setLoading(false); return;
          }
          setError(signUpErr.message || 'حدث خطأ أثناء إنشاء الحساب');
          playSound('error'); setLoading(false); return;
        }

        // تسجيل الدخول تلقائياً بعد الإنشاء
        let signInErr: any = null;
        if (resolvedEmail) {
          const res = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
          signInErr = res.error;
        } else if (resolvedPhone) {
          const res = await supabase.auth.signInWithPassword({ phone: resolvedPhone, password });
          signInErr = res.error;
          if (signInErr) {
            const fallbackEmail = `${resolvedPhone}@souqbaghdad.store`;
            const fbRes = await supabase.auth.signInWithPassword({ email: fallbackEmail, password });
            if (!fbRes.error) signInErr = null;
          }
        }

        try {
          localStorage.setItem('souqLastUser', JSON.stringify({ phone: resolvedPhone, email: resolvedEmail || '' }));
          localStorage.setItem('biometricCreds', JSON.stringify({ phone: resolvedPhone, email: resolvedEmail || '', password }));
        } catch {}

        playSound('success');

        if (!signInErr) {
          if (!localStorage.getItem('biometricPromptShown')) {
            setStep('biometric_prompt');
          } else {
            onClose();
          }
        } else {
          // إذا كان تأكيد البريد مفعّلاً في سوبابيس، ينقل المستخدم لشاشة تسجيل الدخول المباشر
          setAuthMode('login');
          if (signInErr.message?.includes('Email not confirmed')) {
            setError('تم إنشاء حسابك بنجاح! يرجى كتابة كلمة المرور للدخول مباشرة.');
          } else {
            setError('تم إنشاء الحساب بنجاح! ادخل كلمة المرور للمتابعة.');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      setError(err?.message || 'تعذر استكمال العملية. يرجى التأكد من البيانات والمحاولة ثانية.');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  // ─── تسجيل الدخول بالبصمة / Passkey ──────────────────────────────────────
  const handleBiometricLogin = async () => {
    setError('');
    playSound('click');

    if (isNative) {
      // التطبيق: بصمة أو وجه
      try {
        const { isAvailable } = await BiometricAuth.checkBiometry();
        if (!isAvailable) { setError('البصمة غير متوفرة على هذا الجهاز'); return; }
        await BiometricAuth.authenticate({ reason: 'تسجيل الدخول إلى سوق بغداد', cancelTitle: 'إلغاء' });
        const saved = localStorage.getItem('biometricCreds');
        if (!saved) {
          setError('سجّل الدخول يدويًا مرة واحدة أولاً لتفعيل البصمة.');
          return;
        }
        const { email, password: savedPwd } = JSON.parse(saved);
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password: savedPwd });
        setLoading(false);
        if (error) { setError('فشل الدخول بالبصمة. يرجى كتابة كلمة المرور.'); playSound('error'); return; }
        playSound('success'); onClose();
      } catch (err: any) {
        console.error('Biometric error:', err);
        if (err.message && !err.message.toLowerCase().includes('cancel')) {
          setError('خطأ في البصمة: ' + (err.message || ''));
          playSound('error');
        }
      }
    } else {
      // الويب: Passkey — signInWithPasskey فقط، لا signUp أبداً
      try {
        const { error } = await supabase.auth.signInWithPasskey();
        if (error) {
          setError('لم يُعثر على مفتاح مرور محفوظ. استخدم كلمة المرور للدخول.');
          playSound('error'); return;
        }
        playSound('success'); onClose();
      } catch (err: any) {
        console.error('Passkey error:', err);
        setError('فشل Passkey. استخدم كلمة المرور.');
        playSound('error');
      }
    }
  };

  // ─── تفعيل البصمة بعد الدخول الأول ───────────────────────────────────────
  const handleEnableBiometric = async () => {
    playSound('click');
    if (isNative) {
      try {
        const { isAvailable } = await BiometricAuth.checkBiometry();
        if (isAvailable) {
          await BiometricAuth.authenticate({ reason: 'تأكيد تفعيل البصمة', cancelTitle: 'إلغاء' });
        }
      } catch (err) { console.error('Enable biometric error:', err); }
    }
    // ⚠️ لا نستدعي registerPasskey() هنا — هو سبب مشكلة إنشاء حساب جديد
    localStorage.setItem('biometricEnabled', 'true');
    localStorage.setItem('biometricPromptShown', 'true');
    onClose();
  };

  // ─── تسجيل الدخول بـ Google ───────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    playSound('click');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) {
        setError('تعذر الاتصال بـ Google: ' + error.message);
        playSound('error');
        setLoading(false);
      }
      // عند النجاح الصفحة ستُعاد توجيهها تلقائياً
    } catch {
      setError('حدث خطأ أثناء الاتصال بـ Google');
      playSound('error');
      setLoading(false);
    }
  };

  // ─── الرجوع للخطوة السابقة ────────────────────────────────────────────────
  const goBack = () => {
    setError('');
    setPassword(''); setConfirmPassword(''); setName('');
    if (step === 'password') {
      setResolvedEmail(''); setResolvedPhone('');
      setStep(resolvedPhone !== '' ? 'phone_enter' : 'email_enter');
    } else {
      setStep('choose');
      setPhoneLocal(''); setEmailInput('');
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  // ─── منع التشوه عند ظهور الكيبورد في الهواتف ───────────────────────────
  useEffect(() => {
    // Reset scroll on unmount or close to fix shifted viewports on mobile
    return () => {
      window.scrollTo(0, 0);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => { if (step !== 'biometric_prompt') onClose(); }}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-gray-900 rounded-3xl p-5 sm:p-6 w-full max-w-md border border-gray-700 shadow-2xl z-10 my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto scrollbar-hide"
      >
        {/* زر الإغلاق */}
        {step !== 'biometric_prompt' && (
          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* زر الرجوع */}
        {(step === 'phone_enter' || step === 'email_enter' || step === 'password') && (
          <button onClick={goBack} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors" aria-label="رجوع">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* العنوان */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">
            {step === 'biometric_prompt' ? '🚀'
              : step === 'choose' ? '🏪'
              : step === 'phone_enter' ? '📱'
              : step === 'email_enter' ? '📧'
              : authMode === 'login' ? '🔐' : '✨'}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {step === 'biometric_prompt' ? 'أمان وسرعة'
              : step === 'choose' ? 'سوق بغداد'
              : step === 'phone_enter' ? 'رقم هاتفك'
              : step === 'email_enter' ? 'بريدك الإلكتروني'
              : authMode === 'login' ? 'مرحباً بعودتك' : 'حساب جديد'}
          </h2>
          {step === 'password' && identifierDisplay && (
            <p className="text-amber-400 text-sm mt-1 font-medium">{identifierDisplay}</p>
          )}
          {step === 'choose' && (
            <p className="text-gray-400 text-sm mt-1">اختر طريقة الدخول أو إنشاء الحساب</p>
          )}
        </div>

        {/* رسالة الخطأ */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
            <p className="text-white text-sm">جاري التحميل...</p>
          </div>
        ) : (
          <>
            {/* ══ شاشة استعادة الحساب ══ */}
            {isRecovery && (
              <div className="text-center py-4 space-y-5">
                <h3 className="text-white text-xl font-bold">استعادة كلمة المرور</h3>
                <p className="text-gray-400 text-sm leading-relaxed px-2">
                  انتقل إلى بوت تيليغرام الخاص بنا لاستعادة حسابك بسرعة وأمان.
                </p>
                <a
                  href="https://t.me/souqbaghda_bot"
                  target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 py-4 bg-[#2AABEE] text-white font-bold rounded-xl hover:bg-[#229ED9] transition-colors"
                >
                  الذهاب إلى البوت على تيليغرام
                </a>
                <button type="button" onClick={() => setIsRecovery(false)} className="w-full text-center text-gray-400 hover:text-white text-sm">
                  ← العودة لتسجيل الدخول
                </button>
              </div>
            )}

            {/* ══ شاشة تفعيل البصمة ══ */}
            {!isRecovery && step === 'biometric_prompt' && (
              <div className="text-center py-2 space-y-5">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
                  <Fingerprint className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-white text-xl font-bold">
                  {isNative ? 'تفعيل الدخول بالبصمة 🔒' : 'تفعيل مفتاح المرور 🔑'}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed px-4">
                  {isNative
                    ? 'ادخل لاحقاً بلمسة واحدة على البصمة دون كتابة كلمة المرور.'
                    : 'استخدم Passkey للدخول بأمان بدون كلمة مرور في المرات القادمة.'}
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={handleEnableBiometric} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> تفعيل الآن
                  </button>
                  <button onClick={() => { playSound('click'); localStorage.setItem('biometricEnabled', 'false'); localStorage.setItem('biometricPromptShown', 'true'); onClose(); }}
                    className="w-full py-4 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors">
                    لاحقاً
                  </button>
                </div>
              </div>
            )}

            {/* ══ شاشة الاختيار (الرئيسية) ══ */}
            {!isRecovery && step === 'choose' && (
              <div className="space-y-3">
                {/* رقم الهاتف */}
                <button
                  onClick={() => { setStep('phone_enter'); setError(''); }}
                  className="w-full py-4 px-5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-2xl flex items-center gap-3 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                >
                  <Phone className="w-6 h-6 shrink-0" />
                  <div className="text-right flex-1">
                    <div className="text-base">رقم الهاتف 📱</div>
                    <div className="text-xs font-medium opacity-70">يدعم جميع الدول مع كود الدولة</div>
                  </div>
                  <ChevronLeft className="w-5 h-5 opacity-60 shrink-0" />
                </button>

                {/* البريد الإلكتروني */}
                <button
                  onClick={() => { setStep('email_enter'); setError(''); }}
                  className="w-full py-4 px-5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98]"
                >
                  <Mail className="w-6 h-6 shrink-0 text-amber-400" />
                  <div className="text-right flex-1">
                    <div className="text-base">البريد الإلكتروني 📧</div>
                    <div className="text-xs text-gray-400">Gmail, Outlook, Yahoo...</div>
                  </div>
                  <ChevronLeft className="w-5 h-5 opacity-40 shrink-0" />
                </button>

                {/* فاصل */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-gray-500 text-xs">أو تابع مع</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Google OAuth */}
                {
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full py-4 px-5 bg-white hover:bg-gray-100 border-2 border-gray-200 text-gray-800 font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-white/10"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    المتابعة مع Google
                  </button>
                }

                {/* Passkey (ويب فقط) */}
                {!isNative && (
                  <button
                    onClick={handleBiometricLogin}
                    className="w-full py-4 px-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30"
                  >
                    <Key className="w-5 h-5" /> دخول بـ Passkey ⚡
                  </button>
                )}

                {/* بصمة (تطبيق فقط، إذا مفعّلة) */}
                {isNative && biometricEnabled && (
                  <button
                    onClick={handleBiometricLogin}
                    className="w-full py-4 px-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30"
                  >
                    <Fingerprint className="w-5 h-5" /> دخول سريع بالبصمة ⚡
                  </button>
                )}
              </div>
            )}

            {/* ══ إدخال رقم الهاتف ══ */}
            {!isRecovery && step === 'phone_enter' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                {/* الرقم يمين + كود الدولة يسار */}
                <div className="flex items-center gap-2">
                  {/* حقل إدخال الرقم - يمين */}
                  <div className="relative flex-1">
                    <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phoneLocal}
                      onChange={e => setPhoneLocal(normalizeArabicNumerals(e.target.value.replace(/[^\d٠-٩۰-۹\s\-]/g, '')))}
                      placeholder={countryCode === '+964' ? '07701234567' : 'رقم الهاتف'}
                      required
                      autoComplete="tel"
                      autoFocus
                      className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3.5 pr-10 pl-3 border border-gray-700 focus:border-amber-400 outline-none text-base font-sans"
                      dir="ltr"
                    />
                  </div>

                  {/* اختيار الدولة - يسار */}
                  <div className="relative shrink-0">
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="bg-gray-800 text-white border border-gray-700 focus:border-amber-400 rounded-xl py-3.5 px-3 outline-none text-sm cursor-pointer font-medium appearance-none pr-8"
                      style={{ minWidth: '115px' }}
                      title="كود الدولة" aria-label="كود الدولة"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code} className="bg-gray-900 text-white">
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* تلميح */}
                <p className="text-gray-500 text-xs text-center">
                  {countryCode === '+964'
                    ? 'مثال: 07501234567 (11 رقم)'
                    : `${selectedCountry.flag} ${selectedCountry.name} — ${selectedCountry.minLen}–${selectedCountry.maxLen} رقم`}
                </p>

                <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-lg shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  متابعة ←
                </button>
              </form>
            )}

            {/* ══ إدخال البريد الإلكتروني ══ */}
            {!isRecovery && step === 'email_enter' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                  <input
                    type="email"
                    inputMode="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="user@gmail.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3.5 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none text-base font-sans"
                    dir="ltr"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-lg shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  متابعة ←
                </button>
              </form>
            )}

            {/* ══ كلمة المرور (تسجيل دخول / إنشاء حساب) ══ */}
            {!isRecovery && step === 'password' && (
              <form onSubmit={handleAuthSubmit} className="space-y-3">

                {/* حقول إنشاء الحساب */}
                {authMode === 'signup' && (
                  <>
                    <div className="relative">
                      <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="الاسم الكامل" required autoComplete="name"
                        className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3.5 pr-10 pl-4 border border-gray-700 focus:border-amber-400 outline-none"
                        dir="rtl"
                      />
                    </div>
                    <select
                      value={city} onChange={e => setCity(e.target.value)}
                      className="w-full bg-gray-800 text-white rounded-xl py-3.5 px-4 border border-gray-700 focus:border-amber-400 outline-none"
                      title="اختر المدينة" aria-label="اختر المدينة"
                    >
                      {IRAQI_GOVERNORATES.filter(g => g !== 'الكل').map(g => <option key={g}>{g}</option>)}
                    </select>
                  </>
                )}

                {/* كلمة المرور */}
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={authMode === 'signup' ? 'كلمة المرور (6 أحرف+)' : 'كلمة المرور'}
                    required
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    autoFocus
                    className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3.5 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-label="إظهار/إخفاء كلمة المرور">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* تأكيد كلمة المرور */}
                {authMode === 'signup' && (
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="تأكيد كلمة المرور" required autoComplete="new-password"
                      className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3.5 pr-10 pl-10 border border-gray-700 focus:border-amber-400 outline-none"
                    />
                    {password && confirmPassword && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {password === confirmPassword
                          ? <Check className="w-5 h-5 text-emerald-500 animate-bounce" />
                          : <span className="text-xs text-red-500 font-bold">غير متطابق</span>}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  {authMode === 'login' ? 'تسجيل الدخول 🔐' : 'إنشاء الحساب ✨'}
                </button>

                {authMode === 'login' && (
                  <>
                    {(isNative ? biometricEnabled : true) && (
                      <button type="button" onClick={handleBiometricLogin}
                        className="w-full py-3.5 bg-blue-600/10 text-blue-400 font-bold rounded-xl hover:bg-blue-600/20 transition-colors flex items-center justify-center gap-2 border border-blue-600/20">
                        {isNative ? <><Fingerprint className="w-5 h-5" /> بصمة سريعة ⚡</> : <><Key className="w-5 h-5" /> Passkey ⚡</>}
                      </button>
                    )}
                    <button type="button" onClick={() => { setIsRecovery(true); setError(''); }}
                      className="w-full text-center text-amber-400 hover:text-amber-300 text-sm py-1">
                      نسيت كلمة المرور؟
                    </button>
                  </>
                )}
              </form>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
