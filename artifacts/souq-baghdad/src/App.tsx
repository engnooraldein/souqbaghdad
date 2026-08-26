import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LoadingScreen } from './components/LoadingScreen';
import { Toast } from './components/Toast';
export const ViewersModal = lazy(() => import('./components/ViewersModal').then(m => ({ default: m.ViewersModal })));

import { useAuth, OWNER_EMAIL, DEFAULT_AVATAR, DEFAULT_COVER } from './hooks/useAuth';
import { useAppTheme } from './hooks/useAppTheme';
import { useBiometric } from './hooks/useBiometric';
import { useChatPolling } from './hooks/useChatPolling';
import { useNativeNotifications } from './hooks/useNativeNotifications';
import { useAppNavigation } from './hooks/useAppNavigation';
import { usePWA } from './hooks/usePWA';
import { useAppModals } from './hooks/useAppModals';
import { useAppInit } from './hooks/useAppInit';
import { useAppSEO } from './hooks/useAppSEO';
import { useSound } from './hooks/useSound';
import { useAppGlobalState } from './hooks/useAppGlobalState';

import { useAds } from './hooks/useAds';
import { useTransportAds } from './hooks/useTransportAds';
import { useNotifications } from './hooks/useNotifications';
import { useAdActions } from './hooks/useAdActions';
import { useProductActions } from './hooks/useProductActions';
import { useTransportActions } from './hooks/useTransportActions';
import { triggerOnlineStatusesSync } from './hooks/useOnlineStatuses';

import { User } from './types';
import { slugify } from './utils/helpers';
import { saveStoredUser, recordVisit } from './utils/analytics';

import { AppNavbar } from './components/AppNavbar';
import { AppSidebar } from './components/AppSidebar';
import { AppMobileMenu } from './components/AppMobileMenu';
import { AppRouter } from './components/AppRouter';
import { AppFooter } from './components/AppFooter';
import { AppBottomNav } from './components/AppBottomNav';
import { AppBiometricBanner } from './components/AppBiometricBanner';
import { GlobalModals } from './components/GlobalModals';
import { BiometricLockScreen } from './components/BiometricLockScreen';
import { SearchPage } from './components/SearchPage';
import { Lock, Settings, MessageCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';

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
// ===========================================
// المسؤولية:
// تسجيل زيارة المستخدم للتطبيق في قاعدة البيانات.
//
// استعلام Supabase:
// عدد مرات التنفيذ المتوقع: مرة واحدة لكل جلسة متصفح (Session).
// إذا تكرر بشكل كبير فهناك مشكلة (تأكد من عدم وضعه داخل Render loop).
// ===========================================
// ===========================================
// المسؤولية:
// حفظ بيانات المستخدم في LocalStorage.
//
// لماذا موجود؟
// لتسريع عملية تسجيل الدخول في المرات القادمة (Caching).
// ===========================================
// ===========================================
// المسؤولية:
// التحقق مما إذا كان البريد الإلكتروني محظوراً من النظام.
// ===========================================


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
  // 1. Auth & Core Sounds
  const { user, setUser, handleLogout: authHandleLogout } = useAuth();
  const playSound = useSound();
  const playNotificationSound = playSound;

  const [storedUsers, setStoredUsers] = useState<any[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin' || isOwner;

  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string }>({ active: false, message: '' });
  const [maintenanceLoaded, setMaintenanceLoaded] = useState(false);

  useEffect(() => {
    supabase.from('auto_publish_settings').select('settings').eq('category', 'system').maybeSingle().then(({ data, error }) => {
      if (!error && data?.settings) {
        setMaintenance({
          active: !!data.settings.maintenance_mode,
          message: data.settings.message || 'الموقع قيد التحديث والصيانة. نعود لكم قريباً!'
        });
      }
      setMaintenanceLoaded(true);
    });
  }, []);

  // 2. Modals, Theme, Polling
  const { themeMode, isDarkMode, showThemeMenu, setShowThemeMenu, changeThemeMode, toggleDarkMode } = useAppTheme();
  const { isBiometricLocked, showBiometricBanner, setShowBiometricBanner, setIsBiometricLocked } = useBiometric(user, playNotificationSound);
  const { showChatModal, setShowChatModal, activeChatId, setActiveChatId, unreadChatCount, chatViewport } = useChatPolling(user, playNotificationSound);
  
  useNativeNotifications(user);

  const [showScrollButtons, setShowScrollButtons] = useState(true);
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 10) setShowScrollButtons(false);
      lastScrollY = currentScrollY;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setShowScrollButtons(true), 2000);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  const {
    view, setView, bottomNavActive, setBottomNavActive, swipeDir, setSwipeDir,
    mainDragX, peekDragX, peekView, peekSide, onSwipePan, onSwipePanEnd,
    selectedSellerId, setSelectedSellerId, selectedSellerPhone, setSelectedSellerPhone
  } = useAppNavigation();

  const {
    showOnboarding, setShowOnboarding, showNotifs, setShowNotifs, showMobileMenu, setShowMobileMenu,
    showCreateAd, setShowCreateAd, showCreateProduct, setShowCreateProduct, showCreateTransport, setShowCreateTransport,
    showStoreGuide, setShowStoreGuide, editingAd, setEditingAd, editingProduct, setEditingProduct,
    editingTransportAd, setEditingTransportAd, selectedAd, setSelectedAd, selectedProduct, setSelectedProduct,
    selectedTransportAd, setSelectedTransportAd, actionMenuTarget, setActionMenuTarget, toast, setToast,
    activeDocTab, setActiveDocTab, activeLightbox, setActiveLightbox, shareModalData, setShareModalData,
    congratulationsItem, setCongratulationsItem
  } = useAppModals();

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'delete' | 'admin' | 'upload' | 'click') => {
    setToast({ msg, type: type === 'delete' || type === 'admin' || type === 'upload' || type === 'click' ? 'info' : type, visible: true });
    if (type === 'success') playSound('success');
    else if (type === 'delete') playSound('delete' as any);
    else if (type === 'admin') playSound('admin' as any);
    else playSound('info' as any);
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  }, [playSound, setToast]);

  const {
    deferredPrompt, setDeferredPrompt, isStandalone, setIsStandalone,
    showInstallGuide, setShowInstallGuide, showInstallOptions, setShowInstallOptions
  } = usePWA();

  // 3. Data fetching states
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('general');
  const [gov, setGov] = useState('الكل');
  const [sort, setSort] = useState<'recent'|'views'|'price-low'|'price-high'>('recent');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all'|'new'|'used'>('all');
  const [showSearchPage, setShowSearchPage] = useState(false);

  // Reset to general feed when user returns to app from background (PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only reset if we're on the home view
        setCat(prev => prev !== 'general' ? 'general' : prev);
        setSearch('');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const {
    allAds, setAllAds, allProducts, setAllProducts, fetchAds, fetchProducts,
    loadingMoreAds, loadingMoreProducts, isInitialLoading, hasMoreAds, hasMoreProducts,
    totalAdsCount, totalProductsCount
  } = useAds({ search, cat, gov, sort, priceMin, priceMax });

  const {
    allTransportAds, setAllTransportAds, loadingTransport, setLoadingTransport,
    hasMoreTransport, totalTransportCount, fetchTransportAds
  } = useTransportAds();

  const {
    notifications, setNotifications, fetchNotifications,
    handleDeleteNotification, handleClearAllNotifications
  } = useNotifications(user, unreadChatCount, playSound);

  const [adCosts, setAdCosts] = useState<{ad:number; product:number; transport:number; vip_ad:number}>({ ad: 1, product: 1, transport: 1, vip_ad: 5 });
  useEffect(() => {
    supabase.from('system_settings').select('*').then(({ data, error }) => {
      if (!error && data) {
        const costs: any = { ad: 1, product: 1, transport: 1, vip_ad: 5 };
        data.forEach(r => { costs[r.category] = r.cost; });
        setAdCosts(costs);
        if (costs.data_saver_mode === 1) {
          localStorage.setItem('data_saver_mode', 'true');
        } else {
          localStorage.setItem('data_saver_mode', 'false');
        }
      }
    });
  }, []);

  const {
    checkPostRateLimit, handleHomeRefresh, handleHistoryClick, markNotifAsRead, handleArchiveAllNotifications
  } = useAppGlobalState({
    user, setView, setCat, setBottomNavActive, setSearch, setGov, setSort,
    fetchAds, fetchProducts, fetchTransportAds, playNotificationSound, unreadChatCount,
    notifications, setNotifications, allAds, allProducts, allTransportAds,
    setSelectedAd, setSelectedProduct, setSelectedTransportAd, setShareModalData, showToast
  });

  const {
    handleToggleFav, handleAddOrEditAd, handleMarkAdSold, handleDeleteAd
  } = useAdActions({
    user, setUser, adCosts, checkPostRateLimit, showToast, playSound,
    triggerOnlineStatusesSync: () => {}, fetchAds, setAllAds,
    editingAd, setEditingAd, setFavorites: () => {}, setCongratulationsItem
  });

  const {
    handleAddOrEditProduct, handleMarkProductSold, handleDeleteProduct
  } = useProductActions({
    user, setUser, adCosts, checkPostRateLimit, showToast, playSound,
    fetchProducts, setAllProducts, editingProduct, setEditingProduct, setCongratulationsItem
  });

  const {
    handlePostTransportAd, handleUpdateTransportStatus, handleDeleteTransportAd
  } = useTransportActions({
    user, setUser, adCosts, checkPostRateLimit, showToast,
    fetchTransportAds, allTransportAds
  });

  useAppInit({
    user, view, setView, setCat, setSelectedAd, setSelectedProduct, setSelectedTransportAd, setSelectedSellerId,
    allAds, allProducts, setStoredUsers, fetchAds, fetchProducts, fetchTransportAds,
    search, cat, gov, sort, priceMin, priceMax
  });

  const { pageTitle, pageDescription, pageImage, canonicalUrl } = useAppSEO({
    selectedAd, selectedProduct, view, selectedSellerId, selectedSellerPhone
  });

  const [favorites, setFavorites] = useState<number[]>(()=>{ try{return JSON.parse(localStorage.getItem('souqFavs')||'[]');}catch{return[];} });
  useEffect(()=>{localStorage.setItem('souqFavs',JSON.stringify(favorites));},[favorites]);

  const [initialHashParsed, setInitialHashParsed] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [previousSellerSource, setPreviousSellerSource] = useState<'home'|'accounts'>('home');

  useEffect(()=>{
    if(user){const mc=allAds.filter(a=>a.postedBy===user.id).length+allProducts.filter(p=>p.postedBy===user.id).length;/* saveStoredUser(user,mc); */}
  },[user, allAds, allProducts]);

  const handleLogin = (u:User)=>{
    setUser(u); setShowAuth(false); showToast(`مرحباً ${u.name}! 🎉`,'success');
    if(!localStorage.getItem('souqOnboarded'))setShowOnboarding(true);
    /* recordVisit(u); */
  };
  const handleLogout = async ()=>{
    await authHandleLogout();
    setView('home');
  };
  const handleUpdateUser = async (u:User, quiet: boolean = false)=>{
    setUser(u);
    localStorage.setItem('souqUser', JSON.stringify(u));
    /* saveStoredUser(u, allAds.filter(a=>a.postedBy===u.id).length); */
    const cleanEmail = (u.email && !u.email.endsWith('@souqbaghdad.com') && !u.email.endsWith('@souqbaghdad.store')) ? u.email.trim().toLowerCase() : '';
    if (!quiet) {
      localStorage.removeItem('souq_cached_profiles');
      localStorage.removeItem('souq_cached_profiles_time');
      const { error } = await supabase.from('profiles').upsert({ 
        id: u.id, 
        full_name: u.name, 
        email: cleanEmail || undefined, 
        phone: u.phone || null, 
        avatar_url: u.avatar, 
        cover_url: u.cover, 
        bio: u.bio, 
        city: u.location, 
        store_metadata: u.store_metadata || {} 
      }, { onConflict: 'id' });

      if (error) {
        console.error("Save profile error:", error);
        alert('حدث خطأ ولم يتم الحفظ: ' + error.message);
        return;
      }
      try { await supabase.auth.updateUser({ data: { full_name: u.name, phone: u.phone || '' } }); } catch (authErr) {}
      showToast('تم حفظ الملف الشخصي ✅', 'success');
    }
  };
  const requireAuth = ()=>setShowAuth(true);

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      // Server-side logic should handle actual auth deletion if possible, or trigger cloud function
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      showToast('تم حذف الحساب بنجاح', 'success');
      setView('home');
    } catch (err: any) {
      console.error(err);
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const handleViewDurationLogged = async (itemId: number | string, itemTitle: string, ownerId: string, itemType: string, seconds: number) => {
    // Disabled to stop heavy DB bandwidth usage and save egress costs
    return;
  };

  const handleSellerClick = (sellerId:string, source: 'home'|'accounts' = 'home') => {
    if(sellerId) {
      setPreviousSellerSource(source);
      setSelectedSellerId(sellerId);
      setView('seller_public');
    }
  };
  if (!maintenanceLoaded) {
    return <LoadingScreen isLoading={true} />;
  }

  if (maintenance.active) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0c2b5e] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="w-24 h-24 mb-6 rounded-full bg-blue-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <Settings className="w-12 h-12 text-blue-500 animate-spin-slow" />
        </div>
        <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-l from-blue-400 to-cyan-300">
          تحديث وصيانة
        </h1>
        <p className="text-lg max-w-md text-slate-400 leading-relaxed mb-8">
          {maintenance.message}
        </p>
        <div className="flex gap-4">
          <a href="https://t.me/souqbaghda_bot" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl transition-all border border-blue-500/30">
            <MessageCircle className="w-5 h-5" />
            <span>تواصل مع البوت</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pwa-outer-container transition-colors duration-300 ${isDarkMode ? 'dark bg-[black] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <LoadingScreen isLoading={isInitialLoading} minDuration={400} />
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
      <AppNavbar 
        isDarkMode={isDarkMode} 
        view={view} 
        setView={setView} 
        cat={cat} 
        setCat={setCat} 
        showThemeMenu={showThemeMenu} 
        setShowThemeMenu={setShowThemeMenu} 
        themeMode={themeMode} 
        changeThemeMode={changeThemeMode} 
        user={user} 
        setShowNotifs={setShowNotifs} 
        notifications={notifications} 
        isOwner={isOwner} 
        isAdmin={isAdmin} 
        setShowCreateProduct={setShowCreateProduct} 
        setEditingProduct={setEditingProduct} 
        handleLogout={handleLogout} 
        setShowAuth={setShowAuth} 
        unreadChatCount={unreadChatCount} 
        setShowMobileMenu={setShowMobileMenu} 
        setShowSearchPage={setShowSearchPage}
      />

      {/* Desktop Navigation Sidebar */}
      <AppSidebar 
        isDarkMode={isDarkMode} 
        user={user} 
        isOwner={isOwner} 
        isAdmin={isAdmin} 
        view={view} 
        setView={setView} 
        cat={cat} 
        setCat={setCat} 
        setBottomNavActive={setBottomNavActive} 
        unreadChatCount={unreadChatCount} 
        activeDocTab={activeDocTab} 
        setActiveDocTab={setActiveDocTab} 
        toggleDarkMode={toggleDarkMode} 
        setShowAuth={setShowAuth} 
        handleHomeRefresh={handleHomeRefresh} 
        setShowSearchPage={setShowSearchPage}
      />

      {/* Mobile Menu Drawer */}
      <AppMobileMenu 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        user={user} 
        isOwner={isOwner} 
        isAdmin={isAdmin} 
        handleHomeRefresh={handleHomeRefresh} 
        setView={setView} 
        setCat={setCat} 
        setShowCreateAd={setShowCreateAd} 
        setShowCreateTransport={setShowCreateTransport}
        view={view}
        setEditingAd={setEditingAd} 
        setShowCreateProduct={setShowCreateProduct} 
        setEditingProduct={setEditingProduct} 
        handleLogout={handleLogout} 
        setShowAuth={setShowAuth} 
        setActiveDocTab={setActiveDocTab} 
        setShowSearchPage={setShowSearchPage}
      />

      {/* Main */}
      <AppRouter 
        peekView={peekView}
        peekDragX={peekDragX}
        mainDragX={mainDragX}
        onSwipePan={onSwipePan}
        onSwipePanEnd={onSwipePanEnd}
        view={view}
        setView={setView}
        user={user}
        allAds={allAds}
        allProducts={allProducts}
        allTransportAds={allTransportAds}
        favorites={favorites}
        storedUsers={storedUsers}
        setSelectedAd={setSelectedAd}
        setSelectedProduct={setSelectedProduct}
        setSelectedTransportAd={setSelectedTransportAd}
        handleToggleFav={handleToggleFav}
        requireAuth={requireAuth}
        handleSellerClick={handleSellerClick}
        setBottomNavActive={setBottomNavActive}
        isStandalone={isStandalone}
        handleInstallClick={() => setShowInstallGuide('safari')}
        search={search}
        setSearch={setSearch}
        setShowSearchPage={setShowSearchPage}
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
        hasMoreAds={hasMoreAds}
        hasMoreProducts={hasMoreProducts}
        hasMoreTransport={hasMoreTransport}
        fetchAds={fetchAds}
        fetchProducts={fetchProducts}
        fetchTransportAds={fetchTransportAds}
        totalAdsCount={totalAdsCount}
        totalProductsCount={totalProductsCount}
        totalTransportCount={totalTransportCount}
        loadingMoreAds={loadingMoreAds}
        loadingMoreProducts={loadingMoreProducts}
        loadingTransport={loadingTransport}
        isInitialLoading={isInitialLoading}
        isDarkMode={isDarkMode}
        handleHomeRefresh={handleHomeRefresh}
        setShowCreateProduct={setShowCreateProduct}
        showCreateTransport={showCreateTransport}
        setShowCreateTransport={setShowCreateTransport}
        setShowCreateAd={setShowCreateAd}
        setEditingProduct={setEditingProduct}
        setEditingAd={setEditingAd}
        setActionMenuTarget={setActionMenuTarget}
        handlePostTransportAd={handlePostTransportAd}
        handleUpdateTransportStatus={handleUpdateTransportStatus}
        handleDeleteTransportAd={handleDeleteTransportAd}
        handleDeleteAd={handleDeleteAd}
        handleDeleteProduct={handleDeleteProduct}
        handleDeleteProfile={handleDeleteProfile}
        handleUpdateUser={handleUpdateUser}
        handleMarkAdSold={handleMarkAdSold}
        handleMarkProductSold={handleMarkProductSold}
        adCosts={adCosts}
        myAds={allAds.filter(a => a.postedBy === user?.id)}
        myProducts={allProducts.filter(p => p.postedBy === user?.id)}
        selectedSellerId={selectedSellerId}
        selectedSellerPhone={selectedSellerPhone}
        previousSellerSource={previousSellerSource}
        isAdmin={isAdmin}
        isOwner={isOwner}
        setShowStoreGuide={setShowStoreGuide}
      />

      {/* Footer */}
      <AppFooter setActiveDocTab={setActiveDocTab} setView={setView} />

      {/* Bottom Navigation Bar - Fixed Mobile First */}
      <AppBottomNav 
        user={user} 
        bottomNavActive={bottomNavActive} 
        setBottomNavActive={setBottomNavActive} 
        setView={setView} 
        requireAuth={requireAuth} 
        setShowCreateAd={setShowCreateAd} 
        setShowCreateTransport={setShowCreateTransport}
        view={view}
        handleHomeRefresh={handleHomeRefresh} 
        cat={cat} 
      />

      {/* Biometric Reminder Banner */}
      <AppBiometricBanner 
        showBiometricBanner={showBiometricBanner} 
        setShowBiometricBanner={setShowBiometricBanner} 
        playNotificationSound={playNotificationSound} 
      />

            <GlobalModals showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding} showAuth={showAuth} setShowAuth={setShowAuth} handleLogin={handleLogin} selectedAd={selectedAd} setSelectedAd={setSelectedAd} favorites={favorites} handleToggleFav={handleToggleFav} user={user} storedUsers={storedUsers} requireAuth={requireAuth} handleSellerClick={handleSellerClick} handleViewDurationLogged={handleViewDurationLogged} setActiveLightbox={setActiveLightbox} setAllAds={setAllAds} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct} setAllProducts={setAllProducts} selectedTransportAd={selectedTransportAd} setSelectedTransportAd={setSelectedTransportAd} showCreateAd={showCreateAd} setShowCreateAd={setShowCreateAd} setEditingAd={setEditingAd} handleAddOrEditAd={handleAddOrEditAd} editingAd={editingAd} adCosts={adCosts} showCreateProduct={showCreateProduct} setShowCreateProduct={setShowCreateProduct} setEditingProduct={setEditingProduct} handleAddOrEditProduct={handleAddOrEditProduct} editingProduct={editingProduct} showNotifs={showNotifs} setShowNotifs={setShowNotifs} notifications={notifications} handleHistoryClick={handleHistoryClick} markNotifAsRead={markNotifAsRead} handleArchiveAllNotifications={handleArchiveAllNotifications} showChatModal={showChatModal} setShowChatModal={setShowChatModal} chatViewport={chatViewport} activeChatId={activeChatId} setActiveChatId={setActiveChatId} setSelectedSellerId={setSelectedSellerId} activeDocTab={activeDocTab} setActiveDocTab={setActiveDocTab} activeLightbox={activeLightbox} congratulationsItem={congratulationsItem} setCongratulationsItem={setCongratulationsItem} shareModalData={shareModalData} setShareModalData={setShareModalData} showInstallGuide={showInstallGuide} setShowInstallGuide={setShowInstallGuide} showInstallOptions={showInstallOptions} setShowInstallOptions={setShowInstallOptions} handleInstallClick={() => setShowInstallGuide('safari')} showStoreGuide={showStoreGuide} setShowStoreGuide={setShowStoreGuide} />

      {/* ── Professional Search Page Overlay ── */}
      <SearchPage
        isOpen={showSearchPage}
        onClose={() => setShowSearchPage(false)}
        isDarkMode={isDarkMode}
        allAds={allAds}
        allProducts={allProducts}
        onSelectAd={ad => { setSelectedAd(ad); setShowSearchPage(false); }}
        onSelectProduct={p => { setSelectedProduct(p); setShowSearchPage(false); }}
        storedUsers={storedUsers}
        user={user}
        onToggleFav={handleToggleFav}
        favorites={favorites}
        onRequireAuth={requireAuth}
        onSellerClick={id => { handleSellerClick(id); setShowSearchPage(false); }}
      />
    </div>
  );
}


export { handleUniversalShare } from './hooks/useAppInteractions';


export * from './constants';
export * from './utils/image';
export * from './utils/analytics';
export { getWhatsAppLink } from './utils/helpers';
