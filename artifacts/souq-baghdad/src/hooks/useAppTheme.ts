import { useState, useEffect } from 'react';

export function useAppTheme() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const stored = localStorage.getItem('souqThemeMode');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {}
    return 'system';
  });

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    if (themeMode === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemDark);
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const changeThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    try {
      localStorage.setItem('souqThemeMode', mode);
    } catch {}
    setShowThemeMenu(false);
  };

  const toggleDarkMode = () => {
    setThemeMode(prev => {
      const next = prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system';
      try {
        localStorage.setItem('souqThemeMode', next);
      } catch {}
      return next;
    });
  };

  return {
    themeMode,
    isDarkMode,
    showThemeMenu,
    setShowThemeMenu,
    changeThemeMode,
    toggleDarkMode
  };
}
