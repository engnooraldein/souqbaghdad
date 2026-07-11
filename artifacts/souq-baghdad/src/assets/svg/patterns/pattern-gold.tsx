import React from 'react';

export const PatternGold = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <pattern id="islamicGoldPattern" width="50" height="50" patternUnits="userSpaceOnUse">
          {/* Rub el Hizb 8-pointed star geometric pattern */}
          <path
            d="M25 0 L32.3 17.7 L50 25 L32.3 32.3 L25 50 L17.7 32.3 L0 25 L17.7 17.7 Z"
            stroke="#BF9B30"
            strokeWidth="0.5"
            strokeOpacity="0.25"
            fill="none"
          />
          {/* Inner details */}
          <circle cx="25" cy="25" r="5" stroke="#BF9B30" strokeWidth="0.5" strokeOpacity="0.15" />
          {/* Diagonals */}
          <line x1="0" y1="0" x2="50" y2="50" stroke="#BF9B30" strokeWidth="0.25" strokeOpacity="0.1" />
          <line x1="50" y1="0" x2="0" y2="50" stroke="#BF9B30" strokeWidth="0.25" strokeOpacity="0.1" />
        </pattern>
      </defs>
      
      {/* Rect filled with our beautiful pattern */}
      <rect width="100%" height="100%" fill="url(#islamicGoldPattern)" />
    </svg>
  );
};
