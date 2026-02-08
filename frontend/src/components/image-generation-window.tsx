import { ImageGeneration } from "./image-generation/image-generation"
import { Card } from "@/shared/components/ui/card"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"
import { ResizeHandle } from "@/features/output-window/components/ResizeHandle"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"

interface ImageGenerationWindowProps {
  images: string[]
  isVisible: boolean
  isLoading?: boolean
  onClose: () => void
  isDarkTheme?: boolean
}

interface CardDimensions {
  width: number
  height: number
}

// Default compact size for loading state
const DEFAULT_LOADING_SIZE: CardDimensions = { width: 200, height: 150 }
// Maximum constraints
const MAX_WIDTH = 300
const MAX_HEIGHT = 400
// Padding around image inside card
const CARD_PADDING = 0
// Fallback image for testing/failure
const FALLBACK_IMAGE = '/1.png'

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
  onClose,
  isDarkTheme = true,
}: ImageGenerationWindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 60 })
  const [isDragging, setIsDragging] = useState(false)
  const [cardSize, setCardSize] = useState<CardDimensions>(DEFAULT_LOADING_SIZE)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageDimensionsCache = useRef<Map<string, CardDimensions>>(new Map())

  // Resizing state
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startPosX: 0,
    startPosY: 0,
    direction: 'e' as ResizeDirection
  })

  // Use fallback image if no images provided (for testing)
  const displayImages = (images && images.length > 0) ? images : [FALLBACK_IMAGE]

  // Reset position and size when window becomes visible
  useEffect(() => {
    if (isVisible) {
      setPosition({ x: 0, y: 0 })
      setCardSize(DEFAULT_LOADING_SIZE)
      setCurrentImageIndex(0)
      imageDimensionsCache.current.clear()
    }
  }, [isVisible])

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

  // Update card size when images change or current index changes
  useEffect(() => {
    if (!isLoading) {
      const currentImage = displayImages[currentImageIndex]
      if (currentImage) {
        loadImageDimensions(currentImage).then(setCardSize)
      }
    } else if (isLoading) {
      setCardSize(DEFAULT_LOADING_SIZE)
    }
  }, [displayImages, currentImageIndex, isLoading, loadImageDimensions])

  // Handle image index change from carousel
  const handleImageIndexChange = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  // Drag handlers - now for entire card
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't initiate drag if clicking on a button or resize handle
    if ((e.target as HTMLElement).closest('button') || isResizing) {
      return
    }
    e.preventDefault()
    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      }
    }
  }, [isResizing])

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
      startPosX: position.x,
      startPosY: position.y,
      direction
    }
  }, [cardSize, position])

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeRef.current.startX
        const deltaY = e.clientY - resizeRef.current.startY
        const { startWidth, startHeight, startPosX, startPosY, direction } = resizeRef.current

        let newWidth = startWidth
        let newHeight = startHeight
        let newX = startPosX
        let newY = startPosY

        // Calculations for centered resizing
        // Since the window is centered using translate(-50%, -50%), 
        // adjusting size requires shifting position by delta/2.

        if (direction.includes('e')) {
          newWidth = Math.max(100, startWidth + deltaX)
          newX = startPosX + deltaX / 2
        }
        if (direction.includes('w')) {
          newWidth = Math.max(100, startWidth - deltaX)
          newX = startPosX + deltaX / 2
        }
        if (direction.includes('s')) {
          newHeight = Math.max(100, startHeight + deltaY)
          newY = startPosY + deltaY / 2
        }
        if (direction.includes('n')) {
          newHeight = Math.max(100, startHeight - deltaY)
          newY = startPosY + deltaY / 2
        }

        setCardSize({ width: newWidth, height: newHeight })
        setPosition({ x: newX, y: newY })

      } else if (isDragging) {
        const newX = e.clientX - window.innerWidth / 2 - dragOffset.current.x
        const newY = e.clientY - window.innerHeight / 2 - dragOffset.current.y
        setPosition({ x: newX, y: newY })
      }
    },
    [isDragging, isResizing]
  )

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("mouseup", handleGlobalMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging, isResizing, handleGlobalMouseMove, handleGlobalMouseUp])

  if (!isVisible) {
    return null
  }

  const themeClasses = {
    containerBg: isDarkTheme
      ? "bg-zinc-900/98 backdrop-blur-xl"
      : "bg-white/98 backdrop-blur-xl",
    border: isDarkTheme ? "border-zinc-700/50" : "border-zinc-200/80",
    text: isDarkTheme ? "text-zinc-100" : "text-zinc-900",
    textMuted: isDarkTheme ? "text-zinc-400" : "text-zinc-500",
    closeBtn: isDarkTheme
      ? "bg-black/60 hover:bg-black/80 text-white"
      : "bg-black/50 hover:bg-black/70 text-white",
  }

  // Calculate total card dimensions (image size + padding)
  const totalCardWidth = cardSize.width + CARD_PADDING
  const totalCardHeight = cardSize.height + CARD_PADDING

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed left-1/2 z-[100]",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        top: `50%`,
      }}
      data-no-clickthrough
      onMouseDown={handleMouseDown}
    >
      {isLoading && (!images || images.length === 0) ? (
        // Initial load - just show pulsing dot
        <div className="flex items-center justify-center">
          <div
            className="size-8 rounded-full bg-blue-500 animate-pulse"
            title="Generating image..."
          />
        </div>
      ) : (
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
          {/* Resize Handles */}
          {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((dir) => (
            <ResizeHandle
              key={dir}
              direction={dir as ResizeDirection}
              onMouseDown={handleResizeMouseDown}
            />
          ))}

          {/* Loading indicator - small dot in top-right when generating additional images */}
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
      )}
    </div>
  )
}
