import React from 'react';

export const TransportCard = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="transitCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#051436" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#09235e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#051436" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="goldBorderTransit" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.3" />
          <stop offset="30%" stopColor="#BF9B30" stopOpacity="0.7" />
          <stop offset="70%" stopColor="#BF9B30" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      
      {/* Structural Card Surface */}
      <rect
        x="2"
        y="2"
        width="796"
        height="196"
        rx="24"
        fill="url(#transitCardGrad)"
        stroke="url(#goldBorderTransit)"
        strokeWidth="1.5"
      />
      
      {/* Decorative circuitry and line textures representing routes */}
      <path
        d="M20 50 L100 50 L120 70 L250 70 L270 50 L400 50 L420 70"
        stroke="#BF9B30"
        strokeWidth="1"
        strokeOpacity="0.15"
        strokeDasharray="4 4"
      />
      <path
        d="M20 150 L180 150 L200 130 L350 130 L370 150 L780 150"
        stroke="#BF9B30"
        strokeWidth="1"
        strokeOpacity="0.15"
        strokeDasharray="4 4"
      />
      
      {/* Decorative small gold navigation star markers */}
      <circle cx="120" cy="70" r="3" fill="#BF9B30" fillOpacity="0.4" />
      <circle cx="200" cy="130" r="3" fill="#BF9B30" fillOpacity="0.4" />
      <circle cx="270" cy="50" r="3" fill="#BF9B30" fillOpacity="0.4" />
      <circle cx="370" cy="150" r="3" fill="#BF9B30" fillOpacity="0.4" />
    </svg>
  );
};
