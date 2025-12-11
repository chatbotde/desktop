/**
 * Area Screenshot Overlay Component
 * Provides freehand drawing to select area for screenshot
 */

import { useEffect, useRef, useState, useCallback } from 'react'

interface AreaScreenshotOverlayProps {
  onCapture: (area: { x: number; y: number; width: number; height: number; path?: Array<{ x: number; y: number }> }) => void
  onCancel: () => void
}

export function AreaScreenshotOverlay({ onCapture, onCancel }: AreaScreenshotOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const pathPointsRef = useRef<Array<{ x: number; y: number }>>([])
  const minPathLength = 20

  // Disable clickthrough when overlay is active
  useEffect(() => {
    const api = window.interfaceAPI
    const setIgnore = api?.setIgnoreMouseEvents

    if (setIgnore) {
      // Disable clickthrough (window captures clicks)
      console.log('[AreaScreenshotOverlay] Disabling clickthrough for area selection')
      setIgnore(false)

      return () => {
        // Re-enable clickthrough when overlay is closed
        console.log('[AreaScreenshotOverlay] Re-enabling clickthrough')
        setIgnore(true, { forward: true })
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      isDrawingRef.current = true
      pathPointsRef.current = [{ x: e.clientX, y: e.clientY }]

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)'
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(59, 130, 246, 0.8)'

      ctx.beginPath()
      ctx.moveTo(e.clientX, e.clientY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const x = e.clientX
      const y = e.clientY

      const lastPoint = pathPointsRef.current[pathPointsRef.current.length - 1]
      if (lastPoint) {
        const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2))
        if (distance < 2) return
      }

      pathPointsRef.current.push({ x, y })

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()

      if (pathPointsRef.current.length > 0) {
        const first = pathPointsRef.current[0]
        ctx.moveTo(first.x, first.y)

        for (let i = 1; i < pathPointsRef.current.length; i++) {
          ctx.lineTo(pathPointsRef.current[i].x, pathPointsRef.current[i].y)
        }

        ctx.stroke()
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()
      isDrawingRef.current = false

      if (pathPointsRef.current.length > 0) {
        const firstPoint = pathPointsRef.current[0]
        ctx.lineTo(firstPoint.x, firstPoint.y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      if (pathPointsRef.current.length < minPathLength) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        pathPointsRef.current = []
        return
      }

      const xs = pathPointsRef.current.map(p => p.x)
      const ys = pathPointsRef.current.map(p => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const selectionArea = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        path: pathPointsRef.current
      }

      onCapture(selectionArea)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isDrawingRef.current) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          pathPointsRef.current = []
          isDrawingRef.current = false
        } else {
          onCancel()
        }
      }
    }

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Attach mouse events to the overlay div, not the canvas
    overlay.addEventListener('mousedown', handleMouseDown)
    overlay.addEventListener('mousemove', handleMouseMove)
    overlay.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      overlay.removeEventListener('mousedown', handleMouseDown)
      overlay.removeEventListener('mousemove', handleMouseMove)
      overlay.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [onCapture, onCancel])

  // Paper airplane cursor SVG
  const cursorSvg = `<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" viewBox="-76.32 -76.32 661.44 661.44">
    <g>
      <polygon style="fill:#61C2AB;" points="491.2,35 8.8,285.4 152.4,339"/>
      <path style="fill:#4BB19B;" d="M155.2,342.2l47.6,137.2l68.4-99.2l-48.4-20.4l0,0L494,36.6L155.2,342.2L155.2,342.2z"/>
      <path style="fill:#61C2AB;" d="M423.6,441l77.2-408L228.4,359.4L423.6,441z M458,123.4c0.4-1.2,1.2-1.6,2.4-1.6c1.2,0.4,1.6,1.2,1.6,2.4l-5.6,30.4c0,0.8-1.2,1.6-2,1.6H454c-1.2-0.4-1.6-1.2-1.6-2.4L458,123.4z M448.8,182.2c1.2,0.4,1.6,1.2,1.6,2.4l-42.8,226.8c0,0.8-1.2,1.6-2,1.6h-0.4c-1.2-0.4-1.6-1.2-1.6-2.4l42.8-226.8C446.8,182.6,447.6,182.2,448.8,182.2z"/>
    </g>
  </svg>`
  const cursorDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(cursorSvg)

  return (
    <div
      ref={overlayRef}
      data-no-clickthrough
      className="fixed inset-0 z-[999999] bg-black/30 backdrop-blur-sm"
      style={{ cursor: `url('${cursorDataUrl}') 41 8, crosshair` }}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[999998]"
      />
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1000001] bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 text-white text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Draw any shape</span> to select area • Release to capture • Press <kbd className="bg-white/20 px-1.5 py-0.5 rounded font-mono">ESC</kbd> to cancel
        </div>
      </div>
    </div>
  )
}

