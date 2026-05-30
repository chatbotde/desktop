'use client'

/**
 * @overlay YoutubePlayerOverlay
 * @feature standalone-youtube-player
 * @description Draggable floating YouTube video player. Hover detection for
 *   click-through lock is handled via useSyncExternalStore — zero useEffect.
 * @featureFlag standalone-youtube-player
 * @placement fixed, draggable
 */

import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { YoutubeVideoPlayer } from '@/components/prompt-input/youtube-video-player'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Play, Link, X, Tv } from 'lucide-react'
import { useFeature } from '@/shared/providers/FeatureProvider'
import { GLOBAL_THEME } from '@/global/theme'
import { useDraggable, useResizable } from '@/features/output-window'
import type { ResizeDirection } from '@/features/output-window'
import { cn } from '@/lib/utils'

const YOUTUBE_PLAYER_Z = GLOBAL_THEME.zIndex.modal

// ── Hover store: tracks whether mouse is inside containerRef ─────────────────
// Replaces useEffect + mousemove listener.

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
      if (inside) {
        document.documentElement.setAttribute('data-lock-clickthrough', 'true')
      } else {
        document.documentElement.removeAttribute('data-lock-clickthrough')
      }
      listeners.forEach(fn => fn())
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
        document.documentElement.removeAttribute('data-lock-clickthrough')
      }
    },
    getSnapshot: () => isHovered,
  }
}

export function YoutubePlayerOverlay() {
  const { isFeatureEnabled } = useFeature()
  const isFeatureOn = isFeatureEnabled('standalone-youtube-player')

  const [isOpen, setIsOpen] = useState(true)
  const [url, setUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [showInput, setShowInput] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Re-open when the feature is toggled back on in Settings
  const prevFeatureOn = useRef(isFeatureOn)
  if (prevFeatureOn.current !== isFeatureOn) {
    prevFeatureOn.current = isFeatureOn
    if (isFeatureOn) setIsOpen(true)
  }

  const showPlayer = isFeatureOn && isOpen

  // Allow other parts of the app (e.g. prompt paste) to open the floating player
  useSyncExternalStore(
    useCallback((_notify) => {
      const handler = (event: Event) => {
        const custom = event as CustomEvent<{ url?: string }>
        const nextUrl = custom.detail?.url?.trim()
        if (nextUrl) {
          setUrl(nextUrl)
          setInputUrl(nextUrl)
        }
        setIsOpen(true)
      }
      window.addEventListener('open-youtube-player', handler as EventListener)
      return () => window.removeEventListener('open-youtube-player', handler as EventListener)
    }, []),
    () => null,
    () => null,
  )

  // Floating window position and size state
  const [position, setPosition] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024
    return { x: w - 590, y: 80 } // elegant starting top-right position
  })
  const [size, setSize] = useState({ width: 560, height: 315 })

  // Custom dragging and resizing hooks to prevent iframe mouse event loss
  const { handleDragMouseDown, isDragging } = useDraggable(setPosition, containerRef)
  const { handleResizeMouseDown, isResizing } = useResizable(size, setSize, position, setPosition)

  const handleResetSize = () => {
    setSize({ width: 560, height: 315 })
  }

  // Stable store per mount — recreates if isEnabled changes
  const storeRef = useRef<ReturnType<typeof createHoverStore> | null>(null)
  const prevEnabled = useRef(showPlayer)
  if (!storeRef.current || prevEnabled.current !== showPlayer) {
    prevEnabled.current = showPlayer
    storeRef.current = createHoverStore(() => containerRef.current, showPlayer)
  }

  const subscribe = useCallback(
    (notify: () => void) => storeRef.current!.subscribe(notify),
    [showPlayer],
  )
  const getSnapshot = useCallback(() => storeRef.current!.getSnapshot(), [])

  // useSyncExternalStore — replaces the old useEffect + mousemove
  const isHovered = useSyncExternalStore(subscribe, getSnapshot, () => false)

  // Always render a fixed shell — returning null here collapses the Electron overlay window.
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
          exit={{ opacity: 0, scale: 0.95 }}
          className="pointer-events-auto flex flex-col"
          style={{
            position: 'fixed',
            zIndex: YOUTUBE_PLAYER_Z,
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
          }}
          data-no-clickthrough
        >
      <div
        className="relative w-full h-full flex flex-col bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
        }}
      >
        {/* Resize Handles */}
        {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as ResizeDirection[]).map((direction) => (
          <div
            key={direction}
            className={cn(
              "absolute z-50 bg-transparent",
              direction === 'n' && "top-0 left-0 right-0 h-1.5 cursor-ns-resize",
              direction === 's' && "bottom-0 left-0 right-0 h-1.5 cursor-ns-resize",
              direction === 'e' && "top-0 right-0 bottom-0 w-1.5 cursor-ew-resize",
              direction === 'w' && "top-0 left-0 bottom-0 w-1.5 cursor-ew-resize",
              direction === 'ne' && "top-0 right-0 w-3 h-3 cursor-nesw-resize",
              direction === 'nw' && "top-0 left-0 w-3 h-3 cursor-nwse-resize",
              direction === 'se' && "bottom-0 right-0 w-3 h-3 cursor-nwse-resize",
              direction === 'sw' && "bottom-0 left-0 w-3 h-3 cursor-nesw-resize"
            )}
            onMouseDown={(e) => handleResizeMouseDown(e, direction)}
          />
        ))}

        {/* Safety overlay to capture dragging/resizing events when hovering over iframe */}
        {(isDragging || isResizing) && (
          <div className="absolute inset-0 z-40 bg-transparent cursor-grabbing" />
        )}

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 cursor-grab active:cursor-grabbing bg-gradient-to-b from-black/80 via-black/40 to-transparent select-none"
              onMouseDown={handleDragMouseDown}
              style={{ touchAction: 'none' }}
            >
              <span className="text-white/90 text-xs font-semibold flex items-center gap-1.5 ml-1">
                <Play className="w-3.5 h-3.5 text-red-500" />
                Player
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowInput(!showInput)
                  }}
                  title="Paste Link"
                >
                  <Link className="w-3.5 h-3.5" />
                </Button>

                {/* Default Size Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResetSize()
                  }}
                  title="Default Size"
                >
                  <Tv className="w-3.5 h-3.5" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="z-10 px-2 pt-10 pb-2 w-full absolute top-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-white/10"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Paste YouTube URL..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="h-8 bg-white/5 border-white/10 text-white text-xs flex-1 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setUrl(inputUrl); setShowInput(false) }
                  }}
                  autoFocus
                />
                <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium px-3 transition-colors" onClick={() => {
                  setUrl(inputUrl); setShowInput(false)
                }}>
                  Play
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 w-full h-full relative z-0 flex flex-col">
          {url ? (
            <YoutubeVideoPlayer url={url} className="w-full h-full max-w-none rounded-none border-0 aspect-auto" onRemove={() => setUrl('')} autoPlay={true} />
          ) : (
            <div className="flex-1 w-full h-full flex items-center justify-center bg-zinc-950">
              <div className="flex flex-col items-center gap-3 text-zinc-500 transition-all duration-500 hover:text-zinc-300 hover:scale-105">
                <div className="p-4 bg-white/5 rounded-full shadow-inner border border-white/5">
                  <Play className="w-6 h-6 opacity-80 pl-0.5" />
                </div>
                <span className="text-[10px] font-medium tracking-widest uppercase opacity-80">Paste Link to Start</span>
              </div>
            </div>
          )}
        </div>
      </div>
        </motion.div>
      )}
    </div>
  )
}
