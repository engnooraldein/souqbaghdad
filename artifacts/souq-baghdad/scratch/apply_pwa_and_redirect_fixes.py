import os

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add PWA state variables in App component
target_state = "  const [initialHashParsed, setInitialHashParsed] = useState(false);\n  const [loadingRoute, setLoadingRoute] = useState(false);\n  const [storedUsers, setStoredUsers] = useState<any[]>([]);"
replacement_state = target_state + "\n  \n  // PWA states\n  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);\n  const [isStandalone, setIsStandalone] = useState(false);\n  const [showInstallGuide, setShowInstallGuide] = useState<'safari' | 'ios-other' | 'android-fallback' | null>(null);"

if target_state in content:
    content = content.replace(target_state, replacement_state)
    print("1. Successfully added PWA state variables.")
else:
    print("ERROR 1: Target state block not found!")

# 2. Replace old useEffect rewriting / to /IQ with new PWA/Redirection normalization useEffect
target_effect = """  // Rewrite root clean pathname to /IQ on browser level without page reloads
  // BUT only if not on a deep link path (ad/product/seller etc.)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
      window.history.replaceState(null, '', '/IQ');
    }
  }, []);"""

replacement_effect = """  // PWA & Redirection normalization
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, []);"""

if target_effect in content:
    content = content.replace(target_effect, replacement_effect)
    print("2. Successfully replaced URL rewriting and set up PWA event listeners.")
else:
    print("ERROR 2: Target /IQ rewrite effect not found!")

# 3. Add handleInstallClick right before myProducts filter
target_helper = "  const myProducts = allProducts.filter(p=>p.postedBy===user?.id);\n  const isAdmin = user?.role==='admin';"
replacement_helper = """  const handleInstallClick = () => {
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
  const isAdmin = user?.role==='admin';"""

if target_helper in content:
    content = content.replace(target_helper, replacement_helper)
    print("3. Successfully added handleInstallClick function.")
else:
    print("ERROR 3: Target helper definition not found!")

# 4. Modify MarketView props to accept isStandalone and onInstallClick
target_mv_args = """function MarketView({ 
  user, allAds, allProducts, favorites, storedUsers: propStoredUsers, 
  onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, 
  onTransportClick, onSelectTransportAd, transportLines, onActionMenu,"""

replacement_mv_args = """function MarketView({ 
  user, allAds, allProducts, favorites, storedUsers: propStoredUsers, 
  onSelectAd, onSelectProduct, onToggleFav, onRequireAuth, onSellerClick, 
  onTransportClick, onSelectTransportAd, transportLines, onActionMenu,
  isStandalone, onInstallClick,"""

if target_mv_args in content:
    content = content.replace(target_mv_args, replacement_mv_args)
    print("4. Successfully modified MarketView argument list.")
else:
    print("ERROR 4: MarketView signature target not found!")

target_mv_types = """  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
  onActionMenu?: any;"""

replacement_mv_types = """  onTransportClick?:()=>void;
  onSelectTransportAd?:(ad:any)=>void;
  transportLines: TransportAd[];
  onActionMenu?: any;
  isStandalone?: boolean;
  onInstallClick?: () => void;"""

if target_mv_types in content:
    content = content.replace(target_mv_types, replacement_mv_types)
    print("5. Successfully updated MarketView prop types.")
else:
    print("ERROR 5: MarketView type definition not found!")

# 6. Insert install button in MarketView rendering under Transport Quick Access card
target_btn = """          {/* Transport Quick Access */}
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
          </motion.div>"""

replacement_btn = target_btn + """

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
          )}"""

if target_btn in content:
    content = content.replace(target_btn, replacement_btn)
    print("6. Successfully added install button layout inside MarketView.")
else:
    print("ERROR 6: Transport quick access div not found in MarketView!")

# 7. Pass props in App component MarketView instance
target_mv_call = """            <MarketView 
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
              onTransportClick={()=>{setView('transport');setBottomNavActive('transport');}} """

replacement_mv_call = """            <MarketView 
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
              onInstallClick={handleInstallClick}"""

if target_mv_call in content:
    content = content.replace(target_mv_call, replacement_mv_call)
    print("7. Successfully passed isStandalone and onInstallClick to MarketView instance.")
else:
    print("ERROR 7: MarketView call not found in App.tsx render block!")

# 8. Render PWA guide modals at the end of AnimatePresence
target_end_modals = """        {shareModalData.isOpen && (
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
        )}
      </AnimatePresence>"""

replacement_end_modals = """        {shareModalData.isOpen && (
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
      </AnimatePresence>"""

if target_end_modals in content:
    content = content.replace(target_end_modals, replacement_end_modals)
    print("8. Successfully added PWA install modals to AnimatePresence.")
else:
    print("ERROR 8: End of modals block not found in App.tsx!")

# 9. Modify canonicalUrl on homepage state
target_canonical = '  let canonicalUrl = "https://souqbaghdad.store/IQ";'
replacement_canonical = '  let canonicalUrl = "https://souqbaghdad.store/";'

if target_canonical in content:
    content = content.replace(target_canonical, replacement_canonical)
    print("9. Successfully changed canonicalUrl to root URL.")
else:
    print("ERROR 9: Canonical homepage URL target not found!")

# Save back to file
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("\nDone! PWA and Redirect fixes applied successfully.")
