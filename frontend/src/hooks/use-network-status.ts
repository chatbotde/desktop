import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to monitor network connection status
 * Similar to chat-input window's NetworkManager
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

  useEffect(() => {
    // Listen to browser online/offline events - immediate response
    const handleOnline = () => {
      setIsOnline(true)
      // Verify with actual connection check in background
      checkConnection()
    }

    const handleOffline = () => {
      // Immediate offline detection - no delay
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Immediate initial check - prioritize navigator.onLine for speed
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false)
    } else {
      // Only do fetch check if navigator says we're online
      checkConnection()
    }

    // Faster periodic check (every 5 seconds for quicker detection)
    const checkInterval = setInterval(() => {
      checkConnection()
    }, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(checkInterval)
    }
  }, [checkConnection])

  return { isOnline, checkConnection }
}
