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
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { YoutubeVideoPlayer } from '@/components/prompt-input/youtube-video-player'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Play, Link, X } from 'lucide-react'
import { useFeature } from '@/shared/providers/FeatureProvider'
import { GLOBAL_THEME } from '@/global/theme'

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
  const { isFeatureEnabled, setFeatureEnabled } = useFeature()
  const isEnabled = isFeatureEnabled('standalone-youtube-player')
  const dragControls = useDragControls()

  const [url, setUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [showInput, setShowInput] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Stable store per mount — recreates if isEnabled changes
  const storeRef = useRef<ReturnType<typeof createHoverStore> | null>(null)
  const prevEnabled = useRef(isEnabled)
  if (!storeRef.current || prevEnabled.current !== isEnabled) {
    prevEnabled.current = isEnabled
    storeRef.current = createHoverStore(() => containerRef.current, isEnabled)
  }

  const subscribe = useCallback(
    (notify: () => void) => storeRef.current!.subscribe(notify),
    [isEnabled],
  )
  const getSnapshot = useCallback(() => storeRef.current!.getSnapshot(), [])

  // useSyncExternalStore — replaces the old useEffect + mousemove
  const isHovered = useSyncExternalStore(subscribe, getSnapshot, () => false)

  if (!isEnabled) return null

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x: 100, y: 100 }}
      className="fixed z-50 flex flex-col gap-2 pointer-events-auto"
      style={{ zIndex: GLOBAL_THEME.zIndex.modal }}
      data-no-clickthrough
    >
      <div
        ref={containerRef}
        className="p-1.5 border border-white/10 rounded-xl shadow-2xl flex flex-col gap-1.5 min-w-[320px] relative overflow-hidden backdrop-blur-md"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 0.8)), url('/youtube-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex items-center justify-between cursor-grab active:cursor-grabbing z-10 px-1"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'none' }}
            >
              <span className="text-white text-sm font-medium flex items-center gap-2">
                <Play className="w-4 h-4 text-red-500" />
                Video Player
              </span>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white" onClick={(e) => {
                  e.stopPropagation()
                  setShowInput(!showInput)
                }}>
                  <Link className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-red-400" onClick={(e) => {
                  e.stopPropagation()
                  setFeatureEnabled('standalone-youtube-player', false)
                }}>
                  <X className="w-4 h-4" />
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
              className="overflow-hidden z-10 px-1"
            >
              <div className="flex gap-2 pb-2">
                <Input
                  placeholder="Paste YouTube URL..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="h-8 bg-black/40 border-white/10 text-white text-xs flex-1 backdrop-blur-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setUrl(inputUrl); setShowInput(false) }
                  }}
                />
                <Button size="sm" className="h-8 bg-red-600/80 hover:bg-red-700 text-white backdrop-blur-sm" onClick={() => {
                  setUrl(inputUrl); setShowInput(false)
                }}>
                  Play
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {url ? (
          <div className="relative z-10">
            <YoutubeVideoPlayer url={url} className="w-full max-w-none" onRemove={() => setUrl('')} autoPlay={true} />
          </div>
        ) : (
          <div className="w-full aspect-video bg-black/20 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-[2px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-2 text-white/70 transition-all duration-300 group-hover:text-white group-hover:scale-105">
              <Play className="w-10 h-10 opacity-80 drop-shadow-xl" />
              <span className="text-xs font-light tracking-wider uppercase">Paste a link to start</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
