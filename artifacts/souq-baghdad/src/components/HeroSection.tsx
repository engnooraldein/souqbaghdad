import { motion } from 'framer-motion';
import { 
  Search, MapPin, LayoutGrid, Package, Car, Home, Smartphone, 
  Laptop, Shirt, Sparkles, Scissors, Briefcase, Wrench, 
  Sofa, Bike, ShoppingBag, WashingMachine, Layers, Plus
} from 'lucide-react';
import { LionOutline } from '../assets/svg/logo/lion-outline';
import { CategoryCard } from '../assets/svg/cards/category-card';

interface HeroSectionProps {
  onExploreCategory?: (category: string) => void;
  onShowPostAd?: () => void;
}

export function HeroSection({ onExploreCategory, onShowPostAd }: HeroSectionProps) {
  const categories = [
    { id: 'all', name: 'الكل', icon: Package, active: true },
    { id: 'cars', name: 'السيارات', icon: Car },
    { id: 'real-estate', name: 'العقارات', icon: Home },
    { id: 'phones', name: 'الهواتف', icon: Smartphone },
    { id: 'electronics', name: 'إلكترونيات', icon: Laptop },
    
    { id: 'clothes', name: 'الملابس', icon: Shirt },
    { id: 'cosmetics', name: 'الكوزمتك', icon: Sparkles },
    { id: 'handmade', name: 'حرف يدوية', icon: Scissors },
    { id: 'jobs', name: 'وظائف', icon: Briefcase },
    { id: 'services', name: 'خدمات', icon: Wrench },
    
    { id: 'furniture', name: 'أثاث', icon: Sofa },
    { id: 'bikes', name: 'دراجات', icon: Bike },
    { id: 'supplies', name: 'مستلزمات', icon: ShoppingBag },
    { id: 'appliances', name: 'أجهزة منزلية', icon: WashingMachine },
    { id: 'other', name: 'أخرى', icon: Layers }
  ];

  return (
    <section className="relative w-full pt-6 pb-4 overflow-hidden bg-[#031131] z-10" dir="rtl">
      {/* Background Watermark */}
      <div className="absolute top-0 left-[-15%] w-[80%] max-w-[500px] opacity-20 pointer-events-none z-0">
        <LionOutline className="w-full h-auto text-[#BF9B30] mix-blend-screen opacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Title Area */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pt-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2 font-tajawal">
              كل شيء<br/>
              <span className="text-[#BF9B30]">تحتاجه بمكان واحد</span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">
              إعلانات + متجر — السوق الرقمي العراقي
            </p>
          </div>
          
          <button 
            onClick={onShowPostAd}
            className="flex items-center gap-1 bg-gradient-to-l from-[#BF9B30] to-[#E5C158] text-[#031131] px-4 py-2 rounded-xl font-bold shadow-[0_4px_15px_rgba(191,155,48,0.4)] hover:scale-105 transition-transform mt-4"
          >
            <span className="text-sm">إعلان</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-[#0A1A3A]/80 backdrop-blur-md border border-[#BF9B30]/30 rounded-full p-1.5 flex items-center mb-6 shadow-lg shadow-black/20 relative z-20">
          <div className="flex items-center gap-1 px-3 border-l border-white/10 shrink-0 cursor-pointer">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 hidden sm:inline">بغداد</span>
            <svg className="w-3 h-3 text-gray-400 ml-1 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          <div className="flex items-center gap-1 px-3 border-l border-white/10 shrink-0 cursor-pointer">
            <LayoutGrid className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 hidden sm:inline">الكل</span>
            <svg className="w-3 h-3 text-gray-400 ml-1 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="flex-1 px-3 relative">
            <input 
              type="text" 
              placeholder="ابحث عن سيارة، هاتف، عقار..."
              className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-gray-500"
            />
          </div>
          
          <div className="p-2 shrink-0">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 relative z-20">
          {categories.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onExploreCategory?.(cat.id)}
              className={`flex flex-col items-center justify-center relative aspect-square rounded-2xl overflow-hidden group ${cat.active ? 'bg-[#152B5C]' : 'bg-[#0F224A]/60'} hover:bg-[#152B5C] transition-colors`}
            >
              <CategoryCard className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity" />
              {cat.active && (
                <div className="absolute inset-0 border-[1.5px] border-[#BF9B30] rounded-2xl shadow-[inset_0_0_15px_rgba(191,155,48,0.2)]" />
              )}
              
              <div className={`p-2 rounded-xl mb-1 ${cat.active ? 'text-[#BF9B30]' : 'text-[#BF9B30]/70'} group-hover:text-[#BF9B30] transition-colors`}>
                <cat.icon className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <span className={`text-[9px] sm:text-xs font-tajawal font-medium text-center leading-tight ${cat.active ? 'text-white' : 'text-gray-400'} group-hover:text-white transition-colors`}>
                {cat.name}
              </span>
            </motion.button>
          ))}
        </div>

      </div>
    </section>
  );
}