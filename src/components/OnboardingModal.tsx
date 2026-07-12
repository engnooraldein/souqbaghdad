import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Search, Store, Share2, Plus } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: 'مرحباً بك في سوك بغداد! 👋',
    description: 'السوق الرقمي العراقي الأول الذي يجمع كل شيء في مكان واحد. من إبرة الخياطة وحتى السيارات والعقارات!',
    icon: <Store className="w-16 h-16 text-amber-500 mb-4" />
  },
  {
    title: 'بيع واشتري بسهولة 🛒',
    description: 'نظام ذكي للبحث والفلترة حسب المحافظة والفئة، مع إمكانية التواصل المباشر مع البائع عبر واتساب.',
    icon: <Search className="w-16 h-16 text-blue-500 mb-4" />
  },
  {
    title: 'إعلانات مجانية وسريعة 🚀',
    description: 'يمكنك إضافة إعلانك الأول مجاناً وفي أقل من دقيقة. شارك منتجاتك مع آلاف المستخدمين يومياً!',
    icon: <Plus className="w-16 h-16 text-emerald-500 mb-4" />
  },
  {
    title: 'تثبيت التطبيق 📱',
    description: 'للحصول على أفضل تجربة، يمكنك تثبيت الموقع كتطبيق (PWA) على شاشتك الرئيسية في iOS عبر زر المشاركة ثم "أضف للشاشة الرئيسية" (Add to Home Screen)، وفي Android من إعدادات المتصفح.',
    icon: <Share2 className="w-16 h-16 text-purple-500 mb-4" />
  }
];

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl"
        dir="rtl"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-gray-800 text-gray-400 hover:text-white rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              {ONBOARDING_STEPS[step].icon}
              <h2 className="text-2xl font-black text-white mb-3">{ONBOARDING_STEPS[step].title}</h2>
              <p className="text-gray-400 leading-relaxed text-sm">
                {ONBOARDING_STEPS[step].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 bg-gray-800/50 border-t border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              {ONBOARDING_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-amber-500' : 'w-2 bg-gray-700'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={prevStep}
                disabled={step === 0}
                className="p-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <button 
            onClick={nextStep}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {step === ONBOARDING_STEPS.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
