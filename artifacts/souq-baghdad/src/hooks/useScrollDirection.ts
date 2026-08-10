import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }
      setIsAtTop(scrollY < 50);
      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollDirection, isAtTop };
}
