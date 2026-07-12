// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (transport-city).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const TransportCity = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="transitCityFade" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Transit landmark/station structures outline */}
      <g stroke="url(#transitCityFade)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Base line */}
        <line x1="5" y1="90" x2="195" y2="90" strokeWidth="2" />

        {/* Station arch structure */}
        <path d="M40 90 L40 50 Q60 30, 80 50 L80 90" />
        <circle cx="60" cy="55" r="4" fill="url(#transitCityFade)" />

        {/* Tower platform */}
        <path d="M120 90 L125 40 L135 40 L140 90" />
        <rect x="122" y="30" width="16" height="10" rx="1" fill="#031131" stroke="url(#transitCityFade)" strokeWidth="1" />
        <line x1="130" y1="30" x2="130" y2="15" strokeWidth="1" />

        {/* Dynamic perspective lines */}
        <path d="M5 90 C30 80, 160 80, 195 90" strokeOpacity="0.4" />
      </g>
    </svg>
  );
};
