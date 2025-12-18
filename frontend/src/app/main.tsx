import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import App from './App'
import { AppProviders } from './providers'
import { initializeClickthrough } from '../lib/clickthrough'

// Initialize clickthrough system when DOM is ready
initializeClickthrough()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
