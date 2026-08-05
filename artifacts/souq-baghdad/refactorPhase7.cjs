const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appFilePath, 'utf8');

const hooksImports = `
import { useAppInit } from './hooks/useAppInit';
import { useAppSEO } from './hooks/useAppSEO';
`;

// Insert imports if they don't exist
if (!appContent.includes('import { useAppInit }')) {
  appContent = appContent.replace(
    /import \{ useAppModals \} from '.\/hooks\/useAppModals';/,
    `import { useAppModals } from './hooks/useAppModals';\n${hooksImports}`
  );
}

// 1. Remove deep linking effect and profile loading effect and user tracking
// They are between line 508 and 1528 roughly. We will use strict text replacement.
const p1Start = `  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يحلل عنوان URL لفتح الإعلان أو المنتج أو النقل مباشرة (Deep Linking).`;
const p1End = `    handleUrlRefresh();
  }, []);`;
const idx1 = appContent.indexOf(p1Start);
const idx2 = appContent.indexOf(p1End, idx1);
if (idx1 !== -1 && idx2 !== -1) {
  appContent = appContent.substring(0, idx1) + appContent.substring(idx2 + p1End.length);
}

const p2Start = `  // هذا useEffect يعمل مرة واحدة عند فتح التطبيق.
  // يجلب بيانات جميع البائعين من Supabase (حتى 200 ملف).`;
const p2End = `    loadAllProfilesGlobal();
    return () => { isMounted = false; };
  }, []);`;
const idx3 = appContent.indexOf(p2Start);
const idx4 = appContent.indexOf(p2End, idx3);
if (idx3 !== -1 && idx4 !== -1) {
  appContent = appContent.substring(0, idx3) + appContent.substring(idx4 + p2End.length);
}

const p3Start = `  // --- DEEP LINKING & ROUTING HOOKS ---`;
const p3End = `    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [allAds, allProducts]);`;
const idx5 = appContent.indexOf(p3Start);
const idx6 = appContent.indexOf(p3End, idx5);
if (idx5 !== -1 && idx6 !== -1) {
  appContent = appContent.substring(0, idx5) + appContent.substring(idx6 + p3End.length);
}

const p4Start = `  // هذا useEffect يعمل عند الانتقال لصفحة النقل أو الملف الشخصي.`;
const p4End = `  // 🔥 استعلام Supabase — يُجلب كل مرة تتغير فيها الفلاتر.`;
const idx7 = appContent.indexOf(p4Start);
const idx8 = appContent.indexOf(p4End, idx7);
if (idx7 !== -1 && idx8 !== -1) {
  appContent = appContent.substring(0, idx7) + appContent.substring(idx8 + p4End.length);
}

// Remove the filter effect as well
const p5Start = `  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (view === 'home' || view === 'products' || view === 'transport' || view === 'profile') {
        fetchAds(true);
        fetchProducts(true);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search, cat, gov, sort, priceMin, priceMax, view]);`;
appContent = appContent.replace(p5Start, '');

const p6Start = `  // هذا useEffect يعمل مرة واحدة عند تغيير user.`;
const p6End = `    // interval = setInterval(trackActivity, 2 * 60 * 1000); 
    // return () => clearInterval(interval);
  }, [user]);`;
const idx9 = appContent.indexOf(p6Start);
const idx10 = appContent.indexOf(p6End, idx9);
if (idx9 !== -1 && idx10 !== -1) {
  appContent = appContent.substring(0, idx9) + appContent.substring(idx10 + p6End.length);
}

// Insert hook calls
const hookCalls = `
  useAppInit({
    user, view, setView, setCat, setSelectedAd, setSelectedProduct, setSelectedTransportAd, setSelectedSellerId,
    allAds, allProducts, setStoredUsers, fetchAds, fetchProducts, fetchTransportAds,
    search, cat, gov, sort, priceMin, priceMax
  });

  const { pageTitle, pageDescription, pageImage, canonicalUrl } = useAppSEO({
    selectedAd, selectedProduct, view, selectedSellerId, selectedSellerPhone
  });
`;

const insertAfterStr = `  const playSound = useSound();`;
const insertIdx = appContent.indexOf(insertAfterStr);
if (insertIdx !== -1) {
  appContent = appContent.substring(0, insertIdx + insertAfterStr.length) + hookCalls + appContent.substring(insertIdx + insertAfterStr.length);
}

// Remove SEO logic
const seoStart = `  // Dynamic SEO metadata based on current router state`;
const seoEnd = `    pageTitle = \`خطوط النقل والتوصيل | سوق بغداد\`;
    pageDescription = \`تصفح خطوط النقل والتوصيل المتاحة في العراق - سوق بغداد\`;
    canonicalUrl = \`https://souqbaghdad.store/transport\`;
  }`;

const idx11 = appContent.indexOf(seoStart);
const idx12 = appContent.indexOf(seoEnd, idx11);
if (idx11 !== -1 && idx12 !== -1) {
  appContent = appContent.substring(0, idx11) + appContent.substring(idx12 + seoEnd.length);
}

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log('Refactored Phase 7 App.tsx!');
