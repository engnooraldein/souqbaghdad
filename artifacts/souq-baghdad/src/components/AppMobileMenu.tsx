import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, ShoppingBag, Car, User as UserIcon, Wallet, Crown, Settings, LogOut, LogIn, Plus, Info, X, Sun, Moon } from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';

interface AppMobileMenuProps {
  showMobileMenu: boolean;
  setShowMobileMenu: (s: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  user: User | null;
  isOwner: boolean;
  isAdmin: boolean;
  handleHomeRefresh: () => void;
  setView: (v: string) => void;
  setCat: (c: string) => void;
  setShowCreateAd: (s: boolean) => void;
  setShowCreateTransport?: (s: boolean) => void;
  view?: string;
  setEditingAd: (a: any) => void;
  setShowCreateProduct: (s: boolean) => void;
  setEditingProduct: (p: any) => void;
  handleLogout: () => void;
  setShowAuth: (s: boolean) => void;
  setActiveDocTab: (t: string) => void;
}

export const AppMobileMenu: React.FC<AppMobileMenuProps> = ({
  showMobileMenu,
  setShowMobileMenu,
  isDarkMode,
  toggleDarkMode,
  user,
  isOwner,
  isAdmin,
  handleHomeRefresh,
  setView,
  setCat,
  setShowCreateAd,
  setShowCreateTransport,
  view,
  setEditingAd,
  setShowCreateProduct,
  setEditingProduct,
  handleLogout,
  setShowAuth,
  setActiveDocTab
}) => {
  return (
    <AnimatePresence>
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowMobileMenu(false)}
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`absolute right-0 top-0 bottom-0 w-72 p-5 pb-24 overflow-y-auto border-l text-right flex flex-col justify-between ${
              isDarkMode ? 'bg-[black] border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
            dir="rtl"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <Logo small />
                <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-gray-800/10 hover:bg-gray-800/20 rounded-xl" title="إغلاق" aria-label="إغلاق">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <button onClick={() => { handleHomeRefresh(); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                  <Home className="w-5 h-5 text-amber-500" /> الرئيسية (العرض العام)
                </button>
                <button onClick={() => { setView('home'); setCat('all'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                  <Search className="w-5 h-5 text-amber-400" /> البحث والأقسام
                </button>
                <button onClick={() => { setView('products'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                  <ShoppingBag className="w-5 h-5" /> المنتجات
                </button>
                <button onClick={() => { setView('transport'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                  <Car className="w-5 h-5" /> خطوط النقل والتوصيل
                </button>
              </div>

              <hr className="my-4 border-gray-800/20" />

              {user ? (
                <div className="space-y-1">
                  <button onClick={() => { 
                      if (view === 'transport' && setShowCreateTransport) {
                        setShowCreateTransport(true);
                      } else {
                        setShowCreateAd(true);
                        setEditingAd(null);
                      }
                      setShowMobileMenu(false); 
                    }} 
                    className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-sm ${view === 'transport' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5" /> {view === 'transport' ? 'نشر خط نقل' : 'رفع إعلان'}
                    </div>
                    {view === 'transport' && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">مجاناً</span>}
                  </button>
                  <button onClick={() => { setShowCreateProduct(true); setEditingProduct(null); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-600 text-white font-bold text-sm">
                    <ShoppingBag className="w-5 h-5" /> إضافة منتج
                  </button>
                  <button onClick={() => { setView('profile'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-sm font-bold">
                    <UserIcon className="w-5 h-5 text-gray-400" /> ملفي الشخصي
                  </button>
                  {isOwner && (
                    <button onClick={() => { setView('owner'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-amber-400 text-sm font-bold">
                      <Crown className="w-5 h-5" /> لوحة تحكم المالك
                    </button>
                  )}
                  {isAdmin && !isOwner && (
                    <button onClick={() => { setView('admin'); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/10 text-red-400 text-sm font-bold">
                      <Settings className="w-5 h-5" /> لوحة تحكم الإدارة
                    </button>
                  )}
                  <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 text-sm font-bold">
                    <LogOut className="w-5 h-5" /> تسجيل الخروج
                  </button>
                </div>
              ) : (
                <button onClick={() => { setShowAuth(true); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800 text-white font-bold text-sm">
                  <LogIn className="w-5 h-5" /> تسجيل الدخول
                </button>
              )}

              <hr className="my-4 border-gray-800/20" />

              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider pr-3 mb-2">معلومات وسياسات المنصة</p>
                {['من نحن', 'الشروط والأحكام', 'سياسة الخصوصية', 'تواصل معنا', 'سجل التحديثات'].map((item) => (
                  <button key={item} onClick={() => { setActiveDocTab(item); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs hover:bg-gray-800/10 font-bold">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Menu Footer */}
            <div className="pt-4 border-t border-gray-800/20 flex items-center justify-between">
              <button onClick={toggleDarkMode} className="p-2 rounded-xl border flex items-center justify-center">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <span className="text-[10px] text-gray-500 font-mono">سوك بغداد v1.9.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
