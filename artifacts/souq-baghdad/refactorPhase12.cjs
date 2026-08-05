const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const startStr = 'export default function App() {\n';
const endStr = '\n  return (';
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find boundaries');
  process.exit(1);
}

const newBody = `  // 1. Auth & Core Sounds
  const { user, setUser, session, handleLogout: authHandleLogout } = useAuth();
  const playSound = useSound();
  const playNotificationSound = playSound;

  const [storedUsers, setStoredUsers] = useState<any[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';

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
    setUser(u); setShowAuth(false); showToast(\`مرحباً \${u.name}! 🎉\`,'success');
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
    const cleanEmail = (u.email && !u.email.endsWith('@souqbaghdad.com') && !u.email.endsWith('@souqbaghdad.store')) ? u.email.trim().toLowerCase() : null;
    if (!quiet) {
      localStorage.removeItem('souq_cached_profiles');
      localStorage.removeItem('souq_cached_profiles_time');
      await supabase.from('profiles').upsert({ id: u.id, full_name: u.name, email: cleanEmail, phone: u.phone || null, avatar_url: u.avatar, cover_url: u.cover, bio: u.bio, city: u.location, role: u.role }, { onConflict: 'id' });
      try { await supabase.auth.updateUser({ data: { full_name: u.name, phone: u.phone || '' } }); } catch (authErr) {}
      showToast('تم حفظ الملف الشخصي ✅', 'success');
    }
  };
  const requireAuth = ()=>setShowAuth(true);

  const handleSellerClick = (sellerId:string, source: 'home'|'accounts' = 'home') => {
    if(sellerId) {
      setPreviousSellerSource(source);
      setSelectedSellerId(sellerId);
      setView('seller_public');
    }
  };
`;

const finalCode = code.substring(0, startIdx + startStr.length) + newBody + code.substring(endIdx);
fs.writeFileSync(path, finalCode);
console.log('App.tsx body completely rewritten with correct hook order!');
