import React from 'react';
import { Home, Search, ShoppingBag, Car, User as UserIcon, Wallet, Crown, Settings, Info, Shield, Lock, Mail, Sparkles, LogIn, MessageSquare, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import { getGlowClass } from '../utils/helpers';

interface AppSidebarProps {
  isDarkMode: boolean;
  user: User | null;
  isOwner: boolean;
  isAdmin: boolean;
  view: string;
  setView: (v: string) => void;
  cat: string;
  setCat: (c: string) => void;
  setBottomNavActive: (v: string) => void;
  unreadChatCount: number;
  activeDocTab: string;
  setActiveDocTab: (t: string) => void;
  toggleDarkMode: () => void;
  setShowAuth: (s: boolean) => void;
  handleHomeRefresh: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isDarkMode,
  user,
  isOwner,
  isAdmin,
  view,
  setView,
  cat,
  setCat,
  setBottomNavActive,
  unreadChatCount,
  activeDocTab,
  setActiveDocTab,
  toggleDarkMode,
  setShowAuth,
  handleHomeRefresh
}) => {
  return (
    <aside className={`hidden lg:flex flex-col w-64 fixed right-0 top-16 bottom-0 z-30 border-l transition-colors duration-300 text-right ${
      isDarkMode ? 'bg-[black]/95 border-gray-800/80 text-white' : 'bg-white border-slate-200 text-slate-800'
    }`} dir="rtl">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* User Profile Card */}
        {user ? (
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-gray-800/40 border-gray-700/60' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt={user.name} className={`w-10 h-10 rounded-full object-cover ${user.role && user.role !== 'user' ? getGlowClass(user.role) : 'border border-gray-650'}`}/>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-sm truncate text-white">{user.name}</p>
                  {isOwner && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0"/>}
                </div>
                <button onClick={() => setView('wallet')} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-black flex items-center gap-1 mt-0.5 transition-colors cursor-pointer">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{user.points || 0} نقطة (محفظتي)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer">
            <LogIn className="w-4.5 h-4.5"/> 
            <span>تسجيل الدخول</span>
          </button>
        )}

        {/* Core App Navigation */}
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider pr-3 mb-2">القائمة الرئيسية</p>
          
          <button onClick={handleHomeRefresh} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            view === 'home' && cat === 'general'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 font-black' 
              : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Home className="w-4.5 h-4.5"/>
            <span>الرئيسية (العرض العام)</span>
          </button>

          <button onClick={() => { setView('home'); setCat('all'); setBottomNavActive('home'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            view === 'home' && cat === 'all'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black' 
              : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Search className="w-4.5 h-4.5 text-amber-400"/>
            <span>البحث والأقسام</span>
          </button>

          <button onClick={() => { setView('products'); setBottomNavActive('products'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            view === 'products' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-650/25' 
              : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <ShoppingBag className="w-4.5 h-4.5"/>
            <span>المتجر الإلكتروني</span>
          </button>

          <button onClick={() => { setView('transport'); setBottomNavActive('transport'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            view === 'transport' 
              ? 'bg-gray-800 text-white' 
              : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Car className="w-4.5 h-4.5"/>
            <span>خطوط النقل والتوصيل</span>
          </button>

          {user && (
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: {} }))} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4.5 h-4.5 text-amber-400"/>
                <span>المحادثات والرسائل</span>
              </div>
              {unreadChatCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-extrabold rounded-full animate-pulse">
                  {unreadChatCount} جديد
                </span>
              )}
            </button>
          )}

          {user && (
            <button onClick={() => { setView('profile'); setBottomNavActive('profile'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              view === 'profile' && !window.location.hash.includes('/wallet')
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' 
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <UserIcon className="w-4.5 h-4.5 text-gray-400"/>
              <span>صفحتي الشخصية</span>
            </button>
          )}

          {user && (
            <button onClick={() => { setBottomNavActive('profile'); setView('wallet'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              view === 'profile' && window.location.hash.includes('/wallet')
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Wallet className="w-4.5 h-4.5 text-emerald-400"/>
              <span>محفظتي وإعادة الشحن</span>
            </button>
          )}

          {isOwner && (
            <button onClick={() => { setView('owner'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              view === 'owner' 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Crown className="w-4.5 h-4.5 text-amber-400"/>
              <span>لوحة تحكم المالك</span>
            </button>
          )}

          {isAdmin && !isOwner && (
            <button onClick={() => { setView('admin'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              view === 'admin' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}>
              <Settings className="w-4.5 h-4.5 text-red-400"/>
              <span>لوحة تحكم الإدارة</span>
            </button>
          )}
        </div>

        <hr className={isDarkMode ? 'border-gray-800/60' : 'border-slate-100'} />

        {/* Info and Policy Links inside Sidebar */}
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider pr-3 mb-2">معلومات وسياسات المنصة</p>
          
          <button onClick={() => { setActiveDocTab('من نحن'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeDocTab === 'من نحن' 
              ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
              : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Info className="w-4 h-4 text-amber-500"/>
            <span>من نحن؟</span>
          </button>

          <button onClick={() => { setActiveDocTab('الشروط والأحكام'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeDocTab === 'الشروط والأحكام' 
              ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
              : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Shield className="w-4 h-4 text-amber-500"/>
            <span>الشروط والأحكام</span>
          </button>

          <button onClick={() => { setActiveDocTab('سياسة الخصوصية'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeDocTab === 'سياسة الخصوصية' 
              ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
              : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Lock className="w-4 h-4 text-amber-500"/>
            <span>سياسة الخصوصية</span>
          </button>

          <button onClick={() => { setActiveDocTab('تواصل معنا'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeDocTab === 'تواصل معنا' 
              ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
              : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Mail className="w-4 h-4 text-amber-500"/>
            <span>تواصل معنا</span>
          </button>

          <button onClick={() => { setActiveDocTab('سجل التحديثات'); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeDocTab === 'سجل التحديثات' 
              ? 'bg-amber-500/10 text-amber-400 font-black border border-amber-500/25' 
              : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
          }`}>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse"/>
            <span>سجل التحديثات (v1.9.0)</span>
          </button>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-850' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between">
          <button onClick={toggleDarkMode} className={`p-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
            isDarkMode ? 'bg-gray-850 border-gray-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-indigo-600'
          }`} title="تبديل الوضع">
            {isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
          </button>
          <span className="text-[10px] text-gray-500 font-mono">سوك بغداد v1.9.0</span>
        </div>
      </div>
    </aside>
  );
};
