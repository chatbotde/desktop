'use client'

/**
 * Keeps URL overlay panels in sync with existing uiState booleans.
 * Call sites that use setShowSettings / setIsImageWindowVisible keep working;
 * the bridge opens/closes the matching route so the heavy overlay only mounts then.
 */

import { useEffect, useRef } from 'react'
import { useAppState } from '../../../context/AppContext'
import { useOverlayNavigation } from '../OverlayNavigationContext'
import type { OverlayRouteId } from '../overlayRouteIds'
import { useManimGenerationStatus } from '@/components/prompt-input/hooks/use-manim-generation-status'

function useSyncFlagToOverlay(id: OverlayRouteId, shouldBeOpen: boolean) {
  const { isOpen, openOverlay, closeOverlay } = useOverlayNavigation()
  const open = isOpen(id)
  const prev = useRef(shouldBeOpen)

  useEffect(() => {
    if (shouldBeOpen && !open) openOverlay(id)
    else if (!shouldBeOpen && open && prev.current) closeOverlay(id)
    prev.current = shouldBeOpen
  }, [shouldBeOpen, open, id, openOverlay, closeOverlay])
}

export function UiStateOverlayBridge() {
  const { uiState } = useAppState()
  const manimStatus = useManimGenerationStatus()

  const imageShouldOpen =
    uiState.isImageWindowVisible ||
    uiState.isGeneratingImages ||
    uiState.generatedImages.length > 0 ||
    uiState.imageGenerationError != null

  const videoShouldOpen =
    uiState.isVideoWindowVisible ||
    uiState.isGeneratingVideos ||
    uiState.generatedVideos.length > 0 ||
    uiState.videoGenerationError != null

  useSyncFlagToOverlay('settings', uiState.showSettings)
  useSyncFlagToOverlay('audio', uiState.showAudioRecorder || uiState.recordedAudio != null)
  useSyncFlagToOverlay('video-scroll', uiState.showVideoScroll)
  useSyncFlagToOverlay('area-screenshot', uiState.showAreaScreenshot)
  useSyncFlagToOverlay('rectangle-screenshot', uiState.showRectangleScreenshot)
  useSyncFlagToOverlay('explanation', Boolean(uiState.explanation))
  useSyncFlagToOverlay('fact-check', uiState.isFactCheckWindowVisible)
  useSyncFlagToOverlay('image', imageShouldOpen)
  useSyncFlagToOverlay('video', videoShouldOpen)
  useSyncFlagToOverlay('manim', manimStatus.phase !== 'idle')

  // Open settings without requiring SettingsOverlay to already be mounted
  useEffect(() => {
    const onOpenSettings = () => uiState.setShowSettings(true)
    window.addEventListener('buddy:open-settings', onOpenSettings)
    return () => window.removeEventListener('buddy:open-settings', onOpenSettings)
    // setShowSettings is stable enough; avoid rebinding on every uiState identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState.setShowSettings])

  // One-shot hydrate: `#/o/settings` on boot opens settings once.
  // Do not keep syncing URL → state (that fights close).
  const { isOpen } = useOverlayNavigation()
  const hydratedSettings = useRef(false)
  useEffect(() => {
    if (hydratedSettings.current) return
    hydratedSettings.current = true
    if (isOpen('settings')) uiState.setShowSettings(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
