// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (bottom-nav-glow).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const BottomNavGlow = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 400 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <radialGradient id="navGlowCore" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#09235e" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#031131" stopOpacity="0" />
        </radialGradient>
        <filter id="navGlowBlur">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* Glow path hugging the bottom navigation bar */}
      <path
        d="M 0 60 Q 200 -20 400 60 Z"
        fill="url(#navGlowCore)"
        filter="url(#navGlowBlur)"
      />
    </svg>
  );
};
