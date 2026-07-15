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
// Auto-reload on chunk load errors (stale cache after deploy)
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk')
  ) {
    const key = 'souq_chunk_reload_at';
    const lastReload = sessionStorage.getItem(key);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }
});

// Catch unhandled promise rejections (like dynamic import failures & Supabase errors)
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason || '');
  // Auto-reload on chunk/dynamic import failures (stale cache after deploy)
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk')
  ) {
    const key = 'souq_chunk_reload_at';
    const lastReload = sessionStorage.getItem(key);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
    return;
  }

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
