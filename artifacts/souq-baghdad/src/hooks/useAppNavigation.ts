import { useState, useEffect } from 'react';
import { useMotionValue, animate as fmAnimate } from 'framer-motion';
import { supabase } from '../lib/supabase';

type AppView = 'home'|'profile'|'admin'|'owner'|'seller'|'transport'|'products'|'ad-detail'|'product-detail'|'transport-detail' | string;

const MAIN_VIEWS = ['home', 'transport', 'products', 'profile'];

export function useAppNavigation() {
  const getInitialRouteInfo = () => {
    if (typeof window === 'undefined') return { hash: '', path: '' };
    let path = window.location.pathname;
    
    // Backwards compatibility for old hash links
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      path = window.location.hash.substring(1);
    }
    
    return { path };
  };

  const [view, setView] = useState<AppView>(() => {
    const { path } = getInitialRouteInfo();
    if (path.startsWith('/privacy')) return 'privacy';
    if (path.startsWith('/transport')) return 'transport';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/seller') || path.startsWith('/profile/')) return 'seller';
    if (path === '/profile' || path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/owner')) return 'owner';
    return 'home';
  });

  const [bottomNavActive, setBottomNavActive] = useState(() => {
    const { path } = getInitialRouteInfo();
    if (path.startsWith('/transport')) return 'transport';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/seller') || path.startsWith('/profile')) return 'profile';
    return 'home';
  });

  // ---- Swipe Navigation ----
  const [swipeDir, setSwipeDir] = useState<1|-1>(1);
  const mainDragX = useMotionValue(0);
  const peekDragX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth : 390);
  const [peekView, setPeekView] = useState<string|null>(null);
  const [peekSide, setPeekSide] = useState<'right'|'left'>('right');

  const onSwipePan = (event: any, info: any) => {
    if (!MAIN_VIEWS.includes(view)) return;
    const W = window.innerWidth;
    const dx = info.offset.x;
    const dy = info.offset.y;

    // Ignore if vertical movement is dominant (user is scrolling up/down)
    if (Math.abs(dy) > Math.abs(dx) * 0.6) return;

    // Ignore if the touch started inside a horizontally scrollable element (like VIP carousel)
    const target = event?.target as HTMLElement | null;
    if (target) {
      let el: HTMLElement | null = target;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflowX = style.overflowX;
        if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth) {
          return; // inside a scrollable carousel, don't navigate
        }
        el = el.parentElement;
      }
    }

    const idx = MAIN_VIEWS.indexOf(view);
    const len = MAIN_VIEWS.length;
    mainDragX.set(dx);
    if (dx < -5) {
      const nextIdx = (idx + 1) % len;
      const next = MAIN_VIEWS[nextIdx];
      if (peekView !== next) { setPeekView(next); setPeekSide('right'); }
      peekDragX.set(dx + W);
    } else if (dx > 5) {
      const prevIdx = (idx - 1 + len) % len;
      const prev = MAIN_VIEWS[prevIdx];
      if (peekView !== prev) { setPeekView(prev); setPeekSide('left'); }
      peekDragX.set(dx - W);
    }
  };

  const onSwipePanEnd = (_: any, info: any) => {
    const W = window.innerWidth;
    const threshold = W * 0.28;
    const vel = info.velocity.x;
    const dist = info.offset.x;
    
    if ((dist < -threshold || vel < -400) && peekView && peekSide === 'right') {
      fmAnimate(mainDragX, -W, { duration: 0.22, ease: [0.4, 0, 0.2, 1] });
      fmAnimate(peekDragX, 0, { duration: 0.22, ease: [0.4, 0, 0.2, 1] }).then(() => {
        const next = peekView;
        mainDragX.set(-W - 2000);
        setView(next); setBottomNavActive(next); setSwipeDir(-1);
        requestAnimationFrame(() => {
          mainDragX.set(0);
          peekDragX.set(W + 2000);
          setTimeout(() => setPeekView(null), 30);
        });
      });
    } else if ((dist > threshold || vel > 400) && peekView && peekSide === 'left') {
      fmAnimate(mainDragX, W, { duration: 0.22, ease: [0.4, 0, 0.2, 1] });
      fmAnimate(peekDragX, 0, { duration: 0.22, ease: [0.4, 0, 0.2, 1] }).then(() => {
        const prev = peekView;
        mainDragX.set(W + 2000);
        setView(prev); setBottomNavActive(prev); setSwipeDir(1);
        requestAnimationFrame(() => {
          mainDragX.set(0);
          peekDragX.set(-W - 2000);
          setTimeout(() => setPeekView(null), 30);
        });
      });
    } else {
      fmAnimate(mainDragX, 0, { duration: 0.3, ease: [0.4, 0, 0.2, 1] });
      fmAnimate(peekDragX, peekSide === 'right' ? W : -W, { duration: 0.3, ease: [0.4, 0, 0.2, 1] });
      setTimeout(() => setPeekView(null), 330);
    }
  };

  useEffect(() => {
    if (view === 'transport') setBottomNavActive('transport');
    else if (view === 'products') setBottomNavActive('products');
    else if (view === 'profile' || view === 'seller') setBottomNavActive('profile');
    else if (view === 'home') setBottomNavActive('home');
  }, [view]);

  const [selectedSellerId, setSelectedSellerId] = useState<string|null>(() => {
    const { path } = getInitialRouteInfo();
    const sellerMatch = path.match(/^\/(seller|profile)\/([0-9a-f-]{36})/i);
    if (sellerMatch) return sellerMatch[2];
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last)) return last;
    return null;
  });

  const [selectedSellerPhone, setSelectedSellerPhone] = useState<string|null>(() => {
    const { path } = getInitialRouteInfo();
    if (path.startsWith('/seller/')) return path.split('/')[2] || null;
    if (path.startsWith('/profile/')) return path.split('/')[2] || null;
    return null;
  });

  useEffect(() => {
    if (view === 'profile' && selectedSellerPhone) {
      // UUID format (contains dashes like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      if (selectedSellerPhone.includes('-') && selectedSellerPhone.length > 30) {
        setSelectedSellerId(selectedSellerPhone);
      } else {
        // Could be a phone number OR a username slug - try username first, then phone
        const slug = selectedSellerPhone;
        supabase.from('profiles')
          .select('id')
          .or(`phone.eq.${slug},username.eq.${slug}`)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setSelectedSellerId(data.id);
          });
      }
    }
  }, [view, selectedSellerPhone]);

  return {
    view, setView,
    bottomNavActive, setBottomNavActive,
    swipeDir, setSwipeDir,
    mainDragX, peekDragX,
    peekView, peekSide,
    onSwipePan, onSwipePanEnd,
    selectedSellerId, setSelectedSellerId,
    selectedSellerPhone, setSelectedSellerPhone
  };
}
