// ===========================================
// مسؤولية هذا الـ Hook:
// يُشغّل أصوات النظام (نجاح، خطأ، نقر، معلومات) باستخدام Web Audio API.
//
// لا يتصل بـ Supabase. مكوّن Utility بحت.
//
// الأصوات المتاحة:
// - 'success': صوت ارتفاع (نشر إعلان، تسجيل دخول)
// - 'error': صوت انخفاض (خطأ)
// - 'click': صوت نقر
// - 'info': صوت معلومات (إشعار)
//
// ✅ آمن للتعديل:
// نعم. يمكن تغيير التردد في مصفوفة 'f'.
// ===========================================
import { useRef } from 'react';

export const useSound = () => {
  const ctx = useRef<AudioContext|null>(null);
  return (type: 'success' | 'error' | 'click' | 'info' | 'upload' | 'delete' | 'admin') => {
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const c = ctx.current;
      
      // If audio context is suspended (browser policy), resume it
      if (c.state === 'suspended') {
        c.resume();
      }

      const playTone = (freqs: number[], duration = 0.3, typeNode: OscillatorType = 'sine', volume = 0.2) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = typeNode;
        osc.connect(gain);
        gain.connect(c.destination);
        
        const now = c.currentTime;
        if (freqs.length === 1) {
          osc.frequency.setValueAtTime(freqs[0], now);
        } else if (freqs.length === 2) {
          osc.frequency.setValueAtTime(freqs[0], now);
          osc.frequency.setValueAtTime(freqs[1], now + duration / 2);
        } else {
          // Play arpeggio
          freqs.forEach((f, idx) => {
            osc.frequency.setValueAtTime(f, now + (idx * (duration / freqs.length)));
          });
        }
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + duration);
        osc.start(now);
        osc.stop(now + duration);
      };

      if (type === 'upload') {
        // High-pitched rapid triple bubble sound (rising arpeggio)
        playTone([523.25, 659.25, 783.99], 0.25, 'sine', 0.25);
      } else if (type === 'delete') {
        // Soft dual descending disappointment/warning tone
        playTone([493.88, 329.63], 0.35, 'triangle', 0.25);
      } else if (type === 'admin') {
        // Gorgeous double bell chime (A5, then E6 perfect fifth) with slightly longer decay for an elegant administrative feel
        playTone([880.00, 1318.51], 0.6, 'sine', 0.3);
      } else {
        // Standard sounds
        const f: Record<string, number[]> = {
          success: [800, 1000],
          error: [400, 300],
          click: [500, 500],
          info: [700, 900]
        };
        playTone(f[type], 0.3, 'sine', 0.2);
      }
    } catch (e) {
      console.warn('Audio Context play failed', e);
    }
  };
};

