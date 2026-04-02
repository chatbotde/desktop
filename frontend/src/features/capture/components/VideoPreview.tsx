import { useState, useSyncExternalStore, useCallback, useRef } from 'react'
import { cn } from '@/shared/lib'
import { getThemeClasses } from '@/features/prompt'
import { useDraggable, useResizable } from '@/features/output-window'
import { Download, X, Plus, Play } from 'lucide-react'
import type { VideoData } from '@/hooks/useVideoRecording'
import type { ResizeDirection } from '@/features/output-window'

interface VideoPreviewProps {
  video: VideoData
  onClose: () => void
  onDelete?: () => void
  onAdd?: (video: VideoData) => void
  isDarkTheme?: boolean
}

// Helper to format duration in mm:ss
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function VideoPreview({
  video,
  onClose,
  onDelete,
  onAdd,
  isDarkTheme = true
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Position and size state
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 })
  const [size, setSize] = useState({ width: 800, height: 600 })

  const { handleDragMouseDown } = useDraggable(setPosition, containerRef)
  const { handleResizeMouseDown } = useResizable(size, setSize, position, setPosition)

  const themeClasses = getThemeClasses(isDarkTheme)

  // Use video data directly
  const videoUrl = video.data

  // Set up video event listeners - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      const videoElement = videoRef.current
      if (!videoElement) return () => {}

      const handleLoadedMetadata = () => {
        setDuration(videoElement.duration * 1000)
      }

      const handleTimeUpdate = () => {
        setCurrentTime(videoElement.currentTime * 1000)
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.addEventListener('timeupdate', handleTimeUpdate)
      videoElement.addEventListener('ended', handleEnded)

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        videoElement.removeEventListener('timeupdate', handleTimeUpdate)
        videoElement.removeEventListener('ended', handleEnded)
      }
    }, [videoUrl]),
    () => null,
    () => null
  )

  const handlePlayPause = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isPlaying) {
      videoElement.pause()
    } else {
      videoElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.currentTime = time / 1000 // Convert from ms to seconds
    setCurrentTime(time)
  }

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = video.data
    link.download = video.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [video])

  const handleAdd = useCallback(() => {
    onAdd?.(video)
  }, [video, onAdd])

  const fileSize = formatFileSize(video.size)

  const handleClose = useCallback(() => {
    if (onDelete) {
      onDelete()
    } else {
      onClose()
    }
  }, [onClose, onDelete])

  return (
    <div
      ref={containerRef}
      className="fixed z-[60]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      data-no-clickthrough
    >
      <div
        className={cn(
          "relative w-full h-full rounded-xl border shadow-2xl p-4 flex flex-col",
          themeClasses.containerBorder,
          "backdrop-blur-lg"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        {/* Resize Handles */}
        {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as ResizeDirection[]).map((direction) => (
          <div
            key={direction}
            className={cn(
              "absolute z-50",
              direction === 'n' && "top-0 left-0 right-0 h-2 cursor-ns-resize",
              direction === 's' && "bottom-0 left-0 right-0 h-2 cursor-ns-resize",
              direction === 'e' && "top-0 right-0 bottom-0 w-2 cursor-ew-resize",
              direction === 'w' && "top-0 left-0 bottom-0 w-2 cursor-ew-resize",
              direction === 'ne' && "top-0 right-0 w-4 h-4 cursor-nesw-resize",
              direction === 'nw' && "top-0 left-0 w-4 h-4 cursor-nwse-resize",
              direction === 'se' && "bottom-0 right-0 w-4 h-4 cursor-nwse-resize",
              direction === 'sw' && "bottom-0 left-0 w-4 h-4 cursor-nesw-resize"
            )}
            onMouseDown={(e) => handleResizeMouseDown(e, direction)}
          />
        ))}

        {/* Header - Draggable */}
        <div
          className="flex items-center justify-between mb-4 cursor-move select-none"
          onMouseDown={handleDragMouseDown}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isDarkTheme ? "text-zinc-300" : "text-zinc-700"
            )}>
              <span className="font-medium">{formatDuration(video.duration)}</span>
              <span className={cn(
                "text-xs",
                isDarkTheme ? "text-zinc-500" : "text-zinc-500"
              )}>
                {fileSize}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDarkTheme ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-zinc-100 text-zinc-600"
            )}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative mb-4 rounded-lg overflow-hidden bg-zinc-900 flex-1 min-h-0 flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain max-w-full max-h-full"
            playsInline
          />

          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                onClick={handlePlayPause}
                className={cn(
                  "p-4 rounded-full transition-all pointer-events-auto",
                  "bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                  "border-2 border-white/20"
                )}
              >
                <Play className="size-8 text-white ml-1" />
              </button>
            </div>
          )}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{
                background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${duration ? (currentTime / duration) * 100 : 0}%, rgb(63 63 70) ${duration ? (currentTime / duration) * 100 : 0}%, rgb(63 63 70) 100%)`
              }}
            />
            <div className="flex items-center justify-between mt-1 text-xs text-white/80">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 flex-shrink-0">
          <button
            onClick={handleDownload}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium",
              isDarkTheme
                ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
            )}
          >
            <Download className="size-4" />
            <span>Download</span>
          </button>

          {onAdd && (
            <button
              onClick={handleAdd}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium",
                isDarkTheme
                  ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                  : "bg-green-100 hover:bg-green-200 text-green-700 border border-green-300"
              )}
            >
              <Plus className="size-4" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

