/**
 * @hook useWindowEvent
 * @description Zero-useEffect window event subscription using useSyncExternalStore.
 * Subscribes to a window CustomEvent and returns the latest event detail.
 * The component re-renders only when the event fires.
 *
 * @example
 * const detail = useWindowEvent<{ x: number; y: number }>('assistant-point-to', null)
 */
import { useSyncExternalStore, useRef, useCallback } from 'react'

export function useWindowEvent<T>(
  eventName: string,
  initialValue: T,
): T {
  const valueRef = useRef<T>(initialValue)
  const listenersRef = useRef<Set<() => void>>(new Set())

  const subscribe = useCallback(
    (notify: () => void) => {
      listenersRef.current.add(notify)

      const handler = (e: Event) => {
        valueRef.current = (e as CustomEvent<T>).detail
        listenersRef.current.forEach(fn => fn())
      }

      window.addEventListener(eventName, handler)
      return () => {
        listenersRef.current.delete(notify)
        window.removeEventListener(eventName, handler)
      }
    },
    [eventName],
  )

  const getSnapshot = useCallback(() => valueRef.current, [])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
