import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, ArrowRight, SlidersHorizontal, MapPin, 
  Tag, Clock, Sparkles, ChevronDown, ChevronUp,
  Car, Home, Smartphone, Laptop, Sofa, Shirt, Briefcase, Wrench, PawPrint, Coffee, Activity, Package
} from 'lucide-react';
import { Ad, Product } from '../types';
import { AdCard, getAdCategoryPlaceholderImage } from './AdCard';
import { ProductCard } from './ProductCard';

const IRAQI_GOVERNORATES = [
  'الكل','بغداد','البصرة','الموصل','أربيل','النجف','كربلاء','الأنبار',
  'ديالى','صلاح الدين','بابل','واسط','ميسان','المثنى','ذي قار','القادسية',
  'كركوك','السليمانية','دهوك'
];

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: Search },
  { id: 'cars', name: 'سيارات', icon: Car },
  { id: 'real-estate', name: 'عقارات', icon: Home },
  { id: 'phones', name: 'هواتف', icon: Smartphone },
  { id: 'electronics', name: 'إلكترونيات', icon: Laptop },
  { id: 'furniture', name: 'أثاث', icon: Sofa },
  { id: 'clothes', name: 'ملابس', icon: Shirt },
  { id: 'jobs', name: 'وظائف', icon: Briefcase },
  { id: 'services', name: 'خدمات', icon: Wrench },
  { id: 'animals', name: 'حيوانات', icon: PawPrint },
  { id: 'food', name: 'طعام', icon: Coffee },
  { id: 'sports', name: 'رياضة', icon: Activity },
  { id: 'other', name: 'أخرى', icon: Package },
];

interface SearchPageProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  allAds: Ad[];
  allProducts: Product[];
  onSelectAd: (ad: Ad) => void;
  onSelectProduct: (product: Product) => void;
  storedUsers: any;
  user: any;
  onToggleFav: (id: number) => void;
  favorites: number[];
  onRequireAuth: () => void;
  onSellerClick: (id: string) => void;
}

export function SearchPage({
  isOpen, onClose, isDarkMode,
  allAds, allProducts,
  onSelectAd, onSelectProduct,
  storedUsers, user, onToggleFav, favorites, onRequireAuth, onSellerClick
}: SearchPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedGov, setSelectedGov] = useState('الكل');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [condition, setCondition] = useState<'all' | 'new' | 'used'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('souqRecentSearches') || '[]'); }
    catch { return []; }
  });
  const [activeTab, setActiveTab] = useState<'ads' | 'products'>('ads');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter(s => s !== term.trim())].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('souqRecentSearches', JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('souqRecentSearches');
  };

  const filteredAds = useMemo(() => {
    if (!query.trim() && selectedCat === 'all' && selectedGov === 'الكل') return [];
    return allAds.filter(ad => {
      if (ad.status === 'sold') return false;
      if (selectedCat !== 'all' && ad.category !== selectedCat) return false;
      if (selectedGov !== 'الكل' && ad.governorate !== selectedGov) return false;
      if (query.trim()) {
        const text = `${ad.title} ${ad.description || ''} ${ad.category || ''}`.toLowerCase();
        if (!text.includes(query.toLowerCase())) return false;
      }
      if (priceMin) {
        const p = typeof ad.price === 'string' ? parseInt(ad.price.replace(/,/g,'')) : ad.price || 0;
        if (p < parseInt(priceMin)) return false;
      }
      if (priceMax) {
        const p = typeof ad.price === 'string' ? parseInt(ad.price.replace(/,/g,'')) : ad.price || 0;
        if (p > parseInt(priceMax)) return false;
      }
      if (condition !== 'all') {
        const text = `${ad.title} ${ad.description || ''}`.toLowerCase();
        const isUsed = text.includes('مستعمل') || text.includes('مستعملة') || text.includes('ثاني يد');
        const isNew = text.includes('جديد') || text.includes('جديدة') || text.includes('كارتون');
        if (condition === 'new' && isUsed && !isNew) return false;
        if (condition === 'used' && isNew && !isUsed) return false;
      }
      return true;
    }).slice(0, 30);
  }, [query, selectedCat, selectedGov, priceMin, priceMax, condition, allAds]);

  const filteredProducts = useMemo(() => {
    if (!query.trim() && selectedCat === 'all' && selectedGov === 'الكل') return [];
    return allProducts.filter(p => {
      if (p.status === 'sold') return false;
      if (selectedCat !== 'all' && p.category !== selectedCat) return false;
      if (selectedGov !== 'الكل' && p.governorate !== selectedGov) return false;
      if (query.trim()) {
        const text = `${p.title} ${p.description || ''}`.toLowerCase();
        if (!text.includes(query.toLowerCase())) return false;
      }
      return true;
    }).slice(0, 30);
  }, [query, selectedCat, selectedGov, allProducts]);

  const hasResults = filteredAds.length > 0 || filteredProducts.length > 0;
  const hasQuery = query.trim().length > 0 || selectedCat !== 'all' || selectedGov !== 'الكل';

  const bg = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#F5F5F7]';
  const cardBg = isDarkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-slate-200/80';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-slate-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-page"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className={`fixed inset-0 z-[200] ${bg} flex flex-col overflow-hidden`}
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* ── Header ── */}
          <div className={`flex-shrink-0 ${isDarkMode ? 'border-b border-gray-800/60' : 'border-b border-slate-200/60'} pt-3 pb-2 px-4`}>
            {/* Search Bar Row */}
            <div className="flex items-center gap-3 mb-3">
              {/* Back Button */}
              <button
                onClick={onClose}
                className={`p-2.5 rounded-2xl shrink-0 transition-all ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'}`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Search Input */}
              <div className={`flex-1 flex items-center gap-2 rounded-2xl px-4 py-3 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white shadow-sm'}`}>
                <Search className={`w-5 h-5 shrink-0 ${query ? 'text-amber-500' : textSecondary}`} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && query.trim()) saveSearch(query); }}
                  placeholder="ابحث عن سيارة، هاتف، عقار..."
                  className={`flex-1 bg-transparent outline-none text-sm font-medium ${textPrimary} placeholder:${textSecondary}`}
                  dir="rtl"
                />
                {query && (
                  <button onClick={() => setQuery('')} className={`p-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Advanced Filter Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-2.5 rounded-2xl shrink-0 transition-all ${showAdvanced
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-slate-600 shadow-sm'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pb-3 space-y-3" dir="rtl">
                    {/* Governorate */}
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 shrink-0 text-amber-500`} />
                      <div className="flex overflow-x-auto gap-2 scrollbar-none flex-nowrap">
                        {IRAQI_GOVERNORATES.slice(0, 8).map(g => (
                          <button
                            key={g}
                            onClick={() => setSelectedGov(g)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              selectedGov === g
                                ? 'bg-amber-500 text-black shadow-md'
                                : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
                            }`}
                          >{g}</button>
                        ))}
                      </div>
                    </div>

                    {/* Condition + Price */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Condition pills */}
                      <div className={`flex rounded-xl p-1 gap-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                        {[['all', 'الكل'], ['new', 'جديد ✨'], ['used', 'مستعمل 🏷️']].map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => setCondition(val as any)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              condition === val
                                ? 'bg-amber-500 text-black shadow-sm'
                                : isDarkMode ? 'text-gray-400' : 'text-slate-500'
                            }`}
                          >{label}</button>
                        ))}
                      </div>

                      {/* Price Range */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          value={priceMin}
                          onChange={e => setPriceMin(e.target.value.replace(/\D/g, ''))}
                          placeholder="من"
                          className={`w-20 text-center text-xs px-2 py-1.5 rounded-xl outline-none font-bold ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-600' : 'bg-white text-slate-800 placeholder-slate-400 shadow-sm'}`}
                          dir="ltr"
                        />
                        <span className={`text-xs ${textSecondary}`}>—</span>
                        <input
                          value={priceMax}
                          onChange={e => setPriceMax(e.target.value.replace(/\D/g, ''))}
                          placeholder="إلى"
                          className={`w-20 text-center text-xs px-2 py-1.5 rounded-xl outline-none font-bold ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-600' : 'bg-white text-slate-800 placeholder-slate-400 shadow-sm'}`}
                          dir="ltr"
                        />
                        <span className={`text-[10px] font-bold ${textSecondary}`}>IQD</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none flex-nowrap" dir="rtl">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 border shadow-sm ${
                    selectedCat === c.id 
                      ? 'bg-amber-500 text-black border-amber-500 shadow-amber-500/20' 
                      : (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-slate-200 text-slate-700')
                  }`}
                >
                  <c.icon className="w-4 h-4" />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto" dir="rtl">
            {/* No query yet → show recents */}
            {!hasQuery && (
              <div className="px-4 pt-6">
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${textSecondary}`} />
                        <span className={`text-sm font-bold ${textSecondary}`}>عمليات البحث الأخيرة</span>
                      </div>
                      <button onClick={clearRecent} className="text-xs text-amber-500 font-bold">مسح الكل</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => { setQuery(s); }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium border transition-all ${
                            isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-300 hover:border-amber-500/30 hover:text-amber-400' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-500/30 hover:text-amber-600 shadow-sm'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 opacity-50" />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick category shortcuts */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className={`w-4 h-4 text-amber-500`} />
                    <span className={`text-sm font-bold ${textSecondary}`}>تصفح الأقسام</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCat(c.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          selectedCat === c.id
                            ? isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'
                            : isDarkMode ? 'bg-gray-900/80 border-gray-800/60 text-gray-300 hover:bg-gray-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        <c.icon className={`w-8 h-8 mb-2 ${
                          selectedCat === c.id 
                            ? 'text-white' 
                            : (isDarkMode ? 'text-gray-400' : 'text-slate-600')
                        }`} />
                        <span className="text-xs font-bold">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {hasQuery && (
              <div className="px-4 pt-4 pb-24">
                {/* Result Tabs */}
                <div className={`flex rounded-2xl p-1 mb-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-sm'}`}>
                  {[
                    { key: 'ads', label: 'إعلانات', count: filteredAds.length },
                    { key: 'products', label: 'منتجات', count: filteredProducts.length },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === tab.key
                          ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white shadow-sm'
                          : textSecondary
                      }`}
                    >
                      {tab.label}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? isDarkMode ? 'bg-black/20' : 'bg-white/20'
                          : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-500'
                      }`}>{tab.count}</span>
                    </button>
                  ))}
                </div>

                {/* No results */}
                {!hasResults && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-sm'}`}>
                      <Search className={`w-8 h-8 ${textSecondary} opacity-50`} />
                    </div>
                    <p className={`font-bold text-lg ${textPrimary}`}>لا توجد نتائج</p>
                    <p className={`text-sm ${textSecondary} text-center`}>
                      جرب كلمات مختلفة أو غير الفلاتر
                    </p>
                  </div>
                )}

                {/* Ads Results */}
                {activeTab === 'ads' && filteredAds.length > 0 && (
                  <div className="space-y-4">
                    {filteredAds.map(ad => (
                      <div key={ad.id} onClick={() => { saveSearch(query); onSelectAd(ad); onClose(); }}>
                        <AdCard
                          ad={ad}
                          isDarkMode={isDarkMode}
                          isFav={favorites.includes(Number(ad.id))}
                          onToggleFav={() => user ? onToggleFav(Number(ad.id)) : onRequireAuth()}
                          storedUsers={storedUsers}
                          onSellerClick={onSellerClick}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Products Results */}
                {activeTab === 'products' && filteredProducts.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map(product => (
                      <div key={product.id} onClick={() => { saveSearch(query); onSelectProduct(product); onClose(); }}>
                        <ProductCard
                          product={product}
                          isDarkMode={isDarkMode}
                          isFav={false}
                          onToggleFav={() => {}}
                          storedUsers={storedUsers}
                          onSellerClick={onSellerClick}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
