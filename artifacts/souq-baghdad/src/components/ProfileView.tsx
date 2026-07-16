// ===========================================
// مسؤولية هذا الملف:
// يعرض صفحة الملف الشخصي للمستخدم الحالي (Profile View).
//
// يجلب البيانات من Supabase مباشرة:
// - إعلانات المستخدم.
// - منتجات المستخدم.
// - إحصاءات الملف.
//
// استعلام Supabase:
// يُنفَّذ عند تحميل المكوّن وعند التغيير في user.
// إذا رأيت جلباً متكرراً، تحقق من useEffect هنا.
//
// الميزات المدمجة:
// - تعديل الملف الشخصي (EditProfileModal)
// - عرض إعلاناتي / منتجاتي / خطوطي (MyLinesTab)
// - معلومات التقييم والإحصاءات
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم إضافة useEffect بدون dependency صحيحة.
// ===========================================

import { DEFAULT_AVATAR } from '../App';
import { DEFAULT_COVER, getCoverImage } from '../constants';
import { VerifiedBadge } from './VerifiedBadge';
import { MyLinesTab } from './MyLinesTab';
import { BackgroundGrid } from '../assets/svg/background/background-grid';
import { GoldParticles } from '../assets/svg/effects/gold-particles';
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
  RefreshCw, TrendingDown, Clock, HelpCircle, Archive, ShoppingCart, Target, 
  Globe, Search as SearchIcon, ArrowLeft, MoreHorizontal, LayoutGrid,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, 
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage  } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';

import { ImageCropModal } from './ImageCropModal';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

export function ProfileView({ user, myAds, myProducts, onDeleteAd, onEditAd, onDeleteProduct, onEditProduct, onUpdateUser, onAddAd, onAddProduct, transportLines, onUpdateTransportStatus, onDeleteTransportAd, onMarkAdSold, onMarkProductSold, favorites = [], allAds = [], allProducts = [], onAdSelect, onProductSelect, onFav, onStoreGuideClick, isDarkMode = true }:{
  user:User; myAds:Ad[]; myProducts:Product[]; onDeleteAd:(id:number)=>void; onEditAd:(ad:Ad)=>void;
  onDeleteProduct:(id:number)=>void; onEditProduct:(p:Product)=>void; onUpdateUser:(u:User, quiet?:boolean)=>void;
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
  isDarkMode?: boolean;
}) {
  const [tab, setTab] = useState<'ads'|'store'|'favs'|'archive'|'lines'|'account'|'wallet'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/wallet') || path.includes('/pay') || hash.includes('/wallet') || hash.includes('/pay')) {
        return 'wallet';
      }
    }
    return 'ads';
  });

  useEffect(() => {
    const handleUrlCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/wallet') || path.includes('/pay') || hash.includes('/wallet') || hash.includes('/pay')) {
        setTab('wallet');
      }
    };
    const handleSwitchToWallet = () => {
      setTab('wallet');
    };
    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    window.addEventListener('switch-to-wallet-tab', handleSwitchToWallet);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
      window.removeEventListener('switch-to-wallet-tab', handleSwitchToWallet);
    };
  }, []);
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim() || !user) return;
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', {
        p_code: promoCode.trim().toUpperCase(),
        p_user_id: user.id
      });
      if (error) throw error;
      if (data.success) {
        // Fetch fresh points from database directly to ensure accuracy
        const { data: freshProfile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
        const newPoints = freshProfile?.points ?? (user.points || 0);

        const updatedUser = { ...user, points: newPoints };
        onUpdateUser?.(updatedUser, true);
        localStorage.setItem('souqUser', JSON.stringify(updatedUser));
        setPromoCode('');
        alert(`تم الشحن بنجاح! رصيدك الحالي هو ${newPoints} نقطة. 🎉`);
      } else {
        alert(data.message || 'الكود غير صالح أو مستخدم مسبقاً.');
      }
    } catch (e: any) {
      console.error(e);
      alert('حدث خطأ أثناء محاولة تفعيل البرومو كود.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRechargeWhatsApp = () => {
    const message = `مرحباً، خلصت نقاطي وأريد أجدد رصيدي في منصة سوق بغداد.
أريد الاستفادة من العرض المدعوم للمشتركين (خصم 50%) للحصول على 100 نقطة بسعر 2,500 دينار.
📋 تفاصيل حسابي:
👤 اسم المستخدم: ${user.name}
📱 رقم الهاتف: ${user.phone}
📍 المحافظة: ${user.location || 'غير محدد'}
يرجى تزويدي بطريقة الدفع لحجز البرومو كود.`;
    window.open(`https://api.whatsapp.com/send?phone=9647700028170&text=${encodeURIComponent(message)}`, '_blank');
  };
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

  // Smart load more limits for bottom cards
  const [visibleAdsLimit, setVisibleAdsLimit] = useState(4);
  const [visibleProdsLimit, setVisibleProdsLimit] = useState(4);
  const [visibleArchLimit, setVisibleArchLimit] = useState(4);

  // Drag-and-drop states for profile uploads
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  // Sync profile data and previews dynamically when user prop changes (fixes double-save)
  useEffect(() => {
    if (user) {
      setAvatarPreview(user.avatar || DEFAULT_AVATAR);
      setCoverPreview(getCoverImage(user));
      setEf({
        name: user.name,
        phone: user.phone,
        location: user.location,
        bio: user.bio || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const favAds = allAds.filter(a => favorites.includes(a.id));
  const favProducts = allProducts.filter(p => favorites.includes(p.id));

  const formatJoinedDate = (isoString: string | undefined | null) => {
    if (!isoString) return 'مؤخراً';
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

  // Memoized unified array of sold/archived items
  const combinedArchive = useMemo(() => {
    const ads = allMyAds.filter(a => a.status === 'sold').map(item => ({ ...item, isProduct: false }));
    const prods = allMyProducts.filter(p => p.status === 'sold').map(item => ({ ...item, isProduct: true }));
    return [...ads, ...prods];
  }, [allMyAds, allMyProducts]);

  useEffect(() => {
    const handleSwitchLines = () => setTab('lines');
    const handleSwitchWallet = () => setTab('wallet');
    window.addEventListener('switch-to-lines-tab', handleSwitchLines);
    window.addEventListener('switch-to-wallet-tab', handleSwitchWallet);
    
    const handleUpdateViews = (e: any) => {
      const { id, views, type } = e.detail;
      if (type === 'ad') {
        setLocalArchiveAds(prev => prev.map(a => a.id === id ? { ...a, views: Math.max(a.views || 0, views) } : a));
      } else if (type === 'product') {
        setLocalArchiveProds(prev => prev.map(p => p.id === id ? { ...p, views: Math.max(p.views || 0, views) } : p));
      } else if (type === 'transport') {
        setLocalArchiveLines(prev => prev.map(l => l.id === id ? { ...l, views: Math.max(l.views || 0, views) } : l));
      }
    };
    window.addEventListener('update-views', handleUpdateViews);
    
    return () => {
      window.removeEventListener('switch-to-lines-tab', handleSwitchLines);
      window.removeEventListener('switch-to-wallet-tab', handleSwitchWallet);
      window.removeEventListener('update-views', handleUpdateViews);
    };
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
        setAvatarPreview(finalAvatar);
      }
      
      let finalCover = coverPreview;
      if (finalCover && finalCover.startsWith('data:image/')) {
        finalCover = await uploadImageToStorage(finalCover, 'ad-images', 1200, 0.9, false);
        setCoverPreview(finalCover);
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

  // Drag and drop handlers for effortless upload (سهولة الرفع)
  const handleDragOver = (e: React.DragEvent, type: 'avatar' | 'cover') => {
    e.preventDefault();
    if (type === 'avatar') setIsDraggingAvatar(true);
    else setIsDraggingCover(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: 'avatar' | 'cover') => {
    e.preventDefault();
    if (type === 'avatar') setIsDraggingAvatar(false);
    else setIsDraggingCover(false);
  };

  const handleDropImage = async (e: React.DragEvent, type: 'avatar' | 'cover') => {
    e.preventDefault();
    if (type === 'avatar') setIsDraggingAvatar(false);
    else setIsDraggingCover(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    const quality = type === 'avatar' ? 0.8 : 0.9;
    const b64 = await compressImage(file, 1200, quality, false);
    setCropType(type);
    setCropSrc(b64);
  };

  const totalViews = allMyAds.reduce((s,a)=>s+(a.views||0),0) + allMyProducts.reduce((s,p)=>s+(p.views||0),0);
  const totalFavorites = allMyAds.reduce((s,a)=>s+(a.favorites||0),0);

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'} pb-24 select-none no-screenshot`}>
      {/* Background Grid & Particles Decoration for Light Mode */}
      {!isDarkMode && (
        <>
          <BackgroundGrid className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 opacity-[0.05] mix-blend-overlay z-0" />
          <GoldParticles className="absolute inset-0 pointer-events-none w-full h-full transition-opacity duration-500 opacity-10 z-0" />
        </>
      )}

      {/* Dynamic styles for screenshot & copy protection */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
        .no-screenshot {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        .secure-watermark {
          background-image: radial-gradient(${isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.08)'} 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
      `}</style>

      {/* Banner & Header */}
      <div className="relative w-full z-10">
        {/* Banner with 3:1 aspect ratio */}
        <div 
          onDragOver={(e) => editing && ['pro','vendor','admin','owner'].includes(user.role) && handleDragOver(e, 'cover')}
          onDragLeave={(e) => editing && ['pro','vendor','admin','owner'].includes(user.role) && handleDragLeave(e, 'cover')}
          onDrop={(e) => editing && ['pro','vendor','admin','owner'].includes(user.role) && handleDropImage(e, 'cover')}
          className={`w-full aspect-[3/1] md:aspect-[4/1] ${isDarkMode ? 'bg-gray-900' : 'bg-slate-200'} relative overflow-hidden flex items-center justify-center transition-all duration-300 ${isDraggingCover ? 'ring-4 ring-amber-500 ring-inset opacity-80' : ''}`}
        >
          <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 select-none pointer-events-none no-screenshot" onContextMenu={e => e.preventDefault()} draggable={false}/>
          <img src={coverPreview} alt="Cover" className="relative w-full h-full object-cover z-0 select-none pointer-events-none no-screenshot" onContextMenu={e => e.preventDefault()} draggable={false}/>
          
          {/* Watermark security grid overlay */}
          <div className="absolute inset-0 z-10 secure-watermark opacity-25 pointer-events-none select-none" />
          <div className="absolute bottom-3 right-3 z-10 text-[9px] text-white/30 tracking-widest uppercase pointer-events-none select-none font-bold">
            Souq Baghdad Secured Profile
          </div>

          {/* Watermark */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 opacity-60 select-none pointer-events-none drop-shadow-xl">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-amber-500/40">
              <span className="text-white font-black text-[10px] sm:text-xs">سوق</span>
            </div>
            <span className="text-white font-black text-xs sm:text-sm drop-shadow-md">سوق بغداد</span>
          </div>
          <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-gray-950 via-gray-950/30' : 'from-slate-900/60 via-transparent'} to-transparent z-10`}/>
          {editing && ['pro','vendor','admin','owner'].includes(user.role) && <label className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs rounded-xl cursor-pointer hover:bg-black/80 backdrop-blur-md z-20">
            <Camera className="w-4 h-4"/> تغيير الغلاف
            <input type="file" accept="image/*" onChange={e=>openCrop(e,'cover')} className="hidden"/></label>}
        </div>

        <div className="container mx-auto px-4 max-w-3xl relative">
          {/* Avatar & Actions Container */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            {/* Avatar */}
            <div 
              onDragOver={(e) => editing && handleDragOver(e, 'avatar')}
              onDragLeave={(e) => editing && handleDragLeave(e, 'avatar')}
              onDrop={(e) => editing && handleDropImage(e, 'avatar')}
              className="relative z-20"
            >
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 shadow-xl overflow-hidden bg-white flex items-center justify-center relative transition-all duration-300 ${isDraggingAvatar ? 'scale-110 ring-4 ring-amber-500' : ''} ${user.role && user.role !== 'user' ? getGlowClass(user.role) : (isDarkMode ? 'border-gray-950 bg-gray-950' : 'border-white bg-slate-100')}`}>
                <img src={avatarPreview} alt={user.name} className="w-full h-full object-cover select-none pointer-events-none no-screenshot" onContextMenu={e => e.preventDefault()} draggable={false}/>
                {/* Micro watermark grid to block screenshots */}
                <div className="absolute inset-0 secure-watermark opacity-20 pointer-events-none select-none" />
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
              {user.isVerified&&!editing&&<VerifiedBadge className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8" />}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-2 justify-end max-w-[200px] sm:max-w-none">
              {editing?(
                <>
                  <button onClick={handleSave} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:bg-green-600"><Save className="w-4 h-4"/>حفظ</button>
                  <button onClick={()=>{setEditing(false);setAvatarPreview(user.avatar||DEFAULT_AVATAR);setCoverPreview(user.cover||DEFAULT_COVER);}} className={`px-3 py-2 sm:px-4 sm:py-2 border rounded-xl text-sm transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'}`}>إلغاء</button>
                </>
              ):(
                <>
                  <button onClick={()=>{
                    onStoreGuideClick?.();
                  }} className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm font-bold shadow-lg transition-colors border ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white border-transparent hover:from-gray-700 hover:to-gray-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`} title="نسخ رابط المتجر للبايو">
                    <Copy className="w-4 h-4"/>
                    <span className="hidden sm:inline">رابط المتجر</span>
                  </button>
                  <button onClick={()=>{
                    window.location.hash = '#/accounts';
                    window.dispatchEvent(new CustomEvent('switch-to-profiles-tab'));
                  }} className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800" title="دليل الحسابات والمتاجر">
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
                  }} className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 border rounded-xl text-sm font-bold shadow-lg transition-colors ${isDarkMode ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
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
          <div className="mb-5" dir="rtl">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.name}</h2>
              {user.role==='owner'&&<span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-bold"><Crown className="w-3 h-3"/>مالك</span>}
              {user.role==='admin'&&<span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold">مشرف</span>}
              {user.role==='vendor'&&<span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-bold"><Crown className="w-3 h-3"/>تاجر موثق</span>}
              {user.role==='pro'&&<span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-bold"><Star className="w-3 h-3"/>حساب برو</span>}
              {user.badges?.isStudent && <span className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700/20 text-gray-300 rounded-md text-xs font-semibold flex items-center gap-1">🎓 طالب موثق</span>}
              {user.badges?.hasVehicle && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-md text-xs font-semibold flex items-center gap-1">🚗 مركبة موثقة</span>}
              {user.badges?.hasID && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md text-xs font-semibold flex items-center gap-1">🪪 هوية موثقة</span>}
              {user.badges?.isPhoneVerified && <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-md text-xs font-semibold flex items-center gap-1">📱 هاتف موثق</span>}
            
              {!user.isVerified && (
                <button onClick={() => setShowVerifyModal(true)} className={`px-2 py-1 border rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ml-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'}`}>
                  🛡️ طلب توثيق
                </button>
              )}
            </div>
            
            <div className={`flex flex-wrap gap-3 mt-2 text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-500"/><span>{user.location || 'العراق'}</span></div>
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-amber-500"/><span>انضم في {formatJoinedDate(user.joinedDate)}</span></div>
              {user.rating && <div className="flex items-center gap-1 text-amber-400"><Star className="w-4 h-4 fill-current"/><span className="font-extrabold">{user.rating}</span></div>}
            </div>
            {user.bio&&<p className={`text-sm mt-3 line-clamp-2 p-3.5 rounded-2xl border backdrop-blur-md leading-relaxed ${isDarkMode ? 'text-gray-300 bg-gray-950/40 border-gray-900/60' : 'text-slate-700 bg-white/80 border-slate-200/60 shadow-sm'}`}>{user.bio}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-4 mb-8">
            {[{v:allMyAds.length,l:'إعلان',c:'text-amber-500'},{v:allMyProducts.length,l:'منتج',c:'text-purple-400'},{v:totalViews,l:'مشاهدة',c:'text-gray-300'},{v:totalFavorites,l:'مفضلة',c:'text-red-400'}].map((s,i)=>(
              <div key={i} className={`rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center border backdrop-blur-md flex flex-col justify-center shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-gray-950/40 border-gray-900/80 hover:border-amber-500/20' : 'bg-white border-slate-200/80 hover:border-amber-500/40 shadow-slate-100'}`}>
                <p className={`text-base sm:text-2xl font-black ${s.c}`}>{s.v}</p>
                <p className={`text-[9px] sm:text-xs font-black mt-1 sm:mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl relative z-10">

        {/* Tabs */}
        <div className={`flex gap-2 mb-6 p-2 rounded-2xl border overflow-x-auto scrollbar-hide shadow-lg ${isDarkMode ? 'bg-gray-950/60 border-gray-900' : 'bg-white border-slate-200/80 shadow-slate-100'}`} dir="rtl">
          {([['ads',`📢 إعلاناتي (${allMyAds.filter(a=>a.status==='active').length})`],['store',`🛍️ متجري (${allMyProducts.filter(p=>p.status==='active').length})`],['wallet', '💳 محفظتي'],['archive',`📦 الأرشيف (${allMyAds.filter(a=>a.status==='sold').length + allMyProducts.filter(p=>p.status==='sold').length})`],['lines',`🚌 خطوطي`],['account','⚙️ الحساب']] as [string,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`whitespace-nowrap px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${tab===t?'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/15':(isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')}`}>{l}</button>
          ))}
        </div>

        {tab==='wallet'&&(
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-md shadow-slate-100'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className={`w-16 h-16 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'}`}>
                  <Wallet className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500 font-semibold'} font-medium mb-1`}>الرصيد الحالي</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className={`text-5xl font-black font-mono tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{user.points || 0}</span>
                  <span className="text-emerald-400 font-bold">نقطة</span>
                </div>
                
                <button 
                  onClick={handleRechargeWhatsApp}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>تواصل للشحن السريع</span>
                </button>
                <p className="text-gray-500 text-xs mt-3">خصم 50% على الباقة الأساسية (100 نقطة بـ 2,500 د.ع)</p>
              </div>
            </div>

            <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>تفعيل برومو كود</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="أدخل الكود هنا (مثال: GIFT-100)" 
                  className={`flex-1 border rounded-xl px-4 py-3 outline-none transition-colors uppercase font-mono text-center sm:text-right ${isDarkMode ? 'bg-gray-900 text-white placeholder-gray-500 border-gray-700 focus:border-amber-500/50' : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-amber-500'}`}
                  disabled={isRedeeming}
                />
                <button 
                  onClick={handleRedeemPromoCode}
                  disabled={isRedeeming || !promoCode.trim()}
                  className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors min-w-[120px]"
                >
                  {isRedeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تفعيل'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Ads Tab */}
        {tab==='ads'&&(
          <>
            <button onClick={onAddAd} className="w-full mb-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2">
              <Plus className="w-5 h-5"/> إضافة إعلان جديد</button>
            {isLoadingArchive ? (
              <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : allMyAds.filter(a=>a.status==='active').length===0?(
              <div className={`rounded-2xl p-10 text-center border border-dashed ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
                <div className="text-4xl mb-3">📭</div><p className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>لا إعلانات بعد</p><p className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500'} text-sm`}>انشر أول إعلان الآن!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allMyAds.filter(a=>a.status==='active').slice(0, visibleAdsLimit).map(ad=>(
                  <div key={ad.id} className={`rounded-2xl p-3 border flex gap-3 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-amber-500/30' : 'bg-white border-slate-200/80 hover:border-amber-500/40 hover:shadow-md'}`}>
                    <img src={ad.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 border ${isDarkMode ? 'border-gray-700' : 'border-slate-100'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-800 font-extrabold'}`}>{ad.title}</p>
                      <p className="text-amber-500 text-sm font-bold">{formatPrice(ad.price)} <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>د.ع</span></p>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <TimeAgo iso={ad.createdAtISO} className="text-green-500 font-bold"/>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500'} flex items-center gap-0.5`}><ViewIcon className="w-3 h-3"/>{ad.views}</span>
                        <span className={`${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>{ad.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 self-center">
                      <button onClick={()=>onMarkAdSold(ad)} title="تم البيع" className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}><CheckCircle className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onEditAd(ad)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`} title="تعديل الإعلان" aria-label="تعديل الإعلان"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onDeleteAd(ad.id)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title="حذف الإعلان" aria-label="حذف الإعلان"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))}
                
                <InfiniteScrollTrigger
                  onLoadMore={async () => {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    setVisibleAdsLimit(prev => prev + 5);
                  }}
                  hasMore={visibleAdsLimit < allMyAds.filter(a=>a.status==='active').length}
                  loadingText="جاري عرض المزيد من الإعلانات..."
                  skeletonType="none"
                />
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
              <div className={`rounded-2xl p-10 text-center border border-dashed ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
                <div className="text-4xl mb-3">🛍️</div><p className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>متجرك فارغ</p><p className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500'} text-sm`}>أضف أول منتج الآن!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allMyProducts.filter(p=>p.status==='active').slice(0, visibleProdsLimit).map(p=>(
                  <div key={p.id} className={`rounded-2xl p-3 border flex gap-3 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-purple-500/30' : 'bg-white border-slate-200/80 hover:border-purple-500/40 hover:shadow-md'}`}>
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 border ${isDarkMode ? 'border-gray-700' : 'border-slate-100'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-800 font-extrabold'}`}>{p.title}</p>
                      <p className="text-amber-500 text-sm font-bold">{formatPrice(p.price)} <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>د.ع</span></p>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${p.condition==='new'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>{p.condition==='new'?'جديد':'مستعمل'}</span>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>الكمية: {p.stock}</span>
                        <TimeAgo iso={p.createdAtISO} className="text-green-500 font-bold"/>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 self-center">
                      <button onClick={()=>onMarkProductSold(p)} title="تم البيع" className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}><CheckCircle className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onEditProduct(p)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`} title="تعديل المنتج" aria-label="تعديل المنتج"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onDeleteProduct(p.id)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title="حذف المنتج" aria-label="حذف المنتج"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))}

                <InfiniteScrollTrigger
                  onLoadMore={async () => {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    setVisibleProdsLimit(prev => prev + 5);
                  }}
                  hasMore={visibleProdsLimit < allMyProducts.filter(p=>p.status==='active').length}
                  loadingText="جاري عرض المزيد من المنتجات..."
                  skeletonType="none"
                />
              </div>
            )}
          </>
        )}

        {/* Archive Tab */}
        {tab==='archive'&&(
          <>
            {isLoadingArchive ? (
              <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : combinedArchive.length === 0 ? (
              <div className={`rounded-2xl p-10 text-center border border-dashed ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
                <div className="text-4xl mb-3">📦</div>
                <p className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>الأرشيف فارغ</p>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-slate-500'} text-sm`}>المنتجات والإعلانات التي تبيعها وتؤرشفها ستظهر هنا.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {combinedArchive.slice(0, visibleArchLimit).map(item => {
                  if (!item.isProduct) {
                    // Sold Ad
                    return (
                      <div key={`sold-ad-${item.id}`} className={`rounded-2xl p-3 border flex gap-3 transition-colors relative ${isDarkMode ? 'bg-gray-800/80 border-gray-700/60 hover:border-red-500/30' : 'bg-white border-slate-200/80 hover:border-red-500/40 hover:shadow-sm'}`}>
                        <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 border opacity-60 ${isDarkMode ? 'border-gray-700' : 'border-slate-100'}`}/>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm line-clamp-1 opacity-75 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.title}</p>
                          <p className="text-amber-500 text-sm font-bold opacity-75">{formatPrice(item.price)} <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>د.ع</span></p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg flex items-center gap-0.5 border ${isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              🚫 تم البيع
                            </span>
                            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-slate-400 font-bold'}`}>إعلان</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 self-center">
                          <button onClick={()=>onDeleteAd(item.id)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title="حذف الإعلان" aria-label="حذف الإعلان"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    );
                  } else {
                    // Sold Product
                    return (
                      <div key={`sold-prod-${item.id}`} className={`rounded-2xl p-3 border flex gap-3 transition-colors relative ${isDarkMode ? 'bg-gray-800/80 border-gray-700/60 hover:border-red-500/30' : 'bg-white border-slate-200/80 hover:border-red-500/40 hover:shadow-sm'}`}>
                        <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} alt="" className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 border opacity-60 ${isDarkMode ? 'border-gray-700' : 'border-slate-100'}`}/>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm line-clamp-1 opacity-75 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.title}</p>
                          <p className="text-amber-500 text-sm font-bold opacity-75">{formatPrice(item.price)} <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>د.ع</span></p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg flex items-center gap-0.5 border ${isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              🚫 تم البيع
                            </span>
                            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-slate-400 font-bold'}`}>منتج</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 self-center">
                          <button onClick={()=>onDeleteProduct(item.id)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title="حذف المنتج" aria-label="حذف المنتج"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    );
                  }
                })}

                <InfiniteScrollTrigger
                  onLoadMore={async () => {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    setVisibleArchLimit(prev => prev + 5);
                  }}
                  hasMore={visibleArchLimit < combinedArchive.length}
                  loadingText="جاري عرض المزيد من الأرشيف..."
                  skeletonType="none"
                />
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
            <div className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800 font-extrabold'}`}><UserIcon className="w-4 h-4 text-amber-400"/>المعلومات الشخصية</h3>
                {!editing&&<button onClick={()=>setEditing(true)} className="text-xs text-amber-400 hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3"/> تعديل</button>}
              </div>
              <div className="space-y-3">
                {[{label:'الاسم الكامل',field:'name',placeholder:'اسمك الكامل'},{label:'رقم الهاتف',field:'phone',placeholder:'07XXXXXXXXX'},{label:'البريد الإلكتروني',field:'email',placeholder:'example@domain.com'},{label:'نبذة شخصية',field:'bio',placeholder:'اكتب نبذة...',multi:true}].map(({label,field,placeholder,multi})=>(
                  <div key={field}><label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-slate-500 font-semibold'}`}>{label}</label>
                    {multi?(
                      <textarea disabled={!editing} value={(ef as any)[field]} onChange={e=>setEf({...ef,[field]:e.target.value})} placeholder={placeholder} rows={2} className={`w-full rounded-xl py-2.5 px-4 border outline-none resize-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-amber-400 disabled:opacity-70' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-amber-500 disabled:opacity-75'}`}/>
                    ):(
                      <input 
                        disabled={!editing} 
                        value={(ef as any)[field]} 
                        onChange={e=>setEf({...ef,[field]:e.target.value})} 
                        placeholder={placeholder} 
                        dir={field === 'phone' || field === 'email' ? 'ltr' : undefined}
                        className={`w-full rounded-xl py-2.5 px-4 border outline-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-amber-400 disabled:opacity-70' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-amber-500 disabled:opacity-75'} ${field === 'phone' || field === 'email' ? 'text-left font-mono' : 'text-right'}`}
                      />
                    )}
                  </div>
                ))}
                <div><label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-slate-500 font-semibold'}`}>المحافظة</label>
                  <select disabled={!editing} value={ef.location} onChange={e=>setEf({...ef,location:e.target.value})} className={`w-full rounded-xl py-2.5 px-4 border outline-none text-sm transition-colors ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-amber-400' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-amber-500'}`} title="المحافظة" aria-label="المحافظة">
                    {IRAQI_GOVERNORATES.filter(g=>g!=='الكل').map(g=><option key={g}>{g}</option>)}</select></div>
                {editing&&<div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4"/>}
                    حفظ التغييرات
                  </button>
                  <button onClick={()=>setEditing(false)} className={`px-4 py-3 rounded-xl text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>إلغاء</button>
                </div>}
              </div>
            </div>
            {/* Email (read-only info card, but we add Edit Password button here) */}
            <div className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-bold flex items-center gap-2 mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800 font-extrabold'}`}><Mail className="w-4 h-4 text-gray-300"/>معلومات الحساب</h3>
              <div className="space-y-2">
                {[{label:'البريد الإلكتروني',val:user.email},{label:'تاريخ الانضمام',val:formatJoinedDate(user.joinedDate)},{label:'نوع الحساب',val:user.role==='owner'?'مالك':user.role==='admin'?'مشرف':'مستخدم'}].map((r,i)=>(
                  <div key={i} className={`flex items-center justify-between py-2 border-b last:border-0 gap-4 ${isDarkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                    <span className={`text-sm shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-slate-500 font-semibold'}`}>{r.label}</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'} ${r.label === 'البريد الإلكتروني' ? 'truncate max-w-[150px] sm:max-w-none text-left font-mono block' : 'text-right'}`} dir={r.label === 'البريد الإلكتروني' ? 'ltr' : undefined}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div className={`mt-4 pt-4 border-t flex justify-end ${isDarkMode ? 'border-gray-700' : 'border-slate-100'}`}>
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
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className={`relative rounded-3xl p-6 w-full max-w-md border shadow-2xl ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <button onClick={()=>setShowVerifyModal(false)} className={`absolute top-4 left-4 p-2 rounded-xl transition-all ${isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="إغلاق" aria-label="إغلاق"><X className="w-5 h-5"/></button>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><VerifiedBadge className="w-5 h-5" /> طلب توثيق الحساب</h2>
              <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-500 font-medium'}`}>يرجى رفع صورة واضحة لهويتك الشخصية (البطاقة الوطنية أو جواز السفر) لتوثيق حسابك والحصول على شارة الموثوقية.</p>
              
              <div className="mb-4">
                {verifyImage ? (
                  <div className={`relative rounded-2xl overflow-hidden border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'}`}>
                    <img src={verifyImage} alt="ID" className="w-full h-48 object-cover"/>
                    <button onClick={()=>setVerifyImage(null)} className="absolute top-2 left-2 p-2 bg-red-500 rounded-xl text-white shadow-lg" title="حذف الصورة" aria-label="حذف الصورة"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <Camera className="w-8 h-8 text-gray-500 mb-2"/>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500 font-bold'}`}>اضغط هنا لالتقاط أو رفع صورة</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" title="تحميل صورة الهوية" aria-label="تحميل صورة الهوية" onChange={async (e) => {
                      if(e.target.files?.[0]) {
                        const b64 = await compressImage(e.target.files[0], 1200, 0.8, false);
                        setVerifyImage(b64);
                      }
                    }}/>
                  </label>
                )}
              </div>
              
              <button onClick={submitVerification} disabled={!verifyImage || isVerifying} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors">
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
