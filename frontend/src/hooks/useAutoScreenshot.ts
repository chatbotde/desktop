import { useEffect, useRef, useCallback } from 'react'
import { useFeature } from '@/contexts/FeatureContext'

interface UseAutoScreenshotOptions {
  /**
   * Callback when a screenshot is captured
   */
  onScreenshot?: (file: File, isAutoScreenshot: boolean) => void
}

/**
 * Hook that automatically takes a screenshot when user starts typing (only once per typing session)
 */
export function useAutoScreenshot(options: UseAutoScreenshotOptions = {}) {
  const { isFeatureEnabled } = useFeature()
  const { onScreenshot } = options
  const hasTakenScreenshotRef = useRef<boolean>(false)
  const isEnabled = isFeatureEnabled('auto-screenshot')

  const takeScreenshot = useCallback(async () => {
    if (!window.CaptureAPI) {
      console.warn('[useAutoScreenshot] CaptureAPI is not available')
      return
    }

    if (!window.CaptureAPI.quickScreenshot) {
      console.warn('[useAutoScreenshot] quickScreenshot method is not available')
      return
    }

    try {
      console.log('[useAutoScreenshot] Taking automatic screenshot on typing start...')
      const result = await window.CaptureAPI.quickScreenshot()
      
      if (result.success && result.screenshot) {
        // Convert data URL to File object
        const response = await fetch(result.screenshot.data)
        const blob = await response.blob()
        const file = new File([blob], result.screenshot.name, { type: result.screenshot.type })
        
        // Mark file as auto-screenshot by adding a custom property
        ;(file as any).__isAutoScreenshot = true
        
        console.log('[useAutoScreenshot] Screenshot captured:', file.name, file.size, 'bytes')
        hasTakenScreenshotRef.current = true
        
        // Call the callback with the file and flag
        onScreenshot?.(file, true)
      } else {
        console.error('[useAutoScreenshot] Screenshot failed:', result.error)
      }
    } catch (error) {
      console.error('[useAutoScreenshot] Error taking screenshot:', error)
    }
  }, [onScreenshot])

  // Listen for typing events in prompt input
  useEffect(() => {
    console.log('[useAutoScreenshot] Effect running, isEnabled:', isEnabled, 'hasTakenScreenshot:', hasTakenScreenshotRef.current)
    
    if (!isEnabled) {
      // Reset when disabled
      hasTakenScreenshotRef.current = false
      console.log('[useAutoScreenshot] Feature disabled, not listening for events')
      return
    }

    console.log('[useAutoScreenshot] Setting up event listener for prompt-typing-start')

    const handleTypingStart = (event: Event) => {
      const customEvent = event as CustomEvent<{ inputValue: string }>
      const inputValue = customEvent.detail?.inputValue || ''
      
      console.log('[useAutoScreenshot] Typing start event received:', {
        inputValue,
        inputLength: inputValue.length,
        hasTakenScreenshot: hasTakenScreenshotRef.current,
        isEnabled
      })
      
      // Only take screenshot if:
      // 1. User just started typing (input length is 1)
      // 2. We haven't taken a screenshot for this typing session yet
      if (inputValue.length === 1 && !hasTakenScreenshotRef.current) {
        console.log('[useAutoScreenshot] Conditions met, taking screenshot...')
        hasTakenScreenshotRef.current = true // Set immediately to prevent duplicate calls
        takeScreenshot()
      } else {
        console.log('[useAutoScreenshot] Conditions not met, skipping screenshot', {
          reason: inputValue.length !== 1 ? 'input length not 1' : 'screenshot already taken'
        })
      }
    }

    // Listen for typing events from prompt input
    window.addEventListener('prompt-typing-start', handleTypingStart as EventListener)
    console.log('[useAutoScreenshot] Event listener attached')

    return () => {
      console.log('[useAutoScreenshot] Cleaning up event listener')
      window.removeEventListener('prompt-typing-start', handleTypingStart as EventListener)
    }
  }, [isEnabled, takeScreenshot])

  // Reset screenshot flag when input is cleared/submitted
  useEffect(() => {
    if (!isEnabled) return

    const handleInputCleared = () => {
      hasTakenScreenshotRef.current = false
    }

    window.addEventListener('prompt-input-cleared', handleInputCleared)
    return () => {
      window.removeEventListener('prompt-input-cleared', handleInputCleared)
    }
  }, [isEnabled])

  return {
    isEnabled,
    takeScreenshot,
  }
}

