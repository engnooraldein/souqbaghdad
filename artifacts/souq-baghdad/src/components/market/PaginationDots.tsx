import React from 'react';
import { motion } from 'framer-motion';

export function PaginationDots({ 
  total, 
  current, 
  onChange,
  hasMore,
  onLoadMore,
  loadingMore
}: { 
  total: number; 
  current: number; 
  onChange: (page: number) => void; 
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  if (total <= 1 && !hasMore) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6 mb-8" dir="rtl">
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = idx === current;
        return (
          <motion.button
            key={idx}
            onClick={() => onChange(idx)}
            className={`transition-all duration-300 rounded-full h-3 ${
              isActive 
                ? 'bg-[#fbbf24] w-9 shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
                : 'bg-white/20 hover:bg-white/40 w-3'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={`الصفحة ${idx + 1}`}
            aria-label={`الصفحة ${idx + 1}`}
          />
        );
      })}
    </div>
  );
}
