import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ReadingModeOverlayProps {
  text: string;
  title: string;
  onClose: () => void;
}

export function ReadingModeOverlay({ text, title, onClose }: ReadingModeOverlayProps) {
  const [fontSize, setFontSize] = useState<number>(18); // default comfortable reading size on mobile
  const [lineHeight, setLineHeight] = useState<number>(1.8); // default comfortable high line height
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex flex-col bg-gray-950 p-4 sm:p-6 md:p-8"
      dir="rtl"
    >
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <div>
            <h3 className="text-white font-black text-sm sm:text-base">وضع القراءة</h3>
            <p className="text-gray-400 text-xs truncate max-w-[250px] sm:max-w-xs">{title}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
          {/* Theme switcher */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-0.5 shadow-inner">
            <button 
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-250 ${theme === 'dark' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'}`}
            >
              داكن
            </button>
            <button 
              type="button"
              onClick={() => setTheme('sepia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-250 ${theme === 'sepia' ? 'bg-[#f4ebd0] text-[#5c4033] shadow' : 'text-gray-400 hover:text-white'}`}
            >
              سيبيا
            </button>
            <button 
              type="button"
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-250 ${theme === 'light' ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}
            >
              فاتح
            </button>
          </div>

          {/* Font controls */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-0.5 gap-1 shadow-inner">
            <button 
              type="button"
              onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs font-black transition-all"
              title="تصغير الخط"
            >
              A-
            </button>
            <span className="text-xs text-amber-400 px-1 font-mono font-bold min-w-[32px] text-center">{fontSize}px</span>
            <button 
              type="button"
              onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs font-black transition-all"
              title="تكبير الخط"
            >
              A+
            </button>
          </div>

          {/* Line height controls */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-0.5 gap-1 shadow-inner">
            <button 
              type="button"
              onClick={() => setLineHeight(prev => Math.max(1.4, Number((prev - 0.2).toFixed(1))))}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs font-black transition-all"
              title="تباعد الأسطر مدمج"
            >
              ↕-
            </button>
            <span className="text-xs text-amber-400 px-1 font-mono font-bold min-w-[32px] text-center">{lineHeight}</span>
            <button 
              type="button"
              onClick={() => setLineHeight(prev => Math.min(2.8, Number((prev + 0.2).toFixed(1))))}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs font-black transition-all"
              title="تباعد الأسطر واسع"
            >
              ↕+
            </button>
          </div>

          {/* Close button */}
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all shadow-inner"
            title="إغلاق وضع القراءة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content scrollable area with clean typography */}
      <div 
        className={`flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 rounded-3xl border transition-all duration-300 shadow-2xl ${
          theme === 'dark' 
            ? 'bg-gray-950/40 border-gray-900 text-gray-200' 
            : theme === 'sepia'
            ? 'bg-[#fcf8ed] border-[#e8dfc5] text-[#2c1d11]'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div 
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: lineHeight,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          className="whitespace-pre-wrap break-words transition-all duration-200 font-medium leading-relaxed max-w-3xl mx-auto selection:bg-amber-500/30"
        >
          {text}
        </div>
      </div>
    </motion.div>
  );
}
