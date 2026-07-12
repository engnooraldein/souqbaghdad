// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (hero-dots).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const HeroDots = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 400 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* 5x10 clean responsive dot grid with subtle responsive pulsing */}
      <g fill="#BF9B30" fillOpacity="0.15">
        {/* Row 1 */}
        <circle cx="20" cy="20" r="1.5" />
        <circle cx="60" cy="20" r="1.5" />
        <circle cx="100" cy="20" r="1.5" />
        <circle cx="140" cy="20" r="1.5" />
        <circle cx="180" cy="20" r="1.5" />
        <circle cx="220" cy="20" r="1.5" />
        <circle cx="260" cy="20" r="1.5" />
        <circle cx="300" cy="20" r="1.5" />
        <circle cx="340" cy="20" r="1.5" />
        <circle cx="380" cy="20" r="1.5" />

        {/* Row 2 */}
        <circle cx="40" cy="40" r="1.5" />
        <circle cx="80" cy="40" r="1.5" />
        <circle cx="120" cy="40" r="1.5" />
        <circle cx="160" cy="40" r="1.5" />
        <circle cx="200" cy="40" r="1.5" />
        <circle cx="240" cy="40" r="1.5" />
        <circle cx="280" cy="40" r="1.5" />
        <circle cx="320" cy="40" r="1.5" />
        <circle cx="360" cy="40" r="1.5" />

        {/* Row 3 */}
        <circle cx="20" cy="60" r="1.5" />
        <circle cx="60" cy="60" r="1.5" />
        <circle cx="100" cy="60" r="1.5" />
        <circle cx="140" cy="60" r="1.5" />
        <circle cx="180" cy="60" r="1.5" />
        <circle cx="220" cy="60" r="1.5" />
        <circle cx="260" cy="60" r="1.5" />
        <circle cx="300" cy="60" r="1.5" />
        <circle cx="340" cy="60" r="1.5" />
        <circle cx="380" cy="60" r="1.5" />

        {/* Row 4 */}
        <circle cx="40" cy="80" r="1.5" />
        <circle cx="80" cy="80" r="1.5" />
        <circle cx="120" cy="80" r="1.5" />
        <circle cx="160" cy="80" r="1.5" />
        <circle cx="200" cy="80" r="1.5" />
        <circle cx="240" cy="80" r="1.5" />
        <circle cx="280" cy="80" r="1.5" />
        <circle cx="320" cy="80" r="1.5" />
        <circle cx="360" cy="80" r="1.5" />
      </g>
      
      {/* Decorative pulse crosshairs */}
      <path d="M195 40 H205 M200 35 V45" stroke="#BF9B30" strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="200" cy="40" r="15" fill="url(#dotGlow)" />
    </svg>
  );
};
