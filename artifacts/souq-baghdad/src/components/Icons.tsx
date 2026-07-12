import { SVGProps } from 'react';

export function IraqiEagle({ className = '', ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Iraqi Eagle - Simplified elegant design */}
      <defs>
        <linearGradient id="eagleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#f4d03f" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f1729" />
        </linearGradient>
      </defs>

      {/* Shield background */}
      <path
        d="M60 10 L95 25 L95 60 C95 85 75 105 60 115 C45 105 25 85 25 60 L25 25 Z"
        fill="url(#shieldGradient)"
        stroke="url(#eagleGradient)"
        strokeWidth="3"
      />

      {/* Eagle wings - Left */}
      <path
        d="M25 45 Q15 35 10 50 Q5 65 15 75 Q20 70 25 60"
        fill="url(#eagleGradient)"
        opacity="0.9"
      />
      <path
        d="M25 50 Q18 42 12 55 Q8 68 18 78 Q22 72 25 62"
        fill="url(#eagleGradient)"
        opacity="0.7"
      />

      {/* Eagle wings - Right */}
      <path
        d="M95 45 Q105 35 110 50 Q115 65 105 75 Q100 70 95 60"
        fill="url(#eagleGradient)"
        opacity="0.9"
      />
      <path
        d="M95 50 Q102 42 108 55 Q112 68 102 78 Q98 72 95 62"
        fill="url(#eagleGradient)"
        opacity="0.7"
      />

      {/* Eagle head */}
      <ellipse cx="60" cy="40" rx="12" ry="15" fill="url(#eagleGradient)" />

      {/* Beak */}
      <path d="M72 38 L85 42 L72 46 Z" fill="#d4af37" />

      {/* Eyes */}
      <circle cx="65" cy="36" r="3" fill="#0f1729" />
      <circle cx="55" cy="36" r="3" fill="#0f1729" />
      <circle cx="66" cy="35" r="1" fill="#fff" />
      <circle cx="56" cy="35" r="1" fill="#fff" />

      {/* Crown/Tuft */}
      <path
        d="M52 28 Q60 20 68 28 Q60 24 52 28"
        fill="url(#eagleGradient)"
      />

      {/* Talons */}
      <path
        d="M45 85 Q40 95 35 100 M48 87 Q45 97 42 102 M50 88 Q50 98 48 103"
        stroke="url(#eagleGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M75 85 Q80 95 85 100 M72 87 Q75 97 78 102 M70 88 Q70 98 72 103"
        stroke="url(#eagleGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Iraqi Flag colors on shield */}
      <rect x="45" y="55" width="30" height="8" fill="#ffffff" />
      <rect x="45" y="63" width="30" height="8" fill="#000000" />
      <rect x="45" y="71" width="30" height="8" fill="#ce1126" />
    </svg>
  );
}

export function IraqiFlag({ className = '', width = 60, height = 40, ...props }: SVGProps<SVGSVGElement> & { className?: string; width?: number; height?: number }) {
  return (
    <svg
      viewBox="0 0 60 40"
      width={width}
      height={height}
      className={className}
      {...props}
    >
      {/* Top white band */}
      <rect width="60" height="13.33" fill="#ffffff" />
      {/* Middle black band */}
      <rect y="13.33" width="60" height="13.33" fill="#000000" />
      {/* Bottom red band */}
      <rect y="26.66" width="60" height="13.33" fill="#ce1126" />
      {/* Green crescent and star */}
      <g transform="translate(30, 6.66)">
        <circle cx="0" cy="0" r="5" fill="#ffffff" />
        <circle cx="2" cy="0" r="4" fill="#000000" />
        {/* Star simplified */}
        <polygon
          points="-2,-5 0,-2 2,-5 0,-1"
          fill="#ffffff"
          transform="translate(2, -2)"
        />
      </g>
    </svg>
  );
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      width="60"
      height="60"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f1729" />
        </linearGradient>
      </defs>

      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill="url(#logoGrad)" />
      <circle cx="30" cy="30" r="26" fill="none" stroke="#d4af37" strokeWidth="2" />

      {/* S letter stylized */}
      <path
        d="M40 20 C35 15 25 15 20 20 C15 25 15 30 20 35 C25 40 35 40 40 35"
        fill="none"
        stroke="#d4af37"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* B letter stylized */}
      <path
        d="M30 22 L30 42 M30 22 C35 22 40 24 40 28 M30 32 C35 32 40 34 40 38"
        fill="none"
        stroke="#d4af37"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
