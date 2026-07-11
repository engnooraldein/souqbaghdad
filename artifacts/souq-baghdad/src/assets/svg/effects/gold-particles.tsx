import React from 'react';

export const GoldParticles = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <radialGradient id="particleGlowCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Floating vector golden dust specs */}
      <g>
        {/* Particle 1 */}
        <circle cx="45" cy="120" r="4" fill="url(#particleGlowCore)">
          <animate attributeName="cy" values="120;90;120" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Particle 2 */}
        <circle cx="120" cy="220" r="3" fill="url(#particleGlowCore)">
          <animate attributeName="cy" values="220;190;220" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Particle 3 */}
        <circle cx="230" cy="80" r="5" fill="url(#particleGlowCore)">
          <animate attributeName="cy" values="80;110;80" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="5s" repeatCount="indefinite" />
        </circle>

        {/* Particle 4 */}
        <circle cx="180" cy="150" r="2.5" fill="url(#particleGlowCore)">
          <animate attributeName="cy" values="150;130;150" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.1;0.9" dur="3.5s" repeatCount="indefinite" />
        </circle>

        {/* Particle 5 */}
        <circle cx="270" cy="250" r="3.5" fill="url(#particleGlowCore)">
          <animate attributeName="cy" values="250;210;250" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.1;1;0.1" dur="6s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};
