import { useRef, useEffect, useState } from 'react';

export const useSound = () => {
  const ctx = useRef<AudioContext|null>(null);
  return (type:'success'|'error'|'click'|'info') => {
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const c=ctx.current, osc=c.createOscillator(), gain=c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      const f:Record<string,number[]>={success:[800,1000],error:[400,300],click:[500,500],info:[700,900]};
      osc.frequency.setValueAtTime(f[type][0],c.currentTime); osc.frequency.setValueAtTime(f[type][1],c.currentTime+0.1);
      gain.gain.setValueAtTime(0.2,c.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,c.currentTime+0.3);
      osc.start(c.currentTime); osc.stop(c.currentTime+0.3);
    } catch {}
  };
}
