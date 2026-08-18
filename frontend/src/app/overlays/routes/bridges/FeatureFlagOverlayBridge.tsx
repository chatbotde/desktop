'use client'

/**
 * Mounts feature-flag-gated ambient overlays only while the flag is on.
 */

import { useEffect } from 'react'
import { useFeature } from '@/shared/providers'
import { useOverlayNavigation } from '../OverlayNavigationContext'
import type { OverlayRouteId } from '../overlayRouteIds'

function useFlagOverlay(id: OverlayRouteId, enabled: boolean) {
  const { isOpen, openOverlay, closeOverlay } = useOverlayNavigation()
  useEffect(() => {
    if (enabled && !isOpen(id)) openOverlay(id)
    else if (!enabled && isOpen(id)) closeOverlay(id)
  }, [enabled, id, isOpen, openOverlay, closeOverlay])
}

export function FeatureFlagOverlayBridge() {
  const { isFeatureEnabled } = useFeature()

  useFlagOverlay('three-scene', isFeatureEnabled('three-scene-overlay'))
  useFlagOverlay('youtube', isFeatureEnabled('standalone-youtube-player'))

  return null
}
