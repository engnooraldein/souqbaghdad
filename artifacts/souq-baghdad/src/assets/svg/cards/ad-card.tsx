// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (ad-card).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const AdCard = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 250 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="adCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2CC" />
          <stop offset="35%" stopColor="#BF9B30" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Outer borders */}
      <rect
        x="2"
        y="2"
        width="246"
        height="316"
        rx="24"
        stroke="url(#adCardGrad)"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />

      {/* Decorative inner guidelines */}
      <rect
        x="6"
        y="6"
        width="238"
        height="308"
        rx="20"
        stroke="#BF9B30"
        strokeOpacity="0.1"
        strokeWidth="0.8"
      />

      {/* Luxury corners */}
      <path d="M12 2 L2 12 M22 2 L2 22" stroke="#BF9B30" strokeWidth="1" strokeOpacity="0.7" />
      <path d="M238 2 L248 12 M228 2 L248 22" stroke="#BF9B30" strokeWidth="1" strokeOpacity="0.7" />
    </svg>
  );
};
