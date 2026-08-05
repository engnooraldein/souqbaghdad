const fs = require('fs');
const path = require('path');

const appRouterPath = path.join(__dirname, 'src', 'components', 'AppRouter.tsx');
let appRouterCode = fs.readFileSync(appRouterPath, 'utf8');

// Fix handleMarkAdSold and handleMarkProductSold types
appRouterCode = appRouterCode.replace(/handleMarkAdSold: \(id: number\) => void;/, 'handleMarkAdSold: (ad: any) => void;');
appRouterCode = appRouterCode.replace(/handleMarkProductSold: \(id: number\) => void;/, 'handleMarkProductSold: (p: any) => void;');

// Fix handleToggleFav
appRouterCode = appRouterCode.replace(/handleToggleFav: \(e: any, id: number\) => void;/, 'handleToggleFav: (id: number) => void;');

// Fix conditionFilter
appRouterCode = appRouterCode.replace(/conditionFilter: string;/, 'conditionFilter: "new" | "used" | "all";');

// Fix sort
appRouterCode = appRouterCode.replace(/sort: string;/, 'sort: "views" | "recent" | "price-low" | "price-high";');

fs.writeFileSync(appRouterPath, appRouterCode);

const useAuthPath = path.join(__dirname, 'src', 'hooks', 'useAuth.ts');
let useAuthCode = fs.readFileSync(useAuthPath, 'utf8');

useAuthCode = useAuthCode.replace(/bio: '',\n\s*location: '',/, "bio: '',\n        location: '',\n        phone: '',");

fs.writeFileSync(useAuthPath, useAuthCode);

const appNavbarPath = path.join(__dirname, 'src', 'components', 'AppNavbar.tsx');
let appNavbarCode = fs.readFileSync(appNavbarPath, 'utf8');
appNavbarCode = appNavbarCode.replace(/import \{ getGlowClass \} from '\.\.\/utils\/image';/, "import { getGlowClass } from '../utils/helpers';");
fs.writeFileSync(appNavbarPath, appNavbarCode);

const appSidebarPath = path.join(__dirname, 'src', 'components', 'AppSidebar.tsx');
let appSidebarCode = fs.readFileSync(appSidebarPath, 'utf8');
appSidebarCode = appSidebarCode.replace(/import \{ getGlowClass \} from '\.\.\/utils\/image';/, "import { getGlowClass } from '../utils/helpers';");
fs.writeFileSync(appSidebarPath, appSidebarCode);

// Fix ChatPolling empty return
const chatPollingPath = path.join(__dirname, 'src', 'hooks', 'useChatPolling.ts');
let chatPollingCode = fs.readFileSync(chatPollingPath, 'utf8');
chatPollingCode = chatPollingCode.replace(/if \(!user\) return;/, 'if (!user) return undefined;');
fs.writeFileSync(chatPollingPath, chatPollingCode);

console.log('Types fixed');
