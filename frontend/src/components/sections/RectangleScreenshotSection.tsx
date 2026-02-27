import { RectangleSelectOverlay } from '@/features/capture/components'

interface RectangleScreenshotSectionProps {
  showRectangleScreenshot: boolean
  rectangleScreenshotCallback: ((area: { x: number; y: number; width: number; height: number }) => void) | null
  onCapture: (area: { x: number; y: number; width: number; height: number }) => Promise<void>
  onCancel: () => void
}

export const RectangleScreenshotSection = ({
  showRectangleScreenshot,
  rectangleScreenshotCallback,
  onCapture,
  onCancel
}: RectangleScreenshotSectionProps) => {
  if (!showRectangleScreenshot || !rectangleScreenshotCallback) return null

  return (
    <RectangleSelectOverlay
      onCapture={onCapture}
      onCancel={onCancel}
    />
  )
}
