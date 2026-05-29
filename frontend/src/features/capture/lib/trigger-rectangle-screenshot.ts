type CaptureArea = { x: number; y: number; width: number; height: number }

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function triggerRectangleScreenshot(options?: {
  onComplete?: () => void
  append?: boolean
}): void {
  window.dispatchEvent(
    new CustomEvent('show-rectangle-screenshot', {
      detail: {
        onCapture: async (area: CaptureArea) => {
          try {
            if (!window.CaptureAPI) {
              console.error('CaptureAPI is not available')
              return
            }
            const result = await (window.CaptureAPI as any).takeAreaScreenshot(area)
            if (result.success && result.screenshot) {
              const blob = dataUrlToBlob(result.screenshot.data)
              const file = new File([blob], result.screenshot.name, { type: result.screenshot.type })
              const centerX = area.x + area.width / 2
              const centerY = area.y + area.height / 2
              window.dispatchEvent(
                new CustomEvent('screenshot-selection-captured', {
                  detail: {
                    file,
                    position: { x: centerX, y: centerY },
                    append: options?.append ?? false,
                  },
                })
              )
            } else {
              console.error('Rectangle screenshot failed:', result.error)
            }
          } catch (err) {
            console.error('Error taking rectangle screenshot:', err)
          } finally {
            options?.onComplete?.()
          }
        },
      },
    })
  )
}
