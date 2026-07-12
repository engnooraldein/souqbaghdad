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
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40" dir="rtl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onSetView('home')} 
            className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Store className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-amber-200 cursor-pointer" onClick={() => onSetView('home')}>
              سوق بغداد
            </h1>
            <p className="text-[10px] text-gray-400 -mt-1 hidden sm:block">السوق الرقمي العراقي</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LiveVisitorCounter />
          
          <button 
            onClick={onShowPostAd} 
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-amber-500 to-amber-400 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>أضف إعلانك</span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={onShowNotifications} 
                className="relative p-2 text-gray-400 hover:text-white bg-gray-800 rounded-xl transition-colors"
                title="الإشعارات"
                aria-label="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-gray-900 animate-pulse">
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>
              
              <div 
                onClick={onShowSettings} 
                className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden cursor-pointer flex items-center justify-center"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-amber-500 font-bold text-lg">{user.name.charAt(0)}</span>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={onShowAuth} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>دخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );

  // Bottom Navigation (Mobile Only)
  const renderBottomNav = () => (
    <div className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 z-50 px-2 pb-safe md:hidden" dir="rtl">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => onSetView('home')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'home' ? 'text-amber-500' : 'text-gray-500 hover:text-gray-400'}`}
          title="الرئيسية"
          aria-label="الرئيسية"
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium">الرئيسية</span>
        </button>
        
        <button 
          onClick={() => onSetView('products')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'products' ? 'text-amber-500' : 'text-gray-500 hover:text-gray-400'}`}
          title="المنتجات"
          aria-label="المنتجات"
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">المنتجات</span>
        </button>

        <div className="relative w-full h-full flex justify-center -mt-6">
          <button 
            onClick={onShowPostAd} 
            className="absolute flex items-center justify-center w-12 h-12 bg-amber-500 text-black rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
            title="أضف إعلانك"
            aria-label="أضف إعلانك"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <button 
          onClick={() => onSetView('transport')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'transport' ? 'text-amber-500' : 'text-gray-500 hover:text-gray-400'}`}
          title="الخطوط"
          aria-label="الخطوط"
        >
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-medium">الخطوط</span>
        </button>

        <button 
          onClick={() => onSetView(user ? 'profile' : 'saved')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${['profile', 'saved'].includes(view) ? 'text-amber-500' : 'text-gray-500 hover:text-gray-400'}`}
          title={user ? 'حسابي' : 'المحفوظات'}
          aria-label={user ? 'حسابي' : 'المحفوظات'}
        >
          {user ? <User className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
          <span className="text-[10px] font-medium">{user ? 'حسابي' : 'محفوظات'}</span>
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
