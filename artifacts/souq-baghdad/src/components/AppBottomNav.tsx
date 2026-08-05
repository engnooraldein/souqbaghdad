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
  handleHomeRefresh,
  cat,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/75 backdrop-blur-2xl border-t border-gray-800/60 lg:hidden pwa-bottom-nav">
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
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'profile' ? 'text-purple-400' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl ${bottomNavActive === 'profile' ? 'bg-purple-500/20' : ''}`}>
            <UserCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">حسابي</span>
        </button>

        {/* Products */}
        <button
          onClick={() => { setBottomNavActive('products'); setView('products'); }}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'products' ? 'text-gray-400' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl ${bottomNavActive === 'products' ? 'bg-amber-500/20' : ''}`}>
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">المنتجات</span>
        </button>

        {/* Create Ad */}
        <button
          onClick={() => {
            if (!user) {
              requireAuth();
            } else {
              setBottomNavActive('create-ad');
              setShowCreateAd(true);
            }
          }}
          className="flex flex-col items-center justify-center flex-1 py-2"
        >
          <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full -mt-6 shadow-lg shadow-amber-500/30">
            <Plus className="w-6 h-6 text-black" />
          </div>
          <span className="text-[10px] mt-1 font-medium text-amber-400">إعلان</span>
        </button>

        {/* Transport */}
        <button
          onClick={() => { setBottomNavActive('transport'); setView('transport'); }}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'transport' ? 'text-emerald-400' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl ${bottomNavActive === 'transport' ? 'bg-emerald-500/20' : ''}`}>
            <Car className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">الخطوط</span>
        </button>

        {/* Home */}
        <button
          onClick={handleHomeRefresh}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${bottomNavActive === 'home' && cat === 'general' ? 'text-amber-400' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl ${bottomNavActive === 'home' && cat === 'general' ? 'bg-amber-500/20' : ''}`}>
            <Home className="w-6 h-6" />
          </div>
          <span className="text-[10px] mt-1 font-medium">الرئيسية</span>
        </button>
      </div>
    </nav>
  );
};
