import React from 'react';

export const LionOutline = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="goldLionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2CC" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA7C11" />
        </linearGradient>
        <filter id="premiumGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComponentTransfer in="blur" result="glow1">
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Majestic Babylonian Lion silhouette path group */}
      <g filter="url(#premiumGlow)" stroke="url(#goldLionGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Head and Mane */}
        <path d="M120 200 C100 160, 110 110, 150 90 C180 75, 220 90, 230 120 C245 100, 280 80, 310 100 C340 120, 345 155, 330 180 C360 170, 400 180, 410 210 C420 240, 390 280, 360 290 L340 295" />
        {/* Lion Face profile (Babylonian style) */}
        <path d="M120 200 C110 205, 100 195, 95 210 C90 225, 100 235, 105 240 L125 242 M100 220 L115 222 M105 240 C115 255, 125 260, 140 260 M140 260 C155 260, 165 245, 170 230" />
        {/* Mane Details */}
        <path d="M160 100 C145 130, 150 170, 180 190 M195 95 C185 135, 200 165, 220 180 M240 125 C240 155, 255 185, 270 195" />
        <path d="M225 180 C210 220, 215 260, 240 290 M270 195 C260 240, 270 280, 290 300" />
        {/* Body and Back line */}
        <path d="M330 180 C360 180, 420 200, 440 250 C460 300, 430 360, 410 390" />
        {/* Front paws */}
        <path d="M170 230 C160 270, 175 320, 180 370 C182 390, 160 410, 140 410 C120 410, 115 390, 118 370 L122 300" />
        <path d="M240 290 C235 320, 240 360, 245 395 C247 410, 230 420, 215 420 C200 420, 195 410, 196 395" />
        {/* Back legs */}
        <path d="M360 295 C365 320, 375 365, 385 410 C388 425, 370 430, 355 430 C340 430, 335 420, 336 405" />
        <path d="M410 390 L400 435 C398 445, 385 450, 375 450 C365 450, 360 440, 362 430" />
        {/* Majestic Tail curves */}
        <path d="M440 250 C480 230, 500 170, 480 120 C470 95, 440 90, 435 110 C430 130, 450 160, 452 180 M480 120 L485 110 L475 105 Z" fill="url(#goldLionGrad)" />
      </g>
      {/* Decorative Star/Dots under the lion */}
      <circle cx="256" cy="470" r="4" fill="url(#goldLionGrad)" />
      <circle cx="226" cy="466" r="2" fill="url(#goldLionGrad)" fillOpacity="0.6" />
      <circle cx="286" cy="466" r="2" fill="url(#goldLionGrad)" fillOpacity="0.6" />
    </svg>
  );
};
