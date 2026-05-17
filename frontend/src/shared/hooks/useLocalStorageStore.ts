/**
 * @hook useLocalStorageStore
 * @description Reactive localStorage value via useSyncExternalStore.
 * All components subscribing to the same key will re-render in sync
 * when the value changes — no useEffect needed.
 *
 * @example
 * const [theme, setTheme] = useLocalStorageStore('app-theme', 'dark')
 */
import { useSyncExternalStore, useCallback } from 'react'

const listeners = new Map<string, Set<() => void>>()

function getListeners(key: string): Set<() => void> {
  if (!listeners.has(key)) listeners.set(key, new Set())
  return listeners.get(key)!
}

function notifyListeners(key: string) {
  getListeners(key).forEach(fn => fn())
}

export function useLocalStorageStore<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const subscribe = useCallback(
    (notify: () => void) => {
      const set = getListeners(key)
      set.add(notify)

      // Also listen to storage events from other tabs
      const handler = (e: StorageEvent) => {
        if (e.key === key) notify()
      }
      window.addEventListener('storage', handler)

      return () => {
        set.delete(notify)
        window.removeEventListener('storage', handler)
      }
    },
    [key],
  )

  const getSnapshot = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return initialValue
      return JSON.parse(raw) as T
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initialValue)

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      notifyListeners(key)
    },
    [key],
  )

  return [value, setValue]
}
