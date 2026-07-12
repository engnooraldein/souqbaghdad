// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (logo-box).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const LogoBox = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="goldBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3D1" />
          <stop offset="40%" stopColor="#BF9B30" />
          <stop offset="70%" stopColor="#8C6D1F" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      {/* Outer frame */}
      <rect
        x="10"
        y="10"
        width="180"
        height="180"
        rx="24"
        stroke="url(#goldBoxGrad)"
        strokeWidth="2.5"
      />
      {/* Inner offset border */}
      <rect
        x="18"
        y="18"
        width="164"
        height="164"
        rx="18"
        stroke="url(#goldBoxGrad)"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeDasharray="4 4"
      />
      {/* Premium corner ornaments */}
      {/* Top Left */}
      <path d="M10 35 L35 10 M10 45 L45 10" stroke="url(#goldBoxGrad)" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="3" fill="url(#goldBoxGrad)" />
      
      {/* Top Right */}
      <path d="M190 35 L165 10 M190 45 L155 10" stroke="url(#goldBoxGrad)" strokeWidth="1.5" />
      <circle cx="172" cy="28" r="3" fill="url(#goldBoxGrad)" />
      
      {/* Bottom Left */}
      <path d="M10 165 L35 190 M10 155 L45 190" stroke="url(#goldBoxGrad)" strokeWidth="1.5" />
      <circle cx="28" cy="172" r="3" fill="url(#goldBoxGrad)" />
      
      {/* Bottom Right */}
      <path d="M190 165 L165 190 M190 155 L155 190" stroke="url(#goldBoxGrad)" strokeWidth="1.5" />
      <circle cx="172" cy="172" r="3" fill="url(#goldBoxGrad)" />
      
      {/* Centered Golden Octagram Star (Rub el Hizb) */}
      <path
        d="M100 60 L112 88 L140 100 L112 112 L100 140 L88 112 L60 100 L88 88 Z"
        fill="url(#goldBoxGrad)"
        fillOpacity="0.1"
        stroke="url(#goldBoxGrad)"
        strokeWidth="2"
      />
      <circle cx="100" cy="100" r="12" stroke="url(#goldBoxGrad)" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="5" fill="url(#goldBoxGrad)" />
    </svg>
  );
};
