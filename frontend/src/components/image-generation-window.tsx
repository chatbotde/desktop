import { X, Loader2, ImageIcon } from "lucide-react"
import { ImageGeneration } from "./image-generation/image-generation"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"

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
const CARD_PADDING = 24

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

  // Reset position and size when window becomes visible
  useEffect(() => {
    if (isVisible) {
      setPosition({ x: 0, y: 60 })
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
    if (images && images.length > 0 && !isLoading) {
      const currentImage = images[currentImageIndex]
      if (currentImage) {
        loadImageDimensions(currentImage).then(setCardSize)
      }
    } else if (isLoading) {
      setCardSize(DEFAULT_LOADING_SIZE)
    }
  }, [images, currentImageIndex, isLoading, loadImageDimensions])

  // Handle image index change from carousel
  const handleImageIndexChange = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  // Drag handlers - now for entire card
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't initiate drag if clicking on a button
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    e.preventDefault()
    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top,
      }
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      const newX = e.clientX - window.innerWidth / 2 - dragOffset.current.x
      const newY = e.clientY - dragOffset.current.y
      setPosition({ x: newX, y: newY })
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

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
  const totalCardHeight = cardSize.height + CARD_PADDING + (images.length > 1 ? 40 : 0) // Extra space for carousel controls

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed left-1/2 z-[100]",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        transform: `translateX(calc(-50% + ${position.x}px))`,
        top: `${position.y}px`,
      }}
      data-no-clickthrough
      onMouseDown={handleMouseDown}
    >
      <Card
        className={cn(
          "relative overflow-hidden shadow-2xl",
          "ring-1 ring-black/5",
          "transition-all duration-300 ease-out",
          themeClasses.containerBg,
          themeClasses.border
        )}
        style={{
          width: `${totalCardWidth}px`,
          height: isLoading ? `${totalCardHeight}px` : 'auto',
          minHeight: `${totalCardHeight}px`,
        }}
      >
        {/* Close button - top right corner inside card */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 z-20 h-7 w-7 rounded-full",
            "transition-all duration-200 hover:scale-110",
            themeClasses.closeBtn
          )}
          onClick={onClose}
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content area */}
        <div
          className={cn(
            "flex flex-col items-center justify-center p-3",
            "transition-all duration-300 ease-out"
          )}
          style={{
            minHeight: `${cardSize.height + CARD_PADDING}px`,
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-full",
                  isDarkTheme ? "bg-zinc-800/50" : "bg-zinc-100"
                )}
              >
                <Loader2
                  className={cn("h-6 w-6 animate-spin", themeClasses.textMuted)}
                />
              </div>
              <div className="text-center space-y-1">
                <p className={cn("text-xs font-medium", themeClasses.text)}>
                  Generating...
                </p>
              </div>
            </div>
          ) : images && images.length > 0 ? (
            <ImageGeneration
              images={images}
              isDarkTheme={isDarkTheme}
              cardSize={cardSize}
              onImageIndexChange={handleImageIndexChange}
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-full",
                  isDarkTheme ? "bg-zinc-800/50" : "bg-zinc-100"
                )}
              >
                <ImageIcon className={cn("h-6 w-6", themeClasses.textMuted)} />
              </div>
              <p className={cn("text-xs", themeClasses.textMuted)}>
                No images yet
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
