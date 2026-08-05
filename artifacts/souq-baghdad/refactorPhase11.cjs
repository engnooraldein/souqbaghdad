const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Clean up imports from lines 1 to 100
const cleanImports = `import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LoadingScreen } from './components/LoadingScreen';
import { Toast } from './components/Toast';

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
import { Lock } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';

`;

const appStartTarget = `// ─────────────────────────────────────────────
// Utilities`;

if (appCode.includes(appStartTarget)) {
  const index = appCode.indexOf(appStartTarget);
  appCode = cleanImports + appCode.substring(index);
}

// 2. Inject useAuth
if (!appCode.includes('useAuth();')) {
  appCode = appCode.replace(
    /export default function App\(\) \{\s*/,
    `export default function App() {\n  const { user, setUser, session, handleLogout: authHandleLogout } = useAuth();\n  `
  );
}

// 3. Replace the Biometric lock screen block
// Since Regex was causing issues, I'll use substring replacement.
const startBio = "if (isBiometricLocked) {";
const endBio = "تسجيل الخروج\n      </button>\n    </div>\n  );\n}";

if (appCode.includes(startBio) && appCode.includes(endBio)) {
  const startIndex = appCode.indexOf(startBio);
  const endIndex = appCode.indexOf(endBio) + endBio.length;
  appCode = appCode.substring(0, startIndex) + `if (isBiometricLocked) {
    return <BiometricLockScreen isDarkMode={isDarkMode} setIsBiometricLocked={setIsBiometricLocked} />;
  }` + appCode.substring(endIndex);
}

fs.writeFileSync(appPath, appCode);
console.log('Phase 11: Imports cleaned and BiometricLockScreen extracted!');
