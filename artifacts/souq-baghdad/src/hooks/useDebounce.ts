// ===========================================
// مسؤولية هذا الملف:
// Hook مساعد لتأخير تنفيذ قيمة حتى يتوقف المستخدم عن الكتابة.
//
// الاستخدام الرئيسي:
// شريط البحث — لتجنب إعادة البحث مع كل حرف يُكتب.
// ===========================================
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
