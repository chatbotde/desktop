'use client'

/**
 * @overlay YoutubePlayerOverlay
 * @feature standalone-youtube-player
 * @description Draggable floating YouTube video player. Visibility is driven
 *   directly by the `standalone-youtube-player` feature flag so enabling it in
 *   Settings always shows the player. The X button hides it until re-enabled.
 * @featureFlag standalone-youtube-player
 * @placement fixed, draggable
 */

import { useState, useRef, useCallback, useSyncExternalStore, useEffect } from 'react'
import { motion } from 'framer-motion'
import { YoutubeVideoPlayer } from '@/components/prompt-input/youtube-video-player'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Play, Link, X, Tv } from 'lucide-react'
import { useFeature } from '@/shared/providers/FeatureProvider'
import { GLOBAL_THEME } from '@/global/theme'
import { useDraggable, useResizable } from '@/features/output-window'
import type { ResizeDirection } from '@/features/output-window'
import { cn } from '@/lib/utils'
import {
  subscribeYoutubePlayer,
  getYoutubePlayerSnapshot,
} from '@/lib/youtube-player-store'
  
const YOUTUBE_PLAYER_Z = GLOBAL_THEME.zIndex.modal

function defaultPosition(width: number) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024
  const h = typeof window !== 'undefined' ? window.innerHeight : 768
  return {
    x: Math.max(16, w - width - 24),
    y: Math.max(16, Math.round(h * 0.08)),
  }
}

function createHoverStore(getContainer: () => HTMLElement | null, enabled: boolean) {
  let isHovered = false
  const listeners = new Set<() => void>()

  const handler = (e: MouseEvent) => {
    const el = getContainer()
    if (!el) return
    const rect = el.getBoundingClientRect()
    const inside =
      e.clientX >= rect.left - 5 &&
      e.clientX <= rect.right + 5 &&
      e.clientY >= rect.top - 5 &&
      e.clientY <= rect.bottom + 5

    if (inside !== isHovered) {
      isHovered = inside
      listeners.forEach((fn) => fn())
    }
  }

  return {
    subscribe(notify: () => void) {
      if (!enabled) return () => {}
      listeners.add(notify)
      window.addEventListener('mousemove', handler)
      return () => {
        listeners.delete(notify)
        window.removeEventListener('mousemove', handler)
      }
    },
    getSnapshot: () => isHovered,
  }
}

export function YoutubePlayerOverlay() {
  const { isFeatureEnabled, setFeatureEnabled } = useFeature()
  const isFeatureOn = isFeatureEnabled('standalone-youtube-player')

  // External "open with url" requests (paste / prompt chips)
  const player = useSyncExternalStore(
    subscribeYoutubePlayer,
    getYoutubePlayerSnapshot,
    () => ({ isOpen: false, url: '' }),
  )

  const [closed, setClosed] = useState(false)
  const [url, setUrl] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [inputUrl, setInputUrl] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Re-show whenever the feature flag flips back on.
  const prevFeatureOn = useRef(isFeatureOn)
  useEffect(() => {
    if (prevFeatureOn.current === isFeatureOn) return
    prevFeatureOn.current = isFeatureOn
    if (isFeatureOn) setClosed(false)
  }, [isFeatureOn])

  // React to external open requests (paste a YouTube link, click a chip).
  const prevStore = useRef(player)
  useEffect(() => {
    if (prevStore.current === player) return
    prevStore.current = player
    if (player.isOpen) {
      setClosed(false)
      // Make sure the player is visible even if the flag was previously off.
      if (!isFeatureOn) setFeatureEnabled('standalone-youtube-player', true)
      if (player.url) {
        setUrl(player.url)
        setInputUrl(player.url)
      }
    }
  }, [player, isFeatureOn, setFeatureEnabled])

  const showPlayer = isFeatureOn && !closed

  const [position, setPosition] = useState(() => defaultPosition(560))
  const [size, setSize] = useState({ width: 560, height: 315 })

  const { handleDragMouseDown, isDragging } = useDraggable(setPosition, containerRef)
  const { handleResizeMouseDown, isResizing } = useResizable(size, setSize, position, setPosition)

  const handleResetSize = () => {
    setSize({ width: 560, height: 315 })
    setPosition(defaultPosition(560))
  }

  const handleClose = useCallback(() => {
    setClosed(true)
    setShowInput(false)
  }, [])

  const handlePlayUrl = useCallback((next: string) => {
    setUrl(next)
    setShowInput(false)
  }, [])

  // Hover store for the drag handle (recreated when visibility changes)
  const storeRef = useRef<ReturnType<typeof createHoverStore> | null>(null)
  const prevShow = useRef(showPlayer)
  if (!storeRef.current || prevShow.current !== showPlayer) {
    prevShow.current = showPlayer
    storeRef.current = createHoverStore(() => containerRef.current, showPlayer)
  }
  const subscribe = useCallback(
    (notify: () => void) => storeRef.current!.subscribe(notify),
    [showPlayer],
  )
  const getSnapshot = useCallback(() => storeRef.current!.getSnapshot(), [])
  const isHovered = useSyncExternalStore(subscribe, getSnapshot, () => false)

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: YOUTUBE_PLAYER_Z }}
      aria-hidden={!showPlayer}
    >
      {showPlayer && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-auto flex flex-col"
          style={{
            position: 'fixed',
            zIndex: YOUTUBE_PLAYER_Z,
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
          }}
        >
          <div
            className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-2xl"
            style={{
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
            }}
          >
            {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as ResizeDirection[]).map((direction) => (
              <div
                key={direction}
                className={cn(
                  'absolute z-50 bg-transparent',
                  direction === 'n' && 'top-0 left-0 right-0 h-1.5 cursor-ns-resize',
                  direction === 's' && 'bottom-0 left-0 right-0 h-1.5 cursor-ns-resize',
                  direction === 'e' && 'top-0 right-0 bottom-0 w-1.5 cursor-ew-resize',
                  direction === 'w' && 'top-0 left-0 bottom-0 w-1.5 cursor-ew-resize',
                  direction === 'ne' && 'top-0 right-0 h-3 w-3 cursor-nesw-resize',
                  direction === 'nw' && 'top-0 left-0 h-3 w-3 cursor-nwse-resize',
                  direction === 'se' && 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize',
                  direction === 'sw' && 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize',
                )}
                onMouseDown={(e) => handleResizeMouseDown(e, direction)}
              />
            ))}

            {(isDragging || isResizing) && (
              <div className="absolute inset-0 z-40 cursor-grabbing bg-transparent" />
            )}

            <button
              type="button"
              className="absolute top-2 right-2 z-[60] flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-red-500/90"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              title="Close"
              aria-label="Close player"
            >
              <X className="h-4 w-4" />
            </button>

            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 left-0 right-10 z-20 flex cursor-grab items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-2 select-none active:cursor-grabbing"
                onMouseDown={handleDragMouseDown}
                style={{ touchAction: 'none' }}
              >
                <span className="ml-1 flex items-center gap-1.5 text-xs font-semibold text-white/90">
                  <Play className="h-3.5 w-3.5 text-red-500" />
                  Player
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-blue-500/90"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowInput(!showInput)
                      setInputUrl(url)
                    }}
                    title="Paste Link"
                    aria-label="Paste link"
                  >
                    <Link className="h-4 w-4" />
                  </button>
             
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResetSize()
                    }}
                    title="Default Size"
                  >
                    <Tv className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {showInput && (
              <div className="absolute top-0 left-0 right-0 z-10 border-b border-white/10 bg-black/90 px-2 pb-2 pt-10 backdrop-blur-xl">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste YouTube URL..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="h-8 flex-1 rounded-lg border-white/10 bg-white/5 text-xs text-white focus-visible:ring-1 focus-visible:ring-white/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePlayUrl(inputUrl)
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700"
                    onClick={() => handlePlayUrl(inputUrl)}
                  >
                    Play
                  </Button>
                </div>
              </div>
            )}

            <div className="relative z-0 flex h-full w-full flex-1 flex-col">
              {url ? (
                <YoutubeVideoPlayer
                  url={url}
                  className="aspect-auto h-full w-full max-w-none rounded-none border-0"
                  onRemove={() => setUrl('')}
                  autoPlay
                />
              ) : (
                <div className="flex h-full w-full flex-1 items-center justify-center bg-zinc-950">
                  <button
                    type="button"
                    className="flex flex-col items-center gap-3 text-zinc-500 transition-all duration-500 hover:scale-105 hover:text-zinc-300"
                    onClick={() => {
                      setShowInput(true)
                      setInputUrl('')
                    }}
                  >
                    <div className="rounded-full border border-white/5 bg-white/5 p-4 shadow-inner">
                      <Play className="h-6 w-6 pl-0.5 opacity-80" />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">
                      Paste Link to Start
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
