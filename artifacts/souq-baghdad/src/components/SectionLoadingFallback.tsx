// ================================================
// شاشة انتظار خفيفة تظهر عند التبديل بين الأقسام
// تُستخدم كـ fallback في Suspense بدلاً من الصفحة البيضاء
// ================================================
import React from 'react';

interface Props {
  isDarkMode?: boolean;
}

export function SectionLoadingFallback({ isDarkMode = true }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{
        background: isDarkMode
          ? 'radial-gradient(circle at center, #0d1b3e 0%, #060d1f 100%)'
          : 'radial-gradient(circle at center, #f0f4ff 0%, #ffffff 100%)',
      }}
    >
      {/* Logo / Icon */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
            animation: 'ping-slow 1.2s ease-in-out infinite',
          }}
        />
        {/* Golden spinning arc */}
        <svg width="72" height="72" viewBox="0 0 72 72" className="relative z-10">
          <circle
            cx="36" cy="36" r="30"
            fill="none"
            stroke={isDarkMode ? '#1e2d54' : '#e2e8f0'}
            strokeWidth="4"
          />
          <circle
            cx="36" cy="36" r="30"
            fill="none"
            stroke="url(#goldArc)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 120"
            style={{ animation: 'spin 0.8s linear infinite', transformOrigin: '36px 36px' }}
          />
          <defs>
            <linearGradient id="goldArc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#fdf5a6" />
            </linearGradient>
          </defs>
        </svg>
        {/* Small gold dot in center */}
        <div
          className="absolute w-3 h-3 rounded-full z-20"
          style={{ background: 'linear-gradient(135deg, #d4af37, #fdf5a6)' }}
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-2" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
        <p
          className="text-lg font-black"
          style={{ color: isDarkMode ? '#d4af37' : '#92700a' }}
        >
          سوق بغداد
        </p>
        <p
          className="text-sm font-semibold"
          style={{ color: isDarkMode ? 'rgba(253,245,166,0.6)' : 'rgba(100,80,10,0.6)' }}
        >
          جاري التحميل، يرجى الانتظار...
        </p>
      </div>

      {/* Thin gold progress bar */}
      <div
        className="w-48 h-1 rounded-full overflow-hidden"
        style={{ background: isDarkMode ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.2)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(to right, #d4af37, #fdf5a6, #d4af37)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ping-slow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
