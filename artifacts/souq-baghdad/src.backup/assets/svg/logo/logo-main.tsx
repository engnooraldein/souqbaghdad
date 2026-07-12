// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (logo-main).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const LogoMain = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="goldGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E7C4" />
          <stop offset="30%" stopColor="#BF9B30" />
          <stop offset="70%" stopColor="#8C6D1F" />
          <stop offset="100%" stopColor="#BF9B30" />
        </linearGradient>
        <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Icon portion: Stylized Baghdad Arch & Crescent Moon symbol */}
      <g filter="url(#goldGlow)">
        {/* Arch Dome */}
        <path
          d="M60 25 C75 25, 85 38, 85 55 L85 85 L35 85 L35 55 C35 38, 45 25, 60 25 Z"
          stroke="url(#goldGradMain)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inside gate details */}
        <path
          d="M60 40 C68 40, 72 48, 72 58 L72 85 L48 85 L48 58 C48 48, 52 40, 60 40 Z"
          fill="url(#goldGradMain)"
          fillOpacity="0.15"
          stroke="url(#goldGradMain)"
          strokeWidth="2"
        />
        {/* Outer crescent decorative circle */}
        <circle
          cx="60"
          cy="55"
          r="32"
          stroke="url(#goldGradMain)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        {/* Core Star symbol */}
        <path
          d="M60 12 L62 18 L68 18 L63 22 L65 28 L60 24 L55 28 L57 22 L52 18 L58 18 Z"
          fill="url(#goldGradMain)"
        />
      </g>

      {/* Typography: "سوق بغداد" in custom golden vector typography */}
      {/* "سوق" */}
      <path
        d="M260 50 C265 50, 272 45, 278 45 C284 45, 290 52, 288 60 C285 70, 275 80, 260 82 M268 58 L262 65 M280 40 C282 38, 285 38, 287 40"
        stroke="url(#goldGradMain)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* "بغداد" */}
      <path
        d="M140 68 C145 68, 155 60, 162 55 L162 80 C162 82, 175 80, 182 72 M182 45 L182 80 M195 50 C202 50, 210 58, 212 65 L212 80 M228 45 L228 80 C228 82, 235 80, 242 75"
        stroke="url(#goldGradMain)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Decorative horizontal golden lines */}
      <line
        x1="110"
        y1="90"
        x2="350"
        y2="90"
        stroke="url(#goldGradMain)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <circle cx="230" cy="90" r="4" fill="url(#goldGradMain)" />
      
      {/* Subtext: "SOUQ BAGHDAD" */}
      <text
        x="230"
        y="108"
        fill="url(#goldGradMain)"
        fontSize="12"
        fontWeight="bold"
        letterSpacing="6"
        textAnchor="middle"
        style={{ fontFamily: 'sans-serif' }}
      >
        SOUQ BAGHDAD
      </text>
    </svg>
  );
};
