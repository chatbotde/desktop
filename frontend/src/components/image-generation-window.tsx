import { ImageGeneration, ImageGenerationActions } from "./image-generation"
import { useTypingLoop } from "./video-generation/use-typing-loop"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"
import { useDraggable, useResizable } from "@/features/output-window/hooks"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"
import type { Position, Size } from "@/features/output-window/types"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, GripVertical, ImageIcon, Square, X } from "lucide-react"
import { GLOBAL_THEME } from "@/global/theme"

interface ImageGenerationWindowProps {
  images: string[]
  isVisible: boolean
  isLoading?: boolean
  loadingPhrases?: string[]
  error?: string | null
  onClose: () => void
  onStop?: () => void
  isDarkTheme?: boolean
}

const DEFAULT_SIZE: Size = { width: 240, height: 180 }
const DEFAULT_LOADING_SIZE: Size = { width: 220, height: 44 }
const MAX_FIT_WIDTH = 340
const MAX_FIT_HEIGHT = 380
const MIN_WIDTH = 120
const MIN_HEIGHT = 90
const VIEWPORT_MARGIN = 16

const IMAGE_TYPING_PHRASES = [
  "Generating image",
  "Designing composition",
  "Rendering details",
  "Polishing pixels",
]

const RESIZE_DIRECTIONS: ResizeDirection[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"]
const PLAYER_Z = GLOBAL_THEME.zIndex.modal
const CONTROLS_Z = PLAYER_Z + 10

function getViewportSize() {
  return {
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  }
}

function getMaxFitBounds(): Size {
  const { width, height } = getViewportSize()
  return {
    width: Math.max(MIN_WIDTH, width - VIEWPORT_MARGIN * 2),
    height: Math.max(MIN_HEIGHT, height - VIEWPORT_MARGIN * 2),
  }
}

function clampPosition(position: Position, windowSize: Size): Position {
  const { width: vw, height: vh } = getViewportSize()
  return {
    x: Math.max(VIEWPORT_MARGIN, Math.min(position.x, vw - windowSize.width - VIEWPORT_MARGIN)),
    y: Math.max(VIEWPORT_MARGIN, Math.min(position.y, vh - windowSize.height - VIEWPORT_MARGIN)),
  }
}

function defaultPosition(windowSize: Size): Position {
  const { width: vw, height: vh } = getViewportSize()
  return clampPosition(
    {
      x: Math.round((vw - windowSize.width) / 2),
      y: Math.round((vh - windowSize.height) / 2),
    },
    windowSize
  )
}

function calculateConstrainedSize(naturalWidth: number, naturalHeight: number): Size {
  if (naturalWidth === 0 || naturalHeight === 0) return DEFAULT_SIZE

  const bounds = getMaxFitBounds()
  const maxWidth = Math.min(MAX_FIT_WIDTH, bounds.width)
  const maxHeight = Math.min(MAX_FIT_HEIGHT, bounds.height)
  const ratio = naturalWidth / naturalHeight

  let width = Math.min(naturalWidth, maxWidth)
  let height = width / ratio

  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  return {
    width: Math.max(MIN_WIDTH, Math.round(width)),
    height: Math.max(MIN_HEIGHT, Math.round(height)),
  }
}

function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function ImageGenerationWindow({
  images,
  isVisible,
  isLoading = false,
  loadingPhrases,
  error = null,
  onClose,
  onStop,
  isDarkTheme = true,
}: ImageGenerationWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevImageCountRef = useRef(0)
  const imageDimensionsCache = useRef<Map<string, Size>>(new Map())

  const [size, setSize] = useState<Size>(DEFAULT_SIZE)
  const [position, setPosition] = useState(() => defaultPosition(DEFAULT_SIZE))
  const [fitSignal, setFitSignal] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const typingText = useTypingLoop(loadingPhrases ?? IMAGE_TYPING_PHRASES)

  const displayImages = images ?? []
  const currentImage = displayImages[displayImages.length - 1]
  const hasImages = displayImages.length > 0

  const setClampedPosition = useCallback(
    (next: Position | ((prev: Position) => Position)) => {
      setPosition((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next
        return clampPosition(resolved, size)
      })
    },
    [size]
  )

  const { handleDragMouseDown, isDragging } = useDraggable(setClampedPosition, containerRef)
  const { handleResizeMouseDown, isResizing } = useResizable(
    size,
    setSize,
    position,
    setClampedPosition,
    { minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT }
  )

  const loadImageDimensions = useCallback((imageUrl: string): Promise<Size> => {
    const cached = imageDimensionsCache.current.get(imageUrl)
    if (cached) return Promise.resolve(cached)

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const dimensions = calculateConstrainedSize(img.naturalWidth, img.naturalHeight)
        imageDimensionsCache.current.set(imageUrl, dimensions)
        resolve(dimensions)
      }
      img.onerror = () => resolve(DEFAULT_SIZE)
      img.src = imageUrl
    })
  }, [])

  const fitCurrentImage = useCallback(() => {
    if (!currentImage) return
    loadImageDimensions(currentImage).then((nextSize) => {
      setSize(nextSize)
      setPosition((prev) => clampPosition(prev, nextSize))
    })
    setFitSignal((n) => n + 1)
  }, [currentImage, loadImageDimensions])

  useEffect(() => {
    if (!isVisible || !isLoading) {
      setElapsedSeconds(0)
      return
    }

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isVisible, isLoading])

  useEffect(() => {
    if (!isVisible) return
    setPosition(defaultPosition(size))
  }, [isVisible])

  useEffect(() => {
    setPosition((prev) => clampPosition(prev, size))
  }, [size.width, size.height])

  useEffect(() => {
    if (!isVisible) return
    const onResize = () => setPosition((prev) => clampPosition(prev, size))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [isVisible, size])

  useEffect(() => {
    if (displayImages.length === 0) {
      prevImageCountRef.current = 0
      return
    }

    if (displayImages.length > prevImageCountRef.current && currentImage) {
      loadImageDimensions(currentImage).then((nextSize) => {
        setSize(nextSize)
        setPosition(defaultPosition(nextSize))
      })
    }

    prevImageCountRef.current = displayImages.length
  }, [displayImages.length, currentImage, loadImageDimensions])

  useEffect(() => {
    if (!isLoading) return
    if (!hasImages) {
      setSize(DEFAULT_LOADING_SIZE)
      setPosition(defaultPosition(DEFAULT_LOADING_SIZE))
    }
  }, [isLoading, hasImages])

  useEffect(() => {
    if (error || isLoading || !currentImage) return
    loadImageDimensions(currentImage).then((nextSize) => {
      setSize(nextSize)
      setPosition((prev) => clampPosition(prev, nextSize))
    })
  }, [currentImage, isLoading, error, loadImageDimensions])

  const handleStopClick = () => {
    if (onStop) onStop()
    else onClose()
  }

  const themeClasses = {
    shell: isDarkTheme ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white",
    pill: isDarkTheme
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-200 bg-white text-zinc-900",
    textMuted: isDarkTheme ? "text-zinc-400" : "text-zinc-500",
    dragHandle: isDarkTheme ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600",
  }

  const shellClass = cn(
    "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl",
    themeClasses.shell
  )

  const showGeneratingPill = isLoading && !hasImages && !error
  const showImage = hasImages && !error
  const showContent = showGeneratingPill || showImage || error

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: PLAYER_Z }}
      aria-hidden={!isVisible}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-auto flex flex-col"
            style={{
              position: "fixed",
              zIndex: PLAYER_Z,
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: showGeneratingPill ? "auto" : `${size.width}px`,
              height: showGeneratingPill ? "auto" : `${size.height}px`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-no-clickthrough
          >
            {showGeneratingPill ? (
              <div className="flex flex-col items-end gap-1">
                <div
                  className={cn(
                    "flex h-7 w-full min-w-[240px] items-center justify-between rounded-full border px-2 transition-opacity duration-200",
                    themeClasses.pill,
                    isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <div
                    className="flex cursor-grab items-center gap-1 active:cursor-grabbing"
                    onMouseDown={handleDragMouseDown}
                    style={{ touchAction: "none" }}
                  >
                    <GripVertical className={cn("size-3.5", themeClasses.dragHandle)} />
                    <span className={cn("text-[10px]", themeClasses.textMuted)}>Drag</span>
                  </div>
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 transition-colors hover:bg-red-500/80 hover:text-white"
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <X className="size-3" />
                  </button>
                </div>

                <div
                  className={cn(
                    "flex min-w-[240px] items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-xl",
                    themeClasses.pill
                  )}
                >
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
                  </span>
                  <span className="min-w-[100px] text-xs font-medium">
                    {typingText}
                    <span className="ml-0.5 animate-pulse text-sky-400">|</span>
                  </span>
                  <span className={cn("text-[10px] font-medium tabular-nums", themeClasses.textMuted)}>
                    {formatElapsedTime(elapsedSeconds)}
                  </span>
                  <button
                    type="button"
                    className="ml-auto flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-600"
                    onClick={handleStopClick}
                    aria-label="Stop generating"
                  >
                    <Square className="size-2.5 fill-current" />
                    Stop
                  </button>
                </div>
              </div>
            ) : (
              <div className={shellClass} style={{ width: size.width, height: size.height }}>
                {RESIZE_DIRECTIONS.map((direction) => (
                  <div
                    key={direction}
                    className={cn(
                      "absolute z-20 bg-transparent",
                      direction === "n" && "top-8 left-0 right-0 h-2 cursor-ns-resize",
                      direction === "s" && "bottom-0 left-0 right-0 h-2 cursor-ns-resize",
                      direction === "e" && "top-8 right-0 bottom-0 w-2 cursor-ew-resize",
                      direction === "w" && "top-8 left-0 bottom-0 w-2 cursor-ew-resize",
                      direction === "ne" && "top-8 right-14 h-3 w-3 cursor-nesw-resize",
                      direction === "nw" && "top-8 left-0 h-3 w-3 cursor-nwse-resize",
                      direction === "se" && "bottom-0 right-0 h-4 w-4 cursor-nwse-resize",
                      direction === "sw" && "bottom-0 left-0 h-4 w-4 cursor-nesw-resize"
                    )}
                    onMouseDown={(e) => handleResizeMouseDown(e, direction)}
                  />
                ))}

                {(isDragging || isResizing) && (
                  <div className="absolute inset-0 z-30 cursor-grabbing bg-transparent" />
                )}

                {showContent && (
                  <div
                    className={cn(
                      "pointer-events-auto absolute top-0 left-0 right-0 flex h-8 items-center justify-between gap-1 px-1.5 transition-opacity duration-200",
                      isHovered || isLoading ? "opacity-100" : "opacity-0"
                    )}
                    style={{ zIndex: CONTROLS_Z }}
                  >
                    <div
                      className={cn(
                        "flex min-w-0 flex-1 cursor-grab items-center gap-1.5 rounded-md px-1 active:cursor-grabbing",
                        isHovered && "bg-gradient-to-b from-black/60 to-transparent"
                      )}
                      onMouseDown={handleDragMouseDown}
                      style={{ touchAction: "none" }}
                    >
                      <GripVertical className={cn("size-3.5 shrink-0", themeClasses.dragHandle)} />
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-zinc-300/80" />
                      {isLoading && (
                        <span className={cn("text-[10px] font-medium tabular-nums", themeClasses.textMuted)}>
                          {formatElapsedTime(elapsedSeconds)}
                        </span>
                      )}
                    </div>

                    <div className="relative flex shrink-0 items-center gap-1" style={{ zIndex: CONTROLS_Z }}>
                      {isLoading && (
                        <button
                          type="button"
                          className="flex h-7 items-center gap-1 rounded-full bg-red-500/90 px-2 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md transition-colors hover:bg-red-600"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStopClick()
                          }}
                          aria-label="Stop generating"
                        >
                          <Square className="size-2.5 fill-current" />
                          Stop
                        </button>
                      )}
                      {currentImage && (
                        <ImageGenerationActions
                          imageUrl={currentImage}
                          onFitToWindow={fitCurrentImage}
                        />
                      )}
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-colors hover:bg-red-500/90"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                        }}
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {error ? (
                  <div className="flex flex-1 flex-col gap-3 p-4 pt-8">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="size-4 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-widest">Image failed</span>
                    </div>
                    <p className={cn("text-xs leading-5", themeClasses.textMuted)}>{error}</p>
                  </div>
                ) : showImage && currentImage ? (
                  <div className="relative min-h-0 flex-1 overflow-hidden pt-8">
                    <ImageGeneration imageUrl={currentImage} fitSignal={fitSignal} />
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
