import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  minDuration?: number; // Minimum time to show the loader
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  minDuration = 3500 
}) => {
  const [show, setShow] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const startTimeRef = React.useRef(Date.now());
  const hasTriggeredRef = React.useRef(false);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    let maxTimer: NodeJS.Timeout;

    const triggerHide = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      setIsFadingOut(true); 
      setTimeout(() => setShow(false), 800); // Wait 800ms for cinematic transition
    };

    // 1. If data finishes loading, we wait the remaining time to reach minDuration
    if (!isLoading) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDuration - elapsed);
      hideTimer = setTimeout(triggerHide, remainingTime);
    }

    // 2. Regardless of data loading, force hide after 8000ms (Adaptive Maximum)
    const elapsedSinceStart = Date.now() - startTimeRef.current;
    const timeUntilMax = Math.max(0, 8000 - elapsedSinceStart);
    maxTimer = setTimeout(triggerHide, timeUntilMax);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(maxTimer);
    };
  }, [isLoading, minDuration]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-110 bg-transparent blur-sm' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #1b498f 0%, #0c2b5e 100%)',
      }}
    >
      <div className={`flex flex-col items-center justify-center transition-all duration-[800ms] ease-in-out ${
        isFadingOut ? 'scale-125 opacity-0 translate-y-[-20px]' : 'scale-100 opacity-100'
      }`}>
        {/* Simple elegant CSS spinner */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-[#0c2b5e] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#d4af37] rounded-full border-t-transparent animate-spin"></div>
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center mt-2">
          <div className="text-[#fdf5a6] text-xl font-bold tracking-wider mb-2">
            أهلاً بك في سوك بغداد
          </div>
          <div className="text-blue-200 text-sm opacity-90 animate-pulse text-center max-w-[280px]">
            جاري تحميل أحدث العروض والمنتجات، يرجى الانتظار ثوانٍ...
          </div>
        </div>
      </div>
    </div>
  );
};

