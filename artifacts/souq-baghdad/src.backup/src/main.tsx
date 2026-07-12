import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { FeatureFlagsProvider } from './context/FeatureFlagsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FeatureFlagsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FeatureFlagsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
