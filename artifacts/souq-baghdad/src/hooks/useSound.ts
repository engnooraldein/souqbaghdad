import { useRef } from 'react';

export const useSound = () => {
  const ctx = useRef<AudioContext|null>(null);
  return (type: 'success' | 'error' | 'click' | 'info' | 'upload' | 'delete' | 'admin') => {
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const c = ctx.current;
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
        playTone([523.25, 659.25, 783.99], 0.25, 'sine', 0.25);
      } else if (type === 'delete') {
        playTone([493.88, 329.63], 0.35, 'triangle', 0.25);
      } else if (type === 'admin') {
        playTone([880.00, 1318.51], 0.6, 'sine', 0.3);
      } else {
        const f: Record<string, number[]> = {
          success: [800, 1000],
          error: [400, 300],
          click: [500, 500],
          info: [700, 900]
        };
        playTone(f[type], 0.3, 'sine', 0.2);
      }
    } catch {}
  };
};
