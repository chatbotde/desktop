"use client"

import * as React from "react"
import { Copy, Download, Check, X } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/components/ui/carousel"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { cn } from "@/lib/utils"

interface ImageGenerationProps {
  images: string[]
  className?: string
  isDarkTheme?: boolean
  onClose?: () => void
}

export function ImageGeneration({ images, className, isDarkTheme = true, onClose }: ImageGenerationProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const themeClasses = {
    cardBg: isDarkTheme ? "bg-zinc-900/95" : "bg-white/95",
    border: isDarkTheme ? "border-zinc-700" : "border-zinc-200",
    text: isDarkTheme ? "text-zinc-100" : "text-zinc-900",
    icon: isDarkTheme ? "text-zinc-400" : "text-zinc-500",
  }

  const iconHoverClass = isDarkTheme ? "hover:bg-zinc-800" : "hover:bg-zinc-100"

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
    <Card
      className={cn(
        "w-full max-w-2xl overflow-hidden",
        themeClasses.cardBg,
        themeClasses.border,
        className
      )}
    >
      <CardHeader className="pb-3 relative">
        <CardTitle className={cn("text-base font-semibold", themeClasses.text)}>
          Generated Images
        </CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-0 right-0 h-8 w-8",
              themeClasses.icon,
              iconHoverClass
            )}
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full h-[500px]">
          <Carousel className="w-full h-full">
            <CarouselContent className="h-full">
              {images.map((imageUrl, index) => (
                <CarouselItem key={index} className="h-full">
                  <div className="relative group w-full h-full rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Action buttons - appear on hover, top right corner */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 bg-black/70 hover:bg-black/90 text-white border-white/20 backdrop-blur-sm"
                        onClick={() => handleCopy(imageUrl, index)}
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
                        className="h-9 w-9 bg-black/70 hover:bg-black/90 text-white border-white/20 backdrop-blur-sm"
                        onClick={() => handleDownload(imageUrl)}
                        title="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Arrows inside the carousel */}
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-3 bg-black/70 hover:bg-black/90 text-white border-white/20 backdrop-blur-sm" />
                <CarouselNext className="right-3 bg-black/70 hover:bg-black/90 text-white border-white/20 backdrop-blur-sm" />
              </>
            )}
          </Carousel>
        </div>
      </CardContent>
    </Card>
  )
}
