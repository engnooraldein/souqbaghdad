import { useState, useEffect } from 'react';

export function getRelative(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5)  return 'الآن';
  if (s < 60) return `منذ ${s} ثانية`;
  const m = Math.floor(s/60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m/60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h/24);
  if (d < 7)  return `منذ ${d} يوم`;
  const w = Math.floor(d/7);
  if (w < 5)  return `منذ ${w} أسبوع`;
  return `منذ ${Math.floor(d/30)} شهر`;
}

export function useRelativeTime(iso: string) {
  const [rel, setRel] = useState(() => getRelative(iso));
  useEffect(() => {
    setRel(getRelative(iso));
    const iv = setInterval(() => setRel(getRelative(iso)), 10000);
    return () => clearInterval(iv);
  }, [iso]);
  return rel;
}
