import { useState } from 'react';
import { 
  ChevronLeft, Search, Plus, Tag, MapPin, 
  ShoppingBag, Shield, Star, Info, MessageSquare, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SellerInfo {
  name: string;
  avatar: string;
  isVerified: boolean;
  rating: number;
  joinedDate: string;
  location: string;
}

interface Product {
  id: number;
  title: string;
  price: string;
  description: string;
  category: string;
  images: string[];
  governorate: string;
  phone: string;
  condition: 'new' | 'used';
  seller: SellerInfo;
  createdAtISO: string;
  views: number;
  postedBy: string;
  stock: number;
  status: string;
  short_id?: string;
}

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
    { id: 'electronics', name: 'إلكترونيات', emoji: '📱' },
    { id: 'fashion', name: 'أزياء وملابس', emoji: '👕' },
    { id: 'home', name: 'المنزل والمطبخ', emoji: '🏠' },
    { id: 'beauty', name: 'العناية والجمال', emoji: '✨' },
    { id: 'toys', name: 'ألعاب وأطفال', emoji: '🧸' },
    { id: 'other', name: 'أخرى', emoji: '📦' }
  ];

  const GOVERNORATES = [
    'الكل', 'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كربلاء', 'بابل', 
    'ديالى', 'الأنبار', 'ذي قار', 'القادسية', 'ميسان', 'واسط', 'صلاح الدين', 
    'كركوك', 'السليمانية', 'دهوك', 'المثنى'
  ];

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-900 pt-8 pb-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="absolute border border-white/20 rounded-full" 
              style={{
                width: `${(i + 1) * 100}px`,
                height: `${(i + 1) * 100}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-white font-bold text-2xl flex items-center gap-2">
                  🛍️ قسم المنتجات والمتجر المخصص
                </h1>
                <p className="text-blue-200 text-sm mt-1">تصفح وتسوق آلاف المنتجات من التجار الموثوقين مباشرة</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateProduct}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-500/35 border border-blue-400/20"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة منتج</span>
            </motion.button>
          </div>

          {/* Dedicated Search bar */}
          <div className="relative max-w-2xl mx-auto mb-4">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="ابحث في المتجر المخصص (هواتف، لابتوب، ملابس...)"
              className="w-full bg-white/10 backdrop-blur text-white placeholder-gray-300 rounded-2xl py-4 pr-12 pl-4 border border-white/20 focus:border-blue-400 outline-none text-sm"
            />
          </div>

          {/* Condition Filter & Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {/* Condition buttons */}
            <div className="bg-gray-900/80 p-1 rounded-xl border border-gray-800 flex gap-1">
              <button 
                onClick={() => setConditionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${conditionFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                الكل
              </button>
              <button 
                onClick={() => setConditionFilter('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${conditionFilter === 'new' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                جديد
              </button>
              <button 
                onClick={() => setConditionFilter('used')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${conditionFilter === 'used' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                مستعمل
              </button>
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-900 text-white border border-gray-800 rounded-xl text-xs font-bold hover:bg-gray-800"
            >
              ⚙️ خيارات التصفية الإضافية
            </button>
          </div>

          {/* Additional Filter Panels */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3 max-w-2xl mx-auto"
              >
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 space-y-4 shadow-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 text-xs font-semibold">المحافظة</label>
                      <select 
                        value={gov} 
                        onChange={e => setGov(e.target.value)} 
                        className="bg-gray-800 text-white rounded-xl px-3 py-2 border border-gray-700 text-xs outline-none focus:border-blue-500"
                      >
                        {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 text-xs font-semibold">ترتيب حسب</label>
                      <select 
                        value={sort} 
                        onChange={e => setSort(e.target.value)} 
                        className="bg-gray-800 text-white rounded-xl px-3 py-2 border border-gray-700 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="recent">الأحدث نشراً</option>
                        <option value="views">الأكثر مشاهدة</option>
                        <option value="price-low">السعر: من الأقل للأعلى</option>
                        <option value="price-high">السعر: من الأعلى للأقل</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-1 flex items-center gap-2">
                      <label className="text-gray-400 text-xs shrink-0">السعر من:</label>
                      <input 
                        value={priceMin} 
                        onChange={e => setPriceMin(e.target.value)} 
                        placeholder="0" 
                        className="w-full bg-gray-800 text-white rounded-xl px-3 py-2 border border-gray-700 text-xs outline-none"
                      />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <label className="text-gray-400 text-xs shrink-0">إلى:</label>
                      <input 
                        value={priceMax} 
                        onChange={e => setPriceMax(e.target.value)} 
                        placeholder="بلا حد" 
                        className="w-full bg-gray-800 text-white rounded-xl px-3 py-2 border border-gray-700 text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                    <button 
                      onClick={() => {
                        setPriceMin(''); setPriceMax(''); setGov('الكل'); setConditionFilter('all');
                      }}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold"
                    >
                      إعادة تعيين
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto max-w-5xl px-4 mt-6">
        {/* Category selector row */}
        <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar scroll-smooth">
          {CATEGORIES.map(c => (
            <button 
              key={c.id} 
              onClick={() => setCat(c.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all ${
                cat === c.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                  : 'bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-850'
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/40 rounded-3xl border border-gray-900 mt-6">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold text-white mb-2">لا توجد منتجات مطابقة للبحث</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">جرب البحث بكلمات أخرى أو تغيير الفلاتر لتجد ما تبحث عنه</p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col h-full relative"
                >
                  {/* Condition Badge */}
                  <span className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white shadow ${
                    p.condition === 'new' ? 'bg-green-600' : 'bg-amber-600'
                  }`}>
                    {p.condition === 'new' ? 'جديد' : 'مستعمل'}
                  </span>
                  {isNewItem(p.createdAtISO) && (
                    <span className="absolute top-8 left-2 z-10 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-extrabold rounded-lg shadow-lg shadow-red-500/25 border border-red-400/30 animate-pulse">
                      حديث ✨
                    </span>
                  )}

                  <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0 bg-gray-950">
                    <img 
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'} 
                      alt={p.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                      decoding="async"
                    />
                    {p.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl border border-red-500/20">
                          🚫 تم البيع
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{p.title}</h3>
                      <p className="text-base font-extrabold text-blue-400 mb-2">
                        {formatPrice(p.price)} <span className="text-[10px] text-gray-400">د.ع</span>
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                        <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="truncate">{p.governorate || 'بغداد'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                        <div className="flex items-center gap-1">
                          <img 
                            src={p.seller?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} 
                            alt="" 
                            className="w-4 h-4 rounded-full object-cover border border-gray-700"
                          />
                          <span className="text-[10px] text-gray-400 truncate max-w-[70px]">{p.seller?.name || 'تاجر'}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5">👁️ {p.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="text-center py-6 mt-4 space-y-2 border-t border-gray-900">
              <p className="text-gray-400 text-xs">تم العثور على {totalProductsCount} منتج، يتم عرض {Math.min(filteredProducts.length, totalProductsCount)} من أصل {totalProductsCount}</p>
              {hasMoreProducts && (
                <button 
                  onClick={onLoadMoreProducts} 
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25 border border-blue-400/20"
                >
                  عرض المزيد
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
