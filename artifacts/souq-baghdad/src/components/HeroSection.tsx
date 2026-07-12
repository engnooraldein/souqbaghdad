import { motion } from 'framer-motion';
import { Car, Home, Smartphone, ChevronLeft, ChevronRight, Sparkles, Zap, Shield } from 'lucide-react';
import { IraqiEagle } from './Icons';

interface HeroSectionProps {
  onExploreCategory?: (category: string) => void;
}

export function HeroSection({ onExploreCategory }: HeroSectionProps) {
  const quickCategories = [
    { id: 'cars', name: 'السيارات', icon: Car, count: '2,450', color: 'from-blue-600 to-blue-800' },
    { id: 'real-estate', name: 'العقارات', icon: Home, count: '1,890', color: 'from-green-600 to-green-800' },
    { id: 'phones', name: 'الهواتف', icon: Smartphone, count: '3,200', color: 'from-purple-600 to-purple-800' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden baghdad-night">
      {/* Animated Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Geometric Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-500/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-amber-500/10 rounded-full" />
      </div>

      {/* Iraqi Eagle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute top-24 right-10 opacity-20 hidden lg:block"
      >
        <IraqiEagle className="w-40 h-40 eagle-animation" />
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">أكبر منصة إعلانات عراقية</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-center mb-6 leading-tight"
          >
            <span className="text-white">كل شي تحتاجه</span>
            <br />
            <span className="text-gradient">بمكان واحد</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-12"
          >
            سوق بغداد الرقمي الحديث - أفضل مكان لعرض وبيع وشراء كل ما تحتاجه
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="ابحث عن سيارة، عقار، هاتف..."
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl py-4 px-6 pr-12 border border-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  بحث
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Quick Categories */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12"
          >
            {quickCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => onExploreCategory?.(category.id)}
                className={`relative overflow-hidden bg-gradient-to-br ${category.color} p-6 rounded-2xl cursor-pointer group`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-white font-bold text-lg">{category.name}</h3>
                    <p className="text-white/80 text-sm">{category.count}+ إعلان</p>
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <ChevronLeft className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { label: 'إجمالي الإعلانات', value: '50,000+', icon: Zap },
              { label: 'المستخدمين النشطين', value: '25,000+', icon: Shield },
              { label: 'المتاجر', value: '1,200+', icon: Home },
              { label: 'المبيعات', value: '10,000+', icon: Car },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center"
              >
                <stat.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center mt-12"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center text-gray-400"
            >
              <span className="text-sm mb-2">اكتشف المزيد</span>
              <ChevronRight className="w-6 h-6 rotate-90" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
    </section>
  );
}