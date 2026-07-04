import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    let hideTimer: NodeJS.Timeout;

    if (!isLoading) {
      hideTimer = setTimeout(() => {
        setIsFadingOut(true); 
        setTimeout(() => setShow(false), 500);
      }, minDuration);
    }

    return () => clearTimeout(hideTimer);
  }, [isLoading, minDuration]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#030712] transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-64 h-64 md:w-96 md:h-96">
        <svg viewBox="0 0 1000 1000" width="100%" height="100%">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#f4d03f" />
            </linearGradient>
          </defs>

          {/* Floating Coins/Bags Background Elements */}
          <g className="floating-element" style={{ animationDelay: '0s' }}>
            <circle cx="200" cy="200" r="20" fill="none" stroke="#BF9B30" strokeWidth="2" opacity="0.3" />
          </g>
          <g className="floating-element" style={{ animationDelay: '1s' }}>
            <rect x="800" y="300" width="40" height="40" rx="4" fill="none" stroke="#BF9B30" strokeWidth="2" opacity="0.3" />
          </g>
          <g className="floating-element" style={{ animationDelay: '2s' }}>
            <circle cx="850" cy="700" r="15" fill="none" stroke="#BF9B30" strokeWidth="2" opacity="0.3" />
          </g>
          <g className="floating-element" style={{ animationDelay: '0.5s' }}>
             <rect x="150" y="750" width="30" height="30" fill="none" stroke="#BF9B30" strokeWidth="2" opacity="0.3" transform="rotate(45 165 765)" />
          </g>

          {/* Lion Body Outline */}
          <g id="lion-body">
            <path 
              className="neon-stroke" 
              fill="none" 
              stroke="#BF9B30" 
              strokeWidth="4" 
              d="M300 600 Q 300 400 450 350 T 600 500 Q 700 550 700 700 L 650 700 Q 600 600 500 700 Z M350 700 L300 700"
            />
          </g>

          {/* Lion Wing - Pulsing */}
          <g id="lion-wing" className="pulsing-wing" style={{ transformOrigin: '450px 350px' }}>
            <path 
              className="neon-stroke" 
              fill="none" 
              stroke="#BF9B30" 
              strokeWidth="4" 
              d="M450 350 Q 350 200 250 250 Q 350 300 400 400 Z"
            />
          </g>

          {/* Cart Base - Outline */}
          <g id="cart-base">
            <path 
              className="neon-stroke" 
              fill="none" 
              stroke="#BF9B30" 
              strokeWidth="4" 
              d="M450 720 L 650 720 M480 750 A 20 20 0 1 0 480 751 M620 750 A 20 20 0 1 0 620 751"
            />
          </g>

          {/* Texts fading up */}
          <g id="arabic-text" className="fade-up-text">
            <text x="500" y="850" fontFamily="'Cairo', sans-serif" fontSize="60" fill="url(#goldGradient)" textAnchor="middle" fontWeight="bold">سوق بغداد</text>
          </g>
          
          <g id="english-text" className="fade-up-text" style={{ animationDelay: '2.7s' }}>
            <text x="500" y="920" fontFamily="sans-serif" fontSize="30" fill="url(#goldGradient)" textAnchor="middle" letterSpacing="4">SOUQ BAGHDAD</text>
          </g>
        </svg>
      </div>

      <style>{`
        /* 1. تأثير الرسم الذاتي (الخطوط النيونية الذهبية) */
        .neon-stroke {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: drawPath 3s ease-in-out forwards; 
        }
        
        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* 2. تأثير نبض ولمعان جناح الأسد */
        .pulsing-wing {
          animation: pulseGlow 2.5s infinite alternate ease-in-out;
        }
        
        @keyframes pulseGlow {
          0% { 
            transform: scale(1); 
            filter: drop-shadow(0 0 2px rgba(191, 155, 48, 0.5)); 
          }
          100% { 
            transform: scale(1.03); 
            filter: drop-shadow(0 0 12px rgba(235, 196, 126, 0.9)); 
          }
        }

        /* 3. تأثير ظهور النصوص من الأسفل للأعلى */
        .fade-up-text {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeUp 1s ease-out 2.5s forwards; 
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
      `}</style>
    </div>
  );
};
