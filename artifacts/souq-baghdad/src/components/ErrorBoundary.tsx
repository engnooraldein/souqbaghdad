// ===========================================
// مسؤولية هذا الملف:
// يلتقط أخطاء React (Error Boundary) ويعرض رسالة خطأ بدلاً من تحطم التطبيق.
// يكتشف أخطاء "Failed to fetch dynamically imported module" (Chunk Load Error)
// ويعمل reload تلقائي لتجنب مشاكل stale cache بعد كل deploy.
//
// لا يتصل بـ Supabase مباشرة.
//
// انتبه:
// يجب أن يكون هذا المكوّن مغلّفاً لـ App بالكامل في main.tsx.
// أي خطأ غير محسوب سيُوقف التطبيق إذا لم يكن هنا.
//
// آمن للتعديل:
// نعم، لكن لا تحذفه.
// ===========================================

import React from 'react';

const isChunkLoadError = (error: any): boolean => {
  if (!error) return false;
  const msg = error?.message || String(error);
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('ChunkLoadError')
  );
};

const searilizeError = (error: any) => {
  if (error instanceof Error) {
    return error.message + '\n' + error.stack;
  }
  return JSON.stringify(error, null, 2);
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; isChunkError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: any) {
    const chunkError = isChunkLoadError(error);
    return { hasError: true, error, isChunkError: chunkError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Auto-reload for chunk/cache errors (stale deploy)
    if (isChunkLoadError(error)) {
      // Avoid infinite reload loop: only reload once per session
      const key = 'souq_chunk_reload_at';
      const lastReload = sessionStorage.getItem(key);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
        return;
      }
    }

    import('../lib/errorLogger').then(({ logCriticalError }) => {
      const stored = localStorage.getItem('souqUser');
      const userId = stored ? JSON.parse(stored).id : undefined;
      logCriticalError(
        'React Crash',
        error.message || 'Unknown React Error',
        errorInfo.componentStack || error.stack,
        userId
      );
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        // Show a friendly "updating" screen while reloading
        return (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100vh',
            background: '#050e1a', color: '#fff', fontFamily: 'sans-serif', gap: '1rem'
          }}>
            <div style={{ fontSize: '2.5rem' }}>🔄</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>جاري تحديث التطبيق...</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>يتم تحميل أحدث إصدار، سيتم إعادة التحميل تلقائياً.</p>
          </div>
        );
      }

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh',
          background: '#050e1a', color: '#fff', fontFamily: 'sans-serif',
          padding: '2rem', gap: '1rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>حدث خطأ غير متوقع</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem', padding: '0.6rem 1.6rem',
              background: '#d4af37', color: '#000', border: 'none',
              borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
