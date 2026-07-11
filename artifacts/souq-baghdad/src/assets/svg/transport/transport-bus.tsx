import React from 'react';

export const TransportBus = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="busBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B1E43" />
          <stop offset="100%" stopColor="#031131" />
        </linearGradient>
        <linearGradient id="busGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2CC" />
          <stop offset="50%" stopColor="#BF9B30" />
          <stop offset="100%" stopColor="#8C6D1F" />
        </linearGradient>
        <filter id="headlightGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Shadow */}
      <ellipse cx="80" cy="85" rx="65" ry="8" fill="#000" fillOpacity="0.4" />

      {/* Main Bus body block */}
      <rect
        x="15"
        y="25"
        width="130"
        height="50"
        rx="8"
        fill="url(#busBodyGrad)"
        stroke="url(#busGoldGrad)"
        strokeWidth="2"
      />

      {/* Upper wind shield and windows */}
      <rect x="22" y="30" width="30" height="18" rx="2" fill="#031131" stroke="url(#busGoldGrad)" strokeWidth="1" />
      <rect x="58" y="30" width="24" height="18" rx="2" fill="#031131" stroke="url(#busGoldGrad)" strokeWidth="1" />
      <rect x="88" y="30" width="24" height="18" rx="2" fill="#031131" stroke="url(#busGoldGrad)" strokeWidth="1" />
      <rect x="118" y="30" width="20" height="18" rx="2" fill="#031131" stroke="url(#busGoldGrad)" strokeWidth="1" />

      {/* Passenger silhouettes inside windows */}
      <circle cx="30" cy="38" r="3" fill="#BF9B30" fillOpacity="0.3" />
      <circle cx="44" cy="38" r="3" fill="#BF9B30" fillOpacity="0.3" />
      <circle cx="70" cy="38" r="3" fill="#BF9B30" fillOpacity="0.3" />
      <circle cx="100" cy="38" r="3" fill="#BF9B30" fillOpacity="0.3" />

      {/* Front / Rear Wheels */}
      <circle cx="42" cy="75" r="12" fill="#000" stroke="url(#busGoldGrad)" strokeWidth="2.5" />
      <circle cx="42" cy="75" r="5" fill="url(#busGoldGrad)" />
      
      <circle cx="118" cy="75" r="12" fill="#000" stroke="url(#busGoldGrad)" strokeWidth="2.5" />
      <circle cx="118" cy="75" r="5" fill="url(#busGoldGrad)" />

      {/* Golden Headlights (glowing) */}
      <path d="M15 62 L11 62" stroke="url(#busGoldGrad)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="15" cy="62" r="3" fill="#FFF" filter="url(#headlightGlow)" />
      
      <path d="M145 62 L149 62" stroke="url(#busGoldGrad)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="145" cy="62" r="3" fill="#FFF" filter="url(#headlightGlow)" />

      {/* Modern aerodynamic gold speed-lines along body */}
      <path d="M52 56 L128 56" stroke="url(#busGoldGrad)" strokeWidth="2" strokeLinecap="round" />
      <path d="M58 62 L118 62" stroke="url(#busGoldGrad)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};
