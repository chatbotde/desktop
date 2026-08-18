'use client'

/**
 * @overlay PointerOverlay
 * @feature pointer
 * @description Animated mouse cursor that glides to coordinates dispatched
 *   by 'assistant-point-to' CustomEvents. Stays visible while the agent runs.
 * @featureFlag pointer-always-visible
 * @placement fixed, full-screen, pointer-events-none
 */

import { useSyncExternalStore, useRef, useCallback } from 'react'
import { MousePointer2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFeature } from '@/contexts/FeatureContext'
import { useIsDark } from '@/shared/providers'
import { GLOBAL_THEME } from '@/global/theme'

interface PointerDetail { x: number; y: number }

function createPointerStore(isAlwaysVisible: boolean) {
  type PointerState = { x: number; y: number; visible: boolean; agentRunning: boolean }
  let current: PointerState = {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    visible: isAlwaysVisible,
    agentRunning: false,
  }
  const listeners = new Set<() => void>()
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const notify = () => listeners.forEach(fn => fn())

  const scheduleHide = () => {
    if (isAlwaysVisible || current.agentRunning) return
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      if (!current.agentRunning) {
        current = { ...current, visible: false }
        notify()
      }
    }, 6000)
  }

  const pointHandler = (e: Event) => {
    const { x, y } = (e as CustomEvent<PointerDetail>).detail
    if (hideTimer) clearTimeout(hideTimer)
    current = { ...current, x, y, visible: true }
    notify()
    scheduleHide()
  }

  const agentHandler = (e: Event) => {
    const { running } = (e as CustomEvent<{ running: boolean }>).detail
    current = { ...current, agentRunning: running, visible: running || current.visible }
    if (hideTimer) clearTimeout(hideTimer)
    notify()
    if (!running) scheduleHide()
  }

  return {
    subscribe(notifyFn: () => void) {
      listeners.add(notifyFn)
      window.addEventListener('assistant-point-to', pointHandler)
      window.addEventListener('assistant-agent-state', agentHandler)
      return () => {
        listeners.delete(notifyFn)
        window.removeEventListener('assistant-point-to', pointHandler)
        window.removeEventListener('assistant-agent-state', agentHandler)
        if (hideTimer) clearTimeout(hideTimer)
      }
    },
    getSnapshot: () => current,
  }
}

export function PointerOverlay() {
  const { isFeatureEnabled } = useFeature()
  const isAlwaysVisible = isFeatureEnabled('pointer-always-visible')
  const isDark = useIsDark()
  const accent = GLOBAL_THEME.vars.accent

  const storeRef = useRef<ReturnType<typeof createPointerStore> | null>(null)
  if (!storeRef.current) storeRef.current = createPointerStore(isAlwaysVisible)

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

  const pointerState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const showPointer = pointerState.visible || pointerState.agentRunning

  return (
    <AnimatePresence>
      {showPointer && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{ background: 'transparent' }}
        >
          <motion.div
            initial={{ opacity: 0, x: pointerState.x, y: pointerState.y, scale: 0.8 }}
            animate={{
              opacity: 1,
              x: pointerState.x,
              y: pointerState.y,
              scale: pointerState.agentRunning ? [1, 1.08, 1] : 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={
              pointerState.agentRunning
                ? { x: { type: 'spring', stiffness: 90, damping: 18 }, y: { type: 'spring', stiffness: 90, damping: 18 }, scale: { repeat: Infinity, duration: 1.4 } }
                : { type: 'spring', stiffness: 70, damping: 15, mass: 0.8 }
            }
            className="absolute flex items-start justify-start"
            style={{ marginLeft: '-4px', marginTop: '-4px' }}
          >
            <div className="relative">
              <MousePointer2
                className={`w-10 h-10 relative z-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] ${
                  isDark ? 'text-white fill-black' : 'text-zinc-900 fill-white'
                }`}
                style={
                  pointerState.agentRunning
                    ? { filter: `drop-shadow(0 0 12px ${accent}99)` }
                    : undefined
                }
              />
              {pointerState.agentRunning && (
                <motion.div
                  className="absolute -inset-2 rounded-full border-2"
                  style={{ borderColor: `${accent}80` }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
