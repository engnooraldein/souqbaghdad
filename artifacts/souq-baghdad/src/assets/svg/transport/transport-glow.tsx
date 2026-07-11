import React from 'react';

export const TransportGlow = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <radialGradient id="transitBacklight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#09235e" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#BF9B30" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#051436" stopOpacity="0" />
        </radialGradient>
        <filter id="softTransitBlur">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>

      <ellipse
        cx="200"
        cy="100"
        rx="180"
        ry="85"
        fill="url(#transitBacklight)"
        filter="url(#softTransitBlur)"
      />
    </svg>
  );
};
