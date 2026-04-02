import { useState, useSyncExternalStore, useCallback } from 'react'

/**
 * Hook to monitor network connection status
 * 
 * @example
 * const { isOnline, checkConnection } = useNetworkStatus()
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine
    }
    return true
  })

  const checkConnection = useCallback(async () => {
    if (typeof navigator === 'undefined') {
      return true
    }

    // Quick check using navigator.onLine - immediate response
    if (!navigator.onLine) {
      setIsOnline(false)
      return false
    }

    try {
      // Faster check with shorter timeout - use AbortController for quick timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout instead of default

      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      setIsOnline(true)
      return true
    } catch (e) {
      // If fetch fails, we might be offline or have network issues
      setIsOnline(false)
      return false
    }
  }, [])

  useSyncExternalStore(
    useCallback((callback) => {
      const handleOnline = () => {
        setIsOnline(true)
        checkConnection()
      }

      const handleOffline = () => {
        setIsOnline(false)
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false)
      } else {
        checkConnection()
      }

      const checkInterval = setInterval(() => {
        checkConnection()
      }, 5000)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        clearInterval(checkInterval)
      }
    }, [checkConnection]),
    () => null,
    () => null
  )

  return { isOnline, checkConnection }
}
