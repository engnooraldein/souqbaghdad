// ===========================================
// مسؤولية هذا الملف:
// مكوّن يرصد وصول المستخدم لنهاية القائمة (Infinite Scroll Trigger).
// يستخدم IntersectionObserver لاكتشاف الوصول للأسفل.
//
// لا يتصل بـ Supabase مباشرة.
// عند الاكتشاف يستدعي callback لجلب البيانات التالية.
//
// ✅ آمن: IntersectionObserver يُنظَّف في cleanup function.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  onLoadMore: () => void | Promise<void>;
  hasMore: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export default function InfiniteScrollTrigger({ onLoadMore, hasMore, isLoading = false, loadingText = "جاري تحميل المزيد..." }: Props) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  
  const isActuallyLoading = isLoading || internalLoading;

  useEffect(() => {
    if (!hasMore || isActuallyLoading) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isActuallyLoading) {
          const result = onLoadMore();
          if (result instanceof Promise) {
            setInternalLoading(true);
            try {
              await result;
            } finally {
              setInternalLoading(false);
            }
          }
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isActuallyLoading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="w-full py-8 flex flex-col justify-center items-center gap-3">
      {isActuallyLoading ? (
        <>
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">{loadingText}</span>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-60">
          <div className="w-6 h-6 rounded-full border-2 border-gray-600 border-t-emerald-500 animate-pulse" />
          <span className="text-gray-500 text-xs">اسحب للمزيد</span>
        </div>
      )}
    </div>
  );
}
