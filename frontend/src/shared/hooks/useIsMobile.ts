import { useSyncExternalStore, useCallback } from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect mobile viewport
 * 
 * @example
 * const isMobile = useIsMobile()
 */
export function useIsMobile() {
  // Use syncExternalStore for media query subscription
  const isMobile = useSyncExternalStore(
    useCallback((callback) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        callback()
      }
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }, []),
    () => {
      if (typeof window === 'undefined') return false
      return window.innerWidth < MOBILE_BREAKPOINT
    },
    () => false
  )

  return isMobile
}
