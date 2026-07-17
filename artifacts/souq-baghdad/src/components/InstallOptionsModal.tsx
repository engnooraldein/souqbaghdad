import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download } from 'lucide-react';

interface InstallOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPwaInstall: () => void;
  playStoreUrl: string;
}

export function InstallOptionsModal({ isOpen, onClose, onPwaInstall, playStoreUrl }: InstallOptionsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-10"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-5 pb-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-400" />
              تثبيت التطبيق
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            
            {/* Google Play Option */}
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 rounded-xl transition-colors group"
              onClick={onClose}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-emerald-400 font-bold text-base mb-1">متجر جوجل بلاي</h3>
                  <p className="text-emerald-400/80 text-xs">تنزيل التطبيق الرسمي للأندرويد</p>
                </div>
              </div>
            </a>

            {/* PWA Option */}
            <button
              onClick={() => {
                onClose();
                onPwaInstall();
              }}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors group text-right"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">إضافة للشاشة الرئيسية</h3>
                  <p className="text-gray-400 text-xs">سريع وبدون متجر (جميع الأجهزة)</p>
                </div>
              </div>
            </button>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
