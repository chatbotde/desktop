'use client'

/**
 * OverlayRegistry — URL-based overlay orchestrator.
 *
 * Heavy panels live under `#/o/{panel}+{panel}` and mount on demand.
 * Core shell overlays stay always available for Electron clickthrough UX.
 *
 * @see routes/overlayRouteIds.ts for panel IDs
 * @see routes/bridges/* for uiState / event / feature-flag → URL sync
 */

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OverlayNavigationProvider } from './routes/OverlayNavigationContext'
import { OverlayShell } from './routes/OverlayShell'

function OverlayRoutes() {
  return (
    <Routes>
      <Route
        path="/o/:panelList?"
        element={
          <OverlayNavigationProvider>
            <OverlayShell />
          </OverlayNavigationProvider>
        }
      />
      <Route path="*" element={<Navigate to="/o" replace />} />
    </Routes>
  )
}

export function OverlayRegistry() {
  return (
    <HashRouter>
      <OverlayRoutes />
    </HashRouter>
  )
}
