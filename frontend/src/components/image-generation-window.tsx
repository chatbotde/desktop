import { ImageGeneration } from "./image-generation/image-generation"
import { Card } from "@/shared/components/ui/card"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useSyncExternalStore, useEffect } from "react"
import { ResizeHandle } from "@/features/output-window/components/ResizeHandle"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { AlertCircle, GripVertical, X } from "lucide-react"
import { GLOBAL_THEME } from '@/global/theme'

interface ImageGenerationWindowProps {
  images: string[]
  isVisible: boolean
  isLoading?: boolean
  error?: string | null
  onClose: () => void
  isDarkTheme?: boolean
}

interface CardDimensions {
  width: number
  height: number
}

// Default compact size for loading state
const DEFAULT_LOADING_SIZE: CardDimensions = { width: 260, height: 170 }
// Maximum constraints
const MAX_WIDTH = 300
const MAX_HEIGHT = 400
// Padding around image inside card
const CARD_PADDING = 0

/**
 * Calculate constrained dimensions while preserving aspect ratio
 */
function calculateConstrainedSize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT
): CardDimensions {
  const ratio = naturalWidth / naturalHeight

  let width = Math.min(naturalWidth, maxWidth)
  let height = width / ratio

  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

export function ImageGenerationWindow({
  images,
  isVisible,
  isLoading = false,
  error = null,
  onClose,
  isDarkTheme = true,
}: ImageGenerationWindowProps) {
  const [cardSize, setCardSize] = useState<CardDimensions>(DEFAULT_LOADING_SIZE)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const imageDimensionsCache = useRef<Map<string, CardDimensions>>(new Map())
  const dragControls = useDragControls()

  // Resizing state
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    direction: 'e' as ResizeDirection
  })

  const displayImages = images ?? []

  useEffect(() => {
    if (!isVisible || !isLoading || displayImages.length > 0) {
      setElapsedSeconds(0)
      return
    }

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isVisible, isLoading, displayImages.length])

  const loadingMessage =
    elapsedSeconds >= 90
      ? "Waiting for final image..."
      : elapsedSeconds >= 45
        ? "Gemini can take 1-2 minutes..."
        : elapsedSeconds >= 20
          ? "Still generating..."
          : "Designing..."

  // Reset position and size when window becomes visible - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (isVisible) {
        setCardSize(DEFAULT_LOADING_SIZE)
        setCurrentImageIndex(0)
        imageDimensionsCache.current.clear()
      }
      return () => {}
    }, [isVisible]),
    () => null,
    () => null
  )

  // Load and cache image dimensions
  const loadImageDimensions = useCallback((imageUrl: string): Promise<CardDimensions> => {
    // Check cache first
    const cached = imageDimensionsCache.current.get(imageUrl)
    if (cached) {
      return Promise.resolve(cached)
    }

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const dimensions = calculateConstrainedSize(img.naturalWidth, img.naturalHeight)
        imageDimensionsCache.current.set(imageUrl, dimensions)
        resolve(dimensions)
      }
      img.onerror = () => {
        // Fallback to default size on error
        resolve(DEFAULT_LOADING_SIZE)
      }
      img.src = imageUrl
    })
  }, [])

  // Update card size when images change or current index changes - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (!isLoading) {
        const currentImage = displayImages[currentImageIndex]
        if (currentImage) {
          loadImageDimensions(currentImage).then(setCardSize)
        }
      } else if (isLoading) {
        setCardSize(DEFAULT_LOADING_SIZE)
      }
      return () => {}
    }, [displayImages, currentImageIndex, isLoading, loadImageDimensions]),
    () => null,
    () => null
  )

  // Handle image index change from carousel
  const handleImageIndexChange = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  // Resize Handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: cardSize.width,
      startHeight: cardSize.height,
      direction
    }
  }, [cardSize])

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeRef.current.startX
        const deltaY = e.clientY - resizeRef.current.startY
        const { startWidth, startHeight, direction } = resizeRef.current

        let newWidth = startWidth
        let newHeight = startHeight

        if (direction.includes('e')) {
          newWidth = Math.max(100, startWidth + deltaX)
        }
        if (direction.includes('w')) {
          newWidth = Math.max(100, startWidth - deltaX)
        }
        if (direction.includes('s')) {
          newHeight = Math.max(100, startHeight + deltaY)
        }
        if (direction.includes('n')) {
          newHeight = Math.max(100, startHeight - deltaY)
        }

        setCardSize({ width: newWidth, height: newHeight })
      }
    },
    [isResizing]
  )

  const handleGlobalMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Global mouse event listeners for resizing - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      if (isResizing) {
        window.addEventListener("mousemove", handleGlobalMouseMove)
        window.addEventListener("mouseup", handleGlobalMouseUp)
        return () => {
          window.removeEventListener("mousemove", handleGlobalMouseMove)
          window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
      }
      return () => { }
    }, [isResizing, handleGlobalMouseMove, handleGlobalMouseUp]),
    () => null,
    () => null
  )


  const themeClasses = {
    containerBg: isDarkTheme ? GLOBAL_THEME.colors.dark.background : GLOBAL_THEME.colors.light.background,
    border: isDarkTheme ? GLOBAL_THEME.colors.dark.border : GLOBAL_THEME.colors.light.border,
    text: isDarkTheme ? GLOBAL_THEME.colors.dark.text : GLOBAL_THEME.colors.light.text,
    textMuted: isDarkTheme ? GLOBAL_THEME.colors.dark.textMuted : GLOBAL_THEME.colors.light.textMuted,
    dragHandle: isDarkTheme ? `text-zinc-500 hover:text-zinc-300` : `text-zinc-400 hover:text-zinc-600`,
  }

  // Calculate total card dimensions (image size + padding)
  const totalCardWidth = cardSize.width + CARD_PADDING
  const totalCardHeight = cardSize.height + CARD_PADDING

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed left-1/2 top-1/2 z-[1000]"
          style={{ x: "-50%", y: "-50%" }}
          data-no-clickthrough
        >
          {error ? (
            <div className={cn(
              "relative flex w-[320px] flex-col gap-3 rounded-2xl border p-5 shadow-2xl",
              themeClasses.containerBg,
              themeClasses.border
            )}>
              <button
                onClick={onClose}
                className={cn("absolute right-3 top-3 rounded-md p-1 transition-colors", themeClasses.dragHandle)}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-2 pr-8 text-red-500">
                <AlertCircle className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-widest">Image failed</span>
              </div>
              <p className={cn("max-h-36 overflow-auto whitespace-pre-wrap break-words text-xs leading-5", themeClasses.textMuted)}>
                {error}
              </p>
            </div>
          ) : isLoading && displayImages.length === 0 ? (
            // Initial load - show premium loading state
            <div className={cn(
              "flex flex-col items-center justify-center gap-4 p-7 rounded-2xl border shadow-2xl min-w-[260px]",
              themeClasses.containerBg,
              themeClasses.border
            )}>
              <div className="relative">
                <div className="size-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 size-12 rounded-full bg-blue-500/10 animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-xs font-medium text-blue-500 animate-pulse uppercase tracking-widest">
                  {loadingMessage}
                </span>
                <span className={cn("text-[11px]", themeClasses.textMuted)}>
                  {elapsedSeconds}s elapsed
                </span>
              </div>
            </div>
          ) : displayImages.length > 0 ? (
            // Show full card with image when loaded
            <Card
              className={cn(
                "relative overflow-hidden shadow-2xl p-0",
                "ring-1 ring-black/5",
                "transition-all duration-300 ease-out",
                themeClasses.containerBg,
                themeClasses.border
              )}
              style={{
                width: `${totalCardWidth}px`,
                height: `${totalCardHeight}px`,
                minHeight: `${totalCardHeight}px`,
              }}
            >
              {/* Drag Handle - Vertical dots */}
              <button
                onPointerDown={(e) => dragControls.start(e)}
                className={cn(
                  "absolute top-2 left-2 z-[60] p-1 rounded-md transition-colors cursor-grab active:cursor-grabbing",
                  themeClasses.dragHandle
                )}
                aria-label="Drag window"
              >
                <GripVertical className="size-4" />
              </button>

              {/* Resize Handles */}
              {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((dir) => (
                <ResizeHandle
                  key={dir}
                  direction={dir as ResizeDirection}
                  onMouseDown={handleResizeMouseDown}
                />
              ))}

              {/* Loading indicator - small dot when generating additional images */}
              {isLoading && (
                <div className="absolute top-2 right-2 z-30 pointer-events-none">
                  <div
                    className="size-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg"
                    title="Generating next image..."
                  />
                </div>
              )}

              {/* Content area */}
              <div className="absolute inset-0">
                <ImageGeneration
                  images={displayImages}
                  onImageIndexChange={handleImageIndexChange}
                  onClose={onClose}
                />
              </div>
            </Card>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
