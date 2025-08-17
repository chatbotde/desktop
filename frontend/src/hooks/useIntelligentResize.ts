import { useEffect, useCallback } from 'react'
import { windowResizeManager } from '@/lib/window-resize'

interface UseIntelligentResizeOptions {
  enabled?: boolean
  smoothResize?: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  paddingX?: number
  paddingY?: number
}

export function useIntelligentResize(options: UseIntelligentResizeOptions = {}) {
  const {
    enabled = true,
    smoothResize = true,
    minWidth = 480, // Fixed width
    minHeight = 140,
    maxWidth = 480, // Same as minWidth for fixed width
    maxHeight = 600,
    paddingX = 15, // Minimal padding
    paddingY = 10  // Minimal padding
  } = options

  useEffect(() => {
    if (!windowResizeManager) return

    // Configure the resize manager for fixed width, dynamic height
    windowResizeManager.setContentBounds({
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      optimalWidth: minWidth, // Fixed width
      optimalHeight: Math.max(minHeight, 300)
    })

    windowResizeManager.setPadding(paddingX, paddingY)

    if (enabled) {
      windowResizeManager.enable()
    } else {
      windowResizeManager.disable()
    }

    if (smoothResize) {
      windowResizeManager.enableSmoothResize()
    } else {
      windowResizeManager.disableSmoothResize()
    }

    // Force initial resize calculation
    setTimeout(() => {
      windowResizeManager.recalculateSize()
    }, 500)

  }, [enabled, smoothResize, minWidth, minHeight, maxWidth, maxHeight, paddingX, paddingY])

  const forceResize = useCallback(() => {
    windowResizeManager?.recalculateSize()
  }, [])

  const getCurrentSize = useCallback(() => {
    return windowResizeManager?.getCurrentSize() || null
  }, [])

  const getOptimalSize = useCallback(() => {
    return windowResizeManager?.getOptimalSize() || { width: minWidth, height: minHeight }
  }, [minWidth, minHeight])

  return {
    forceResize,
    getCurrentSize,
    getOptimalSize
  }
}