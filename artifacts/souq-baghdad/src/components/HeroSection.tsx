// ===========================================
// مسؤولية هذا الملف:
// يعرض القسم العلوي من الصفحة الرئيسية (Hero Section).
// يشمل: شريط البحث، فلاتر الأقسام، العنوان.
//
// لا يجلب البيانات من Supabase.
// الفلاتر تُرسل كـ Props إلى App.tsx وتُطبَّق هناك.
//
// آمن للتعديل:
// نعم، لكن تأكد من عدم تغيير أسماء Props الخاصة بالبحث.
// ===========================================

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Car, ChevronLeft, Smartphone, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../App';
import LiveVisitorCounter from './LiveVisitorCounter';
import { CityOutline } from '../assets/svg/logo/city-outline';
import { LionOutline } from '../assets/svg/logo/lion-outline';
import { BackgroundGrid } from '../assets/svg/background/background-grid';
import { GoldParticles } from '../assets/svg/effects/gold-particles';

interface HeroSectionProps {
  search: string;
  setSearch: (s: string) => void;
  cat: string;
  setCat: (c: string) => void;
  onTransportClick?: () => void;
  isStandalone?: boolean;
  onInstallClick?: () => void;
  totalAdsCount?: number;
}

export function HeroSection({
  search, setSearch,
  cat, setCat,
  onTransportClick,
  isStandalone,
  onInstallClick,
  totalAdsCount = 2040
}: HeroSectionProps) {
  return (
    <section id="hero-section" className="bg-gradient-to-br from-[#070b19] via-[#0c1a3a] to-[#050c1e] py-14 sm:py-20 relative overflow-hidden border-b border-gray-800/40">
      {/* Background Grid & Particles Decoration */}
      <BackgroundGrid className="absolute inset-0 opacity-[0.12] mix-blend-color-dodge w-full h-full object-cover pointer-events-none" />
      <GoldParticles className="absolute inset-0 opacity-30 pointer-events-none w-full h-full" />
      
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Majestic Babylonian Lion (Backdrop Corner decoration) */}
      <div className="absolute -top-16 -right-16 w-80 h-80 opacity-[0.08] pointer-events-none text-amber-400 select-none">
        <LionOutline className="w-full h-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          {/* Top Interactive Badge */}
          <motion.div 
            id="hero-badge"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/5 border border-amber-500/25 text-amber-400 text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.06)] mb-6 cursor-default"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>أول منصة متكاملة للإعلانات والمتاجر في العراق</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            id="hero-main-title"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4"
          >
            كل ما تحتاجه في <span className="bg-gradient-to-r from-[#fdf5a6] via-[#d4af37] to-[#b8860b] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)]">سوق بغداد</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p 
            id="hero-sub-title"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
          >
            تصفّح آلاف الإعلانات والمنتجات الحصرية، وتسوق بكل ثقة وأمان من أفضل الحسابات والمتاجر الموثقة في جميع المحافظات العراقية.
          </motion.p>
        </div>

        {/* Search Bar Container */}
        <div id="hero-search-wrapper" className="max-w-2xl mx-auto mb-8 relative z-20 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-yellow-600/30 rounded-[22px] blur-md opacity-25 group-hover:opacity-40 transition duration-300 pointer-events-none" />
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl flex items-center p-1.5">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute right-4 w-5 h-5 text-amber-400" />
              <input 
                id="hero-search-input"
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="ابحث عن سيارة، هاتف، عقار، منتج في العراق..."
                className="w-full bg-transparent text-white placeholder-gray-400 rounded-xl py-3 sm:py-3.5 pr-12 pl-4 outline-none text-sm md:text-base font-medium"
              />
              {search && (
                <button 
                  id="hero-search-clear-btn"
                  onClick={() => setSearch('')} 
                  className="absolute left-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-2.5 py-1 rounded-lg text-xs transition-colors"
                >
                  مسح
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Grid/Horizontal Badges */}
        <div id="hero-categories-tabs" className="flex flex-wrap justify-center gap-2 mb-8 relative z-20 max-w-4xl mx-auto">
          {CATEGORIES.filter(c => c.id !== 'games').map(c => (
            <motion.button 
              id={`cat-btn-${c.id}`}
              key={c.id} 
              whileHover={{ y: -2, scale: 1.03 }} 
              whileTap={{ scale: 0.97 }} 
              onClick={() => setCat(c.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 ${
                cat === c.id 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-400 shadow-[0_4px_15px_rgba(212,175,55,0.25)] font-black' 
                  : 'bg-gray-900/60 text-gray-300 border-gray-800 backdrop-blur-md hover:border-gray-700 hover:text-white hover:bg-gray-900/85'
              }`}
            >
              <span className="text-base sm:text-lg">{c.emoji}</span>
              <span>{c.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Quick Metrics Cards */}
        <div id="hero-metrics-grid" className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-8 relative z-20">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3.5 text-center flex flex-col justify-center">
            <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">18</p>
            <p className="text-gray-400 text-[11px] font-bold mt-1">محافظة عراقية مغطاة</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3.5 text-center flex flex-col justify-center">
            <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalAdsCount}+</p>
            <p className="text-gray-400 text-[11px] font-bold mt-1">إعلان معروض حالياً</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3.5 text-center col-span-2 md:col-span-1 flex flex-col justify-center">
            <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">24/7</p>
            <p className="text-gray-400 text-[11px] font-bold mt-1">خدمة ومتابعة مباشرة</p>
          </div>
        </div>

        {/* Live Visitor Counter */}
        <div className="mb-6 relative z-20">
          <LiveVisitorCounter />
        </div>

        {/* Action Row: Transport & Install App */}
        <div id="hero-action-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto relative z-20">
          {/* Transport Section card */}
          <motion.button 
            id="hero-transport-card-btn"
            whileHover={{ y: -3, scale: 1.01 }}
            onClick={() => onTransportClick?.()}
            className="w-full flex items-center justify-between px-5 py-4 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/35 rounded-2xl transition-all group text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-500/25 rounded-xl flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-sm">🚌 قسم الخطوط والتوصيل</p>
                <p className="text-emerald-300 text-xs mt-0.5">نقل يومي مباشر للطلاب والموظفين</p>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          </motion.button>

          {/* Install PWA section card */}
          {!isStandalone && onInstallClick ? (
            <motion.button 
              id="hero-install-card-btn"
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={onInstallClick}
              className="w-full flex items-center justify-between px-5 py-4 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 rounded-2xl transition-all group text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">📲 تثبيت التطبيق</p>
                  <p className="text-amber-300/90 text-xs mt-0.5">ثبّت "سوق بغداد" كـ PWA على جهازك مباشرة</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            </motion.button>
          ) : null}
        </div>
      </div>

      {/* Baghdad Skyline Vector Backdrop */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-24 opacity-15 pointer-events-none select-none z-0">
        <CityOutline className="w-full h-full" />
      </div>
    </section>
  );
}
