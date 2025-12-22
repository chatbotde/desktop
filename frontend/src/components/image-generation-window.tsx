
import { X, Loader2, ImageIcon, GripHorizontal } from "lucide-react"
import { ImageGeneration } from "./image-generation/image-generation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback, useEffect } from "react"

interface ImageGenerationWindowProps {
  images: string[]
  isVisible: boolean
  isLoading?: boolean
  onClose: () => void
  isDarkTheme?: boolean
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
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset position when window becomes visible
  useEffect(() => {
    if (isVisible) {
      setPosition({ x: 0, y: 60 })
    }
  }, [isVisible])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - window.innerWidth / 2 - dragOffset.current.x
    const newY = e.clientY - dragOffset.current.y
    setPosition({ x: newX, y: newY })
  }, [isDragging])

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
    border: isDarkTheme 
      ? "border-zinc-700/50" 
      : "border-zinc-200/80",
    text: isDarkTheme ? "text-zinc-100" : "text-zinc-900",
    textMuted: isDarkTheme ? "text-zinc-400" : "text-zinc-500",
    actionBtn: isDarkTheme 
      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-600" 
      : "bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border-zinc-300",
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed left-1/2 z-[100]",
        isDragging ? "cursor-grabbing" : ""
      )}
      style={{
        transform: `translateX(calc(-50% + ${position.x}px))`,
        top: `${position.y}px`,
      }}
      data-no-clickthrough
    >
      {/* Wrapper for card + external buttons */}
      <div className="relative">
        {/* Top button bar - above the card */}
        <div className="absolute -top-10 left-0 right-0 flex justify-between px-1">
          {/* Drag handle - top left */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing",
              "hover:scale-110 active:scale-95",
              themeClasses.actionBtn
            )}
            onMouseDown={handleMouseDown}
            title="Drag to move"
          >
            <GripHorizontal className="h-4 w-4" />
          </Button>

          {/* Close button - top right */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full shadow-lg transition-all duration-200",
              "hover:scale-110 active:scale-95",
              themeClasses.actionBtn
            )}
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Card
          className={cn(
            "w-[420px] overflow-hidden shadow-2xl",
            "ring-1 ring-black/5",
            themeClasses.containerBg,
            themeClasses.border
          )}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[220px]">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    "p-4 rounded-full",
                    isDarkTheme ? "bg-zinc-800/50" : "bg-zinc-100"
                  )}>
                    <Loader2 className={cn("h-8 w-8 animate-spin", themeClasses.textMuted)} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className={cn("text-sm font-medium", themeClasses.text)}>
                      Generating your image
                    </p>
                    <p className={cn("text-xs", themeClasses.textMuted)}>
                      This may take a moment...
                    </p>
                  </div>
                </div>
              ) : images && images.length > 0 ? (
                <ImageGeneration images={images} isDarkTheme={isDarkTheme} onClose={onClose} />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    "p-4 rounded-full",
                    isDarkTheme ? "bg-zinc-800/50" : "bg-zinc-100"
                  )}>
                    <ImageIcon className={cn("h-8 w-8", themeClasses.textMuted)} />
                  </div>
                  <p className={cn("text-sm", themeClasses.textMuted)}>
                    No images generated yet
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



