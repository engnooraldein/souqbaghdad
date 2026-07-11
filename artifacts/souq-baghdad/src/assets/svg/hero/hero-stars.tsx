import React from 'react';

export const HeroStars = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 500 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF" />
          <stop offset="100%" stopColor="#BF9B30" />
        </linearGradient>
      </defs>
      
      {/* Dynamic/pulsating celestial stars and spark vectors */}
      <g fill="url(#starGrad)">
        {/* Large Star 1 */}
        <path d="M50 40 L53 48 L61 50 L53 52 L50 60 L47 52 L39 50 L47 48 Z">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
        </path>
        
        {/* Medium Star 2 */}
        <path d="M180 70 L182 75 L187 76 L182 77 L180 82 L178 77 L173 76 L178 75 Z">
          <animate attributeName="opacity" values="1;0.2;1" dur="4s" repeatCount="indefinite" />
        </path>
        
        {/* Large Star 3 */}
        <path d="M350 30 L353 38 L361 40 L353 42 L350 50 L347 42 L339 40 L347 38 Z">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" />
        </path>

        {/* Small Star 4 */}
        <path d="M450 90 L451.5 93 L455 94 L451.5 95 L450 98 L448.5 95 L445 94 L448.5 93 Z">
          <animate attributeName="opacity" values="0.8;0.1;0.8" dur="3.5s" repeatCount="indefinite" />
        </path>
        
        {/* Spark 5 */}
        <path d="M110 100 L111 103 L114 104 L111 105 L110 108 L109 105 L106 104 L109 103 Z">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
        </path>

        {/* Spark 6 */}
        <path d="M280 110 L281 113 L284 114 L281 115 L280 118 L279 115 L276 114 L279 113 Z">
          <animate attributeName="opacity" values="1;0.3;1" dur="5s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
};
