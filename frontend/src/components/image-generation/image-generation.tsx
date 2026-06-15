"use client"

import { cn } from "@/lib/utils"
import { ZoomableImage } from "./zoomable-image"
import type { ImageGenerationProps } from "./types"

export function ImageGeneration({
  imageUrl,
  className,
  fitSignal = 0,
}: ImageGenerationProps) {
  if (!imageUrl) {
    return null
  }

  return (
    <div data-no-clickthrough className={cn("absolute inset-0", className)}>
      <ZoomableImage src={imageUrl} alt="" isActive fitSignal={fitSignal} />
    </div>
  )
}
