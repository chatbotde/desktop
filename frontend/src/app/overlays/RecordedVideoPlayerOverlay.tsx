'use client'

/**
 * @overlay RecordedVideoPlayerOverlay
 * @description Floating player for recorded / uploaded prompt videos.
 */

import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import {
  OPEN_RECORDED_VIDEO_PLAYER_EVENT,
  type OpenRecordedVideoPlayerDetail,
} from '@/lib/events/recorded-video-player'
import { GLOBAL_THEME } from '@/global/theme'
import { useDraggable, useResizable } from '@/features/output-window'
import type { ResizeDirection } from '@/features/output-window'
import { cn } from '@/lib/utils'

const PLAYER_Z = GLOBAL_THEME.zIndex.modal

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

const DEFAULT_SIZE = { width: 420, height: 236 }

function defaultPosition(width: number) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024
  const h = typeof window !== 'undefined' ? window.innerHeight : 768
  return {
    x: Math.max(16, (w - width) / 2),
    y: Math.max(16, h * 0.22),
  }
}

function resetViewerLayout(
  setPosition: (value: { x: number; y: number }) => void,
  setSize: (value: { width: number; height: number }) => void,
) {
  setSize(DEFAULT_SIZE)
  setPosition(defaultPosition(DEFAULT_SIZE.width))
}

export function RecordedVideoPlayerOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const videoSrcRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState(() => defaultPosition(DEFAULT_SIZE.width))
  const [size, setSize] = useState(DEFAULT_SIZE)

  const clearVideo = useCallback(() => {
    if (videoSrcRef.current) {
      URL.revokeObjectURL(videoSrcRef.current)
      videoSrcRef.current = null
    }
    setVideoSrc(null)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    clearVideo()
    resetViewerLayout(setPosition, setSize)
  }, [clearVideo])

  useSyncExternalStore(
    useCallback(
      (_notify) => {
        const handler = (event: Event) => {
          const custom = event as CustomEvent<OpenRecordedVideoPlayerDetail>
          const file = custom.detail?.file
          if (!file || !file.type.startsWith('video/')) return

          clearVideo()
          const src = URL.createObjectURL(file)
          videoSrcRef.current = src
          setVideoSrc(src)
          resetViewerLayout(setPosition, setSize)
          setIsOpen(true)
        }
        window.addEventListener(OPEN_RECORDED_VIDEO_PLAYER_EVENT, handler as EventListener)
        return () =>
          window.removeEventListener(OPEN_RECORDED_VIDEO_PLAYER_EVENT, handler as EventListener)
      },
      [clearVideo],
    ),
    () => null,
    () => null,
  )

  useSyncExternalStore(
    useCallback(
      (_notify) => {
        if (!isOpen) return () => {}
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') handleClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      },
      [isOpen, handleClose],
    ),
    () => null,
    () => null,
  )

  const { handleDragMouseDown, isDragging } = useDraggable(setPosition, containerRef)
  const { handleResizeMouseDown, isResizing } = useResizable(size, setSize, position, setPosition)

  const storeRef = useRef<ReturnType<typeof createHoverStore> | null>(null)
  const prevOpen = useRef(isOpen)
  if (!storeRef.current || prevOpen.current !== isOpen) {
    prevOpen.current = isOpen
    storeRef.current = createHoverStore(() => containerRef.current, isOpen)
  }

  const subscribe = useCallback(
    (notify: () => void) => storeRef.current!.subscribe(notify),
    [isOpen],
  )
  const getSnapshot = useCallback(() => storeRef.current!.getSnapshot(), [])
  const isHovered = useSyncExternalStore(subscribe, getSnapshot, () => false)

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: PLAYER_Z }}
      aria-hidden={!isOpen}
    >
      {isOpen && videoSrc && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-auto flex flex-col"
          style={{
            position: 'fixed',
            zIndex: PLAYER_Z,
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
                  'absolute z-30 bg-transparent',
                  direction === 'n' && 'top-0 left-0 right-10 h-1.5 cursor-ns-resize',
                  direction === 's' && 'bottom-0 left-0 right-0 h-1.5 cursor-ns-resize',
                  direction === 'e' && 'top-0 right-0 bottom-0 w-1.5 cursor-ew-resize',
                  direction === 'w' && 'top-0 left-0 bottom-0 w-1.5 cursor-ew-resize',
                  direction === 'ne' && 'top-0 right-10 h-3 w-3 cursor-nesw-resize',
                  direction === 'nw' && 'top-0 left-0 h-3 w-3 cursor-nwse-resize',
                  direction === 'se' && 'bottom-0 right-0 h-3 w-3 cursor-nesw-resize',
                  direction === 'sw' && 'bottom-0 left-0 h-3 w-3 cursor-nwse-resize',
                )}
                onMouseDown={(e) => handleResizeMouseDown(e, direction)}
              />
            ))}

            {(isDragging || isResizing) && (
              <div className="absolute inset-0 z-40 cursor-grabbing bg-transparent" />
            )}

            {isHovered && (
              <div
                className="absolute top-0 left-0 right-10 z-20 h-8 cursor-grab bg-gradient-to-b from-black/50 to-transparent active:cursor-grabbing"
                onMouseDown={handleDragMouseDown}
                style={{ touchAction: 'none' }}
                aria-hidden
              />
            )}

            <button
              type="button"
              className="absolute top-2 right-2 z-[60] flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-red-500/90 hover:text-white"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              title="Close"
              aria-label="Close video"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-0 flex h-full w-full flex-1 flex-col bg-black">
              <video
                src={videoSrc}
                className="h-full w-full object-contain"
                controls
                controlsList="nodownload"
                autoPlay
                playsInline
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
