import { motion } from 'framer-motion';
import { Car, Home, Smartphone, Watch, Bike, ShoppingBag, Wrench, ArrowLeft } from 'lucide-react';
import { CategoryCard } from './Cards';

interface CategoriesSectionProps {
  onCategoryClick?: (category: string) => void;
}

export function CategoriesSection({ onCategoryClick }: CategoriesSectionProps) {
  const categories = [
    {
      id: 'cars',
      name: 'السيارات',
      subtitle: 'سيارات جديدة ومستعملة',
      icon: Car,
      gradient: 'from-blue-600 to-blue-800',
      count: '2,450'
    },
    {
      id: 'real-estate',
      name: 'العقارات',
      subtitle: 'بيع وإيجار عقارات',
      icon: Home,
      gradient: 'from-green-600 to-green-800',
      count: '1,890'
    },
    {
      id: 'phones',
      name: 'الهواتف',
      subtitle: 'هواتف ذكية و أجهزة',
      icon: Smartphone,
      gradient: 'from-purple-600 to-purple-800',
      count: '3,200'
    },
    {
      id: 'electronics',
      name: 'الإلكترونيات',
      subtitle: 'لابتوبات و أجهزة إلكترونية',
      icon: Watch,
      gradient: 'from-orange-600 to-orange-800',
      count: '1,450'
    },
    {
      id: 'bikes',
      name: 'الدراجات',
      subtitle: 'دراجات نارية و هوائية',
      icon: Bike,
      gradient: 'from-red-600 to-red-800',
      count: '890'
    },
    {
      id: 'products',
      name: 'المنتجات',
      subtitle: 'ملابس و أثاث و أكثر',
      icon: ShoppingBag,
      gradient: 'from-pink-600 to-pink-800',
      count: '5,600'
    },
    {
      id: 'services',
      name: 'الخدمات',
      subtitle: 'خدمات مهنية و حرفيه',
      icon: Wrench,
      gradient: 'from-yellow-600 to-yellow-800',
      count: '980'
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            استكشف الأقسام
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            تصفح آلاف الإعلانات في أقسام متعددة - كل ما تحتاجه في مكان واحد
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <CategoryCard
                title={category.name}
                subtitle={category.subtitle}
                icon={category.icon}
                gradient={category.gradient}
                count={category.count}
                onClick={() => onCategoryClick?.(category.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:shadow-xl transition-all"
          >
            <span>عرض جميع الأقسام</span>
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}