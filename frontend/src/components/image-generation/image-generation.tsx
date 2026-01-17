"use client"

import * as React from "react"
import { Copy, Download, Check } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/shared/components/ui/carousel"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"

interface CardDimensions {
  width: number
  height: number
}

interface ImageGenerationProps {
  images: string[]
  className?: string
  isDarkTheme?: boolean
  cardSize: CardDimensions
  onImageIndexChange?: (index: number) => void
}

export function ImageGeneration({
  images,
  className,
  isDarkTheme = true,
  cardSize,
  onImageIndexChange,
}: ImageGenerationProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)
  const [api, setApi] = React.useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = React.useState(0)

  // Listen to carousel changes
  React.useEffect(() => {
    if (!api) return

    const onSelect = () => {
      const index = api.selectedScrollSnap()
      setCurrentIndex(index)
      onImageIndexChange?.(index)
    }

    api.on("select", onSelect)
    // Call once to set initial index
    onSelect()

    return () => {
      api.off("select", onSelect)
    }
  }, [api, onImageIndexChange])

  const handleCopy = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error("Failed to copy image:", error)
    }
  }

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download image:", error)
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div
      className={cn("relative w-full", className)}
      style={{
        width: `${cardSize.width}px`,
      }}
    >
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((imageUrl, index) => (
            <CarouselItem key={index}>
              <div
                className="relative group rounded-lg overflow-hidden bg-muted/30"
                style={{
                  width: `${cardSize.width}px`,
                  height: `${cardSize.height}px`,
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-contain transition-all duration-300"
                />

                {/* Action buttons - appear on hover, top right corner */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(imageUrl, index)
                    }}
                    title={copiedIndex === index ? "Copied!" : "Copy image"}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(imageUrl)
                    }}
                    title="Download image"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation arrows and indicator */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-2">
            <CarouselPrevious
              className="static translate-y-0 h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <span
              className={cn(
                "text-xs font-medium tabular-nums",
                isDarkTheme ? "text-zinc-400" : "text-zinc-500"
              )}
            >
              {currentIndex + 1} / {images.length}
            </span>
            <CarouselNext
              className="static translate-y-0 h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </Carousel>
    </div>
  )
}
