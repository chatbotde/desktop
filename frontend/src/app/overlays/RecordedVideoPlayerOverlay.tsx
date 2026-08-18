'use client'

/**
 * @overlay RecordedVideoPlayerOverlay
 * @description Floating player for recorded / uploaded prompt videos.
 * Short clips (< 14s) can also be downloaded as GIF via ffmpeg.
 */

import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { X, Download, ImagePlay, Loader2 } from 'lucide-react'
import {
  OPEN_RECORDED_VIDEO_PLAYER_EVENT,
  type OpenRecordedVideoPlayerDetail,
} from '@/lib/events/recorded-video-player'
import { GLOBAL_THEME } from '@/global/theme'
import { useDraggable, useResizable } from '@/features/output-window'
import type { ResizeDirection } from '@/features/output-window'
import { cn } from '@/lib/utils'

const PLAYER_Z = GLOBAL_THEME.zIndex.modal
const MAX_GIF_DURATION_SECONDS = 14

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

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export function RecordedVideoPlayerOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('video.mp4')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null)
  const [gifExporting, setGifExporting] = useState(false)
  const [gifError, setGifError] = useState<string | null>(null)
  const videoSrcRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [position, setPosition] = useState(() => defaultPosition(DEFAULT_SIZE.width))
  const [size, setSize] = useState(DEFAULT_SIZE)

  const clearVideo = useCallback(() => {
    if (videoSrcRef.current) {
      URL.revokeObjectURL(videoSrcRef.current)
      videoSrcRef.current = null
    }
    setVideoSrc(null)
    setVideoFile(null)
    setDurationSeconds(null)
    setGifError(null)
    setGifExporting(false)
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
          setVideoFile(file)
          setDownloadName(custom.detail?.name ?? file.name)
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

  const canDownloadGif =
    durationSeconds != null &&
    durationSeconds > 0 &&
    durationSeconds <= MAX_GIF_DURATION_SECONDS &&
    Boolean(window.mediaAPI?.convertVideoToGif)

  const handleSave = useCallback(() => {
    if (!videoSrc) return
    const link = document.createElement('a')
    link.href = videoSrc
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [videoSrc, downloadName])

  const handleSaveGif = useCallback(async () => {
    if (!videoFile || !canDownloadGif || gifExporting) return
    const api = window.mediaAPI
    if (!api?.convertVideoToGif) {
      setGifError('GIF export is unavailable in this build.')
      return
    }

    setGifExporting(true)
    setGifError(null)
    try {
      const support = await api.checkGifSupport?.()
      if (support && !support.ffmpeg) {
        throw new Error('ffmpeg not found. Install ffmpeg on PATH to export GIFs.')
      }

      const buffer = await videoFile.arrayBuffer()
      const result = await api.convertVideoToGif({
        videoBase64: arrayBufferToBase64(buffer),
        mimeType: videoFile.type,
        fileName: downloadName,
        durationSeconds: durationSeconds ?? 0,
      })

      if (!result.success || !result.gifBase64) {
        throw new Error(result.error || 'GIF conversion failed.')
      }

      const binary = atob(result.gifBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
      downloadBlob(new Blob([bytes], { type: 'image/gif' }), result.fileName || 'recording.gif')
    } catch (error) {
      setGifError(error instanceof Error ? error.message : 'GIF export failed')
    } finally {
      setGifExporting(false)
    }
  }, [videoFile, canDownloadGif, gifExporting, downloadName, durationSeconds])

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

            {canDownloadGif && (
              <button
                type="button"
                className="absolute top-2 right-[4.75rem] z-[60] flex h-7 items-center gap-1 rounded-full bg-black/70 px-2 text-[11px] font-medium text-white shadow-md transition-colors hover:bg-emerald-500/90 disabled:opacity-60"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleSaveGif()
                }}
                disabled={gifExporting}
                title={`Download GIF (≤ ${MAX_GIF_DURATION_SECONDS}s)`}
                aria-label="Download GIF"
              >
                {gifExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlay className="h-3.5 w-3.5" />
                )}
                GIF
              </button>
            )}

            <button
              type="button"
              className="absolute top-2 right-10 z-[60] flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-blue-500/90"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
              title="Save video"
              aria-label="Save video"
            >
              <Download className="h-4 w-4" />
            </button>

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

            {gifError && (
              <div className="absolute bottom-2 left-2 right-2 z-[60] rounded-md bg-black/80 px-2 py-1 text-[11px] text-red-300">
                {gifError}
              </div>
            )}

            <div className="relative z-0 flex h-full w-full flex-1 flex-col bg-black">
              <video
                ref={videoRef}
                src={videoSrc}
                className="h-full w-full object-contain"
                controls
                controlsList="nodownload"
                autoPlay
                playsInline
                onLoadedMetadata={(e) => {
                  const seconds = e.currentTarget.duration
                  if (Number.isFinite(seconds) && seconds > 0) {
                    setDurationSeconds(seconds)
                  }
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
