import React from 'react';

export const SearchContainer = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 600 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="searchBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.1" />
          <stop offset="20%" stopColor="#BF9B30" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFF" stopOpacity="1" />
          <stop offset="80%" stopColor="#BF9B30" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {/* Container background backing */}
      <rect
        x="2"
        y="2"
        width="596"
        height="66"
        rx="20"
        fill="#031131"
        fillOpacity="0.8"
        stroke="url(#searchBorderGrad)"
        strokeWidth="1.5"
      />
      
      {/* Inner fine gold accents */}
      <rect
        x="6"
        y="6"
        width="588"
        height="58"
        rx="16"
        stroke="#BF9B30"
        strokeOpacity="0.15"
        strokeWidth="1"
      />
      
      {/* Corner design brackets */}
      <path d="M15 15 L30 15 M15 15 L15 30" stroke="#BF9B30" strokeWidth="2" strokeLinecap="round" />
      <path d="M585 15 L570 15 M585 15 L585 30" stroke="#BF9B30" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 55 L30 55 M15 55 L15 40" stroke="#BF9B30" strokeWidth="2" strokeLinecap="round" />
      <path d="M585 55 L570 55 M585 55 L585 40" stroke="#BF9B30" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
