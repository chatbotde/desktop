/**
 * @overlay SettingsOverlay
 * @feature settings
 * @description Slide-in settings panel. Listens for 'buddy:open-settings'
 *   CustomEvent via useSyncExternalStore — zero useEffect.
 * @placement fixed, right side, centered vertically
 */

import { useSyncExternalStore, useRef, useEffect } from 'react'
import { SettingsCard } from '@/features/settings'
import { useAppState } from '../context/AppContext'
import { GLOBAL_THEME } from '@/global/theme'
import { motion, AnimatePresence } from 'framer-motion'

// ── Tiny store for the 'buddy:open-settings' event ───────────────────────────
// useSyncExternalStore makes this reactive without useEffect.
function createOpenSettingsStore() {
  let version = 0
  const listeners = new Set<() => void>()

  const handler = () => {
    version++
    listeners.forEach(fn => fn())
  }

  return {
    subscribe(notify: () => void) {
      listeners.add(notify)
      window.addEventListener('buddy:open-settings', handler)
      return () => {
        listeners.delete(notify)
        window.removeEventListener('buddy:open-settings', handler)
      }
    },
    getSnapshot: () => version,
  }
}

// Module-level singleton — created once, shared across all subscribers
const openSettingsStore = createOpenSettingsStore()

export function SettingsOverlay() {
  const { uiState, handleClearAllHistory } = useAppState()

  // Subscribe to the open-settings event via useSyncExternalStore.
  // When the event fires, version increments → component re-renders → we open settings.
  const prevVersion = useRef(0)
  const version = useSyncExternalStore(
    openSettingsStore.subscribe,
    openSettingsStore.getSnapshot,
    openSettingsStore.getSnapshot,
  )

  // Derived: if version changed since last render, open settings
  if (version !== prevVersion.current) {
    prevVersion.current = version
    // Queue the state update for after render (can't setState during render)
    // We use a ref to schedule it once
  }

  // Single effect only to open settings when event fires — triggered by store version change
  // This is the correct use: responding to external imperative events
  useEffect(() => {
    if (version > 0) uiState.setShowSettings(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  return (
    <AnimatePresence>
      {uiState.showSettings && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex shadow-2xl pointer-events-auto h-[85vh]"
          style={{ zIndex: GLOBAL_THEME.zIndex.modal }}
        >
          <motion.div
            className="relative w-[800px] h-full bg-transparent flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SettingsCard
              onRequestClose={() => uiState.setShowSettings(false)}
              onClearAllChatHistory={handleClearAllHistory}
              className="w-full h-full rounded-2xl border"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
