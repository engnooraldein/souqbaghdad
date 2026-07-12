import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Search, User, Heart, Bell, Plus, ChevronDown, Car, Home, Smartphone, Watch, ShoppingBag, Video, Store, MessageCircle } from 'lucide-react';
import { IraqiEagle } from './Icons';

interface NavbarProps {
  onCategoryClick?: (category: string) => void;
}

export function Navbar({ onCategoryClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { id: 'cars', name: 'السيارات', icon: Car, color: 'bg-blue-500' },
    { id: 'real-estate', name: 'العقارات', icon: Home, color: 'bg-green-500' },
    { id: 'phones', name: 'الهواتف', icon: Smartphone, color: 'bg-purple-500' },
    { id: 'electronics', name: 'الإلكترونيات', icon: Watch, color: 'bg-orange-500' },
    { id: 'products', name: 'المنتجات', icon: ShoppingBag, color: 'bg-pink-500' },
    { id: 'videos', name: 'الفيديوهات', icon: Video, color: 'bg-red-500' },
    { id: 'stores', name: 'المتاجر', icon: Store, color: 'bg-yellow-500' },
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Main Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-gray-900/95 backdrop-blur-lg shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center shadow-lg golden-glow">
                <IraqiEagle className="w-8 h-8" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">سوك بغداد</h1>
                <p className="text-xs text-amber-400">السوق الرقمي العراقي</p>
              </div>
            </motion.div>

            {/* Desktop Search */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن أي شيء..."
                  className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-3 pr-12 pl-4 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-3 rounded-xl bg-gray-800 text-amber-400 hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              {/* Favorites */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs text-black flex items-center justify-center">5</span>
              </motion.button>

              {/* Messages */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>

              {/* Post Ad Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>رفع إعلان</span>
              </motion.button>

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-white font-semibold">أحمد محمد</p>
                        <p className="text-gray-400 text-sm">ahmed@email.com</p>
                      </div>
                      <div className="p-2">
                        <button className="w-full text-right px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                          حسابي
                        </button>
                        <button className="w-full text-right px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                          إعلاناتي
                        </button>
                        <button className="w-full text-right px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                          المفضلة
                        </button>
                        <button className="w-full text-right px-4 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
                          تسجيل الخروج
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-3 rounded-xl bg-gray-800 text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-gray-900 z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center">
                      <IraqiEagle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">سوك بغداد</h2>
                      <p className="text-xs text-amber-400">السوق الرقمي العراقي</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-gray-800 text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* User Card */}
                <div className="bg-gray-800 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">أحمد محمد</h3>
                      <p className="text-gray-400 text-sm">ahmed@email.com</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">12</p>
                      <p className="text-xs text-gray-400">إعلان</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">45</p>
                      <p className="text-xs text-gray-400">مفضلة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">8</p>
                      <p className="text-xs text-gray-400">رسالة</p>
                    </div>
                  </div>
                </div>

                {/* Post Ad Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl mb-6"
                >
                  <Plus className="w-6 h-6" />
                  <span>رفع إعلان جديد</span>
                </motion.button>

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="text-gray-400 text-sm mb-4 font-semibold">الأقسام</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        <div className={`w-10 h-10 ${category.color} rounded-xl flex items-center justify-center`}>
                          <category.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-medium">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="border-t border-gray-800 pt-6">
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                      {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
                    </div>
                    <span className="text-white font-medium">{isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}