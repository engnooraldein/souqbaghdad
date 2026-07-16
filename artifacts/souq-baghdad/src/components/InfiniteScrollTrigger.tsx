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
import { SkeletonCard } from './SkeletonCard';

interface Props {
  onLoadMore: () => void | Promise<void>;
  hasMore: boolean;
  isLoading?: boolean;
  loadingText?: string;
  skeletonType?: 'grid' | 'feed' | 'transport' | 'profile' | 'none';
  skeletonCount?: number;
}

export default function InfiniteScrollTrigger({ 
  onLoadMore, 
  hasMore, 
  isLoading = false, 
  loadingText = "جاري تحميل المزيد...",
  skeletonType = 'grid',
  skeletonCount = 3
}: Props) {
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
      { threshold: 0.1, rootMargin: '800px' }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isActuallyLoading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="w-full py-8 flex flex-col justify-center items-center gap-6">
      {isActuallyLoading ? (
        <div className="w-full space-y-6">
          {/* Skeletons depending on type */}
          {skeletonType === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full" dir="rtl">
              {Array.from({ length: skeletonCount }).map((_, idx) => (
                <SkeletonCard key={`grid-sk-${idx}`} />
              ))}
            </div>
          )}

          {skeletonType === 'feed' && (
            <div className="space-y-5 w-full max-w-2xl mx-auto" dir="rtl">
              {Array.from({ length: skeletonCount }).map((_, idx) => (
                <div key={`feed-sk-${idx}`} className="bg-gray-900/60 border border-gray-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-4 animate-pulse">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gray-800" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-800 rounded-md w-24" />
                        <div className="h-3 bg-gray-800 rounded-md w-36" />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-gray-800" />
                  </div>
                  {/* Title / Description */}
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-800 rounded-md w-3/4" />
                    <div className="h-3 bg-gray-800 rounded-md w-full" />
                    <div className="h-3 bg-gray-800 rounded-md w-5/6" />
                  </div>
                  {/* Media Block */}
                  <div className="relative rounded-2xl bg-gray-800/40 aspect-[16/9] w-full" />
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/40">
                    <div className="h-4 bg-gray-800 rounded-md w-28" />
                    <div className="flex gap-2">
                      <div className="w-16 h-8 bg-gray-800 rounded-xl" />
                      <div className="w-16 h-8 bg-gray-800 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {skeletonType === 'transport' && (
            <div className="space-y-4 w-full" dir="rtl">
              {Array.from({ length: skeletonCount }).map((_, idx) => (
                <div key={`trans-sk-${idx}`} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-800" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-800 rounded-md w-32" />
                      <div className="h-3 bg-gray-800 rounded-md w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <div className="w-20 h-8 bg-gray-800 rounded-xl" />
                    <div className="w-20 h-8 bg-gray-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {skeletonType === 'profile' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full" dir="rtl">
              {Array.from({ length: skeletonCount }).map((_, idx) => (
                <div key={`prof-sk-${idx}`} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-gray-800 rounded-md w-24" />
                    <div className="h-3 bg-gray-800 rounded-md w-16" />
                  </div>
                  <div className="w-10 h-6 bg-gray-800 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {skeletonType !== 'none' && (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-2">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <span>{loadingText}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 opacity-60">
          <div className="w-6 h-6 rounded-full border-2 border-gray-600 border-t-amber-500 animate-pulse" />
          <span className="text-gray-500 text-xs">اسحب للمزيد</span>
        </div>
      )}
    </div>
  );
}
