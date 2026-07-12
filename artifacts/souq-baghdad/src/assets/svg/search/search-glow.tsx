// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (search-glow).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const SearchGlow = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 600 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <radialGradient id="goldCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#BF9B30" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlowBlur">
          <feGaussianBlur stdDeviation="25" />
        </filter>
      </defs>
      {/* Dynamic volumetric backlighting glow */}
      <ellipse
        cx="300"
        y="100"
        rx="260"
        ry="60"
        fill="url(#goldCoreGlow)"
        filter="url(#softGlowBlur)"
      >
        <animate attributeName="rx" values="240;280;240" dur="4s" repeatCount="indefinite" />
        <animate attributeName="ry" values="50;70;50" dur="4s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
};
