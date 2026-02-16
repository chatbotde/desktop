"use client"

import * as React from "react"
import { Copy, Download, Check, X } from "lucide-react"
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



interface ImageGenerationProps {
  images: string[]
  className?: string
  onImageIndexChange?: (index: number) => void
  onClose: () => void
}

export function ImageGeneration({
  images,
  className,
  onImageIndexChange,
  onClose,
}: ImageGenerationProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)
  const [api, setApi] = React.useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [failedImages, setFailedImages] = React.useState<Set<number>>(new Set())

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
      className={cn("relative w-full h-full", className)}
    >
      <Carousel
        setApi={setApi}
        className="w-full h-full"
        opts={{ watchDrag: false }}
      >
        <CarouselContent className="h-full">
          {images.map((originalUrl, index) => {
            const isFailed = failedImages.has(index)
            const imageUrl = isFailed ? '/1.png' : originalUrl

            return (
              <CarouselItem key={index} className="h-full">
                <div
                  className="relative group h-full w-full overflow-hidden select-none"
                >
                  <img
                    src={imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-300 pointer-events-none"
                    draggable={false}
                    onError={() => {
                      setFailedImages(prev => {
                        const next = new Set(prev)
                        next.add(index)
                        return next
                      })
                    }}
                  />

                  {/* Action buttons - appear on hover, top right corner */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md rounded-full transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(imageUrl, index)
                      }}
                      title={copiedIndex === index ? "Copied!" : "Copy image"}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md rounded-full transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(imageUrl)
                      }}
                      title="Download image"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md rounded-full transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                      }}
                      title="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {/* Navigation arrows and indicator - Overlaid */}
        {images.length > 1 && (
          <>
            <CarouselPrevious
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/40 hover:bg-black/60 text-white border-0 backdrop-blur-sm z-20"
              onClick={(e) => e.stopPropagation()}
            />
            <CarouselNext
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/40 hover:bg-black/60 text-white border-0 backdrop-blur-sm z-20"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
              <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-[10px] font-medium text-white tabular-nums block shadow-sm">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          </>
        )}
      </Carousel>
    </div>
  )
}
