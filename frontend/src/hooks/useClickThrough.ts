import { useState, useEffect, useCallback, useRef } from 'react'

export interface ClickThroughState {
  enabled: boolean
  isAvailable: boolean
}

export interface ClickThroughControls {
  enable: () => void
  disable: () => void
  toggle: () => void
  enabled: boolean
  isAvailable: boolean
}

/**
 * React hook for controlling click-through mode from the frontend
 * 
 * This hook works in ANY scenario:
 * - ✅ Direct access (no iframes) - uses chatInputAPI directly
 * - ✅ In iframes - uses postMessage to parent
 * - ✅ Works with any container structure
 * - ✅ Works even when there are NO iframes at all
 * - ✅ Automatically detects the best method (direct API or postMessage)
 * 
 * @example
 * ```tsx
 * const { enable, disable, toggle, enabled } = useClickThrough()
 * 
 * return (
 *   <button onClick={toggle}>
 *     {enabled ? 'Disable' : 'Enable'} Click-Through
 *   </button>
 * )
 * ```
 */
export function useClickThrough(): ClickThroughControls {
  const [state, setState] = useState<ClickThroughState>({
    enabled: false,
    isAvailable: false
  })

  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null)

  // Check if we're in an iframe
  const isInIframe = typeof window !== 'undefined' && window.parent !== window
  const parentAvailable = isInIframe && window.parent

  // Check if chatInputAPI is directly available (no iframe needed)
  const chatInputAPI = typeof window !== 'undefined' ? (window as any).chatInputAPI : null
  const hasDirectAPI = chatInputAPI && chatInputAPI.enableClickThrough && chatInputAPI.disableClickThrough

  // Send message to parent window (for iframe mode)
  const sendToParent = useCallback((action: string, data?: any) => {
    if (!parentAvailable) {
      console.warn('[useClickThrough] Parent window not available')
      return
    }

    try {
      window.parent.postMessage(
        {
          type: 'clickthrough-control',
          action,
          data
        },
        '*'
      )
    } catch (error) {
      console.error('[useClickThrough] Error sending message to parent:', error)
    }
  }, [parentAvailable])

  // Use direct API (for non-iframe mode)
  const useDirectAPI = useCallback((action: 'enable' | 'disable' | 'toggle') => {
    if (!hasDirectAPI) return

    try {
      switch (action) {
        case 'enable':
          chatInputAPI.enableClickThrough()
          setState(prev => ({ ...prev, enabled: true, isAvailable: true }))
          break
        case 'disable':
          chatInputAPI.disableClickThrough()
          setState(prev => ({ ...prev, enabled: false, isAvailable: true }))
          break
        case 'toggle':
          chatInputAPI.toggleClickThrough()
          // We'll update state based on the current state
          setState(prev => ({ ...prev, enabled: !prev.enabled, isAvailable: true }))
          break
      }
    } catch (error) {
      console.error('[useClickThrough] Error using direct API:', error)
    }
  }, [hasDirectAPI, chatInputAPI])

  // Listen for state updates
  useEffect(() => {
    // If direct API is available (not in iframe), use it
    if (hasDirectAPI) {
      setState(prev => ({ ...prev, isAvailable: true }))
      
      // Listen for clickthrough-changed events from the window
      const handleClickThroughChange = (event: CustomEvent) => {
        if (event.detail && typeof event.detail.enabled === 'boolean') {
          setState(prev => ({ ...prev, enabled: event.detail.enabled }))
        }
      }
      
      document.addEventListener('clickthrough-changed', handleClickThroughChange as EventListener)
      
      return () => {
        document.removeEventListener('clickthrough-changed', handleClickThroughChange as EventListener)
      }
    }
    
    // If in iframe, use postMessage
    if (isInIframe && parentAvailable) {
      messageHandlerRef.current = (event: MessageEvent) => {
        // Only handle messages from parent
        if (event.source !== window.parent) return

        const data = event.data
        if (data && data.type === 'clickthrough-state') {
          setState({
            enabled: data.enabled ?? false,
            isAvailable: true
          })
        }
      }

      window.addEventListener('message', messageHandlerRef.current)

      // Request initial state
      sendToParent('get-state')

      return () => {
        if (messageHandlerRef.current) {
          window.removeEventListener('message', messageHandlerRef.current)
        }
      }
    }
  }, [isInIframe, parentAvailable, hasDirectAPI, sendToParent])

  const enable = useCallback(() => {
    if (hasDirectAPI) {
      useDirectAPI('enable')
    } else if (parentAvailable) {
      sendToParent('enable')
      setState(prev => ({ ...prev, enabled: true }))
    }
  }, [hasDirectAPI, useDirectAPI, parentAvailable, sendToParent])

  const disable = useCallback(() => {
    if (hasDirectAPI) {
      useDirectAPI('disable')
    } else if (parentAvailable) {
      sendToParent('disable')
      setState(prev => ({ ...prev, enabled: false }))
    }
  }, [hasDirectAPI, useDirectAPI, parentAvailable, sendToParent])

  const toggle = useCallback(() => {
    if (hasDirectAPI) {
      useDirectAPI('toggle')
    } else if (parentAvailable) {
      sendToParent('toggle')
      setState(prev => ({ ...prev, enabled: !prev.enabled }))
    }
  }, [hasDirectAPI, useDirectAPI, parentAvailable, sendToParent])

  return {
    enable,
    disable,
    toggle,
    enabled: state.enabled,
    isAvailable: state.isAvailable || hasDirectAPI || parentAvailable !== null
  }
}

