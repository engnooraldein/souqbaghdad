// ===========================================
// مسؤولية هذا الملف:
// صفحة عرض قوائم المنتجات أو الإعلانات (Listing Page).
//
// قد يجلب البيانات من Supabase مباشرة أو يستقبلها عبر Props.
// تحقق من useEffect للتأكد.
//
// آمن للتعديل:
// نعم، بحذر.
// ===========================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Filter, Grid, List, ChevronLeft, Heart, MessageCircle, Share2, Eye, MapPin, Clock, Car, Home, Smartphone, Star, Check, X } from 'lucide-react';
import { ProductCard } from './Cards';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';

interface ListingPageProps {
  category: string;
  onBack: () => void;
}

const categoryData = {
  cars: {
    title: 'السيارات',
    subtitle: 'سيارات جديدة ومستعملة',
    icon: Car,
    color: 'from-gray-600 to-gray-800',
    filters: [
      { name: 'النوع', options: ['الكل', 'سيدان', 'SUV', 'بيك اب', 'كوبيه'] },
      { name: 'السعر', options: ['الكل', 'حت 50 مليون', '50-100 مليون', '100-300 مليون', 'فوق 300 مليون'] },
      { name: 'الوقود', options: ['الكل', 'بنزين', 'ديزل', 'كهرباء', 'هايبرد'] },
      { name: 'القير', options: ['الكل', 'اوتوماتيك', 'يدوي'] },
    ],
  },
  'real-estate': {
    title: 'العقارات',
    subtitle: 'بيع وإيجار عقارات',
    icon: Home,
    color: 'from-green-600 to-green-800',
    filters: [
      { name: 'النوع', options: ['الكل', 'فيلا', 'شقة', 'أرض', 'محل'] },
      { name: 'الغرض', options: ['الكل', 'للبيع', 'للإيجار'] },
      { name: 'الغرف', options: ['الكل', '1-2 غرفة', '3-4 غرف', '5+ غرف'] },
      { name: 'المساحة', options: ['الكل', 'حت 100م', '100-300م', '300-500م', 'فوق 500م'] },
    ],
  },
  phones: {
    title: 'الهواتف',
    subtitle: 'هواتف ذكية و أجهزة',
    icon: Smartphone,
    color: 'from-purple-600 to-purple-800',
    filters: [
      { name: 'الماركة', options: ['الكل', 'Apple', 'Samsung', 'Huawei', 'Xiaomi', 'OnePlus'] },
      { name: 'الحالة', options: ['الكل', 'جديد', 'شبه جديد', 'مستخدم'] },
      { name: 'السعة', options: ['الكل', '64GB', '128GB', '256GB', '512GB', '1TB'] },
    ],
  },
};

const mockProducts = [
  {
    id: 1,
    title: 'Mercedes AMG GT 2024 - فل كامل',
    price: '450,000,000 د.ع',
    location: 'بغداد - المنصور',
    time: 'منذ ساعة',
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600'],
    badge: 'premium' as const,
  },
  {
    id: 2,
    title: 'Toyota Land Cruiser 2023 - هايلكس',
    price: '380,000,000 د.ع',
    location: 'أربيل',
    time: 'منذ 3 ساعات',
    images: ['https://images.unsplash.com/photo-1625231334168-2e3c5d7d6b88?w=600'],
    badge: 'hot' as const,
  },
  {
    id: 3,
    title: 'BMW M5 Competition 2024',
    price: '520,000,000 د.ع',
    location: 'البصرة',
    time: 'منذ 5 ساعات',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600'],
    badge: 'new' as const,
  },
  {
    id: 4,
    title: 'Porsche 911 Turbo S 2023',
    price: '850,000,000 د.ع',
    location: 'بغداد - الكرادة',
    time: 'منذ يوم',
    images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600'],
  },
  {
    id: 5,
    title: 'Audi RS7 Sportback 2024',
    price: '480,000,000 د.ع',
    location: 'نينوى',
    time: 'منذ يوم',
    images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600'],
  },
  {
    id: 6,
    title: 'Lamborghini Huracan EVO',
    price: '1,200,000,000 د.ع',
    location: 'كربلاء',
    time: 'منذ يومين',
    images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600'],
    badge: 'premium' as const,
  },
  {
    id: 7,
    title: 'Ferrari SF90 Stradale',
    price: '2,500,000,000 د.ع',
    location: 'بغداد',
    time: 'منذ 3 أيام',
    images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600'],
    badge: 'premium' as const,
  },
  {
    id: 8,
    title: 'Range Rover SVR 2024',
    price: '650,000,000 د.ع',
    location: 'أربيل',
    time: 'منذ 4 أيام',
    images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600'],
    badge: 'hot' as const,
  },
];

export function ListingPage({ category, onBack }: ListingPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('newest');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(4);

  const data = categoryData[category as keyof typeof categoryData] || categoryData.cars;

  const toggleFilter = (filterName: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterName]: prev[filterName] === value ? '' : value,
    }));
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Header */}
      <div className={`bg-gradient-to-br ${data.color} py-12`}>
        <div className="container mx-auto px-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>العودة للرئيسية</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <data.icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{data.title}</h1>
              <p className="text-white/80">{data.subtitle}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters & Products */}
      <div className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Filter Button */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                showFilters
                  ? 'bg-gray-800 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>الفلاتر</span>
            </motion.button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">الأحدث</option>
              <option value="price-low">السعر: من الأقل</option>
              <option value="price-high">السعر: من الأعلى</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">الفلاتر</h3>
                  <button
                    onClick={() => setSelectedFilters({})}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    إعادة تعيين
                  </button>
                </div>
                <div className="flex flex-wrap gap-6">
                  {data.filters.map((filter) => (
                    <div key={filter.name}>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {filter.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {filter.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => toggleFilter(filter.name, option)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedFilters[filter.name] === option
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          تم العثور على <span className="font-bold text-gray-900 dark:text-white">{mockProducts.length}</span> نتيجة
        </p>

        {/* Products Grid */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {mockProducts.slice(0, visibleCount).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {viewMode === 'grid' ? (
                <div className="relative">
                  <ProductCard
                    image={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'}
                    title={product.title}
                    price={product.price}
                    location={product.location}
                    time={product.time}
                    badge={product.badge}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className={`absolute top-6 left-6 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${
                      favorites.includes(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 backdrop-blur text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 flex gap-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="relative w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {product.badge && (
                      <div
                        className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          product.badge === 'new'
                            ? 'bg-green-500 text-white'
                            : product.badge === 'hot'
                            ? 'bg-orange-500 text-white'
                            : 'bg-amber-500 text-black'
                        }`}
                      >
                        {product.badge === 'new' ? 'جديد' : product.badge === 'hot' ? 'ساخن' : 'مميز'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{product.title}</h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-amber-400 mb-2">{product.price}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {product.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {product.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          favorites.includes(product.id)
                            ? 'bg-red-100 dark:bg-red-900 text-red-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <InfiniteScrollTrigger
          onLoadMore={async () => {
            await new Promise(resolve => setTimeout(resolve, 400));
            setVisibleCount(prev => prev + 4);
          }}
          hasMore={visibleCount < mockProducts.length}
          loadingText="جاري تحميل المزيد من العروض..."
          skeletonType="grid"
          skeletonCount={2}
        />
      </div>
    </div>
  );
}
