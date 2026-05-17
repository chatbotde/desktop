import { useEffect } from 'react'
import ClickThrough from '@/components/click-through'
import { AppStateProvider } from './context/AppContext'
import { OverlayRegistry } from './overlays/OverlayRegistry'

/**
 * App - Root component of the application.
 * Modular architecture:
 * 1. AppStateProvider: Manages all global UI and AI logic via Context.
 * 2. OverlayRegistry: Renders all registered features/overlays.
 *
 * To add a new feature:
 * 1. Create a new overlay component in src/app/overlays/
 * 2. Register it in src/app/overlays/OverlayRegistry.tsx
 */
function App() {
  // ✅ Legitimate useEffect: one-time debug log on mount — side effect, no store needed.
  useEffect(() => {
    console.log('[App] Component mounted, checking for CaptureAPI...')
    const timeout = setTimeout(() => {
      console.log('[App] window.CaptureAPI:', window.CaptureAPI)
      if (!window.CaptureAPI) {
        console.warn('[App] CaptureAPI is not available. Normal in browser, expected in Electron.')
      }
    }, 1000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <AppStateProvider>
      <div className="h-screen w-full items-center justify-center bg-transparent relative overflow-hidden">
        <ClickThrough />
        {/* All application features and overlays are rendered here */}
        <OverlayRegistry />
      </div>
    </AppStateProvider>
  )
}

export default App