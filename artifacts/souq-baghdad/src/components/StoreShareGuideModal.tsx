// ===========================================
// مسؤولية هذا الملف:
// دليل مشاركة رابط المتجر (Store Share Guide Modal).
// يشرح للبائع كيفية مشاركة رابط متجره.
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, TrendingUp, Instagram, MessageCircle, ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';

interface StoreShareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeUrl: string;
  onShare: () => void;
}

export function StoreShareGuideModal({ isOpen, onClose, storeUrl, onShare }: StoreShareGuideModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative bg-gray-900 rounded-3xl p-6 md:p-8 w-full max-w-md border border-gray-700 shadow-2xl z-10 dir-rtl text-right overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors z-20">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">دليل تفاعل المتجر 🚀</h2>
              <p className="text-gray-400 text-sm">ضاعف مبيعاتك بخطوات بسيطة</p>
            </div>
          </div>

          <div className="space-y-4 mb-8 relative z-10">
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800/20 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingBag className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">تسهيل طلب الأوردرات</h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  مشاركة صفحتك تجعل متجرك أكثر تفاعلاً وتسهل على الزبائن الوصول لجميع منتجاتك والطلب مباشرة بضغطة زر.
                </p>
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Instagram className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">الرابط في البايو (Bio)</h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  ضع الرابط في بايو حسابك على انستغرام أو تيك توك، ليكون واجهة احترافية متكاملة لعملائك تغنيك عن أي موقع آخر.
                </p>
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">تغنيك عن الترويج المدفوع</h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  مجرد مشاركة الرابط في جروبات الفيسبوك أو قنوات التليكرام كفيلة بجلب زبائن جدد يومياً بتصميم جميل ومميزات تفاعلية!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 relative z-10">
            <button
              onClick={onShare}
              className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              <span>مشاركة الصفحة</span>
            </button>
            
            <button
              onClick={handleCopy}
              className={`py-3.5 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                copied 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
