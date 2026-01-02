import { useState, useCallback } from "react"
import { screenshotToFile, validateCaptureAPIMethod } from "../utils/screenshot-to-file"
import { MEDIA_UPLOAD_CONSTANTS } from "../constants/media-upload-constants"
import type { ScreenshotData } from "../types/media-upload-types"

interface UseScreenshotHandlersProps {
  onFileUpload?: (files: File[]) => void
  onScreenshot?: (screenshot: ScreenshotData) => void
}

/**
 * Hook to handle screenshot operations (quick and area)
 */
export function useScreenshotHandlers({ onFileUpload, onScreenshot }: UseScreenshotHandlersProps) {
  const [isCapturing, setIsCapturing] = useState(false)

  const handleQuickScreenshot = useCallback(async () => {
    const validation = validateCaptureAPIMethod('quickScreenshot')
    if (!validation.available) {
      console.error('[MediaUploadCard]', validation.error)
      alert(validation.error)
      return
    }

    setIsCapturing(true)

    try {
      const result = await (window.CaptureAPI as any).quickScreenshot()

      if (result.success && result.screenshot) {
        const file = await screenshotToFile(result.screenshot)
        onFileUpload?.([file])
        onScreenshot?.(result.screenshot)
      } else {
        console.error('[MediaUploadCard] Screenshot failed:', result.error)
        alert(`Screenshot failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('[MediaUploadCard] Error taking screenshot:', error)
      alert(`Error taking screenshot: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCapturing(false)
    }
  }, [onFileUpload, onScreenshot])

  const handleAreaScreenshot = useCallback(() => {
    const validation = validateCaptureAPIMethod('takeAreaScreenshot')
    if (!validation.available) {
      console.error('[MediaUploadCard]', validation.error)
      return
    }

    const event = new CustomEvent(MEDIA_UPLOAD_CONSTANTS.EVENTS.SHOW_AREA_SCREENSHOT, {
      detail: {
        onCapture: async (area: { x: number; y: number; width: number; height: number }) => {
          setIsCapturing(true)
          try {
            const result = await (window.CaptureAPI as any).takeAreaScreenshot(area)
            if (result.success && result.screenshot) {
              const file = await screenshotToFile(result.screenshot)
              onFileUpload?.([file])
              onScreenshot?.(result.screenshot)
            } else {
              console.error('Area screenshot failed:', result.error)
            }
          } catch (error) {
            console.error('Error taking area screenshot:', error)
          } finally {
            setIsCapturing(false)
          }
        },
      },
    })
    window.dispatchEvent(event)
  }, [onFileUpload, onScreenshot])

  return {
    isCapturing,
    handleQuickScreenshot,
    handleAreaScreenshot,
  }
}

