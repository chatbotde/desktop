import { useCallback, useSyncExternalStore } from 'react'
import {
  MANIM_GENERATION_EVENT,
  type ManimGenerationStatus,
} from '@/lib/manim/manim-video-prompt'

const IDLE: ManimGenerationStatus = { phase: 'idle' }

let currentStatus: ManimGenerationStatus = IDLE
const listeners = new Set<() => void>()

function emitLocal() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener(MANIM_GENERATION_EVENT, ((event: CustomEvent<ManimGenerationStatus>) => {
    currentStatus = event.detail ?? IDLE
    emitLocal()
  }) as EventListener)
}

export function useManimGenerationStatus(): ManimGenerationStatus {
  return useSyncExternalStore(
    useCallback((onStoreChange) => {
      listeners.add(onStoreChange)
      return () => listeners.delete(onStoreChange)
    }, []),
    () => currentStatus,
    () => IDLE,
  )
}
