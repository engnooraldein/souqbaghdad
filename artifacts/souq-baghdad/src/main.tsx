import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

// ===========================================
// المسؤولية:
// نقطة البداية (Entry Point) للتطبيق بأكمله.
// يقوم بتشغيل الـ React وربطه بملف الـ HTML (div#root).
//
// لماذا موجود؟
// بدونه لن يعمل التطبيق.
//
// آمن للتعديل:
// نعم، ولكن عادة لا يحتاج إلى تعديل إلا لإضافة Providers عالمية (مثل Redux أو Context).
// ===========================================
// Catch unhandled promise rejections (like Supabase API failures)
window.addEventListener('unhandledrejection', (event) => {
  import('./lib/errorLogger').then(({ logCriticalError }) => {
    const stored = localStorage.getItem('souqUser');
    const userId = stored ? JSON.parse(stored).id : undefined;
    logCriticalError(
      'Unhandled Promise Rejection',
      event.reason?.message || String(event.reason),
      event.reason?.stack,
      userId
    );
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
