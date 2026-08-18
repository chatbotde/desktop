type CaptureArea = { x: number; y: number; width: number; height: number }

export function triggerRectangleAreaRecording(options: {
  onAreaSelected: (area: CaptureArea) => void | Promise<void>
  onComplete?: () => void
}): void {
  window.dispatchEvent(
    new CustomEvent('show-rectangle-screenshot', {
      detail: {
        onCapture: async (area: CaptureArea) => {
          try {
            await options.onAreaSelected(area)
          } catch (err) {
            console.error('Area video recording failed:', err)
          } finally {
            options.onComplete?.()
          }
        },
      },
    })
  )
}
