import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Monitor, Bell, Wallet, Crown, Settings, ShoppingBag, LogOut, LogIn, MessageSquare, Menu } from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';
import { getGlowClass, navigate } from '../utils/helpers';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface AppNavbarProps {
  isDarkMode: boolean;
  view: string;
  setView: (v: string) => void;
  cat: string;
  setCat: (c: string) => void;
  showThemeMenu: boolean;
  setShowThemeMenu: (s: boolean) => void;
  themeMode: 'light' | 'dark' | 'system';
  changeThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  user: User | null;
  setShowNotifs: (s: boolean) => void;
  notifications: any[];
  isOwner: boolean;
  isAdmin: boolean;
  setShowCreateProduct: (s: boolean) => void;
  setEditingProduct: (p: any) => void;
  handleLogout: () => void;
  setShowAuth: (s: boolean) => void;
  unreadChatCount: number;
  setShowMobileMenu: (s: boolean) => void;
  setShowSearchPage?: (s: boolean) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  isDarkMode,
  view,
  setView,
  cat,
  setCat,
  showThemeMenu,
  setShowThemeMenu,
  themeMode,
  changeThemeMode,
  user,
  setShowNotifs,
  notifications,
  isOwner,
  isAdmin,
  setShowCreateProduct,
  setEditingProduct,
  handleLogout,
  setShowAuth,
  unreadChatCount,
  setShowMobileMenu,
  setShowSearchPage
}) => {
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [isForcedOpen, setIsForcedOpen] = useState(false);

  const isCollapsed = !isAtTop && !isForcedOpen;

  useEffect(() => {
    // Re-collapse if user starts scrolling down again, or reset if at top
    if (isAtTop || scrollDirection === 'down') {
      setIsForcedOpen(false);
    }
  }, [isAtTop, scrollDirection]);

  return (
    <nav 
      className={`fixed z-40 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm ${
        isCollapsed 
          ? `top-[max(2.4rem,env(safe-area-inset-top,36px))] left-4 right-auto w-[48px] h-[48px] rounded-full border cursor-pointer overflow-hidden ${isDarkMode ? 'bg-black/60 border-white/10 shadow-lg shadow-black/50' : 'bg-white/70 border-slate-200/60 shadow-lg'}` 
          : `top-0 left-0 right-0 w-full h-[calc(52px+env(safe-area-inset-top,0px))] rounded-none border-b pwa-header overflow-visible ${isDarkMode ? 'bg-black/50 border-white/5 shadow-none' : 'bg-white/30 border-slate-200/50 shadow-sm'}`
      }`}
      onClick={() => {
        if (isCollapsed) setIsForcedOpen(true);
      }}
    >
      <div className={`w-full h-full transition-all duration-500 ${isCollapsed ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto delay-100'}`}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
          <button onClick={()=>{ setView('home'); setCat('general'); window.scrollTo(0,0); }} className="flex items-center gap-2">
            <Logo small/>
            <span className={`font-bold text-sm sm:text-lg transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>سوك بغداد</span>
          </button>
          <div className="hidden lg:flex flex-1 max-w-sm mx-6 items-center">
            <div 
              className="relative w-full cursor-pointer group" 
              onClick={()=>{ setShowSearchPage?.(true); }}
            >
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 transition-transform group-hover:scale-110"/>
              <input 
                placeholder="ابحث في الإعلانات والأقسام..." 
                readOnly 
                className={`w-full rounded-2xl py-2 pr-10 pl-4 border outline-none text-xs cursor-pointer transition-all shadow-sm ${
                  isDarkMode 
                    ? 'bg-gray-800/90 text-white placeholder-gray-400 border-gray-700 hover:border-amber-500/50' 
                    : 'bg-slate-100/90 text-slate-800 placeholder-slate-400 border-slate-200 hover:border-amber-500/50'
                }`}
              />
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)} 
                className={`p-2 rounded-xl border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                title="تغيير المظهر"
                aria-label="تغيير المظهر"
              >
                {themeMode === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : themeMode === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Monitor className="w-5 h-5 text-purple-400" />}
              </button>
              {showThemeMenu && (
                <div className={`absolute left-0 mt-2 w-32 rounded-xl shadow-xl border p-1 z-50 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' : 'bg-white border-slate-100 text-slate-800 shadow-slate-100'}`}>
                  <button onClick={() => changeThemeMode('light')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${themeMode === 'light' ? 'text-amber-500 bg-amber-500/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                    <Sun className="w-4 h-4" /> فاتح
                  </button>
                  <button onClick={() => changeThemeMode('dark')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${themeMode === 'dark' ? 'text-blue-400 bg-blue-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                    <Moon className="w-4 h-4" /> داكن
                  </button>
                  <button onClick={() => changeThemeMode('system')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${themeMode === 'system' ? 'text-purple-400 bg-purple-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                    <Monitor className="w-4 h-4" /> تلقائي
                  </button>
                </div>
              )}
            </div>
            {user?(
              <>
                <button onClick={()=>setShowNotifs(true)} className={`p-2 rounded-xl relative transition-colors ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} title="الإشعارات" aria-label="الإشعارات">
                  <Bell className="w-5 h-5"/>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setView('wallet')} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700 hover:border-amber-500/50' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-amber-500/50'}`} title="محفظتي">
                  <Wallet className="w-4 h-4 text-emerald-400"/>
                  <span className="font-bold font-mono">{user.points || 0}</span>
                </button>
                {isOwner&&<button onClick={()=>setView('owner')} className={`p-2 rounded-xl text-amber-400 hover:bg-amber-500/20 ${view==='owner'?'bg-amber-500/20':''}`} title="لوحة المالك" aria-label="لوحة المالك"><Crown className="w-5 h-5"/></button>}
                {isAdmin&&<button onClick={()=>setView('admin')} className={`p-2 rounded-xl text-red-400 hover:bg-red-500/20 ${view==='admin'?'bg-red-500/20':''}`} title="لوحة الإدارة" aria-label="لوحة الإدارة"><Settings className="w-5 h-5"/></button>}
                <button onClick={()=>{setShowCreateProduct(true);setEditingProduct(null);}}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700">
                  <ShoppingBag className="w-4 h-4"/> منتج</button>
                <button onClick={() => navigate('/profile')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':(isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200')}`}>
                  <img src={user.avatar} alt="" className={`w-6 h-6 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-600'}`}/>
                  <span className="max-w-20 truncate">{user.name}</span>{isOwner&&<Crown className="w-3 h-3 text-amber-400"/>}</button>
                <button onClick={handleLogout} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20" title="تسجيل الخروج" aria-label="تسجيل الخروج"><LogOut className="w-5 h-5"/></button>
              </>
            ):(
              <>
                <button onClick={()=>setShowAuth(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white font-bold rounded-xl text-sm hover:bg-gray-700"><LogIn className="w-4 h-4"/> تسجيل الدخول</button>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 lg:hidden">

            <div className="relative">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)} 
                className="p-1.5 rounded-xl bg-gray-800 text-white hover:bg-gray-700"
                title="تغيير المظهر"
                aria-label="تغيير المظهر"
              >
                {themeMode === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : themeMode === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Monitor className="w-4 h-4 text-purple-400" />}
              </button>
              {showThemeMenu && (
                <div className={`absolute left-0 mt-2 w-28 rounded-xl shadow-xl border p-1 z-50 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' : 'bg-white border-slate-100 text-slate-800 shadow-slate-100'}`}>
                  <button onClick={() => changeThemeMode('light')} className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${themeMode === 'light' ? 'text-amber-500 bg-amber-500/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                    <Sun className="w-3.5 h-3.5" /> فاتح
                  </button>
                  <button onClick={() => changeThemeMode('dark')} className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${themeMode === 'dark' ? 'text-blue-400 bg-blue-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                    <Moon className="w-3.5 h-3.5" /> داكن
                  </button>
                  <button onClick={() => changeThemeMode('system')} className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${themeMode === 'system' ? 'text-purple-400 bg-purple-400/10' : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100')}`}>
                    <Monitor className="w-3.5 h-3.5" /> تلقائي
                  </button>
                </div>
              )}
            </div>
            {/* Dark mode toggle mobile */}
            {user ? (
              <>
                <button onClick={() => setView('wallet')} className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 text-white rounded-xl text-xs border border-gray-700" title="محفظتي">
                  <Wallet className="w-3 h-3 text-emerald-400"/>
                  <span className="font-bold font-mono">{user.points || 0}</span>
                </button>
                <button onClick={() => navigate('/profile')} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs border ${view==='profile'?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-gray-800 border-gray-700 text-white'}`}>
                  <img src={user.avatar} alt="" className={`w-5.5 h-5.5 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-650'}`}/>
                  <span className="max-w-16 truncate hidden sm:block">{user.name}</span>
                </button>
              </>
            ) : (
              <button onClick={()=>setShowAuth(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 text-white font-bold rounded-xl text-xs hover:bg-gray-700">
                <LogIn className="w-3.5 h-3.5"/> <span>دخول</span>
              </button>
            )}
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: {} }))} className="p-1.5 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative" title="المحادثات" aria-label="المحادثات">
              <MessageSquare className="w-4 h-4"/>
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full text-[9px] text-black font-extrabold flex items-center justify-center animate-bounce">
                  {unreadChatCount > 9 ? '+9' : unreadChatCount}
                </span>
              )}
            </button>
            <button onClick={()=>setShowNotifs(true)} className="p-1.5 rounded-xl bg-gray-800 text-white hover:bg-gray-700 relative" title="الإشعارات" aria-label="الإشعارات">
              <Bell className="w-4 h-4"/>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <button onClick={()=>setShowMobileMenu(true)} className="p-1.5 rounded-xl bg-gray-800 text-white" title="القائمة" aria-label="القائمة"><Menu className="w-4.5 h-4.5"/></button>
          </div>
          </div>
        </div>
      </div>

      {/* Collapsed FAB Profile / Menu */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isCollapsed ? 'opacity-100 scale-100 pointer-events-auto delay-100' : 'opacity-0 scale-125 pointer-events-none'}`}>
        {user ? (
          <img src={user.avatar} alt="" className={`w-8 h-8 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-650'}`} />
        ) : (
          <Menu className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`} />
        )}
      </div>
    </nav>
  );
};
