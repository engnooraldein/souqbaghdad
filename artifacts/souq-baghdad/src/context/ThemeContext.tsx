import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('souqBaghdad_theme');
        if (saved) return saved as Theme;
      } catch (e) {
        console.warn('Safari Private Mode or localStorage error');
      }
      
      // الكشف التلقائي - يدعم سفاري وجميع المتصفحات
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
    return 'dark';
  });

  // تطبيق السمة وحفظها
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    try {
      window.localStorage.setItem('souqBaghdad_theme', theme);
    } catch (e) {
      // تجاهل خطأ سفاري في التصفح الخفي
    }
  }, [theme]);

  // الاستماع للتغييرات التلقائية (متوافق مع سفاري)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      try {
        const saved = window.localStorage.getItem('souqBaghdad_theme');
        if (!saved) {
          // استخدام mediaQuery.matches بدلاً من الحدث لضمان عملها في سفاري القديم
          setTheme(mediaQuery.matches ? 'dark' : 'light');
        }
      } catch (e) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    // إضافة المستمع بطرق تدعم كل الإصدارات
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
