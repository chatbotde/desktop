import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeClickthrough } from './lib/clickthrough'
import { FeatureProvider } from './contexts/FeatureContext'

// Initialize clickthrough system when DOM is ready
initializeClickthrough()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeatureProvider>
    <App />
    </FeatureProvider>
  </StrictMode>,
)
