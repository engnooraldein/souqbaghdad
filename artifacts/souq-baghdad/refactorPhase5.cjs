const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appFilePath, 'utf8');

// The hooks imports
const hooksImports = `
import { useChatPolling } from './hooks/useChatPolling';
import { useBiometric } from './hooks/useBiometric';
import { useAppTheme } from './hooks/useAppTheme';
import { useNativeNotifications } from './hooks/useNativeNotifications';
`;

// Insert imports if they don't exist
if (!appContent.includes('import { useChatPolling }')) {
  appContent = appContent.replace(
    /import \{ useAdActions \} from '.\/hooks\/useAdActions';/,
    `import { useAdActions } from './hooks/useAdActions';\n${hooksImports}`
  );
}

// Strip out the state definitions and useEffects that we extracted
// We'll replace the beginning of the App component up to `const [showScrollButtons`

// Target this block exactly:
const startTarget = `  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {`;
const endTarget = `  const [showScrollButtons, setShowScrollButtons] = useState(true);`;

const startIndex = appContent.indexOf(startTarget);
const endIndex = appContent.indexOf(endTarget);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `
  const playNotificationSound = useSound();
  const { themeMode, isDarkMode, showThemeMenu, setShowThemeMenu, changeThemeMode, toggleDarkMode } = useAppTheme();
  const { isBiometricLocked, showBiometricBanner, setShowBiometricBanner, setIsBiometricLocked } = useBiometric(user, playNotificationSound);
  const { showChatModal, setShowChatModal, activeChatId, setActiveChatId, unreadChatCount, chatViewport } = useChatPolling(user, playNotificationSound);
  
  useNativeNotifications(user);

`;

  appContent = appContent.substring(0, startIndex) + replacement + appContent.substring(endIndex);
}

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log('Refactored App.tsx hooks!');
