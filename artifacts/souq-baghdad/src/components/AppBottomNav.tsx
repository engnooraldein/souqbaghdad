import React from 'react';
import { Home, Search, ShoppingBag, Car, UserCircle, Plus } from 'lucide-react';
import { User } from '../types';

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
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/30 dark:bg-black/50 backdrop-blur-2xl backdrop-saturate-150 border-t border-slate-200/50 dark:border-white/10 lg:hidden pwa-bottom-nav transition-colors duration-300">
      <div className="flex items-center justify-around h-16 px-2">
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
          <div className={`p-3 rounded-full -mt-6 shadow-lg transition-transform group-active:scale-95 ${view === 'transport' ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30' : 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-amber-500/30'}`}>
            <Plus className="w-6 h-6 text-black" />
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
    </nav>
  );
};
