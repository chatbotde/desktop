'use client'

/**
 * @overlay PointerOverlay
 * @feature pointer
 * @description Animated mouse cursor that glides to coordinates dispatched
 *   by 'assistant-point-to' CustomEvents. Zero useEffect — subscribes via
 *   useSyncExternalStore through useWindowEvent.
 * @featureFlag pointer-always-visible
 * @placement fixed, full-screen, pointer-events-none
 */

import { useSyncExternalStore, useRef, useCallback } from 'react'
import { MousePointer2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFeature } from '@/contexts/FeatureContext'

// ── Store: subscribe to 'assistant-point-to' events ──────────────────────────
// useSyncExternalStore makes this reactive without any useEffect.

interface PointerDetail { x: number; y: number }

function createPointerStore(isAlwaysVisible: boolean) {
  type PointerState = { x: number; y: number; visible: boolean }
  let current: PointerState = {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    visible: isAlwaysVisible,
  }
  const listeners = new Set<() => void>()
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const handler = (e: Event) => {
    const { x, y } = (e as CustomEvent<PointerDetail>).detail
    if (hideTimer) clearTimeout(hideTimer)
    current = { x, y, visible: true }
    listeners.forEach(fn => fn())

    if (!isAlwaysVisible) {
      hideTimer = setTimeout(() => {
        current = { ...current, visible: false }
        listeners.forEach(fn => fn())
      }, 6000)
    }
  }

  return {
    subscribe(notify: () => void) {
      listeners.add(notify)
      window.addEventListener('assistant-point-to', handler)
      return () => {
        listeners.delete(notify)
        window.removeEventListener('assistant-point-to', handler)
        if (hideTimer) clearTimeout(hideTimer)
      }
    },
    getSnapshot: () => current,
  }
}

export function PointerOverlay() {
  const { isFeatureEnabled } = useFeature()
  const isAlwaysVisible = isFeatureEnabled('pointer-always-visible')

  // One store per isAlwaysVisible value — stable via ref so it isn't recreated on render
  const storeRef = useRef<ReturnType<typeof createPointerStore> | null>(null)
  if (!storeRef.current) storeRef.current = createPointerStore(isAlwaysVisible)

  // Recreate store when isAlwaysVisible changes
  const prevVisible = useRef(isAlwaysVisible)
  if (prevVisible.current !== isAlwaysVisible) {
    prevVisible.current = isAlwaysVisible
    storeRef.current = createPointerStore(isAlwaysVisible)
  }

  const subscribe = useCallback(
    (notify: () => void) => storeRef.current!.subscribe(notify),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAlwaysVisible],
  )
  const getSnapshot = useCallback(() => storeRef.current!.getSnapshot(), [])

  // useSyncExternalStore — zero useEffect, fully reactive
  const pointerState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <AnimatePresence>
      {pointerState.visible && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{ background: 'transparent' }}
        >
          <motion.div
            initial={{ opacity: 0, x: pointerState.x, y: pointerState.y, scale: 0.8 }}
            animate={{ opacity: 1, x: pointerState.x, y: pointerState.y, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 70, damping: 15, mass: 0.8 }}
            className="absolute flex items-start justify-start"
            style={{ marginLeft: '-4px', marginTop: '-4px' }}
          >
            <div className="relative">
              <MousePointer2 className="w-10 h-10 text-white fill-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] relative z-20" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
