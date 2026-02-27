import { RectangleScreenshotSection } from '@/components/sections'
import { useAppState } from '../context/AppContext'

export function RectangleScreenshotOverlay() {
  const { uiState } = useAppState()

  const handleRectangleScreenshotCapture = async (area: { x: number; y: number; width: number; height: number }) => {
    if (uiState.rectangleScreenshotCallback) {
      await uiState.rectangleScreenshotCallback(area)
    }
    uiState.setShowRectangleScreenshot(false)
    uiState.setRectangleScreenshotCallback(null)
  }

  const handleRectangleScreenshotCancel = () => {
    uiState.setShowRectangleScreenshot(false)
    uiState.setRectangleScreenshotCallback(null)
  }

  return (
    <RectangleScreenshotSection
      showRectangleScreenshot={uiState.showRectangleScreenshot}
      rectangleScreenshotCallback={uiState.rectangleScreenshotCallback}
      onCapture={handleRectangleScreenshotCapture}
      onCancel={handleRectangleScreenshotCancel}
    />
  )
}
