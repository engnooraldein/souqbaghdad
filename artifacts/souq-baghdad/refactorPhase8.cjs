const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Add Imports
const importsToAdd = `
import { AppBottomNav } from './components/AppBottomNav';
import { AppBiometricBanner } from './components/AppBiometricBanner';
import { AppFooter } from './components/AppFooter';
`;
if (!appCode.includes('import { AppBottomNav }')) {
  appCode = appCode.replace(/(import React, {.*?\} from 'react';)/s, `$1\n${importsToAdd}`);
}

// 2. Replace the `<footer className="bg-[black] ...` to `</footer>` with `<AppFooter setActiveDocTab={setActiveDocTab} setView={setView} />`
appCode = appCode.replace(/<footer className="bg-\[black\].*?<\/footer>/s, `<AppFooter setActiveDocTab={setActiveDocTab} setView={setView} />`);

// 3. Replace the `<nav className="fixed bottom-0 ... pwa-bottom-nav">` to `</nav>` with `<AppBottomNav ... />`
appCode = appCode.replace(/<nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950\/75 backdrop-blur-2xl border-t border-gray-800\/60 lg:hidden pwa-bottom-nav">.*?<\/nav>/s, 
  `<AppBottomNav 
        user={user} 
        bottomNavActive={bottomNavActive} 
        setBottomNavActive={setBottomNavActive} 
        setView={setView} 
        requireAuth={requireAuth} 
        setShowCreateAd={setShowCreateAd} 
        handleHomeRefresh={handleHomeRefresh} 
        cat={cat} 
      />`);

// 4. Replace the Biometric Banner `<AnimatePresence>\n      {showBiometricBanner && (` to `</AnimatePresence>` right before `<GlobalModals`
appCode = appCode.replace(/<AnimatePresence>\s*\{showBiometricBanner && \(\s*<motion\.div.*?<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/s,
  `<AppBiometricBanner 
        showBiometricBanner={showBiometricBanner} 
        setShowBiometricBanner={setShowBiometricBanner} 
        playNotificationSound={playNotificationSound} 
      />`
);

fs.writeFileSync(appPath, appCode);
console.log('Phase 8 basic UI components extracted!');
