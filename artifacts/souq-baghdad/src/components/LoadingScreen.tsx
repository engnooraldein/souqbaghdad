import React, { useEffect, useState } from 'react';
import { LionPath } from './LionPaths';

interface LoadingScreenProps {
  isLoading: boolean;
  minDuration?: number; // Minimum time to show the loader
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  minDuration = 3500 
}) => {
  const [show, setShow] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const startTimeRef = React.useRef(Date.now());
  const hasTriggeredRef = React.useRef(false);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    let maxTimer: NodeJS.Timeout;

    const triggerHide = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      setIsFadingOut(true); 
      setTimeout(() => setShow(false), 800); // Wait 800ms for cinematic transition
    };

    // 1. If data finishes loading, we wait the remaining time to reach minDuration
    if (!isLoading) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDuration - elapsed);
      hideTimer = setTimeout(triggerHide, remainingTime);
    }

    // 2. Regardless of data loading, force hide after 8000ms (Adaptive Maximum)
    const elapsedSinceStart = Date.now() - startTimeRef.current;
    const timeUntilMax = Math.max(0, 8000 - elapsedSinceStart);
    maxTimer = setTimeout(triggerHide, timeUntilMax);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(maxTimer);
    };
  }, [isLoading, minDuration]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-110 bg-transparent blur-sm' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #1b498f 0%, #0c2b5e 100%)',
      }}
    >
      {/* 3D Cinematic Zoom Wrapper */}
      <div className={`relative w-80 h-80 md:w-[600px] md:h-[600px] transition-all duration-[800ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${
        isFadingOut ? 'scale-125 opacity-0 translate-y-[-20px]' : 'scale-100 opacity-100'
      }`}>
        <svg viewBox="0 0 1024 1024" width="100%" height="100%">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#f4d03f" />
            </linearGradient>
            <clipPath id="circle-clip">
              <circle cx="500" cy="500" r="180" />
            </clipPath>
          </defs>

          {/* Background Blob Wave */}
          <g className="blob-wave">
            <path fill="#BF9B30" opacity="0.08" d="M45.7,-76.3C58.9,-69.3,68.9,-54.8,75.4,-39.6C81.9,-24.4,84.9,-8.5,82.4,6.3C79.9,21.1,72,34.8,61.9,46.1C51.8,57.4,39.6,66.2,25.7,72.4C11.8,78.6,-3.6,82.2,-19.1,79.9C-34.6,77.6,-50.2,69.4,-61.7,57.1C-73.2,44.8,-80.6,28.4,-83.4,11.3C-86.2,-5.8,-84.4,-23.6,-76.3,-38.8C-68.2,-54,-53.8,-66.6,-38.7,-72.8C-23.6,-79,-7.8,-78.8,7.9,-80.1C23.6,-81.4,32.5,-83.3,45.7,-76.3Z" />
          </g>
          <g className="blob-wave-2">
            <path fill="#d4af37" opacity="0.05" d="M42.4,-72.2C54.8,-64.1,64.7,-51.7,72.2,-37.6C79.7,-23.5,84.8,-7.7,82.7,7.2C80.6,22.1,71.2,36,60.1,47.8C49,59.6,36.2,69.3,21.6,74.5C7,79.7,-9.4,80.4,-24.1,75.7C-38.8,71,-51.8,60.9,-61.8,48.8C-71.8,36.7,-78.8,22.6,-81.5,7.7C-84.2,-7.2,-82.6,-22.9,-75.2,-35.8C-67.8,-48.7,-54.6,-58.8,-40.9,-66.3C-27.2,-73.8,-13.6,-78.7,1.1,-80.2C15.8,-81.7,30,-79.8,42.4,-72.2Z" />
          </g>

          {/* 3. Floating Icons (Coin, Bag, Map Pin, Cart, Wing, Pattern) */}
          {/* 3. Floating Icons (Coin, Bag, Map Pin, Cart, Wing, Pattern) */}
          {/* Coin (Top Left) */}
          <g className="floating-element" style={{ animationDelay: '0s' }}>
            <circle cx="150" cy="250" r="25" fill="url(#goldGradient)" opacity="0.8" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" />
            <circle cx="150" cy="250" r="18" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4" />
          </g>
          
          {/* Shopping Bag (Top Right) */}
          <g className="floating-element" style={{ animationDelay: '1.2s' }}>
            <path d="M 800 250 L 800 310 L 860 310 L 860 250 Z" fill="none" stroke="url(#goldGradient)" strokeWidth="4" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" />
            <path d="M 815 250 C 815 220 845 220 845 250" fill="none" stroke="url(#goldGradient)" strokeWidth="4" />
          </g>
          
          {/* Map Pin (Mid Right) */}
          <g className="floating-element" style={{ animationDelay: '2.4s' }}>
            <path d="M 880 480 C 880 440 930 440 930 480 C 930 520 905 550 905 550 C 905 550 880 520 880 480 Z" fill="url(#goldGradient)" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" />
            <circle cx="905" cy="475" r="12" fill="#0c2b5e" />
          </g>

          {/* Small Wing (Mid Left) */}
          <g className="floating-element" style={{ animationDelay: '0.5s' }}>
            <path d="M 120 450 Q 80 480 80 500 Q 110 490 140 470 Z M 120 450 Q 90 440 70 430 Q 100 450 140 470 Z" fill="none" stroke="url(#goldGradient)" strokeWidth="4" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" />
            <path d="M 100 500 Q 120 500 130 490" fill="none" stroke="url(#goldGradient)" strokeWidth="4" />
          </g>

          {/* Shopping Cart (Bottom Left) */}
          <g className="floating-element" style={{ animationDelay: '1.5s' }}>
            <path d="M 120 700 L 140 700 L 160 760 L 220 760 M 150 720 L 230 720 L 220 750 L 160 750" fill="none" stroke="url(#goldGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" />
            <circle cx="170" cy="780" r="8" fill="url(#goldGradient)" />
            <circle cx="210" cy="780" r="8" fill="url(#goldGradient)" />
          </g>

          {/* Arabesque Pattern (Bottom Right) */}
          <g className="floating-element" style={{ animationDelay: '2.0s' }}>
            <path d="M 800 700 Q 820 720 840 700 Q 820 680 800 700 Z M 840 700 Q 860 720 880 700 Q 860 680 840 700 Z M 820 720 Q 840 740 820 760 Q 800 740 820 720 Z" fill="none" stroke="url(#goldGradient)" strokeWidth="3" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" />
            <circle cx="840" cy="740" r="3" fill="url(#goldGradient)" />
          </g>

          {/* 1. Lion Body Outline / Logo Base */}
          <g id="lion-body" style={{ filter: 'drop-shadow(0px 8px 12px rgba(0,0,0,0.5))' }}>
            {/* The actual traced high-quality path */}
            <path className="neon-stroke" fill="none" stroke="url(#goldGradient)" strokeWidth="3" d={LionPath}></path>
          </g>

          {/* 2. Lion Wing - Pulsing */}
          <g id="lion-wing" className="pulsing-wing" style={{ transformOrigin: '500px 500px' }}>
            <path className="neon-stroke" fill="none" stroke="#BF9B30" strokeWidth="2" d="M450 350 Q 300 200 250 350 Q 350 400 450 450 Z"></path>
          </g>

          {/* Texts fading up */}
          <g id="arabic-text" className="fade-up-text">
            <text x="512" y="920" fontFamily="'Cairo', sans-serif" fontSize="60" fill="url(#goldGradient)" textAnchor="middle" fontWeight="bold">سوق بغداد</text>
          </g>
          
          <g id="english-text" className="fade-up-text" style={{ animationDelay: '2.7s' }}>
            <text x="512" y="980" fontFamily="sans-serif" fontSize="30" fill="url(#goldGradient)" textAnchor="middle" letterSpacing="4">SOUQ BAGHDAD</text>
          </g>
        </svg>
      </div>

      {/* Professional Golden Loading Bar (Left to Right) */}
      <div 
        dir="ltr"
        className={`absolute bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 w-3/4 max-w-md h-4 rounded-full border-[2px] border-[#d4af37] bg-[#0c2b5e]/40 p-[2px] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-500 ease-in-out ${
          isFadingOut ? 'translate-y-10 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100'
        }`}
      >
        <div 
          className="h-full bg-gradient-to-r from-[#d4af37] via-[#fdf5a6] to-[#d4af37] rounded-full shadow-[0_0_10px_#fdf5a6]"
          style={{ 
            animation: `loadBar ${minDuration}ms ease-out forwards`,
          }}
        ></div>
      </div>

      {/* Welcome Message */}
      <div 
        className={`absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-[#fdf5a6]/80 text-sm font-bold tracking-wide transition-all duration-500 ease-in-out fade-up-text ${
          isFadingOut ? 'translate-y-10 opacity-0' : ''
        }`}
        style={{ animationDelay: '1.5s' }}
      >
        جاري تجهيز أفضل العروض لك...
      </div>

      <style>{`
        /* 1. تأثير الرسم الذاتي (الخطوط النيونية الذهبية) */
        .neon-stroke {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: drawPath 1.5s ease-in-out forwards; 
        }
        
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }

        @keyframes loadBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        /* 2. تأثير نبض ولمعان جناح الأسد */
        .pulsing-wing {
          animation: pulseGlow 2s infinite alternate ease-in-out;
        }
        
        @keyframes pulseGlow {
          0% { 
            transform: scale(1); 
            filter: drop-shadow(0 0 2px rgba(191, 155, 48, 0.5)); 
          }
          100% { 
            transform: scale(1.02); 
            filter: drop-shadow(0 0 10px rgba(235, 196, 126, 0.8)); 
          }
        }

        /* 3. تأثير ظهور النصوص من الأسفل للأعلى */
        .fade-up-text {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.6s ease-out 1.2s forwards; 
        }
        
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 4. الأيقونات والعناصر العائمة في الخلفية */
        .floating-element {
          animation: floatCustom 4s ease-in-out infinite;
        }
        
        @keyframes floatCustom {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        /* 5. تأثير الموجة العائمة (Blob Wave) */
        .blob-wave {
          transform-origin: 500px 500px;
          animation: blobRotate1 25s infinite linear;
        }
        .blob-wave-2 {
          transform-origin: 500px 500px;
          animation: blobRotate2 18s infinite linear reverse;
        }
        
        @keyframes blobRotate1 {
          0% { transform: translate(500px, 500px) scale(3.5) rotate(0deg); }
          50% { transform: translate(500px, 500px) scale(3.8) rotate(180deg); }
          100% { transform: translate(500px, 500px) scale(3.5) rotate(360deg); }
        }
        @keyframes blobRotate2 {
          0% { transform: translate(500px, 500px) scale(4) rotate(0deg); }
          50% { transform: translate(500px, 500px) scale(3.6) rotate(180deg); }
          100% { transform: translate(500px, 500px) scale(4) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
