import { AreaScreenshotOverlay } from '@/components/area-screenshot-overlay'

interface AreaScreenshotSectionProps {
  showAreaScreenshot: boolean
  areaScreenshotCallback: ((area: { x: number; y: number; width: number; height: number }) => void) | null
  onCapture: (area: { x: number; y: number; width: number; height: number }) => Promise<void>
  onCancel: () => void
}

export const AreaScreenshotSection = ({
  showAreaScreenshot,
  areaScreenshotCallback,
  onCapture,
  onCancel
}: AreaScreenshotSectionProps) => {
  if (!showAreaScreenshot || !areaScreenshotCallback) return null

  return (
    <AreaScreenshotOverlay
      onCapture={onCapture}
      onCancel={onCancel}
    />
  )
}
