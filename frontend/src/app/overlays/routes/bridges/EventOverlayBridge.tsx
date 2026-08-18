'use client'

/**
 * Opens route overlays from imperative events / stores
 * (YouTube player, recorded media) without keeping those modules mounted.
 */

import { useEffect } from 'react'
import { useSyncExternalStore } from 'react'
import {
  getYoutubePlayerSnapshot,
  subscribeYoutubePlayer,
} from '@/lib/youtube-player-store'
import { OPEN_RECORDED_VIDEO_PLAYER_EVENT } from '@/lib/events/recorded-video-player'
import { OPEN_RECORDED_IMAGE_PLAYER_EVENT } from '@/lib/events/recorded-image-player'
import { useOverlayNavigation } from '../OverlayNavigationContext'

export function EventOverlayBridge() {
  const { openOverlay } = useOverlayNavigation()

  const youtube = useSyncExternalStore(
    subscribeYoutubePlayer,
    getYoutubePlayerSnapshot,
    getYoutubePlayerSnapshot,
  )

  useEffect(() => {
    if (youtube.isOpen) openOverlay('youtube')
  }, [youtube.isOpen, openOverlay])

  useEffect(() => {
    const onVideo = () => openOverlay('recorded-video')
    const onImage = () => openOverlay('recorded-image')
    window.addEventListener(OPEN_RECORDED_VIDEO_PLAYER_EVENT, onVideo)
    window.addEventListener(OPEN_RECORDED_IMAGE_PLAYER_EVENT, onImage)
    return () => {
      window.removeEventListener(OPEN_RECORDED_VIDEO_PLAYER_EVENT, onVideo)
      window.removeEventListener(OPEN_RECORDED_IMAGE_PLAYER_EVENT, onImage)
    }
  }, [openOverlay])

  return null
}
