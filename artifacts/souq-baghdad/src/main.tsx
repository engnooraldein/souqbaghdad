import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

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
