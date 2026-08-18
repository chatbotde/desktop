'use client'

import { Suspense } from 'react'
import { OverlayErrorBoundary } from '../OverlayErrorBoundary'
import { useOverlayNavigation } from './OverlayNavigationContext'
import { OVERLAY_ROUTE_LOADERS } from './overlayRouteMap'

/**
 * Mounts only overlays listed in the current URL (`#/o/settings+image`).
 * Each overlay is code-split, suspended, and isolated behind an error boundary.
 */
export function OverlayRouteOutlet() {
  const { activeIds } = useOverlayNavigation()

  return (
    <>
      {activeIds.map((id) => {
        const Overlay = OVERLAY_ROUTE_LOADERS[id]
        return (
          <OverlayErrorBoundary key={id} overlayId={id}>
            <Suspense fallback={null}>
              <Overlay />
            </Suspense>
          </OverlayErrorBoundary>
        )
      })}
    </>
  )
}
