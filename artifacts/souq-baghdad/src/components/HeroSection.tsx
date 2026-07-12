import React from 'react';
import { motion } from 'framer-motion';
import { Search, Car, ChevronLeft, Smartphone } from 'lucide-react';
import { CATEGORIES } from '../App';
import LiveVisitorCounter from './LiveVisitorCounter';

interface HeroSectionProps {
  search: string;
  setSearch: (s: string) => void;
  cat: string;
  setCat: (c: string) => void;
  onTransportClick?: () => void;
  isStandalone?: boolean;
  onInstallClick?: () => void;
}

export function HeroSection({
  search, setSearch,
  cat, setCat,
  onTransportClick,
  isStandalone,
  onInstallClick
}: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-12 relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-10 right-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"/><div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl"/></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <motion.h1 initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="text-3xl md:text-4xl font-bold text-white mb-3">كل شي تحتاجه <span className="text-amber-400">بمكان واحد</span></motion.h1>
            <p className="text-gray-300">إعلانات + متجر — السوق الرقمي العراقي</p>
          </div>
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن سيارة، هاتف، عقار، منتج..."
                className="w-full bg-white/10 backdrop-blur text-white placeholder-gray-300 rounded-2xl py-4 pr-12 pl-4 border border-white/20 focus:border-amber-400 outline-none text-sm"/></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.filter(c=>c.id!=='games').map(c=>(
              <motion.button key={c.id} whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setCat(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${cat===c.id?'bg-amber-500 text-black border-amber-500':'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
                <span>{c.emoji}</span><span>{c.name}</span>
              </motion.button>
            ))}
          </div>
          <LiveVisitorCounter />
          {/* Transport Quick Access */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="mt-5 max-w-2xl mx-auto">
            <button onClick={()=>onTransportClick?.()}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-2xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-400"/>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">🚌 قسم الخطوط</p>
                  <p className="text-emerald-300 text-xs">نقل يومي للطلاب والموظفين 🎓👔</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1 transition-transform"/>
            </button>
          </motion.div>

          {!isStandalone && onInstallClick && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
              className="mt-3 max-w-2xl mx-auto">
              <button onClick={onInstallClick}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/30 rounded-2xl transition-all group"
                title="تثبيت التطبيق"
                aria-label="تثبيت التطبيق"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-amber-400"/>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">📲 تثبيت التطبيق</p>
                    <p className="text-amber-300/80 text-xs">ثبّت تطبيق "سوك بغداد" على جهازك لسهولة الوصول السريع</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform"/>
              </button>
            </motion.div>
          )}
        </div>
      </section>
  );
}
