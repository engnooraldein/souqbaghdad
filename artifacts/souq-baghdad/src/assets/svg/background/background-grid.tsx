import React from 'react';

export const BackgroundGrid = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="gridVerticalFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#09235e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid horizontal lines */}
      <g stroke="url(#gridVerticalFade)" strokeWidth="0.75">
        <line x1="0" y1="40" x2="400" y2="40" />
        <line x1="0" y1="80" x2="400" y2="80" />
        <line x1="0" y1="120" x2="400" y2="120" />
        <line x1="0" y1="160" x2="400" y2="160" />
        <line x1="0" y1="200" x2="400" y2="200" />
        <line x1="0" y1="240" x2="400" y2="240" />
        <line x1="0" y1="280" x2="400" y2="280" />
        <line x1="0" y1="320" x2="400" y2="320" />
        <line x1="0" y1="360" x2="400" y2="360" />

        {/* Grid vertical lines */}
        <line x1="40" y1="0" x2="40" y2="400" />
        <line x1="80" y1="0" x2="80" y2="400" />
        <line x1="120" y1="0" x2="120" y2="400" />
        <line x1="160" y1="0" x2="160" y2="400" />
        <line x1="200" y1="0" x2="200" y2="400" />
        <line x1="240" y1="0" x2="240" y2="400" />
        <line x1="280" y1="0" x2="280" y2="400" />
        <line x1="320" y1="0" x2="320" y2="400" />
        <line x1="360" y1="0" x2="360" y2="400" />
      </g>
    </svg>
  );
};
