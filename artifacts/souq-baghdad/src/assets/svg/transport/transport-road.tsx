// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (transport-road).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const TransportRoad = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="roadFade" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Vanishing point perspective road borders */}
      <path d="M100 20 L20 100 M100 20 L180 100" stroke="url(#roadFade)" strokeWidth="2.5" />

      {/* Perspective center line (dashed/faded) */}
      <path d="M100 20 L100 32 M100 40 L100 58 M100 68 L100 98" stroke="url(#roadFade)" strokeWidth="2" strokeDasharray="6 4" />

      {/* Outer landscape speed-lines */}
      <path d="M110 25 L145 100 M90 25 L55 100" stroke="url(#roadFade)" strokeWidth="1" strokeOpacity="0.3" />
    </svg>
  );
};
