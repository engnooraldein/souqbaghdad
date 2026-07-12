// ===========================================
// مسؤولية هذا الملف:
// يعرض بطاقة وهمية (Skeleton Loader) أثناء تحميل البيانات.
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
//
// التصميم مطابق تماماً لـ AdCard و ProductCard:
// - aspect-[4/3] للصورة
// - p-3 للمحتوى
// - صف البائع + الوقت في الأسفل
//
// الحركة: Pulse Animation عبر Framer Motion (موجة انسيابية).
//
// آمن للتعديل: نعم.
// النسخة: 1.8.0
// ===========================================
import React from 'react';
import { motion } from 'framer-motion';

// ─── حركة النبض الأساسية ─────────────────────────────────────────────────────
const pulseVariants = {
  start: { opacity: 0.45 },
  end:   { opacity: 0.9  },
};

const pulseTransition = {
  duration: 1.1,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const,
};

// مكوّن مساعد لكتلة Skeleton مع تأخير للموجة المتتالية
function SkeletonBlock({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`bg-gray-700 rounded-lg ${className}`}
      variants={pulseVariants}
      initial="start"
      animate="end"
      transition={{ ...pulseTransition, delay }}
    />
  );
}

// ─── البطاقة الواحدة — تطابق AdCard / ProductCard ───────────────────────────
export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 flex flex-col h-full">
      {/* صورة — aspect-[4/3] مثل AdCard */}
      <SkeletonBlock className="w-full aspect-[4/3] rounded-none" delay={delay} />

      {/* محتوى — p-3 مثل AdCard */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        {/* العنوان */}
        <SkeletonBlock className="h-4 w-3/4" delay={delay + 0.05} />

        {/* السعر */}
        <SkeletonBlock className="h-5 w-1/2" delay={delay + 0.1} />

        {/* الموقع */}
        <SkeletonBlock className="h-3 w-2/3" delay={delay + 0.15} />

        {/* صف البائع والوقت */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1.5">
            {/* صورة البائع */}
            <SkeletonBlock className="w-5 h-5 rounded-full" delay={delay + 0.2} />
            {/* اسم البائع */}
            <SkeletonBlock className="h-3 w-16" delay={delay + 0.22} />
          </div>
          {/* الوقت + المشاهدات */}
          <SkeletonBlock className="h-3 w-12" delay={delay + 0.25} />
        </div>
      </div>
    </div>
  );
}

// ─── شبكة من Skeleton Cards — للاستخدام في MarketView / ProductsView ────────
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} delay={i * 0.04} />
      ))}
    </div>
  );
}
