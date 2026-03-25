import { useEffect, useState } from 'react'
import ClickThrough from '@/components/click-through'
import { AppStateProvider } from './context/AppContext'
import { OverlayRegistry } from './overlays/OverlayRegistry'
import { UpgradePopup } from '@/components/upgrade-popup'
import { redeemVipCode, setTrialExpiredForTesting, resetTrialForTesting } from '@/lib/subscription'

/**
 * App - Root component of the application.
 * Now refactored to use a modular architecture:
 * 1. AppStateProvider: Manages all global UI and AI logic via Context.
 * 2. OverlayRegistry: Renders all registered features/overlays.
 * 
 * To add a new feature:
 * 1. Create a new overlay component in src/app/overlays/
 * 2. Register it in src/app/overlays/OverlayRegistry.tsx
 */
function App() {
  const [upgradePopupState, setUpgradePopupState] = useState<{
    isVisible: boolean;
    plan: string;
    trialDaysUsed: number;
    trialDaysTotal: number;
    upgradeUrl: string;
    errorMessage: string;
  }>({
    isVisible: false,
    plan: 'free',
    trialDaysUsed: 0,
    trialDaysTotal: 10,
    upgradeUrl: '',
    errorMessage: '',
  })

  // Handle upgrade popup events from chat
  useEffect(() => {
    const handleShowUpgradePopup = (event: Event) => {
      const customEvent = event as CustomEvent<{
        plan: string;
        trialDaysUsed: number;
        trialDaysTotal: number;
        upgradeUrl: string;
        message: string;
      }>
      setUpgradePopupState({
        isVisible: true,
        plan: customEvent.detail.plan,
        trialDaysUsed: customEvent.detail.trialDaysUsed,
        trialDaysTotal: customEvent.detail.trialDaysTotal,
        upgradeUrl: customEvent.detail.upgradeUrl,
        errorMessage: customEvent.detail.message,
      })
    }

    window.addEventListener('show-upgrade-popup', handleShowUpgradePopup)
    return () => {
      window.removeEventListener('show-upgrade-popup', handleShowUpgradePopup)
    }
  }, [])

  // Debug: Check for CaptureAPI on mount
  useEffect(() => {
    console.log('[App] Component mounted, checking for CaptureAPI...');

    // Check after a short delay in case preload hasn't finished
    const timeout = setTimeout(() => {
      console.log('[App] window.CaptureAPI:', window.CaptureAPI);
      if (!window.CaptureAPI) {
        console.warn('[App] CaptureAPI is not available. This is normal in a browser environment, but expected in Electron.');
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <AppStateProvider>
      <div className="h-screen w-full items-center justify-center bg-transparent relative overflow-hidden">
        <ClickThrough />

        {/* All application features and overlays are rendered here */}
        <OverlayRegistry />

        {/* Upgrade Popup - shows when subscription limit reached */}
        <UpgradePopup
          isVisible={upgradePopupState.isVisible}
          onDismiss={() => setUpgradePopupState(prev => ({ ...prev, isVisible: false }))}
          onUpgrade={() => {
            if (upgradePopupState.upgradeUrl) {
              window.open(upgradePopupState.upgradeUrl, '_blank')
            }
            setUpgradePopupState(prev => ({ ...prev, isVisible: false }))
          }}
          onRedeemVipCode={async (code: string) => {
            return redeemVipCode(code)
          }}
          plan={upgradePopupState.plan}
          trialDaysUsed={upgradePopupState.trialDaysUsed}
          trialDaysTotal={upgradePopupState.trialDaysTotal}
          upgradeUrl={upgradePopupState.upgradeUrl}
        />

        {/* DEV TESTING BUTTONS - Remove in production */}
        <div className="fixed bottom-4 right-4 flex gap-2 z-50">
          <button
            onClick={() => {
              setTrialExpiredForTesting()
              window.location.reload()
            }}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500"
          >
            DEV: Expire Trial
          </button>
          <button
            onClick={() => {
              resetTrialForTesting()
              window.location.reload()
            }}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500"
          >
            DEV: Reset Trial
          </button>
        </div>
      </div>
    </AppStateProvider>
  )
}

export default App
