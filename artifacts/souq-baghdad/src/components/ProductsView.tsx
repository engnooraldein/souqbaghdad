// ===========================================
// مسؤولية هذا الملف:
// صفحة عرض المنتجات (Products View).
//
// يستقبل البيانات عبر Props من App.tsx.
// لا يجلب البيانات مباشرة من Supabase.
//
// آمن للتعديل:
// نعم.
// ===========================================
import { useState } from 'react';
import { 
  ChevronLeft, Search, Plus, Tag, MapPin, 
  ShoppingBag, Shield, Star, Info, MessageSquare, Share2, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard } from './SkeletonCard';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';

import { Product, SellerInfo } from '../types';
interface ProductsViewProps {
  user: any;
  onBack: () => void;
  onCreateProduct: () => void;
  onSelectProduct: (p: Product) => void;
  products: Product[];
  onPost?: (p: any) => void;
  onDeleteProduct?: (id: number) => void;
  onActionMenu?: (target: any) => void;
  hasMoreProducts: boolean;
  onLoadMoreProducts: () => void;
  totalProductsCount: number;
  loadingMoreProducts?: boolean;
  isInitialLoading?: boolean;
  search: string;
  setSearch: (s: string) => void;
  cat: string;
  setCat: (c: string) => void;
  gov: string;
  setGov: (g: string) => void;
  sort: string;
  setSort: (s: any) => void;
  priceMin: string;
  setPriceMin: (p: string) => void;
  priceMax: string;
  setPriceMax: (p: string) => void;
  conditionFilter: 'all' | 'new' | 'used';
  setConditionFilter: (c: 'all' | 'new' | 'used') => void;
}

export function ProductsView({
  user,
  onBack,
  onCreateProduct,
  onSelectProduct,
  products,
  onActionMenu,
  hasMoreProducts,
  onLoadMoreProducts,
  totalProductsCount,
  loadingMoreProducts,
  isInitialLoading,
  search,
  setSearch,
  cat,
  setCat,
  gov,
  setGov,
  sort,
  setSort,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  conditionFilter,
  setConditionFilter
}: ProductsViewProps) {
  const [showFilters, setShowFilters] = useState(false);

  const formatPrice = (p: string) => {
    return p.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const isNewItem = (createdAtISO?: string) => {
    if (!createdAtISO) return false;
    const createdDate = new Date(createdAtISO).getTime();
    const diffTime = Date.now() - createdDate;
    return diffTime > 0 && diffTime < 24 * 60 * 60 * 1000;
  };

  // Filter local products to apply condition filter (since database filter might be different or local)
  const filteredProducts = products.filter(p => {
    if (conditionFilter !== 'all' && p.condition !== conditionFilter) return false;
    return true;
  });

  const CATEGORIES = [
    { id: 'all', name: 'الكل', emoji: '🛍️' },
    { id: 'electronics', name: 'إلكترونيات وأجهزة', emoji: '💻' },
    { id: 'fashion', name: 'أزياء وملابس', emoji: '👕' },
    { id: 'home', name: 'المنزل والمطبخ', emoji: '🏠' },
    { id: 'furniture', name: 'أثاث وديكور', emoji: '🛋️' },
    { id: 'beauty', name: 'العناية والجمال', emoji: '✨' },
    { id: 'toys', name: 'ألعاب وأطفال', emoji: '🧸' },
    { id: 'bikes', name: 'دراجات ورياضة', emoji: '🚲' },
    { id: 'services', name: 'خدمات المتجر', emoji: '🔧' },
    { id: 'other', name: 'أصناف أخرى', emoji: '📦' }
  ];

  const GOVERNORATES = [
    'الكل', 'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كربلاء', 'بابل', 
    'ديالى', 'الأنبار', 'ذي قار', 'القادسية', 'ميسان', 'واسط', 'صلاح الدين', 
    'كركوك', 'السليمانية', 'دهوك', 'المثنى'
  ];

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-gray-950 via-blue-950/60 to-gray-950 pt-10 pb-12 px-4 relative overflow-hidden border-b border-gray-900/60 shadow-2xl">
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="absolute border border-white/20 rounded-full" 
              style={{
                width: `${(i + 1) * 110}px`,
                height: `${(i + 1) * 110}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3.5">
              <button onClick={onBack} className="p-3 always-dark-bg rounded-2xl text-white always-white transition-all shadow-md" title="رجوع" aria-label="رجوع">
                <ChevronLeft className="w-5 h-5 always-white" />
              </button>
              <div>
                <h1 className="text-white always-white font-black text-2xl flex items-center gap-2" dir="rtl">
                  <span className="always-white">🛍️</span>
                  <span className="always-white">قسم المنتجات والمتجر المخصص</span>
                </h1>
                <p className="text-gray-300 always-white opacity-90 text-xs mt-1 font-semibold" dir="rtl">تصفح وتسوق آلاف المنتجات من التجار الموثوقين مباشرة</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCreateProduct}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/15 border border-amber-400/20 hover:from-amber-400 hover:to-yellow-300 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة منتج جديد</span>
            </motion.button>
          </div>

          {/* Dedicated Search bar & Quick Filters inside a unified Glassmorphic card */}
          <div className="bg-gray-950/40 border border-gray-900/80 backdrop-blur-md rounded-3xl p-5 shadow-2xl space-y-4 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute right-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="ابحث في المتجر المخصص (هواتف، لابتوب، ملابس...)"
                className="w-full bg-gray-950/60 backdrop-blur-md text-white placeholder-gray-400 rounded-2xl py-3.5 pr-12 pl-4 border border-gray-800 focus:border-amber-500/50 outline-none text-xs sm:text-sm shadow-inner transition-all duration-300"
              />
            </div>

            {/* Condition Filter & Extra Config */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Condition buttons */}
              <div className="bg-gray-950/60 p-1 rounded-2xl border border-gray-900 flex gap-1 shadow-inner">
                <button 
                  onClick={() => setConditionFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${conditionFilter === 'all' ? 'bg-gradient-to-r from-gray-600 to-indigo-600 text-white shadow-lg shadow-gray-800/20' : 'text-gray-400 hover:text-white'}`}
                >
                  الكل
                </button>
                <button 
                  onClick={() => setConditionFilter('new')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${conditionFilter === 'new' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white'}`}
                >
                  جديد
                </button>
                <button 
                  onClick={() => setConditionFilter('used')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${conditionFilter === 'used' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}
                >
                  مستعمل
                </button>
              </div>

              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4.5 py-2 bg-gray-950/60 hover:bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-750 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all duration-300 ${
                  showFilters
                    ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10'
                    : ''
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>خيارات التصفية الذكية</span>
              </button>
            </div>
          </div>

          {/* Additional Filter Panels */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4 max-w-2xl mx-auto"
              >
                <div className="bg-gray-950/80 border border-gray-900 backdrop-blur-xl rounded-3xl p-5 space-y-4 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 text-[11px] font-black mr-1" dir="rtl">المحافظة</label>
                      <select 
                        value={gov} 
                        onChange={e => setGov(e.target.value)} 
                        className="bg-gray-900/80 text-white font-bold rounded-xl px-3.5 py-2.5 border border-gray-800 focus:border-amber-500/50 text-xs outline-none transition-all duration-300 cursor-pointer w-full"
                      >
                        {GOVERNORATES.map(g => <option key={g} value={g} className="bg-gray-900 text-white">{g}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 text-[11px] font-black mr-1" dir="rtl">ترتيب حسب</label>
                      <select 
                        value={sort} 
                        onChange={e => setSort(e.target.value)} 
                        className="bg-gray-900/80 text-white font-bold rounded-xl px-3.5 py-2.5 border border-gray-800 focus:border-amber-500/50 text-xs outline-none transition-all duration-300 cursor-pointer w-full"
                      >
                        <option value="recent" className="bg-gray-900 text-white">الأحدث نشراً</option>
                        <option value="views" className="bg-gray-900 text-white">الأكثر مشاهدة</option>
                        <option value="price-low" className="bg-gray-900 text-white">السعر: من الأقل للأعلى</option>
                        <option value="price-high" className="bg-gray-900 text-white">السعر: من الأعلى للأقل</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center" dir="rtl">
                    <div className="flex-1 flex items-center gap-2">
                      <label className="text-gray-400 text-[11px] font-black shrink-0">السعر من:</label>
                      <input 
                        value={priceMin} 
                        onChange={e => setPriceMin(e.target.value)} 
                        placeholder="0" 
                        className="w-full bg-gray-900/80 text-white rounded-xl px-3.5 py-2.5 border border-gray-800 text-xs outline-none focus:border-amber-500/30 font-bold"
                      />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <label className="text-gray-400 text-[11px] font-black shrink-0">إلى:</label>
                      <input 
                        value={priceMax} 
                        onChange={e => setPriceMax(e.target.value)} 
                        placeholder="بلا حد" 
                        className="w-full bg-gray-900/80 text-white rounded-xl px-3.5 py-2.5 border border-gray-800 text-xs outline-none focus:border-amber-500/30 font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-900/60">
                    <button 
                      onClick={() => {
                        setPriceMin(''); setPriceMax(''); setGov('الكل'); setConditionFilter('all');
                      }}
                      className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-black hover:bg-red-500/20 transition-all duration-300"
                    >
                      إعادة تعيين الفلاتر
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto max-w-5xl px-4 mt-8">
        {/* Category selector row */}
        <div className="flex overflow-x-auto gap-2.5 pb-4 scrollbar-hide scroll-smooth" dir="rtl">
          {CATEGORIES.map(c => (
            <button 
              key={c.id} 
              onClick={() => setCat(c.id)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-black border shrink-0 transition-all duration-300 ${
                cat === c.id 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-500 shadow-xl shadow-amber-500/10' 
                  : 'bg-gray-950/60 text-gray-400 border-gray-900 hover:border-gray-800 hover:text-white'
              }`}
            >
              <span className="text-sm">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {isInitialLoading ? (
          <div className="space-y-8 mt-6" dir="rtl">
            <div className="flex items-center justify-between mb-4 bg-gray-950/20 p-4 rounded-2xl border border-gray-900/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                <div className="h-5 bg-gray-900 rounded-md w-48 animate-pulse" />
              </div>
              <div className="h-4 bg-gray-900 rounded-md w-24 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-gray-950/20 rounded-3xl border border-gray-900 shadow-sm mt-6" dir="rtl">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-black text-white mb-2">لا توجد منتجات مطابقة للبحث</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto font-medium">جرب البحث بكلمات أخرى أو تغيير الفلاتر لتجد ما تبحث عنه</p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Sticky Counts stats banner */}
                <div className="sticky top-[4rem] z-20 bg-gray-950/85 backdrop-blur-md py-3 px-4 border border-gray-900 shadow-xl mb-4 rounded-2xl flex items-center justify-between" dir="rtl">
                  <p className="text-gray-400 text-xs font-bold">
                    تم العثور على <span className="text-amber-500 font-extrabold">{totalProductsCount}</span> منتج، يتم عرض {Math.min(filteredProducts.length, totalProductsCount)} من أصل {totalProductsCount}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" dir="rtl">
                  {filteredProducts.map(p => (
                    <motion.div 
                      key={p.id}
                      whileHover={{ y: -4 }}
                      onClick={() => onSelectProduct(p)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (user && (user.id === p.postedBy || user.role === 'admin' || user.role === 'owner')) {
                          onActionMenu?.({ type: 'product', item: p });
                        }
                      }}
                      className="bg-gray-950/40 backdrop-blur-md rounded-3xl overflow-hidden border border-gray-900 hover:border-amber-500/30 cursor-pointer transition-all duration-300 flex flex-col h-full relative group shadow-xl"
                    >
                      {/* Condition Badge */}
                      <span className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[9px] font-black text-white shadow-lg ${
                        p.condition === 'new' ? 'bg-emerald-600/90' : 'bg-amber-600/90'
                      }`}>
                        {p.condition === 'new' ? 'جديد' : 'مستعمل'}
                      </span>
                      
                      {isNewItem(p.createdAtISO) && (
                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-red-500/20 border border-red-400/20 animate-pulse">
                          حديث ✨
                        </span>
                      )}

                      <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0 bg-gray-900">
                        <img 
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} 
                          alt={p.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                          loading="lazy" 
                          decoding="async"
                        />
                        {p.status === 'sold' && (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                            <span className="bg-red-600 text-white font-black text-xs px-3.5 py-2 rounded-2xl border border-red-500/20 shadow-lg shadow-red-500/10">
                              🚫 تم البيع
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-white font-black text-sm mb-1.5 line-clamp-1 group-hover:text-amber-500 transition-colors duration-300">{p.title}</h3>
                          <p className="text-base font-black text-amber-500 mb-3 flex items-baseline gap-1">
                            <span>{formatPrice(p.price)}</span>
                            <span className="text-[10px] text-gray-500 font-bold">د.ع</span>
                          </p>
                        </div>
                        
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                            <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="truncate">{p.governorate || 'بغداد'}</span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2.5 border-t border-gray-900/60">
                            <div className="flex items-center gap-1.5">
                              <img loading="lazy" decoding="async"
                                src={p.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} 
                                alt="" 
                                className="w-4.5 h-4.5 rounded-full object-cover border border-gray-800"
                              />
                              <span className="text-[10px] text-gray-400 font-bold truncate max-w-[80px]">{p.seller?.name || 'تاجر'}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5">👁️ {p.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <InfiniteScrollTrigger 
                  onLoadMore={onLoadMoreProducts}
                  hasMore={hasMoreProducts}
                  isLoading={loadingMoreProducts}
                  loadingText="جاري تحميل المزيد من المنتجات..."
                  skeletonType="grid"
                  skeletonCount={4}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
