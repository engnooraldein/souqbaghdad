// ===========================================
// مسؤولية هذا الملف:
// نافذة الترحيب والتعريف بالتطبيق للمستخدمين الجدد (Onboarding Modal).
//
// لا يتصل بـ Supabase مباشرة.
// يحفظ حالة "تم الترحيب" في LocalStorage بمفتاح souq_onboarding_v2.
//
// آمن للتعديل:
// نعم، يمكن تحديث محتوى الشرائح أو إضافة شرائح جديدة.
//
// النسخة: 1.8.0 — تشمل دليل تثبيت PWA لـ iPhone وAndroid
// ===========================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── بيانات الشرائح ───────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'welcome',
    icon: '🛍️',
    gradient: 'from-amber-500 to-orange-500',
    title: 'مرحباً في سوك بغداد',
    desc: 'أكبر سوق رقمي عراقي — تصفح بدون تسجيل، وسجّل مجاناً لنشر إعلاناتك وفتح متجرك.',
    badge: null,
  },
  {
    id: 'features',
    icon: '📢',
    gradient: 'from-blue-500 to-indigo-600',
    title: 'إعلانات + متجر + نقل',
    desc: 'انشر إعلانات العقارات والسيارات والهواتف، أو افتح متجرك لبيع المنتجات، أو أضف خدمات النقل.',
    badge: 'مجاني 100%',
  },
  {
    id: 'post',
    icon: '🚀',
    gradient: 'from-green-500 to-emerald-600',
    title: 'انشر أول إعلان في 60 ثانية',
    desc: null,
    steps: [
      { emoji: '1️⃣', text: 'اضغط زر "+" في أسفل الشاشة' },
      { emoji: '2️⃣', text: 'اختر التصنيف وأضف الصور' },
      { emoji: '3️⃣', text: 'اكتب السعر والوصف واضغط "نشر"' },
    ],
    badge: null,
  },
  {
    id: 'profile',
    icon: '👤',
    gradient: 'from-purple-500 to-violet-600',
    title: 'صفحتك العامة',
    desc: 'كل مستخدم له صفحة عامة يراها أي زائر مع جميع إعلاناته ومنتجاته. عدّل بياناتك وصورك في أي وقت.',
    badge: null,
  },
  {
    id: 'iphone',
    icon: '🍎',
    gradient: 'from-gray-600 to-gray-800',
    title: 'أضف التطبيق لشاشة iPhone',
    desc: null,
    steps: [
      { emoji: '1️⃣', text: 'افتح الموقع في Safari (ليس Chrome)' },
      { emoji: '2️⃣', text: 'اضغط زر المشاركة ⬆️ في شريط الأدوات' },
      { emoji: '3️⃣', text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
      { emoji: '4️⃣', text: 'اضغط "إضافة" — وهو يفتح كتطبيق!' },
    ],
    badge: 'iOS Safari',
  },
  {
    id: 'android',
    icon: '🤖',
    gradient: 'from-green-600 to-teal-700',
    title: 'أضف التطبيق لشاشة Android',
    desc: null,
    steps: [
      { emoji: '1️⃣', text: 'افتح الموقع في Chrome' },
      { emoji: '2️⃣', text: 'اضغط القائمة ⋮ في أعلى اليمين' },
      { emoji: '3️⃣', text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
      { emoji: '4️⃣', text: 'اضغط "إضافة" — يعمل بدون إنترنت!' },
    ],
    badge: 'Android Chrome',
  },
];

// ─── متغيرات الحركة ────────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 80 : -80, opacity: 0 }),
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const cardVariants = {
  hidden: { scale: 0.88, opacity: 0, y: 24 },
  visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
  exit: { scale: 0.92, opacity: 0, y: 16 },
};

// ─── المكوّن الرئيسي ────────────────────────────────────────────────────────────
export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      goTo(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) goTo(step - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ direction: 'rtl' }}
      >
        {/* خلفية ضبابية */}
        <motion.div
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* البطاقة */}
        <motion.div
          key="onboarding-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative bg-gray-900 rounded-3xl w-full max-w-sm border border-gray-700/80 shadow-2xl shadow-black/60 overflow-hidden z-10"
        >
          {/* شريط التقدم الملوّن */}
          <div
            className={`h-1.5 bg-gradient-to-r ${slide.gradient} transition-all duration-500`}
            style={{ width: `${((step + 1) / SLIDES.length) * 100}%` }}
          />

          {/* زر الإغلاق */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-gray-800/80 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-20"
            aria-label="إغلاق"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Badge */}
          {slide.badge && (
            <div className="absolute top-4 right-4 z-20">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r ${slide.gradient} text-white shadow-sm`}>
                {slide.badge}
              </span>
            </div>
          )}

          {/* محتوى الشريحة */}
          <div className="px-7 pt-10 pb-8 min-h-[340px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center text-center flex-1"
              >
                {/* الأيقونة */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
                  className="text-6xl mb-5 select-none"
                >
                  {slide.icon}
                </motion.div>

                {/* العنوان */}
                <h2 className="text-xl font-extrabold text-white mb-3 leading-tight">
                  {slide.title}
                </h2>

                {/* الوصف */}
                {slide.desc && (
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    {slide.desc}
                  </p>
                )}

                {/* خطوات */}
                {slide.steps && (
                  <ul className="w-full mt-2 space-y-2.5">
                    {slide.steps.map((s, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.07 }}
                        className="flex items-center gap-2.5 bg-gray-800/70 rounded-xl px-3 py-2.5 text-right"
                      >
                        <span className="text-base flex-shrink-0">{s.emoji}</span>
                        <span className="text-gray-200 text-xs leading-snug">{s.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* الجزء السفلي */}
          <div className="px-7 pb-7 space-y-4">
            {/* نقاط التنقل */}
            <div className="flex justify-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`الشريحة ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === step
                      ? `w-6 h-2 bg-gradient-to-r ${slide.gradient}`
                      : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            {/* أزرار التنقل */}
            <div className="flex gap-2.5">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-medium text-sm transition-all"
                >
                  السابق
                </button>
              )}

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm text-black shadow-lg transition-all bg-gradient-to-r ${slide.gradient} shadow-amber-500/20`}
              >
                {isLast ? '🎉 ابدأ الآن' : 'التالي ←'}
              </motion.button>
            </div>

            {/* تخطي */}
            {!isLast && (
              <button
                onClick={onClose}
                className="w-full text-center text-gray-500 hover:text-gray-400 text-xs transition-colors"
              >
                تخطي
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
