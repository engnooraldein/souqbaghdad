import React from 'react';
import { 
  Plus, Bell, LogIn, User, Search, Store, 
  Map, Bookmark, Home as HomeIcon
} from 'lucide-react';
import { User as UserType } from '../types';
import LiveVisitorCounter from './LiveVisitorCounter';

interface NavbarProps {
  user: UserType | null;
  unreadCount: number;
  view: string;
  onSetView: (view: 'home' | 'products' | 'transport' | 'profile' | 'saved') => void;
  onShowAuth: () => void;
  onShowPostAd: () => void;
  onShowNotifications: () => void;
  onShowSettings: () => void;
}

export function Navbar({
  user,
  unreadCount,
  view,
  onSetView,
  onShowAuth,
  onShowPostAd,
  onShowNotifications,
  onShowSettings
}: NavbarProps) {

  // Top Header (Desktop & Mobile)
  const renderTopHeader = () => (
    <header className="bg-[#031131]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40" dir="rtl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Right Side: Logo */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onSetView('home')} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex flex-col items-end">
              <h1 className="text-xl font-bold font-tajawal text-gradient whitespace-nowrap leading-tight">
                سوك بغداد
              </h1>
              <span className="text-[10px] text-[#BF9B30] tracking-widest font-semibold uppercase">SOUQ BAGHDAD</span>
            </div>
            <img 
              src="/logo_traced_hq.svg" 
              alt="سوك بغداد" 
              className="w-12 h-12 object-contain filter drop-shadow-[0_2px_8px_rgba(191,155,48,0.3)]" 
            />
          </div>
        </div>

        {/* Left Side: Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Wallet Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#BF9B30]/10 border border-[#BF9B30]/30 rounded-full text-[#BF9B30]">
                <span className="text-xs font-bold font-mono">204</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>

              {/* User Avatar */}
              <div 
                onClick={onShowSettings} 
                className="w-9 h-9 rounded-full bg-gray-800 border-2 border-[#BF9B30]/50 overflow-hidden cursor-pointer flex items-center justify-center shadow-lg shadow-[#BF9B30]/20"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#BF9B30] font-bold text-sm">{user.name.charAt(0)}</span>
                )}
              </div>

              {/* Notification Bell */}
              <button 
                onClick={onShowNotifications} 
                className="relative p-2 text-gray-300 hover:text-white rounded-full transition-colors"
                aria-label="الإشعارات"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#031131] animate-pulse"></span>
                )}
              </button>
            </>
          ) : (
            <button 
              onClick={onShowAuth} 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-[#BF9B30] to-[#E5C158] text-black rounded-xl font-bold hover:shadow-lg hover:shadow-[#BF9B30]/20 transition-all text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>دخول</span>
            </button>
          )}

          {/* Hamburger Menu */}
          <button className="p-2 text-gray-300 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );

  // Bottom Navigation (Mobile Only)
  const renderBottomNav = () => (
    <div className="fixed bottom-0 inset-x-0 bg-[#031131] border-t border-white/10 z-50 px-2 pb-safe md:hidden" dir="rtl">
      <div className="flex justify-between items-center h-16 relative">
        <button 
          onClick={() => onSetView('home')} 
          className={`flex flex-col items-center justify-center w-[20%] space-y-1 ${view === 'home' ? 'text-[#BF9B30]' : 'text-gray-500 hover:text-gray-400'}`}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold font-tajawal">الرئيسية</span>
        </button>
        
        <button 
          onClick={() => onSetView('transport')} 
          className={`flex flex-col items-center justify-center w-[20%] space-y-1 ${view === 'transport' ? 'text-[#BF9B30]' : 'text-gray-500 hover:text-gray-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            <circle cx="8" cy="16" r="1" fill="currentColor"/>
            <circle cx="16" cy="16" r="1" fill="currentColor"/>
          </svg>
          <span className="text-[10px] font-bold font-tajawal">الخطوط</span>
        </button>

        <div className="relative w-[20%] flex flex-col items-center justify-center h-full -mt-5">
          <button 
            onClick={onShowPostAd} 
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-t from-[#BF9B30] to-[#E5C158] text-[#031131] rounded-full shadow-[0_4px_15px_rgba(191,155,48,0.4)] active:scale-95 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </button>
          <span className="text-[10px] font-bold font-tajawal text-[#BF9B30] mt-1">إعلان</span>
        </div>

        <button 
          onClick={() => onSetView('products')} 
          className={`flex flex-col items-center justify-center w-[20%] space-y-1 ${view === 'products' ? 'text-[#BF9B30]' : 'text-gray-500 hover:text-gray-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-[10px] font-bold font-tajawal">المنتجات</span>
        </button>

        <button 
          onClick={() => onSetView(user ? 'profile' : 'saved')} 
          className={`flex flex-col items-center justify-center w-[20%] space-y-1 ${['profile', 'saved'].includes(view) ? 'text-[#BF9B30]' : 'text-gray-500 hover:text-gray-400'}`}
        >
          {user ? <User className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
          <span className="text-[10px] font-bold font-tajawal">{user ? 'حسابي' : 'محفوظات'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {renderTopHeader()}
      {renderBottomNav()}
    </>
  );
}