import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function HorizontalCarousel({ 
  items, 
  renderItem,
  lazyLoad = false,
  initialVisibleCount = 8
}: { 
  items: any[]; 
  renderItem: (item: any, idx: number) => React.ReactNode;
  lazyLoad?: boolean;
  initialVisibleCount?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(lazyLoad ? initialVisibleCount : items.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setVisibleCount(lazyLoad ? initialVisibleCount : items.length);
  }, [items.length, lazyLoad, initialVisibleCount]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
    
    if (lazyLoad && visibleCount < items.length) {
      const currentScroll = Math.abs(scrollLeft);
      if (currentScroll + clientWidth >= scrollWidth - 100) {
        if (!isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => Math.min(items.length, prev + 8));
            setIsLoadingMore(false);
          }, 600);
        }
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use a throttled or debounced scroll listener for active index to prevent lag
    let scrollTimeout: any;
    const onScroll = () => {
      handleScroll();
      
      // Update active index less frequently
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!el) return;
        const currentScroll = Math.abs(el.scrollLeft);
        const index = Math.min(
          visibleCount - 1,
          Math.max(0, Math.round((currentScroll / el.scrollWidth) * visibleCount))
        );
        setActiveIndex(index);
      }, 100);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [items, visibleCount, isLoadingMore, lazyLoad]);

  const scrollToItem = (idx: number) => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const cardWidth = el.scrollWidth / items.length;
    // Scroll RTL-aware
    const isRtl = document.dir === 'rtl' || true;
    const targetScroll = isRtl ? - (cardWidth * idx) : (cardWidth * idx);
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setActiveIndex(idx);
  };

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="relative w-full overflow-hidden" dir="rtl">
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-none py-2 px-4 sm:px-0"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {visibleItems.map((item, idx) => (
          <div key={idx} className="shrink-0 first:mr-0 last:ml-0">
            {renderItem(item, idx)}
          </div>
        ))}
        
        {lazyLoad && isLoadingMore && (
          <div className="snap-start shrink-0 flex items-center justify-center w-24 h-full min-h-[100px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fbbf24]"></div>
          </div>
        )}
      </div>

      {/* Optional Dots Indicator for small lists */}
      {items.length <= 15 && items.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3 mb-1">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToItem(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex 
                  ? 'w-6 bg-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                  : 'w-1.5 bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label={`الشريحة ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
