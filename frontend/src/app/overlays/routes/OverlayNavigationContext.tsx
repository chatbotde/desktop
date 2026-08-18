'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  overlayPath,
  parseOverlayPanelList,
  type OverlayRouteId,
} from './overlayRouteIds'

type OverlayNavigationValue = {
  activeIds: OverlayRouteId[]
  isOpen: (id: OverlayRouteId) => boolean
  openOverlay: (id: OverlayRouteId) => void
  closeOverlay: (id: OverlayRouteId) => void
  toggleOverlay: (id: OverlayRouteId) => void
  setOverlays: (ids: OverlayRouteId[]) => void
}

const OverlayNavigationContext = createContext<OverlayNavigationValue | null>(null)

export function OverlayNavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { panelList } = useParams<{ panelList?: string }>()
  const activeIds = useMemo(() => parseOverlayPanelList(panelList), [panelList])

  const setOverlays = useCallback(
    (ids: OverlayRouteId[]) => {
      navigate(overlayPath(ids), { replace: true })
    },
    [navigate],
  )

  const openOverlay = useCallback(
    (id: OverlayRouteId) => {
      if (activeIds.includes(id)) return
      setOverlays([...activeIds, id])
    },
    [activeIds, setOverlays],
  )

  const closeOverlay = useCallback(
    (id: OverlayRouteId) => {
      if (!activeIds.includes(id)) return
      setOverlays(activeIds.filter((x) => x !== id))
    },
    [activeIds, setOverlays],
  )

  const toggleOverlay = useCallback(
    (id: OverlayRouteId) => {
      if (activeIds.includes(id)) closeOverlay(id)
      else openOverlay(id)
    },
    [activeIds, closeOverlay, openOverlay],
  )

  const isOpen = useCallback((id: OverlayRouteId) => activeIds.includes(id), [activeIds])

  const value = useMemo(
    () => ({
      activeIds,
      isOpen,
      openOverlay,
      closeOverlay,
      toggleOverlay,
      setOverlays,
    }),
    [activeIds, isOpen, openOverlay, closeOverlay, toggleOverlay, setOverlays],
  )

  return (
    <OverlayNavigationContext.Provider value={value}>
      {children}
    </OverlayNavigationContext.Provider>
  )
}

export function useOverlayNavigation(): OverlayNavigationValue {
  const ctx = useContext(OverlayNavigationContext)
  if (!ctx) {
    throw new Error('useOverlayNavigation must be used within OverlayNavigationProvider')
  }
  return ctx
}
