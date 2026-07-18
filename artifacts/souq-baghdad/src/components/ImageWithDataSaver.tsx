import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert } from 'lucide-react';

interface ImageWithDataSaverProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
}

export function ImageWithDataSaver({ src, fallback, className, alt, ...props }: ImageWithDataSaverProps) {
  const [isDataSaver, setIsDataSaver] = useState(() => {
    try {
      return localStorage.getItem('souqDataSaver') === 'true';
    } catch {
      return false;
    }
  });

  const [loadAnyway, setLoadAnyway] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setIsDataSaver(localStorage.getItem('souqDataSaver') === 'true');
      } catch {}
    };
    window.addEventListener('souq-datasaver-change', handleStorageChange);
    return () => window.removeEventListener('souq-datasaver-change', handleStorageChange);
  }, []);

  if (isDataSaver && !loadAnyway) {
    return (
      <div 
        className={`${className} bg-slate-800/80 border border-amber-500/30 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-slate-800 transition-all rounded-xl relative`}
        onClick={(e) => {
          e.stopPropagation();
          setLoadAnyway(true);
        }}
        title="اضغط لعرض الصورة (وضع توفير البيانات نشط)"
      >
        <ShieldAlert className="w-8 h-8 text-amber-500 mb-2 animate-bounce" />
        <span className="text-xs font-bold text-amber-300 block">وضع توفير البيانات نشط 🔋</span>
        <span className="text-[10px] text-gray-400 block mt-1">اضغط لتحميل وعرض الصورة 👁️</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      loading={props.loading || "lazy"}
      onError={(e) => {
        if (fallback) {
          (e.target as HTMLImageElement).src = fallback;
        }
      }}
      {...props} 
    />
  );
}
