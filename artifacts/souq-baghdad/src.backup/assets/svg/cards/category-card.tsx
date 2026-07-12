// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (category-card).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const CategoryCard = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="catBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Decorative fine-line border matching Arabesque/Bento styles */}
      <rect
        x="3"
        y="3"
        width="114"
        height="114"
        rx="16"
        stroke="url(#catBorderGrad)"
        strokeWidth="1.2"
      />

      {/* Subtle corner ticks */}
      <path d="M12 3 L3 12" stroke="#BF9B30" strokeWidth="1" strokeOpacity="0.5" />
      <path d="M108 3 L117 12" stroke="#BF9B30" strokeWidth="1" strokeOpacity="0.5" />
      <path d="M12 117 L3 108" stroke="#BF9B30" strokeWidth="1" strokeOpacity="0.5" />
      <path d="M108 117 L117 108" stroke="#BF9B30" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
};
