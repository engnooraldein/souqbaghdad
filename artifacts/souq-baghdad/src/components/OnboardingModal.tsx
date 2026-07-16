// ===========================================
// مسؤولية هذا الملف:
// يعرض شاشة ترحيبية ودليل خطوة بخطوة للعملاء الجدد (Onboarding Modal).
// يشرح خدمات الموقع وطريقة التسجيل والبيع والشراء لمرة واحدة فقط.
// ===========================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useSound } from '../hooks/useSound';

const {
  X, ChevronRight, ChevronLeft, Sparkles, UserPlus, ShoppingBag, 
  Car, ShieldCheck, Heart, ArrowRight, ArrowLeft, CheckCircle2
} = LucideIcons;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const playSound = useSound();

  useEffect(() => {
    if (isOpen) {
      playSound('info');
    }
  }, [isOpen]);

  const steps = [
    {
      title: 'أهلاً بك في سوق بغداد الرقمي 🌟',
      subtitle: 'الوجهة الأولى والأشمل للإعلانات والخدمات في العراق',
      description: 'سوق بغداد الرقمي هو منصة متكاملة تتيح لك تصفح ونشر الإعلانات المبوبة، تصفح المتاجر والمنتجات المتنوعة، وحجز خطوط النقل الطلابي واليومي والمزيد بكل سهولة وأمان.',
      icon: <Sparkles className="w-16 h-16 text-amber-400 animate-pulse" />,
      features: [
        { label: 'إعلانات مبوبة مجانية', icon: <ShoppingBag className="w-5 h-5 text-amber-400" /> },
        { label: 'متاجر متكاملة للمنتجات', icon: <ShoppingBag className="w-5 h-5 text-purple-400" /> },
        { label: 'خطوط نقل طلابي ورحلات طوارئ', icon: <Car className="w-5 h-5 text-gray-400" /> }
      ]
    },
    {
      title: 'كيف تقوم بالتسجيل والبدء؟ 👤',
      subtitle: 'خطوات بسيطة تمنحك وصولاً كاملاً لجميع ميزات التطبيق',
      description: 'إنشاء حسابك مجاني بالكامل ولا يستغرق سوى دقيقة واحدة لتتمكن من إضافة إعلاناتك والتواصل مع البائعين بشكل مباشر.',
      icon: <UserPlus className="w-16 h-16 text-emerald-400" />,
      points: [
        'انقر على زر "تسجيل الدخول" في شريط التنقل العلوي.',
        'أدخل اسمك ورقم هاتفك العراقي مع كلمة مرور آمنة لتأمين الحساب.',
        'بعد التسجيل، يمكنك توثيق حسابك للحصول على شارة موثقة وزيادة موثوقيتك.',
        'ابدأ فوراً بنشر إعلاناتك أو تصفح المتاجر وشراء المنتجات المميزة.'
      ]
    },
    {
      title: 'نصائح لتعامل آمن وموثوق 🛡️',
      subtitle: 'السلامة والشفافية هي قيمتنا الأساسية الأولى دائماً',
      description: 'نحن في سوق بغداد نعمل جاهدين لتوفير بيئة تجارية آمنة، ويرجى اتباع النصائح التالية لضمان أفضل تجربة استخدام ممكنة:',
      icon: <ShieldCheck className="w-16 h-16 text-gray-400 animate-bounce" />,
      guidelines: [
        { text: 'تواصل مباشرة عبر واتساب أو الاتصال الهاتفي الرسمي المرفق بالإعلان.', color: 'text-green-400' },
        { text: 'قم بمعاينة السلعة أو المنتج بشكل شخصي في مكان عام وآمن قبل الدفع.', color: 'text-gray-400' },
        { text: 'تأكد من مراجعة تقييمات التجار والحسابات الموثقة (ذات الشارة الذهبية).', color: 'text-amber-400' },
        { text: 'يمكنك الإبلاغ عن أي إعلان أو حساب مخالف فوراً لمراجعته من قبل الإدارة.', color: 'text-red-400' }
      ]
    }
  ];

  const handleNext = () => {
    playSound('click');
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    playSound('click');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    playSound('success');
    localStorage.setItem('souq_onboarding_completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={handleComplete}
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-gray-900 rounded-3xl w-full max-w-lg border border-gray-800 shadow-2xl overflow-hidden z-10"
          dir="rtl"
        >
          {/* Top colored progress bar */}
          <div className="h-1.5 w-full bg-gray-850 flex">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-full flex-1 transition-all duration-300 ${
                  idx <= currentStep ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Close Button */}
          <button 
            onClick={handleComplete} 
            className="absolute top-4 left-4 p-2 bg-gray-850 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors z-20"
            title="إغلاق الترحيب"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Body */}
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Step Icon with background pulse */}
            <div className="relative mb-6 p-4 bg-gray-850/60 rounded-3xl border border-gray-800 shadow-inner">
              {steps[currentStep].icon}
            </div>

            {/* Titles */}
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-amber-400/90 text-xs sm:text-sm font-semibold mb-4">
              {steps[currentStep].subtitle}
            </p>

            {/* Description */}
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 max-w-md">
              {steps[currentStep].description}
            </p>

            {/* Dynamic visual assets per step */}
            <div className="w-full text-right bg-gray-850/45 border border-gray-850 rounded-2xl p-4 sm:p-5 mb-6 min-h-[140px] flex flex-col justify-center">
              {/* Step 0 - Features list */}
              {currentStep === 0 && (
                <div className="space-y-3">
                  {steps[0].features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-900 rounded-lg border border-gray-800 shrink-0">
                        {feat.icon}
                      </div>
                      <span className="text-gray-250 text-xs sm:text-sm font-bold">{feat.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 1 - Registration points */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  {steps[1].points?.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-gray-250 text-xs sm:text-sm leading-snug">{pt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2 - Safety rules */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  {steps[2].guidelines?.map((guide, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-gray-250 text-xs sm:text-sm leading-snug">{guide.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="w-full flex items-center justify-between gap-4 mt-2">
              {/* Skip / Back button */}
              {currentStep > 0 ? (
                <button 
                  onClick={handlePrev}
                  className="px-4 py-3 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              ) : (
                <button 
                  onClick={handleComplete}
                  className="px-4 py-3 text-gray-500 hover:text-gray-300 font-bold text-xs sm:text-sm transition-colors"
                >
                  تخطي التعارف
                </button>
              )}

              {/* Next / Complete button */}
              <button 
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-gray-950 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
              >
                <span>{currentStep === steps.length - 1 ? 'ابدأ الاستخدام 🚀' : 'التالي'}</span>
                {currentStep < steps.length - 1 && <ArrowLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
