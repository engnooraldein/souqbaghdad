// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (stats-graph).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const StatsGraph = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="chartLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BF9B30" />
          <stop offset="50%" stopColor="#FFF2CC" />
          <stop offset="100%" stopColor="#BF9B30" />
        </linearGradient>
        <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line x1="10" y1="20" x2="190" y2="20" stroke="#BF9B30" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="10" y1="50" x2="190" y2="50" stroke="#BF9B30" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="10" y1="80" x2="190" y2="80" stroke="#BF9B30" strokeOpacity="0.08" strokeWidth="1" />

      {/* Gradient Area under graph */}
      <path
        d="M 10 90 Q 40 50 70 65 T 130 35 Q 160 10 190 15 L 190 90 Z"
        fill="url(#chartAreaGrad)"
      />

      {/* Flowing Chart Line */}
      <path
        d="M 10 90 Q 40 50 70 65 T 130 35 Q 160 10 190 15"
        stroke="url(#chartLineGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pulse indicators at peak points */}
      <circle cx="190" cy="15" r="5" fill="#FFF" />
      <circle cx="190" cy="15" r="9" stroke="#BF9B30" strokeWidth="1.5" strokeOpacity="0.8" />
    </svg>
  );
};
