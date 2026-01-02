import type { ScreenshotData } from "../types/media-upload-types"

/**
 * Converts screenshot data URL to File object
 */
export async function screenshotToFile(screenshot: ScreenshotData): Promise<File> {
  const response = await fetch(screenshot.data)
  const blob = await response.blob()
  return new File([blob], screenshot.name, { type: screenshot.type })
}

/**
 * Validates if CaptureAPI is available
 */
export function validateCaptureAPI(): { available: boolean; error?: string } {
  if (!window.CaptureAPI) {
    return {
      available: false,
      error: 'CaptureAPI is not available. Please ensure the interface window is properly initialized.',
    }
  }
  return { available: true }
}

/**
 * Validates if a specific CaptureAPI method exists
 */
export function validateCaptureAPIMethod(method: string): { available: boolean; error?: string } {
  const apiCheck = validateCaptureAPI()
  if (!apiCheck.available) {
    return apiCheck
  }

  if (!window.CaptureAPI || !(method in window.CaptureAPI) || typeof (window.CaptureAPI as any)[method] !== 'function') {
    return {
      available: false,
      error: `${method} method is not available`,
    }
  }

  return { available: true }
}

