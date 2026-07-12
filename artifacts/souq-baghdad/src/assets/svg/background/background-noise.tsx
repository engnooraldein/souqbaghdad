// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (background-noise).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const BackgroundNoise = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        {/* SVG procedural noise shader filter */}
        <filter id="noiseShader">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.74   0 0 0 0 0.60   0 0 0 0 0.18   0 0 0 0.04 0"
            in="noise"
          />
        </filter>
      </defs>

      {/* Noise layer container */}
      <rect width="100%" height="100%" filter="url(#noiseShader)" />
    </svg>
  );
};
