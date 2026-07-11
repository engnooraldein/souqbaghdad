import React from 'react';

export const StatsUsers = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="userGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2CC" />
          <stop offset="100%" stopColor="#BF9B30" />
        </linearGradient>
      </defs>

      {/* Styled vector human avatars grouped */}
      {/* Left User */}
      <g stroke="url(#userGoldGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <circle cx="50" cy="40" r="12" fill="#031131" />
        <path d="M28 75 C28 62, 38 58, 50 58 C62 58, 72 62, 72 75" fill="#031131" />
      </g>

      {/* Right User */}
      <g stroke="url(#userGoldGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <circle cx="110" cy="40" r="12" fill="#031131" />
        <path d="M88 75 C88 62, 98 58, 110 58 C122 58, 132 62, 132 75" fill="#031131" />
      </g>

      {/* Center User (Prominent/Foreground) */}
      <g stroke="url(#userGoldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="80" cy="35" r="14" fill="#031131" />
        <path d="M54 75 C54 60, 65 55, 80 55 C95 55, 106 60, 106 75" fill="#031131" />
        
        {/* Verification checkmark above center user */}
        <path d="M96 20 L98 22 L103 17" stroke="#BF9B30" strokeWidth="2" />
        <circle cx="98" cy="19" r="6" stroke="#BF9B30" strokeWidth="1" />
      </g>
    </svg>
  );
};
