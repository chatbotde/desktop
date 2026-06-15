export interface ImageGenerationProps {
  imageUrl: string
  className?: string
  fitSignal?: number
}

export interface ZoomableImageProps {
  src: string
  alt: string
  isActive: boolean
  fitSignal?: number
  onError?: () => void
}

export interface ImageGenerationActionsProps {
  imageUrl: string
  onFitToWindow?: () => void
}
