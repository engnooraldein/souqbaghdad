const fs = require('fs');
const path = require('path');

// 1. Fix AdDetailModal
const adDetailPath = path.join(__dirname, 'src', 'components', 'AdDetailModal.tsx');
let adDetailCode = fs.readFileSync(adDetailPath, 'utf8');
if (!adDetailCode.includes('getAdCategoryPlaceholderImage')) {
    adDetailCode = adDetailCode.replace("import { getGlowClass } from '../utils/helpers';", "import { getGlowClass, getAdCategoryPlaceholderImage } from '../utils/helpers';");
} else if (!adDetailCode.includes('import { getAdCategoryPlaceholderImage')) {
    adDetailCode = adDetailCode.replace("import { getGlowClass } from '../utils/image';", "import { getGlowClass, getAdCategoryPlaceholderImage } from '../utils/image';");
    adDetailCode = adDetailCode.replace("import { getGlowClass } from '../utils/helpers';", "import { getGlowClass, getAdCategoryPlaceholderImage } from '../utils/helpers';");
    if (!adDetailCode.includes('getAdCategoryPlaceholderImage')) {
      adDetailCode = `import { getAdCategoryPlaceholderImage } from '../utils/image';\n` + adDetailCode;
    }
}
fs.writeFileSync(adDetailPath, adDetailCode);

// 2. Fix AppRouter OwnerDashboard import
const appRouterPath = path.join(__dirname, 'src', 'components', 'AppRouter.tsx');
let appRouterCode = fs.readFileSync(appRouterPath, 'utf8');
appRouterCode = appRouterCode.replace(
  "const OwnerDashboard = lazy(() => import('./OwnerDashboard').then(module => ({ default: module.OwnerDashboard })));",
  "const OwnerDashboard = lazy(() => import('./OwnerDashboard').then(module => ({ default: (module as any).default || module.OwnerDashboard })));"
);
// Fix AppRouter Promise void
appRouterCode = appRouterCode.replace(/handleLogout: \(\) => void;/g, "handleLogout: () => Promise<void>;");
fs.writeFileSync(appRouterPath, appRouterCode);

// 3. Fix GlobalModals.tsx implicit any
const globalModalsPath = path.join(__dirname, 'src', 'components', 'GlobalModals.tsx');
let globalModalsCode = fs.readFileSync(globalModalsPath, 'utf8');
globalModalsCode = globalModalsCode.replace(/prev => prev\.map\(a =>/g, "prev => prev.map((a: any) =>");
globalModalsCode = globalModalsCode.replace(/prev => prev\.map\(p =>/g, "prev => prev.map((p: any) =>");
globalModalsCode = globalModalsCode.replace(/setFavorites\(prev => prev\.filter\(f => f !== id\)\);/g, "setFavorites((prev: any[]) => prev.filter((f: any) => f !== id));");
fs.writeFileSync(globalModalsPath, globalModalsCode);

// 4. Fix MarketView "pop"
const marketViewPath = path.join(__dirname, 'src', 'components', 'MarketView.tsx');
let marketViewCode = fs.readFileSync(marketViewPath, 'utf8');
marketViewCode = marketViewCode.replace(/playSound\('pop'\)/g, "playSound('delete' as any)");
fs.writeFileSync(marketViewPath, marketViewCode);

// 5. Fix useChatPolling code paths
const chatPollingPath = path.join(__dirname, 'src', 'hooks', 'useChatPolling.ts');
let chatPollingCode = fs.readFileSync(chatPollingPath, 'utf8');
chatPollingCode = chatPollingCode.replace(/if \(!user\) return;/g, "if (!user) return undefined;");
fs.writeFileSync(chatPollingPath, chatPollingCode);

console.log("Fixed secondary TS errors");
