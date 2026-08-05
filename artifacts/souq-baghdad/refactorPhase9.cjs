const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Add Imports
const importsToAdd = `
import { AppNavbar } from './components/AppNavbar';
import { AppSidebar } from './components/AppSidebar';
import { AppMobileMenu } from './components/AppMobileMenu';
`;
if (!appCode.includes('import { AppNavbar }')) {
  appCode = appCode.replace(/(import React, {.*?\} from 'react';)/s, `$1\n${importsToAdd}`);
}

// 2. Replace Navbar: <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b ... </nav>
appCode = appCode.replace(/<nav className=\{\`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 pwa-header shadow-md.*?<\/nav>/s, 
  `<AppNavbar 
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
      />`);

// 3. Replace Sidebar: <aside className={`hidden lg:flex flex-col w-64 fixed right-0 ... </aside>
appCode = appCode.replace(/<aside className=\{\`hidden lg:flex flex-col w-64 fixed right-0 top-16 bottom-0 z-30 border-l transition-colors duration-300 text-right.*?<\/aside>/s, 
  `<AppSidebar 
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
      />`);

// 4. Replace Mobile Menu: <AnimatePresence>\n {showMobileMenu && ... </AnimatePresence> (This might be tricky because there are two AnimatePresence blocks, one for Biometric which is already replaced, and one for MobileMenu)
appCode = appCode.replace(/<AnimatePresence>\s*\{showMobileMenu && \(\s*<div className="fixed inset-0 z-\[100\] lg:hidden">.*?<\/AnimatePresence>/s,
  `<AppMobileMenu 
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
        setEditingAd={setEditingAd} 
        setShowCreateProduct={setShowCreateProduct} 
        setEditingProduct={setEditingProduct} 
        handleLogout={handleLogout} 
        setShowAuth={setShowAuth} 
        setActiveDocTab={setActiveDocTab} 
      />`
);

fs.writeFileSync(appPath, appCode);
console.log('Phase 9 UI components extracted!');
