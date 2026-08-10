import React, { useState, useEffect } from 'react';
import { Home, Search, ShoppingBag, Car, UserCircle, Plus } from 'lucide-react';
import { User } from '../types';

import { useScrollDirection } from '../hooks/useScrollDirection';

interface AppBottomNavProps {
  user: User | null;
  bottomNavActive: string;
  setBottomNavActive: (view: string) => void;
  setView: (view: string) => void;
  requireAuth: () => void;
  setShowCreateAd: (show: boolean) => void;
  setShowCreateTransport?: (show: boolean) => void;
  view?: string;
  handleHomeRefresh: () => void;
  cat: string;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  user,
  bottomNavActive,
  setBottomNavActive,
  setView,
  requireAuth,
  setShowCreateAd,
  setShowCreateTransport,
  view,
  handleHomeRefresh,
  cat,
}) => {
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [isForcedOpen, setIsForcedOpen] = useState(false);

  const isCollapsed = !isAtTop && !isForcedOpen;

  useEffect(() => {
    if (isAtTop || scrollDirection === 'down') {
      setIsForcedOpen(false);
    }
  }, [isAtTop, scrollDirection]);

  return (
    <nav 
      className={`fixed z-40 bg-white/30 dark:bg-black/50 backdrop-blur-2xl backdrop-saturate-150 border-slate-200/50 dark:border-white/10 lg:hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl ${
        isCollapsed 
          ? 'bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[calc(50%-30px)] right-[calc(50%-30px)] h-[60px] rounded-full border cursor-pointer overflow-hidden' 
          : 'bottom-0 left-0 right-0 h-[calc(64px+env(safe-area-inset-bottom,0px))] rounded-none border-t pwa-bottom-nav overflow-visible'
      }`}
      onClick={() => {
        if (isCollapsed) setIsForcedOpen(true);
      }}
    >
      {/* Full Expanded Bar */}
      <div className={`absolute inset-0 flex items-center justify-around px-2 transition-all duration-500 ${isCollapsed ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto delay-100'}`}>
        {/* Profile */}
        <button
          onClick={() => {
            if (!user) {
              requireAuth();
            } else {
              setBottomNavActive('profile');
              setView('profile');
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'profile' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${bottomNavActive === 'profile' ? 'bg-purple-500/15 dark:bg-purple-500/20' : ''}`}>
            <UserCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">حسابي</span>
        </button>

        {/* Products */}
        <button
          onClick={() => { setBottomNavActive('products'); setView('products'); }}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'products' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${bottomNavActive === 'products' ? 'bg-amber-500/15 dark:bg-amber-500/20' : ''}`}>
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">المنتجات</span>
        </button>

        {/* Create Ad / Transport */}
        <button
          onClick={() => {
            if (!user) {
              requireAuth();
            } else {
              if (view === 'transport' && setShowCreateTransport) {
                setBottomNavActive('create-transport');
                setShowCreateTransport(true);
              } else {
                setBottomNavActive('create-ad');
                setShowCreateAd(true);
              }
            }
          }}
          className="flex flex-col items-center justify-center flex-1 py-2 relative group"
        >
          <div className={`p-3.5 rounded-full -mt-7 shadow-xl border-[4px] border-slate-50 dark:border-gray-950 transition-all duration-300 group-hover:scale-105 group-active:scale-95 ${view === 'transport' ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-emerald-500/40' : 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/40'}`}>
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className={`text-[10px] mt-1 font-medium ${view === 'transport' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {view === 'transport' ? 'إضافة خط' : 'إعلان'}
          </span>
          {view === 'transport' && (
            <span className="absolute -top-7 right-1 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse border border-white/20 whitespace-nowrap">جديد</span>
          )}
        </button>

        {/* Transport */}
        <button
          onClick={() => { setBottomNavActive('transport'); setView('transport'); }}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'transport' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${bottomNavActive === 'transport' ? 'bg-emerald-500/15 dark:bg-emerald-500/20' : ''}`}>
            <Car className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">الخطوط</span>
        </button>

        {/* Home */}
        <button
          onClick={handleHomeRefresh}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'home' && cat === 'general' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${bottomNavActive === 'home' && cat === 'general' ? 'bg-amber-500/15 dark:bg-amber-500/20' : ''}`}>
            <Home className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
        </button>
      </div>

      {/* Collapsed FAB (Only visible when collapsed) */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isCollapsed ? 'opacity-100 scale-100 pointer-events-auto delay-100' : 'opacity-0 scale-125 pointer-events-none'}`}>
        <button className="p-3 text-amber-600 dark:text-amber-400 flex flex-col items-center">
           <Home className="w-7 h-7" />
        </button>
      </div>
    </nav>
  );
};
