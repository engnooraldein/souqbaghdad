// ===========================================
// مسؤولية هذا الملف:
// مكوّن SVG رسومي مخصص (city-outline).
//
// لا يتصل بـ Supabase. أصل رسومي بحت.
//
// آمن للتعديل:
// نعم.
// ===========================================
import React from 'react';

export const CityOutline = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      {...props}
    >
      <defs>
        <linearGradient id="goldCityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BF9B30" stopOpacity="0.1" />
          <stop offset="30%" stopColor="#BF9B30" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFF2CC" stopOpacity="1" />
          <stop offset="70%" stopColor="#BF9B30" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#BF9B30" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Baghdad skyline vector outline */}
      <g stroke="url(#goldCityGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Ground/river baseline */}
        <line x1="10" y1="180" x2="790" y2="180" strokeWidth="3" />
        <line x1="20" y1="186" x2="780" y2="186" strokeWidth="1" strokeOpacity="0.4" />
        
        {/* Leftmost minaret/dome structure */}
        <path d="M50 180 L50 130 L65 130 L65 180 M57.5 130 L57.5 90 C57.5 85, 50 80, 57.5 70 C65 80, 57.5 85, 57.5 90" />
        <circle cx="57.5" cy="110" r="12" fill="#031131" />
        
        {/* Baghdad Liberation Monument stylization (Nasb al-Hurriyah) */}
        <path d="M110 180 L110 80 L180 80 L180 180" strokeWidth="2.5" />
        <rect x="118" y="88" width="54" height="20" rx="2" fill="url(#goldCityGrad)" fillOpacity="0.15" />
        {/* Abstract sculptural shapes */}
        <path d="M125 140 Q135 110, 145 140 Q155 170, 165 140" strokeWidth="1.5" />
        <circle cx="145" cy="100" r="3" fill="url(#goldCityGrad)" />

        {/* Abbasid Palace styled grand arch */}
        <path d="M220 180 L220 100 Q250 50, 280 100 L280 180" strokeWidth="2.5" />
        <path d="M230 180 L230 115 Q250 80, 270 115 L270 180" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M240 180 L240 130 Q250 105, 260 130 L260 180" strokeWidth="1" strokeOpacity="0.5" />

        {/* Al-Shaheed Monument (Martyr's Monument split dome) */}
        {/* Left half dome */}
        <path d="M350 180 C350 130, 370 90, 395 90 L395 180 Z" fill="url(#goldCityGrad)" fillOpacity="0.15" strokeWidth="2.5" />
        {/* Right half dome */}
        <path d="M415 180 L415 90 C440 90, 460 130, 460 180 Z" fill="url(#goldCityGrad)" fillOpacity="0.15" strokeWidth="2.5" />
        {/* Central flame/flagpole */}
        <line x1="405" y1="180" x2="405" y2="70" strokeWidth="2" />
        <circle cx="405" cy="65" r="4" fill="url(#goldCityGrad)" />

        {/* Ancient Baghdad gate fortress wall */}
        <path d="M500 180 L500 120 L520 120 L520 105 L530 105 L530 120 L550 120 L550 180" />
        <path d="M510 180 L510 140 L540 140 L540 180" strokeOpacity="0.6" />
        
        {/* Modern Baghdad Tower (Ma’moon Telecommunications Tower) */}
        <path d="M600 180 L610 110 L605 110 L605 90 L612 85 L612 40 L618 40 L618 85 L625 90 L625 110 L620 110 L630 180" strokeWidth="2.5" />
        <circle cx="615" cy="70" r="10" fill="#031131" />
        <line x1="615" y1="40" x2="615" y2="15" strokeWidth="1.5" />

        {/* Suspension Bridge of Baghdad (Jadriyah Bridge arches) */}
        <path d="M670 180 C685 140, 715 140, 730 180" strokeWidth="2" />
        <path d="M710 180 C725 150, 755 150, 770 180" strokeWidth="2" />
        <line x1="700" y1="180" x2="700" y2="152" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="740" y1="180" x2="740" y2="156" strokeWidth="1" strokeOpacity="0.5" />
      </g>
    </svg>
  );
};
