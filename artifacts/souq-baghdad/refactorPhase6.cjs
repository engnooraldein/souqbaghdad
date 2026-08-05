const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appFilePath, 'utf8');

const hooksImports = `
import { useAppNavigation } from './hooks/useAppNavigation';
import { usePWA } from './hooks/usePWA';
import { useAppModals } from './hooks/useAppModals';
`;

// Insert imports if they don't exist
if (!appContent.includes('import { useAppNavigation }')) {
  appContent = appContent.replace(
    /import \{ useNativeNotifications \} from '.\/hooks\/useNativeNotifications';/,
    `import { useNativeNotifications } from './hooks/useNativeNotifications';\n${hooksImports}`
  );
}

// Strip out the old states and replace with hooks

// 1. Navigation block
const navStart = `  const getInitialRouteInfo = () => {`;
const navEnd = `  // -----------------------------------------------------------------`;

const navStartIndex = appContent.indexOf(navStart);
const navEndIndex = appContent.indexOf(navEnd);

if (navStartIndex !== -1 && navEndIndex !== -1) {
  const replacement = `
  const {
    view, setView, bottomNavActive, setBottomNavActive, swipeDir, setSwipeDir,
    mainDragX, peekDragX, peekView, peekSide, onSwipePan, onSwipePanEnd,
    selectedSellerId, setSelectedSellerId, selectedSellerPhone, setSelectedSellerPhone
  } = useAppNavigation();
`;
  appContent = appContent.substring(0, navStartIndex) + replacement + appContent.substring(navEndIndex + navEnd.length);
}

// 2. Modals block
const modalsStart = `    const [showOnboarding, setShowOnboarding] = useState(false);`;
const modalsEnd = `  const [congratulationsItem, setCongratulationsItem] = useState<{ title: string; type: 'ad' | 'product' } | null>(null);`;

const mStartIndex = appContent.indexOf(modalsStart);
const mEndIndex = appContent.indexOf(modalsEnd);

if (mStartIndex !== -1 && mEndIndex !== -1) {
  const replacement = `
  const {
    showOnboarding, setShowOnboarding, showNotifs, setShowNotifs, showMobileMenu, setShowMobileMenu,
    showCreateAd, setShowCreateAd, showCreateProduct, setShowCreateProduct, showCreateTransport, setShowCreateTransport,
    showStoreGuide, setShowStoreGuide, editingAd, setEditingAd, editingProduct, setEditingProduct,
    editingTransportAd, setEditingTransportAd, selectedAd, setSelectedAd, selectedProduct, setSelectedProduct,
    selectedTransportAd, setSelectedTransportAd, actionMenuTarget, setActionMenuTarget, toast, setToast,
    activeDocTab, setActiveDocTab, activeLightbox, setActiveLightbox, shareModalData, setShareModalData,
    congratulationsItem, setCongratulationsItem
  } = useAppModals();
`;
  appContent = appContent.substring(0, mStartIndex) + replacement + appContent.substring(mEndIndex + modalsEnd.length);
}

// 3. PWA block
const pwaStart = `  // PWA states`;
const pwaEnd = `  const [showInstallOptions, setShowInstallOptions] = useState(false);`;

const pStartIndex = appContent.indexOf(pwaStart);
const pEndIndex = appContent.indexOf(pwaEnd);

if (pStartIndex !== -1 && pEndIndex !== -1) {
  const replacement = `
  const {
    deferredPrompt, setDeferredPrompt, isStandalone, setIsStandalone,
    showInstallGuide, setShowInstallGuide, showInstallOptions, setShowInstallOptions
  } = usePWA();
`;
  appContent = appContent.substring(0, pStartIndex) + replacement + appContent.substring(pEndIndex + pwaEnd.length);
}

// Remove onboarding effect
const obEffectStart = `  useEffect(() => {
    const completed = localStorage.getItem('souq_onboarding_completed') || localStorage.getItem('souqOnboarded');
    if (!completed) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);`;
appContent = appContent.replace(obEffectStart, '');

// Remove PWA effect
const pwaEffectStart = `    if (typeof window !== 'undefined') {
      const isIOSStandalone = ('standalone' in window.navigator) && !!(window.navigator as any).standalone;
      const isMatchStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isIOSStandalone || isMatchStandalone);
    }`;
const pwaEffectFullStart = `  // PWA detection & installation`;
const pwaEffectEnd = `    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);`;

const fullPWAEffectStart = appContent.indexOf(pwaEffectFullStart);
const fullPWAEffectEnd = appContent.indexOf(pwaEffectEnd);
if(fullPWAEffectStart !== -1 && fullPWAEffectEnd !== -1) {
  appContent = appContent.substring(0, fullPWAEffectStart) + appContent.substring(fullPWAEffectEnd + pwaEffectEnd.length);
}

// Remove BottomNavEffect
const bottomNavEffect = `  useEffect(() => {
    if (view === 'transport') setBottomNavActive('transport');
    else if (view === 'products') setBottomNavActive('products');
    else if (view === 'profile' || view === 'seller') setBottomNavActive('profile');
    else if (view === 'home') setBottomNavActive('home');
  }, [view]);`;
appContent = appContent.replace(bottomNavEffect, '');


fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log('Refactored Phase 6 App.tsx!');
