import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send, CheckCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'ad' | 'product' | 'transport' | 'user';
  targetTitle: string;
}

export function ReportModal({ isOpen, onClose, targetId, targetType, targetTitle }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reasons = [
    'محتوى مسيء أو غير لائق',
    'احتيال أو نصب',
    'معلومات كاذبة أو مضللة',
    'عنصرية أو خطاب كراهية',
    'محتوى مكرر (سبام)',
    'غير ذلك'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setReason('');
        setDetails('');
        onClose();
      }, 2000);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-10"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-5 pb-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              إبلاغ عن محتوى
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">تم استلام البلاغ</h3>
                <p className="text-gray-400 text-sm">شكراً لك! سيقوم فريق المراجعة بالتحقق من المحتوى المخالف في أسرع وقت.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <p className="text-red-400 text-sm font-bold truncate">
                    أنت تقوم بالإبلاغ عن: {targetTitle}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">سبب الإبلاغ *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {reasons.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className={`p-2.5 text-sm rounded-xl text-right transition-colors border ${
                          reason === r 
                            ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                            : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:bg-slate-800 hover:text-gray-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">تفاصيل إضافية (اختياري)</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="يرجى كتابة أي تفاصيل قد تساعدنا في المراجعة..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none h-24 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!reason || isSubmitting}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-800 disabled:text-gray-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        إرسال البلاغ
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
